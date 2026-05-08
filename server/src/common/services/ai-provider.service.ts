import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

interface PoolEntry {
  label: string;
  client: OpenAI;
  model: string;
}

// Flat ordered pool — tried left-to-right on every failure.
// Groq first (fastest free tier), then several OpenRouter free models
// (429 often so we spread across models), Cerebras and Gemini as final fallbacks.
const MODEL_POOL = [
  'groq/llama-3.3-70b-versatile',
  'openrouter/google/gemma-4-31b-it:free',
  'openrouter/qwen/qwen3-next-80b-a3b-instruct:free',
  'openrouter/meta-llama/llama-3.3-70b-instruct:free',
  'openrouter/openai/gpt-oss-120b:free',
  'openrouter/z-ai/glm-4.5-air:free',
  'openrouter/meta-llama/llama-3.2-3b-instruct:free',
  'cerebras/llama3.1-8b',
  'gemini/gemini-2.0-flash',
];

@Injectable()
export class AIProviderService {
  private readonly logger = new Logger(AIProviderService.name);
  private readonly pool: PoolEntry[];

  constructor(private configService: ConfigService) {
    const clients = this.buildClients();
    this.pool = MODEL_POOL
      .map(entry => this.resolveEntry(entry, clients))
      .filter((e): e is PoolEntry => e !== null);

    if (this.pool.length === 0) {
      throw new Error(
        'No AI provider API keys configured. Set at least one of: GROQ_API_KEY, OPENROUTER_API_KEY, CEREBRAS_API_KEY, GEMINI_API_KEY',
      );
    }
    this.logger.log(`AI pool ready (${this.pool.length} entries): ${this.pool.map(e => e.label).join(' → ')}`);
  }

  private buildClients(): Record<string, OpenAI | null> {
    const get = (key: string) => this.configService.get<string>(key) ?? '';

    return {
      groq: get('GROQ_API_KEY')
        ? new OpenAI({ baseURL: 'https://api.groq.com/openai/v1', apiKey: get('GROQ_API_KEY'), timeout: 8000 })
        : null,
      openrouter: get('OPENROUTER_API_KEY')
        ? new OpenAI({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey: get('OPENROUTER_API_KEY'),
            timeout: 10000,
            defaultHeaders: { 'HTTP-Referer': 'https://prepmate.app', 'X-Title': 'PrepMate' },
          })
        : null,
      cerebras: get('CEREBRAS_API_KEY')
        ? new OpenAI({ baseURL: 'https://api.cerebras.ai/v1', apiKey: get('CEREBRAS_API_KEY'), timeout: 8000 })
        : null,
      gemini: get('GEMINI_API_KEY')
        ? new OpenAI({
            baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
            apiKey: get('GEMINI_API_KEY'),
            timeout: 20000,
          })
        : null,
    };
  }

  private resolveEntry(poolId: string, clients: Record<string, OpenAI | null>): PoolEntry | null {
    const slash = poolId.indexOf('/');
    const provider = poolId.slice(0, slash);
    const model = poolId.slice(slash + 1);
    const client = clients[provider];
    if (!client) return null;
    return { label: poolId, client, model };
  }

  async complete(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options: { timeoutMs?: number; json?: boolean } = {},
  ): Promise<string> {
    const errors: string[] = [];

    for (const entry of this.pool) {
      try {
        this.logger.debug(`Trying: ${entry.label}`);
        const response = await entry.client.chat.completions.create(
          {
            model: entry.model,
            messages,
            ...(options.json ? { response_format: { type: 'json_object' } } : {}),
          },
          options.timeoutMs ? { timeout: options.timeoutMs } : undefined,
        );
        const text = response.choices[0]?.message?.content ?? '';
        this.logger.debug(`${entry.label} succeeded`);
        return text;
      } catch (error) {
        const msg = (error as Error)?.message ?? String(error);
        this.logger.warn(`${entry.label} failed: ${msg}`);
        errors.push(`${entry.label}: ${msg}`);
      }
    }

    throw new Error(`All AI providers failed — ${errors.join(' | ')}`);
  }

  async *stream(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  ): AsyncGenerator<string> {
    const errors: string[] = [];

    for (const entry of this.pool) {
      try {
        this.logger.debug(`Streaming from: ${entry.label}`);
        const aiStream = await entry.client.chat.completions.create({
          model: entry.model,
          messages,
          stream: true,
        });

        let started = false;
        for await (const chunk of aiStream) {
          const text = chunk.choices[0]?.delta?.content ?? '';
          if (text) {
            started = true;
            yield text;
          }
        }

        if (!started) {
          errors.push(`${entry.label}: empty stream`);
          continue;
        }
        return;
      } catch (error) {
        const msg = (error as Error)?.message ?? String(error);
        this.logger.warn(`Stream ${entry.label} failed: ${msg}`);
        errors.push(`${entry.label}: ${msg}`);
      }
    }

    throw new Error(`All AI providers failed for streaming — ${errors.join(' | ')}`);
  }
}
