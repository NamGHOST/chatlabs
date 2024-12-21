// Store session context
let sessionContext = {};

// Add task management
let currentTask = null;

// Update the system prompt and agent capabilities
const SYSTEM_PROMPT = `You are an AI assistant with computer control capabilities on Windows. Current date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.

Available Actions:
1. CLICK: Click on screen coordinates
   EXECUTE:{"type": "click", "x": number, "y": number}

2. SEARCH: Search on web platforms
   EXECUTE:{"type": "search", "engine": "perplexity|google", "query": "search query"}

3. EXTRACT: Extract content from current page
   EXECUTE:{"type": "extract"}

4. SCREENSHOT: Take screenshot of current page
   EXECUTE:{"type": "screenshot"}

5. NAVIGATE: Navigate to URL
   EXECUTE:{"type": "navigate", "url": "url"}

When analyzing a screenshot:
1. First describe what you see.
2. Identify clickable elements and their coordinates.
3. Suggest possible actions based on the task.

Always execute one command at a time and wait for the result before proceeding.
Describe what you're doing at each step.

If you have no further actions to execute, kindly indicate that the task is complete.`;

// Define the handler function
async function handler(initialMessage, settings = {}, signal) {
    const messages = [];
    let loopCount = 0;
    const MAX_LOOPS = 5;

    // Add the system prompt to messages
    messages.push({
        role: 'system',
        content: SYSTEM_PROMPT
    });

    try {
        let currentMessage = initialMessage;

        while (loopCount < MAX_LOOPS && !signal.aborted) {
            console.log(`Task loop ${loopCount + 1} starting...`);

            // Add only user-generated messages
            messages.push({
                role: 'user',
                content: currentMessage
            });

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
                    messages: messages,
                    provider: 'openrouter'
                }),
                signal // Pass the abort signal to fetch
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
            messages.push({
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
                        
                        // Execute the command
                        const result = await executeAction(command);
                        console.log('Command result:', result);

                        // If it was a search command, extract the content
                        if (command.type === 'search') {
                            // Wait for page to load
                            await new Promise(resolve => setTimeout(resolve, 3000));
                            
                            // Extract content
                            const extractResult = await executeAction({ type: 'extract' });
                            if (extractResult?.data) {
                                currentMessage = `I searched for "${command.query}" and found this content:\n\nTitle: ${extractResult.data.title}\n\nContent: ${extractResult.data.content}\n\nPlease analyze this information and suggest next steps.`;
                                break; // Break the command loop to process this content
                            }
                        }
                    } catch (error) {
                        console.error('Command execution error:', error);
                        messages.push({
                            role: 'system',
                            content: `Error executing command: ${error.message}`
                        });
                    }
                }
                // Continue the loop to process new commands
                loopCount++;
                continue;
            }

            // If no commands and no termination keywords, terminate the loop
            console.log('No commands to execute and no termination keywords found. Terminating loop.');
            return responseText;

            // Increment loop counter
            loopCount++;
        }

        return 'Task completed.';
    } catch (error) {
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
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) {
            throw new Error('No active tab found');
        }

        // Request permissions if needed
        const permissions = {
            permissions: ['activeTab', 'scripting'],
            origins: [tab.url]
        };

        const hasPermission = await chrome.permissions.contains(permissions);
        if (!hasPermission) {
            const granted = await chrome.permissions.request(permissions);
            if (!granted) {
                throw new Error('Required permissions not granted');
            }
        }

        switch (action.type) {
            case 'click':
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: (x, y) => {
                        const element = document.elementFromPoint(x, y);
                        if (element) {
                            element.click();
                            return { success: true, element: element.tagName };
                        }
                        return { success: false, error: 'No element found at coordinates' };
                    },
                    args: [action.x, action.y]
                });
                break;

            case 'screenshot':
                const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
                return { success: true, screenshot: dataUrl };

            case 'search':
                const searchUrl = action.engine === 'perplexity' 
                    ? `https://www.perplexity.ai/?q=${encodeURIComponent(action.query)}`
                    : `https://www.google.com/search?q=${encodeURIComponent(action.query)}`;
                
                await chrome.tabs.update(tab.id, { url: searchUrl });
                await new Promise((resolve) => {
                    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                        if (tabId === tab.id && info.status === 'complete') {
                            chrome.tabs.onUpdated.removeListener(listener);
                            setTimeout(resolve, 2000);
                        }
                    });
                });
                break;

            case 'extract':
                await injectContentScript(tab.id);
                const results = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => {
                        const content = document.body.innerText;
                        const links = Array.from(document.querySelectorAll('a')).map(a => ({
                            text: a.innerText.trim(),
                            href: a.href
                        })).filter(link => link.text && link.href);
                        
                        return {
                            title: document.title,
                            url: window.location.href,
                            content: content.substring(0, 5000),
                            links: links.slice(0, 10)
                        };
                    }
                });

                return { success: true, data: results[0].result };

            case 'navigate':
                await chrome.tabs.update(tab.id, { url: action.url });
                await new Promise((resolve) => {
                    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                        if (tabId === tab.id && info.status === 'complete') {
                            chrome.tabs.onUpdated.removeListener(listener);
                            setTimeout(resolve, 2000);
                        }
                    });
                });
                break;

            default:
                throw new Error(`Unknown action type: ${action.type}`);
        }
        
        return { success: true };
    } catch (error) {
        console.error('Action error:', error);
        throw error;
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
