# Vera: Magicpin AI Challenge

Vera is an autonomous, context-aware AI assistant designed to engage merchants and drive growth through high-quality, actionable, and data-backed outbound messaging. This repository contains the deterministic rule-and-retrieval based backend engine that powers Vera.

## Architecture & Approach

This solution opts for a **Deterministic Rule-Based & Retrieval Engine** rather than real-time unconstrained LLM generation during runtime. 

### Why this approach?
1. **0% Hallucinations**: Every data point (metrics, CTR, customer counts, dates) is deterministically mapped from the provided Context endpoints. Vera will never invent metrics or send false information to a merchant.
2. **Lightning Fast**: The `/v1/tick` and `/v1/reply` endpoints resolve in `<10ms`, completely sidestepping the 30-second API timeout constraint.
3. **Robust Intent Engine**: State tracking allows Vera to reliably detect auto-replies, hostile rejections, and acceptances without unpredictable LLM interpretations.
4. **No Hidden Costs**: Avoids heavy runtime LLM API costs and arbitrary latency.

### Core Components
- **`ContextStore`**: Handles atomic version replacement for categories, merchants, customers, and triggers. Ensures state consistency.
- **`StateStore`**: Handles conversation state tracking (turn counts) and cross-trigger deduplication/suppression.
- **`Composer`**: The decision engine. Reconstructs dynamic messages tailored to each category, merchant, and trigger condition while adhering to voice and taboo constraints.
- **`IntentEngine`**: A specialized classifier that safely navigates merchant auto-replies, push-backs, and explicit opt-ins.

## Project Setup (Local)

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Build the TypeScript source:**
   ```bash
   npm run build
   ```
3. **Start the server:**
   ```bash
   npm start
   ```

The application will run on `http://localhost:8080` (or the port defined in your `.env`).

## Testing

Run the included judge simulator against the local server to verify behavior.
```bash
python3 judge_simulator.py
```
*Note: Ensure you update `TEST_SCENARIO` and provide an LLM API key inside `judge_simulator.py` if you wish to see AI-graded metrics.*

## Deployment Steps

This project is fully containerized and deployment-ready.

### Deploying via Docker
1. **Build the image:**
   ```bash
   docker build -t magicpin-vera .
   ```
2. **Run the container:**
   ```bash
   docker run -p 8080:8080 magicpin-vera
   ```

### Deploying to Cloud Providers (Render / Heroku / AWS / GCP)
This standard Node.js Express setup runs flawlessly on platforms like **Render**, **Heroku**, or **Railway**.

1. Connect your GitHub repository to your chosen platform.
2. Ensure the Build Command is set to: `npm install && npm run build`
3. Ensure the Start Command is set to: `npm start`
4. Expose the environment variable `PORT` if your platform doesn't auto-inject it.
5. Setup health checks to point to `GET /v1/healthz`.

No API keys or external secrets are strictly required for the core deterministic engine to function.
# magicpin_task
