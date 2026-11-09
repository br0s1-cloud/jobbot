import { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { useAtlas, EMPTY_DATASET } from '../store/atlas';
import { firebaseConfigured, getFirebase, signInWithGoogle, signOutUser, watchUser } from './firebase';
import { createLiveRepo, subscribeLive } from './liveRepo';
import { AtlasShell, type Editors } from '../components/AtlasShell';
import { FullScreenMessage, EmptyState } from '../components/ui/States';
import { CompanyForm } from './forms/CompanyForm';
import { OpportunityForm } from './forms/OpportunityForm';
import { ContactForm } from './forms/ContactForm';
import { SettingsForm } from './forms/SettingsForm';

type Open =
  | { kind: 'company'; id?: string }
  | { kind: 'opportunity'; id?: string }
  | { kind: 'contact'; id?: string; oppId?: string }
  | { kind: 'settings' }
  | null;

export default function LiveApp() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [signInError, setSignInError] = useState<string | null>(null);
  const status = useAtlas((s) => s.status);
  const error = useAtlas((s) => s.error);
  const opportunityCount = useAtlas((s) => s.data.opportunities.length);
  const companyCount = useAtlas((s) => s.data.companies.length);
  const [open, setOpen] = useState<Open>(null);

  useEffect(() => {
    document.title = 'jobbot · my territory';
    if (!firebaseConfigured()) return;
    return watchUser(setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const { set } = useAtlas.getState();
    const { db } = getFirebase();
    set({ data: EMPTY_DATASET, status: 'loading', error: null, selectedOppId: null, repo: createLiveRepo(db, user.uid) });
    const unsub = subscribeLive(db, user.uid);
    return () => {
      unsub();
      set({ repo: null, data: EMPTY_DATASET, status: 'loading' });
    };
  }, [user]);

  const editors = useMemo<Editors>(
    () => ({
      company: (id) => setOpen({ kind: 'company', id }),
      opportunity: (id) => setOpen({ kind: 'opportunity', id }),
      contact: (id, oppId) => setOpen({ kind: 'contact', id, oppId }),
    }),
    [],
  );

  if (!firebaseConfigured()) {
    return <FullScreenMessage title="Live mode isn't configured" body="This build has no Firebase config. Copy .env.example to .env.local and fill it in (see SETUP.md)." />;
  }
  if (user === undefined) return <FullScreenMessage title="Checking sign-in…" />;
  if (user === null) {
    return (
      <FullScreenMessage
        title="Sign in to your territory"
        body={
          <>
            Live data is private to the owner's Google account. Looking for the public version?{' '}
            <a className="text-focus hover:underline" href={import.meta.env.BASE_URL}>
              Open the demo
            </a>
            .
          </>
        }
        action={{
          label: 'Sign in with Google',
          onClick: () => {
            setSignInError(null);
            signInWithGoogle().catch((e) => setSignInError(e?.code === 'auth/popup-closed-by-user' ? null : String(e?.message ?? e)));
          },
        }}
      >
        {signInError && <p className="mt-3 text-[12px] text-danger">{signInError}</p>}
      </FullScreenMessage>
    );
  }
  if (status === 'error' && error === 'permission-denied') {
    return <AccessDenied user={user} />;
  }

  const empty = status === 'ready' && opportunityCount === 0;
  return (
    <>
      <AtlasShell
        editors={editors}
        actions={
          <>
            <AddMenu onPick={(kind) => setOpen({ kind })} />
            <button onClick={() => setOpen({ kind: 'settings' })} className="rounded-md p-1.5 text-muted hover:bg-raised hover:text-ink" aria-label="Settings" title="Settings">
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M11.5 1.5h-3l-.5 2.3a6.5 6.5 0 00-1.6.9L4.2 4l-1.5 2.6 1.8 1.6a6.6 6.6 0 000 1.8l-1.8 1.6L4.2 14.2l2.2-.7c.5.4 1 .7 1.6.9l.5 2.3h3l.5-2.3c.6-.2 1.1-.5 1.6-.9l2.2.7 1.5-2.6-1.8-1.6a6.6 6.6 0 000-1.8l1.8-1.6L15.8 4l-2.2.7a6.5 6.5 0 00-1.6-.9l-.5-2.3zM10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
              </svg>
            </button>
          </>
        }
        mapOverlay={
          empty ? (
            <EmptyState
              title={companyCount ? 'Add your first role' : 'Your territory is empty'}
              body={companyCount ? 'Roles appear as pins at their office and as cards in the pipeline.' : 'Start with a company you’re targeting and where its offices are. Then add roles and the people you’ve talked to.'}
            >
              {!companyCount && (
                <button onClick={() => setOpen({ kind: 'company' })} className="rounded-md bg-ink px-3 py-1.5 text-[13px] font-medium text-bg">
                  Add a company
                </button>
              )}
              {companyCount > 0 && (
                <button onClick={() => setOpen({ kind: 'opportunity' })} className="rounded-md bg-ink px-3 py-1.5 text-[13px] font-medium text-bg">
                  Add a role
                </button>
              )}
              <span className="w-full text-[11px] text-faint">Importing your Google Sheet / Excel outreach files arrives in Phase 2.</span>
            </EmptyState>
          ) : null
        }
      />
      {open?.kind === 'company' && <CompanyForm id={open.id} onClose={() => setOpen(null)} />}
      {open?.kind === 'opportunity' && <OpportunityForm id={open.id} onClose={() => setOpen(null)} onAddCompany={() => setOpen({ kind: 'company' })} />}
      {open?.kind === 'contact' && <ContactForm id={open.id} linkToOppId={open.oppId} onClose={() => setOpen(null)} />}
      {open?.kind === 'settings' && <SettingsForm email={user.email ?? ''} onClose={() => setOpen(null)} onSignOut={() => void signOutUser().then(() => setOpen(null))} />}
    </>
  );
}

function AddMenu({ onPick }: { onPick: (k: 'company' | 'opportunity' | 'contact') => void }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setShow(!show)} aria-expanded={show} className="rounded-md bg-raised px-2.5 py-1 text-[13px] font-medium hover:bg-line">
        + Add
      </button>
      {show && (
        <div className="absolute right-0 z-50 mt-1 w-40 overflow-hidden rounded-lg border border-line bg-panel shadow-xl" role="menu">
          {(
            [
              ['company', 'Company'],
              ['opportunity', 'Role'],
              ['contact', 'Contact'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              role="menuitem"
              onClick={() => {
                setShow(false);
                onPick(k);
              }}
              className="block w-full px-3 py-2 text-left text-[13px] hover:bg-raised"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AccessDenied({ user }: { user: User }) {
  const [copied, setCopied] = useState(false);
  return (
    <FullScreenMessage
      title="This account isn't the owner yet"
      body={
        <>
          Signed in as <b>{user.email}</b>. The database only opens for the owner's user ID. If this is your account, send this ID to Claude so it can be added to the
          Firestore security rules:
        </>
      }
      action={{ label: 'Sign out', onClick: () => void signOutUser() }}
    >
      <div className="mt-3 flex items-center justify-center gap-2">
        <code className="rounded bg-raised px-2 py-1 text-[12px]">{user.uid}</code>
        <button
          onClick={() => {
            void navigator.clipboard?.writeText(user.uid).then(() => setCopied(true));
          }}
          className="text-[12px] text-focus hover:underline"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </FullScreenMessage>
  );
}
