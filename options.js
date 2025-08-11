// Options page functionality
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const llmProviderSelect = document.getElementById('llmProvider');
    const temperatureSlider = document.getElementById('temperature');
    const temperatureValue = document.getElementById('temperatureValue');
    const saveButton = document.getElementById('saveSettings');
    const resetButton = document.getElementById('resetSettings');
    const testButton = document.getElementById('testConnection');
    const saveStatus = document.getElementById('saveStatus');
    const testResult = document.getElementById('testResult');

    // Provider-specific config sections
    const openaiConfig = document.getElementById('openai-config');
    const anthropicConfig = document.getElementById('anthropic-config');
    const geminiConfig = document.getElementById('gemini-config');
    const localConfig = document.getElementById('local-config');

    // Form elements
    const openaiApiKey = document.getElementById('openaiApiKey');
    const openaiModel = document.getElementById('openaiModel');
    const anthropicApiKey = document.getElementById('anthropicApiKey');
    const anthropicModel = document.getElementById('anthropicModel');
    const geminiApiKey = document.getElementById('geminiApiKey');
    const geminiModel = document.getElementById('geminiModel');
    const localLlmUrl = document.getElementById('localLlmUrl');
    const localModel = document.getElementById('localModel');

    // Load saved settings
    loadSettings();

    // Event listeners
    llmProviderSelect.addEventListener('change', handleProviderChange);
    temperatureSlider.addEventListener('input', updateTemperatureDisplay);
    saveButton.addEventListener('click', saveSettings);
    resetButton.addEventListener('click', resetSettings);
    testButton.addEventListener('click', testConnection);

    function loadSettings() {
        chrome.storage.sync.get([
            'llmProvider',
            'apiKey',
            'localLlmUrl',
            'model',
            'temperature'
        ], function(result) {
            // Set provider
            llmProviderSelect.value = result.llmProvider || 'openai';
            handleProviderChange();

            // Set temperature
            temperatureSlider.value = result.temperature || 0.7;
            updateTemperatureDisplay();

            // Set provider-specific settings
            if (result.llmProvider === 'openai') {
                openaiApiKey.value = result.apiKey || '';
                openaiModel.value = result.model || 'gpt-3.5-turbo';
            } else if (result.llmProvider === 'anthropic') {
                anthropicApiKey.value = result.apiKey || '';
                anthropicModel.value = result.model || 'claude-3-haiku-20240307';
            } else if (result.llmProvider === 'gemini') {
                geminiApiKey.value = result.apiKey || '';
                geminiModel.value = result.model || 'gemini-1.5-flash';
            } else if (result.llmProvider === 'local') {
                localLlmUrl.value = result.localLlmUrl || 'http://localhost:11434';
                localModel.value = result.model || 'llama2';
            }
        });
    }

    function handleProviderChange() {
        const provider = llmProviderSelect.value;
        
        // Hide all provider configs
        openaiConfig.style.display = 'none';
        anthropicConfig.style.display = 'none';
        geminiConfig.style.display = 'none';
        localConfig.style.display = 'none';
        
        // Show selected provider config
        switch (provider) {
            case 'openai':
                openaiConfig.style.display = 'block';
                break;
            case 'anthropic':
                anthropicConfig.style.display = 'block';
                break;
            case 'gemini':
                geminiConfig.style.display = 'block';
                break;
            case 'local':
                localConfig.style.display = 'block';
                break;
        }
    }

    function updateTemperatureDisplay() {
        temperatureValue.textContent = temperatureSlider.value;
    }

    function saveSettings() {
        const provider = llmProviderSelect.value;
        let apiKey = '';
        let model = '';
        let localUrl = '';

        // Get provider-specific values
        switch (provider) {
            case 'openai':
                apiKey = openaiApiKey.value.trim();
                model = openaiModel.value;
                break;
            case 'anthropic':
                apiKey = anthropicApiKey.value.trim();
                model = anthropicModel.value;
                break;
            case 'gemini':
                apiKey = geminiApiKey.value.trim();
                model = geminiModel.value;
                break;
            case 'local':
                localUrl = localLlmUrl.value.trim();
                model = localModel.value.trim();
                break;
        }

        const settings = {
            llmProvider: provider,
            apiKey: apiKey,
            localLlmUrl: localUrl,
            model: model,
            temperature: parseFloat(temperatureSlider.value)
        };

        chrome.storage.sync.set(settings, function() {
            if (chrome.runtime.lastError) {
                showSaveStatus('Error saving settings: ' + chrome.runtime.lastError.message, 'error');
            } else {
                showSaveStatus('Settings saved successfully!', 'success');
            }
        });
    }

    function resetSettings() {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            chrome.storage.sync.clear(function() {
                if (chrome.runtime.lastError) {
                    showSaveStatus('Error resetting settings: ' + chrome.runtime.lastError.message, 'error');
                } else {
                    showSaveStatus('Settings reset to defaults', 'success');
                    loadSettings();
                }
            });
        }
    }

    async function testConnection() {
        const provider = llmProviderSelect.value;
        let config = {
            provider: provider,
            temperature: parseFloat(temperatureSlider.value)
        };

        // Get provider-specific config
        switch (provider) {
            case 'openai':
                config.apiKey = openaiApiKey.value.trim();
                config.model = openaiModel.value;
                break;
            case 'anthropic':
                config.apiKey = anthropicApiKey.value.trim();
                config.model = anthropicModel.value;
                break;
            case 'gemini':
                config.apiKey = geminiApiKey.value.trim();
                config.model = geminiModel.value;
                break;
            case 'local':
                config.localUrl = localLlmUrl.value.trim();
                config.model = localModel.value.trim();
                break;
        }

        // Validate configuration
        if (provider !== 'local' && !config.apiKey) {
            showTestResult('Please enter your API key', 'error');
            return;
        }

        if (provider === 'local' && !config.localUrl) {
            showTestResult('Please enter your local LLM URL', 'error');
            return;
        }

        showTestResult('Testing connection...', 'loading');
        testButton.disabled = true;

        try {
            // Test with a simple prompt
            const testMetrics = {
                activity_type: 'cycling',
                duration_seconds: 3600,
                distance_meters: 30000,
                average_speed: 8.33,
                elevation_gain: 500,
                average_heart_rate: 150,
                average_power: 200,
                calories: 800
            };

            // Import and test LLM client
            const llmClient = new LLMClient(config);
            const testPrompt = `Please respond with "Connection test successful" to verify the API is working.`;
            
            let response;
            switch (provider) {
                case 'openai':
                    response = await testOpenAI(config, testPrompt);
                    break;
                case 'anthropic':
                    response = await testAnthropic(config, testPrompt);
                    break;
                case 'gemini':
                    response = await testGemini(config, testPrompt);
                    break;
                case 'local':
                    response = await testLocalLLM(config, testPrompt);
                    break;
            }

            if (response && response.toLowerCase().includes('successful')) {
                showTestResult('✅ Connection successful! Your LLM is configured correctly.', 'success');
            } else {
                showTestResult('⚠️ Connection established but unexpected response. Check your model configuration.', 'success');
            }

        } catch (error) {
            console.error('Test connection error:', error);
            showTestResult(`❌ Connection failed: ${error.message}`, 'error');
        } finally {
            testButton.disabled = false;
        }
    }

    async function testOpenAI(config, prompt) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: config.model,
                messages: [{ role: 'user', content: prompt }],
                temperature: config.temperature,
                max_tokens: 50
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`OpenAI API error: ${response.status} - ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async function testAnthropic(config, prompt) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': config.apiKey,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: config.model,
                max_tokens: 50,
                temperature: config.temperature,
                messages: [{ role: 'user', content: prompt }]
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`Anthropic API error: ${response.status} - ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return data.content[0].text;
    }

    async function testGemini(config, prompt) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: config.temperature,
                    maxOutputTokens: 50
                }
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`Gemini API error: ${response.status} - ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
    }

    async function testLocalLLM(config, prompt) {
        // Try Ollama API format first
        try {
            const response = await fetch(`${config.localUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: config.model,
                    prompt: prompt,
                    temperature: config.temperature,
                    stream: false
                })
            });

            if (response.ok) {
                const data = await response.json();
                return data.response;
            }
        } catch (e) {
            // Continue to try alternative format
        }

        // Try text-generation-webui format
        const response = await fetch(`${config.localUrl}/api/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: prompt }],
                temperature: config.temperature,
                max_tokens: 50
            })
        });

        if (!response.ok) {
            throw new Error(`Local LLM error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    function showSaveStatus(message, type) {
        saveStatus.textContent = message;
        saveStatus.className = `save-status ${type}`;
        
        setTimeout(() => {
            saveStatus.style.display = 'none';
        }, 3000);
    }

    function showTestResult(message, type) {
        testResult.textContent = message;
        testResult.className = `test-result ${type}`;
    }
});