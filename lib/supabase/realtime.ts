import { supabase } from './db';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface AuditStreamCallbacks {
  onRunUpdate?: (run: any) => void;
  onStepInsert?: (step: any) => void;
  onFindingInsert?: (finding: any) => void;
  onSwarmTrace?: (trace: any) => void;
}

/**
 * Subscribes to live database changes for an active audit run via Supabase Realtime.
 * Replaces manual HTTP polling or SSE with native Supabase WebSockets.
 */
export function subscribeToAuditRun(runId: string, callbacks: AuditStreamCallbacks): () => void {
  const channelName = `audit-run-${runId}`;
  
  const channel: RealtimeChannel = supabase
    .channel(channelName)
    // 1. Listen for Run status updates (progress, score, completion)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'runs',
        filter: `id=eq.${runId}`,
      },
      (payload) => {
        callbacks.onRunUpdate?.(payload.new);
      }
    )
    // 2. Listen for new interaction steps (Playwright focus moves, tabbing, clicks)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'steps',
        filter: `run_id=eq.${runId}`,
      },
      (payload) => {
        callbacks.onStepInsert?.(payload.new);
      }
    )
    // 3. Listen for new accessibility barrier findings (Tarjan traps, Kendall's tau drift)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'findings',
        filter: `run_id=eq.${runId}`,
      },
      (payload) => {
        callbacks.onFindingInsert?.(payload.new);
      }
    )
    // 4. Listen for agent swarm coordination traces
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'agent_event_traces',
      },
      (payload) => {
        if (payload.new && payload.new.trace_id === runId) {
          callbacks.onSwarmTrace?.(payload.new);
        }
      }
    )
    .subscribe();

  // Return unsubscribe cleanup function
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Broadcasts an ephemeral swarm mesh message to other autonomous agents.
 */
export async function broadcastSwarmEvent(channelName: string, event: string, payload: Record<string, any>) {
  const channel = supabase.channel(channelName);
  await channel.subscribe();
  return channel.send({
    type: 'broadcast',
    event,
    payload,
  });
}
