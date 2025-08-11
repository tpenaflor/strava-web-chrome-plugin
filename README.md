# Strava Activity Analyzer Chrome Extension

A Chrome extension that adds AI-powered analysis to your Strava activities using various LLM providers.

## Features

- 🔬 **AI-Powered Analysis**: Get detailed insights about your Strava activities
- 🤖 **Multiple LLM Providers**: Support for OpenAI, Anthropic, Google Gemini, and local LLMs
- 📊 **FIT File Parsing**: Extracts detailed metrics from your activity data
- ⚡ **One-Click Analysis**: Simple button integration into Strava activity pages
- 🔧 **Configurable**: Easy setup for different AI providers

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. Configure your LLM provider in the extension options

## Configuration

### OpenAI Setup
1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Open the extension options
3. Select "OpenAI (GPT)" as provider
4. Enter your API key
5. Choose your preferred model (GPT-3.5 Turbo recommended)

### Anthropic Setup
1. Get an API key from [Anthropic Console](https://console.anthropic.com/)
2. Open the extension options
3. Select "Anthropic (Claude)" as provider
4. Enter your API key
5. Choose your preferred model

### Gemini Setup
1. Get an API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Open the extension options
3. Select "Google Gemini" as provider
4. Enter your API key
5. Choose your preferred model (Gemini 1.5 Flash recommended for speed)

### Local LLM Setup
1. Install a local LLM server like [Ollama](https://ollama.ai) or text-generation-webui
2. Start your local server
3. Open the extension options
4. Select "Local LLM" as provider
5. Enter your server URL (e.g., `http://localhost:11434`)
6. Specify the model name

## Usage

1. Navigate to one of your Strava activities
2. Look for the "🔬 Analyze with AI" button near other activity actions
3. Click the button to start analysis
4. Wait for the AI to process your activity data
5. Review the detailed analysis in the popup modal

## What Gets Analyzed

The extension extracts and analyzes:

- **Basic Metrics**: Duration, distance, speed, elevation
- **Performance Data**: Heart rate, power, cadence
- **Lap Information**: Split analysis and pacing
- **Training Insights**: Zones, intensity, and effort distribution

## Analysis Features

- **Performance Summary**: Overall assessment of your activity
- **Strengths & Improvements**: What went well and what could be better
- **Training Insights**: Fitness adaptations and progress indicators
- **Recommendations**: Specific suggestions for future training
- **Zone Analysis**: Heart rate and power zone distribution
- **Pacing Strategy**: Analysis of effort distribution

## Privacy & Security

- Your activity data is only sent to your configured LLM provider
- API keys are stored locally in Chrome's secure storage
- No data is stored on external servers (except your chosen LLM provider)
- FIT files are processed locally in your browser

## Supported Activities

- Cycling (road, mountain, indoor)
- Running (road, trail, treadmill)
- Swimming
- Other endurance activities with power/heart rate data

## Troubleshooting

### Extension Not Working
- Ensure you're on a Strava activity page
- Check that it's your own activity (edit button should be visible)
- Verify your LLM provider configuration
- Try refreshing the page to retrigger button injection

### Analyze Button Not Appearing
- The extension only works on your own activities
- Button injection may take a few seconds on slow connections
- Check browser console for error messages
- Try navigating away and back to the activity page

### API Errors
- Check your API key is correct and has sufficient credits
- Verify your internet connection
- For local LLMs, ensure the server is running and accessible

### FIT File Issues
- Some activities may not have FIT files available
- The extension will fall back to extracting data from the page
- Ensure you have permission to download the activity data

## Development

### File Structure
```
├── manifest.json          # Extension configuration
├── content.js             # Strava page integration
├── background.js          # Core analysis logic
├── fit-parser.js          # FIT file parsing
├── llm-client.js          # LLM API client
├── options.html/js/css    # Configuration interface
├── popup.html/js/css      # Extension popup
└── styles.css             # Content script styles
```

### Building
No build process required - this is a vanilla JavaScript extension.

### Testing
1. Load the extension in developer mode
2. Configure a test LLM provider
3. Navigate to a Strava activity
4. Test the analysis functionality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues or questions:
1. Check the troubleshooting section
2. Open an issue on GitHub
3. Ensure you have proper API keys configured

## Changelog

### v1.1.0
- Added Google Gemini AI support
- Improved analyze button injection reliability
- Enhanced options page with Gemini configuration
- Fixed button placement issues on Strava pages
- Added better error handling and retry logic

### v1.0.0
- Initial release
- Support for OpenAI, Anthropic, and local LLMs
- FIT file parsing and analysis
- Strava page integration
- Configurable options interface