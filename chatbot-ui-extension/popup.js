// Initialize state variables at the top level
let isAgentWorking = false;
let currentTaskController = null;
let chatContainer, featuresPanel, userInput, sendButton, chatMode, featuresMode, modelSelector;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements
    chatContainer = document.getElementById('chatContainer');
    featuresPanel = document.getElementById('featuresPanel');
    userInput = document.getElementById('userInput');
    sendButton = document.getElementById('sendButton');
    chatMode = document.getElementById('chatMode');
    featuresMode = document.getElementById('featuresMode');
    modelSelector = document.getElementById('modelSelector');

    // Initialize model selector
    const models = [
        { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
        { id: 'openai/gpt-4o-2024-08-06', name: 'GPT-4o' },
        { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku' },
        { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1' },
        { id: 'google/gemini-pro-1.5', name: 'Gemini Pro' }
    ];

    // Initialize feature buttons
    const features = [
        { id: 'screenshot', name: 'Take Screenshot', action: 'Take a screenshot' },
        { id: 'click', name: 'Click Element', action: 'Click an element' },
        { id: 'switch-tab', name: 'Switch Tab', action: 'Switch to another tab' },
        { id: 'navigate', name: 'Navigate', action: 'Navigate to URL' },
        { id: 'system-info', name: 'System Info', action: 'Show system info' },
        { id: 'cpu-usage', name: 'CPU Usage', action: 'Show CPU usage' },
        { id: 'memory', name: 'Memory Usage', action: 'Show memory usage' },
        { id: 'processes', name: 'Processes', action: 'List processes' }
    ];

    // Initialize features panel
    featuresPanel.innerHTML = features.map(feature => `
        <button class="feature-button" data-action="${feature.action}">
            ${feature.name}
        </button>
    `).join('');

    // Add feature button click handlers
    document.querySelectorAll('.feature-button').forEach(button => {
        button.addEventListener('click', () => {
            const action = button.dataset.action;
            if (action) {
                chatMode.click(); // Switch to chat mode
                sendMessage(action); // Send the action as a message
            }
        });
    });

    // Initialize models dropdown
    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = model.name;
        modelSelector.appendChild(option);
    });

    // Event listeners
    sendButton.addEventListener('click', () => {
        if (isAgentWorking && currentTaskController) {
            currentTaskController.abort();
        } else {
            sendMessage();
        }
    });

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
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
        featuresPanel.style.display = 'grid';
    });

    // Focus input on popup open
    userInput.focus();

    console.log('Popup initialized successfully.');
});

// Update sendMessage function with logging
async function sendMessage(customMessage = null) {
    if (!userInput || !sendButton) {
        console.error('User input or send button not found.');
        return;
    }
    
    const message = customMessage || userInput.value.trim();
    if (!message) {
        console.warn('Empty message. Aborting sendMessage.');
        return;
    }

    console.log('Sending message:', message);

    // Add user message to chat
    appendMessage(message, 'user');
    if (!customMessage) {
        userInput.value = '';
    }

    try {
        // Update UI state
        isAgentWorking = true;
        sendButton.textContent = 'Stop';
        sendButton.classList.add('stop');
        userInput.disabled = true;

        // Add loading message
        const loadingMessage = appendMessage('Agent is working ...', 'system', true);
        console.log('Loading message appended.');

        console.log('Sending message to background:', message);

        // Send message to background script
        const response = await chrome.runtime.sendMessage({
            type: 'SEND_MESSAGE',
            message: message,
            settings: {
                model: modelSelector.value,
                stream: false
            }
        });

        console.log('Received response from background:', response);

        // Remove loading message
        if (loadingMessage) {
            loadingMessage.remove();
            console.log('Loading message removed.');
        }

        // Handle the response
        if (response.error) {
            throw new Error(response.error);
        }

        let replyText = '';

        if (typeof response === 'string') {
            replyText = response;
        } else if (response.reply) {
            replyText = response.reply;
        } else if (response.choices?.[0]?.message?.content) {
            replyText = response.choices[0].message.content;
        } else if (response.message?.content) {
            replyText = response.message.content;
        }

        console.log('Extracted replyText:', replyText);

        if (replyText) {
            // Format and display the response
            const formattedResponse = formatResponse(replyText);
            appendMessage(formattedResponse, 'bot');
            console.log('Bot message appended.');
            
            // Handle automation commands if any
            if (replyText.includes('EXECUTE:')) {
                const commands = replyText.split('EXECUTE:').slice(1);
                for (const commandText of commands) {
                    try {
                        const command = JSON.parse(commandText.split('\n')[0]);
                        const result = await executeAction(command);
                        if (result && result.success) {
                            appendMessage(`✅ Action completed: ${command.type}`, 'system');
                        }
                    } catch (error) {
                        console.error('Command execution error:', error);
                        appendMessage(`❌ Failed to execute command: ${error.message}`, 'error');
                    }
                }
            }
        } else {
            throw new Error('No response content found');
        }

    } catch (error) {
        console.error('Error during sendMessage:', error);
        appendMessage(`❌ Error: ${error.message}`, 'error');
    } finally {
        // Reset UI state
        isAgentWorking = false;
        currentTaskController = null;
        sendButton.textContent = 'Send';
        sendButton.classList.remove('stop');
        userInput.disabled = false;
        userInput.focus();
        console.log('UI state reset.');
    }
}

// Helper function to format response
function formatResponse(text) {
    // Split into content and commands if present
    if (text.includes('EXECUTE:')) {
        const parts = text.split('EXECUTE:');
        return parts[0].trim(); // Return only the text content
    }
    return text;
}

// Update appendMessage function
function appendMessage(text, type, isTemp = false) {
    if (!chatContainer) return null;

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${type}-message`);
    
    if (isTemp) {
        messageDiv.classList.add('temp-message');
        messageDiv.innerHTML = text; // Allow emoji rendering
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        return messageDiv;
    }

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');

    // Handle different message types
    switch (type) {
        case 'bot':
            // Format bot messages with markdown-like styling
            contentDiv.innerHTML = text
                .split('\n')
                .map(line => {
                    if (line.startsWith('###')) {
                        return `<h3>${line.replace('###', '').trim()}</h3>`;
                    }
                    if (line.includes('**')) {
                        return line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    }
                    if (/^\d+\./.test(line)) {
                        return `<div class="list-item">${line}</div>`;
                    }
                    return line;
                })
                .join('<br>');
            break;
        case 'system':
            // System messages with emoji
            contentDiv.innerHTML = text;
            break;
        default:
            // User and error messages as plain text
            contentDiv.textContent = text;
    }

    messageDiv.appendChild(contentDiv);
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return messageDiv;
}

// Execute action function
async function executeAction(command) {
    return await chrome.runtime.sendMessage({
        type: 'EXECUTE_ACTION',
        action: command
    });
} 