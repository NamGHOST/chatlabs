import AGENT_THINKING from './agentThinking.js';
import { agentLoop } from './agentLoop.js';

// Now you can use AGENT_THINKING in your background script
console.log('[background.js] agentThinking loaded:', AGENT_THINKING);

// Initialize the service worker
self.oninstall = (event) => {
    console.log('Service Worker installed');
};

self.onactivate = (event) => {
    console.log('Service Worker activated');
};

// Constants
const MAX_STEPS = 10;
const SCREENSHOT_QUALITY = 0.8;
const CONFIG = {
    API_URL: 'http://localhost:3000/api/claude/computer-use',
    MODEL: 'anthropic/claude-3.5-sonnet'
};

// Add this helper function for tab navigation
async function navigateTab(tabId, url) {
    try {
        // Update tab URL
        await chrome.tabs.update(tabId, { url });
        
        // Wait for navigation to complete
        return new Promise((resolve) => {
            chrome.tabs.onUpdated.addListener(function listener(updatedTabId, info) {
                if (updatedTabId === tabId && info.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    resolve();
                }
            });
        });
    } catch (error) {
        console.error('Navigation error:', error);
        throw error;
    }
}

// Update the takeScreenshot function to use proper error handling
async function takeScreenshot() {
    const maxRetries = 3;
    const retryDelay = 1000;
    let lastError = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab?.id) {
                throw new Error('No active tab found');
            }

            // Check if we're trying to capture a restricted URL
            if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
                console.log('Restricted URL detected, navigating to Google...');
                await navigateTab(tab.id, 'https://www.google.com');
                // Wait for page to settle
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            // Ensure the tab is fully loaded
            if (tab.status !== 'complete') {
                await new Promise(resolve => {
                    const listener = (tabId, info) => {
                        if (tabId === tab.id && info.status === 'complete') {
                            chrome.tabs.onUpdated.removeListener(listener);
                            resolve();
                        }
                    };
                    chrome.tabs.onUpdated.addListener(listener);
                    // Timeout after 5 seconds
                    setTimeout(() => {
                        chrome.tabs.onUpdated.removeListener(listener);
                        resolve();
                    }, 5000);
                });
            }

            // Take the screenshot
            const screenshot = await chrome.tabs.captureVisibleTab(null, {
                format: 'jpeg',
                quality: SCREENSHOT_QUALITY * 100
            });
            
            if (!screenshot) {
                throw new Error('Screenshot capture returned null');
            }

            console.log('📸 Screenshot captured successfully');
            await updateSidebarScreenshot(screenshot);
            return screenshot;

        } catch (error) {
            lastError = error;
            console.warn(`Screenshot attempt ${attempt + 1} failed:`, error);
            
            if (attempt < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                continue;
            }
        }
    }

    throw new Error(`Failed to capture screenshot after ${maxRetries} attempts: ${lastError?.message}`);
}

// Add getPageType function
function getPageType(url) {
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname.includes('google.com')) return 'google';
        if (urlObj.hostname.includes('perplexity.ai')) return 'perplexity';
        return 'unknown';
    } catch {
        return 'unknown';
    }
}

