import { AnnouncementEvent, SilentErrorFinding } from '../types';

export class AnnouncementGapDetector {
  /**
   * Evaluates if a visual DOM change had a corresponding assistive announcement or focus shift.
   */
  detectGap(
    visualMutations: Array<{ tag: string; text: string; isLive: boolean }>,
    announcements: AnnouncementEvent[],
    focusMoved: boolean
  ): SilentErrorFinding {
    // Check if new error, warning, or feedback text appeared in the visual DOM
    const errorKeywords = ['error', 'invalid', 'required', 'failed', 'cannot', 'must', 'alert', 'wrong'];
    
    let suspiciousText = '';
    for (const m of visualMutations) {
      const lower = (m.text || '').toLowerCase();
      if (errorKeywords.some(kw => lower.includes(kw)) && !m.isLive) {
        suspiciousText = m.text;
        break;
      }
    }

    if (!suspiciousText) {
      return {
        detected: false,
        visualDeltaText: '',
        announcementReceived: announcements.length > 0,
        evidence: 'No silent error state detected.'
      };
    }

    // If text appeared, was there an announcement or focus move to the error message?
    const hasAnnouncement = announcements.some(a => 
      a.text.toLowerCase().includes(suspiciousText.slice(0, 20).toLowerCase()) ||
      a.politeness === 'assertive' || 
      a.politeness === 'polite'
    );

    if (!hasAnnouncement && !focusMoved) {
      return {
        detected: true,
        visualDeltaText: suspiciousText,
        announcementReceived: false,
        evidence: `Visual error message "${suspiciousText}" appeared on submission, but focus remained unchanged and no aria-live region announced the error. Screen reader users receive zero feedback.`
      };
    }

    return {
      detected: false,
      visualDeltaText: suspiciousText,
      announcementReceived: true,
      evidence: 'State change properly announced via aria-live or programmatic focus shift.'
    };
  }
}
