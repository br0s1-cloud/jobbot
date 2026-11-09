import { useState } from 'react';
import { useAtlas } from '../../store/atlas';
import { STAGES, type Opportunity, type Source, type Stage, type Track } from '../../domain/types';
import { newId, nowIso } from '../../store/repo';
import { Modal, Field, inputCls, Button, FormError, errMsg } from './ui';

const dateIn = (iso: string | null | undefined) => iso?.slice(0, 10) ?? '';
const dateOut = (d: string) => (d ? new Date(`${d}T21:00:00Z`).toISOString() : null);

export function OpportunityForm({ id, onClose, onAddCompany }: { id?: string; onClose: () => void; onAddCompany: () => void }) {
  const data = useAtlas((s) => s.data);
  const repo = useAtlas((s) => s.repo)!;
  const set = useAtlas((s) => s.set);
  const ex = id ? data.opportunities.find((o) => o.id === id) : undefined;

  const [companyId, setCompanyId] = useState(ex?.company_id ?? data.companies[0]?.id ?? '');
  const [officeId, setOfficeId] = useState<string>(ex?.office_id ?? '');
  const [remote, setRemote] = useState(ex?.remote ?? false);
  const [title, setTitle] = useState(ex?.title ?? '');
  const [track, setTrack] = useState<Track>(ex?.track ?? 'full_time');
  const [source, setSource] = useState<Source>(ex?.source ?? 'linkedin');
  const [url, setUrl] = useState(ex?.url ?? '');
  const [stage, setStage] = useState<Stage>(ex?.stage ?? 'Saved');
  const [priority, setPriority] = useState(ex?.priority ?? 2);
  const [nextStep, setNextStep] = useState(ex?.next_step ?? '');
  const [due, setDue] = useState(dateIn(ex?.next_step_due));
  const [applied, setApplied] = useState(dateIn(ex?.applied_at));
  const [comp, setComp] = useState(ex?.comp_notes ?? '');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const offices = data.offices.filter((o) => o.company_id === companyId);

  if (data.companies.length === 0) {
    return (
      <Modal title="Add a role" onClose={onClose}>
        <p className="text-[13px] text-muted">Roles belong to a company. Add the company (and where its offices are) first.</p>
        <Button kind="primary" onClick={onAddCompany}>
          Add company
        </Button>
      </Modal>
    );
  }

  const save = async () => {
    if (!title.trim()) return setError('Title is required.');
    if (!remote && !officeId) return setError('Pick an office, or mark the role as remote.');
    setBusy(true);
    setError(null);
    try {
      const at = nowIso();
      const doc: Omit<Opportunity, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string } = {
        id,
        created_at: ex?.created_at,
        company_id: companyId,
        office_id: remote ? null : officeId,
        remote,
        title: title.trim(),
        track,
        source,
        url: url.trim(),
        stage: ex?.stage ?? stage,
        stage_changed_at: ex?.stage_changed_at ?? at,
        applied_at: dateOut(applied) ?? (!ex && stage !== 'Saved' ? at : null),
        priority,
        comp_notes: comp,
        next_step: nextStep.trim(),
        next_step_due: dateOut(due),
      };
      const savedId = await repo.save('opportunities', doc);
      if (!ex) {
        await repo.save('stage_history', { id: newId(), opportunity_id: savedId, from_stage: null, to_stage: stage, changed_at: at, changed_by: 'me', note: '' });
        set({ selectedOppId: savedId });
      }
      onClose();
    } catch (e) {
      setError(errMsg(e));
      setBusy(false);
    }
  };

  const del = async () => {
    if (!ex) return;
    if (!confirmDelete) return setConfirmDelete(true);
    setBusy(true);
    try {
      for (const h of data.stage_history.filter((h) => h.opportunity_id === ex.id)) await repo.remove('stage_history', h.id);
      for (const l of data.contact_links.filter((l) => l.opportunity_id === ex.id)) await repo.remove('contact_links', l.id);
      await repo.remove('opportunities', ex.id);
      set({ selectedOppId: null });
      onClose();
    } catch (e) {
      setError(errMsg(e));
      setBusy(false);
    }
  };

  return (
    <Modal
      title={ex ? 'Edit role' : 'Add a role'}
      onClose={onClose}
      footer={
        <>
          {ex && (
            <Button kind="danger" onClick={del} disabled={busy} className="mr-auto">
              {confirmDelete ? 'Click again to delete' : 'Delete'}
            </Button>
          )}
          <Button onClick={onClose}>Cancel</Button>
          <Button kind="primary" onClick={save} disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <Field label="Title">
        <input autoFocus className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sales Development Representative" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Company">
          <select
            className={inputCls}
            value={companyId}
            onChange={(e) => {
              setCompanyId(e.target.value);
              setOfficeId('');
            }}
          >
            {data.companies
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Office">
          <select className={inputCls} value={remote ? '__remote' : officeId} onChange={(e) => (e.target.value === '__remote' ? (setRemote(true), setOfficeId('')) : (setRemote(false), setOfficeId(e.target.value)))}>
            <option value="">Choose…</option>
            {offices.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
            <option value="__remote">Remote</option>
          </select>
        </Field>
      </div>
      <button type="button" onClick={onAddCompany} className="text-[12px] text-muted hover:text-ink">
        Company or office missing? Add it →
      </button>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Track">
          <select className={inputCls} value={track} onChange={(e) => setTrack(e.target.value as Track)}>
            <option value="full_time">Full-time</option>
            <option value="internship">Internship</option>
          </select>
        </Field>
        <Field label="Source">
          <select className={inputCls} value={source} onChange={(e) => setSource(e.target.value as Source)}>
            <option value="linkedin">LinkedIn</option>
            <option value="referral">Referral</option>
            <option value="company_site">Company site</option>
            <option value="handshake">Handshake</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Priority">
          <select className={inputCls} value={priority} onChange={(e) => setPriority(Number(e.target.value))}>
            <option value={1}>P1</option>
            <option value={2}>P2</option>
            <option value={3}>P3</option>
          </select>
        </Field>
      </div>
      {!ex && (
        <Field label="Stage">
          <select className={inputCls} value={stage} onChange={(e) => setStage(e.target.value as Stage)}>
            {STAGES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
      )}
      <Field label="Posting URL">
        <input className={inputCls} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" inputMode="url" />
      </Field>
      <div className="grid grid-cols-[2fr_1fr] gap-3">
        <Field label="Next step">
          <input className={inputCls} value={nextStep} onChange={(e) => setNextStep(e.target.value)} placeholder="Follow up with recruiter" />
        </Field>
        <Field label="Due">
          <input type="date" className={inputCls} value={due} onChange={(e) => setDue(e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-[1fr_2fr] gap-3">
        <Field label="Applied on">
          <input type="date" className={inputCls} value={applied} onChange={(e) => setApplied(e.target.value)} />
        </Field>
        <Field label="Comp notes">
          <input className={inputCls} value={comp} onChange={(e) => setComp(e.target.value)} placeholder="OTE, base/variable split…" />
        </Field>
      </div>
      <FormError error={error} />
    </Modal>
  );
}
