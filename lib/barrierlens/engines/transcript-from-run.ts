import { AuditRun } from '../types';

export interface SpeechTranscriptItem {
  id: string;
  type: 'speech' | 'silent_gap' | 'live_announcement';
  text: string;
  tag?: string;
  timestamp: string;
  category?: 'inline_error' | 'toast' | 'spinner' | 'state_change';
  proofCertificate?: string;
}

export function transcriptItemsFromRun(run: AuditRun): SpeechTranscriptItem[] {
  const items: SpeechTranscriptItem[] = [];
  const started = Date.parse(run.startedAt) || 0;

  items.push({
    id: `${run.id}-open`,
    type: 'speech',
    text: `Opened ${run.targetUrl}. Goal: ${run.goal}.`,
    tag: 'NAV',
    timestamp: '0.0s',
  });

  for (const step of run.steps) {
    const rel = started ? Math.max(0, (step.timestamp - started) / 1000) : step.idx * 1.2;
    const ts = `${rel.toFixed(1)}s`;
    const name = step.activeElementAfter || step.targetSelector || 'control';
    const spoken =
      step.actionType === 'type_text'
        ? `Typed into ${name}.`
        : `Pressed ${step.key || 'Tab'} on ${name}.`;

    items.push({
      id: `${run.id}-step-${step.idx}`,
      type: 'speech',
      text: spoken,
      tag: (step.key || 'KEY').toUpperCase(),
      timestamp: ts,
    });

    const gap = run.findings.find(
      (f) => f.stepIdx === step.idx && f.kind === 'silent_state_change'
    );
    if (gap) {
      items.push({
        id: gap.id,
        type: 'silent_gap',
        text: gap.summary,
        tag: 'SILENT',
        timestamp: ts,
        category: 'state_change',
        proofCertificate: gap.gapCertificate?.proofHash || gap.id,
      });
    }
  }

  for (const finding of run.findings) {
    if (finding.kind === 'silent_state_change') continue;
    items.push({
      id: finding.id,
      type: finding.kind === 'keyboard_trap' ? 'silent_gap' : 'speech',
      text: finding.summary,
      tag: finding.kind.replace(/_/g, ' ').toUpperCase(),
      timestamp: `step ${finding.stepIdx}`,
      category: finding.kind === 'keyboard_trap' ? 'state_change' : undefined,
    });
  }

  return items;
}