// Update getCurrentPageInfo to better detect elements
async function getCurrentPageInfo() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) {
            throw new Error('No active tab found');
        }

        console.log('Getting page info for tab:', tab.url);

        if (tab.url.startsWith('chrome://')) {
            console.warn('Skipping getCurrentPageInfo for chrome:// URL:', tab.url);
            return {
                url: tab.url,
                title: tab.title,
                type: 'restricted',
                elements: { searchInputs: [], buttons: [], forms: [] }
            };
        }

        const result = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => {
                // Helper function to get visible elements
                const getVisibleElements = (selector) => {
                    return Array.from(document.querySelectorAll(selector))
                        .filter(el => {
                            const style = window.getComputedStyle(el);
                            return style.display !== 'none' && 
                                   style.visibility !== 'hidden' && 
                                   style.opacity !== '0' &&
                                   el.offsetParent !== null;
                        });
                };

                // Get all interactive elements
                const searchInputs = getVisibleElements('input[type="text"], input[type="search"], textarea, [role="searchbox"], [role="textbox"]')
                    .map(el => ({
                        name: el.name || el.id || '',
                        placeholder: el.placeholder || '',
                        type: el.type || el.getAttribute('role') || ''
                    }));

                const buttons = getVisibleElements('button, input[type="button"], input[type="submit"], [role="button"]')
                    .map(el => ({
                        text: el.textContent || el.value || '',
                        id: el.id || '',
                        type: el.type || el.getAttribute('role') || ''
                    }));

                const forms = getVisibleElements('form')
                    .map(el => ({
                        id: el.id || '',
                        action: el.action || '',
                        method: el.method || ''
                    }));

                return {
                    url: window.location.href,
                    title: document.title,
                    type: new URL(window.location.href).hostname.replace(/^www\./, '').split('.')[0],
                    elements: { searchInputs, buttons, forms }
                };
            }
        });

        if (result && result[0] && result[0].result) {
            const pageInfo = result[0].result;
            console.log('Page info collected:', pageInfo);
            return pageInfo;
        } else {
            console.warn('Could not retrieve page info from content script.');
            return {
                url: tab.url,
                title: tab.title,
                type: 'unknown',
                elements: { searchInputs: [], buttons: [], forms: [] }
            };
        }

    } catch (error) {
        console.error('Error in getCurrentPageInfo:', error);
        return {
            url: 'unknown',
            title: 'unknown',
            type: 'unknown',
            elements: { searchInputs: [], buttons: [], forms: [] }
        };
    }
}

// Add task control state
let taskState = {
    isRunning: false,
    currentStep: 0,
    extractedContent: '',
    lastScreenshot: null,
    stopRequested: false,
    messageHistory: [],
    lastPageState: null
};

// Add function to update message history with visual context
async function updateMessageHistory(role, content, screenshot = null, pageInfo = null) {
    const message = {
        role,
        content,
        timestamp: new Date().toISOString()
    };

    if (screenshot) {
        message.images = [{
            type: "image/jpeg",
            data: screenshot.replace(/^data:image\/[a-z]+;base64,/, "")
        }];
    }

    if (pageInfo) {
        message.pageState = pageInfo;
    }

    taskState.messageHistory.push(message);
    taskState.lastPageState = pageInfo || taskState.lastPageState;

    // Keep only last N messages to prevent memory issues
    const MAX_HISTORY = 10;
    if (taskState.messageHistory.length > MAX_HISTORY) {
        taskState.messageHistory = taskState.messageHistory.slice(-MAX_HISTORY);
    }

    return message;
}

// Add function to analyze visual changes
async function analyzeVisualChanges(beforeScreenshot, afterScreenshot, beforePageInfo, afterPageInfo) {
    const changes = {
        urlChanged: beforePageInfo.url !== afterPageInfo.url,
        typeChanged: beforePageInfo.type !== afterPageInfo.type,
        elementChanges: {
            searchInputs: afterPageInfo.elements?.searchInputs?.length - (beforePageInfo.elements?.searchInputs?.length || 0),
            buttons: afterPageInfo.elements?.buttons?.length - (beforePageInfo.elements?.buttons?.length || 0)
        }
    };

    return {
        changes,
        summary: `Page changes detected:
- URL: ${changes.urlChanged ? 'Changed' : 'Same'} (${afterPageInfo.url})
- Type: ${changes.typeChanged ? 'Changed' : 'Same'} (${afterPageInfo.type})
- Elements: ${JSON.stringify(changes.elementChanges)}`
    };
}

// Add stop task function
async function stopTask() {
    taskState.stopRequested = true;
    taskState.isRunning = false;
    await updateSidebarStatus('Task stopped by user');
}

// Update status update function to be more detailed
async function updateSidebarStatus(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const status = {
        message,
        type,
        step: taskState.currentStep,
        maxSteps: MAX_STEPS,
        timestamp,
        details: {
            currentPage: await getCurrentPageInfo(),
            taskRunning: taskState.isRunning,
            extractedContent: taskState.extractedContent?.slice(0, 200) // First 200 chars only
        }
    };

    await chrome.runtime.sendMessage({
        type: 'STATUS_UPDATE',
        status
    }).catch(console.error);
}

