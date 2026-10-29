import { PersonaType } from '../types';

export interface PersonaConstraints {
  persona: PersonaType;
  allowsMouseClick: boolean;
  allowedKeys: string[];
  enforcesFocusRings: boolean;
  requiresScreenReaderAnnouncements: boolean;
}

export const PERSONA_CONFIGS: Record<PersonaType, PersonaConstraints> = {
  keyboard: {
    persona: 'keyboard',
    allowsMouseClick: false, // Strictly physical key navigation only!
    allowedKeys: ['Tab', 'Shift+Tab', 'Enter', 'Space', 'Escape', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'],
    enforcesFocusRings: true,
    requiresScreenReaderAnnouncements: false,
  },
  screen_reader: {
    persona: 'screen_reader',
    allowsMouseClick: false,
    allowedKeys: ['Tab', 'Shift+Tab', 'Enter', 'Space', 'Escape', 'ArrowDown', 'ArrowUp'],
    enforcesFocusRings: false,
    requiresScreenReaderAnnouncements: true,
  },
  low_vision: {
    persona: 'low_vision',
    allowsMouseClick: true,
    allowedKeys: ['Tab', 'Enter', 'Escape'],
    enforcesFocusRings: true,
    requiresScreenReaderAnnouncements: false,
  },
  mouse_unconstrained: {
    persona: 'mouse_unconstrained',
    allowsMouseClick: true,
    allowedKeys: ['Tab', 'Enter', 'Escape'],
    enforcesFocusRings: false,
    requiresScreenReaderAnnouncements: false,
  },
};
