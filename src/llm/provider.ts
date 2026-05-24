import type { LlmConfig } from "../core/types.js";

export interface LlmClient {
  complete(prompt: string): Promise<string>;
}

export function createLlmClient(config: LlmConfig): LlmClient | null {
  if (!config.enabled || isPlaceholder(config.apiKey) || isPlaceholder(config.baseUrl) || isPlaceholder(config.model)) {
    return null;
  }

  return new OpenAiCompatibleClient(config);
}

class OpenAiCompatibleClient implements LlmClient {
  constructor(private readonly config: LlmConfig) {}

  async complete(prompt: string): Promise<string> {
    const url = new URL("chat/completions", ensureTrailingSlash(this.config.baseUrl));
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        messages: [
          {
            role: "system",
            content: "You summarize repositories for coding agents. Be concise, evidence-based, and avoid guessing."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`LLM request failed: ${response.status} ${response.statusText}`);
    }

    const payload = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("LLM response did not include message content.");
    }

    return content;
  }
}

function isPlaceholder(value: string): boolean {
  return !value || value.trim().toLowerCase() === "xx";
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}
