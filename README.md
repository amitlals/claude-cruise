# 

<div align="center">

```
   ██████╗██████╗ ██╗   ██╗██╗███████╗███████╗
  ██╔════╝██╔══██╗██║   ██║██║██╔════╝██╔════╝
  ██║     ██████╔╝██║   ██║██║███████╗█████╗  
  ██║     ██╔══██╗██║   ██║██║╚════██║██╔══╝  
  ╚██████╗██║  ██║╚██████╔╝██║███████║███████╗
   ╚═════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝╚══════╝╚══════╝
                    for Claude Code
```

### ⚡ Never hit a rate limit again.

[![npm version](https://img.shields.io/npm/v/claude-cruise.svg)](https://www.npmjs.com/package/claude-cruise)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/amitlals/claude-cruise.svg)](https://github.com/amitlals/claude-cruise/stargazers)

**Claude Cruise** is a smart proxy that sits between Claude Code and the Anthropic API.  
It prevents rate limits by automatically switching to backup models when you're close to hitting your quota.

[🚀 Quick Start](#-quick-start-for-beginners) • [📋 Prerequisites](#-prerequisites) • [🔄 How It Works](#-how-auto-routing-works) • [📺 Dashboard](#-web-dashboard) • [❓ FAQ](#-faq)

![cruise](https://github.com/user-attachments/assets/1657952f-430f-4de4-960e-e72fd5decffd)

</div>

---

## ⚠️ Important: What This Works With

> **Claude Cruise works with API-based tools only.** It does NOT work with claude.ai web chat.

| ✅ Works With | ❌ Does NOT Work With |
|--------------|----------------------|
| Claude Code (VS Code Extension) | claude.ai (web chat) |
| Claude Code (CLI / Terminal) | Claude mobile app |
| Anthropic API (direct calls) | Claude Desktop app |
| Any app using `ANTHROPIC_BASE_URL` | Browser-based Claude |

---

## 🎯 The Problem This Solves

You're coding with Claude Code. Everything is going great. Then suddenly:

```
Error: Rate limit exceeded. Please try again later.
```

😱 Your **$$100 or 200/month Max plan** quota is gone. No warning. No visibility. You have to wait hours.

**Claude Cruise fixes this** by:
- 🔮 **Predicting** when you'll hit the limit
- ⚡ **Auto-switching** to backup models before you're blocked  
- 📊 **Showing** real-time usage in a dashboard
- 💰 **Saving** 20-40% on costs with smart routing

---

## 📋 Prerequisites

Before you start, make sure you have:

| Requirement | How to Check | How to Install |
|-------------|--------------|----------------|
| **Node.js** (v18+) | `node --version` | [nodejs.org](https://nodejs.org/) |
| **npm** | `npm --version` | Comes with Node.js |
| **Git** | `git --version` | [git-scm.com](https://git-scm.com/) |
| **VS Code** | Open VS Code | [code.visualstudio.com](https://code.visualstudio.com/) |
| **Claude Code Extension** | Check VS Code Extensions | Search "Claude" in Extensions |
| **Anthropic API Key** | - | [console.anthropic.com](https://console.anthropic.com/) |

---

## 🚀 Quick Start 

### Two Ways to Use Claude Cruise

| Method | Best For | Difficulty |
|--------|----------|------------|
| **[Option A: NPX](#option-a-use-npx-easiest)** | Quick start, no setup | ⭐ Easiest |
| **[Option B: Clone Repo](#option-b-clone-from-github-for-developers)** | Developers, contributors | ⭐⭐ Medium |

---

## Option A: Use NPX (Easiest)

This is the fastest way - just 3 commands!

### Step 1: Open Terminal

**Windows:**
- Press `Win + R`, type `powershell`, press Enter

**macOS:**
- Press `Cmd + Space`, type `terminal`, press Enter

**Linux:**
- Press `Ctrl + Alt + T`

### Step 2: Set Your Anthropic API Key

First, get your API key from [console.anthropic.com](https://console.anthropic.com/) → API Keys → Create Key

Then set it in your terminal:

```powershell
# Windows PowerShell (copy and paste, replace YOUR_KEY)
$env:ANTHROPIC_API_KEY = "sk-ant-api03-YOUR_KEY_HERE"
```

```bash
# macOS / Linux (copy and paste, replace YOUR_KEY)
export ANTHROPIC_API_KEY="sk-ant-api03-YOUR_KEY_HERE"
```

### Step 3: Run Claude Cruise

```bash
npx claude-cruise
```

You should see:
```
⚡ Cruise proxy starting on port 4141...
✓ Cruise running at http://localhost:4141
```

### Step 4: Point Claude Code to Use the Proxy

In the **same terminal** (or a new one), set the base URL:

```powershell
# Windows PowerShell
$env:ANTHROPIC_BASE_URL = "http://localhost:4141"
```

```bash
# macOS / Linux
export ANTHROPIC_BASE_URL="http://localhost:4141"
```

### Step 5: Start Claude Code

Now use Claude Code as normal! Open VS Code and use the Claude Code extension.

All requests will go through Claude Cruise, which will:
- Track your usage
- Show a dashboard at http://localhost:4141
- Auto-switch models when you're close to the rate limit

---

## Option B: Clone from GitHub (For Developers)

Use this if you want to:
- Contribute to the project
- Customize the code
- Run from source

### Step 1: Fork the Repository (Optional)

If you want to contribute or save your own copy:

1. Go to [github.com/amitlals/claude-cruise](https://github.com/amitlals/claude-cruise)
2. Click the **Fork** button (top right)
3. This creates your own copy at `github.com/YOUR_USERNAME/claude-cruise`

### Step 2: Clone the Repository

Open your terminal and run:

```bash
# If you forked it (replace YOUR_USERNAME):
git clone https://github.com/YOUR_USERNAME/claude-cruise.git

# Or clone directly from the original:
git clone https://github.com/amitlals/claude-cruise.git
```

### Step 3: Navigate to the Project Folder

```bash
cd claude-cruise
```

Your terminal should now show something like:
```
C:\Users\YourName\claude-cruise>      # Windows
~/claude-cruise$                       # macOS/Linux
```

### Step 4: Install Dependencies

```bash
npm install
```

Wait for it to complete. You should see:
```
added XXX packages in Xs
```

### Step 5: Set Your Anthropic API Key

Get your key from [console.anthropic.com](https://console.anthropic.com/) → API Keys

```powershell
# Windows PowerShell
$env:ANTHROPIC_API_KEY = "sk-ant-api03-YOUR_KEY_HERE"
```

```bash
# macOS / Linux
export ANTHROPIC_API_KEY="sk-ant-api03-YOUR_KEY_HERE"
```

### Step 6: Start Claude Cruise

```bash
npm run dev
```

Or run the proxy directly:

```bash
npx tsx src/proxy/server.ts
```

You should see:
```
⚡ Cruise proxy starting on port 4141...
✓ Cruise running at http://localhost:4141
```

### Step 7: Open Another Terminal for Claude Code

**Important:** Keep the first terminal running! Open a NEW terminal.

In the new terminal, set the proxy URL:

```powershell
# Windows PowerShell
$env:ANTHROPIC_BASE_URL = "http://localhost:4141"
```

```bash
# macOS / Linux
export ANTHROPIC_BASE_URL="http://localhost:4141"
```

### Step 8: Use Claude Code

Now open VS Code and use Claude Code as normal. All requests go through Cruise!

---

## 📺 Web Dashboard

Open your browser to **http://localhost:4141** to see:

| Feature | Description |
|---------|-------------|
| 🎛️ **Usage Gauge** | Visual meter showing how close you are to the limit |
| 📊 **Model Status** | Which model is active (Sonnet/Haiku/OpenRouter/Ollama) |
| 💰 **Cost Tracking** | Session, today, and weekly costs |
| 📈 **Activity Feed** | Real-time log of all requests |
| 🔄 **Routing Status** | Shows when auto-routing is active |

Example -<br>
<img width="410" height="554" alt="image" src="https://github.com/user-attachments/assets/e3e26cf5-88c3-489f-842e-a8a53069b265" />

---

## 🔄 How Auto-Routing Works

When you approach your rate limit, Claude Cruise automatically switches to cheaper/backup models:

```
Usage Level          Model Used              Cost
─────────────────────────────────────────────────
0% - 70%      →      Claude Sonnet           $3/M tokens
70% - 85%     →      Claude Haiku            $0.8/M tokens (73% cheaper!)
85% - 95%     →      OpenRouter              $3.5/M tokens (different provider)
95%+          →      Ollama (local)          FREE
```

### What Happens When You Hit 429?

1. **Detection** — Cruise sees the rate limit error
2. **Learning** — Records how many tokens triggered it
3. **Switching** — Routes to next provider immediately
4. **Recovery** — Returns to primary after ~5 hours

---

## 🔑 Setting Up Fallback Providers (Optional)

For best protection, add backup providers:

### OpenRouter (Cloud Backup)

1. Go to [openrouter.ai](https://openrouter.ai/)
2. Sign up and get an API key
3. Set it:
```bash
export OPENROUTER_API_KEY="sk-or-v1-YOUR_KEY"
```

### Ollama (Free Local Backup)

1. Install from [ollama.ai](https://ollama.ai/)
2. Pull a model: `ollama pull qwen2.5-coder:32b`
3. Enable in Cruise:
```bash
export OLLAMA_ENABLED=true
```

---

## 🛠️ Troubleshooting

### "Cannot find module" Error
```bash
# Make sure you're in the right directory
cd claude-cruise
npm install
```

### "ANTHROPIC_API_KEY not set" Error
```bash
# Set your API key again (it resets when you close terminal)
$env:ANTHROPIC_API_KEY = "sk-ant-api03-..."   # Windows
export ANTHROPIC_API_KEY="sk-ant-api03-..."   # macOS/Linux
```

### Dashboard Not Loading
1. Make sure the server is running (check terminal for `✓ Cruise running`)
2. Try http://localhost:4141 (not https)
3. Check if port 4141 is blocked by firewall

### Claude Code Not Using Proxy
```bash
# Make sure ANTHROPIC_BASE_URL is set
echo $env:ANTHROPIC_BASE_URL   # Windows PowerShell
echo $ANTHROPIC_BASE_URL       # macOS/Linux
# Should show: http://localhost:4141
```

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork** the repo on GitHub
2. **Clone** your fork locally
3. **Create a branch**: `git checkout -b my-feature`
4. **Make changes** and test
5. **Commit**: `git commit -m "Add my feature"`
6. **Push**: `git push origin my-feature`
7. **Open a Pull Request** on GitHub

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## ❓ FAQ

**Q: Does this work with claude.ai web chat?**  
A: No. Claude.ai connects directly to Anthropic from your browser. Only API-based tools can be proxied.

**Q: Is my API key safe?**  
A: Yes. Your key never leaves your machine. Cruise runs locally.

**Q: Will this affect response quality?**  
A: When using Sonnet, no change. Haiku is slightly less capable but much faster/cheaper.

**Q: How do I stop Claude Cruise?**  
A: Press `Ctrl+C` in the terminal where it's running.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file.

---

## ⚠️ Legal Disclaimer

**Important:** This project is an independent, community-driven tool and is **NOT affiliated with, endorsed by, or supported by Anthropic PBC**. Claude Code and Claude are trademarks of Anthropic.

Claude Cruise is a monitoring and routing tool that operates as a transparent proxy. It does not:
- Modify or intercept API responses inappropriately
- Violate Anthropic's Terms of Service
- Bypass security or authentication mechanisms
- Store or transmit API keys to third parties

**Use at your own risk.** The authors are not responsible for:
- API quota management decisions made by this tool
- Costs incurred through auto-routing
- Any violations of third-party service terms

Always review your API usage and costs through official provider dashboards.

---

## 💖 Support This Project

If Claude Cruise saves you time and frustration, consider supporting its development!

<a href="https://ko-fi.com/amitlall" target="_blank">
  <img src="https://ko-fi.com/img/githubbutton_sm.svg" alt="Support me on Ko-fi" />
</a>

Your support helps:
- 🔧 Maintain and improve the codebase
- 🚀 Add new features and providers
- 📚 Keep documentation up-to-date
- ☕ Fuel late-night coding sessions!

---

<div align="center">

**⚡ Stop hitting rate limits. Start shipping.**

Built with ❤️ by [Amit Lal](https://github.com/amitlals)

[⭐ Star on GitHub](https://github.com/amitlals/claude-cruise) • [🐛 Report Bug](https://github.com/amitlals/claude-cruise/issues) • [💡 Request Feature](https://github.com/amitlals/claude-cruise/issues) • [☕ Buy Me a Coffee](https://ko-fi.com/amitlall)

</div>
