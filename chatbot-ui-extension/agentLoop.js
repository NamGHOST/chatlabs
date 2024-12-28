// Agent loop implementation
export async function agentLoop({ task, onScreenshot, onAction, onThinking, onError, maxSteps = 10, stopSignal }) {
    console.log('[agentLoop.js] agentLoop started with task:', task);
    let stepCount = 0;
    let messages = [];
    let currentState = null;

    // Debug logging
    console.log('Starting agent loop with task:', task);

    // Initial message
    messages.push({
        role: 'user',
        content: task
    });

    try {
        while (stepCount < maxSteps && (!stopSignal || !stopSignal())) {
            stepCount++;
            console.log(`Step ${stepCount}/${maxSteps}`);

            try {
                // Get current state with better error handling and logging
                const screenshot = await onScreenshot();
                console.log('Screenshot result:', {
                    hasScreenshot: !!screenshot,
                    hasPageInfo: !!screenshot?.pageInfo,
                    pageInfo: screenshot?.pageInfo
                });

                if (!screenshot || !screenshot.pageInfo) {
                    throw new Error('Failed to get page state');
                }

                currentState = screenshot.pageInfo;
                console.log('Current state:', {
                    url: currentState.url,
                    type: currentState.type,
                    title: currentState.title,
                    elements: currentState.elements
                });

                // Add screenshot to messages if needed
                if (screenshot.image) {
                    messages.push({
                        role: 'system',
                        content: `Current page state: ${currentState.type} at ${currentState.url}`,
                        image: screenshot.image
                    });
                }

                // Add a delay after screenshot to ensure page is stable
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Determine next action based on current state
                const action = determineNextAction(currentState, task);
                if (!action) {
                    console.log('No more actions needed');
                    return { success: true, message: 'Task completed' };
                }

                // Log the determined action
                console.log('Determined action:', {
                    type: action.type,
                    selector: action.selector,
                    text: action.text,
                    url: action.url
                });

                if (onThinking) {
                    await onThinking(`Executing action: ${action.type} ${action.text || ''}`);
                }

                // Execute action with the provided onAction callback
                const actionResult = await executeAction(action, onAction);
                console.log('Action result:', actionResult);

                if (!actionResult.success) {
                    throw new Error(actionResult.error || 'Action failed');
                }

                // Add action result to messages
                messages.push({
                    role: 'system',
                    content: `Action completed: ${action.type}`
                });

                // Wait for page to settle after action
                await new Promise(resolve => setTimeout(resolve, 2000));

            } catch (error) {
                console.error(`Step ${stepCount} error:`, error);
                
                // Format error message for better debugging
                const errorMessage = {
                    step: stepCount,
                    type: error.name || 'Error',
                    message: error.message || 'Unknown error occurred',
                    details: error.stack,
                    currentState: currentState
                };

                // Add error to messages
                messages.push({
                    role: 'system',
                    content: `Error occurred during step ${stepCount}: ${error.message}`
                });

                // Call error handler if provided
                if (onError) {
                    await onError(errorMessage);
                }

                // Continue execution unless max retries reached
                if (stepCount < maxSteps) {
                    continue;
                }
            }
        }

        return { 
            success: true,
            message: `Completed ${stepCount} steps`,
            messages
        };

    } catch (error) {
        console.error('Agent loop error:', error);
        if (onError) {
            await onError(error);
        }
        return { success: false, error: error.message };
    }
}

