import { useEffect, useRef, type ReactNode } from 'react';

export function Modal({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="m-auto w-[min(560px,calc(100vw-24px))] rounded-xl border border-line bg-panel p-0 text-ink shadow-2xl backdrop:bg-black/60"
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        <button onClick={onClose} className="rounded p-1 text-muted hover:bg-raised hover:text-ink" aria-label="Close">
          ✕
        </button>
      </div>
      <div className="max-h-[70vh] space-y-3 overflow-y-auto px-4 py-4">{children}</div>
      {footer && <div className="flex items-center justify-end gap-2 border-t border-line px-4 py-3">{footer}</div>}
    </dialog>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-faint">{hint}</span>}
    </label>
  );
}

export const inputCls = 'w-full rounded-md border border-line bg-panel-2 px-2.5 py-1.5 text-[13px] text-ink placeholder:text-faint';

export function Button({ kind = 'secondary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { kind?: 'primary' | 'secondary' | 'danger' }) {
  const cls =
    kind === 'primary'
      ? 'bg-ink text-bg hover:opacity-90'
      : kind === 'danger'
        ? 'text-danger hover:bg-danger/10'
        : 'bg-raised text-ink hover:bg-line';
  return <button {...props} className={`rounded-md px-3 py-1.5 text-[13px] font-medium disabled:opacity-50 ${cls} ${props.className ?? ''}`} />;
}

export function FormError({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-[12px] text-danger">
      {error}
    </p>
  );
}

export const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));
