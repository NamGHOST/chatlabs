// Default configuration
const defaultConfig = {
    apiEndpoint: 'http://localhost:3000/api/chat/public',
    computerUseEndpoint: 'http://localhost:3000/api/claude/computer-use',
    defaultModel: 'anthropic/claude-3.5-sonnet',
    temperature: 0.7,
    maxTokens: 2000,
    provider: 'openrouter'
};

// Function to save settings
async function saveSettings(settings) {
    await chrome.storage.local.set({
        apiConfig: {
            ...defaultConfig,
            ...settings
        }
    });
}

// Function to get current configuration
async function getConfig() {
    const config = await chrome.storage.local.get('apiConfig');
    return config.apiConfig || defaultConfig;
}

// Function to save selected model
async function saveSelectedModel(modelId) {
    await chrome.storage.local.set({
        selectedModel: modelId
    });
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        defaultConfig,
        saveSettings,
        getConfig,
        saveSelectedModel
    };
}