// Update handleComputerUse function
async function handleComputerUse(request, sender, sendResponse) {
    try {
        const result = await agentLoop({
            task: request.query,
            onScreenshot: async () => {
                try {
                    const screenshot = await takeScreenshot();
                    const pageInfo = await chrome.tabs.query({ active: true, currentWindow: true })
                        .then(([tab]) => ({
                            type: getPageType(tab.url),
                            url: tab.url,
                            title: tab.title
                        }));
                    return { 
                        pageInfo,
                        image: screenshot 
                    };
                } catch (error) {
                    console.error('Screenshot error:', error);
                    return null;
                }
            },
            onAction: async (action) => {
                try {
                    // Send action to content script
                    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                    if (!tab?.id) {
                        throw new Error('No active tab found');
                    }

                    const result = await chrome.tabs.sendMessage(tab.id, {
                        type: 'EXECUTE_ACTION',
                        action
                    });

                    return result || { success: false, error: 'No result from content script' };
                } catch (error) {
                    console.error('Action error:', error);
                    return { success: false, error: error.message };
                }
            },
            onThinking: async (thought) => {
                await updateSidebarStatus({
                    type: 'thinking',
                    message: thought
                });
            },
            onError: async (error) => {
                await updateSidebarStatus({
                    type: 'error',
                    message: error.message
                });
            },
            maxSteps: MAX_STEPS,
            stopSignal: () => taskState.stopRequested
        });

        // Handle the result
        if (result.success) {
            await updateSidebarStatus({
                type: 'success',
                message: result.message
            });
            return { success: true };
        } else {
            throw new Error(result.error);
        }

    } catch (error) {
        console.error('Computer use error:', error);
        await updateSidebarStatus({
            type: 'error',
            message: error.message
        });
        return { success: false, error: error.message };
    }
}

