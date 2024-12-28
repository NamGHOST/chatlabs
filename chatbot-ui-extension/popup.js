document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const executeBtn = document.getElementById('executeBtn');
    const status = document.getElementById('status');

    executeBtn.addEventListener('click', async () => {
        const task = taskInput.value.trim();
        if (!task) {
            showStatus('Please enter a task', true);
            return;
        }

        executeBtn.disabled = true;
        showStatus('Starting computer use task...');

        // Start the computer use flow
        chrome.runtime.sendMessage({
            type: 'START_COMPUTER_USE',
            task: task
        }, (response) => {
            if (response && response.success) {
                showStatus('Task completed successfully!');
            } else {
                showStatus('Task failed: ' + (response?.error || 'Unknown error'), true);
            }
            executeBtn.disabled = false;
        });
    });

    function showStatus(message, isError = false) {
        status.textContent = message;
        status.className = isError ? 'error' : 'success';
    }
}); 