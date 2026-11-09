import { useState } from 'react';
import { useAtlas } from '../../store/atlas';
import { LinkRole, type Relationship } from '../../domain/types';
import { Modal, Field, inputCls, Button, FormError, errMsg } from './ui';

const ROLE_LABEL: Record<LinkRole, string> = { referrer: 'Referrer', recruiter: 'Recruiter', hiring_manager: 'Hiring manager', interviewer: 'Interviewer', peer: 'Peer' };

export function ContactForm({ id, linkToOppId, onClose }: { id?: string; linkToOppId?: string; onClose: () => void }) {
  const data = useAtlas((s) => s.data);
  const repo = useAtlas((s) => s.repo)!;
  const ex = id ? data.contacts.find((c) => c.id === id) : undefined;
  const linkedOpp = linkToOppId ? data.opportunities.find((o) => o.id === linkToOppId) : undefined;

  const [fullName, setFullName] = useState(ex?.full_name ?? '');
  const [title, setTitle] = useState(ex?.title ?? '');
  const [companyId, setCompanyId] = useState(ex?.company_id ?? linkedOpp?.company_id ?? '');
  const [officeId, setOfficeId] = useState(ex?.office_id ?? linkedOpp?.office_id ?? '');
  const [email, setEmail] = useState(ex?.email ?? '');
  const [linkedin, setLinkedin] = useState(ex?.linkedin_url ?? '');
  const [howMet, setHowMet] = useState(ex?.how_met ?? '');
  const [relationship, setRelationship] = useState<Relationship>(ex?.relationship ?? 'cold');
  const [lastTouch, setLastTouch] = useState(ex?.last_touch_at?.slice(0, 10) ?? '');
  const [oppId, setOppId] = useState(linkToOppId ?? '');
  const [role, setRole] = useState<LinkRole>('peer');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const links = ex ? data.contact_links.filter((l) => l.contact_id === ex.id) : [];
  const offices = data.offices.filter((o) => o.company_id === companyId);
  const oppName = (oid: string) => {
    const o = data.opportunities.find((x) => x.id === oid);
    const c = o && data.companies.find((x) => x.id === o.company_id);
    return o ? `${c?.name ?? ''} · ${o.title}` : 'Removed role';
  };

  const save = async () => {
    if (!fullName.trim()) return setError('Name is required.');
    setBusy(true);
    setError(null);
    try {
      const contactId = await repo.save('contacts', {
        id,
        created_at: ex?.created_at,
        full_name: fullName.trim(),
        title: title.trim(),
        company_id: companyId || null,
        office_id: officeId || null,
        email: email.trim(),
        linkedin_url: linkedin.trim(),
        how_met: howMet.trim(),
        relationship,
        last_touch_at: lastTouch ? new Date(`${lastTouch}T17:00:00Z`).toISOString() : null,
        placeholder: false,
      });
      if (oppId && !links.some((l) => l.opportunity_id === oppId)) {
        await repo.save('contact_links', { contact_id: contactId, opportunity_id: oppId, role });
      }
      onClose();
    } catch (e) {
      setError(errMsg(e));
      setBusy(false);
    }
  };

  return (
    <Modal
      title={ex ? `Edit ${ex.full_name}` : 'Log a contact'}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button kind="primary" onClick={save} disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name">
          <input autoFocus className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field>
        <Field label="Title">
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="SDR Manager" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Company">
          <select className={inputCls} value={companyId} onChange={(e) => (setCompanyId(e.target.value), setOfficeId(''))}>
            <option value="">None</option>
            {data.companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Office">
          <select className={inputCls} value={officeId} onChange={(e) => setOfficeId(e.target.value)}>
            <option value="">Unknown / remote</option>
            {offices.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Email">
          <input className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" />
        </Field>
        <Field label="LinkedIn URL">
          <input className={inputCls} value={linkedin} onChange={(e) => setLinkedin(e.target.value)} inputMode="url" />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Relationship">
          <select className={inputCls} value={relationship} onChange={(e) => setRelationship(e.target.value as Relationship)}>
            <option value="cold">Cold</option>
            <option value="warm">Warm</option>
            <option value="strong">Strong</option>
            <option value="champion">Champion</option>
          </select>
        </Field>
        <Field label="Last touch">
          <input type="date" className={inputCls} value={lastTouch} onChange={(e) => setLastTouch(e.target.value)} />
        </Field>
        <Field label="How you met">
          <input className={inputCls} value={howMet} onChange={(e) => setHowMet(e.target.value)} placeholder="Alumni panel" />
        </Field>
      </div>

      <div className="rounded-lg border border-line p-3">
        <div className="mb-2 text-[12px] font-medium text-muted">Linked roles</div>
        {links.length > 0 && (
          <ul className="mb-2 space-y-1">
            {links.map((l) => (
              <li key={l.id} className="flex items-center justify-between text-[13px]">
                <span className="truncate">
                  {oppName(l.opportunity_id)} <span className="text-muted">· {ROLE_LABEL[l.role]}</span>
                </span>
                <button onClick={() => repo.remove('contact_links', l.id).catch((e) => setError(errMsg(e)))} className="text-[12px] text-muted hover:text-danger">
                  Unlink
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="grid grid-cols-[2fr_1fr] gap-2">
          <select className={inputCls} value={oppId} onChange={(e) => setOppId(e.target.value)} aria-label="Link to role">
            <option value="">Link to a role…</option>
            {data.opportunities.map((o) => (
              <option key={o.id} value={o.id}>
                {oppName(o.id)}
              </option>
            ))}
          </select>
          <select className={inputCls} value={role} onChange={(e) => setRole(e.target.value as LinkRole)} aria-label="Their role">
            {LinkRole.options.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <FormError error={error} />
    </Modal>
  );
}