// Generic function to execute browser actions
async function executeToolCall(toolCall, tabId) {
    console.log(`🛠️ Executing tool:`, toolCall);
    
    try {
        const args = JSON.parse(toolCall.function.arguments);
        const pageInfo = await getCurrentPageInfo();

        // Handle restricted pages
        if (pageInfo.type === 'restricted') {
            // For restricted pages, try to navigate to the desired URL
            if (args.text && args.text.includes('.')) {
                const url = args.text.startsWith('http') ? args.text : `https://${args.text}`;
                await chrome.tabs.update(tabId, { url });
                
                // Wait for navigation
                await new Promise(resolve => setTimeout(resolve, 2000));
                return {
                    success: true,
                    message: `Navigated to ${url}`
                };
            }
            throw new Error('Cannot interact with this page type');
        }

        // Generic action handler with improved error handling
        const executeAction = async (action, selector, text) => {
            // Ensure all arguments are serializable strings
            const serializedArgs = {
                action: String(action),
                selector: String(selector),
                text: text ? String(text) : ''
            };

            const result = await chrome.scripting.executeScript({
                target: { tabId },
                func: (serializedArgs) => {
                    // Helper to find element with multiple strategies
                    const findElement = (selector) => {
                        // Try direct selector
                        let element = document.querySelector(selector);
                        if (element) return element;

                        // Try common variations
                        const variations = [
                            selector,
                            `[name="${selector}"]`,
                            `[id="${selector}"]`,
                            `[title="${selector}"]`,
                            `[placeholder="${selector}"]`,
                            `input[type="${selector}"]`,
                            `textarea[name="${selector}"]`
                        ];

                        // Try aria labels and roles
                        variations.push(
                            `[aria-label="${selector}"]`,
                            `[role="${selector}"]`
                        );

                        // Try partial matches
                        const partialMatches = [
                            `[id*="${selector}"]`,
                            `[name*="${selector}"]`,
                            `[placeholder*="${selector}"]`
                        ];

                        // Try all variations
                        for (const variant of [...variations, ...partialMatches]) {
                            element = document.querySelector(variant);
                            if (element) return element;
                        }

                        // Try finding by text content
                        const elements = document.querySelectorAll('*');
                        for (const el of elements) {
                            if (el.textContent.toLowerCase().includes(selector.toLowerCase())) {
                                return el;
                            }
                        }

                        return null;
                    };

                    // Find the element with null checks
                    const element = findElement(serializedArgs.selector);
                    if (!element) {
                        return { 
                            success: false, 
                            error: `Element not found: ${serializedArgs.selector}`,
                            attempted: true
                        };
                    }

                    // Perform the action with try-catch
                    try {
                        switch (serializedArgs.action) {
                            case 'type':
                                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                                    element.focus();
                                    element.value = serializedArgs.text || '';
                                    element.dispatchEvent(new Event('input', { bubbles: true }));
                                    
                                    // Handle form submission
                                    const form = element.closest('form');
                                    if (form) {
                                        form.dispatchEvent(new Event('submit', { bubbles: true }));
                                    }
                                    return { success: true, message: `Typed "${serializedArgs.text}" into ${serializedArgs.selector}` };
                                }
                                return { 
                                    success: false, 
                                    error: 'Element is not input or textarea',
                                    attempted: true
                                };

                            case 'click':
                                element.click();
                                return { success: true, message: `Clicked ${serializedArgs.selector}` };

                            case 'press':
                                element.dispatchEvent(new KeyboardEvent('keypress', {
                                    key: serializedArgs.text || 'Enter',
                                    code: serializedArgs.text || 'Enter',
                                    keyCode: 13,
                                    which: 13,
                                    bubbles: true
                                }));
                                return { success: true, message: `Pressed ${serializedArgs.text || 'Enter'} on ${serializedArgs.selector}` };

                            default:
                                return { 
                                    success: false, 
                                    error: `Unknown action: ${serializedArgs.action}`,
                                    attempted: true
                                };
                        }
                    } catch (error) {
                        return { 
                            success: false, 
                            error: `Action failed: ${error.message}`,
                            attempted: true
                        };
                    }
                },
                args: [serializedArgs]
            });

            return result[0].result;
        };

        // Execute with retry logic
        const MAX_RETRIES = 3;
        const RETRY_DELAY = 1000;

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            if (attempt > 0) {
                console.log(`Retry attempt ${attempt + 1}/${MAX_RETRIES}`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            }

            const result = await executeAction(args.action, args.selector, args.text);
            if (result.success) {
                return result;
            }

            if (result.attempted) {
                throw new Error(result.error);
            }
        }

        throw new Error('Failed to execute action after retries');

    } catch (error) {
        console.error('Tool execution error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Utility functions for sidebar communication
function updateSidebarScreenshot(screenshot) {
    chrome.runtime.sendMessage({
        type: 'SCREENSHOT_UPDATE',
        screenshot: screenshot
    }).catch(console.error);
}

// Add message listener for STOP_TASK
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'STOP_TASK') {
        stopTask()
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
});

// Message listeners
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request);

    if (request.type === 'COMPUTER_USE') {
        handleComputerUse(request, sender, sendResponse)
            .then(sendResponse)
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (request.type === 'STOP_TASK') {
        agentIsActive = false;
        sendResponse({ success: true });
        return true;
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[background.js] onMessage:', request);
    
    if (request.type === "EXECUTE_ANY") {
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (tabs[0]) {
                await chrome.tabs.sendMessage(tabs[0].id, {
                    type: 'EXECUTE_ACTION',
                    action: request.action
                });
                sendResponse({ success: true });
            } else {
                sendResponse({ success: false, error: 'No active tab' });
            }
        });
        return true; // So we can async sendResponse
    }

    if (request.type === "CAPTURE_SCREEN") {
        console.log('[background.js] CAPTURE_SCREEN request');
        chrome.tabs.captureVisibleTab({ format: 'png' }, (dataUrl) => {
            if (chrome.runtime.lastError) {
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
                sendResponse({ success: true, screenshotDataUrl: dataUrl });
            }
        });
        return true;
    }
});

// A variable to hold state if the agent is running
let agentIsActive = false;

