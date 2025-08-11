# Installation and Usage Guide

## Quick Start

1. **Download the Extension**
   - Clone or download this repository
   - Save all files to a local folder

2. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked" and select the extension folder
   - The extension should now appear in your extensions list

3. **Configure LLM Provider**
   - Click the extension icon in Chrome toolbar
   - Click "Open Options" to configure your AI provider
   - Choose from OpenAI, Anthropic, or Local LLM
   - Enter your API key or local server URL

4. **Use the Extension**
   - Navigate to any of your Strava activities
   - Look for the "🔬 Analyze with AI" button
   - Click to get detailed AI-powered analysis

## Example Analysis Output

When you click the analyze button, you'll get insights like:

### 🔬 AI Activity Analysis

**📊 Performance Summary**
- Solid endurance effort with consistent power output
- Heart rate data shows good aerobic efficiency
- Pacing strategy was well-executed for the terrain

**💪 Strengths**
- Maintained steady effort on climbs
- Good power-to-weight ratio for sustained efforts
- Excellent cadence consistency throughout

**🎯 Areas for Improvement**
- Consider incorporating more high-intensity intervals
- Work on sprint power for better finishing capability
- Focus on recovery between hard efforts

**📈 Training Insights**
- Current fitness level supports longer endurance work
- Power curve suggests good aerobic base
- Heart rate zones indicate room for VO2 max development

**🎖️ Recommendations**
- Add 2x20min threshold intervals weekly
- Include sprint work once per week
- Consider longer Z2 rides for base building
- Monitor weekly TSS to avoid overreaching

## Files Structure

```
strava-web-chrome-plugin/
├── manifest.json          # Extension configuration
├── content.js             # Injects analyze button into Strava
├── background.js          # Handles analysis workflow
├── fit-parser.js          # Parses FIT files from Strava
├── llm-client.js          # Communicates with AI providers
├── options.html/js/css    # Settings configuration UI
├── popup.html/js/css      # Extension popup interface
├── styles.css             # Styling for injected elements
└── README.md              # Documentation
```

## Supported Features

✅ **Auto-detection** of your own Strava activities
✅ **FIT file parsing** for detailed metrics extraction  
✅ **Multiple LLM providers** (OpenAI, Anthropic, Local)
✅ **Comprehensive analysis** including performance insights
✅ **Secure configuration** with local API key storage
✅ **Activity type support** for cycling, running, swimming
✅ **Error handling** with helpful user feedback
✅ **Responsive design** that integrates seamlessly with Strava