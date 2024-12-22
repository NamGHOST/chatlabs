async function executeReply(action) {
    try {
        const { comment } = action;
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
            await chrome.tabs.sendMessage(tab.id, { type: 'EXECUTE_ACTION', action: { type: 'reply', comment } });
            return { success: true };
        } else {
            throw new Error('No active tab found');
        }
    } catch (error) {
        console.error('Reply action error:', error);
        return { success: false, error: error.message };
    }
} 