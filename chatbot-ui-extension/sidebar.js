// Simple markdown parser
const markdownToHtml = (text) => {
    if (!text) return '';
    
    return text
        // Headers
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // Links
        .replace(/\[([^\]]+)\]\(([^\)]+)\)/gim, '<a href="$2" target="_blank" class="url">$1</a>')
        // Bold
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        // Italics
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        // Lists
        .replace(/^\- (.*$)/gim, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>')
        // Blockquotes
        .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
        // Code blocks
        .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
        // Line breaks
        .replace(/\n/gim, '<br>');
};

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function handleUpdate(update) {
    const content = document.getElementById('content');
    const status = document.getElementById('current-status');

    switch (update.type) {
        case 'task_start':
            status.textContent = 'Starting new task...';
            content.innerHTML = `<div class="action">Task: ${escapeHtml(update.message)}</div>`;
            break;

        case 'status':
            status.textContent = update.message;
            break;

        case 'action':
            const actionDiv = document.createElement('div');
            actionDiv.className = 'action';
            
            // Handle copyToDoc action specially
            if (update.action && update.action.type === 'copyToDoc') {
                actionDiv.textContent = 'Generated Report:';
                const reportDiv = document.createElement('div');
                reportDiv.className = 'markdown';
                reportDiv.innerHTML = markdownToHtml(update.action.content);
                content.appendChild(actionDiv);
                content.appendChild(reportDiv);
            } else {
                // Format other action messages
                const actionMessage = typeof update.action === 'object' 
                    ? `${update.action.type}: ${update.action.query || update.action.command || JSON.stringify(update.action)}`
                    : update.action;
                actionDiv.textContent = `Executing: ${actionMessage}`;
                content.appendChild(actionDiv);
            }
            content.scrollTop = content.scrollHeight;
            break;

        case 'result':
            const resultDiv = document.createElement('div');
            resultDiv.className = 'result';
            
            // Handle search results specially
            if (update.result && update.result.searchResults) {
                const searchResults = update.result.searchResults;
                let formattedResults = '<div class="search-results-container">';
                
                if (searchResults.results && searchResults.results.length > 0) {
                    formattedResults += '<h3>Search Results</h3>';
                    searchResults.results.forEach(result => {
                        formattedResults += `
                            <div class="search-result-item">
                                <a href="${result.link}" target="_blank" class="result-title">${result.title}</a>
                                ${result.snippet ? `<p class="result-snippet">${result.snippet}</p>` : ''}
                                ${result.date ? `<span class="result-date">${result.date}</span>` : ''}
                            </div>
                        `;
                    });
                }
                
                formattedResults += '</div>';
                resultDiv.innerHTML = formattedResults;
            } else if (update.result && update.result.data && update.result.data.error === "Not in a supported document editor") {
                // Skip showing the error for document editor
                return;
            } else {
                // For non-search results
                resultDiv.textContent = `Result: ${JSON.stringify(update.result, null, 2)}`;
            }
            
            content.appendChild(resultDiv);
            content.scrollTop = content.scrollHeight;
            break;

        case 'search_results':
            const searchDiv = document.createElement('div');
            searchDiv.className = 'search-results';
            
            // Create header with search query and timestamp
            const header = document.createElement('div');
            header.className = 'search-header';
            const timestamp = new Date().toLocaleString();
            header.innerHTML = `
                <h3 class="section-title">Search Results: ${escapeHtml(update.query)}</h3>
                <span class="search-timestamp">As of ${timestamp}</span>
            `;
            searchDiv.appendChild(header);

            // Create container for results
            const resultsContainer = document.createElement('div');
            resultsContainer.className = 'search-results-container';

            if (update.results) {
                try {
                    // Parse markdown content
                    const markdownContent = update.results;
                    const sections = markdownContent.split('\n#').filter(Boolean);

                    // Process each section
                    sections.forEach(section => {
                        const [sectionTitle, ...sectionContent] = section.split('\n');
                        const sectionDiv = document.createElement('div');
                        sectionDiv.className = 'search-result-item';

                        // Handle section title
                        if (sectionTitle) {
                            const titleEl = document.createElement('div');
                            titleEl.className = 'result-title';
                            // Remove markdown header symbols and trim
                            titleEl.textContent = sectionTitle.replace(/^#+\s*/, '').trim();
                            sectionDiv.appendChild(titleEl);
                        }

                        // Create section content with proper formatting
                        const contentEl = document.createElement('div');
                        contentEl.className = 'result-content';

                        // Process content with enhanced markdown parsing
                        const processedContent = sectionContent
                            .join('\n')
                            .split('\n')
                            .map(line => {
                                // Handle different types of content
                                if (line.startsWith('###')) {
                                    return `<h3 class="subsection-title">${line.replace(/^###\s*/, '')}</h3>`;
                                } else if (line.startsWith('##')) {
                                    return `<h2 class="section-subtitle">${line.replace(/^##\s*/, '')}</h2>`;
                                } else if (line.startsWith('-')) {
                                    return `<div class="list-item">${line.substring(1)}</div>`;
                                } else if (line.trim().startsWith('*') && line.trim().endsWith('*')) {
                                    return `<div class="emphasis">${line.trim().slice(1, -1)}</div>`;
                                } else if (line.includes('|')) {
                                    // Handle table-like data
                                    const [key, value] = line.split('|').map(s => s.trim());
                                    return `<div class="data-row"><span class="data-label">${key}:</span><span class="data-value">${value}</span></div>`;
                                }
                                return `<p>${line}</p>`;
                            })
                            .join('');

                        contentEl.innerHTML = processedContent;

                        // Handle links specially
                        const links = contentEl.querySelectorAll('a');
                        links.forEach(link => {
                            if (link.href) {
                                const linkContainer = document.createElement('div');
                                linkContainer.className = 'source-link';
                                
                                // Add favicon
                                const favicon = document.createElement('img');
                                favicon.className = 'source-favicon';
                                favicon.src = `https://www.google.com/s2/favicons?domain=${new URL(link.href).hostname}`;
                                favicon.onerror = () => {
                                    favicon.style.display = 'none';
                                };
                                linkContainer.appendChild(favicon);
                                
                                // Add link with domain
                                const domain = new URL(link.href).hostname;
                                link.innerHTML += ` <span class="link-domain">(${domain})</span>`;
                                linkContainer.appendChild(link);
                                
                                // Replace original link with container
                                link.parentNode.replaceChild(linkContainer, link);
                            }
                        });

                        sectionDiv.appendChild(contentEl);
                        resultsContainer.appendChild(sectionDiv);
                    });

                    // Add error handling for empty results
                    if (resultsContainer.children.length === 0) {
                        const noResultsDiv = document.createElement('div');
                        noResultsDiv.className = 'no-results';
                        noResultsDiv.textContent = 'No results found for this search.';
                        resultsContainer.appendChild(noResultsDiv);
                    }
                } catch (error) {
                    console.error('Error processing search results:', error);
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'error-message';
                    errorDiv.textContent = 'Error processing search results. Please try again.';
                    resultsContainer.appendChild(errorDiv);
                }
            }

            searchDiv.appendChild(resultsContainer);
            content.appendChild(searchDiv);
            content.scrollTop = content.scrollHeight;
            break;

        case 'extracted_content':
            const extractedDiv = document.createElement('div');
            extractedDiv.className = 'extracted-content';
            extractedDiv.innerHTML = `
                <h3>Extracted Content</h3>
                <a href="${update.url}" class="url" target="_blank">${update.url}</a>
                <div class="markdown">${markdownToHtml(update.content)}</div>
            `;
            content.appendChild(extractedDiv);
            content.scrollTop = content.scrollHeight;
            break;

        case 'error':
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error';
            errorDiv.textContent = `Error: ${update.error}`;
            content.appendChild(errorDiv);
            content.scrollTop = content.scrollHeight;
            break;

        case 'complete':
            status.textContent = 'Task completed';
            const completeDiv = document.createElement('div');
            completeDiv.className = 'action';
            completeDiv.innerHTML = `
                <h3>Task Complete</h3>
                <div class="markdown">${markdownToHtml(update.message)}</div>
            `;
            content.appendChild(completeDiv);
            content.scrollTop = content.scrollHeight;
            break;
    }
}

async function sendMessage() {
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const message = userInput.value.trim();
    
    if (!message) return;

    try {
        // Disable input while processing
        userInput.disabled = true;
        sendButton.disabled = true;

        // Show the message in the content area
        const content = document.getElementById('content');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'action';
        messageDiv.textContent = `Task: ${message}`;
        content.appendChild(messageDiv);
        content.scrollTop = content.scrollHeight;

        // Send message to background script
        const response = await chrome.runtime.sendMessage({
            type: 'SEND_MESSAGE',
            message: message
        });

        // Clear input
        userInput.value = '';
        
        // Handle response if needed
        if (response.error) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error';
            errorDiv.textContent = `Error: ${response.error}`;
            content.appendChild(errorDiv);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = `Error: ${error.message}`;
        content.appendChild(errorDiv);
    } finally {
        // Re-enable input
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
    }
}

// Helper function to convert markdown to HTML
function marked(markdown) {
    // Simple markdown to HTML conversion
    return markdown
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
        .replace(/\n\n/g, '<br><br>')
        .trim();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'SIDEBAR_UPDATE') {
            handleUpdate(message.data);
        }
    });

    // Clear button functionality
    document.getElementById('clear-content').addEventListener('click', () => {
        document.getElementById('content').innerHTML = '';
        document.getElementById('current-status').textContent = 'Ready';
    });

    // Send button click handler
    sendButton.addEventListener('click', sendMessage);

    // Enter key handler (with shift+enter for new line)
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Auto-resize textarea
    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto';
        userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
    });
}); 