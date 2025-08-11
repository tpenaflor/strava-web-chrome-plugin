// Popup functionality
document.addEventListener('DOMContentLoaded', function() {
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const openOptionsButton = document.getElementById('openOptions');

    // Check current tab status
    checkCurrentTabStatus();

    // Event listeners
    openOptionsButton.addEventListener('click', openOptionsPage);

    async function checkCurrentTabStatus() {
        try {
            // Get current active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab || !tab.url) {
                updateStatus('error', '❌', 'Cannot access current page');
                return;
            }

            const url = tab.url;
            
            if (!url.includes('strava.com')) {
                updateStatus('info', 'ℹ️', 'Navigate to Strava to use this extension');
                return;
            }

            if (!url.match(/\/activities\/\d+/)) {
                updateStatus('info', '📊', 'Go to a Strava activity page to analyze it');
                return;
            }

            // Check if this is the user's own activity by injecting a small script
            try {
                const results = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: checkIfOwnActivity
                });

                if (results && results[0] && results[0].result) {
                    updateStatus('ready', '✅', 'Ready to analyze! Click the analyze button on the page');
                } else {
                    updateStatus('info', '👤', 'This appears to be someone else\'s activity');
                }
            } catch (error) {
                console.error('Error checking activity ownership:', error);
                updateStatus('info', '📈', 'Activity page detected');
            }

        } catch (error) {
            console.error('Error checking tab status:', error);
            updateStatus('error', '❌', 'Error checking page status');
        }
    }

    function checkIfOwnActivity() {
        // This function runs in the context of the web page
        const editButton = document.querySelector('[data-testid="edit-activity-button"]') || 
                          document.querySelector('.btn-edit') ||
                          document.querySelector('a[href*="/edit"]');
        return !!editButton;
    }

    function updateStatus(type, icon, text) {
        statusIndicator.className = `status-indicator ${type}`;
        statusIndicator.querySelector('.status-icon').textContent = icon;
        statusText.textContent = text;
    }

    function openOptionsPage() {
        chrome.runtime.openOptionsPage();
        window.close();
    }

    // Listen for tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete') {
            checkCurrentTabStatus();
        }
    });
});