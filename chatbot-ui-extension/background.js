// Store session context
let sessionContext = {
    messages: [],
    searchContext: {
        lastSearchQuery: '',
        searchResults: [],
        extractedContent: []
    },
    currentTask: null
};

// Initialize or reset session context
function initializeSessionContext() {
    sessionContext = {
        messages: [],
        searchContext: {
            lastSearchQuery: '',
            searchResults: [],
            extractedContent: []
        },
        currentTask: null
    };
}

// Add task management
let currentTask = null;

// Update the system prompt and agent capabilities
const SYSTEM_PROMPT = `You are an AI research assistant that helps users gather and organize information. Current date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.

Available Actions:
1. SEARCH: Search on web platforms
   EXECUTE:{"type": "search", "engine": "perplexity|google", "query": "search query"}

2. EXTRACT: Extract content from current page
   EXECUTE:{"type": "extract"}

3. COPY_TO_DOC: Copy content to document
   EXECUTE:{"type": "copyToDoc", "content": "text to copy", "format": "markdown|text", "section": "optional section name"}

4. SWITCH_TAB: Switch to a tab with specific URL pattern
   EXECUTE:{"type": "switchTab", "urlPattern": "domain-pattern"}

For research tasks:
1. I will search relevant information using both Perplexity and Google
2. For each useful page:
   - Extract key information
   - Copy important content to the document
3. Organize information in a structured way
4. Provide a summary at the end

I will work with existing tabs and maintain a professional writing style.
I will execute one action at a time and wait for the result before proceeding.`;

// Define the handler function
async function handler(initialMessage, settings = {}, signal) {
    const MAX_LOOPS = 5;
    let loopCount = 0;

    try {
        // Ensure sessionContext is properly initialized
        if (!sessionContext || !Array.isArray(sessionContext.messages)) {
            initializeSessionContext();
        }

        // If this is a new task, add the system prompt
        if (sessionContext.messages.length === 0) {
            sessionContext.messages.push({
                role: 'system',
                content: SYSTEM_PROMPT
            });
        }

        // Add the new message to history
        if (initialMessage) {
            sessionContext.messages.push({
                role: 'user',
                content: initialMessage
            });
        }

        let currentMessage = initialMessage;

        // Update side panel with initial task
        await updateSidePanel({
            type: 'task_start',
            message: initialMessage || 'Starting new task...'
        });

        while (loopCount < MAX_LOOPS && !signal.aborted) {
            if (!currentMessage) {
                console.warn('No current message to process');
                break;
            }

            console.log(`Task loop ${loopCount + 1} starting...`);

            // Update side panel with current status
            await updateSidePanel({
                type: 'status',
                message: `Processing step ${loopCount + 1}...`
            });

            // Ensure messages array is valid before making API call
            if (!Array.isArray(sessionContext.messages)) {
                console.error('Invalid messages array');
                throw new Error('Invalid session context');
            }

            // Get AI response
            const response = await fetch('http://localhost:3000/api/chat/public', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Extension-Version': '1.0',
                    'X-Extension-ID': chrome.runtime.id
                },
                body: JSON.stringify({
                    chatSettings: settings,
                    messages: sessionContext.messages,
                    provider: 'openrouter'
                }),
                signal
            });

            if (signal.aborted) {
                throw new Error('Task cancelled');
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API error:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText
                });
                throw new Error(`API error: ${response.status} - ${errorText}`);
            }

            const responseData = await response.json();
            console.log('API response:', responseData);

            const responseText = responseData.message?.content || 'No response generated';
            console.log('Response text:', responseText);

            // Add assistant's response to messages
            sessionContext.messages.push({
                role: 'assistant',
                content: responseText
            });

            // Check for termination conditions
            if (responseText.toLowerCase().includes('task complete') || 
                responseText.toLowerCase().includes('finished') ||
                responseText.toLowerCase().includes('done')) {
                return responseText;
            }

            // Execute commands if present
            if (responseText.includes('EXECUTE:')) {
                const commands = responseText.split('EXECUTE:').slice(1);
                for (const commandText of commands) {
                    try {
                        const command = JSON.parse(commandText.split('\n')[0]);
                        console.log('Executing command:', command);
                        
                        // Update side panel with current action
                        await updateSidePanel({
                            type: 'action',
                            action: command
                        });

                        // Execute the command
                        const result = await executeAction(command);
                        console.log('Command result:', result);

                        // Update side panel with result
                        await updateSidePanel({
                            type: 'result',
                            action: command,
                            result: result
                        });

                        // Handle search results
                        if (command.type === 'search' && result?.searchResults) {
                            sessionContext.searchContext.lastSearchQuery = command.query;
                            sessionContext.searchContext.searchResults.push({
                                query: command.query,
                                engine: command.engine,
                                results: result.searchResults
                            });

                            // Format the results for the AI
                            const formattedResults = result.searchResults.summary || 
                                `Search results for "${command.query}":\n${JSON.stringify(result.searchResults, null, 2)}`;
                            
                            // Update side panel with formatted results
                            await updateSidePanel({
                                type: 'search_results',
                                query: command.query,
                                results: formattedResults
                            });

                            currentMessage = `I searched for "${command.query}" and found:\n\n${formattedResults}\n\nPlease analyze these results and suggest next steps.`;
                            break;
                        }

                        // Handle extracted content
                        if (command.type === 'extract' && result?.data) {
                            sessionContext.searchContext.extractedContent.push({
                                url: result.data.url,
                                content: result.data.summary || result.data.content
                            });

                            // Update side panel with extracted content
                            await updateSidePanel({
                                type: 'extracted_content',
                                url: result.data.url,
                                content: result.data.summary || result.data.content
                            });

                            currentMessage = `I extracted the following content:\n\n${result.data.summary || result.data.content}\n\nPlease analyze this information and suggest next steps.`;
                            break;
                        }
                    } catch (error) {
                        console.error('Command execution error:', error);
                        // Update side panel with error
                        await updateSidePanel({
                            type: 'error',
                            error: error.message
                        });
                        sessionContext.messages.push({
                            role: 'system',
                            content: `Error executing command: ${error.message}`
                        });
                    }
                }
                loopCount++;
                continue;
            }

            // Update side panel with completion
            await updateSidePanel({
                type: 'complete',
                message: responseText
            });

            return responseText;
        }

        return 'Task completed.';
    } catch (error) {
        // Update side panel with error
        await updateSidePanel({
            type: 'error',
            error: error.message
        });
        
        if (error.message === 'Task cancelled') {
            return 'Task cancelled by user.';
        }
        console.error('Task loop error:', error);
        throw error;
    }
}

