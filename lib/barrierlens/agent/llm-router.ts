import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { backendBreaker } from './backend-circuit-breaker';

export interface LLMDecision {
  thought: string;
  action: 'press_key' | 'type_text' | 'wait' | 'finish_task';
  key?: string;
  text?: string;
  targetSelector?: string;
  isGoalReached: boolean;
  tierUsed: 0 | 1 | 2 | 3; // 0=rule fallback, 1=ranker, 2=Local SLM / Groq, 3=Gemini
  engine?: string;
}

export class LLMRouter {
  private groqApiKey: string;
  private geminiApiKey: string;
  private backendUrl: string;
  private bedrockClient?: BedrockRuntimeClient;

  constructor() {
    this.groqApiKey = process.env.GROQ_API_KEY || '';
    this.geminiApiKey = process.env.GEMINI_API_KEY || '';
    this.backendUrl = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000';

    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      this.bedrockClient = new BedrockRuntimeClient({
        region: process.env.BEDROCK_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
    }
  }

  /**
   * Fast Tier 2 Decision via Local GPU SLM (Qwen2.5-Coder on RTX 4050)
   * or Cloud Groq (LLaMA 3.3 70B) over the compact AX-tree
   */
  async decideNextAction(
    goal: string,
    persona: string,
    compactAXTree: string,
    history: string[],
    reflexionContext?: string,
    currentFocusSelector?: string
  ): Promise<LLMDecision> {
    // 1. Try Local GPU SLM First (100% Offline, Private, Runs on RTX 4050)
    try {
      const slmResult = await this.queryLocalSLM(goal, persona, currentFocusSelector || '', compactAXTree, history, reflexionContext);
      if (slmResult) {
        return slmResult;
      }
    } catch (slmErr) {
      console.warn('[LLM Router] Local GPU SLM unavailable, trying cloud routers:', slmErr);
    }

    const prompt = `You are BarrierLens, an autonomous task-conditioned accessibility auditor.
Goal: "${goal}"
Persona: "${persona}" (Keyboard-only: You CANNOT click. You can only navigate with Tab, Shift+Tab, Enter, Space, Escape, or Type text into focused fields).

Current Compact Accessibility Tree:
${compactAXTree}

Recent Action History:
${history.slice(-5).join('\n') || 'None'}
${reflexionContext || ''}
Rules:
1. Return ONLY valid JSON.
2. Decide the single best next action inside the allowed keyboard persona space to advance toward the goal.
3. If the focused element requires typing, select action "type_text" with text.
4. If you want to move focus to the next control, select action "press_key" with key "Tab" (or "Shift+Tab").
5. If the focused button or link should be triggered, select action "press_key" with key "Enter" or "Space".
6. If stuck or in a stagnant branch, consider "Escape" or "Shift+Tab" based on episodic self-correction.
7. If the goal is fully accomplished, set "isGoalReached": true and action "finish_task".

Output format:
{
  "thought": "brief reasoning",
  "action": "press_key" | "type_text" | "wait" | "finish_task",
  "key": "Tab" | "Enter" | "Space" | "Escape",
  "text": "text to type if applicable",
  "isGoalReached": false
}`;

    // 2. Try Amazon Bedrock Nova Foundation Model First (Verified AWS STS Credentials)
    if (this.bedrockClient) {
      try {
        const payload = {
          messages: [{
            role: 'user',
            content: [{ text: `${prompt}\nOutput strict JSON.` }]
          }],
          inferenceConfig: { max_new_tokens: 300, temperature: 0.1 }
        };

        const cmd = new InvokeModelCommand({
          modelId: 'amazon.nova-micro-v1:0',
          contentType: 'application/json',
          accept: 'application/json',
          body: JSON.stringify(payload)
        });

        const res = await this.bedrockClient.send(cmd);
        const dec = new TextDecoder().decode(res.body);
        const parsedBody = JSON.parse(dec);
        const textOut = parsedBody.output?.message?.content?.[0]?.text || '';
        const jsonMatch = textOut.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            thought: parsed.thought || 'Bedrock Nova inferred optimal navigation step',
            action: parsed.action || 'press_key',
            key: parsed.key || 'Tab',
            text: parsed.text,
            isGoalReached: !!parsed.isGoalReached,
            tierUsed: 2,
            engine: 'amazon.nova-micro-v1:0'
          };
        }
      } catch (bedrockErr: any) {
        console.warn('[LLM Router] Bedrock Nova notice:', bedrockErr.message);
      }
    }

