# AI Chat Studio - User Guide

Welcome to AI Chat Studio! This guide will help you get started and make the most of the application.

## Table of Contents

- [Getting Started](#getting-started)
- [Features Overview](#features-overview)
- [Chat Interface](#chat-interface)
- [Settings](#settings)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Tips and Tricks](#tips-and-tricks)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

## Getting Started

### First Launch

1. **Open the application** in your web browser
2. **Configure your API key** (Settings → API Settings)
   - Choose your preferred AI provider (OpenAI, Anthropic, or Google)
   - Enter your API key
   - Click "Save"
3. **Start chatting!** Click "New Conversation" to begin

### Choosing an AI Model

AI Chat Studio supports multiple AI providers:

- **OpenAI**: GPT-4, GPT-3.5 Turbo
- **Anthropic**: Claude 3 Opus, Sonnet, Haiku
- **Google**: Gemini Pro

Each model has different capabilities and pricing. Select the one that best fits your needs in Settings.

## Features Overview

### Core Features

- 💬 **Multi-turn Conversations**: Have extended dialogues with AI
- 🔄 **Multiple Providers**: Switch between OpenAI, Anthropic, and Google
- 💾 **Auto-save**: Conversations are automatically saved locally
- 🌐 **Offline Support**: Access past conversations without internet
- 🌍 **Multi-language**: Interface available in English, 简体中文, and 日本語
- 🎨 **Dark Mode**: Easy on the eyes with dark theme support
- ⌨️ **Keyboard Shortcuts**: Navigate quickly with keyboard commands
- 📤 **Export**: Save conversations in multiple formats (MD, JSON, TXT, HTML, PDF)

### Advanced Features

- 🎤 **Voice Chat** (Coming Soon): Talk to AI using voice input
- 🔧 **Code Execution** (Coming Soon): Run code snippets in the chat
- 🔌 **MCP Integration** (Coming Soon): Connect to external tools and services

## Chat Interface

### Starting a Conversation

1. Click **"New Conversation"** button or press `Ctrl/Cmd + N`
2. Type your message in the input box
3. Press `Enter` or click **"Send"** button

### Message Actions

Each message has several actions:

- **Copy**: Copy message text to clipboard
- **Regenerate**: Ask AI to generate a different response
- **Edit**: Modify your message and resend

### Conversation Management

- **Rename**: Click conversation title to rename
- **Delete**: Remove unwanted conversations
- **Search**: Find specific conversations using search bar

### Input Tips

- **Multi-line Input**: Press `Shift + Enter` for new line
- **Send Message**: Press `Enter` to send
- **Clear Input**: Press `Escape` to clear input field
- **Paste Images**: Drag and drop or paste images directly (supported models only)

## Settings

### API Settings

Configure your AI provider and model preferences:

1. Navigate to **Settings** (gear icon or `Ctrl/Cmd + ,`)
2. Select **API Settings** tab
3. Configure:
   - **API Key**: Your provider's API key
   - **Model**: Choose AI model
   - **Temperature**: Control randomness (0.0 - 2.0)
     - Lower (0.0 - 0.7): More focused and deterministic
     - Higher (0.7 - 2.0): More creative and random
   - **Max Tokens**: Maximum response length

### Appearance

Customize the look and feel:

- **Theme**: Light, Dark, or System
- **Language**: English, 简体中文, 日本語
- **Font Size**: Adjust text size
- **Message Density**: Compact or Comfortable

### Data Management

Control your data:

- **Export All Data**: Download all conversations
- **Import Data**: Restore from backup
- **Clear All Data**: Delete all conversations (irreversible!)
- **Storage Info**: View storage usage

## Keyboard Shortcuts

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + N` | New conversation |
| `Ctrl/Cmd + K` | Command palette |
| `Ctrl/Cmd + ,` | Open settings |
| `Ctrl/Cmd + /` | Show keyboard shortcuts |
| `Ctrl/Cmd + F` | Search conversations |
| `/` | Focus input field |

### Chat Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift + Enter` | New line |
| `Escape` | Clear input / Stop generating |
| `Ctrl/Cmd + ↑` | Previous message |
| `Ctrl/Cmd + ↓` | Next message |
| `Ctrl/Cmd + R` | Regenerate response |

### Navigation

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + 1-9` | Switch to conversation 1-9 |
| `Ctrl/Cmd + [` | Previous conversation |
| `Ctrl/Cmd + ]` | Next conversation |
| `Alt + ↑/↓` | Scroll conversation list |

## Tips and Tricks

### Getting Better Responses

1. **Be Specific**: Provide clear, detailed instructions
   - ❌ "Write code"
   - ✅ "Write a Python function that calculates factorial using recursion"

2. **Provide Context**: Give the AI relevant background information
   - "I'm building a web app with React. How do I..."

3. **Use Examples**: Show what you want
   - "Format the output like this: Name: John, Age: 30"

4. **Iterate**: Refine your prompts based on responses
   - Start broad, then ask follow-up questions to narrow down

5. **Adjust Temperature**:
   - Use low temperature (0.0-0.3) for factual, technical tasks
   - Use high temperature (0.7-1.0) for creative, varied responses

### Organizing Conversations

- **Use Descriptive Titles**: Rename conversations with meaningful names
- **Search Effectively**: Use keywords to find conversations quickly
- **Export Important Chats**: Save important conversations as backups

### Saving API Costs

- **Use Appropriate Models**: Don't use GPT-4 for simple tasks
- **Be Concise**: Shorter prompts = lower costs
- **Set Max Tokens**: Limit response length to control costs
- **Monitor Usage**: Check your API provider's dashboard regularly

### Performance Tips

- **Clear Old Conversations**: Delete or archive old chats to improve performance
- **Use Offline Mode**: Enable PWA for faster loading
- **Limit Concurrent Chats**: Focus on one conversation at a time
- **Enable Caching**: Let the app cache responses for offline access

## Troubleshooting

### Common Issues

#### "API Key Invalid" Error

**Solution**:
1. Check your API key is correctly entered (no extra spaces)
2. Verify the key is active in your provider's dashboard
3. Ensure you have API credits/quota available

#### "Network Error" / "Failed to Connect"

**Solution**:
1. Check your internet connection
2. Verify your firewall isn't blocking the app
3. Try a different network
4. Check if the API provider is experiencing outages

#### Slow Response Times

**Solution**:
1. Try a faster model (e.g., GPT-3.5 instead of GPT-4)
2. Reduce max tokens
3. Check your network speed
4. Wait a moment - API may be temporarily overloaded

#### App Won't Load

**Solution**:
1. Clear browser cache and cookies
2. Try incognito/private mode
3. Update your browser to the latest version
4. Try a different browser

#### Messages Not Saving

**Solution**:
1. Check browser storage isn't full
2. Enable cookies and local storage
3. Try exporting and reimporting data
4. Contact support if issue persists

### Getting Help

If you encounter issues not covered here:

1. Check [FAQ](#faq) below
2. Search existing GitHub issues
3. Create a new issue with:
   - Description of the problem
   - Steps to reproduce
   - Browser and OS version
   - Screenshots (if applicable)

## FAQ

### General Questions

**Q: Is my data secure?**

A: Yes. All conversations are stored locally in your browser. API keys are encrypted before storage. We don't send your data to any server except your chosen AI provider.

**Q: Do you store my API keys?**

A: No. API keys are stored encrypted in your browser's local storage only. They never leave your device except when making API calls to your chosen provider.

**Q: Can I use this offline?**

A: Partially. Past conversations are available offline, but you need internet to chat with AI models.

**Q: Is this free?**

A: The application is free and open-source. However, you need to provide your own API key and pay your AI provider directly for usage.

**Q: Which AI model should I use?**

A: It depends on your needs:
- **Quick tasks**: GPT-3.5 Turbo, Claude Haiku
- **Complex reasoning**: GPT-4, Claude Opus
- **Balanced**: Claude Sonnet, Gemini Pro

### Technical Questions

**Q: What browsers are supported?**

A: Modern browsers with ES6+ support:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

**Q: How much storage does it use?**

A: Depends on usage. Typically 10-100MB for thousands of messages. You can check in Settings → Data Management.

**Q: Can I export my data?**

A: Yes! Settings → Data Management → Export All Data. Available formats: JSON, Markdown, HTML, PDF, Plain Text.

**Q: Can I use my own API endpoint?**

A: Yes. Advanced users can configure custom API base URLs in Settings → API Settings → Advanced.

**Q: Does it support streaming responses?**

A: Yes. The app supports streaming for all providers, giving you responses in real-time.

**Q: Can I use multiple API keys?**

A: Currently, one key per provider. You can switch between providers anytime in Settings.

### Feature Requests

**Q: Will you add feature X?**

A: Maybe! Check our GitHub roadmap or create a feature request issue.

**Q: Can I contribute?**

A: Absolutely! We welcome contributions. See CONTRIBUTING.md for guidelines.

**Q: Is there a mobile app?**

A: Not yet, but the web app is fully responsive and works great on mobile browsers. You can also install it as a PWA (Progressive Web App) for a native-like experience.

## Support

Need more help?

- 📖 **Documentation**: https://docs.chat-studio.example.com
- 🐛 **Report Bug**: https://github.com/yourusername/chat-studio/issues
- 💡 **Request Feature**: https://github.com/yourusername/chat-studio/issues/new
- 💬 **Community**: https://github.com/yourusername/chat-studio/discussions
- 📧 **Email**: support@chat-studio.example.com

---

**Happy Chatting! 🎉**