// Execute automation action
async function executeAction(action) {
    try {
        // Get all tabs first
        const tabs = await chrome.tabs.query({});
        let targetTab = null;

        if (action.type === 'switchTab') {
            try {
                // First try to find an existing tab
                const tabs = await chrome.tabs.query({});
                let targetTab = tabs.find(tab => tab.url && tab.url.includes(action.urlPattern));
                
                if (targetTab) {
                    // If tab exists, switch to it
                    await chrome.tabs.update(targetTab.id, { active: true });
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for tab to be active
                } else {
                    // If tab doesn't exist, create it
                    const url = action.urlPattern.startsWith('http') ? 
                        action.urlPattern : 
                        `https://${action.urlPattern}`;
                    targetTab = await chrome.tabs.create({ url, active: true });
                    // Wait for the new tab to load
                    await new Promise((resolve) => {
                        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                            if (tabId === targetTab.id && info.status === 'complete') {
                                chrome.tabs.onUpdated.removeListener(listener);
                                setTimeout(resolve, 1000); // Additional wait for dynamic content
                            }
                        });
                    });
                }
                return { success: true, message: `Switched to tab with ${action.urlPattern}` };
            } catch (error) {
                console.error('Error in switchTab:', error);
                return { success: false, error: error.message };
            }
        }

        if (action.type === 'search') {
            try {
                // Find existing search tab (Google or Perplexity)
                const searchDomain = action.engine === 'perplexity' ? 'perplexity.ai' : 'google.com';
                let targetTab = tabs.find(tab => tab.url && tab.url.includes(searchDomain));
                
                // Construct search URL
                const searchUrl = action.engine === 'perplexity' 
                    ? `https://www.perplexity.ai/?q=${encodeURIComponent(action.query)}`
                    : `https://www.google.com/search?q=${encodeURIComponent(action.query)}`;

                if (targetTab) {
                    // Update existing tab
                    await chrome.tabs.update(targetTab.id, { 
                        active: true,
                        url: searchUrl 
                    });
                } else {
                    // Create new tab
                    targetTab = await chrome.tabs.create({ 
                        url: searchUrl,
                        active: true 
                    });
                }

                // Wait for the page to load and render
                await new Promise((resolve) => {
                    const checkContent = async () => {
                        try {
                            const result = await chrome.scripting.executeScript({
                                target: { tabId: targetTab.id },
                                func: () => {
                                    if (window.location.href.includes('google.com')) {
                                        return document.querySelectorAll('#search .g').length > 0;
                                    } else if (window.location.href.includes('perplexity.ai')) {
                                        return document.querySelector('.prose') !== null;
                                    }
                                    return false;
                                }
                            });

                            if (result[0].result) {
                                setTimeout(resolve, 2000); // Additional wait for dynamic content
                            } else {
                                setTimeout(checkContent, 500);
                            }
                        } catch (error) {
                            setTimeout(checkContent, 500);
                        }
                    };

                    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                        if (tabId === targetTab.id && info.status === 'complete') {
                            chrome.tabs.onUpdated.removeListener(listener);
                            checkContent();
                        }
                    });
                });

                // After loading, extract the content immediately
                const extractResult = await executeAction({ type: 'extract' });
                return {
                    success: true,
                    message: `Searched for ${action.query}`,
                    searchResults: extractResult?.data?.searchResults
                };
            } catch (error) {
                console.error('Error in search:', error);
                return { success: false, error: error.message };
            }
        }

        // For other actions, use the current active tab
        const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        targetTab = currentTab;

        if (!targetTab) {
            throw new Error('No active tab found');
        }

        // Request permissions if needed
        const permissions = {
            permissions: ['activeTab', 'scripting'],
            origins: [targetTab.url]
        };

        const hasPermission = await chrome.permissions.contains(permissions);
        if (!hasPermission) {
            const granted = await chrome.permissions.request(permissions);
            if (!granted) {
                throw new Error('Required permissions not granted');
            }
        }

        // Forward all other actions to content script
        console.log('[executeAction] Forwarding to content script:', action);
        await injectContentScript(targetTab.id);
        
        const response = await chrome.scripting.executeScript({
            target: { tabId: targetTab.id },
            func: (actionObject) => {
                return window.__universalAction?.(actionObject) ?? {
                    success: false,
                    error: 'No universalAction function found on window.'
                };
            },
            args: [action]
        });

        return { success: true, data: response[0].result };
    } catch (error) {
        console.error('Action execution error:', error);
        return { success: false, error: error.message };
    }
}

