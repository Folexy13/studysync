# Contributing to StudySync AI

Thank you for your interest in contributing to StudySync AI! 🎉

## Code of Conduct

Please be respectful and constructive in all interactions with the community.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/studysync-ai/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Chrome version and OS
   - Screenshots if applicable

### Suggesting Features

1. Check existing feature requests
2. Create a new issue with the "enhancement" label
3. Describe the feature and its use case
4. Explain why it would be valuable

### Pull Requests

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes
4. Test thoroughly
5. Update documentation if needed
6. Submit a pull request with:
   - Clear description of changes
   - Link to related issues
   - Screenshots/videos if UI changes

### Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/studysync-ai.git
cd studysync-ai

# Create a branch
git checkout -b feature/my-feature

# Make changes and test

# Commit with clear messages
git commit -m "feat: add audio transcription support"

# Push to your fork
git push origin feature/my-feature
```

### Commit Message Guidelines

Follow conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Test additions or changes
- `chore:` Build process or tooling changes

### Code Style

- Use ES6+ features
- Follow existing code style
- Add comments for complex logic
- Keep functions small and focused
- Use meaningful variable names

### Testing

Before submitting:

- [ ] Test all AI features
- [ ] Test on different websites
- [ ] Test error handling
- [ ] Test keyboard shortcuts
- [ ] Test context menus
- [ ] Test side panel
- [ ] Check console for errors

### AI API Best Practices

When working with Chrome Built-in AI APIs:

1. Always check capability before use
2. Implement fallbacks for unavailable APIs
3. Handle errors gracefully
4. Provide user feedback
5. Clean up sessions when done

### Documentation

Update documentation when:

- Adding new features
- Changing existing behavior
- Updating dependencies
- Adding configuration options

## Questions?

Feel free to ask questions in:
- GitHub Discussions
- Discord server
- Email: dev@studysync-ai.com

Thank you for contributing! 🙏
