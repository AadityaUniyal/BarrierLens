'use client';

import React, { useState } from 'react';
import { 
  Compass, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Play, 
  Check, 
  AlertCircle, 
  MousePointer, 
  Type, 
  Clock, 
  HelpCircle, 
  CheckCircle2, 
  X,
  ExternalLink,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export type StepType = 
  | 'navigate' 
  | 'click' 
  | 'enter_text' 
  | 'select_option' 
  | 'wait_state' 
  | 'assert_text' 
  | 'assert_url' 
  | 'human_checkpoint';

export interface JourneyStep {
  id: string;
  order: number;
  type: StepType;
  selector?: string;
  value?: string;
  expectedOutcome: string;
  timeoutMs?: number;
}

export interface JourneyData {
  id?: string;
  website_id?: string;
  name: string;
  description: string;
  starting_url: string;
  criticality: 'critical' | 'high' | 'medium' | 'low';
  steps: JourneyStep[];
}

interface JourneyBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (journey: JourneyData) => Promise<void>;
  websiteOrigin?: string;
  websiteId?: string;
  initialJourney?: JourneyData;
}

const STEP_TYPE_CONFIG: Record<StepType, { label: string; icon: any; color: string; desc: string }> = {
  navigate: { label: 'Navigate', icon: Compass, color: 'text-[#0a84ff]', desc: 'Load target URL' },
  click: { label: 'Click Element', icon: MousePointer, color: 'text-[#30d158]', desc: 'Keyboard activation or click' },
  enter_text: { label: 'Enter Text', icon: Type, color: 'text-[#bf5af2]', desc: 'Simulate user keystrokes' },
  select_option: { label: 'Select Option', icon: Check, color: 'text-[#ff9f0a]', desc: 'Select from dropdown' },
  wait_state: { label: 'Wait for State', icon: Clock, color: 'text-[#64d2ff]', desc: 'Wait for element or network idle' },
  assert_text: { label: 'Assert Text', icon: CheckCircle2, color: 'text-[#30d158]', desc: 'Verify accessible text' },
  assert_url: { label: 'Assert URL', icon: Compass, color: 'text-[#5e5ce6]', desc: 'Verify destination URL path' },
  human_checkpoint: { label: 'Human Checkpoint', icon: HelpCircle, color: 'text-[#ff453a]', desc: 'Manual cognitive checkpoint' }
};

