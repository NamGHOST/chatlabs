// Content script for page interactions
console.log('Content script loaded');

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
        if (request.type === 'PING') {
            // Respond to ping to confirm content script is loaded
            sendResponse({ status: 'ok' });
            return true;
        }
        
        if (request.type === 'EXTRACT_CONTENT') {
            const content = extractPageContent();
            sendResponse({ content });
            return true;
        }

        if (request.type === 'CLICK') {
            const result = clickElement(request.x, request.y);
            sendResponse(result);
            return true;
        }

        if (request.type === 'SCROLL_TO') {
            const element = document.querySelector(request.selector);
            if (element) {
                const result = scrollToElement(element);
                sendResponse(result);
            } else {
                sendResponse({ success: false, error: 'Element not found' });
            }
            return true;
        }

        if (request.type === 'WAIT_FOR') {
            waitForElement(request.selector, request.timeout)
                .then(element => sendResponse({ success: true, found: true }))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true;
        }
    } catch (error) {
        console.error('Content script error:', error);
        sendResponse({ success: false, error: error.message });
        return true;
    }
});

// Extract page content
function extractPageContent() {
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

        // Get clickable elements
        const clickableElements = Array.from(document.querySelectorAll('button, a, input[type="button"], input[type="submit"]')).map(el => {
            const rect = el.getBoundingClientRect();
            return {
                text: el.innerText || el.value || '',
                tag: el.tagName.toLowerCase(),
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
        });

        return {
            success: true,
            data: {
                title,
                description,
                content,
                links,
                clickableElements
            }
        };
    } catch (error) {
        console.error('Content extraction error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Helper function to click element
function clickElement(x, y) {
    try {
        const element = document.elementFromPoint(x, y);
        if (element) {
            // Scroll element into view if needed
            const rect = element.getBoundingClientRect();
            if (rect.top < 0 || rect.bottom > window.innerHeight) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            // Create and dispatch mouse events for more natural interaction
            ['mousedown', 'mouseup', 'click'].forEach(eventType => {
                const event = new MouseEvent(eventType, {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                    clientX: x,
                    clientY: y
                });
                element.dispatchEvent(event);
            });
            
            return { success: true, element: {
                tag: element.tagName.toLowerCase(),
                text: element.innerText || element.value || ''
            }};
        }
        return { success: false, error: 'No element found at coordinates' };
    } catch (error) {
        console.error('Click error:', error);
        return { success: false, error: error.message };
    }
}

// Helper function to scroll to element
function scrollToElement(element) {
    try {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return { success: true };
    } catch (error) {
        console.error('Scroll error:', error);
        return { success: false, error: error.message };
    }
}

// Helper function to wait for element
function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }

        const observer = new MutationObserver((mutations, obs) => {
            const element = document.querySelector(selector);
            if (element) {
                obs.disconnect();
                resolve(element);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Timeout waiting for element: ${selector}`));
        }, timeout);
    });
}
