# Frequently Asked Questions (FAQ)

## General

### What is AI Chat Studio?

AI Chat Studio is a modern, open-source web application that provides a unified interface to interact with multiple AI providers (OpenAI, Anthropic, Google). It offers features like multi-turn conversations, offline support, export capabilities, and more.

### Is it free?

The application itself is free and open-source. However, you need to provide your own API key from AI providers (OpenAI, Anthropic, or Google), and you'll be charged by them for API usage.

### How do I get started?

1. Open the application
2. Go to Settings → API Settings
3. Enter your API key from your chosen provider
4. Select a model
5. Start chatting!

## Privacy & Security

### Is my data secure?

Yes. All your conversations and settings are stored locally in your browser using IndexedDB. Your data never leaves your device except when making API calls to your chosen AI provider.

### Do you collect my data?

No. We don't have any backend servers that collect user data. Everything runs in your browser.

### Where are my API keys stored?

API keys are encrypted and stored in your browser's local storage. They're only used to make authenticated requests to AI providers.

### Can others see my conversations?

No. Conversations are stored locally on your device only. They're not uploaded to any server.

### What happens if I clear my browser data?

All your conversations and settings will be lost. We recommend exporting your data regularly as a backup.

## Features

### Which AI models are supported?

**OpenAI:**
- GPT-4 Turbo
- GPT-4
- GPT-3.5 Turbo

**Anthropic:**
- Claude 3 Opus
- Claude 3 Sonnet
- Claude 3 Haiku

**Google:**
- Gemini Pro
- Gemini Pro Vision

### Can I use multiple models in the same conversation?

Not in the same conversation, but you can switch models between conversations.

### Does it support images?

Yes, for vision-capable models (GPT-4 Vision, Gemini Pro Vision). You can paste or drag-and-drop images directly into the chat.

### Can I export conversations?

Yes! You can export in multiple formats:
- Markdown (.md)
- JSON (.json)
- Plain Text (.txt)
- HTML (.html)
- PDF (.pdf)

Go to Settings → Data Management → Export.

### Does it work offline?

Partially. You can view past conversations offline, but you need internet connection to send new messages to AI models.

### Is there a dark mode?

Yes! Go to Settings → Appearance → Theme and choose Light, Dark, or System.

### What languages are supported?

The interface is available in:
- English
- 简体中文 (Simplified Chinese)
- 日本語 (Japanese)

The AI models support many more languages depending on the provider.

## Technical

### What browsers are supported?

Modern browsers with ES6+ support:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 75+

### Can I install it as an app?

Yes! The app is a Progressive Web App (PWA). You can install it:

**Chrome/Edge:**
1. Click the install icon in the address bar
2. Or: Menu → Install AI Chat Studio

**Safari (iOS):**
1. Tap Share button
2. Select "Add to Home Screen"

### How much storage does it use?

Typical usage: 10-100MB depending on the number and length of conversations. You can check exact usage in Settings → Data Management.

### Can I self-host this?

Yes! The application is open-source. See DEPLOYMENT_GUIDE.md for instructions.

### Does it support streaming responses?

Yes. Responses stream in real-time for all supported models.

### Can I use a custom API endpoint?

Yes, for advanced users. Go to Settings → API Settings → Advanced to configure custom base URLs.

## Troubleshooting

### "API Key Invalid" error

**Solutions:**
1. Verify your API key has no extra spaces
2. Check the key is active in your provider's dashboard
3. Ensure you have available credits/quota
4. Try generating a new API key

### Messages not sending

**Solutions:**
1. Check your internet connection
2. Verify your API key is valid
3. Check if you've reached your API rate limit
4. Try refreshing the page

### Slow responses

**Possible causes:**
1. Using a complex model (GPT-4) - try GPT-3.5
2. Network congestion
3. API provider is experiencing high load
4. Large conversation context

**Solutions:**
- Switch to a faster model
- Reduce max tokens
- Start a new conversation to reduce context
- Wait a few moments and retry

