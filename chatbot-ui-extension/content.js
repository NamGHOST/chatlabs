// Content script loaded
console.log('Content script loaded');

// Function to extract content from Google search results
async function extractGoogleSearchResults() {
    // Extract main search results
    const searchResults = document.querySelectorAll('div.g');
    let extractedContent = '';
    
    // Get current date for the header
    const currentDate = new Date().toLocaleDateString();
    
    // Extract search query from URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q') || 'Search Results';
    extractedContent += `${searchQuery} - Search Summary (${currentDate})\n\n`;

    // Process each search result
    let newsItems = [];
    searchResults.forEach((result, index) => {
        try {
            const titleElement = result.querySelector('h3');
            const snippetElement = result.querySelector('div.VwiC3b');
            const linkElement = result.querySelector('a');
            const dateElement = result.querySelector('.MUxGbd.wuQ4Ob.WZ8Tjf span');

            if (titleElement && snippetElement) {
                newsItems.push({
                    title: titleElement.textContent,
                    snippet: snippetElement.textContent,
                    url: linkElement ? linkElement.href : '',
                    date: dateElement ? dateElement.textContent : ''
                });
            }
        } catch (error) {
            console.error('Error extracting result:', error);
        }
    });

    // Format the content with a summary section
    extractedContent += "## Latest News Summary\n\n";
    newsItems.forEach((item, index) => {
        extractedContent += `${index + 1}. **${item.title}**\n`;
        extractedContent += `   ${item.snippet}\n`;
        if (item.date) {
            extractedContent += `   *Published: ${item.date}*\n`;
        }
        extractedContent += `   [Read more](${item.url})\n\n`;
    });

    extractedContent += "\n## Sources\n\n";
    newsItems.forEach((item, index) => {
        extractedContent += `${index + 1}. ${item.url}\n`;
    });

    return extractedContent;
}

// Function to paste content to Google Docs
async function pasteToGoogleDoc(content) {
    // Wait for the editor to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create a temporary textarea
    const textarea = document.createElement('textarea');
    textarea.value = content;
    document.body.appendChild(textarea);

    try {
        // Select and copy the content
        textarea.select();
        navigator.clipboard.copy;

        // Try multiple paste methods
        // Method 1: execCommand
        navigator.clipboard.paste();

        // Method 2: Keyboard event
        document.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'v',
            code: 'KeyV',
            ctrlKey: true,
            bubbles: true
        }));

        // Method 3: Focus and paste into the editor
        const editor = document.querySelector('.docs-texteventtarget-iframe');
        if (editor) {
            editor.focus();
            // Wait a bit after focus
            await new Promise(resolve => setTimeout(resolve, 500));
            // Try paste again
            document.execCommand('paste');
        }

        return true;
    } catch (error) {
        console.error('Failed to paste:', error);
        return false;
    } finally {
        document.body.removeChild(textarea);
    }
}

async function capturePageContext() {
    // Get the article content
    const articleContent = {
        title: document.title,
        content: document.querySelector('article')?.innerText || 
                document.querySelector('main')?.innerText || 
                document.body.innerText,
        url: window.location.href
    };
    return articleContent;
}

// Content script to handle DOM interactions
console.log('Content script loaded');

// Define universal action handler in content script context
window.__universalAction = async function(action) {
    console.log('[__universalAction] Called with:', action);
    try {
        switch (action.type) {
            case 'click':
                const elem = document.querySelector(action.selector);
                if (!elem) {
                    throw new Error(`Element not found: ${action.selector}`);
                }
                elem.click();
                return { success: true, message: `Clicked ${action.selector}` };

            case 'keypress':
                const element = document.querySelector(action.selector);
                if (!element) throw new Error(`Element not found: ${action.selector}`);
                element.dispatchEvent(new KeyboardEvent('keydown', { key: action.key, bubbles: true }));
                element.dispatchEvent(new KeyboardEvent('keypress', { key: action.key, bubbles: true }));
                element.dispatchEvent(new KeyboardEvent('keyup', { key: action.key, bubbles: true }));
                return { success: true, message: `Pressed key: ${action.key}` };

            case 'input':
                const inputElement = document.querySelector(action.selector);
                if (!inputElement) throw new Error(`Input element not found: ${action.selector}`);
                inputElement.value = action.text;
                inputElement.dispatchEvent(new Event('input', { bubbles: true }));
                return { success: true, message: `Typed text: ${action.text}` };

            default:
                throw new Error(`Unknown action type: ${action.type}`);
        }
    } catch (error) {
        console.error('Action execution error:', error);
        return { success: false, error: error.message };
    }
};

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received message:', request);

    if (request.type === 'EXECUTE_ACTION') {
        handleAction(request.action)
            .then(sendResponse)
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }

    // Hypothetical case where agentLoop is triggered
    if (request.type === 'RUN_AGENT_LOOP') {
        // Assuming agentLoop is imported or available here
        agentLoop({
            task: request.task,
            onScreenshot: () => { /* ... implementation to capture screenshot ... */ },
            onAction: handleAction, // Passing handleAction as onAction
            onThinking: (message) => console.log('Thinking:', message),
            onError: (error) => console.error('Agent loop error:', error),
            maxSteps: 10,
            stopSignal: null
        }).then(result => sendResponse(result))
          .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Indicate async response
    }
});

