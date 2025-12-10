# AI Voice Chatbot Setup Guide

## Overview

The AI Voice Chatbot is a ChatGPT-like voice assistant that allows users to interact with the system using voice commands. It supports:
- **Speech-to-Text**: Speak your questions instead of typing
- **Text-to-Speech**: The AI responds with voice
- **Intelligent Responses**: Uses OpenAI API (optional) or rule-based responses
- **Context Awareness**: Remembers conversation history

## Features

### 1. Voice Input
- Click the microphone button to start speaking
- The system converts your speech to text automatically
- Works in Chrome, Edge, and other Chromium-based browsers

### 2. Voice Output
- AI responses are automatically spoken aloud
- You can stop the speech at any time
- Uses browser's built-in text-to-speech

### 3. Text Input
- You can still type messages if you prefer
- Press Enter to send
- Supports multi-line messages

### 4. Intelligent Responses
- Understands questions about products, sales, inventory
- Provides helpful guidance on using the system
- Can answer business-related questions

## Setup Instructions

### Basic Setup (Rule-Based Chatbot - No API Key Required)

The chatbot works out of the box with rule-based responses. No additional setup needed!

### Advanced Setup (OpenAI Integration - Optional)

For more intelligent, ChatGPT-like responses:

1. **Get OpenAI API Key**
   - Go to https://platform.openai.com/
   - Sign up or log in
   - Go to API Keys section
   - Create a new API key

2. **Add to Backend Environment**
   - Open `backend/.env`
   - Add:
     ```
     OPENAI_API_KEY=your-openai-api-key-here
     ```

3. **Restart Backend**
   - The chatbot will automatically use OpenAI if the key is configured
   - Falls back to rule-based if OpenAI is unavailable

## Browser Compatibility

### Speech Recognition (Voice Input)
- ✅ Chrome/Edge (Recommended)
- ✅ Safari (macOS/iOS)
- ⚠️ Firefox (Limited support)
- ❌ Not supported in some older browsers

### Text-to-Speech (Voice Output)
- ✅ All modern browsers
- ✅ Chrome, Firefox, Safari, Edge

## Usage

### How to Use Voice Chatbot

1. **Go to Communication Page**
   - Click on "Communication" in the sidebar
   - Select "AI Voice Chatbot" tab

2. **Start Talking**
   - Click the microphone button (🎤)
   - Speak your question clearly
   - The system will convert speech to text
   - AI will respond with both text and voice

3. **Type Instead**
   - Type your message in the text field
   - Press Enter or click Send
   - AI will respond with voice and text

### Example Questions

- "Hello, how can you help me?"
- "Show me products with low stock"
- "What are my sales today?"
- "How do I add a new product?"
- "Tell me about AI forecasting"
- "How do I send emails to customers?"

## Troubleshooting

### Voice Recognition Not Working

**Problem**: Microphone button doesn't work or shows error

**Solutions**:
1. Check browser permissions - allow microphone access
2. Use Chrome or Edge browser (best support)
3. Check if microphone is connected and working
4. Try typing instead if voice doesn't work

### No Voice Output

**Problem**: AI responds with text but no voice

**Solutions**:
1. Check browser volume settings
2. Ensure system volume is not muted
3. Try clicking the stop button and speaking again
4. Some browsers may require user interaction first

### OpenAI Not Responding

**Problem**: Getting rule-based responses instead of intelligent ones

**Solutions**:
1. Check if `OPENAI_API_KEY` is set in `backend/.env`
2. Verify the API key is correct
3. Check OpenAI account has credits
4. Check backend logs for errors
5. System will automatically fall back to rule-based responses

### Speech Recognition Not Supported

**Problem**: Browser shows "Speech recognition not supported"

**Solutions**:
1. Use Chrome or Edge browser
2. Update your browser to latest version
3. Use typing instead - it works in all browsers

## API Costs (OpenAI)

If using OpenAI API:
- **GPT-3.5-turbo**: ~$0.002 per 1K tokens
- Typical conversation: $0.01-0.05 per conversation
- Very affordable for most use cases

## Customization

### Adding Custom Responses

Edit `backend/routes/chatbot.js` to add custom response patterns:

```javascript
// Add new response pattern
if (lowerMessage.match(/\b(your keyword)\b/)) {
  return "Your custom response here";
}
```

### Changing Voice Settings

Edit `frontend/src/components/VoiceChatbot.js`:

```javascript
// In speakText function
utterance.rate = 1;    // Speed (0.1 to 10)
utterance.pitch = 1;   // Pitch (0 to 2)
utterance.volume = 1;  // Volume (0 to 1)
utterance.lang = 'en-US'; // Language
```

## Security Notes

- Voice recognition happens in the browser (client-side)
- Speech is not sent to external servers (except OpenAI if configured)
- OpenAI API key should be kept secret in backend `.env`
- Never expose API keys in frontend code

## Future Enhancements

Potential improvements:
- Multi-language support
- Voice commands for actions (e.g., "Add product X")
- Integration with other AI services
- Conversation history persistence
- Voice authentication

