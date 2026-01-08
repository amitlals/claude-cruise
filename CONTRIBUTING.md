# Contributing to Claude Cruise

Thank you for your interest in contributing to Claude Cruise! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Guidelines](#coding-guidelines)
- [Submitting Changes](#submitting-changes)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)

## Code of Conduct

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/amitlals/claude-cruise.git
   cd claude-cruise
   ```

2. **Install Bun** (if not already installed)
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

3. **Install dependencies**
   ```bash
   bun install
   ```

4. **Run in development mode**
   ```bash
   bun run dev
   ```

5. **Test your changes**
   ```bash
   bun test
   bun run typecheck
   bun run lint
   ```

## Project Structure

```
claude-cruise/
├── src/
│   ├── cli/          # CLI entry point and command handlers
│   ├── proxy/        # HTTP proxy server (Hono)
│   ├── predictor/    # Rate limit prediction engine
│   ├── router/       # Smart routing logic
│   ├── storage/      # SQLite database adapter
│   ├── ui/           # Terminal dashboard components (Ink/React)
│   │   ├── animations/  # Logo and animations
│   │   ├── components/  # Dashboard panels
│   │   └── themes/      # Color themes
│   └── config/       # Configuration management
├── docs/             # VitePress documentation site
├── tests/            # Test files
└── configs/          # Example configuration files
```

## Coding Guidelines

### TypeScript

- Use TypeScript strict mode
- Follow existing code style and patterns
- Add JSDoc comments for public APIs
- Use meaningful variable and function names

### Code Style

```typescript
// Good: Clear, descriptive names
function calculatePrediction(logs: UsageLog[]): Prediction {
  const totalTokens = logs.reduce((sum, log) => sum + log.inputTokens, 0);
  return { usagePercent: totalTokens / limit };
}

// Bad: Unclear names
function calc(l: any[]): any {
  const t = l.reduce((s, x) => s + x.i, 0);
  return { u: t / lim };
}
```

### Best Practices

- **Keep functions small and focused** - Each function should do one thing well
- **Write tests** - Add tests for new features and bug fixes
- **Avoid over-engineering** - Keep solutions simple and maintainable
- **Comment complex logic** - Help future contributors understand your code
- **Use existing patterns** - Follow established patterns in the codebase

## Submitting Changes

### 1. Create a Branch

```bash
git checkout -b feature/amazing-feature
# or
git checkout -b fix/bug-description
```

Use prefixes:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or fixes

### 2. Make Your Changes

- Write clear, concise commit messages
- Keep commits atomic (one logical change per commit)
- Test your changes thoroughly

### 3. Commit Your Changes

```bash
git add .
git commit -m "feat: add cost budget alerts"
```

Commit message format:
- `feat: ...` - New feature
- `fix: ...` - Bug fix
- `docs: ...` - Documentation
- `refactor: ...` - Code refactoring
- `test: ...` - Tests
- `chore: ...` - Build/tooling changes

### 4. Push to Your Fork

```bash
git push origin feature/amazing-feature
```

### 5. Open a Pull Request

- Fill out the PR template completely
- Link to related issues
- Describe what you changed and why
- Add screenshots if applicable
- Wait for code review

## Reporting Bugs

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.yml) and include:

- **Clear description** - What happened vs. what you expected
- **Steps to reproduce** - Exact steps to trigger the bug
- **Version and environment** - Claude Cruise version, OS, Node/Bun version
- **Logs** - Relevant error messages or stack traces
- **Screenshots** - If applicable

## Requesting Features

Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.yml) and explain:

- **Problem you're solving** - What pain point does this address?
- **Proposed solution** - How should it work?
- **Alternatives** - What other approaches did you consider?
- **Use case** - Real-world example of using this feature

## Development Tips

### Running the Dashboard

```bash
bun run dev
```

The dashboard will start with mock data. To test with real Claude Code:

1. Set `ANTHROPIC_BASE_URL=http://localhost:4141`
2. Use Claude Code normally
3. Dashboard updates in real-time

### Testing Prediction Logic

```bash
# Test with simulated 429 errors
bun test predictor

# Test with real API (requires ANTHROPIC_API_KEY)
ANTHROPIC_API_KEY=your-key bun run dev
```

### Building for Production

```bash
bun run build

# Test the built version
./dist/cli/index.js
```

## Questions?

- **Bugs/Features**: Open an [issue](https://github.com/amitlals/claude-cruise/issues)
- **Discussions**: Start a [discussion](https://github.com/amitlals/claude-cruise/discussions)
- **Security**: See [SECURITY.md](SECURITY.md)

## Recognition

Contributors are recognized in:
- GitHub contributors page
- Release notes
- Project README (for significant contributions)

Thank you for contributing to Claude Cruise! 🚀