// Handle message from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message in background:', request);
    if (request.type === 'SEND_MESSAGE') {
        // Initialize AbortController for the current task
        currentTask = new AbortController();
        const { signal } = currentTask;

        // Handler function to process the message
        handler(request.message, request.settings, signal)
            .then(response => {
                if (currentTask && !currentTask.signal.aborted) {
                    console.log('Sending response back to popup:', response);
                    sendResponse({ reply: response });
                } else {
                    console.warn('Current task was aborted. Not sending response.');
                }
            })
            .catch(error => {
                if (currentTask && !currentTask.signal.aborted) {
                    console.error('Error in handler:', error);
                    sendResponse({ error: error.message });
                } else {
                    console.warn('Current task was aborted. Not sending error response.');
                }
            })
            .finally(() => {
                // Clean up after task completion
                console.log('Task completed. Cleaning up currentTask.');
                currentTask = null;
            });
        
        return true; // Keeps the message channel open for async response
    } else if (request.type === 'TAKE_SCREENSHOT') {
        takeScreenshot().then(dataUrl => sendResponse({ screenshot: dataUrl }))
            .catch(error => {
                console.error('Screenshot error:', error);
                sendResponse({ error: error.message });
            });
        return true;
    } else if (request.type === 'EXECUTE_ACTION') {
        executeAction(request.action).then(result => sendResponse({ result }))
            .catch(error => {
                console.error('Action error:', error);
                sendResponse({ error: error.message });
            });
        return true;
    } else if (request.type === 'EXTRACT_CONTENT') {
        extractPageContent().then(content => sendResponse({ content }))
            .catch(error => {
                console.error('Content extraction error:', error);
                sendResponse({ error: error.message });
            });
        return true;
    }
});

