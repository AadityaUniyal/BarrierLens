export interface LLMDecision {
  thought: string;
  action: 'press_key' | 'type_text' | 'wait' | 'finish_task';
  key?: string;
  text?: string;
  targetSelector?: string;
  isGoalReached: boolean;
  tierUsed: 2 | 3; // 2=Groq, 3=Gemini
}

export class LLMRouter {
  private groqApiKey: string;
  private geminiApiKey: string;

  constructor() {
    this.groqApiKey = process.env.GROQ_API_KEY || '';
    this.geminiApiKey = process.env.GEMINI_API_KEY || '';
  }

  /**
   * Fast Tier 2 Decision via Groq (LLaMA 3.3 70B) over the compact AX-tree
   */
  async decideNextAction(
    goal: string,
    persona: string,
    compactAXTree: string,
    history: string[]
  ): Promise<LLMDecision> {
    const prompt = `You are BarrierLens, an autonomous task-conditioned accessibility auditor.
Goal: "${goal}"
Persona: "${persona}" (Keyboard-only: You CANNOT click. You can only navigate with Tab, Shift+Tab, Enter, Space, Escape, or Type text into focused fields).

Current Compact Accessibility Tree:
${compactAXTree}

Recent Action History:
${history.slice(-5).join('\n') || 'None'}

Rules:
1. Return ONLY valid JSON.
2. Decide the single best next action inside the allowed keyboard persona space to advance toward the goal.
3. If the focused element requires typing, select action "type_text" with text.
4. If you want to move focus to the next control, select action "press_key" with key "Tab" (or "Shift+Tab").
5. If the focused button or link should be triggered, select action "press_key" with key "Enter" or "Space".
6. If the goal is fully accomplished, set "isGoalReached": true and action "finish_task".

Output format:
{
  "thought": "brief reasoning",
  "action": "press_key" | "type_text" | "wait" | "finish_task",
  "key": "Tab" | "Enter" | "Space" | "Escape",
  "text": "text to type if applicable",
  "isGoalReached": false
}`;

    // Try Tier 2 (Groq) first for speed and token cost
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
          })
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
    if (this.geminiApiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.geminiApiKey}`;
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

    // Deterministic Rule Fallback (Tier 0)
    return {
      thought: 'Autonomous rule fallback: Advance Tab focus',
      action: 'press_key',
      key: 'Tab',
      isGoalReached: false,
      tierUsed: 2
    };
  }

  /**
   * Gemini Flash Fix Synthesizer: Generates minimal surgical HTML/ARIA patch
   */
  async generateFixPatch(offendingHtml: string, barrierFinding: string): Promise<string> {
    if (!this.geminiApiKey) {
      return offendingHtml.includes('aria-label') 
        ? offendingHtml 
        : offendingHtml.replace(/<([a-z0-9]+)/i, '<$1 aria-label="Action"');
    }

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

    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.geminiApiKey}`;
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
        return text.replace(/```html/g, '').replace(/```/g, '').trim();
      }
    } catch (err) {
      console.error('[Fix Synthesizer] Gemini error:', err);
    }

    return offendingHtml;
  }
}
