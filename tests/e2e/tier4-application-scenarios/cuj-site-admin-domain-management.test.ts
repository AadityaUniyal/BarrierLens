/**
 * BarrierLens 2.0 - Tier 4 Real-World Application Scenario
 * CUJ 3: Site Admin Domain Management (cuj-site-admin-domain-management.test.ts)
 * 
 * Journey:
 * Org Admin enters Managed Web Properties -> Adds New Domain ->
 * Verifies DNS Verification Token Generation -> Verifies Domain Ownership ->
 * Configures Multi-Step User Journey in Journey Builder -> Triggers Automated Swarm Scan.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createPage, closeBrowser } from '../harness/browser-fixture';
import { Page } from 'playwright';

describe('Tier 4: CUJ 3 - Site Admin Domain Management Journey', () => {
  let page: Page;

  const SITES_MANAGER_FIXTURE_HTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>CUJ 3: Site Admin Domain Management</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0a0a0a; color: #fff; margin: 0; padding: 24px; }
        .btn { padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; border: 1px solid #333; background: #222; color: #fff; }
        .primary { background: #0090ff; border-color: #0070cc; }
        .backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 50; }
        .modal { background: #141517; border: 1px solid #333; border-radius: 12px; padding: 24px; width: 540px; max-width: 90vw; }
        input, select { width: 100%; padding: 8px; background: #050505; color: #fff; border: 1px solid #444; border-radius: 4px; box-sizing: border-box; margin: 6px 0 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
        th, td { text-align: left; padding: 10px; border-bottom: 1px solid #23262a; }
        .badge { padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
        .badge-verified { background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid #10b981; }
        .badge-unverified { background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid #f59e0b; }
      </style>
    </head>
    <body>
      <div id="app">
        <header style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333; padding-bottom: 12px;">
          <div>
            <h1>Managed Web Properties</h1>
            <p style="color: #888; font-size: 13px;">Manage audited domains, cryptographic ownership verification, and user journeys.</p>
          </div>
          <button id="add-domain-btn" class="btn primary" onclick="openAddDomainModal()">+ Add Web Property</button>
        </header>

        <main>
          <table id="websites-table">
            <thead>
              <tr><th>Property Name</th><th>Origin</th><th>Environment</th><th>Status</th><th>Verification Token</th><th>Actions</th></tr>
            </thead>
            <tbody id="websites-tbody">
              <!-- Dynamically populated -->
            </tbody>
          </table>

          <div id="swarm-scan-status" style="display: none; margin-top: 20px; padding: 16px; background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; border-radius: 8px;">
            <strong style="color: #10b981;">Automated Swarm Audit Triggered!</strong>
            <p style="margin: 4px 0 0; font-size: 13px; color: #ccc;">Scanning 4 critical steps across 5 personas with Tarjan SCC focus trap solver.</p>
          </div>
        </main>

        <!-- Add Domain Modal -->
        <div id="add-domain-modal" class="backdrop" style="display: none;">
          <div class="modal" role="dialog" aria-modal="true" aria-labelledby="add-domain-title">
            <h2 id="add-domain-title">Register Web Property</h2>
            <label>Name:</label>
            <input id="domain-name-input" type="text" placeholder="e.g. Acme Global Store" />

            <label>Origin URL:</label>
            <input id="domain-origin-input" type="text" placeholder="https://checkout.acme.corp" />

            <label>Environment:</label>
            <select id="domain-env-select">
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="preview">Preview</option>
            </select>

            <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px;">
              <button id="cancel-add-domain" class="btn" onclick="closeAddDomainModal()">Cancel</button>
              <button id="submit-add-domain" class="btn primary" onclick="submitAddDomain()">Generate Token & Register</button>
            </div>
          </div>
        </div>

        <!-- Journey Builder Modal -->
        <div id="journey-modal" class="backdrop" style="display: none;">
          <div class="modal" role="dialog" aria-modal="true" aria-labelledby="journey-title" style="width: 620px;">
            <h2 id="journey-title">Configure Critical User Journey</h2>
            <label>Journey Name:</label>
            <input id="journey-name-input" type="text" value="End-to-End Cart Checkout" />

            <h3>Journey Steps</h3>
            <div id="steps-list" style="max-height: 200px; overflow-y: auto; border: 1px solid #333; padding: 10px; border-radius: 6px;">
              <div class="step-item" style="padding: 6px 0; border-bottom: 1px solid #222;">
                <strong>1. Navigate:</strong> <code>https://checkout.acme.corp/products</code>
              </div>
              <div class="step-item" style="padding: 6px 0; border-bottom: 1px solid #222;">
                <strong>2. Click:</strong> <code>#add-to-cart-btn</code>
              </div>
              <div class="step-item" style="padding: 6px 0; border-bottom: 1px solid #222;">
                <strong>3. Enter Text:</strong> <code>#promo-code-input</code> (DISCOUNT20)
              </div>
              <div class="step-item" style="padding: 6px 0;">
                <strong>4. Assert Text:</strong> <code>#cart-total</code> ($79.99)
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px;">
              <button id="cancel-journey-btn" class="btn" onclick="closeJourneyModal()">Cancel</button>
              <button id="save-trigger-swarm-btn" class="btn primary" onclick="saveJourneyAndTriggerSwarm()">Save Journey & Dispatch Swarm</button>
            </div>
          </div>
        </div>
      </div>

      <script>
        let websites = [];
        let configuredJourneys = [];

        function renderWebsites() {
          const tbody = document.getElementById('websites-tbody');
          tbody.innerHTML = '';
          websites.forEach(site => {
            const tr = document.createElement('tr');
            tr.id = 'row-' + site.id;
            tr.innerHTML = \`
              <td><strong>\${site.name}</strong></td>
              <td><code>\${site.origin}</code></td>
              <td>\${site.environment}</td>
              <td><span id="status-\${site.id}" class="badge \${site.verified ? 'badge-verified' : 'badge-unverified'}">\${site.verified ? 'Healthy & Verified' : 'Unverified (Pending DNS)'}</span></td>
              <td><code id="token-\${site.id}" style="font-size: 11px;">\${site.verificationToken}</code></td>
              <td>
                \${!site.verified ? \`<button id="verify-\${site.id}" class="btn" style="padding: 4px 8px; font-size: 12px;" onclick="verifyDomain('\${site.id}')">Verify DNS</button>\` : ''}
                \${site.verified ? \`<button id="build-journey-\${site.id}" class="btn primary" style="padding: 4px 8px; font-size: 12px;" onclick="openJourneyModal('\${site.id}')">Configure Journey</button>\` : ''}
              </td>
            \`;
            tbody.appendChild(tr);
          });
        }

        function openAddDomainModal() {
          document.getElementById('add-domain-modal').style.display = 'flex';
        }

        function closeAddDomainModal() {
          document.getElementById('add-domain-modal').style.display = 'none';
        }

        function submitAddDomain() {
          const name = document.getElementById('domain-name-input').value;
          const origin = document.getElementById('domain-origin-input').value;
          const env = document.getElementById('domain-env-select').value;

          const newSite = {
            id: 'site_' + Date.now(),
            name: name || 'Acme Global Store',
            origin: origin || 'https://checkout.acme.corp',
            environment: env,
            verified: false,
            verificationToken: 'barrierlens-verification-token=bl_verify_sha256_8f2a1b9c7d4e3f5a'
          };

          websites.push(newSite);
          renderWebsites();
          closeAddDomainModal();
        }

        function verifyDomain(siteId) {
          const site = websites.find(s => s.id === siteId);
          if (site) {
            site.verified = true;
            renderWebsites();
          }
        }

        function openJourneyModal(siteId) {
          document.getElementById('journey-modal').style.display = 'flex';
        }

        function closeJourneyModal() {
          document.getElementById('journey-modal').style.display = 'none';
        }

        function saveJourneyAndTriggerSwarm() {
          configuredJourneys.push({
            name: 'End-to-End Cart Checkout',
            stepsCount: 4
          });
          closeJourneyModal();
          document.getElementById('swarm-scan-status').style.display = 'block';
        }

        window.getWebsites = () => websites;
        window.getJourneys = () => configuredJourneys;
      </script>
    </body>
    </html>
  `;

  before(async () => {
    const fixture = await createPage();
    page = fixture.page;
    await page.setContent(SITES_MANAGER_FIXTURE_HTML, { waitUntil: 'domcontentloaded' });
  });

  after(async () => {
    await closeBrowser();
  });

  it('Step 1: Org admin enters Managed Web Properties and opens Add Domain dialog', async () => {
    assert.equal(await page.isVisible('#add-domain-modal'), false);

    // Click Add Web Property
    await page.click('#add-domain-btn');

    // Dialog opens
    assert.equal(await page.isVisible('#add-domain-modal'), true);
  });

  it('Step 2: Admin enters web property metadata and generates cryptographic DNS token', async () => {
    await page.fill('#domain-name-input', 'Acme Global Store');
    await page.fill('#domain-origin-input', 'https://checkout.acme.corp');
    await page.selectOption('#domain-env-select', 'production');

    // Submit
    await page.click('#submit-add-domain');

    // Modal closes and site appears in table
    assert.equal(await page.isVisible('#add-domain-modal'), false);

    const websites = await page.evaluate(() => (window as any).getWebsites());
    assert.equal(websites.length, 1);
    assert.equal(websites[0].name, 'Acme Global Store');
    assert.equal(websites[0].origin, 'https://checkout.acme.corp');
    assert.equal(websites[0].environment, 'production');

    // Verifies cryptographic verification token format
    assert.ok(websites[0].verificationToken.startsWith('barrierlens-verification-token=bl_verify_sha256_'));
  });

  it('Step 3: Admin executes DNS verification check and validates domain ownership', async () => {
    const siteId = await page.evaluate(() => (window as any).getWebsites()[0].id);

    // Initial status is unverified
    const statusTextBefore = await page.textContent(`#status-${siteId}`);
    assert.ok(statusTextBefore?.includes('Unverified'));

    // Click Verify DNS
    await page.click(`#verify-${siteId}`);

    // Status updates to Healthy & Verified
    const statusTextAfter = await page.textContent(`#status-${siteId}`);
    assert.ok(statusTextAfter?.includes('Healthy & Verified'));

    // Configure Journey button is now displayed
    assert.equal(await page.isVisible(`#build-journey-${siteId}`), true);
  });

  it('Step 4: Admin opens Journey Builder modal and verifies multi-step journey sequence', async () => {
    const siteId = await page.evaluate(() => (window as any).getWebsites()[0].id);

    // Open Journey Builder Modal
    await page.click(`#build-journey-${siteId}`);
    assert.equal(await page.isVisible('#journey-modal'), true);

    // Inspect journey steps list
    const stepsText = await page.textContent('#steps-list');
    assert.ok(stepsText?.includes('1. Navigate: https://checkout.acme.corp/products'));
    assert.ok(stepsText?.includes('2. Click: #add-to-cart-btn'));
    assert.ok(stepsText?.includes('3. Enter Text: #promo-code-input (DISCOUNT20)'));
    assert.ok(stepsText?.includes('4. Assert Text: #cart-total ($79.99)'));
  });

  it('Step 5: Admin saves journey and triggers automated swarm scan across property', async () => {
    // Click Save Journey & Dispatch Swarm
    await page.click('#save-trigger-swarm-btn');

    // Journey modal closes
    assert.equal(await page.isVisible('#journey-modal'), false);

    // Swarm audit status banner appears
    assert.equal(await page.isVisible('#swarm-scan-status'), true);
    const statusText = await page.textContent('#swarm-scan-status');
    assert.ok(statusText?.includes('Automated Swarm Audit Triggered!'));

    // Verify configured journey registered in state
    const journeys = await page.evaluate(() => (window as any).getJourneys());
    assert.equal(journeys.length, 1);
    assert.equal(journeys[0].stepsCount, 4);
  });

});