async function handleAction(action) {
    console.log('Content script handling action:', action);

    try {
        switch (action.type) {
            case 'type': {
                let element = null;
                
                // Special handling for Perplexity
                if (window.location.hostname.includes('perplexity.ai')) {
                    console.log('Handling Perplexity search');
                    // Try to find the input field
                    element = document.querySelector('[role="textbox"], [class*="TextInput"], textarea, [placeholder*="question"], [placeholder*="ask"]');
                    if (element) {
                        element.focus();
                        element.value = action.text.replace('\n', '');
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                        element.dispatchEvent(new Event('change', { bubbles: true }));
                        
                        // Wait for the UI to update
                        await new Promise(resolve => setTimeout(resolve, 500));

                        // Try multiple methods to submit the search
                        try {
                            // 1. Try clicking the search/ask button
                            const searchButton = document.querySelector(
                                'button[type="submit"], ' +
                                'button:has(svg), ' +
                                '[aria-label*="ask" i], ' +
                                '[aria-label*="search" i], ' +
                                'button.text-white'  // Perplexity's specific button class
                            );
                            
                            if (searchButton) {
                                console.log('Found search button, clicking...');
                                searchButton.click();
                                return { success: true };
                            }

                            // 2. Try Enter key event
                            console.log('Simulating Enter key...');
                            const enterEvent = new KeyboardEvent('keydown', {
                                key: 'Enter',
                                code: 'Enter',
                                keyCode: 13,
                                which: 13,
                                bubbles: true,
                                cancelable: true
                            });
                            element.dispatchEvent(enterEvent);

                            // Also try keypress event as some sites use this instead
                            const keypressEvent = new KeyboardEvent('keypress', {
                                key: 'Enter',
                                code: 'Enter',
                                keyCode: 13,
                                which: 13,
                                bubbles: true,
                                cancelable: true
                            });
                            element.dispatchEvent(keypressEvent);

                            // 3. Try form submit
                            const form = element.closest('form');
                            if (form) {
                                console.log('Found form, submitting...');
                                form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                            }

                            return { success: true };
                        } catch (submitError) {
                            console.warn('Submit attempt failed:', submitError);
                            return { success: false, error: submitError.message };
                        }
                    }
                }
                
                // Special handling for Google search
                if (window.location.hostname.includes('google.com')) {
                    console.log('Handling Google search');
                    element = document.querySelector('input[name="q"], textarea[name="q"], [role="searchbox"]');
                    if (element) {
                        element.focus();
                        element.value = action.text.replace('\n', '');
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                        element.dispatchEvent(new Event('change', { bubbles: true }));

                        // Try to find and click the search button
                        const searchButton = document.querySelector('input[type="submit"], button[type="submit"]');
                        if (searchButton) {
                            searchButton.click();
                        } else {
                            // If no button found, submit the form
                            const form = element.closest('form');
                            if (form) {
                                form.submit();
                            } else {
                                // Last resort: simulate Enter key
                                element.dispatchEvent(new KeyboardEvent('keypress', {
                                    key: 'Enter',
                                    code: 'Enter',
                                    keyCode: 13,
                                    which: 13,
                                    bubbles: true
                                }));
                            }
                        }
                        return { success: true };
                    }
                }

                // For other sites, use the standard element finding
                element = await waitForElement(action.selector, 10000);
                if (!element) {
                    throw new Error(`Element not found: ${action.selector}`);
                }

                // Focus and clear existing content
                element.focus();
                if (element.tagName.toLowerCase() === 'div') {
                    element.innerHTML = '';
                } else {
                    element.value = '';
                }

                // Type the text
                if (element.getAttribute('contenteditable') === 'true') {
                    element.innerHTML = action.text;
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                } else {
                    element.value = action.text.replace('\n', '');
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                }

                // Wait for content to settle
                await new Promise(resolve => setTimeout(resolve, 500));

                // Handle submission if needed
                if (action.text.includes('\n')) {
                    try {
                        // Try clicking submit button first
                        const button = document.querySelector('button[type="submit"], [aria-label*="search"], [aria-label*="ask"], input[type="submit"]');
                        if (button) {
                            console.log('Found submit button, clicking...');
                            button.click();
                            return { success: true };
                        }

                        // Then try form submit
                        const form = element.closest('form');
                        if (form) {
                            console.log('Found form, submitting...');
                            form.submit();
                            return { success: true };
                        }

                        // Finally try Enter key
                        console.log('Simulating Enter key...');
                        element.dispatchEvent(new KeyboardEvent('keypress', {
                            key: 'Enter',
                            code: 'Enter',
                            keyCode: 13,
                            which: 13,
                            bubbles: true
                        }));
                    } catch (submitError) {
                        console.warn('Submit attempt failed:', submitError);
                    }
                }

                return { success: true };
            }

            case 'click': {
                const element = await waitForElement(action.selector, 10000);
                if (!element) {
                    throw new Error(`Element not found: ${action.selector}`);
                }
                element.click();
                return { success: true };
            }

            case 'navigate': {
                console.log('Navigating to:', action.url);
                window.location.href = action.url;
                return { success: true };
            }

            default:
                throw new Error(`Unknown action type: ${action.type}`);
        }
    } catch (error) {
        console.error('Action execution error:', error);
        return { success: false, error: error.message };
    }
}

