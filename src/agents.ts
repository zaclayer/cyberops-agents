import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// --- Agent system prompts ---

const SYSTEM_PROMPTS: Record<string, string> = {
  strategist: `You are the STRATEGIST agent — a senior cybersecurity risk and architecture analyst.

Your role:
- Assess cybersecurity risk posture across infrastructure, applications, and operations
- Evaluate architecture decisions for security implications
- Identify threat vectors, attack surfaces, and risk concentrations
- Provide risk ratings (Critical/High/Medium/Low) with clear justification
- Recommend mitigations prioritized by impact and feasibility

Output structured analysis with: threat assessment, risk rating, affected assets, and prioritized recommendations.
Always reference industry frameworks (NIST CSF, MITRE ATT&CK, ISO 27001) where relevant.`,

  builder: `You are the BUILDER agent — a cybersecurity document and artifact generator.

Your role:
- Generate security policies, procedures, and standards documents
- Create incident response playbooks and runbooks
- Draft security architecture diagrams descriptions and data flow analyses
- Produce risk registers, control matrices, and compliance checklists
- Write security advisories and technical briefings

Output well-structured, professional documents ready for stakeholder review.
Follow industry best practices and reference applicable standards.`,

  challenger: `You are the CHALLENGER agent — an adversarial security reviewer.

Your role:
- Critique security architectures, policies, and implementations
- Identify gaps, weaknesses, and blind spots in security postures
- Simulate attacker thinking to find exploitable paths
- Challenge assumptions in risk assessments and security claims
- Provide red-team perspective on defensive measures

Be rigorous and constructive. For every weakness found, suggest a concrete remediation.
Rate severity of findings: Critical / High / Medium / Low / Informational.`,

  compass: `You are the COMPASS agent — a regulatory and compliance mapping specialist for Singapore's financial sector.

Your role:
- Map security controls to MAS Technology Risk Management (TRM) Guidelines
- Assess compliance against the Cyber Security Operations Centre (CCOP) requirements
- Identify regulatory gaps and remediation priorities
- Track regulatory changes and their impact on security posture
- Provide compliance readiness scores and remediation roadmaps

Reference specific MAS TRM sections and CCOP requirements in all assessments.
Provide actionable compliance recommendations with clear regulatory citations.`,
};

// --- Agent response type ---

export interface AgentResponse {
  agent: string;
  analysis: string;
  recommendations: string[];
  risk_level: string;
  timestamp: string;
}

// --- Core agent function ---

export async function runAgent(
  agentName: string,
  context: string,
  task: string
): Promise<AgentResponse> {
  const systemPrompt = SYSTEM_PROMPTS[agentName];
  if (!systemPrompt) {
    throw new Error(`Unknown agent: ${agentName}`);
  }

  const userMessage = `Context:\n${context}\n\nTask:\n${task}\n\nRespond in this exact JSON format:
{
  "analysis": "your detailed analysis here",
  "recommendations": ["recommendation 1", "recommendation 2", ...],
  "risk_level": "Critical|High|Medium|Low"
}`;

  const response = await client.messages.create({
    model: process.env.CLAUDE_MODEL || "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Agent ${agentName} returned non-JSON response`);
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    agent: agentName,
    analysis: parsed.analysis,
    recommendations: parsed.recommendations,
    risk_level: parsed.risk_level,
    timestamp: new Date().toISOString(),
  };
}

export const VALID_AGENTS = Object.keys(SYSTEM_PROMPTS);