// Listen for messages from popup (or content)
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    console.log('[background.js] onMessage:', request);

    if (request.type === 'START_AGENT_TASK') {
        if (!agentIsActive) {
            agentIsActive = true;
            handleAgentTask(request.payload.userTask)
                .then(() => {
                    agentIsActive = false;
                    console.log('Agent completed.');
                })
                .catch((err) => {
                    agentIsActive = false;
                    console.error('Agent error:', err);
                });
            sendResponse({ success: true });
        } else {
            sendResponse({ success: false, error: 'Agent is already running.' });
        }
        return true; // keep sendResponse open for async
    }

    // existing message logic
    if (request.type === 'COMPUTER_USE') {
        // ...
    } else if (request.type === "EXECUTE_ANY") {
        // ...
    } else if (request.type === "CAPTURE_SCREEN") {
        // ...
    }
});

async function handleAgentTask(userTask) {
    console.log('[background.js] handleAgentTask called with task:', userTask);
    console.log('[background.js] Starting agent with task:', userTask);
    agentIsActive = true;

    try {
        const result = await agentLoop({
            task: userTask,
            onScreenshot: async () => {
                const screenshot = await doCaptureScreenshot();
                const pageInfo = await getCurrentPageInfo();
                return { image: screenshot, pageInfo: pageInfo };
            },
            onAction: executeAction,
            onThinking: (message) => {
                updateSidebarStatus({ type: 'thinking', message: message });
            },
            onError: (error) => {
                updateSidebarStatus({ type: 'error', message: error.message });
            },
            maxSteps: 10,
            stopSignal: () => !agentIsActive
        });

        console.log('[background.js] Agent loop completed:', result);
        agentIsActive = false;
    } catch (error) {
        console.error('[background.js] Error running agent loop:', error);
        agentIsActive = false;
    }
}

// A function used by handleAgentTask to capture screenshot
async function doCaptureScreenshot() {
    try {
        const dataUrl = await chrome.tabs.captureVisibleTab({ format: 'png' });
        if (dataUrl) {
            console.log('[background.js] Screenshot captured length:', dataUrl.length);
            // Optionally do something with dataUrl or forward to your server
            return dataUrl;
        }
    } catch (e) {
        console.warn('Screenshot error:', e);
    }
    return null;
}

// Create context menu when extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  // This context menu item appears when user right-clicks the extension icon
  chrome.contextMenus.create({
    id: 'openSidebar',
    title: 'Open Sidebar',
    contexts: ['action'] // Shows up when right-clicking extension icon
  });
});

// Listen for context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'openSidebar') {
    // Use the official sidePanel API
    try {
      await chrome.sidePanel.open({ windowId: tab.windowId });
      console.log('Side panel opened successfully');
    } catch (error) {
      console.error('Failed to open side panel:', error);
    }
  }
});

// Update action handling
async function executeAction(action) {
    console.log('[background.js] executeAction called with action:', action);
    
    try {
        // Get the active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) {
            throw new Error('No active tab found');
        }

        // Handle navigation actions directly
        if (action.type === 'navigate') {
            await chrome.tabs.update(tab.id, { url: action.url });
            // Wait for navigation to complete
            await new Promise(resolve => {
                chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                    if (tabId === tab.id && info.status === 'complete') {
                        chrome.tabs.onUpdated.removeListener(listener);
                        resolve();
                    }
                });
            });
            return { success: true };
        }

        // Send action to content script
        const response = await chrome.tabs.sendMessage(tab.id, {
            type: 'executeAction',
            action: action
        });

        // Handle response
        if (!response) {
            throw new Error('No response from content script');
        }

        console.log('Action execution response:', response);
        return response;
    } catch (error) {
        console.error('Action execution error:', error);
        return { success: false, error: error.message };
    }
}

// Update message handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message);

    if (message.type === 'executeAction') {
        executeAction(message.action)
            .then(result => {
                console.log('Action execution result:', result);
                sendResponse(result);
            })
            .catch(error => {
                console.error('Action execution error:', error);
                sendResponse({ success: false, error: error.message });
            });
        return true; // Keep the message channel open
    }
});

// Helper function to get current tab
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}


