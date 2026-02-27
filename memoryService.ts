
import { MemoryEntry, StaffPreference, CultureLog } from './types';

const STORAGE_KEYS = {
  PREFERENCES: 'medicare_v1_system_prefs',
  CULTURE: 'medicare_v1_culture_node',
};

/**
 * Institutional Forgetting Protocol:
 * Prevents tracking of individual doctor "mistakes" or PII.
 * Only remembers system-level formatting or pace preferences.
 */
const ethicalFilter = (text: string): boolean => {
  const blacklisted = ['error', 'mistake', 'fail', 'wrong', 'doctor name', 'patient name', 'identifiable'];
  return !blacklisted.some(w => text.toLowerCase().includes(w));
};

export const memoryService = {
  session: new Map<string, string[]>(),

  // Fix: Added addToSession to manage in-memory session transcripts
  addToSession: (key: string, text: string) => {
    const current = memoryService.session.get(key) || [];
    memoryService.session.set(key, [...current, text]);
  },

  // Fix: Added clearSession to reset in-memory session transcripts
  clearSession: (key: string) => {
    memoryService.session.delete(key);
  },

  getStaffPrefs: (staffHash: string): StaffPreference => {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.PREFERENCES) || '{}');
    return all[staffHash] || { staffHash, pace: 'standard', style: 'brief', stressTriggerDetected: false };
  },

  saveStaffPref: (pref: StaffPreference) => {
    // Only save pace and style - forget error detection for individual logs
    const safePref = { ...pref, stressTriggerDetected: false };
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.PREFERENCES) || '{}');
    all[pref.staffHash] = safePref;
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(all));
  },

  getCultureMemory: (): CultureLog[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CULTURE) || '[]');
  },

  addCultureLearning: (learning: string, pattern: string, outcome: CultureLog['outcome']) => {
    if (!ethicalFilter(learning)) return; 

    const logs = memoryService.getCultureMemory();
    const newLog: CultureLog = {
      id: `C-${Date.now()}`,
      timestamp: Date.now(),
      pattern,
      outcome,
      learning,
    };
    localStorage.setItem(STORAGE_KEYS.CULTURE, JSON.stringify([newLog, ...logs].slice(0, 50)));
  },

  fullReset: () => {
    localStorage.clear();
    console.warn("SYSTEM: Institutional Memory Wipe Performed.");
  }
};
