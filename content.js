// Content script for Strava activity pages
(function() {
    'use strict';

    // Check if we're on a Strava activity page
    function isActivityPage() {
        return window.location.pathname.match(/^\/activities\/\d+$/);
    }

    // Check if this is the user's own activity
    function isOwnActivity() {
        // Look for edit/delete buttons which only appear on own activities
        const editButton = document.querySelector('[data-testid="edit-activity-button"]') || 
                          document.querySelector('.btn-edit') ||
                          document.querySelector('a[href*="/edit"]');
        return !!editButton;
    }

    // Get activity ID from URL
    function getActivityId() {
        const match = window.location.pathname.match(/\/activities\/(\d+)/);
        return match ? match[1] : null;
    }

    // Create and inject the analyze button
    function injectAnalyzeButton() {
        if (document.getElementById('strava-analyzer-btn')) {
            return; // Button already exists
        }

        const activityId = getActivityId();
        if (!activityId || !isOwnActivity()) {
            return;
        }

        // Find the action buttons container
        let buttonContainer = document.querySelector('.activity-actions') ||
                             document.querySelector('.actions') ||
                             document.querySelector('.btn-group') ||
                             document.querySelector('[class*="action"]');

        if (!buttonContainer) {
            // Try to find any button and use its parent
            const existingButton = document.querySelector('.btn') || 
                                 document.querySelector('button') ||
                                 document.querySelector('[data-testid*="button"]');
            if (existingButton) {
                buttonContainer = existingButton.parentElement;
            }
        }

        if (!buttonContainer) {
            console.log('Strava Analyzer: Could not find button container');
            return;
        }

        // Create the analyze button
        const analyzeButton = document.createElement('button');
        analyzeButton.id = 'strava-analyzer-btn';
        analyzeButton.className = 'btn btn-secondary strava-analyzer-button';
        analyzeButton.innerHTML = `
            <span id="analyzer-btn-text">🔬 Analyze with AI</span>
            <span id="analyzer-btn-loading" style="display: none;">
                <span class="spinner"></span> Analyzing...
            </span>
        `;
        analyzeButton.title = 'Download and analyze this activity with AI';

        // Add click handler
        analyzeButton.addEventListener('click', handleAnalyzeClick);

        // Insert the button
        buttonContainer.appendChild(analyzeButton);
        console.log('Strava Analyzer: Button injected successfully');
    }

    // Handle analyze button click
    async function handleAnalyzeClick(event) {
        event.preventDefault();
        
        const button = event.target.closest('#strava-analyzer-btn');
        const btnText = document.getElementById('analyzer-btn-text');
        const btnLoading = document.getElementById('analyzer-btn-loading');
        
        // Show loading state
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-block';
        button.disabled = true;

        try {
            const activityId = getActivityId();
            console.log('Strava Analyzer: Starting analysis for activity', activityId);

            // Send message to background script to handle the analysis
            const response = await chrome.runtime.sendMessage({
                action: 'analyzeActivity',
                activityId: activityId,
                url: window.location.href
            });

            if (response.success) {
                showAnalysisResult(response.analysis);
            } else {
                throw new Error(response.error || 'Analysis failed');
            }

        } catch (error) {
            console.error('Strava Analyzer: Error during analysis:', error);
            showError(error.message);
        } finally {
            // Reset button state
            btnText.style.display = 'inline-block';
            btnLoading.style.display = 'none';
            button.disabled = false;
        }
    }

    // Show analysis result in a modal
    function showAnalysisResult(analysis) {
        // Remove existing modal if any
        const existingModal = document.getElementById('strava-analyzer-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal
        const modal = document.createElement('div');
        modal.id = 'strava-analyzer-modal';
        modal.className = 'strava-analyzer-modal';
        modal.innerHTML = `
            <div class="strava-analyzer-modal-content">
                <div class="strava-analyzer-modal-header">
                    <h3>🔬 AI Activity Analysis</h3>
                    <button class="strava-analyzer-close">&times;</button>
                </div>
                <div class="strava-analyzer-modal-body">
                    <div class="analysis-content">${analysis}</div>
                </div>
                <div class="strava-analyzer-modal-footer">
                    <button class="btn btn-secondary strava-analyzer-close">Close</button>
                </div>
            </div>
        `;

        // Add close handlers
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('strava-analyzer-close')) {
                modal.remove();
            }
        });

        document.body.appendChild(modal);
    }

    // Show error message
    function showError(message) {
        // Create a simple error notification
        const notification = document.createElement('div');
        notification.className = 'strava-analyzer-error';
        notification.textContent = `Strava Analyzer Error: ${message}`;
        
        document.body.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // Initialize when page loads
    function initialize() {
        if (isActivityPage()) {
            // Wait a bit for Strava's dynamic content to load
            setTimeout(injectAnalyzeButton, 1000);
            
            // Also try again after a longer delay in case of slow loading
            setTimeout(injectAnalyzeButton, 3000);
        }
    }

    // Handle navigation changes (for single-page app behavior)
    let currentUrl = window.location.href;
    function checkForUrlChange() {
        if (window.location.href !== currentUrl) {
            currentUrl = window.location.href;
            initialize();
        }
    }

    // Start observing
    initialize();
    setInterval(checkForUrlChange, 1000);

    // Also listen for popstate events
    window.addEventListener('popstate', initialize);
})();