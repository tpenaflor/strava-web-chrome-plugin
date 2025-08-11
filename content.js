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

        // Try multiple strategies to find a good button container
        let buttonContainer = findButtonContainer();

        if (!buttonContainer) {
            console.log('Strava Analyzer: Could not find suitable button container');
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
        insertButtonInContainer(buttonContainer, analyzeButton);
        console.log('Strava Analyzer: Button injected successfully');
    }

    // Find the best container for the button
    function findButtonContainer() {
        // Strategy 1: Look for specific Strava action containers
        const containers = [
            '.activity-actions',
            '.actions',
            '.btn-group',
            '[class*="action"]',
            '[class*="button"]',
            '.activity-summary-container .btn-group',
            '.activity-summary .actions',
            'section[class*="actions"]',
            'div[class*="actions"]'
        ];

        for (const selector of containers) {
            const container = document.querySelector(selector);
            if (container && isValidContainer(container)) {
                return container;
            }
        }

        // Strategy 2: Find containers with existing buttons
        const existingButtons = document.querySelectorAll('.btn, button, [role="button"]');
        for (const button of existingButtons) {
            const parent = button.parentElement;
            if (parent && isValidContainer(parent) && hasMultipleButtons(parent)) {
                return parent;
            }
        }

        // Strategy 3: Look for edit button specifically and use its parent
        const editSelectors = [
            '[data-testid="edit-activity-button"]',
            '.btn-edit',
            'a[href*="/edit"]',
            'button[class*="edit"]',
            '[title*="edit"]',
            '[title*="Edit"]'
        ];

        for (const selector of editSelectors) {
            const editButton = document.querySelector(selector);
            if (editButton) {
                const parent = editButton.parentElement;
                if (parent && isValidContainer(parent)) {
                    return parent;
                }
            }
        }

        // Strategy 4: Create our own container near the activity header
        const activityHeader = document.querySelector('h1, .activity-name, [class*="title"]');
        if (activityHeader) {
            const newContainer = document.createElement('div');
            newContainer.className = 'strava-analyzer-container';
            newContainer.style.cssText = 'margin: 15px 0; padding: 10px 0; border-top: 1px solid #eee;';
            
            // Insert after the header or its parent section
            const insertPoint = activityHeader.closest('section') || activityHeader.parentElement;
            if (insertPoint && insertPoint.parentElement) {
                insertPoint.parentElement.insertBefore(newContainer, insertPoint.nextSibling);
                return newContainer;
            }
        }

        return null;
    }

    // Check if a container is suitable for button insertion
    function isValidContainer(container) {
        if (!container) return false;
        
        // Avoid headers, navigation, footers
        const invalidSelectors = ['nav', 'header', 'footer', '.navbar', '.navigation'];
        for (const sel of invalidSelectors) {
            if (container.matches(sel) || container.closest(sel)) {
                return false;
            }
        }

        // Check if container is visible and not tiny
        const rect = container.getBoundingClientRect();
        return rect.width > 50 && rect.height > 20;
    }

    // Check if container has multiple buttons (good sign it's an action area)
    function hasMultipleButtons(container) {
        const buttons = container.querySelectorAll('.btn, button, [role="button"]');
        return buttons.length >= 2;
    }

    // Insert button into container with appropriate styling
    function insertButtonInContainer(container, button) {
        // If container already has buttons, match their style
        const existingButtons = container.querySelectorAll('.btn, button');
        if (existingButtons.length > 0) {
            const firstButton = existingButtons[0];
            const computedStyle = window.getComputedStyle(firstButton);
            
            // Copy some styling to blend in
            button.style.marginRight = computedStyle.marginRight || '8px';
            button.style.marginLeft = computedStyle.marginLeft || '0px';
            
            // Try to match button classes if they exist
            if (firstButton.className.includes('btn-sm')) {
                button.classList.add('btn-sm');
            }
        }

        container.appendChild(button);
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
            console.log('Strava Analyzer: Activity page detected, attempting button injection');
            
            // Try immediate injection
            injectAnalyzeButton();
            
            // Set up observers for dynamic content
            observePageChanges();
            
            // Retry injection with progressive delays for slow-loading content
            const retryDelays = [1000, 3000, 5000];
            retryDelays.forEach(delay => {
                setTimeout(() => {
                    if (!document.getElementById('strava-analyzer-btn')) {
                        console.log(`Strava Analyzer: Retrying button injection after ${delay}ms`);
                        injectAnalyzeButton();
                    }
                }, delay);
            });
        }
    }

    // Observe page changes for dynamic content loading
    function observePageChanges() {
        // Watch for DOM changes that might add button containers
        const observer = new MutationObserver((mutations) => {
            let shouldRetry = false;
            
            mutations.forEach((mutation) => {
                // Check if new nodes were added that might contain button areas
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = node;
                        if (element.querySelector && 
                            (element.querySelector('.btn, button, [class*="action"]') || 
                             element.matches('.btn, button, [class*="action"]'))) {
                            shouldRetry = true;
                        }
                    }
                });
            });
            
            if (shouldRetry && !document.getElementById('strava-analyzer-btn')) {
                console.log('Strava Analyzer: DOM change detected, retrying button injection');
                setTimeout(injectAnalyzeButton, 500);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Stop observing after 30 seconds to avoid memory leaks
        setTimeout(() => observer.disconnect(), 30000);
    }

    // Handle navigation changes (for single-page app behavior)
    let currentUrl = window.location.href;
    function checkForUrlChange() {
        if (window.location.href !== currentUrl) {
            console.log('Strava Analyzer: URL change detected:', window.location.href);
            currentUrl = window.location.href;
            
            // Remove existing button if URL changed
            const existingButton = document.getElementById('strava-analyzer-btn');
            if (existingButton) {
                existingButton.remove();
            }
            
            // Reinitialize after a brief delay
            setTimeout(initialize, 500);
        }
    }

    // Start observing
    initialize();
    
    // Check for URL changes more frequently since Strava is a SPA
    setInterval(checkForUrlChange, 1000);

    // Also listen for various navigation events
    window.addEventListener('popstate', () => {
        console.log('Strava Analyzer: Popstate event detected');
        setTimeout(initialize, 500);
    });
    
    // Listen for pushstate events (if available)
    const originalPushState = history.pushState;
    history.pushState = function() {
        originalPushState.apply(history, arguments);
        console.log('Strava Analyzer: Pushstate event detected');
        setTimeout(initialize, 500);
    };
    
    const originalReplaceState = history.replaceState;
    history.replaceState = function() {
        originalReplaceState.apply(history, arguments);
        console.log('Strava Analyzer: Replacestate event detected');
        setTimeout(initialize, 500);
    };
})();