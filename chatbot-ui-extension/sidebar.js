class Sidebar {
    constructor() {
        this.taskInput = document.getElementById('taskInput');
        this.executeBtn = document.getElementById('executeBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.progressContainer = document.getElementById('progressContainer');
        this.outputContainer = document.getElementById('outputContainer');
        this.currentStep = 0;
        this.maxSteps = 10;
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.executeBtn.addEventListener('click', () => this.executeTask());
        this.stopBtn.addEventListener('click', () => this.stopTask());
        
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.type === 'STATUS_UPDATE') {
                this.updateStatus(request.status);
            }
        });
    }

    async executeTask() {
        const task = this.taskInput.value.trim();
        if (!task) {
            this.updateStatus({
                type: 'error',
                message: 'Please enter a task'
            });
            return;
        }

        try {
            this.updateStatus({
                type: 'info',
                message: 'Starting task...'
            });
            
            this.progressContainer.style.display = 'block';
            this.executeBtn.disabled = true;
            this.stopBtn.disabled = false;
            this.clearOutput();

            const response = await chrome.runtime.sendMessage({
                type: 'COMPUTER_USE',
                query: task
            });

            if (response.success) {
                this.updateStatus({
                    type: 'success',
                    message: response.message || 'Task completed successfully!'
                });
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            this.updateStatus({
                type: 'error',
                message: error.message
            });
            console.error('Task execution error:', error);
        } finally {
            this.executeBtn.disabled = false;
            this.stopBtn.disabled = true;
        }
    }

    async stopTask() {
        try {
            await chrome.runtime.sendMessage({ type: 'STOP_TASK' });
            this.updateStatus({
                type: 'info',
                message: 'Task stopped by user'
            });
            this.executeBtn.disabled = false;
            this.stopBtn.disabled = true;
        } catch (error) {
            console.error('Error stopping task:', error);
            this.updateStatus({
                type: 'error',
                message: 'Failed to stop task: ' + error.message
            });
        }
    }

    updateStatus(status) {
        const { type, message, details } = status;
        
        // Create status element
        const statusElement = document.createElement('div');
        statusElement.className = `status-item ${type || 'info'}`;
        
        // Add timestamp
        const timeSpan = document.createElement('span');
        timeSpan.className = 'timestamp';
        timeSpan.textContent = new Date().toLocaleTimeString();
        statusElement.appendChild(timeSpan);
        
        // Add message
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        messageDiv.textContent = message;
        statusElement.appendChild(messageDiv);
        
        // Add details if available
        if (details) {
            try {
                const detailsDiv = document.createElement('div');
                detailsDiv.className = 'details';
                
                if (typeof details === 'string') {
                    detailsDiv.textContent = details;
                } else if (details.currentPage) {
                    // Format page state information
                    const pageInfo = details.currentPage;
                    const formattedDetails = [
                        `URL: ${pageInfo.url || 'N/A'}`,
                        `Title: ${pageInfo.title || 'N/A'}`,
                        `Type: ${pageInfo.type || 'N/A'}`,
                        'Elements:',
                        `  Buttons: ${(pageInfo.elements?.buttons?.length || 0)}`,
                        `  Forms: ${(pageInfo.elements?.forms?.length || 0)}`,
                        `  Search Inputs: ${(pageInfo.elements?.searchInputs?.length || 0)}`,
                        `Task Running: ${details.taskRunning ? 'Yes' : 'No'}`,
                        details.extractedContent ? `Content: ${details.extractedContent}` : ''
                    ].filter(line => line).join('\n');
                    
                    detailsDiv.textContent = formattedDetails;
                } else {
                    // Format other object details
                    const formattedDetails = JSON.stringify(details, null, 2)
                        .replace(/[{[]/g, '')
                        .replace(/[}\]]/g, '')
                        .replace(/"/g, '')
                        .replace(/,\n/g, '\n')
                        .trim();
                    detailsDiv.textContent = formattedDetails;
                }
                
                if (detailsDiv.textContent) {
                    statusElement.appendChild(detailsDiv);
                }
            } catch (error) {
                console.error('Error formatting details:', error);
                // Add error information as details
                const errorDiv = document.createElement('div');
                errorDiv.className = 'details error';
                errorDiv.textContent = `Error formatting details: ${error.message}`;
                statusElement.appendChild(errorDiv);
            }
        }
        
        // Add to output container and scroll
        try {
            this.outputContainer.appendChild(statusElement);
            this.outputContainer.scrollTop = this.outputContainer.scrollHeight;
        } catch (error) {
            console.error('Error updating output container:', error);
        }
        
        // Update progress if needed
        try {
            if (type === 'thinking') {
                this.updateProgress(-1); // Indeterminate progress
            } else if (type === 'success') {
                this.updateProgress(100); // Complete
            } else if (type === 'error') {
                this.updateProgress(0); // Reset progress
            }
        } catch (error) {
            console.error('Error updating progress:', error);
        }
    }

    updateProgress(percent) {
        const progress = document.getElementById('progress');
        if (!progress) {
            console.warn('Progress element not found');
            return;
        }

        try {
            if (percent < 0) {
                // Indeterminate progress
                progress.classList.add('indeterminate');
                progress.style.width = '100%';
            } else {
                // Determinate progress
                progress.classList.remove('indeterminate');
                progress.style.width = `${percent}%`;
            }
        } catch (error) {
            console.error('Error updating progress:', error);
        }
    }

    clearOutput() {
        try {
            // Clear output container
            if (this.outputContainer) {
                this.outputContainer.innerHTML = '';
            }

            // Reset progress
            const progress = document.getElementById('progress');
            if (progress) {
                progress.style.width = '0%';
                progress.classList.remove('indeterminate');
            }
        } catch (error) {
            console.error('Error clearing output:', error);
        }
    }
}

// Initialize the sidebar when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.sidebar = new Sidebar();
}); 