### App won't load

**Solutions:**
1. Clear browser cache
2. Try incognito/private mode
3. Update browser to latest version
4. Disable browser extensions temporarily
5. Try a different browser

### Conversations disappeared

**Possible causes:**
1. Browser data was cleared
2. Using different browser/device
3. Browser privacy mode

**Solutions:**
- Check if you have a backup export
- Verify you're using the same browser
- Import from backup if available

### High memory usage

**Solutions:**
1. Delete old conversations
2. Close other browser tabs
3. Restart browser
4. Clear browser cache

## Costs & Usage

### How much does it cost?

The app is free. You only pay your AI provider:

**OpenAI Pricing (as of 2024):**
- GPT-3.5 Turbo: $0.0010/1K tokens (input), $0.0020/1K tokens (output)
- GPT-4: $0.03/1K tokens (input), $0.06/1K tokens (output)
- GPT-4 Turbo: $0.01/1K tokens (input), $0.03/1K tokens (output)

**Anthropic Pricing:**
- Claude 3 Haiku: $0.25/MTok (input), $1.25/MTok (output)
- Claude 3 Sonnet: $3/MTok (input), $15/MTok (output)
- Claude 3 Opus: $15/MTok (input), $75/MTok (output)

Prices vary by provider. Check their websites for latest pricing.

### How can I reduce costs?

1. **Use appropriate models**: Don't use GPT-4 for simple tasks
2. **Be concise**: Shorter prompts = lower costs
3. **Set max tokens**: Limit response length
4. **Monitor usage**: Check your API dashboard regularly
5. **Use cheaper models**: GPT-3.5, Claude Haiku for simple tasks

### How do I check my usage?

Check your usage in your AI provider's dashboard:
- OpenAI: https://platform.openai.com/usage
- Anthropic: https://console.anthropic.com
- Google: https://console.cloud.google.com

## Contributing

### Can I contribute to the project?

Yes! We welcome contributions:
- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation
- Translate to new languages

See CONTRIBUTING.md for guidelines.

### How do I report a bug?

1. Check if it's already reported: https://github.com/yourusername/chat-studio/issues
2. If not, create a new issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser and OS info
   - Screenshots if applicable

### Can I request a feature?

Yes! Create a feature request issue on GitHub with:
- Clear description of the feature
- Use case / why it's needed
- Any examples or mockups

## Advanced

### Can I run this locally?

Yes! Clone the repository and run:

```bash
npm install
npm run dev
```

See README.md for detailed instructions.

### Can I modify the code?

Yes! The project is open-source under MIT license. You can:
- Fork the repository
- Modify for personal use
- Distribute your modifications
- Use in commercial projects

Just maintain the license notice.

### How do I contribute translations?

1. Copy `src/i18n/locales/en.json`
2. Translate all values to your language
3. Save as `src/i18n/locales/{language-code}.json`
4. Import in `src/i18n/config.ts`
5. Submit a pull request

### Can I add support for other AI providers?

Yes! Create a service class following the pattern in:
- `src/services/openai.service.ts`
- `src/services/anthropic.service.ts`

Then submit a pull request.

## Getting Help

### Where can I get help?

- 📖 Read the docs: [USER_GUIDE.md](./USER_GUIDE.md)
- 🐛 Report bugs: https://github.com/yourusername/chat-studio/issues
- 💡 Request features: https://github.com/yourusername/chat-studio/issues/new
- 💬 Ask questions: https://github.com/yourusername/chat-studio/discussions
- 📧 Email support: support@chat-studio.example.com

### How do I stay updated?

- ⭐ Star the repository on GitHub
- 👀 Watch for releases
- 📢 Follow announcements in discussions
- 🔔 Enable GitHub notifications

---

**Didn't find your answer?**

Ask in [GitHub Discussions](https://github.com/yourusername/chat-studio/discussions) or email us at support@chat-studio.example.com
