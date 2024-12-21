// Store session context
let sessionContext = {};

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'SEND_MESSAGE') {
        handleMessage(request.message, request.context)
            .then(response => sendResponse({ reply: response }))
            .catch(error => sendResponse({ error: error.message }));
        return true;
    } else if (request.type === 'OPEN_FEATURE') {
        handleFeature(request.feature, request.context)
            .then(response => sendResponse({ success: true, data: response }))
            .catch(error => sendResponse({ error: error.message }));
        return true;
    }
});

// Handle the message by sending it to your chat app
async function handleMessage(message, context = {}) {
    try {
        // Get current tab's context if needed
        if (context.needsPageContext) {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const pageContext = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_CONTEXT' });
            context = { ...context, pageContext };
        }

        console.log('Sending message to chat service:', {
            message,
            context
        });

        // Send to your app's chat endpoint
        const response = await fetch('http://localhost:3000/api/chat/openrouter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/plain'
            },
            body: JSON.stringify({
                chatSettings: {
                    model: 'openai/gpt-4o-mini',
                    temperature: 0.7,
                    stream: true
                },
                messages: [{
                    role: 'user',
                    content: message
                }]
            })
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`API error: ${response.status} ${errorText}`);
        }

        // Read the response as text
        const responseText = await response.text();
        console.log('Response text:', responseText);

        return responseText;
    } catch (error) {
        console.error('Detailed error:', error);
        throw new Error(`Chat service error: ${error.message}. Please check if your chat app is running on localhost:3000`);
    }
}

// Handle opening different features
async function handleFeature(feature, context = {}) {
    const baseUrl = 'http://localhost:3000';
    
    try {
        switch (feature) {
            case 'splitview':
                chrome.tabs.create({ url: `${baseUrl}/splitview` });
                return { message: 'Split view opened in new tab' };
            
            case 'memodraw':
                chrome.tabs.create({ url: `${baseUrl}/memo-draw` });
                return { message: 'Memo draw opened in new tab' };
            
            case 'texttoimage':
                chrome.tabs.create({ url: `${baseUrl}/image-generation` });
                return { message: 'Text to image opened in new tab' };
            
            case 'youtube':
                chrome.tabs.create({ url: `${baseUrl}/youtube-summarizer` });
                return { message: 'YouTube summarizer opened in new tab' };
            
            case 'prompts':
            case 'assistants':
            case 'files':
            case 'plugins':
                chrome.tabs.create({ url: `${baseUrl}?feature=${feature}` });
                return { message: `Opening ${feature} in main app` };
            
            default:
                throw new Error('Unknown feature requested');
        }
    } catch (error) {
        console.error('Error handling feature:', error);
        throw error;
    }
}

// Initialize session context
chrome.runtime.onInstalled.addListener(() => {
    sessionContext = {
        workspaceId: null,
        token: null,
        model: 'openai/gpt-4o-mini'
    };
});