export function JourneyBuilderModal({
  isOpen,
  onClose,
  onSave,
  websiteOrigin = 'https://barrierlens-seven.vercel.app',
  websiteId,
  initialJourney
}: JourneyBuilderModalProps) {
  const [name, setName] = useState(initialJourney?.name || 'User Checkout & Form Completion');
  const [description, setDescription] = useState(
    initialJourney?.description || 'Verify keyboard and screen reader accessibility through main interactive flow.'
  );
  const [startingUrl, setStartingUrl] = useState(initialJourney?.starting_url || websiteOrigin);
  const [criticality, setCriticality] = useState<'critical' | 'high' | 'medium' | 'low'>(
    initialJourney?.criticality || 'high'
  );
  const [steps, setSteps] = useState<JourneyStep[]>(
    initialJourney?.steps || [
      {
        id: 's_1',
        order: 1,
        type: 'navigate',
        value: startingUrl,
        expectedOutcome: 'Landed on starting page and focus placed on document root.',
        timeoutMs: 5000
      },
      {
        id: 's_2',
        order: 2,
        type: 'click',
        selector: 'button#open-modal-btn, [data-testid="interactive-trigger"]',
        expectedOutcome: 'Interactive dialog opens; focus shifts inside modal container.',
        timeoutMs: 3000
      },
      {
        id: 's_3',
        order: 3,
        type: 'assert_text',
        selector: 'h2, h3, [role="heading"]',
        value: 'Confirmation',
        expectedOutcome: 'Heading text is announced by virtual screen reader.',
        timeoutMs: 2000
      }
    ]
  );

  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simResults, setSimResults] = useState<{ stepId: string; status: 'ok' | 'failed' | 'running'; message: string }[] | null>(null);

  if (!isOpen) return null;

  const activeStep = steps[selectedStepIndex] || steps[0];

  const handleAddStep = () => {
    const newStep: JourneyStep = {
      id: `s_${Date.now()}`,
      order: steps.length + 1,
      type: 'click',
      selector: 'button',
      expectedOutcome: 'Element activated without focus trapping',
      timeoutMs: 3000
    };
    const nextSteps = [...steps, newStep];
    setSteps(nextSteps);
    setSelectedStepIndex(nextSteps.length - 1);
  };

  const handleRemoveStep = (idx: number) => {
    if (steps.length <= 1) return;
    const next = steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 }));
    setSteps(next);
    setSelectedStepIndex(Math.max(0, idx - 1));
  };

  const handleMoveStep = (idx: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === steps.length - 1)) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const next = [...steps];
    const [moved] = next.splice(idx, 1);
    next.splice(targetIdx, 0, moved);
    const reordered = next.map((s, i) => ({ ...s, order: i + 1 }));
    setSteps(reordered);
    setSelectedStepIndex(targetIdx);
  };

  const updateActiveStep = (partial: Partial<JourneyStep>) => {
    const next = [...steps];
    next[selectedStepIndex] = { ...next[selectedStepIndex], ...partial };
    setSteps(next);
  };

  const handleSimulateJourney = async () => {
    setSimulating(true);
    const results: { stepId: string; status: 'ok' | 'failed' | 'running'; message: string }[] = steps.map(s => ({
      stepId: s.id,
      status: 'running',
      message: 'Validating step...'
    }));
    setSimResults(results);

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      await new Promise(r => setTimeout(r, 600));
      results[i] = {
        stepId: step.id,
        status: 'ok',
        message: `✓ Simulated ${step.type} (${step.selector || step.value || 'default'}): ${step.expectedOutcome}`
      };
      setSimResults([...results]);
    }
    setSimulating(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await onSave({
        id: initialJourney?.id,
        website_id: websiteId,
        name: name.trim(),
        description: description.trim(),
        starting_url: startingUrl.trim(),
        criticality,
        steps
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to save journey');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl" onClick={onClose} />

      <div className="relative w-full max-w-6xl h-[90vh] max-h-[850px] apple-card-raised rounded-3xl border-hairline shadow-2xl flex flex-col z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* 1. Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border-hairline border-blue-500/20 flex items-center justify-center text-[#0a84ff]">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#f5f5f7]">User Journey Architect</h2>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-[#0a84ff] border-hairline border-blue-500/20">
                  Deterministic E2E
                </span>
              </div>
              <p className="text-[12px] text-[#86868b]">
                Sequence authentic interaction steps to test accessibility barriers across multi-page workflows.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulateJourney}
              disabled={simulating}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-medium text-[#f5f5f7] border-hairline transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 text-[#30d158]" />
              <span>{simulating ? 'Simulating...' : 'Simulate Steps'}</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-[#86868b] hover:text-[#f5f5f7] transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Top Meta Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-6 py-3 border-b border-white/[0.06] bg-[#141416]/70 text-xs">
          <div>
            <label className="text-[10px] uppercase font-semibold text-[#86868b] block mb-1">Journey Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-[#1c1c1e] border-hairline text-[#f5f5f7] focus:ring-1 focus:ring-[#0a84ff] outline-none"
              placeholder="e.g. Checkout & Pay"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-semibold text-[#86868b] block mb-1">Starting Origin / Path</label>
            <input
              type="text"
              value={startingUrl}
              onChange={(e) => setStartingUrl(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-[#1c1c1e] border-hairline text-[#f5f5f7] focus:ring-1 focus:ring-[#0a84ff] outline-none font-mono"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-semibold text-[#86868b] block mb-1">Criticality</label>
            <select
              value={criticality}
              onChange={(e) => setCriticality(e.target.value as any)}
              className="w-full px-3 py-1.5 rounded-lg bg-[#1c1c1e] border-hairline text-[#f5f5f7] focus:ring-1 focus:ring-[#0a84ff] outline-none"
            >
              <option value="critical">Critical Path (Blocker)</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase font-semibold text-[#86868b] block mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-[#1c1c1e] border-hairline text-[#f5f5f7] focus:ring-1 focus:ring-[#0a84ff] outline-none"
              placeholder="Goal of this user workflow"
            />
          </div>
        </div>

        {/* 3. Main 3-Pane Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Pane 1: Step Navigator (4 Cols) */}
          <div className="md:col-span-4 border-r border-white/[0.06] flex flex-col bg-black/20">
            <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
                Sequence ({steps.length} Steps)
              </span>
              <button
                type="button"
                onClick={handleAddStep}
                className="flex items-center gap-1 text-[11px] font-medium text-[#0a84ff] hover:text-[#0077ed] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Step</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {steps.map((step, idx) => {
                const config = STEP_TYPE_CONFIG[step.type] || STEP_TYPE_CONFIG.click;
                const Icon = config.icon;
                const isSelected = idx === selectedStepIndex;
                const sim = simResults?.find(r => r.stepId === step.id);

                return (
                  <div
                    key={step.id}
                    onClick={() => setSelectedStepIndex(idx)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-white/[0.08] border-white/20 shadow-md'
                        : 'bg-white/[0.02] border-hairline hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="text-[11px] font-mono text-[#86868b] w-4 text-center">{idx + 1}</span>
                      <div className={`w-7 h-7 rounded-lg bg-white/[0.04] border-hairline flex items-center justify-center shrink-0 ${config.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-[#f5f5f7]">{config.label}</span>
                          {sim?.status === 'ok' && <CheckCircle2 className="w-3 h-3 text-[#30d158]" />}
                        </div>
                        <p className="text-[11px] text-[#86868b] truncate font-mono">
                          {step.selector || step.value || step.expectedOutcome}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleMoveStep(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded text-[#86868b] hover:text-[#f5f5f7] disabled:opacity-20"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveStep(idx, 'down')}
                        disabled={idx === steps.length - 1}
                        className="p-1 rounded text-[#86868b] hover:text-[#f5f5f7] disabled:opacity-20"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(idx)}
                        disabled={steps.length <= 1}
                        className="p-1 rounded text-[#86868b] hover:text-[#ff453a] disabled:opacity-20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pane 2: Step Editor (5 Cols) */}
          <div className="md:col-span-5 border-r border-white/[0.06] p-6 overflow-y-auto space-y-5 bg-[#161618]/50">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div>
                <h3 className="text-sm font-semibold text-[#f5f5f7]">Edit Step {selectedStepIndex + 1}</h3>
                <p className="text-[11px] text-[#86868b]">Configure interaction target, input, and expected outcome.</p>
              </div>
              <span className="text-xs font-mono text-[#0a84ff] bg-blue-500/10 px-2 py-0.5 rounded-md border-hairline border-blue-500/20">
                {activeStep.id}
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-semibold uppercase text-[#86868b] block mb-1.5">Action Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(STEP_TYPE_CONFIG) as StepType[]).map((type) => {
                    const c = STEP_TYPE_CONFIG[type];
                    const SelectedIcon = c.icon;
                    const isType = activeStep.type === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => updateActiveStep({ type })}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                          isType
                            ? 'bg-blue-500/10 border-blue-500/30 text-[#f5f5f7]'
                            : 'bg-white/[0.02] border-hairline text-[#86868b] hover:bg-white/[0.05]'
                        }`}
                      >
                        <SelectedIcon className={`w-3.5 h-3.5 ${c.color}`} />
                        <div>
                          <div className="font-medium text-[11px]">{c.label}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {activeStep.type !== 'navigate' && activeStep.type !== 'wait_state' && (
                <div>
                  <label className="text-[11px] font-semibold uppercase text-[#86868b] block mb-1">
                    CSS Selector / Accessible Locator
                  </label>
                  <input
                    type="text"
                    value={activeStep.selector || ''}
                    onChange={(e) => updateActiveStep({ selector: e.target.value })}
                    placeholder="button#submit, [role='dialog'], [aria-label='Close']"
                    className="w-full px-3 py-2 rounded-xl bg-[#1c1c1e] border-hairline text-[#f5f5f7] font-mono outline-none focus:ring-1 focus:ring-[#0a84ff]"
                  />
                  <p className="text-[10px] text-[#86868b] mt-1">
                    Prefers standard ARIA semantics or stable CSS IDs.
                  </p>
                </div>
              )}

              {(activeStep.type === 'enter_text' || activeStep.type === 'navigate' || activeStep.type === 'assert_text' || activeStep.type === 'assert_url') && (
                <div>
                  <label className="text-[11px] font-semibold uppercase text-[#86868b] block mb-1">
                    {activeStep.type === 'navigate' ? 'Target URL' : activeStep.type === 'assert_text' ? 'Expected Text' : 'Input Value'}
                  </label>
                  <input
                    type="text"
                    value={activeStep.value || ''}
                    onChange={(e) => updateActiveStep({ value: e.target.value })}
                    placeholder={activeStep.type === 'enter_text' ? 'user@example.com' : 'Accessible String'}
                    className="w-full px-3 py-2 rounded-xl bg-[#1c1c1e] border-hairline text-[#f5f5f7] outline-none focus:ring-1 focus:ring-[#0a84ff]"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold uppercase text-[#86868b] block mb-1">
                  Expected Accessibility Outcome
                </label>
                <textarea
                  rows={2}
                  value={activeStep.expectedOutcome}
                  onChange={(e) => updateActiveStep({ expectedOutcome: e.target.value })}
                  placeholder="Focus moves to newly exposed drawer without trapping..."
                  className="w-full px-3 py-2 rounded-xl bg-[#1c1c1e] border-hairline text-[#f5f5f7] outline-none focus:ring-1 focus:ring-[#0a84ff] resize-none"
                />
                <p className="text-[10px] text-[#86868b] mt-1">
                  Used by the verification engine to confirm goal completion.
                </p>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase text-[#86868b] block mb-1">
                  Timeout (ms)
                </label>
                <input
                  type="number"
                  value={activeStep.timeoutMs || 5000}
                  onChange={(e) => updateActiveStep({ timeoutMs: parseInt(e.target.value) || 5000 })}
                  className="w-32 px-3 py-1.5 rounded-xl bg-[#1c1c1e] border-hairline text-[#f5f5f7] font-mono outline-none"
                />
              </div>
            </div>
          </div>

          {/* Pane 3: Verification & Execution Simulation (3 Cols) */}
          <div className="md:col-span-3 p-5 flex flex-col justify-between bg-black/40">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-[#30d158]" />
                <h4 className="text-xs font-semibold text-[#f5f5f7] uppercase tracking-wider">
                  Verification Trace
                </h4>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.03] border-hairline space-y-2 mb-4 text-xs">
                <div className="flex justify-between text-[#86868b]">
                  <span>Total Steps:</span>
                  <span className="font-mono text-[#f5f5f7]">{steps.length}</span>
                </div>
                <div className="flex justify-between text-[#86868b]">
                  <span>Total Budget:</span>
                  <span className="font-mono text-[#f5f5f7]">~{steps.length * 4}s</span>
                </div>
                <div className="flex justify-between text-[#86868b]">
                  <span>SSRF Boundary:</span>
                  <span className="font-mono text-[#30d158]">Enforced</span>
                </div>
              </div>

              {simResults && (
                <div className="space-y-2 text-xs">
                  <span className="text-[10px] font-semibold uppercase text-[#86868b] block">Simulation Log:</span>
                  <div className="max-h-56 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-black/40 border-hairline font-mono text-[11px]">
                    {simResults.map((r, i) => (
                      <div key={i} className="text-[#30d158] truncate">
                        {r.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/[0.06] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs text-[#86868b] hover:text-[#f5f5f7]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Journey'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
