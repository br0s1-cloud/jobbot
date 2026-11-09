import { Component, type ReactNode } from 'react';

export function FullScreenMessage({ title, body, action, children }: { title: string; body?: ReactNode; action?: { label: string; href?: string; onClick?: () => void }; children?: ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center bg-bg p-6">
      <div className="max-w-md text-center">
        <Logo className="mx-auto mb-5 h-10 w-10" />
        <h1 className="text-lg font-semibold text-ink">{title}</h1>
        {body && <div className="mt-2 text-sm text-muted">{body}</div>}
        {children}
        {action &&
          (action.href ? (
            <a href={action.href} className="mt-5 inline-block rounded-md bg-raised px-4 py-2 text-sm font-medium text-ink hover:bg-line">
              {action.label}
            </a>
          ) : (
            <button onClick={action.onClick} className="mt-5 rounded-md bg-raised px-4 py-2 text-sm font-medium text-ink hover:bg-line">
              {action.label}
            </button>
          ))}
      </div>
    </div>
  );
}

export function EmptyState({ title, body, children }: { title: string; body?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mx-auto max-w-sm rounded-xl border border-line bg-panel/95 p-5 text-center shadow-xl backdrop-blur">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      {body && <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{body}</p>}
      {children && <div className="mt-4 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  );
}

export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div role="alert" className="flex items-start gap-3 border-b border-danger/40 bg-danger/10 px-4 py-2 text-[13px] text-ink">
      <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-danger" aria-hidden />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="text-muted hover:text-ink" aria-label="Dismiss">
          ✕
        </button>
      )}
    </div>
  );
}

export function SkeletonCards({ n = 4 }: { n?: number }) {
  return (
    <div className="space-y-2 p-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-lg bg-panel-2" />
      ))}
    </div>
  );
}

export function Logo({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="14" fill="var(--raised)" />
      <circle cx="22" cy="40" r="6" fill="#3db0d6" />
      <circle cx="44" cy="24" r="8" fill="#c4ecf4" />
      <path d="M22 40 Q30 18 44 24" stroke="var(--accent)" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const MONO_COLORS = ['#2f4a63', '#3b4d3a', '#4d3a4f', '#4a4231', '#2e4b4b', '#43384f', '#4f3a33'];
export function Monogram({ name, size = 28 }: { name: string; size?: number }) {
  const initials = name
    .replace(/[^A-Za-z0-9 ]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-md text-[11px] font-semibold text-white/90"
      style={{ width: size, height: size, background: MONO_COLORS[h % MONO_COLORS.length] }}
    >
      {initials || '?'}
    </span>
  );
}

/** Catches render errors and failed lazy chunk loads (common right after a redeploy) and offers a reload. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    console.error('[jobbot]', error);
  }
  render() {
    if (!this.state.error) return this.props.children;
    const chunk = /dynamically imported module|Loading chunk|Importing a module script failed/i.test(this.state.error.message);
    return (
      <FullScreenMessage
        title={chunk ? 'jobbot was just updated' : 'Something went wrong'}
        body={chunk ? 'Reload to get the latest version.' : this.state.error.message}
        action={{ label: 'Reload', onClick: () => window.location.reload() }}
      />
    );
  }
}
