# CyberOps Advisory Agents

4-agent cybersecurity advisory system powered by Claude.

## Agents

| Agent | Role |
|-------|------|
| **strategist** | Risk & architecture analysis |
| **builder** | Document & artifact generation |
| **challenger** | Adversarial security review |
| **compass** | Regulatory mapping (MAS TRM / CCOP) |

## API Endpoints

### Health Check
```
GET /health
```

### Run Agent
```
POST /agent/{name}
Content-Type: application/json

{
  "context": "Organization runs cloud-native microservices on AWS",
  "task": "Assess the risk posture of our API gateway configuration"
}
```

Response:
```json
{
  "agent": "strategist",
  "analysis": "...",
  "recommendations": ["..."],
  "risk_level": "High",
  "timestamp": "2026-03-26T12:00:00.000Z"
}
```

### Webhook
```
POST /webhook
Content-Type: application/json

{
  "event": "security_alert",
  "agent": "challenger",
  "context": "Alert: unusual API traffic spike detected",
  "task": "Analyze this alert for potential attack patterns"
}
```

## Usage Examples

```bash
# Health check
curl https://your-app.railway.app/health

# Run strategist
curl -X POST https://your-app.railway.app/agent/strategist \
  -H "Content-Type: application/json" \
  -d '{"context": "Fintech startup in Singapore", "task": "Assess cloud security posture"}'

# Run compass for compliance
curl -X POST https://your-app.railway.app/agent/compass \
  -H "Content-Type: application/json" \
  -d '{"context": "MAS-regulated payment service", "task": "Map controls to MAS TRM Guidelines"}'
```

## Setup

```bash
npm install
cp .env.example .env  # Add your ANTHROPIC_API_KEY
npm run build
npm start
```

## Automated Schedule

- **Daily 0800 SGT**: COMPASS agent runs a compliance digest against MAS TRM and CCOP requirements.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key (required) |
| `PORT` | Server port (default: 3000) |
