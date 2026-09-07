/**
 * Helper simple para enviar mensajes a un backend Express que expone un agente Mastra.
 * - Llama a `/api/agents/:agentId/generate` por defecto.
 * - Si `useResponsesApi` es true, usa `/api/v1/responses` (Responses API).
 *
 * Uso:
 * import { sendAgentMessage, extractAssistantText } from './mastra/agent-client';
 * const resp = await sendAgentMessage('Hola', { baseUrl: 'http://localhost:4111', agentId: 'ciges-agent' });
 * console.log(extractAssistantText(resp));
 */

export type MastraMessagePart = { type?: 'input_text' | 'text' | 'output_text'; text: string };
export type MastraMessageObj = { role: 'system' | 'developer' | 'user' | 'assistant'; content: string | MastraMessagePart[] };
export type MastraMessage = string | MastraMessageObj;

export interface SendAgentOptions {
  baseUrl?: string; // default: http://localhost:4111
  agentId?: string; // default: ciges-agent
  useResponsesApi?: boolean; // if true, POST /api/v1/responses
  headers?: Record<string, string>;
  store?: boolean;
  stream?: boolean; // streaming not fully handled here (returns response or throws)
  instructions?: string; // optional override instructions
  timeoutMs?: number;
}

export async function sendAgentMessage(messages: MastraMessage | MastraMessage[], opts: SendAgentOptions = {}): Promise<any> {
  // Streaming requires a different handling (SSE / chunked fetch). This helper
  // focuses on single-shot (non-streaming) requests. If you need streaming,
  // implement a dedicated streaming helper.
  if (opts.stream) {
    throw new Error('Streaming mode not supported by sendAgentMessage; set stream=false or implement a streaming helper');
  }

  const baseUrl = (opts.baseUrl || 'http://localhost:4111').replace(/\/+$/, '');
  const agentId = opts.agentId || 'ciges-agent';
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(opts.headers || {}) };

  const normalizeArray = (m: MastraMessage | MastraMessage[]): MastraMessageObj[] => {
    if (typeof m === 'string') return [{ role: 'user', content: m }];
    if (!Array.isArray(m)) return [m];
    return m.map(item => (typeof item === 'string' ? ({ role: 'user', content: item } as MastraMessageObj) : item));
  };

  if (opts.useResponsesApi) {
    const input = Array.isArray(messages) ? normalizeArray(messages) : (typeof messages === 'string' ? messages : normalizeArray(messages));
    const body: any = { agent_id: agentId, input, stream: !!opts.stream, store: !!opts.store };
    if (opts.instructions) body.instructions = opts.instructions;

    const res = await fetch(`${baseUrl}/api/v1/responses`, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Mastra responses API error ${res.status}: ${text}`);
    }
    return await res.json();
  }

  const msgs = normalizeArray(messages);
  const body: any = { messages: msgs, stream: !!opts.stream };
  if (typeof opts.store !== 'undefined') body.store = !!opts.store;
  if (opts.instructions) body.instructions = opts.instructions;

  const res = await fetch(`${baseUrl}/api/agents/${encodeURIComponent(agentId)}/generate`, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Mastra agent generate error ${res.status}: ${text}`);
  }
  return await res.json();
}

export function extractAssistantText(resp: any): string {
  if (!resp) return '';

  // Common Responses API shape
  if (typeof resp.output_text === 'string' && resp.output_text.trim()) return resp.output_text;

  // Mastra client/agent.generate common shapes
  if (typeof resp.text === 'string' && resp.text.trim()) return resp.text;
  if (resp.result) {
    if (typeof resp.result.response === 'string' && resp.result.response.trim()) return resp.result.response;
    if (typeof resp.result.text === 'string' && resp.result.text.trim()) return resp.result.text;
  }

  // Items array (Responses API or tool outputs)
  if (Array.isArray(resp.output)) {
    const parts: string[] = [];
    for (const item of resp.output) {
      if (!item) continue;
      if (item.type === 'message' && Array.isArray(item.content)) {
        for (const part of item.content) {
          if (part && typeof part.text === 'string') parts.push(part.text);
        }
      } else if (item.type === 'message' && typeof item.content === 'string') {
        parts.push(item.content);
      } else if (item.type === 'function_call_output' && typeof item.output === 'string') {
        parts.push(item.output);
      }
    }
    if (parts.length) return parts.join('');
  }

  // Fallbacks
  if (typeof resp.output === 'string') return resp.output;
  if (typeof resp === 'string') return resp;

  // Try to extract nested text from common keys
  const maybe = resp?.result?.response || resp?.result?.text || resp?.output_text || resp?.text;
  if (typeof maybe === 'string') return maybe;

  return JSON.stringify(resp);
}

export default sendAgentMessage;