    // 3. Try Tier 2 (Groq) fallback
    if (this.groqApiKey) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.groqApiKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: 'You are an accessibility auditor agent that outputs strict JSON.' },
              { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1,
            max_tokens: 400
          }),
          signal: AbortSignal.timeout(6000)
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          const parsed = JSON.parse(content);
          return {
            thought: parsed.thought || 'Advancing focus towards goal',
            action: parsed.action || 'press_key',
            key: parsed.key || 'Tab',
            text: parsed.text,
            isGoalReached: !!parsed.isGoalReached,
            tierUsed: 2
          };
        }
      } catch (err) {
        console.warn('[LLM Router] Groq error, falling back to Gemini:', err);
      }
    }

    // Tier 3 Fallback (Gemini API)
    const isGoogleAiKey = this.geminiApiKey && !this.geminiApiKey.startsWith('AQ.');
    if (isGoogleAiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.geminiApiKey}`;
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          const parsed = JSON.parse(text);
          return {
            thought: parsed.thought || 'Gemini reasoning',
            action: parsed.action || 'press_key',
            key: parsed.key || 'Tab',
            text: parsed.text,
            isGoalReached: !!parsed.isGoalReached,
            tierUsed: 3
          };
        }
      } catch (err) {
        console.warn('[LLM Router] Gemini fallback error:', err);
      }
    }

    // Context-Aware Deterministic Rule Fallback (Tier 0)
    const recentHistory = (history || []).slice(-3);
    const consecutiveTabs = recentHistory.filter(h => h === 'Tab').length;

    if (consecutiveTabs >= 3) {
      return {
        thought: 'Autonomous rule fallback: Consecutive tabs detected, probing Escape to test modal/drawer escape',
        action: 'press_key',
        key: 'Escape',
        isGoalReached: false,
        tierUsed: 0
      };
    }

    if (currentFocusSelector && (currentFocusSelector.includes('button') || currentFocusSelector.includes('submit') || currentFocusSelector.includes('confirm'))) {
      return {
        thought: 'Autonomous rule fallback: Action button focused, activating with Enter',
        action: 'press_key',
        key: 'Enter',
        isGoalReached: false,
        tierUsed: 0
      };
    }

    return {
      thought: 'Autonomous rule fallback: Advance focus traversal with Tab',
      action: 'press_key',
      key: 'Tab',
      isGoalReached: false,
      tierUsed: 0
    };
  }

  /**
   * Fast Tier 2 Local SLM Decision via Python backend on RTX 4050 CUDA
   */
  private async queryLocalSLM(
    goal: string,
    persona: string,
    currentFocus: string,
    compactAXTree: string,
    history: string[],
    reflexionHint?: string
  ): Promise<LLMDecision | null> {
    const isOnline = await backendBreaker.checkAvailability();
    if (!isOnline) {
      return null;
    }

    try {
      const res = await fetch(`${this.backendUrl}/api/ml/slm-reason`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal,
          persona,
          currentFocus,
          compactAXTree,
          history,
          reflexionHint: reflexionHint || ''
        }),
        signal: AbortSignal.timeout(2000)
      });

      if (!res.ok) return null;
      const data = await res.json();
      backendBreaker.markOnline();
      return {
        thought: data.thought || 'Local GPU SLM reasoning step',
        action: data.action || 'press_key',
        key: data.key || 'Tab',
        text: data.text,
        isGoalReached: !!data.isGoalReached,
        tierUsed: 2,
        engine: 'qwen2.5_coder_gpu'
      };
    } catch {
      backendBreaker.markOffline();
      return null;
    }
  }

  /**
   * Local GPU SLM AST Code Remediation
   */
  async synthesizeRemediationCode(
    defectKind: string,
    targetSelector: string,
    targetSnippet: string = '',
    proofExplanation: string = ''
  ): Promise<string | null> {
    const isOnline = await backendBreaker.checkAvailability();
    if (!isOnline) {
      return null;
    }

    try {
      const res = await fetch(`${this.backendUrl}/api/ml/slm-remediate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defectKind,
          targetSelector,
          targetSnippet,
          proofExplanation
        }),
        signal: AbortSignal.timeout(3000)
      });

      if (!res.ok) return null;
      const data = await res.json();
      backendBreaker.markOnline();
      return data.patchedCode || null;
    } catch {
      backendBreaker.markOffline();
      return null;
    }
  }

  /**
   * Fix Synthesizer: Generates minimal surgical HTML/ARIA patch using Bedrock Nova, Groq LLaMA 3.3 or Gemini 2.0 Flash
   */
  async generateFixPatch(offendingHtml: string, barrierFinding: string): Promise<string> {
    const prompt = `You are the BarrierLens Autonomous Accessibility Repair Engine.
Issue Identified: ${barrierFinding}
Offending Element HTML / Context:
\`\`\`html
${offendingHtml}
\`\`\`

Task:
Produce a minimal, surgical HTML/ARIA fix patch.
Rules:
- Do NOT rewrite entire components. Only fix the accessibility attribute or semantic tag (e.g. add aria-label, change div to button, add role="dialog" aria-modal="true", or tabindex="0").
- Return ONLY the exact replacement HTML snippet. No markdown wrappers or explanation.`;

    // 1. Try Amazon Bedrock Nova Micro First (Live AWS STS authentication, zero DNS bottlenecks)
    if (this.bedrockClient) {
      try {
        const payload = {
          messages: [{
            role: 'user',
            content: [{ text: prompt }]
          }],
          inferenceConfig: { max_new_tokens: 300, temperature: 0.1 }
        };

        const cmd = new InvokeModelCommand({
          modelId: 'amazon.nova-micro-v1:0',
          contentType: 'application/json',
          accept: 'application/json',
          body: JSON.stringify(payload)
        });

        const res = await this.bedrockClient.send(cmd);
        const dec = new TextDecoder().decode(res.body);
        const parsedBody = JSON.parse(dec);
        const textOut = parsedBody.output?.message?.content?.[0]?.text || '';
        const cleaned = textOut.replace(/^```html\s*/i, '').replace(/```\s*$/i, '').trim();
        if (cleaned && cleaned.includes('<')) {
          return cleaned;
        }
      } catch (err: any) {
        console.warn('[Fix Synthesizer] Bedrock Nova notice:', err.message);
      }
    }

    // 2. Try Groq LLaMA 3.3 70B Fallback
    if (this.groqApiKey) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.groqApiKey}`
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: 'You are an accessibility patch engine. Output only raw HTML patch code, no markdown codeblocks, no explanations.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.1,
            max_tokens: 300
          })
        });

        if (response.ok) {
          const data = await response.json();
          const patch = data.choices?.[0]?.message?.content || '';
          const cleaned = patch.replace(/^```html\s*/i, '').replace(/```\s*$/i, '').trim();
          if (cleaned && cleaned.includes('<')) {
            return cleaned;
          }
        }
      } catch (err) {
        console.warn('[Fix Synthesizer] Groq error, trying Gemini:', err);
      }
    }

    // 2. Try Gemini 2.0 Flash (if genuine Google AI key configured)
    const isGoogleAiKey = this.geminiApiKey && !this.geminiApiKey.startsWith('AQ.');
    if (isGoogleAiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.geminiApiKey}`;
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.0 }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const cleaned = text.replace(/^```html\s*/i, '').replace(/```\s*$/i, '').trim();
          if (cleaned && cleaned.includes('<')) {
            return cleaned;
          }
        }
      } catch (err) {
        console.error('[Fix Synthesizer] Gemini error:', err);
      }
    }

    // 3. Deterministic ARIA heuristic fallback
    return offendingHtml.includes('aria-label') 
      ? offendingHtml 
      : offendingHtml.replace(/<([a-z0-9]+)/i, '<$1 aria-label="Action"');
  }
}
