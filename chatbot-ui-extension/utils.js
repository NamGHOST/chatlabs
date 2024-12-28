// Utility functions for handling user confirmations and sensitive operations

// Configuration for sensitive actions that require confirmation
export const SENSITIVE_ACTIONS = {
    editGoogleDoc: true,
    editNotion: true,
    fillForm: true,
    submitForm: true
};

// Create and show a confirmation dialog
export async function showConfirmationDialog(action, details) {
    return new Promise((resolve) => {
        const dialog = document.createElement('div');
        dialog.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 10000; max-width: 400px; width: 90%;';
        
        const message = document.createElement('p');
        message.textContent = `The extension wants to perform the following action: ${action}`;
        
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = 'display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;';
        
        const confirmButton = document.createElement('button');
        confirmButton.textContent = 'Confirm';
        confirmButton.style.cssText = 'padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;';
        
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.style.cssText = 'padding: 8px 16px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;';
        
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(confirmButton);
        
        dialog.appendChild(message);
        dialog.appendChild(buttonContainer);
        
        document.body.appendChild(dialog);
        
        confirmButton.onclick = () => {
            document.body.removeChild(dialog);
            resolve(true);
        };
        
        cancelButton.onclick = () => {
            document.body.removeChild(dialog);
            resolve(false);
        };
    });
}

// Show progress indicator
export function showProgress(message) {
    const progress = document.createElement('div');
    progress.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: rgba(0,0,0,0.8); color: white; padding: 10px 20px; border-radius: 4px; z-index: 10000;';
    progress.textContent = message;
    document.body.appendChild(progress);
    
    return {
        update: (newMessage) => {
            progress.textContent = newMessage;
        },
        remove: () => {
            document.body.removeChild(progress);
        }
    };
}

// Rate limiting implementation
const rateLimits = {
    editGoogleDoc: { max: 5, interval: 60000 }, // 5 edits per minute
    editNotion: { max: 5, interval: 60000 },
    fillForm: { max: 10, interval: 60000 }
};

const actionCounts = new Map();

export function checkRateLimit(actionType) {
    const limit = rateLimits[actionType];
    if (!limit) return true;
    
    const now = Date.now();
    const counts = actionCounts.get(actionType) || [];
    const recentCounts = counts.filter(timestamp => now - timestamp < limit.interval);
    
    if (recentCounts.length >= limit.max) {
        return false;
    }
    
    recentCounts.push(now);
    actionCounts.set(actionType, recentCounts);
    return true;
}

// Input validation
export function validateInput(input, type) {
    switch (type) {
        case 'url':
            try {
                new URL(input);
                return true;
            } catch {
                return false;
            }
        case 'selector':
            return typeof input === 'string' && input.trim().length > 0;
        case 'text':
            return typeof input === 'string';
        default:
            return true;
    }
}

// Error logging
export function logError(error, context) {
    console.error('Extension Error:', {
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString()
    });
} 