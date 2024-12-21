document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chatContainer');
    const featuresPanel = document.getElementById('featuresPanel');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const chatMode = document.getElementById('chatMode');
    const featuresMode = document.getElementById('featuresMode');

    // Mode switching
    chatMode.addEventListener('click', () => {
        chatMode.classList.add('active');
        featuresMode.classList.remove('active');
        chatContainer.style.display = 'block';
        featuresPanel.style.display = 'none';
    });

    featuresMode.addEventListener('click', () => {
        featuresMode.classList.add('active');
        chatMode.classList.remove('active');
        chatContainer.style.display = 'none';
        featuresPanel.style.display = 'flex';
    });

    // Handle feature buttons
    document.querySelectorAll('.feature-button').forEach(button => {
        button.addEventListener('click', () => {
            const feature = button.dataset.feature;
            chrome.runtime.sendMessage(
                { type: 'OPEN_FEATURE', feature },
                response => {
                    if (response.error) {
                        appendMessage(`Error: ${response.error}`, 'error');
                    } else {
                        appendMessage(`Opening ${feature}...`, 'bot');
                    }
                }
            );
        });
    });

    // Send message function
    const sendMessage = async () => {
        const message = userInput.value.trim();
        if (!message) return;

        // Disable input and button while processing
        userInput.disabled = true;
        sendButton.disabled = true;
        sendButton.textContent = '...';

        // Add user message to chat
        appendMessage(message, 'user');
        
        // Clear input
        userInput.value = '';

        // Create a message div for the response
        const responseDiv = appendMessage('', 'bot');
        let currentResponse = '';

        // Send message to background script
        try {
            const response = await handleUserInput(message);
            if (response) {
                // Handle the streaming response
                const text = response;
                currentResponse += text;
                
                // Format and display the response
                if (text.includes('```')) {
                    // Handle code blocks
                    const formattedText = formatMessageWithCodeBlocks(currentResponse);
                    responseDiv.innerHTML = formattedText;
                } else {
                    responseDiv.textContent = currentResponse;
                }
                
                // Scroll to the latest message
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }

            // Re-enable input and button
            userInput.disabled = false;
            sendButton.disabled = false;
            sendButton.textContent = 'Send';
            userInput.focus();
        } catch (error) {
            responseDiv.textContent = 'Error: Failed to send message';
            responseDiv.classList.add('error-message');
            userInput.disabled = false;
            sendButton.disabled = false;
            sendButton.textContent = 'Send';
        }
    };

    // Format message with code blocks
    const formatMessageWithCodeBlocks = (text) => {
        const parts = text.split('```');
        let formatted = '';
        
        for (let i = 0; i < parts.length; i++) {
            if (i % 2 === 0) {
                // Regular text
                formatted += `<span>${escapeHtml(parts[i])}</span>`;
            } else {
                // Code block
                formatted += `<pre><code>${escapeHtml(parts[i])}</code></pre>`;
            }
        }
        
        return formatted;
    };

    // Escape HTML to prevent XSS
    const escapeHtml = (unsafe) => {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    // Append message to chat container
    const appendMessage = (text, type, isTemp = false) => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${type}-message`);
        if (isTemp) {
            messageDiv.classList.add('temp-message');
        }
        messageDiv.textContent = text;
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        return messageDiv;
    };

    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Focus input on popup open
    userInput.focus();
});

async function handleUserInput(message) {
    try {
        // Check if this is a screen analysis request
        if (message.toLowerCase().includes('what') && message.toLowerCase().includes('screen')) {
            const response = await chrome.runtime.sendMessage({
                type: 'ANALYZE_SCREEN',
                message: message
            });
            
            if (!response.success) {
                throw new Error(response.error);
            }
            
            return response.response;
        }
        
        // Handle other messages as before
        const context = await chrome.runtime.sendMessage({ type: 'GET_PAGE_CONTEXT' });
        const response = await chrome.runtime.sendMessage({
            type: 'SEND_MESSAGE',
            message: message,
            context: context
        });
        
        return response.reply;
    } catch (error) {
        console.error('Error handling user input:', error);
        throw error;
    }
} 