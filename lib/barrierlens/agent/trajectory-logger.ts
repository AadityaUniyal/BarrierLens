import { sql } from '../../supabase/db';

export interface TrajectoryEntry {
  runId: string;
  stepIndex: number;
  goal: string;
  persona: string;
  currentUrl: string;
  axNodeCount: number;
  focusedRole?: string;
  focusedName?: string;
  historyLength: number;
  goalWordOverlap: number;     // 0–1 semantic matching proxy
  rolePriority: number;        // 0–1 based on interactive widget hierarchy
  chosenAction: string;        // 'press_key:Tab', 'type_text:foo', etc.
  chosenSelector?: string;
  tierUsed: 0 | 1 | 2 | 3;     // 0=rules, 1=ranker, 2=groq, 3=gemini
  llmConfidence: number;
  resultedInFinding: boolean;
  resultedInTaskSuccess: boolean;
}

export class TrajectoryLogger {
  private tableEnsured = false;
  private buffer: TrajectoryEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Periodically flush buffer every 10 seconds
    this.flushTimer = setInterval(() => {
      this.flush().catch(() => {});
    }, 10_000);
  }

  private async ensureTable(): Promise<void> {
    if (this.tableEnsured) return;
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS audit_trajectories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          run_id TEXT NOT NULL,
          step_index INTEGER NOT NULL,
          goal TEXT,
          persona TEXT,
          current_url TEXT,
          ax_node_count INTEGER,
          focused_role TEXT,
          focused_name TEXT,
          history_length INTEGER,
          goal_word_overlap FLOAT,
          role_priority FLOAT,
          chosen_action TEXT,
          chosen_selector TEXT,
          tier_used INTEGER,
          llm_confidence FLOAT,
          resulted_in_finding BOOLEAN DEFAULT FALSE,
          resulted_in_task_success BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;
      this.tableEnsured = true;
    } catch {
      // Offline fallback: suppress table creation errors
      this.tableEnsured = true;
    }
  }

  async log(entry: TrajectoryEntry): Promise<void> {
    this.buffer.push(entry);
    if (this.buffer.length >= 20) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    const entries = [...this.buffer];
    this.buffer = [];

    try {
      await this.ensureTable();
      for (const e of entries) {
        await sql`
          INSERT INTO audit_trajectories (
            run_id, step_index, goal, persona, current_url,
            ax_node_count, focused_role, focused_name, history_length,
            goal_word_overlap, role_priority, chosen_action, chosen_selector,
            tier_used, llm_confidence, resulted_in_finding, resulted_in_task_success
          ) VALUES (
            ${e.runId}, ${e.stepIndex}, ${e.goal}, ${e.persona}, ${e.currentUrl},
            ${e.axNodeCount}, ${e.focusedRole ?? null}, ${e.focusedName ?? null}, ${e.historyLength},
            ${e.goalWordOverlap}, ${e.rolePriority}, ${e.chosenAction}, ${e.chosenSelector ?? null},
            ${e.tierUsed}, ${e.llmConfidence}, ${e.resultedInFinding}, ${e.resultedInTaskSuccess}
          )
        `;
      }
    } catch {
      // Non-blocking training data ingestion
    }
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
}

export const trajectoryLogger = new TrajectoryLogger();
