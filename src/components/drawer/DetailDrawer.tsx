import { useEffect, useMemo, useState } from 'react';
import { useAtlas } from '../../store/atlas';
import { byId, daysSince, timelineFor } from '../../domain/derive';
import type { Opportunity } from '../../domain/types';
import { STAGES, STAGE_COLOR } from '../../domain/stages';
import { Monogram } from '../ui/States';
import { useEditors } from '../AtlasShell';

const SOURCE_LABEL = { linkedin: 'LinkedIn', referral: 'Referral', company_site: 'Company site', handshake: 'Handshake', other: 'Other' } as const;
const ROLE_LABEL = { referrer: 'Referrer', recruiter: 'Recruiter', hiring_manager: 'Hiring manager', interviewer: 'Interviewer', peer: 'Peer' } as const;
const INTERACTION_LABEL = { email: 'Email', linkedin_msg: 'LinkedIn message', inmail: 'InMail', call: 'Call', coffee_chat: 'Coffee chat', event: 'Event', note: 'Note' } as const;

export function DetailDrawer() {
  const selectedId = useAtlas((s) => s.selectedOppId);
  const data = useAtlas((s) => s.data);
  const set = useAtlas((s) => s.set);
  const [tab, setTab] = useState<'overview' | 'timeline'>('overview');
  const opp = selectedId ? data.opportunities.find((o) => o.id === selectedId) : undefined;

  useEffect(() => {
    if (!opp) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && set({ selectedOppId: null });
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [opp, set]);

  if (!opp) return null;
  const company = data.companies.find((c) => c.id === opp.company_id);
  const office = opp.office_id ? data.offices.find((o) => o.id === opp.office_id) : undefined;

  return (
    <section
      role="dialog"
      aria-label={`${company?.name}: ${opp.title}`}
      className="fixed inset-x-0 bottom-0 top-14 z-40 flex flex-col border-t border-line bg-panel shadow-2xl md:absolute md:left-0 md:right-[var(--rail-w)] md:top-auto md:h-[48%] md:rounded-t-xl md:border-x"
    >
      <div className="flex items-start gap-3 border-b border-line px-4 pb-2 pt-3">
        <Monogram name={company?.name ?? '?'} size={36} />
        <div className="min-w-0 flex-1">
          <div className="text-[12px] text-muted">
            {company?.name} · {opp.remote ? 'Remote' : office?.label}
          </div>
          <h2 className="truncate text-[15px] font-semibold">{opp.title}</h2>
        </div>
        <button onClick={() => set({ selectedOppId: null })} className="rounded p-1 text-muted hover:bg-raised hover:text-ink" aria-label="Close details">
          ✕
        </button>
      </div>
      <div className="flex gap-1 border-b border-line px-3" role="tablist">
        {(['overview', 'timeline'] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-2.5 py-2 text-[13px] capitalize ${tab === t ? 'border-focus text-ink' : 'border-transparent text-muted hover:text-ink'}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">{tab === 'overview' ? <Overview opp={opp} /> : <Timeline oppId={opp.id} />}</div>
    </section>
  );
}

function Overview({ opp }: { opp: Opportunity }) {
  const data = useAtlas((s) => s.data);
  const repo = useAtlas((s) => s.repo);
  const set = useAtlas((s) => s.set);
  const editors = useEditors();
  const [nextStep, setNextStep] = useState(opp.next_step);
  const [due, setDue] = useState(opp.next_step_due?.slice(0, 10) ?? '');
  useEffect(() => {
    setNextStep(opp.next_step);
    setDue(opp.next_step_due?.slice(0, 10) ?? '');
  }, [opp.id, opp.next_step, opp.next_step_due]);

  const contacts = useMemo(() => {
    const byContact = byId(data.contacts);
    return data.contact_links.filter((l) => l.opportunity_id === opp.id).map((l) => ({ link: l, contact: byContact.get(l.contact_id) }));
  }, [data.contacts, data.contact_links, opp.id]);

  const fail = (e: unknown) => set({ error: `Couldn't save: ${e instanceof Error ? e.message : String(e)}` });
  const saveNext = () => {
    const dueIso = due ? new Date(`${due}T21:00:00Z`).toISOString() : null;
    if (nextStep === opp.next_step && dueIso?.slice(0, 10) === opp.next_step_due?.slice(0, 10)) return;
    repo?.updateOpportunity(opp.id, { next_step: nextStep.trim(), next_step_due: dueIso }).catch(fail);
  };

  return (
    <div className="grid gap-5 md:grid-cols-[1fr_1fr]">
      <div className="space-y-4">
        <Field label="Stage">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: STAGE_COLOR[opp.stage] }} aria-hidden />
            <select
              value={opp.stage}
              onChange={async (e) => {
                const historyId = await repo?.moveStage(opp.id, e.target.value as Opportunity['stage']).catch(fail);
                if (historyId) set({ pendingNote: { oppId: opp.id, historyId } });
              }}
              className="rounded-md border border-line bg-panel-2 px-2 py-1 text-[13px]"
              aria-label="Stage"
            >
              {STAGES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <span className="tnum text-[12px] text-faint">{daysSince(opp.stage_changed_at)}d</span>
          </div>
        </Field>
        <Field label="Next step">
          <div className="flex flex-wrap gap-2">
            <input
              value={nextStep}
              onChange={(e) => setNextStep(e.target.value)}
              onBlur={saveNext}
              placeholder="What's the next move?"
              className="min-w-0 flex-1 rounded-md border border-line bg-panel-2 px-2 py-1 text-[13px]"
              aria-label="Next step"
            />
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} onBlur={saveNext} className="rounded-md border border-line bg-panel-2 px-2 py-1 text-[13px]" aria-label="Next step due date" />
          </div>
        </Field>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
          <Meta k="Track" v={opp.track === 'internship' ? 'Internship' : 'Full-time'} />
          <Meta k="Source" v={SOURCE_LABEL[opp.source]} />
          <Meta k="Priority" v={`P${opp.priority}`} />
          <Meta k="Applied" v={opp.applied_at ? new Date(opp.applied_at).toLocaleDateString() : '—'} />
        </dl>
        <div className="flex flex-wrap gap-2">
          {opp.url && (
            <a href={opp.url} target="_blank" rel="noopener noreferrer" className="rounded-md bg-raised px-2.5 py-1 text-[12px] hover:bg-line">
              Job posting ↗
            </a>
          )}
          {editors.opportunity && (
            <button onClick={() => editors.opportunity!(opp.id)} className="rounded-md bg-raised px-2.5 py-1 text-[12px] hover:bg-line">
              Edit role
            </button>
          )}
          {editors.company && (
            <button onClick={() => editors.company!(opp.company_id)} className="rounded-md bg-raised px-2.5 py-1 text-[12px] hover:bg-line">
              Edit company
            </button>
          )}
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[12px] font-medium text-muted">Contacts</h3>
          {editors.contact && (
            <button onClick={() => editors.contact!(undefined, opp.id)} className="text-[12px] text-muted hover:text-ink">
              + Contact
            </button>
          )}
        </div>
        {contacts.length === 0 ? (
          <p className="text-[13px] text-faint">No contacts linked yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {contacts.map(({ link, contact }) => (
              <li key={link.id} className="flex items-center justify-between gap-2 rounded-md border border-line bg-panel-2 px-2.5 py-1.5 text-[13px]">
                <button className="min-w-0 truncate text-left" onClick={() => contact && editors.contact?.(contact.id)} disabled={!editors.contact}>
                  {contact?.full_name ?? 'Unknown contact'}
                  {contact?.placeholder && <span className="ml-1.5 text-[10px] uppercase tracking-wide text-faint">sample</span>}
                </button>
                <span className="shrink-0 text-[11px] text-muted">
                  {ROLE_LABEL[link.role]} · {contact?.relationship}
                </span>
              </li>
            ))}
          </ul>
        )}
        {opp.comp_notes && (
          <div className="mt-4">
            <h3 className="mb-1 text-[12px] font-medium text-muted">Comp notes</h3>
            <p className="whitespace-pre-wrap text-[13px]">{opp.comp_notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Timeline({ oppId }: { oppId: string }) {
  const data = useAtlas((s) => s.data);
  const items = useMemo(() => timelineFor(data, oppId), [data, oppId]);
  const contacts = useMemo(() => byId(data.contacts), [data.contacts]);
  if (!items.length) return <p className="text-[13px] text-faint">No activity yet. Stage changes and logged interactions show up here.</p>;
  return (
    <ol className="relative space-y-3 border-l border-line pl-4">
      {items.map((it) => (
        <li key={it.kind === 'stage' ? it.change.id : it.interaction.id} className="relative">
          <span
            className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-panel"
            style={{ background: it.kind === 'stage' ? STAGE_COLOR[it.change.to_stage] : 'var(--muted)' }}
            aria-hidden
          />
          <div className="text-[11px] text-faint">{new Date(it.at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
          {it.kind === 'stage' ? (
            <div className="text-[13px]">
              {it.change.from_stage ? (
                <>
                  Moved <b className="font-medium">{it.change.from_stage}</b> → <b className="font-medium">{it.change.to_stage}</b>
                </>
              ) : (
                <>
                  Added as <b className="font-medium">{it.change.to_stage}</b>
                </>
              )}
              {it.change.changed_by !== 'me' && <span className="text-muted"> · via {it.change.changed_by}</span>}
              {it.change.note && <p className="mt-0.5 text-muted">“{it.change.note}”</p>}
            </div>
          ) : (
            <div className="text-[13px]">
              <span className="font-medium">{INTERACTION_LABEL[it.interaction.type]}</span>
              {it.interaction.inbound && <span className="text-muted"> (inbound)</span>}
              {it.interaction.contact_id && <span className="text-muted"> · {contacts.get(it.interaction.contact_id)?.full_name}</span>}
              {it.interaction.summary && <p className="mt-0.5 text-muted">{it.interaction.summary}</p>}
              {it.interaction.source_ref && (
                <a href={it.interaction.source_ref} target="_blank" rel="noopener noreferrer" className="text-[12px] text-focus hover:underline">
                  Open source ↗
                </a>
              )}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[12px] font-medium text-muted">{label}</div>
      {children}
    </div>
  );
}
function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[11px] text-faint">{k}</dt>
      <dd className="tnum">{v}</dd>
    </div>
  );
}
