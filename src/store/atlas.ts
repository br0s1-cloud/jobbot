import { create } from 'zustand';
import { DEFAULT_SETTINGS } from '../domain/markets';
import type { Dataset } from '../domain/types';
import type { Repo } from './repo';

export const EMPTY_DATASET: Dataset = {
  companies: [],
  offices: [],
  opportunities: [],
  stage_history: [],
  contacts: [],
  contact_links: [],
  interactions: [],
  settings: DEFAULT_SETTINGS,
};

export type Theme = 'dark' | 'light';

type State = {
  data: Dataset;
  status: 'loading' | 'ready' | 'error';
  error: string | null;
  repo: Repo | null;

  hoveredOfficeId: string | null;
  selectedOppId: string | null;
  /** After a drag, the card shows an inline "log a note?" field for this history entry. */
  pendingNote: { oppId: string; historyId: string } | null;
  railCollapsed: boolean;
  mobileTab: 'board' | 'map';
  theme: Theme;
};

type Actions = {
  set: (p: Partial<State>) => void;
  setData: (fn: (d: Dataset) => Dataset) => void;
  setTheme: (t: Theme) => void;
};

function initialTheme(): Theme {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export const useAtlas = create<State & Actions>((set) => ({
  data: EMPTY_DATASET,
  status: 'loading',
  error: null,
  repo: null,
  hoveredOfficeId: null,
  selectedOppId: null,
  pendingNote: null,
  railCollapsed: false,
  mobileTab: 'board',
  theme: initialTheme(),

  set: (p) => set(p),
  setData: (fn) => set((s) => ({ data: fn(s.data) })),
  setTheme: (t) => {
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem('jobbot.theme', t);
    } catch {
      /* private mode: theme just won't persist */
    }
    set({ theme: t });
  },
}));
