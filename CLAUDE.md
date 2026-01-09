# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claude Cruise is a smart proxy for Claude Code that prevents rate limits by predicting usage patterns and automatically routing requests to fallback providers (Haiku, OpenRouter, Ollama) when approaching quotas.

## Development Commands

```bash
# Development (runs tsx with React/Ink terminal UI)
npm run dev

# Build TypeScript to dist/
npm run build

# Run built version
npm start

# Type checking
npm run typecheck

# Run tests
npm test
```

## Architecture

### Core Modules

- **`src/proxy/server.ts`** - Hono-based HTTP proxy server that intercepts Claude API calls, logs usage, and serves the web dashboard. Handles both streaming and non-streaming responses.

- **`src/predictor/index.ts`** - Rate limit prediction engine with three components:
  - `RateLimitTracker` - Learns actual limits from 429 errors
  - `VelocityCalculator` - Calculates usage rate and detects patterns (burst/steady/declining)
  - `PredictionEngine` - Predicts when limits will be hit based on learned limits and velocity

- **`src/router/index.ts`** - Smart routing with threshold-based model switching:
  - 0-70%: Use requested model (Sonnet)
  - 70-85%: Switch to Haiku (73% cheaper)
  - 85-95%: Switch to OpenRouter
  - 95%+: Switch to Ollama (local, free)

- **`src/storage/database.ts`** - SQLite persistence using better-sqlite3. Stores usage logs, rate limit events, routing decisions, and sessions. Data stored in `~/.cruise/usage.db`.

- **`src/cli/index.tsx`** - Terminal UI built with Ink (React for CLI). Renders dashboard with usage gauges, predictions, and routing status.

### Data Flow

1. Claude Code sends request to proxy (localhost:4141)
2. Router checks prediction engine for current usage %
3. Request routed to appropriate provider based on thresholds
4. Response streamed back, usage logged to SQLite
5. On 429 error, predictor learns and router activates fallback

### Key Types

- `UsageLog` - Per-request metrics (tokens, cost, latency, routing info)
- `RateLimitEvent` - 429 error data for learning
- `RoutingDecision` - Provider/model selection with reason
- `Prediction` - Usage %, time until limit, recommended action

## Provider Configuration

Environment variables for fallback providers:
- `ANTHROPIC_API_KEY` - Required
- `OPENROUTER_API_KEY` - Optional, enables OpenRouter fallback
- `OLLAMA_ENABLED=true` - Optional, enables local Ollama fallback
- `OLLAMA_ENDPOINT` - Defaults to http://localhost:11434

## Path Aliases

TypeScript configured with `@/*` mapping to `src/*` in tsconfig.json.
