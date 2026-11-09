/** Pipeline order. Kept here (not in types.ts) so the demo bundle doesn't pull in the validation library. */
export const STAGES = ['Saved', 'Applied', 'Recruiter Screen', 'Interviewing', 'Final Round', 'Offer', 'Rejected', 'Withdrawn', 'Ghosted'] as const;
export type Stage = (typeof STAGES)[number];

export const ACTIVE_STAGES = ['Saved', 'Applied', 'Recruiter Screen', 'Interviewing', 'Final Round', 'Offer'] as const satisfies readonly Stage[];
export const CLOSED_STAGES = ['Rejected', 'Withdrawn', 'Ghosted'] as const satisfies readonly Stage[];

const RANK: Record<Stage, number> = {
  Saved: 0,
  Applied: 1,
  'Recruiter Screen': 2,
  Interviewing: 3,
  'Final Round': 4,
  Offer: 5,
  Rejected: -1,
  Withdrawn: -1,
  Ghosted: -1,
};

export const isClosed = (s: Stage) => RANK[s] < 0;
export const stageRank = (s: Stage) => RANK[s];

/** Most advanced *open* stage among the given stages, or null when all are closed / none given. */
export function furthestStage(stages: Stage[]): Stage | null {
  let best: Stage | null = null;
  for (const s of stages) if (!isClosed(s) && (best === null || RANK[s] > RANK[best])) best = s;
  return best;
}

/**
 * Sequential ramp (one hue, dark → bright) so "further along" reads as "brighter" on the dark map.
 * Closed stages share a neutral grey. Amber is reserved for "action needed", never a stage.
 */
export const STAGE_COLOR: Record<Stage, string> = {
  Saved: '#355778',
  Applied: '#2f74a3',
  'Recruiter Screen': '#2b92c4',
  Interviewing: '#3db0d6',
  'Final Round': '#79cde2',
  Offer: '#c4ecf4',
  Rejected: '#5b6472',
  Withdrawn: '#5b6472',
  Ghosted: '#5b6472',
};
export const CLOSED_COLOR = '#5b6472';
