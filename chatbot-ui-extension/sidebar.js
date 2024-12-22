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
            searchDiv.innerHTML = `
                <h3>Search Results for: ${escapeHtml(update.query)}</h3>
                <div class="markdown">${markdownToHtml(update.results)}</div>
            `;
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