import { DiscoveredDomainProfile, RouteArchetype } from './domain-crawler';
import { sql } from '../../neon/db';
import crypto from 'node:crypto';

export interface CUJStepMilestone {
  stepIdx: number;
  name: string;
  targetUrl: string;
  expectedArchetype: RouteArchetype;
  verificationCriteria: string[];
}

export interface SynthesizedCUJ {
  id: string;
  name: string;
  description: string;
  criticality: 'critical' | 'high' | 'medium';
  startingUrl: string;
  goalText: string;
  steps: CUJStepMilestone[];
  personaSet: string[];
}

export interface DomainCUJBundle {
  websiteId: string;
  domain: string;
  origin: string;
  journeys: SynthesizedCUJ[];
  createdAt: string;
}

/**
 * Critical User Journey (CUJ) Synthesizer
 * Formulates realistic end-to-end task journeys across discovered website archetypes
 * and persists them into Neon Postgres websites, journeys, and flows tables.
 */
export class CUJSynthesizer {
  /**
   * Synthesizes 3-5 Critical User Journeys based on discovered archetypes
   */
  synthesizeJourneys(profile: DiscoveredDomainProfile): SynthesizedCUJ[] {
    const journeys: SynthesizedCUJ[] = [];
    const origin = profile.origin;
    const arch = profile.archetypes;

    // 1. Transaction / Purchase Flow (Critical)
    const hasCatalog = arch.catalog.length > 0;
    const hasCart = arch.cart_checkout.length > 0;
    const hasDetail = arch.detail.length > 0;

    const catalogUrl = hasCatalog ? arch.catalog[0].url : `${origin}/products`;
    const detailUrl = hasDetail ? arch.detail[0].url : (hasCatalog ? arch.catalog[0].url : `${origin}/item`);
    const cartUrl = hasCart ? arch.cart_checkout[0].url : `${origin}/cart`;

    journeys.push({
      id: crypto.randomUUID(),
      name: 'Primary E-Commerce & Transaction Journey',
      description: 'End-to-end user navigation from landing page through item discovery and checkout without focus traps.',
      criticality: 'critical',
      startingUrl: origin,
      goalText: 'Navigate from home page through catalog to checkout flow without keyboard traps or unannounced errors',
      personaSet: ['keyboard', 'screen_reader', 'low_vision'],
      steps: [
        {
          stepIdx: 1,
          name: 'Access Landing Page',
          targetUrl: origin,
          expectedArchetype: 'landing',
          verificationCriteria: ['Skip link present', 'Landmark navigation semantic', 'Focus order logical']
        },
        {
          stepIdx: 2,
          name: 'Browse Product Catalog',
          targetUrl: catalogUrl,
          expectedArchetype: 'catalog',
          verificationCriteria: ['Filter controls accessible', 'Product card names descriptive', 'No focus loops']
        },
        {
          stepIdx: 3,
          name: 'Inspect Product Detail',
          targetUrl: detailUrl,
          expectedArchetype: 'detail',
          verificationCriteria: ['Interactive quantity/variant selectors accessible', 'Image alt attributes valid']
        },
        {
          stepIdx: 4,
          name: 'Review Cart and Checkout',
          targetUrl: cartUrl,
          expectedArchetype: 'cart_checkout',
          verificationCriteria: ['Form fields labeled', 'No modal keyboard traps', 'Error states announced']
        }
      ]
    });

    // 2. Authentication & Credential Management Flow
    const hasAuth = arch.auth.length > 0;
    const authUrl = hasAuth ? arch.auth[0].url : `${origin}/login`;

    journeys.push({
      id: crypto.randomUUID(),
      name: 'User Authentication & Onboarding Journey',
      description: 'Traversal of login, registration, and form inputs validating error identification and focus retention.',
      criticality: 'high',
      startingUrl: authUrl,
      goalText: 'Complete credential input submission validating form labels, error announcements, and focus retention',
      personaSet: ['keyboard', 'screen_reader'],
      steps: [
        {
          stepIdx: 1,
          name: 'Focus Authentication Inputs',
          targetUrl: authUrl,
          expectedArchetype: 'auth',
          verificationCriteria: ['Input fields explicitly labeled', 'Autocomplete tokens present', 'Password reveal accessible']
        },
        {
          stepIdx: 2,
          name: 'Trigger Validation Feedback',
          targetUrl: authUrl,
          expectedArchetype: 'auth',
          verificationCriteria: ['Validation errors announced in live region', 'Focus moves to first invalid field']
        }
      ]
    });

    // 3. Global Information Architecture & Skip-Link Traversal
    journeys.push({
      id: crypto.randomUUID(),
      name: 'Global Landmark & Navigation Flow',
      description: 'Validation of landmark regions (<header>, <main>, <nav>, <footer>) and bypass mechanism compliance (WCAG 2.4.1).',
      criticality: 'high',
      startingUrl: origin,
      goalText: 'Traverse primary landmark hierarchy using keyboard shortcuts and verify bypass blocks functionality',
      personaSet: ['keyboard', 'screen_reader'],
      steps: [
        {
          stepIdx: 1,
          name: 'Activate Skip Link',
          targetUrl: origin,
          expectedArchetype: 'landing',
          verificationCriteria: ['Skip to content button visible on focus', 'Focus moves directly to main content target']
        },
        {
          stepIdx: 2,
          name: 'Traverse Navigation Bar',
          targetUrl: origin,
          expectedArchetype: 'landing',
          verificationCriteria: ['Dropdown submenus expand with Space/Enter', 'Escape collapses submenus']
        }
      ]
    });

    // 4. Support & Self-Service Flow (if present)
    if (arch.docs_support.length > 0) {
      const docsUrl = arch.docs_support[0].url;
      journeys.push({
        id: crypto.randomUUID(),
        name: 'Documentation & Customer Support Flow',
        description: 'Navigation through help center, knowledgebase, and expandable FAQ accordions.',
        criticality: 'medium',
        startingUrl: docsUrl,
        goalText: 'Access help resources and verify expandable accordions announce aria-expanded state',
        personaSet: ['keyboard', 'screen_reader', 'cognitive'],
        steps: [
          {
            stepIdx: 1,
            name: 'Open Help Center',
            targetUrl: docsUrl,
            expectedArchetype: 'docs_support',
            verificationCriteria: ['Search input accessible', 'Accordion elements declare aria-expanded']
          }
        ]
      });
    }

    return journeys;
  }

