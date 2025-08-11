// LLM Client for Strava Activity Analyzer
// Supports multiple LLM providers

class LLMClient {
    constructor(config) {
        this.config = config;
        this.provider = config.provider || 'openai';
        this.apiKey = config.apiKey;
        this.localUrl = config.localUrl;
        this.model = config.model || this.getDefaultModel();
        this.temperature = config.temperature || 0.7;
    }

    getDefaultModel() {
        switch (this.provider) {
            case 'openai':
                return 'gpt-3.5-turbo';
            case 'anthropic':
                return 'claude-3-haiku-20240307';
            case 'local':
                return 'llama2';
            default:
                return 'gpt-3.5-turbo';
        }
    }

    async analyzeActivity(metrics) {
        const prompt = this.buildAnalysisPrompt(metrics);
        
        switch (this.provider) {
            case 'openai':
                return await this.callOpenAI(prompt);
            case 'anthropic':
                return await this.callAnthropic(prompt);
            case 'local':
                return await this.callLocalLLM(prompt);
            default:
                throw new Error(`Unsupported LLM provider: ${this.provider}`);
        }
    }

    buildAnalysisPrompt(metrics) {
        const activityType = metrics.activity_type || 'Unknown';
        const duration = this.formatDuration(metrics.duration_seconds);
        const distance = this.formatDistance(metrics.distance_meters);
        const speed = this.formatSpeed(metrics.average_speed);
        const elevation = metrics.elevation_gain ? `${Math.round(metrics.elevation_gain)}m` : 'N/A';
        const heartRate = metrics.average_heart_rate ? `${Math.round(metrics.average_heart_rate)} bpm` : 'N/A';
        const power = metrics.average_power ? `${Math.round(metrics.average_power)}W` : 'N/A';
        const cadence = metrics.average_cadence ? `${Math.round(metrics.average_cadence)} rpm` : 'N/A';

        return `You are an expert sports performance analyst. Please analyze the following ${activityType} activity data and provide insights:

ACTIVITY SUMMARY:
- Duration: ${duration}
- Distance: ${distance}
- Average Speed: ${speed}
- Elevation Gain: ${elevation}
- Average Heart Rate: ${heartRate}
- Average Power: ${power}
- Average Cadence: ${cadence}
- Calories: ${metrics.calories || 'N/A'}

${metrics.lap_data && metrics.lap_data.length > 0 ? `
LAP DATA:
${metrics.lap_data.map((lap, i) => `
Lap ${i + 1}: ${this.formatDuration(lap.duration)} - ${this.formatDistance(lap.distance)} - Avg HR: ${lap.avg_heart_rate || 'N/A'} - Avg Power: ${lap.avg_power || 'N/A'}W`).join('')}
` : ''}

Please provide a comprehensive analysis including:

1. **Performance Summary**: Overall assessment of the activity
2. **Strengths**: What went well in this activity
3. **Areas for Improvement**: Specific aspects that could be optimized
4. **Training Insights**: What this data tells us about fitness and training adaptations
5. **Recommendations**: Specific suggestions for future training or race strategy

${activityType === 'cycling' || activityType === 'running' ? `
6. **Zone Analysis**: Comment on intensity distribution if heart rate/power data is available
7. **Pacing Strategy**: Analysis of pacing throughout the activity
` : ''}

Please format your response in HTML with proper headings and bullet points for easy reading. Keep the analysis practical and actionable.`;
    }

    async callOpenAI(prompt) {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert sports performance analyst specializing in endurance activities. Provide detailed, actionable insights based on activity data.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: this.temperature,
                    max_tokens: 2000
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;

        } catch (error) {
            console.error('OpenAI API error:', error);
            throw new Error(`OpenAI analysis failed: ${error.message}`);
        }
    }

    async callAnthropic(prompt) {
        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'x-api-key': this.apiKey,
                    'Content-Type': 'application/json',
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: this.model,
                    max_tokens: 2000,
                    temperature: this.temperature,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ]
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Anthropic API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            return data.content[0].text;

        } catch (error) {
            console.error('Anthropic API error:', error);
            throw new Error(`Anthropic analysis failed: ${error.message}`);
        }
    }

    async callLocalLLM(prompt) {
        try {
            if (!this.localUrl) {
                throw new Error('Local LLM URL not configured');
            }

            // Support for common local LLM APIs (Ollama, text-generation-webui, etc.)
            const response = await fetch(`${this.localUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    prompt: prompt,
                    temperature: this.temperature,
                    max_tokens: 2000,
                    stream: false
                })
            });

            if (!response.ok) {
                // Try alternative API format
                return await this.callLocalLLMAlternative(prompt);
            }

            const data = await response.json();
            return data.response || data.text || data.content;

        } catch (error) {
            console.error('Local LLM API error:', error);
            throw new Error(`Local LLM analysis failed: ${error.message}`);
        }
    }

    async callLocalLLMAlternative(prompt) {
        try {
            // Try text-generation-webui format
            const response = await fetch(`${this.localUrl}/api/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: this.temperature,
                    max_tokens: 2000
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;

        } catch (error) {
            // Fallback to mock analysis if local LLM is not available
            console.warn('Local LLM not available, using mock analysis');
            return this.getMockAnalysis();
        }
    }

    getMockAnalysis() {
        return `
        <h4>🔬 AI Analysis (Demo Mode)</h4>
        <p><em>Note: This is a demonstration analysis. Configure your LLM provider in the extension options for real AI insights.</em></p>
        
        <h4>📊 Performance Summary</h4>
        <ul>
            <li>This appears to be a solid training session with good overall metrics</li>
            <li>Your effort level seems appropriate for the activity type and duration</li>
            <li>Physiological markers indicate a well-executed workout</li>
        </ul>
        
        <h4>💪 Strengths</h4>
        <ul>
            <li>Consistent effort throughout the activity</li>
            <li>Good balance between intensity and duration</li>
            <li>Effective use of available training time</li>
        </ul>
        
        <h4>🎯 Areas for Improvement</h4>
        <ul>
            <li>Consider incorporating more interval work for power development</li>
            <li>Monitor pacing strategy in longer efforts</li>
            <li>Focus on maintaining consistent cadence throughout</li>
        </ul>
        
        <h4>📈 Training Insights</h4>
        <ul>
            <li>Your cardiovascular system is responding well to current training load</li>
            <li>Power output suggests good neuromuscular adaptation</li>
            <li>Recovery between efforts appears adequate</li>
        </ul>
        
        <h4>🎖️ Recommendations</h4>
        <ul>
            <li>Continue with current training approach while gradually increasing load</li>
            <li>Add specific interval sessions to target different energy systems</li>
            <li>Consider incorporating recovery rides between harder efforts</li>
            <li>Monitor weekly training stress to avoid overreaching</li>
        </ul>
        
        <p><strong>Configure your preferred LLM provider in the extension options to get personalized, detailed analysis of your activities!</strong></p>
        `;
    }

    // Utility functions for formatting
    formatDuration(seconds) {
        if (!seconds) return 'N/A';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }

    formatDistance(meters) {
        if (!meters) return 'N/A';
        
        if (meters >= 1000) {
            return `${(meters / 1000).toFixed(2)} km`;
        } else {
            return `${Math.round(meters)} m`;
        }
    }

    formatSpeed(metersPerSecond) {
        if (!metersPerSecond) return 'N/A';
        
        const kmh = metersPerSecond * 3.6;
        return `${kmh.toFixed(1)} km/h`;
    }
}