// Background service worker for Strava Activity Analyzer

// Import the FIT parser and LLM client
importScripts('fit-parser.js', 'llm-client.js');

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'analyzeActivity') {
        handleActivityAnalysis(request.activityId, request.url)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
        
        // Return true to indicate we'll send a response asynchronously
        return true;
    }
});

// Main analysis workflow
async function handleActivityAnalysis(activityId, activityUrl) {
    try {
        console.log('Starting analysis for activity:', activityId);

        // Step 1: Download the FIT file
        const fitData = await downloadFitFile(activityId);
        
        // Step 2: Parse the FIT file
        const metrics = await parseFitFile(fitData);
        
        // Step 3: Get LLM configuration
        const llmConfig = await getLLMConfig();
        
        // Step 4: Analyze with LLM
        const analysis = await analyzeWithLLM(metrics, llmConfig);
        
        return { success: true, analysis: analysis };
        
    } catch (error) {
        console.error('Analysis failed:', error);
        return { success: false, error: error.message };
    }
}

// Download FIT file from Strava
async function downloadFitFile(activityId) {
    try {
        // Strava's FIT file download URL (requires authentication)
        const fitUrl = `https://www.strava.com/activities/${activityId}/export_original`;
        
        console.log('Downloading FIT file from:', fitUrl);
        
        const response = await fetch(fitUrl, {
            method: 'GET',
            credentials: 'include', // Include cookies for authentication
            headers: {
                'Accept': 'application/octet-stream',
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to download FIT file: ${response.status} ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        console.log('FIT file downloaded, size:', arrayBuffer.byteLength, 'bytes');
        
        return arrayBuffer;
        
    } catch (error) {
        console.error('Error downloading FIT file:', error);
        throw new Error(`Could not download FIT file: ${error.message}`);
    }
}

// Parse FIT file and extract metrics
async function parseFitFile(fitData) {
    try {
        console.log('Parsing FIT file...');
        
        const parser = new FitParser();
        const parsedData = await parser.parse(fitData);
        
        // Extract key metrics from parsed data
        const metrics = extractMetrics(parsedData);
        
        console.log('Extracted metrics:', metrics);
        return metrics;
        
    } catch (error) {
        console.error('Error parsing FIT file:', error);
        throw new Error(`Could not parse FIT file: ${error.message}`);
    }
}

// Extract relevant metrics from parsed FIT data
function extractMetrics(parsedData) {
    const metrics = {
        activity_type: null,
        duration_seconds: 0,
        distance_meters: 0,
        average_speed: 0,
        max_speed: 0,
        elevation_gain: 0,
        average_heart_rate: 0,
        max_heart_rate: 0,
        average_power: 0,
        max_power: 0,
        average_cadence: 0,
        calories: 0,
        temperature: null,
        training_stress_score: null,
        intensity_factor: null,
        zones: {
            heart_rate: [],
            power: []
        },
        intervals: [],
        lap_data: []
    };

    try {
        // Extract session data (overall activity summary)
        if (parsedData.sessions && parsedData.sessions.length > 0) {
            const session = parsedData.sessions[0];
            
            metrics.activity_type = session.sport || session.sub_sport;
            metrics.duration_seconds = session.total_timer_time || session.total_elapsed_time;
            metrics.distance_meters = session.total_distance;
            metrics.average_speed = session.avg_speed;
            metrics.max_speed = session.max_speed;
            metrics.elevation_gain = session.total_ascent;
            metrics.average_heart_rate = session.avg_heart_rate;
            metrics.max_heart_rate = session.max_heart_rate;
            metrics.average_power = session.avg_power;
            metrics.max_power = session.max_power;
            metrics.average_cadence = session.avg_cadence;
            metrics.calories = session.total_calories;
            metrics.training_stress_score = session.training_stress_score;
            metrics.intensity_factor = session.intensity_factor;
        }

        // Extract lap data
        if (parsedData.laps && parsedData.laps.length > 0) {
            metrics.lap_data = parsedData.laps.map(lap => ({
                lap_number: lap.message_index,
                duration: lap.total_timer_time,
                distance: lap.total_distance,
                avg_speed: lap.avg_speed,
                max_speed: lap.max_speed,
                avg_heart_rate: lap.avg_heart_rate,
                max_heart_rate: lap.max_heart_rate,
                avg_power: lap.avg_power,
                max_power: lap.max_power,
                avg_cadence: lap.avg_cadence,
                elevation_gain: lap.total_ascent
            }));
        }

        // Calculate additional derived metrics
        if (metrics.duration_seconds > 0) {
            metrics.average_pace_per_km = metrics.distance_meters > 0 ? 
                (metrics.duration_seconds / (metrics.distance_meters / 1000)) : 0;
            
            if (metrics.average_power > 0 && metrics.duration_seconds > 0) {
                // Normalized Power approximation
                metrics.normalized_power = metrics.average_power * 1.05; // Rough estimate
            }
        }

        return metrics;
        
    } catch (error) {
        console.error('Error extracting metrics:', error);
        throw new Error('Failed to extract metrics from FIT data');
    }
}

// Get LLM configuration from storage
async function getLLMConfig() {
    try {
        const result = await chrome.storage.sync.get([
            'llmProvider',
            'apiKey',
            'localLlmUrl',
            'model',
            'temperature'
        ]);
        
        return {
            provider: result.llmProvider || 'openai',
            apiKey: result.apiKey || '',
            localUrl: result.localLlmUrl || '',
            model: result.model || 'gpt-3.5-turbo',
            temperature: result.temperature || 0.7
        };
        
    } catch (error) {
        console.error('Error getting LLM config:', error);
        throw new Error('Could not load LLM configuration');
    }
}

// Analyze metrics with LLM
async function analyzeWithLLM(metrics, config) {
    try {
        console.log('Analyzing with LLM...');
        
        if (!config.apiKey && config.provider !== 'local') {
            throw new Error('No API key configured. Please set up your LLM provider in the extension options.');
        }
        
        const llmClient = new LLMClient(config);
        const analysis = await llmClient.analyzeActivity(metrics);
        
        return analysis;
        
    } catch (error) {
        console.error('Error analyzing with LLM:', error);
        throw new Error(`LLM analysis failed: ${error.message}`);
    }
}