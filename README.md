# DeFlake ❄️🚑

> **Stop Flaky Tests. Start Auto-Healing.**
> Autonomous AI Agent that fixes broken UI tests (Playwright/Cypress/Selenium) in real-time.

![License](https://img.shields.io/badge/license-Proprietary-red.svg)
![Status](https://img.shields.io/badge/status-Beta-yellow.svg)
![Python](https://img.shields.io/badge/python-3.11+-blue.svg)
![Node](https://img.shields.io/badge/node-18+-green.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue)

---

## 🚀 The Problem
UI Tests are fragile. A simple `id` change from `#submit-btn` to `.btn-primary` can break your CI/CD pipeline, costing hours of debugging.

## ✨ The Solution: DeFlake
DeFlake is an **AI-powered self-healing infrastructure**. It doesn't just "retry" tests; it **fixes the code**.

### Key Features
*   🧠 **AI Analysis**: Diagnoses *why* the test failed (DOM change? Content mismatch?).
*   🛠️ **Auto-Patching**: Automatically modifies your source code (`test_login.py`) with the correct selector.
*   ☁️ **SaaS Architecture**: Lightweight clients (Python/Node.js) talk to a centralized Cloud Brain.
*   📊 **Dashboard**: Visualize every healed test and audit the changes.

---

## 🏗️ Architecture

```mermaid
graph LR
    A[CI/CD Runner] -->|Fails| B(DeFlake Plugin);
    B -->|POST Context| C{Cloud Brain API};
    C -->|Analyze| D[LLM (OpenAI)];
    D -->|Fix Code| C;
    C -->|Patch File| B;
    B -->|Re-Run| A;
```

---

## ⚡ Quick Start

### Option A: Python (Pytest + Playwright)
Perfect for data scientists and Python SDETs.

```bash
# 1. Install the adapter
pip install -r adapters/python/requirements.txt

# 2. Run your tests with the plugin
pytest tests/ --deflake
```

### Option B: JavaScript (Node.js / Cypress)
Perfect for frontend developers and QA Engineers on Windows/Mac.

## 🚀 Quick Start (Zero Config)

DeFlake is designed to be a "wrapper" around your existing test command.

1.  **Install** (in your test project):
    ```bash
    npm install deflake --save-dev
    ```

2.  **Run with DeFlake**:
    Simply prepend `npx deflake` to your usual test command:
    ```bash
    # Before
    npx playwright test

    # After (Magic 🪄)
    npx deflake npx playwright test
    ```

    DeFlake will:
    1.  Run your tests.
    2.  If they fail, capture the logs and find your HTML report.
    3.  Analyze the error with AI.
    4.  Print the suggested code fix in your terminal.

## 🔧 Manual Usage

If you prefer to run it manually against existing files:

```bash
npx deflake --log error.log --html playwright-report/index.html
```

---

## 📦 Deployment (SaaS)

DeFlake is designed to run in the cloud.

1.  **Backend**: `Dockerfile` included. Deploy to Railway/Render.
2.  **API**: Exposes `POST /api/deflake` secured with `X-API-KEY`.

### Run Locally with Docker
```bash
docker build -t deflake .
docker run -p 8000:8000 -e DEFLAKE_API_KEY=your-key deflake
```

---

## 🗺️ Roadmap
- [x] **Phase 1-4**: Core Logic, Dashboard, Git Integration.
- [x] **Phase 5**: Auto-Patching (Source Code modification).
- [x] **Phase 6**: SaaS API & Dockerization.
- [x] **Phase 7**: Node.js Adapter (Windows/Linux support).
- [ ] **Phase 8**: Production Cloud Deployment.
- [ ] **Phase 9**: Enterprise SSO.

---

## 🛡️ Security
This project is **Secure by Design**.
- No code is executed without API Key validation.
- Artifacts are sandboxed.

---

Made with ❤️ by the DeFlake Team.
