# Contributing to MemClaw

Thank you for your interest in contributing to MemClaw! We welcome contributions from the community.

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, please include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior vs. actual behavior
- Screenshots or logs if applicable
- Environment information (Node.js version, OS, etc.)

### Suggesting Enhancements

Enhancement suggestions are welcome! Please:

- Use a clear and descriptive title
- Provide a detailed description of the enhancement
- Explain why this enhancement would be useful
- Include examples or mock-ups if possible

### Pull Requests

We accept pull requests for:

- Bug fixes
- New features
- Documentation improvements
- Performance optimizations

#### Pull Request Process

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** and ensure they follow our coding standards
3. **Write tests** for new features or bug fixes
4. **Update documentation** as needed
5. **Commit your changes** with clear messages
6. **Push to your fork** and submit a pull request
7. **Wait for review** and address any feedback

#### Coding Standards

- Use ESLint for code formatting
- Follow existing code style
- Write clear, concise comments
- Add JSDoc comments for functions and classes
- Use TypeScript for new code

#### Commit Message Format

We follow conventional commits:

```
feat: add new feature
fix: fix bug
docs: update documentation
style: format code
refactor: refactor code
test: add tests
chore: update build process
```

### Development Setup

```bash
# Clone the repository
git clone https://github.com/Mosqu1to3zZ/memclaw-memory-optimizer.git
cd memclaw-memory-optimizer

# Install dependencies
cd server && npm install
cd ../web && npm install

# Run development server
cd ../server && npm run dev

# Run tests
npm test

# Build for production
cd ../web && npm run build
```

### Project Structure

```
memclaw/
├── src/              # Core engine
│   ├── core/         # Core modules
│   └── utils/        # Utilities
├── server/           # Backend server
├── web/              # Frontend application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── lib/
│   └── dist/         # Build output
└── docs/             # Documentation
```

## Getting Help

If you need help:

- Check existing [Issues](https://github.com/Mosqu1to3zZ/memclaw-memory-optimizer/issues)
- Start a [Discussion](https://github.com/Mosqu1to3zZ/memclaw-memory-optimizer/discussions)
- Read the [Documentation](README.md)

## Code of Conduct

Be respectful, inclusive, and constructive in all interactions. We value diverse perspectives and welcome contributors from all backgrounds.

## License

By contributing, you agree that your contributions will be licensed under the Apache-2.0 License.
