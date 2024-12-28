async function executeReply(action) {
    console.log('[executeReply] Called with action:', action);

    try {
        const { comment } = action;
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
            console.log('[executeReply] Sending EXECUTE_ACTION');
            await chrome.tabs.sendMessage(tab.id, { 
                type: 'EXECUTE_ACTION', 
                action: { 
                    type: 'input', 
                    selector: '#comment-field', 
                    text: comment 
                }
            });
            return { success: true };
        } else {
            throw new Error('No active tab found');
        }
    } catch (error) {
        console.error('Reply action error:', error);
        return { success: false, error: error.message };
    }
} 