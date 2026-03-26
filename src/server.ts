import express, { Request, Response, NextFunction } from "express";
import cron from "node-cron";
import { runAgent, VALID_AGENTS, AgentResponse } from "./agents";

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT || "3000", 10);

// --- Request logging middleware ---

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// --- Health check ---

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    agents: VALID_AGENTS,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// --- Agent endpoint ---

interface AgentRequestBody {
  context: string;
  task: string;
}

app.post("/agent/:name", async (req: Request, res: Response) => {
  const name = req.params.name as string;
  const { context, task } = req.body as AgentRequestBody;

  // Validate agent name
  if (!VALID_AGENTS.includes(name)) {
    res.status(400).json({
      error: `Invalid agent. Valid agents: ${VALID_AGENTS.join(", ")}`,
    });
    return;
  }

  // Validate input
  if (!context || typeof context !== "string") {
    res.status(400).json({ error: "Missing or invalid 'context' field" });
    return;
  }
  if (!task || typeof task !== "string") {
    res.status(400).json({ error: "Missing or invalid 'task' field" });
    return;
  }

  console.log(`[${new Date().toISOString()}] Agent ${name} invoked`);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const result: AgentResponse = await runAgent(name, context, task);
    clearTimeout(timeout);

    console.log(
      `[${new Date().toISOString()}] Agent ${name} completed — risk: ${result.risk_level}`
    );
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(
      `[${new Date().toISOString()}] Agent ${name} error: ${message}`
    );
    res.status(500).json({ error: message, agent: name });
  }
});

// --- Webhook endpoint ---

interface WebhookBody {
  event: string;
  agent?: string;
  context?: string;
  task?: string;
}

app.post("/webhook", async (req: Request, res: Response) => {
  const { event, agent, context, task } = req.body as WebhookBody;

  if (!event) {
    res.status(400).json({ error: "Missing 'event' field" });
    return;
  }

  console.log(`[${new Date().toISOString()}] Webhook received: ${event}`);

  // If the webhook includes an agent task, run it
  if (agent && context && task && VALID_AGENTS.includes(agent)) {
    try {
      const result = await runAgent(agent, context, task);
      res.json({ event, result });
      return;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(
        `[${new Date().toISOString()}] Webhook agent error: ${message}`
      );
      res.status(500).json({ error: message, event });
      return;
    }
  }

  res.json({ event, status: "received", timestamp: new Date().toISOString() });
});

// --- Cron: daily compliance digest at 0800 SGT (UTC+8 = 0000 UTC) ---

cron.schedule(
  "0 0 * * *",
  async () => {
    console.log(
      `[${new Date().toISOString()}] Cron: running daily compliance digest`
    );
    try {
      const result = await runAgent(
        "compass",
        "Daily automated compliance check for Singapore financial sector operations",
        "Perform a compliance status check against MAS TRM Guidelines and CCOP requirements. Identify any areas requiring immediate attention and provide a prioritized list of compliance actions for today."
      );
      console.log(
        `[${new Date().toISOString()}] Cron digest complete — risk: ${result.risk_level}`
      );
      console.log(
        `[${new Date().toISOString()}] Digest recommendations: ${result.recommendations.length} items`
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(
        `[${new Date().toISOString()}] Cron digest error: ${message}`
      );
    }
  },
  { timezone: "Asia/Singapore" }
);

// --- Start server ---

app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] CyberOps Advisory API running on port ${PORT}`);
  console.log(`[${new Date().toISOString()}] Active agents: ${VALID_AGENTS.join(", ")}`);
  console.log(`[${new Date().toISOString()}] Daily digest scheduled: 0800 SGT`);
});
