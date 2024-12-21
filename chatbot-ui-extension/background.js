// Store session context
let sessionContext = {};

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
1. First describe what you see
2. Identify clickable elements and their coordinates
3. Suggest possible actions based on the task

Always execute one command at a time and wait for the result before proceeding.
Describe what you're doing at each step.`;

// Update handleTaskLoop function
async function handleTaskLoop(initialMessage, settings = {}) {
    const messages = [];
    let loopCount = 0;
    const MAX_LOOPS = 5;

    try {
        let currentMessage = initialMessage;
        messages.push({
            role: 'system',
            content: SYSTEM_PROMPT
        });

        while (loopCount < MAX_LOOPS) {
            console.log(`Task loop ${loopCount + 1} starting...`);
            
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
                })
            });

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

            messages.push({
                role: 'assistant',
                content: responseText
            });

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
                continue; // Continue the main loop to process the new content
            }

            // Check if task is complete
            if (responseText.toLowerCase().includes('task complete') || 
                responseText.toLowerCase().includes('finished') ||
                responseText.toLowerCase().includes('done')) {
                return responseText;
            }

            loopCount++;
            if (loopCount >= MAX_LOOPS) {
                return `Task loop limit reached (${MAX_LOOPS} iterations). Current status: ${responseText}`;
            }

            // If no commands were executed, use the response as the next message
            currentMessage = responseText;
        }

        return 'Task completed.';
    } catch (error) {
        console.error('Task loop error:', error);
        throw error;
    }
}

// Update the message handler to use the task loop for complex tasks
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'SEND_MESSAGE') {
        // Check if this is a complex task that needs the loop
        const needsLoop = request.message.toLowerCase().includes('search') || 
                         request.message.toLowerCase().includes('find') ||
                         request.message.toLowerCase().includes('research');

        const handler = needsLoop ? handleTaskLoop : handleMessage;
        
        handler(request.message, request.settings)
            .then(response => sendResponse({ reply: response }))
            .catch(error => {
                console.error('Message handling error:', error);
                sendResponse({ error: error.message });
            });
        return true;
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

// Handle the message by sending it to your chat app
async function handleMessage(message, settings = {}) {
    try {
        console.log('Processing message:', message);
        
        // Take screenshot if needed for context
        let screenshot = null;
        if (message.toLowerCase().includes('click') || 
            message.toLowerCase().includes('find') || 
            message.toLowerCase().includes('look') ||
            message.toLowerCase().includes('where')) {
            try {
                screenshot = await takeScreenshot();
                console.log('Screenshot taken for context');
            } catch (error) {
                console.error('Screenshot error:', error);
            }
        }

        const defaultSettings = {
            model: 'openai/gpt-3.5-turbo',
            temperature: 0.7,
            stream: false,
            systemPrompt: SYSTEM_PROMPT
        };

        const finalSettings = { ...defaultSettings, ...settings };
        
        // Prepare messages with screenshot if available
        const messages = [
            {
                role: 'system',
                content: finalSettings.systemPrompt
            },
            {
                role: 'user',
                content: screenshot ? [
                    { type: 'text', text: message },
                    { type: 'image_url', image_url: screenshot }
                ] : message
            }
        ];

        console.log('Sending request to API:', {
            model: finalSettings.model,
            messages: messages
        });

        const response = await fetch('http://localhost:3000/api/chat/public', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Extension-Version': '1.0',
                'X-Extension-ID': chrome.runtime.id
            },
            body: JSON.stringify({
                chatSettings: {
                    model: finalSettings.model,
                    temperature: finalSettings.temperature,
                    stream: false
                },
                messages: messages,
                provider: 'openrouter'
            })
        });

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

        // Extract the message content
        const messageContent = responseData.message?.content || responseData.content || responseData;
        const responseText = typeof messageContent === 'string' ? messageContent : JSON.stringify(messageContent);

        // Execute any commands in the response
        if (responseText.includes('EXECUTE:')) {
            const commands = responseText.split('EXECUTE:').slice(1);
            for (const commandText of commands) {
                try {
                    const command = JSON.parse(commandText.split('\n')[0]);
                    console.log('Executing command:', command);
                    const result = await executeAction(command);
                    console.log('Command result:', result);

                    // If the command generated a screenshot, include it in the next message
                    if (result?.screenshot) {
                        messages.push({
                            role: 'assistant',
                            content: responseText
                        });
                        messages.push({
                            role: 'user',
                            content: [
                                { type: 'text', text: 'Here is the screenshot you requested. What do you see?' },
                                { type: 'image_url', image_url: result.screenshot }
                            ]
                        });
                        
                        // Get AI's analysis of the screenshot
                        const analysisResponse = await fetch('http://localhost:3000/api/chat/public', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Extension-Version': '1.0',
                                'X-Extension-ID': chrome.runtime.id
                            },
                            body: JSON.stringify({
                                chatSettings: finalSettings,
                                messages: messages,
                                provider: 'openrouter'
                            })
                        });

                        if (analysisResponse.ok) {
                            const analysisData = await analysisResponse.json();
                            return analysisData.message?.content || 'Screenshot taken and analyzed.';
                        }
                    }
                } catch (error) {
                    console.error('Command execution error:', error);
                }
            }
        }

        return responseText;

    } catch (error) {
        console.error('Message handling error:', error);
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
