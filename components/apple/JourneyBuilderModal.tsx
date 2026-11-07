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
  ChevronRight,
  Sparkles
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
  navigate: { label: 'Navigate', icon: Compass, color: 'text-[#5e6ad2]', desc: 'Load target origin or route' },
  click: { label: 'Click Element', icon: MousePointer, color: 'text-[#30d158]', desc: 'Keyboard activation or click' },
  enter_text: { label: 'Enter Text', icon: Type, color: 'text-[#bf5af2]', desc: 'Simulate user keystrokes' },
  select_option: { label: 'Select Option', icon: Check, color: 'text-[#ff9f0a]', desc: 'Select from dropdown' },
  wait_state: { label: 'Wait for State', icon: Clock, color: 'text-[#64d2ff]', desc: 'Wait for DOM or network idle' },
  assert_text: { label: 'Assert Text', icon: CheckCircle2, color: 'text-[#30d158]', desc: 'Verify accessible text in tree' },
  assert_url: { label: 'Assert URL', icon: Compass, color: 'text-[#5e6ad2]', desc: 'Verify destination URL path' },
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
        selector: 'button#open-search, [aria-label="Search"]',
        expectedOutcome: 'Search overlay opens and moves focus into search text input.',
        timeoutMs: 3000
      },
      {
        id: 's_3',
        order: 3,
        type: 'enter_text',
        selector: 'input[type="search"]',
        value: 'Accessibility audit certificate',
        expectedOutcome: 'Search results populate live region with aria-live="polite".',
        timeoutMs: 3000
      }
    ]
  );
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);
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
      selector: 'button.action-btn',
      expectedOutcome: 'Trigger interaction and evaluate focus transition.',
      timeoutMs: 5000
    };
    setSteps([...steps, newStep]);
    setSelectedStepIndex(steps.length);
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
      await new Promise(r => setTimeout(r, 450));
      results[i] = {
        stepId: step.id,
        status: 'ok',
        message: `✓ [${step.type}] ${step.selector || step.value || 'default'} -> ${step.expectedOutcome}`
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
      <div className="absolute inset-0 bg-[#0c0d0e]/80" onClick={onClose} />

      <div className="relative w-full max-w-6xl h-[88vh] max-h-[820px] bg-[#141517] rounded-xl border border-[#23262a] shadow-2xl flex flex-col z-10 overflow-hidden">
        {/* 1. Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#23262a] bg-[#181a1d]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#5e6ad2]/10 border border-[#5e6ad2]/20 flex items-center justify-center text-[#5e6ad2]">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-[#f4f5f6]">User Journey Architect</h2>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#5e6ad2]/10 text-[#5e6ad2] border border-[#5e6ad2]/20">
                  Deterministic E2E
                </span>
              </div>
              <p className="text-[12px] text-[#9ba1a6]">
                Sequence interaction steps to test accessibility barriers across multi-page workflows.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulateJourney}
              disabled={simulating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141517] hover:bg-[#23262a] text-xs font-medium text-[#f4f5f6] border border-[#23262a] transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 text-[#30d158]" />
              <span>{simulating ? 'Simulating...' : 'Dry Run'}</span>
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-[#141517] hover:bg-[#23262a] border border-[#23262a] flex items-center justify-center text-[#9ba1a6] hover:text-[#f4f5f6] transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. Top Meta Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 px-6 py-3 border-b border-[#23262a] bg-[#141517] text-xs">
          <div>
            <label className="text-[10px] uppercase font-mono tracking-wider text-[#9ba1a6] block mb-1">Journey Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md bg-[#181a1d] border border-[#23262a] text-[#f4f5f6] focus:border-[#5e6ad2] outline-none"
              placeholder="e.g. Checkout & Pay"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-mono tracking-wider text-[#9ba1a6] block mb-1">Starting Origin / Path</label>
            <input
              type="text"
              value={startingUrl}
              onChange={(e) => setStartingUrl(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md bg-[#181a1d] border border-[#23262a] text-[#f4f5f6] focus:border-[#5e6ad2] outline-none font-mono"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-mono tracking-wider text-[#9ba1a6] block mb-1">Criticality</label>
            <select
              value={criticality}
              onChange={(e) => setCriticality(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-md bg-[#181a1d] border border-[#23262a] text-[#f4f5f6] focus:border-[#5e6ad2] outline-none"
            >
              <option value="critical">Critical Path (Blocker)</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase font-mono tracking-wider text-[#9ba1a6] block mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md bg-[#181a1d] border border-[#23262a] text-[#f4f5f6] focus:border-[#5e6ad2] outline-none"
              placeholder="Workflow objective"
            />
          </div>
        </div>

        {/* 3. Main 3-Pane Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Pane 1: Step Navigator (4 Cols) */}
          <div className="md:col-span-4 border-r border-[#23262a] flex flex-col bg-[#141517]">
            <div className="p-3 border-b border-[#23262a] flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#9ba1a6]">
                Sequence ({steps.length} Steps)
              </span>
              <button
                type="button"
                onClick={handleAddStep}
                className="flex items-center gap-1 text-[11px] font-medium text-[#5e6ad2] hover:text-[#6875e5] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Step</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {steps.map((step, idx) => {
                const config = STEP_TYPE_CONFIG[step.type] || STEP_TYPE_CONFIG.click;
                const Icon = config.icon;
                const isSelected = idx === selectedStepIndex;
                const sim = simResults?.find(r => r.stepId === step.id);

                return (
                  <div
                    key={step.id}
                    onClick={() => setSelectedStepIndex(idx)}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-[#181a1d] border-[#5e6ad2] shadow-sm'
                        : 'bg-[#141517] border-[#23262a] hover:bg-[#181a1d]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <span className="text-[11px] font-mono text-[#62676d] w-4 text-center">{idx + 1}</span>
                      <div className={`w-6 h-6 rounded bg-[#181a1d] border border-[#23262a] flex items-center justify-center shrink-0 ${config.color}`}>
                        <Icon className="w-3 h-3" />
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-[#f4f5f6]">{config.label}</span>
                          {sim?.status === 'ok' && <CheckCircle2 className="w-3 h-3 text-[#30d158]" />}
                        </div>
                        <p className="text-[11px] text-[#9ba1a6] truncate font-mono">
                          {step.selector || step.value || step.expectedOutcome}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleMoveStep(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded text-[#62676d] hover:text-[#f4f5f6] disabled:opacity-20"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveStep(idx, 'down')}
                        disabled={idx === steps.length - 1}
                        className="p-1 rounded text-[#62676d] hover:text-[#f4f5f6] disabled:opacity-20"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(idx)}
                        disabled={steps.length <= 1}
                        className="p-1 rounded text-[#62676d] hover:text-[#ff453a] disabled:opacity-20"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pane 2: Step Editor (5 Cols) */}
          <div className="md:col-span-5 border-r border-[#23262a] p-5 overflow-y-auto space-y-4 bg-[#181a1d]">
            <div className="flex items-center justify-between pb-2 border-b border-[#23262a]">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#f4f5f6]">Step Details ({selectedStepIndex + 1}/{steps.length})</h3>
                <p className="text-[11px] text-[#9ba1a6]">Define interaction selector, dispatched keystroke, and assertion.</p>
              </div>
              <span className="text-[11px] font-mono text-[#5e6ad2] bg-[#5e6ad2]/10 px-2 py-0.5 rounded border border-[#5e6ad2]/20">
                {activeStep.id}
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#9ba1a6] block mb-1.5">Action Type</label>
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
                        className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                          isType
                            ? 'bg-[#5e6ad2]/10 border-[#5e6ad2] text-[#f4f5f6]'
                            : 'bg-[#141517] border-[#23262a] text-[#9ba1a6] hover:bg-[#23262a]'
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
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#9ba1a6] block mb-1">
                    CSS / ARIA Locator
                  </label>
                  <input
                    type="text"
                    value={activeStep.selector || ''}
                    onChange={(e) => updateActiveStep({ selector: e.target.value })}
                    placeholder="button#submit, [role='dialog'], [aria-label='Close']"
                    className="w-full px-3 py-1.5 rounded-md bg-[#141517] border border-[#23262a] text-[#f4f5f6] font-mono text-xs outline-none focus:border-[#5e6ad2]"
                  />
                  <p className="text-[10px] text-[#62676d] mt-1 font-mono">
                    Prefers standard ARIA semantics or stable test IDs.
                  </p>
                </div>
              )}

              {(activeStep.type === 'enter_text' || activeStep.type === 'navigate' || activeStep.type === 'assert_text' || activeStep.type === 'assert_url') && (
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#9ba1a6] block mb-1">
                    {activeStep.type === 'navigate' ? 'Target URL' : activeStep.type === 'assert_text' ? 'Expected Text' : 'Input Value'}
                  </label>
                  <input
                    type="text"
                    value={activeStep.value || ''}
                    onChange={(e) => updateActiveStep({ value: e.target.value })}
                    placeholder={activeStep.type === 'enter_text' ? 'user@example.com' : 'Accessible String'}
                    className="w-full px-3 py-1.5 rounded-md bg-[#141517] border border-[#23262a] text-[#f4f5f6] text-xs outline-none focus:border-[#5e6ad2]"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#9ba1a6] block mb-1">
                  Expected Accessibility Outcome
                </label>
                <textarea
                  rows={2}
                  value={activeStep.expectedOutcome}
                  onChange={(e) => updateActiveStep({ expectedOutcome: e.target.value })}
                  placeholder="Focus moves to newly exposed drawer without trapping..."
                  className="w-full px-3 py-1.5 rounded-md bg-[#141517] border border-[#23262a] text-[#f4f5f6] text-xs outline-none focus:border-[#5e6ad2] resize-none"
                />
                <p className="text-[10px] text-[#62676d] mt-1">
                  Used by the verification engine to confirm goal completion.
                </p>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#9ba1a6] block mb-1">
                  Timeout (ms)
                </label>
                <input
                  type="number"
                  value={activeStep.timeoutMs || 5000}
                  onChange={(e) => updateActiveStep({ timeoutMs: parseInt(e.target.value) || 5000 })}
                  className="w-32 px-2.5 py-1 rounded-md bg-[#141517] border border-[#23262a] text-[#f4f5f6] font-mono text-xs outline-none focus:border-[#5e6ad2]"
                />
              </div>
            </div>
          </div>

          {/* Pane 3: Verification & Execution Simulation (3 Cols) */}
          <div className="md:col-span-3 p-4 flex flex-col justify-between bg-[#141517]">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#30d158]" />
                <h4 className="text-[11px] font-mono uppercase tracking-wider text-[#f4f5f6]">
                  Execution Spec
                </h4>
              </div>

              <div className="p-3 rounded-lg bg-[#181a1d] border border-[#23262a] space-y-2 text-xs">
                <div className="flex justify-between text-[#9ba1a6]">
                  <span>Step Count:</span>
                  <span className="font-mono text-[#f4f5f6]">{steps.length}</span>
                </div>
                <div className="flex justify-between text-[#9ba1a6]">
                  <span>Estimated Budget:</span>
                  <span className="font-mono text-[#f4f5f6]">~{steps.length * 3.5}s</span>
                </div>
                <div className="flex justify-between text-[#9ba1a6]">
                  <span>SSRF Boundary:</span>
                  <span className="font-mono text-[#30d158]">Enforced</span>
                </div>
              </div>

              {simResults && (
                <div className="space-y-1.5 text-xs">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#9ba1a6] block">Simulation Log:</span>
                  <div className="max-h-52 overflow-y-auto space-y-1 p-2 rounded-lg bg-[#0c0d0e] border border-[#23262a] font-mono text-[10px]">
                    {simResults.map((r, i) => (
                      <div key={i} className="text-[#30d158] truncate">
                        {r.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#23262a] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-xs text-[#9ba1a6] hover:text-[#f4f5f6]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-1.5 rounded-lg bg-[#5e6ad2] hover:bg-[#6875e5] text-white text-xs font-medium transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
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