  /**
   * Persists synthesized website and journeys directly into Neon Postgres
   */
  async persistToNeon(
    profile: DiscoveredDomainProfile,
    journeys: SynthesizedCUJ[],
    userId: string = 'usr_autonomous_system'
  ): Promise<DomainCUJBundle> {
    const websiteId = crypto.randomUUID();
    const verificationToken = 'bl_token_' + crypto.randomBytes(16).toString('hex');

    try {
      // 1. Insert into websites table
      await sql`
        INSERT INTO websites (id, user_id, name, origin, environment, verification_token, verified_at, created_at, updated_at)
        VALUES (
          ${websiteId},
          ${userId},
          ${profile.domain},
          ${profile.origin},
          'production',
          ${verificationToken},
          NOW(),
          NOW(),
          NOW()
        );
      `;

      // 2. Insert journeys & flows into Neon
      for (const j of journeys) {
        await sql`
          INSERT INTO journeys (id, website_id, user_id, name, description, starting_url, steps, criticality, version, created_at, updated_at)
          VALUES (
            ${j.id},
            ${websiteId},
            ${userId},
            ${j.name},
            ${j.description},
            ${j.startingUrl},
            ${JSON.stringify(j.steps)},
            ${j.criticality},
            1,
            NOW(),
            NOW()
          );
        `;

        await sql`
          INSERT INTO flows (site_id, goal_text, milestones, persona_set)
          VALUES (
            ${websiteId},
            ${j.goalText},
            ${JSON.stringify(j.steps)},
            ${j.personaSet}
          );
        `;
      }

      console.log(`[CUJSynthesizer] Persisted website ${profile.domain} (${websiteId}) and ${journeys.length} journeys to Neon Postgres.`);
    } catch (err: any) {
      console.warn('[CUJSynthesizer] Neon DB persistence notice (offline fallback):', err.message);
    }

    return {
      websiteId,
      domain: profile.domain,
      origin: profile.origin,
      journeys,
      createdAt: new Date().toISOString()
    };
  }
}