// Take screenshot of current tab
async function takeScreenshot() {
    try {
        // First check if we have an active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) {
            throw new Error('No active tab found');
        }

        // Request permissions if needed
        const permissions = {
            permissions: ['activeTab'],
            origins: [tab.url]
        };

        const hasPermission = await chrome.permissions.contains(permissions);
        if (!hasPermission) {
            const granted = await chrome.permissions.request(permissions);
            if (!granted) {
                throw new Error('Screenshot permission not granted');
            }
        }

        const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
        return dataUrl;
    } catch (error) {
        console.error('Screenshot error:', error);
        throw error;
    }
}

// Inject content script
async function injectContentScript(tabId) {
    try {
        // Check if content script is already injected
        try {
            await chrome.tabs.sendMessage(tabId, { type: 'PING' });
            console.log('Content script already injected');
            return;
        } catch (error) {
            console.log('Injecting content script...');
        }

        await chrome.scripting.executeScript({
            target: { tabId },
            files: ['content.js']
        });

        // Wait a bit for the script to initialize
        await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
        console.error('Script injection error:', error);
        throw error;
    }
}

// Extract content from current page
async function extractPageContent() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) {
            throw new Error('No active tab found');
        }

        // Make sure we have the right permissions
        const hasPermission = await chrome.permissions.contains({
            permissions: ['activeTab', 'scripting'],
            origins: [tab.url]
        });

        if (!hasPermission) {
            throw new Error('Content extraction permission not granted');
        }

        // First try to inject our content script
        await injectContentScript(tab.id);

        // Then execute the content extraction
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                try {
                    // Get main content
                    const content = document.body.innerText || '';
                    
                    // Get all links
                    const links = Array.from(document.querySelectorAll('a')).map(a => ({
                        text: a.innerText || '',
                        href: a.href || ''
                    }));

                    // Get meta information
                    const title = document.title || '';
                    const description = document.querySelector('meta[name="description"]')?.content || '';

                    return {
                        success: true,
                        data: {
                            title,
                            description,
                            content,
                            links
                        }
                    };
                } catch (error) {
                    return {
                        success: false,
                        error: error.message
                    };
                }
            }
        });

        if (!results || !results[0]) {
            throw new Error('Failed to execute content extraction script');
        }

        const result = results[0].result;
        if (!result.success) {
            throw new Error(result.error || 'Content extraction failed');
        }

        return result.data;
    } catch (error) {
        console.error('Content extraction error:', error);
        throw error;
    }
}

// Initialize session context with available models
chrome.runtime.onInstalled.addListener(() => {
    sessionContext = {
        models: [
            'openai/gpt-4o-mini',
            'openai/gpt-4o-2024-08-06',
            'anthropic/claude-3-haiku',
            'meta-llama/llama-3.1-405b-instruct',
            'google/gemini-pro-1.5'
        ],
        defaultModel: 'openai/gpt-4o-mini',
        settings: {
            temperature: 0.7,
            stream: false // Changed to false to handle responses better
        }
    };
});

const tasks = new Map(); // Map to track multiple tasks

// Helper to find or create a tab with given URL
async function ensureTab(url) {
    // If no URL specified, just return the currently active tab
    if (!url) {
        const data = await chrome.tabs.query({ active: true, currentWindow: true });
        return data.length ? [data[0]] : [];
    }
    
    // Check if any existing tab has that domain
    const domain = new URL(url).hostname.replace('www.', '');
    const tabs = await chrome.tabs.query({});
    let candidateTab = tabs.find(t => t.url && t.url.includes(domain));
    if (!candidateTab) {
        candidateTab = await chrome.tabs.create({ url });
        // Wait for load
        await new Promise((resolve) => {
            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                if (tabId === candidateTab.id && info.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    // Give page a little time to settle
                    setTimeout(resolve, 1500);
                }
            });
        });
    } else {
        // Switch to the found tab
        await chrome.tabs.update(candidateTab.id, { active: true });
        // Wait in case it hasn’t fully loaded
        await new Promise(resolve => setTimeout(resolve, 1500));
    }
    return [candidateTab];
}

// Function to update the side panel
async function updateSidePanel(update) {
    try {
        // Send update to all side panel instances
        chrome.runtime.sendMessage({
            type: 'SIDEBAR_UPDATE',
            data: update
        });
    } catch (error) {
        console.error('Error updating side panel:', error);
    }
}

// Listen for side panel toggle command
chrome.commands.onCommand.addListener((command) => {
    if (command === 'toggle_sidebar') {
        chrome.sidePanel.toggle();
    }
});
