'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  GitPullRequest, 
  Check, 
  Copy, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Key, 
  FolderGit2, 
  FileCode,
  Sparkles,
  GitBranch
} from 'lucide-react';
import { BarrierFinding } from '@/lib/barrierlens/types';

interface GitHubPRModalProps {
  isOpen: boolean;
  onClose: () => void;
  finding: BarrierFinding | null;
  patch: string;
  targetUrl: string;
}

export function GitHubPRModal({
  isOpen,
  onClose,
  finding,
  patch,
  targetUrl
}: GitHubPRModalProps) {
  const [repoInput, setRepoInput] = useState('AadityaUniyal/BarrierLens');
  const [baseBranch, setBaseBranch] = useState('main');
  const [filePath, setFilePath] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [rememberToken, setRememberToken] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<{
    prUrl: string;
    prNumber?: number;
    branchName?: string;
    isSimulated?: boolean;
    instructions?: string;
  } | null>(null);

  // Load saved token & repo from localStorage
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('barrierlens_github_token');
      if (savedToken) setTokenInput(savedToken);
      const savedRepo = localStorage.getItem('barrierlens_github_repo');
      if (savedRepo) setRepoInput(savedRepo);
    } catch {
      // ignore
    }
  }, []);

  // Compute default file path based on finding kind
  useEffect(() => {
    if (finding) {
      const slug = finding.kind.replace(/_/g, '-').toLowerCase();
      setFilePath(`components/a11y-fix-${slug}.tsx`);
    }
  }, [finding]);

  if (!isOpen || !finding) return null;

  const [owner, repo] = repoInput.split('/').map(s => s.trim());

  const handleDispatchPR = async () => {
    if (!owner || !repo) {
      setErrorMessage('Please specify repository in "owner/repo" format (e.g. facebook/react)');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    setStatusMessage('1. Verifying repository access and base branch...');

    if (rememberToken && tokenInput) {
      try {
        localStorage.setItem('barrierlens_github_token', tokenInput);
        localStorage.setItem('barrierlens_github_repo', repoInput);
      } catch {
        // ignore
      }
    }

    try {
      setStatusMessage('2. Branching from main & committing declarative AST patch...');

      const res = await fetch('/api/integrations/github/pr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tokenInput ? { 'x-github-token': tokenInput } : {})
        },
        body: JSON.stringify({
          owner,
          repo,
          baseBranch,
          token: tokenInput || undefined,
          finding,
          patch,
          filePath: filePath || undefined,
          targetUrl
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch Pull Request');
      }

      setStatusMessage('3. Pull request created successfully!');
      setResult({
        prUrl: data.prUrl,
        prNumber: data.prNumber,
        branchName: data.branchName,
        isSimulated: data.isSimulated,
        instructions: data.instructions
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while creating the pull request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-[#141517] border border-[#23262a] rounded-xl overflow-hidden shadow-2xl text-[#f4f5f6] my-8 relative"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pr-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#23262a] bg-[#0c0d0e]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#5e6ad2]/15 border border-[#5e6ad2]/30 flex items-center justify-center text-[#5e6ad2]">
              <GitPullRequest className="w-4 h-4" />
            </div>
            <div>
              <h3 id="pr-modal-title" className="text-base font-semibold text-[#f4f5f6]">
                Dispatch Remediation Pull Request
              </h3>
              <p className="text-xs text-[#9ba1a6]">
                Automated closed-loop AST repair with verified proof attestation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md bg-[#181a1d] hover:bg-[#23262a] text-[#9ba1a6] hover:text-[#f4f5f6] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {/* Finding Context Pill */}
          <div className="p-3.5 rounded-lg bg-[#0f1011] border border-[#23262a] flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-[#30a46c]" />
              <span className="text-[#9ba1a6] truncate">{finding.title || finding.kind}</span>
            </div>
            <span className="text-[#30a46c] font-semibold shrink-0">Verified Patch</span>
          </div>

          {/* Repo & Branch Input Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-[#9ba1a6] flex items-center gap-1.5">
                <FolderGit2 className="w-3.5 h-3.5 text-[#5e6ad2]" />
                <span>Target GitHub Repository</span>
              </label>
              <input
                type="text"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                placeholder="owner/repo (e.g. AadityaUniyal/BarrierLens)"
                className="w-full px-3 py-2 rounded-lg bg-[#0c0d0e] border border-[#23262a] text-xs font-mono text-[#f4f5f6] placeholder-[#5a626a] focus:outline-none focus:border-[#5e6ad2]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#9ba1a6] flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-[#5e6ad2]" />
                <span>Base Branch</span>
              </label>
              <input
                type="text"
                value={baseBranch}
                onChange={(e) => setBaseBranch(e.target.value)}
                placeholder="main"
                className="w-full px-3 py-2 rounded-lg bg-[#0c0d0e] border border-[#23262a] text-xs font-mono text-[#f4f5f6] placeholder-[#5a626a] focus:outline-none focus:border-[#5e6ad2]"
              />
            </div>
          </div>

          {/* Target File Path in Repo */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#9ba1a6] flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-[#5e6ad2]" />
              <span>Remediation Target File Path in Repository</span>
            </label>
            <input
              type="text"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              placeholder="components/a11y-fix.tsx"
              className="w-full px-3 py-2 rounded-lg bg-[#0c0d0e] border border-[#23262a] text-xs font-mono text-[#f4f5f6] placeholder-[#5a626a] focus:outline-none focus:border-[#5e6ad2]"
            />
          </div>

          {/* GitHub Personal Access Token (Optional) */}
          <div className="space-y-2 pt-2 border-t border-[#23262a]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[#9ba1a6] flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[#f76808]" />
                <span>GitHub Personal Access Token (PAT)</span>
                <span className="text-[10px] text-[#6b7280] font-normal">(Optional)</span>
              </label>
              <a
                href="https://github.com/settings/tokens/new?scopes=repo&description=BarrierLens+Automated+Auditor"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[#5e6ad2] hover:underline flex items-center gap-1"
              >
                <span>Generate PAT</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="ghp_... (needs 'repo' or 'contents:write, pull_requests:write' scope)"
              className="w-full px-3 py-2 rounded-lg bg-[#0c0d0e] border border-[#23262a] text-xs font-mono text-[#f4f5f6] placeholder-[#5a626a] focus:outline-none focus:border-[#5e6ad2]"
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember-token"
                checked={rememberToken}
                onChange={(e) => setRememberToken(e.target.checked)}
                className="rounded border-[#23262a] bg-[#0c0d0e] text-[#5e6ad2] focus:ring-0 cursor-pointer"
              />
              <label htmlFor="remember-token" className="text-[11px] text-[#9ba1a6] cursor-pointer">
                Remember credentials locally on this machine
              </label>
            </div>
          </div>

          {/* Patch Diff Code Preview */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-[#6b7280] uppercase tracking-wider block">
              Patch To Be Committed
            </span>
            <div className="p-3 rounded-lg bg-[#0c0d0e] border border-[#23262a] font-mono text-[11px] max-h-32 overflow-y-auto text-[#f4f5f6]">
              <pre className="whitespace-pre-wrap">{patch}</pre>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-[#e5484d]/10 border border-[#e5484d]/30 text-xs text-[#e5484d] flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Result Card */}
          {result && (
            <div className="p-4 rounded-xl bg-[#30a46c]/10 border border-[#30a46c]/30 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#30a46c]">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {result.isSimulated 
                    ? 'Pull Request Preview Generated' 
                    : `Pull Request #${result.prNumber || ''} Created Successfully!`}
                </span>
              </div>

              {result.instructions && (
                <p className="text-[11px] text-[#9ba1a6]">
                  {result.instructions}
                </p>
              )}

              <div className="flex items-center gap-2">
                <a
                  href={result.prUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#30a46c] hover:bg-[#3ec784] text-[#0c0d0e] font-semibold text-xs transition-colors shadow-sm"
                >
                  <span>{result.isSimulated ? 'Open GitHub Compare Link' : 'View Live PR on GitHub'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(result.prUrl);
                  }}
                  className="px-3 py-2 rounded-lg bg-[#181a1d] hover:bg-[#23262a] border border-[#34383f] text-xs font-mono text-[#f4f5f6] transition-colors"
                >
                  Copy URL
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#23262a] bg-[#0c0d0e]">
          <div className="text-xs text-[#9ba1a6] font-mono">
            {isSubmitting && statusMessage}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#181a1d] border border-[#282c32] hover:bg-[#23262a] text-xs font-medium text-[#9ba1a6] hover:text-[#f4f5f6] transition-colors"
            >
              Close
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleDispatchPR}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#f4f5f6] hover:bg-white text-[#0c0d0e] text-xs font-semibold shadow-md transition-all disabled:opacity-50"
            >
              <GitPullRequest className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Dispatching...' : 'Dispatch Pull Request'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
