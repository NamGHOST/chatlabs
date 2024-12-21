// Listen for messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'PAGE_INFO') {
        // Get relevant page information
        const pageInfo = {
            title: document.title,
            url: window.location.href,
            selectedText: window.getSelection().toString()
        };
        sendResponse(pageInfo);
    }
    return true;
});

// Optional: Add a floating button for quick access to the chatbot
function addChatButton() {
    const button = document.createElement('div');
    button.id = 'chatbot-ui-button';
    button.innerHTML = '💬';
    button.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        background-color: #007bff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: white;
        font-size: 24px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 10000;
    `;

    button.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
    });

    document.body.appendChild(button);
}

// Uncomment the following line to add the floating button
// addChatButton();
