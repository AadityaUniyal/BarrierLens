import { ImageResponse } from 'next/og';

export const alt = 'BarrierLens — Autonomous Accessibility Verification & Code Remediation';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#07080b',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background Ambient Glow */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '30%',
            width: '600px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(0, 144, 255, 0.15) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />

        {/* Top Header: Brand Name & Pill */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Precision Optical Aperture Icon */}
            <svg width="48" height="48" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="44" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.1" />
              <path
                d="M 50 8 A 42 42 0 0 1 92 50"
                stroke="#0090ff"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path
                d="M 50 92 A 42 42 0 0 1 8 50"
                stroke="#10b981"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <circle cx="50" cy="50" r="14" fill="#0090ff" fillOpacity="0.2" stroke="#0090ff" strokeWidth="2" />
              <circle cx="50" cy="50" r="4" fill="#ffffff" />
            </svg>
            <span style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px' }}>
              BarrierLens
            </span>
          </div>
          <div
            style={{
              padding: '6px 16px',
              borderRadius: '999px',
              background: 'rgba(0, 144, 255, 0.1)',
              border: '1px solid rgba(0, 144, 255, 0.25)',
              color: '#0090ff',
              fontSize: '14px',
              fontWeight: 600,
              fontFamily: 'monospace',
              letterSpacing: '0.5px',
            }}
          >
            WCAG 2.2 · VPAT 2.5 · EAA 2025
          </div>
        </div>

        {/* Center: Core Value Proposition */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', zIndex: 10, maxWidth: '960px' }}>
          <h1
            style={{
              fontSize: '56px',
              fontWeight: 800,
              letterSpacing: '-1.5px',
              lineHeight: 1.1,
              margin: 0,
              color: '#ffffff',
            }}
          >
            Autonomous Accessibility Verification &amp; Verified Code Repairs.
          </h1>
          <p
            style={{
              fontSize: '22px',
              color: 'rgba(255, 255, 255, 0.65)',
              lineHeight: 1.4,
              margin: 0,
            }}
          >
            Evaluates dynamic user journeys under real assistive constraints. Tests keyboard focus traps, screen reader fidelity, and generates surgical pull requests.
          </p>
        </div>

        {/* Bottom Footer: Compliance Matrix */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '24px',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.5)',
            fontFamily: 'monospace',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', gap: '24px' }}>
            <span>✓ ZERO FALSE ALARMS</span>
            <span>✓ 1-CLICK GITHUB PULL REQUESTS</span>
            <span>✓ CRYPTOGRAPHIC AUDIT CERTIFICATES</span>
          </div>
          <span style={{ color: '#10b981' }}>● LIVE PRODUCTION AUDITOR</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