// Helper function to determine next action based on page state and task
function determineNextAction(pageInfo, task) {
    console.log('[agentLoop.js] determineNextAction called with pageInfo:', pageInfo, 'and task:', task);
    if (!pageInfo || !task) {
        console.warn('Invalid input to determineNextAction:', { pageInfo, task });
        return null;
    }

    console.log('Determining action for:', { pageInfo, task });
    const taskLower = task.toLowerCase();
    const words = taskLower.split(' ');

    // Handle search tasks
    if (taskLower.includes('search')) {
        // Extract search term, excluding command words
        const searchTerm = words.slice(words.indexOf('search') + 1)
            .filter(word => !['in', 'on', 'at', 'using', 'perplexity', 'google'].includes(word))
            .join(' ');
        
        console.log('Search term:', searchTerm);

        // Check if we're already on a search results page
        const isGoogleSearchComplete = pageInfo.url.includes('google.com/search') && pageInfo.url.includes('q=');
        const isPerplexitySearchComplete = pageInfo.url.includes('perplexity.ai/search') || 
                                         pageInfo.url.includes('?q=') || 
                                         pageInfo.title.toLowerCase().includes(searchTerm.toLowerCase());

        if (isGoogleSearchComplete || isPerplexitySearchComplete) {
            console.log('Search completed, already on results page');
            return null;  // No more actions needed
        }

        // Handle Perplexity search
        if (taskLower.includes('perplexity')) {
            if (!pageInfo.url.includes('perplexity.ai')) {
                return {
                    type: 'navigate',
                    url: 'https://www.perplexity.ai'
                };
            }

            // If we're already on Perplexity, check if we need to search
            if (!pageInfo.url.includes('/search?q=')) {
                // First try to find and click the search button if needed
                const hasSearchButton = pageInfo.elements?.buttons?.some(btn => 
                    btn.text?.toLowerCase().includes('ask') || 
                    btn.text?.toLowerCase().includes('search')
                );

                if (hasSearchButton) {
                    return {
                        type: 'click',
                        selector: 'button[type="submit"], button:has(svg), [aria-label*="ask" i], [aria-label*="search" i], button.text-white'
                    };
                }

                // If no button found, try typing the search
                return {
                    type: 'type',
                    selector: '[role="textbox"], [class*="TextInput"], textarea, [placeholder*="question"], [placeholder*="ask"]',
                    text: searchTerm + '\n'
                };
            }

            // If we're already on the search results page
            return null;
        }

        // Handle Google search
        if (!taskLower.includes('perplexity')) {
            // Default to Google search
            if (!pageInfo.url.includes('google.com')) {
                return {
                    type: 'navigate',
                    url: 'https://www.google.com'
                };
            }

            // If already on Google, perform search
            if (!pageInfo.url.includes('/search?')) {
                return {
                    type: 'type',
                    selector: 'input[name="q"]',  // Specific Google search input selector
                    text: searchTerm + '\n'  // Add newline to trigger search
                };
            }
        }

        // If we're already searching or have completed the search
        return null;
    }

    // Handle document editing tasks
    if (taskLower.includes('make') || taskLower.includes('write') || taskLower.includes('create')) {
        // For Google Docs
        if (taskLower.includes('doc') || pageInfo.url.includes('docs.google.com')) {
            if (!pageInfo.url.includes('docs.google.com')) {
                return {
                    type: 'navigate',
                    url: 'https://docs.google.com/document/create'
                };
            }

            return {
                type: 'type',
                selector: '.docs-textedit-textarea, [contenteditable="true"], [role="textbox"], [aria-label="Document content"]',
                text: task
            };
        }

        // For Notion
        if (taskLower.includes('notion') || pageInfo.url.includes('notion.so')) {
            return {
                type: 'type',
                selector: '.notion-page-content [contenteditable="true"], .notion-frame [contenteditable="true"]',
                text: task
            };
        }

        // Default to typing in any editable area
        return {
            type: 'type',
            selector: '[contenteditable="true"], textarea, .ProseMirror, [role="textbox"]',
            text: task
        };
    }

    // Handle navigation tasks
    if (taskLower.includes('go to') || taskLower.includes('open')) {
        const url = words[words.length - 1];
        if (pageInfo.url.includes(url)) {
            return null;  // Already on the page
        }
        return {
            type: 'navigate',
            url: url.startsWith('http') ? url : `https://${url}`
        };
    }

    // If no action is determined or task is completed
    console.log('No more actions needed');
    return null;
}

// Update action handling
async function executeAction(action, onAction) {
    if (!action || !action.type) {
        throw new Error('Invalid action format');
    }

    if (!onAction) {
        throw new Error('onAction callback is required');
    }

    // Execute action with retry logic
    const maxRetries = 3;
    let lastError = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            console.log(`Attempt ${attempt + 1}: Executing action:`, action);
            const result = await onAction(action);
            console.log('Action result:', result);
            
            if (result && result.success) {
                return result;
            }
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            lastError = error;
            console.warn(`Action attempt ${attempt + 1} failed:`, error);
            if (attempt < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            }
        }
    }

    throw new Error(`Action failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
} 
