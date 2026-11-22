/**
 * BarrierLens 2.0 - Tier 3 Pairwise Cross-Feature Test Suite
 * Auth Session Revocation & Enterprise Vault Admin (auth-session-and-vault-admin.test.ts)
 * 
 * Verifies authenticated session synchronization, immediate state lock upon `authClient.signOut()`,
 * UI redirection/lock state, and prevention of unauthenticated admin mutations (API keys, webhooks).
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createPage, closeBrowser } from '../harness/browser-fixture';
import { Page } from 'playwright';

describe('Tier 3: Auth Session Revocation & Enterprise Vault Admin', () => {
  let page: Page;

  const VAULT_AUTH_FIXTURE_HTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>BarrierLens Vault Admin & Session Fixture</title>
      <style>
        body { font-family: sans-serif; background: #0a0a0a; color: #f4f5f6; margin: 0; padding: 20px; }
        header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #23262a; padding-bottom: 12px; }
        .user-pill { display: flex; align-items: center; gap: 8px; background: #141517; padding: 6px 12px; border: 1px solid #23262a; border-radius: 6px; }
        .sign-in-btn { background: #fff; color: #000; padding: 6px 14px; font-weight: bold; border: none; cursor: pointer; border-radius: 4px; }
        .sign-out-btn { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); padding: 4px 10px; cursor: pointer; border-radius: 4px; }
        .panel { margin-top: 20px; background: #141517; border: 1px solid #23262a; border-radius: 8px; padding: 20px; }
        .locked-banner { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #fca5a5; padding: 16px; border-radius: 6px; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #23262a; font-size: 13px; }
        .action-btn { background: #222; color: #fff; border: 1px solid #444; padding: 4px 8px; cursor: pointer; border-radius: 4px; }
        .action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      </style>
    </head>
    <body>
      <div id="app">
        <header>
          <div style="font-weight: bold; font-size: 16px;">BarrierLens Vault</div>
          <div id="auth-header-slot"></div>
        </header>

        <main id="vault-view" class="panel">
          <div id="vault-content"></div>
        </main>
      </div>

      <script>
        // In-memory mock representing BetterAuth client state
        let sessionCookie = 'session_token_lead_auditor_991';
        let currentUser = {
          id: 'usr_lead_01',
          name: 'Sarah Chen',
          email: 'sarah.chen@acme.corp',
          role: 'Lead Auditor',
          organization: 'Pro Workspace'
        };

        const authClient = {
          getSession: async () => {
            if (!sessionCookie) return { data: null, error: null };
            return { data: { user: currentUser }, error: null };
          },
          signOut: async () => {
            sessionCookie = null;
            currentUser = null;
            onAuthStateChange(null);
            return { success: true };
          },
          signIn: async (user) => {
            sessionCookie = 'session_token_' + Date.now();
            currentUser = user || {
              id: 'usr_lead_01',
              name: 'Sarah Chen',
              email: 'sarah.chen@acme.corp',
              role: 'Lead Auditor',
              organization: 'Pro Workspace'
            };
            onAuthStateChange(currentUser);
            return { data: { user: currentUser } };
          }
        };

        let vaultApiKeys = [
          { id: 'key_live_01', name: 'Production Audit Ingestion', prefix: 'bl_live_8f3a...', scope: 'audit:run, pr:create' }
        ];

        let vaultWebhooks = [
          { id: 'wh_live_01', url: 'https://api.acme.corp/webhooks/a11y', status: 'active' }
        ];

        let state = {
          userSession: currentUser,
          mutationError: null
        };

        function onAuthStateChange(newSession) {
          state.userSession = newSession;
          render();
        }

        async function createApiKey(name, scope) {
          if (!state.userSession || !sessionCookie) {
            state.mutationError = 'HTTP 401 Unauthorized: Session required to generate credentials';
            render();
            return { error: 'Unauthorized', status: 401 };
          }
          const newKey = {
            id: 'key_live_' + Date.now(),
            name: name || 'CLI Agent Key',
            prefix: 'bl_live_new...',
            scope: scope || 'audit:run'
          };
          vaultApiKeys.push(newKey);
          state.mutationError = null;
          render();
          return { success: true, key: newKey };
        }

        async function revokeApiKey(keyId) {
          if (!state.userSession || !sessionCookie) {
            state.mutationError = 'HTTP 401 Unauthorized: Session required to revoke credentials';
            render();
            return { error: 'Unauthorized', status: 401 };
          }
          vaultApiKeys = vaultApiKeys.filter(k => k.id !== keyId);
          render();
          return { success: true };
        }

        async function triggerWebhookTest(whId) {
          if (!state.userSession || !sessionCookie) {
            state.mutationError = 'HTTP 401 Unauthorized: Session required to dispatch webhook test';
            render();
            return { error: 'Unauthorized', status: 401 };
          }
          return { success: true, status: 200 };
        }

        function render() {
          const headerSlot = document.getElementById('auth-header-slot');
          const vaultContent = document.getElementById('vault-content');

          if (state.userSession) {
            headerSlot.innerHTML = \`
              <div class="user-pill">
                <span id="user-display-name" style="font-weight: 600;">\${state.userSession.name}</span>
                <span style="font-size: 11px; color: #10b981; border: 1px solid #10b981; padding: 1px 4px; border-radius: 3px;">\${state.userSession.role}</span>
                <button id="header-signout-btn" class="sign-out-btn" onclick="authClient.signOut()">Sign Out</button>
              </div>
            \`;

            vaultContent.innerHTML = \`
              <div id="privileged-vault-panel">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <h2>Enterprise Credentials & API Keys</h2>
                  <button id="add-key-btn" class="action-btn" onclick="createApiKey('Test Key', 'audit:run')">+ Generate API Key</button>
                </div>
                <table>
                  <thead>
                    <tr><th>Name</th><th>Prefix</th><th>Scope</th><th>Actions</th></tr>
                  </thead>
                  <tbody id="keys-table-body">
                    \${vaultApiKeys.map(k => \`
                      <tr id="row-\${k.id}">
                        <td>\${k.name}</td>
                        <td><code>\${k.prefix}</code></td>
                        <td>\${k.scope}</td>
                        <td><button id="revoke-\${k.id}" class="action-btn" onclick="revokeApiKey('\${k.id}')">Revoke</button></td>
                      </tr>
                    \`).join('')}
                  </tbody>
                </table>
                <div id="mutation-error-banner" style="display: \${state.mutationError ? 'block' : 'none'}; color: #ef4444; margin-top: 10px;">
                  \${state.mutationError || ''}
                </div>
              </div>
            \`;
          } else {
            headerSlot.innerHTML = \`
              <button id="header-signin-btn" class="sign-in-btn" onclick="authClient.signIn()">Sign In</button>
            \`;

            vaultContent.innerHTML = \`
              <div id="locked-vault-panel" class="locked-banner">
                <h3>Enterprise Vault Locked</h3>
                <p>Authentication required to inspect or administer organization credentials, RBAC roster, and webhooks.</p>
                <button id="prompt-signin-btn" class="sign-in-btn" style="margin-top: 10px;" onclick="authClient.signIn()">Authenticate with Passkey</button>
                <div id="mutation-error-banner" style="display: \${state.mutationError ? 'block' : 'none'}; color: #ef4444; margin-top: 10px;">
                  \${state.mutationError || ''}
                </div>
              </div>
            \`;
          }
        }

        window.authClient = authClient;
        window.createApiKey = createApiKey;
        window.revokeApiKey = revokeApiKey;
        window.triggerWebhookTest = triggerWebhookTest;
        window.getState = () => state;
        render();
      </script>
    </body>
    </html>
  `;

  before(async () => {
    const fixture = await createPage();
    page = fixture.page;
    await page.setContent(VAULT_AUTH_FIXTURE_HTML, { waitUntil: 'domcontentloaded' });
  });

  after(async () => {
    await closeBrowser();
  });

  it('1. should initialize in authenticated state with user role and privileged vault view', async () => {
    assert.equal(await page.isVisible('#privileged-vault-panel'), true);
    assert.equal(await page.isVisible('#locked-vault-panel'), false);

    const userName = await page.textContent('#user-display-name');
    assert.equal(userName, 'Sarah Chen');

    // Privileged action buttons must be available
    assert.equal(await page.isVisible('#add-key-btn'), true);
    assert.equal(await page.isVisible('#row-key_live_01'), true);
  });

  it('2. should revoke session via authClient.signOut() and immediately synchronize UI', async () => {
    // Click Sign Out in header
    await page.click('#header-signout-btn');

    // Verify session state cleared
    const userSession = await page.evaluate(() => (window as any).getState().userSession);
    assert.equal(userSession, null, 'User session must be null after sign out');

    // Privileged vault panel must be unmounted/hidden
    assert.equal(await page.isVisible('#privileged-vault-panel'), false);

    // Locked vault panel must be prominently displayed
    assert.equal(await page.isVisible('#locked-vault-panel'), true);
    const lockedHeading = await page.textContent('#locked-vault-panel h3');
    assert.equal(lockedHeading, 'Enterprise Vault Locked');

    // Header must show Sign In CTA
    assert.equal(await page.isVisible('#header-signin-btn'), true);
    assert.equal(await page.isVisible('#header-signout-btn'), false);
  });

  it('3. should block unauthenticated attempts to generate API keys', async () => {
    // Attempt mutation while signed out
    const result = await page.evaluate(() => (window as any).createApiKey('Hacker Key', 'audit:run'));

    assert.equal(result.status, 401);
    assert.equal(result.error, 'Unauthorized');

    // Verify error banner is shown
    const isErrorVisible = await page.isVisible('#mutation-error-banner');
    assert.equal(isErrorVisible, true);
    const errorText = await page.textContent('#mutation-error-banner');
    assert.ok(errorText?.includes('HTTP 401 Unauthorized'));
  });

  it('4. should block unauthenticated attempts to revoke credentials', async () => {
    const result = await page.evaluate(() => (window as any).revokeApiKey('key_live_01'));

    assert.equal(result.status, 401);
    assert.equal(result.error, 'Unauthorized');

    const errorText = await page.textContent('#mutation-error-banner');
    assert.ok(errorText?.includes('Session required to revoke credentials'));
  });

  it('5. should block unauthenticated attempts to trigger webhook dispatches', async () => {
    const result = await page.evaluate(() => (window as any).triggerWebhookTest('wh_live_01'));

    assert.equal(result.status, 401);
    assert.equal(result.error, 'Unauthorized');

    const errorText = await page.textContent('#mutation-error-banner');
    assert.ok(errorText?.includes('Session required to dispatch webhook test'));
  });

  it('6. should re-authenticate and immediately unlock Enterprise Vault administration', async () => {
    // Click Sign In button
    await page.click('#prompt-signin-btn');

    // Verify user session restored
    const userSession = await page.evaluate(() => (window as any).getState().userSession);
    assert.ok(userSession !== null);
    assert.equal(userSession.name, 'Sarah Chen');

    // Privileged panel restored
    assert.equal(await page.isVisible('#privileged-vault-panel'), true);
    assert.equal(await page.isVisible('#locked-vault-panel'), false);

    // Mutation is now allowed
    const mutationResult = await page.evaluate(() => (window as any).createApiKey('Authorized Audit Key', 'audit:run'));
    assert.equal(mutationResult.success, true);
    assert.ok(mutationResult.key.id.startsWith('key_live_'));
  });

});