// Improved waitForElement with better retry logic
async function waitForElement(selector, timeout = 10000) {
    console.log(`Waiting for element: ${selector}`);
    const start = Date.now();
    
    // Try different selector variations
    const getElement = () => {
        // Helper function to check if element is interactive
        const isInteractive = (el) => {
            const style = window.getComputedStyle(el);
            const isVisible = style.display !== 'none' && 
                            style.visibility !== 'hidden' && 
                            style.opacity !== '0' &&
                            el.offsetParent !== null;
            
            // Check if it's not a toggle/switch button for Perplexity Pro
            const isNotProToggle = !el.textContent?.toLowerCase().includes('pro') &&
                                 !el.getAttribute('aria-label')?.toLowerCase().includes('pro') &&
                                 !el.classList.toString().toLowerCase().includes('pro');
            
            return isVisible && isNotProToggle;
        };

        // Try direct selector first
        let elements = Array.from(document.querySelectorAll(selector))
            .filter(isInteractive);
        if (elements.length > 0) return elements[0];

        // Common search input selectors
        const searchSelectors = [
            'input[name="q"]',
            'input[type="search"]',
            'input[type="text"]',
            '[role="searchbox"]',
            '[role="textbox"]',
            'textarea',
            '[contenteditable="true"]',
            // Perplexity specific
            '[class*="TextInput"]',
            '[placeholder*="question"]',
            '[placeholder*="ask"]',
            '[placeholder*="search"]',
            // Google Docs specific
            '.docs-textedit-textarea',
            '.docs-textedit',
            '[aria-label="Document content"]',
            // Notion specific
            '.notion-page-content [contenteditable="true"]',
            '.notion-frame [contenteditable="true"]'
        ];

        // Try each search selector
        for (const searchSelector of searchSelectors) {
            elements = Array.from(document.querySelectorAll(searchSelector))
                .filter(isInteractive);
            if (elements.length > 0) {
                console.log(`Found input with selector: ${searchSelector}`);
                return elements[0];
            }
        }

        // Button selectors for submission
        const buttonSelectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            'button:has(svg)',
            '[aria-label*="search" i]',
            '[aria-label*="ask" i]',
            '[role="button"]'
        ];

        // Try each button selector
        for (const buttonSelector of buttonSelectors) {
            elements = Array.from(document.querySelectorAll(buttonSelector))
                .filter(isInteractive);
            if (elements.length > 0) {
                console.log(`Found button with selector: ${buttonSelector}`);
                return elements[0];
            }
        }

        return null;
    };
    
    while (Date.now() - start < timeout) {
        const element = getElement();
        if (element) {
            console.log(`Found element: ${selector}`);
            return element;
        }
        await new Promise(r => setTimeout(r, 100));
    }
    
    console.error(`Timeout waiting for element: ${selector}`);
    return null;
}

// Log that content script is loaded
console.log('Content script loaded and ready for actions');

async function requestScreenshot() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "CAPTURE_SCREEN" }, (res) => {
            if (res && res.success) 
                resolve(res.screenshotDataUrl);
            else
                resolve(null);
        });
    });
}

