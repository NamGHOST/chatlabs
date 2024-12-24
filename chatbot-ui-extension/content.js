// Content script for page interactions
console.log('Content script loaded');

// Universal action handler
window.__universalAction = async function(action) {
    try {
        console.log('Universal action received:', action);
        
        switch (action.type) {
            case 'navigate':
                window.location.href = action.url;
                return { success: true, message: `Navigating to ${action.url}` };

            case 'click':
                if (action.x != null && action.y != null) {
                    return clickElement(action.x, action.y);
                } else if (action.selector) {
                    const element = document.querySelector(action.selector);
                    if (element) {
                        element.click();
                        return { success: true, message: 'Clicked element by selector' };
                    }
                    return { success: false, error: 'No element found for selector' };
                }
                return { success: false, error: 'No coordinates or selector provided' };

            case 'search':
                const searchUrl = action.engine === 'perplexity' 
                    ? `https://www.perplexity.ai/?q=${encodeURIComponent(action.query)}`
                    : `https://www.google.com/search?q=${encodeURIComponent(action.query)}`;
                window.location.href = searchUrl;
                return { success: true, message: `Searching for ${action.query}` };

            case 'extract':
                const content = extractPageContent();
                // If this is a search result page, enhance the extraction
                if (window.location.href.includes('google.com/search') || 
                    window.location.href.includes('perplexity.ai')) {
                    const searchResults = extractSearchResults();
                    return {
                        ...content,
                        searchResults
                    };
                }
                return content;

            case 'likePosts':
                let count = 0;
                const numPosts = action.numPosts || 5;
                
                for (let round = 0; round < 5; round++) {
                    const likeButtons = document.querySelectorAll('button, a');
                    for (const btn of likeButtons) {
                        const label = (btn.innerText || btn.getAttribute('aria-label') || '').toLowerCase();
                        if (label.includes('like')) {
                            btn.click();
                            count++;
                            if (count >= numPosts) break;
                        }
                    }
                    if (count >= numPosts) break;
                    window.scrollBy(0, window.innerHeight);
                    await new Promise(r => setTimeout(r, 1000));
                }
                return { success: true, liked: count };

            case 'scroll':
                if (action.selector) {
                    const element = document.querySelector(action.selector);
                    if (element) {
                        return scrollToElement(element);
                    }
                    return { success: false, error: 'Element not found' };
                } else if (action.position) {
                    window.scrollTo(0, action.position);
                    return { success: true };
                }
                return { success: false, error: 'No scroll target specified' };

            case 'wait':
                try {
                    const element = await waitForElement(action.selector, action.timeout);
                    return { success: true, found: true };
                } catch (error) {
                    return { success: false, error: error.message };
                }

            case 'switchTab':
                // This will be handled by background script
                return { success: true, message: `Switching to tab matching ${action.urlPattern}` };

            case 'copyToDoc':
                try {
                    // Check if we're on a Google Doc or Notion page
                    const isGoogleDoc = window.location.href.includes('docs.google.com');
                    const isNotion = window.location.href.includes('notion.so');
                    
                    if (!isGoogleDoc && !isNotion) {
                        return { success: false, error: 'Not in a supported document editor' };
                    }

                    if (isGoogleDoc) {
                        // For Google Docs
                        const content = action.content;
                        // Find the editor
                        const editor = document.querySelector('.kix-appview-editor');
                        if (!editor) {
                            return { success: false, error: 'Google Docs editor not found' };
                        }
                        
                        // Create a temporary textarea to handle the paste
                        const textarea = document.createElement('textarea');
                        textarea.value = content;
                        document.body.appendChild(textarea);
                        textarea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textarea);
                        
                        // Focus the editor and paste
                        editor.focus();
                        document.execCommand('paste');
                        
                        return { success: true, message: 'Content copied to Google Doc' };
                    }
                    
                    if (isNotion) {
                        // For Notion
                        const content = action.content;
                        // Find the editor
                        const editor = document.querySelector('[contenteditable="true"]');
                        if (!editor) {
                            return { success: false, error: 'Notion editor not found' };
                        }
                        
                        // Create and dispatch paste event
                        const pasteEvent = new ClipboardEvent('paste', {
                            bubbles: true,
                            cancelable: true,
                            clipboardData: new DataTransfer()
                        });
                        
                        // Set the content
                        pasteEvent.clipboardData.setData('text/plain', content);
                        editor.dispatchEvent(pasteEvent);
                        
                        return { success: true, message: 'Content copied to Notion' };
                    }
                } catch (error) {
                    return { success: false, error: `Failed to copy content: ${error.message}` };
                }

            default:
                return { success: false, error: `Unknown action type: ${action.type}` };
        }
    } catch (err) {
        console.error('Error in universalAction:', err);
        return { success: false, error: err.message };
    }
};

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

        if (request.type === 'REPLY') {
            const { comment } = request;
            performReply(comment);
            sendResponse({ success: true });
        }

        if (request.type === 'EXECUTE_ACTION') {
            const { action } = request;
            if (action.type === 'reply') {
                performReply(action.comment);
                sendResponse({ success: true });
            }
            // Handle other action types...
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
// Function to find reply buttons dynamically
function findReplyButtons() {
    const possibleSelectors = [
        '.reply-button',        // Common class
        'button:contains("Reply")', // Button with text 'Reply'
        '.comment-reply',       // Alternative class
        'button.reply',         // Another possible class
        // Add more as needed
    ];

    for (const selector of possibleSelectors) {
        const buttons = Array.from(document.querySelectorAll(selector));
        if (buttons.length > 0) return buttons;
    }

    return [];
}

let currentPlatformConfig = {};

// Load platform configuration based on hostname
function loadPlatformConfig() {
    const hostname = window.location.hostname.replace('www.', '');
    chrome.runtime.sendMessage({ type: 'GET_PLATFORM_CONFIG', hostname: hostname }, (response) => {
        if (response && response.config) {
            currentPlatformConfig = response.config;
            console.log('Loaded platform config:', currentPlatformConfig);
            // Optionally, you can initiate other setups here
        } else {
            console.warn('No configuration found for this platform.');
        }
    });
}

loadPlatformConfig();

// Example function to perform reply
function performReply(commentText) {
    const replyButtons = document.querySelectorAll(currentPlatformConfig.replySelector);
    replyButtons.forEach(button => button.click());

    setTimeout(() => {
        const textarea = document.querySelector(currentPlatformConfig.commentTextarea);
        const submitButton = document.querySelector(currentPlatformConfig.submitButton);

        if (textarea && submitButton) {
            textarea.value = commentText;
            submitButton.click();
            console.log('Replied with:', commentText);
        } else {
            console.warn('Textarea or submit button not found.');
        }
    }, 1000); // Adjust timeout as needed
}

// Example function using the configuration
function replyToPost() {
    const replyButtons = document.querySelectorAll(currentPlatformConfig.replySelector);
    replyButtons.forEach(button => button.click());

    // Similar usage for textarea and submit button
}

// Add new helper function for extracting search results
function extractSearchResults() {
    try {
        if (window.location.href.includes('google.com/search')) {
            // Extract Google search results more thoroughly
            const results = [];
            const searchItems = document.querySelectorAll('#search .g');
            
            for (const item of searchItems) {
                const titleEl = item.querySelector('h3');
                const linkEl = item.querySelector('a');
                const snippetEl = item.querySelector('.VwiC3b, .st');
                const dateEl = item.querySelector('.MUxGbd.wuQ4Ob');
                
                if (titleEl && linkEl) {
                    results.push({
                        title: titleEl.textContent.trim(),
                        link: linkEl.href,
                        snippet: snippetEl ? snippetEl.textContent.trim() : '',
                        date: dateEl ? dateEl.textContent.trim() : '',
                        isNews: item.closest('#rso') && item.closest('#rso').querySelector('.AxoYTd') !== null
                    });
                }
            }

            // Also extract "Top stories" if present
            const topStories = document.querySelectorAll('.yJa8yd');
            if (topStories.length > 0) {
                for (const story of topStories) {
                    const titleEl = story.querySelector('.n0jPhd');
                    const linkEl = story.querySelector('a');
                    const sourceEl = story.querySelector('.MgUUmf');
                    const timeEl = story.querySelector('.OSrXXb');

                    if (titleEl && linkEl) {
                        results.push({
                            title: titleEl.textContent.trim(),
                            link: linkEl.href,
                            source: sourceEl ? sourceEl.textContent.trim() : '',
                            time: timeEl ? timeEl.textContent.trim() : '',
                            isTopStory: true
                        });
                    }
                }
            }

            return { 
                type: 'google', 
                results,
                summary: formatSearchResults(results)
            };
        }
        
        if (window.location.href.includes('perplexity.ai')) {
            try {
                // Extract main content
                const mainContent = document.querySelector('.prose');
                if (!mainContent) {
                    console.warn('Prose element not found');
                    return null;
                }

                // Extract answer and metadata
                const answer = mainContent.textContent || '';
                const stockPrice = document.querySelector('[data-price]')?.textContent;
                const updateTime = document.querySelector('[data-update-time]')?.textContent;

                // Extract sources more reliably
                const sources = Array.from(document.querySelectorAll('a[href^="http"]'))
                    .filter(link => !link.href.includes('perplexity.ai'))
                    .map(link => ({
                        title: link.textContent.trim(),
                        link: link.href,
                        domain: new URL(link.href).hostname
                    }))
                    .filter(source => source.title && source.link);

                // Format the answer with improved structure
                const sections = answer.split('\n\n').filter(section => section.trim());
                let formattedAnswer = '';

                // Add header with stock info if available
                if (stockPrice && updateTime) {
                    formattedAnswer += `# NVIDIA (NVDA) - ${stockPrice}\n`;
                    formattedAnswer += `*Last Updated: ${updateTime}*\n\n`;
                }

                // Process sections with better formatting
                sections.forEach((section, index) => {
                    const trimmedSection = section.trim();
                    if (index === 0 && !stockPrice) {
                        // Use first section as title if no stock price
                        formattedAnswer += `# ${trimmedSection}\n\n`;
                    } else if (trimmedSection.includes(':')) {
                        // Handle section headers
                        const [title, ...content] = trimmedSection.split(':');
                        formattedAnswer += `## ${title.trim()}\n${content.join(':').trim()}\n\n`;
                    } else if (trimmedSection.length > 0) {
                        // Regular paragraphs
                        formattedAnswer += `${trimmedSection}\n\n`;
                    }
                });

                // Add sources section with better organization
                if (sources.length > 0) {
                    formattedAnswer += `## Sources\n\n`;
                    // Group sources by domain
                    const sourcesByDomain = sources.reduce((acc, source) => {
                        if (!acc[source.domain]) {
                            acc[source.domain] = [];
                        }
                        acc[source.domain].push(source);
                        return acc;
                    }, {});

                    // Output sources grouped by domain
                    Object.entries(sourcesByDomain).forEach(([domain, domainSources]) => {
                        formattedAnswer += `### ${domain}\n`;
                        domainSources.forEach(source => {
                            formattedAnswer += `- [${source.title}](${source.link})\n`;
                        });
                        formattedAnswer += '\n';
                    });
                }

                return {
                    type: 'perplexity',
                    answer,
                    sources,
                    stockPrice,
                    updateTime,
                    summary: formattedAnswer,
                    success: true
                };
            } catch (error) {
                console.error('Error extracting Perplexity content:', error);
                return {
                    type: 'perplexity',
                    error: error.message,
                    success: false
                };
            }
        }

        // If we're on a news article page, extract the article content
        if (document.querySelector('article') || document.querySelector('[role="article"]')) {
            return extractArticleContent();
        }
        
        return null;
    } catch (error) {
        console.error('Error extracting search results:', error);
        return null;
    }
}

// Helper function to format search results into markdown
function formatSearchResults(results) {
    let markdown = '## Search Results\n\n';
    
    // Format top stories if any
    const topStories = results.filter(r => r.isTopStory);
    if (topStories.length > 0) {
        markdown += '### Top Stories\n\n';
        for (const story of topStories) {
            markdown += `- [${story.title}](${story.link})\n`;
            if (story.source || story.time) {
                markdown += `  - ${story.source} ${story.time}\n`;
            }
        }
        markdown += '\n';
    }

    // Format news results
    const newsResults = results.filter(r => r.isNews && !r.isTopStory);
    if (newsResults.length > 0) {
        markdown += '### News Articles\n\n';
        for (const result of newsResults) {
            markdown += `- [${result.title}](${result.link})\n`;
            if (result.date) {
                markdown += `  - ${result.date}\n`;
            }
            if (result.snippet) {
                markdown += `  > ${result.snippet}\n`;
            }
            markdown += '\n';
        }
    }

    // Format other results
    const otherResults = results.filter(r => !r.isNews && !r.isTopStory);
    if (otherResults.length > 0) {
        markdown += '### Other Results\n\n';
        for (const result of otherResults) {
            markdown += `- [${result.title}](${result.link})\n`;
            if (result.snippet) {
                markdown += `  > ${result.snippet}\n`;
            }
            markdown += '\n';
        }
    }

    return markdown;
}

// Helper function to extract article content
function extractArticleContent() {
    try {
        // Find the article container
        const article = document.querySelector('article') || document.querySelector('[role="article"]');
        if (!article) return null;

        // Get the title
        const title = document.querySelector('h1')?.textContent || document.title;

        // Get the date if available
        const dateEl = article.querySelector('time') || 
                      article.querySelector('[datetime]') ||
                      article.querySelector('.date') ||
                      article.querySelector('.timestamp');
        const date = dateEl ? dateEl.textContent.trim() : '';

        // Get the main content
        const contentEls = article.querySelectorAll('p');
        const content = Array.from(contentEls)
            .map(p => p.textContent.trim())
            .filter(text => text.length > 0)
            .join('\n\n');

        // Format as markdown
        const markdown = `
# ${title}
${date ? `\n*${date}*\n` : ''}

${content}

---
Source: ${window.location.href}
`;

        return {
            type: 'article',
            title,
            date,
            content,
            url: window.location.href,
            summary: markdown
        };
    } catch (error) {
        console.error('Error extracting article:', error);
        return null;
    }
}

