document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chatContainer');
    const featuresPanel = document.getElementById('featuresPanel');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const chatMode = document.getElementById('chatMode');
    const featuresMode = document.getElementById('featuresMode');
    const modelSelector = document.getElementById('modelSelector');

    // Initialize model selector
    const models = [
        { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
        { id: 'openai/gpt-4o-2024-08-06', name: 'GPT-4o' },
        { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku' },
        { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1' },
        { id: 'google/gemini-pro-1.5', name: 'Gemini Pro' }
    ];

    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = model.name;
        modelSelector.appendChild(option);
    });

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
        button.addEventListener('click', async () => {
            const feature = button.dataset.feature;
            
            // Add computer control specific features
            if (feature === 'computer-control') {
                const message = `I want to ${button.dataset.action} my computer`;
                await sendMessage(message, true);
                return;
            }

            if (feature === 'screenshot') {
                const screenshot = await takeScreenshot();
                if (screenshot) {
                    appendMessage('Screenshot taken!', 'bot');
                    const imgElement = document.createElement('img');
                    imgElement.src = screenshot;
                    imgElement.style.maxWidth = '100%';
                    imgElement.style.borderRadius = '8px';
                    imgElement.style.marginTop = '8px';
                    const messageDiv = appendMessage('', 'bot');
                    messageDiv.appendChild(imgElement);
                }
                return;
            }

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

    // Take screenshot function
    async function takeScreenshot() {
        try {
            const response = await chrome.runtime.sendMessage({ type: 'TAKE_SCREENSHOT' });
            return response.screenshot;
        } catch (error) {
            console.error('Screenshot error:', error);
            appendMessage('Failed to take screenshot', 'error');
            return null;
        }
    }

    // Execute automation action
    async function executeAction(action) {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'EXECUTE_ACTION',
                action: action
            });
            return response.result;
        } catch (error) {
            console.error('Action error:', error);
            appendMessage('Failed to execute action', 'error');
            return null;
        }
    }

    // Send message function
    const sendMessage = async (customMessage = null) => {
        const messageInput = document.getElementById('userInput');
        const sendButton = document.getElementById('sendButton');
        const message = customMessage || messageInput.value.trim();
        
        if (!message) return;

        // Disable input and button while processing
        messageInput.disabled = true;
        sendButton.disabled = true;
        sendButton.textContent = '...';

        try {
            // Take screenshot if requested
            let screenshot = null;
            if (message.toLowerCase().includes('screenshot')) {
                try {
                    const response = await chrome.runtime.sendMessage({ type: 'TAKE_SCREENSHOT' });
                    if (response && response.screenshot) {
                        screenshot = response.screenshot;
                        // Show the screenshot in chat
                        const imgElement = document.createElement('img');
                        imgElement.src = screenshot;
                        imgElement.style.maxWidth = '100%';
                        imgElement.style.borderRadius = '8px';
                        imgElement.style.marginTop = '8px';
                        const messageDiv = appendMessage('Screenshot taken:', 'bot');
                        messageDiv.appendChild(imgElement);
                    }
                } catch (error) {
                    console.error('Screenshot error:', error);
                    appendMessage('Failed to take screenshot: ' + error.message, 'error');
                }
            }

            // Add user message to chat
            appendMessage(message, 'user');
            
            // Clear input if it's not a custom message
            if (!customMessage) {
                messageInput.value = '';
            }

            // Get selected model
            const modelSelect = document.getElementById('modelSelector');
            const selectedModel = modelSelect.value;

            // Send message to background script
            const response = await chrome.runtime.sendMessage({
                type: 'SEND_MESSAGE',
                message: message,
                settings: {
                    model: selectedModel,
                    temperature: 0.7,
                    stream: false,
                    screenshot: screenshot
                }
            });

            if (response.error) {
                throw new Error(response.error);
            }

            // Handle the response
            appendMessage(response.reply, 'bot');

            // Check for automation commands
            if (response.reply.includes('EXECUTE:')) {
                const commands = response.reply.split('EXECUTE:').slice(1);
                for (const commandText of commands) {
                    try {
                        const command = JSON.parse(commandText.split('\n')[0]);
                        const result = await executeAction(command);
                        if (result && result.success) {
                            appendMessage(`Action executed: ${command.type}`, 'bot');
                        }
                    } catch (error) {
                        console.error('Command execution error:', error);
                        appendMessage(`Failed to execute command: ${error.message}`, 'error');
                    }
                }
            }

        } catch (error) {
            console.error('Error:', error);
            appendMessage(`Error: ${error.message}`, 'error');
        } finally {
            // Re-enable input and button
            messageInput.disabled = false;
            sendButton.disabled = false;
            sendButton.textContent = 'Send';
            messageInput.focus();
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
    sendButton.addEventListener('click', () => sendMessage());
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Focus input on popup open
    userInput.focus();
});

async function handleUserInput(message, settings = {}) {
    try {
        // Send message to background script with settings
        const response = await chrome.runtime.sendMessage({
            type: 'SEND_MESSAGE',
            message: message,
            settings: settings
        });
        
        if (response.error) {
            throw new Error(response.error);
        }

        return response.reply;
    } catch (error) {
        console.error('Error handling user input:', error);
        throw error;
    }
}

async function handleScreenshotCommand(message) {
    try {
        const screenshotResult = await chrome.runtime.sendMessage({ type: 'TAKE_SCREENSHOT' });
        if (screenshotResult.error) {
            throw new Error(screenshotResult.error);
        }
        return screenshotResult.screenshot;
    } catch (error) {
        console.error('Screenshot error:', error);
        return null;
    }
} 