import { useState } from 'react';
import { useAtlas } from '../../store/atlas';
import type { Office } from '../../domain/types';
import { geocode } from '../../lib/geocode';
import { Modal, Field, inputCls, Button, FormError, errMsg } from './ui';

type DraftOffice = Pick<Office, 'label' | 'city' | 'region' | 'country' | 'lat' | 'lng' | 'is_hq'> & { id?: string; created_at?: string };

export function CompanyForm({ id, onClose, onSaved }: { id?: string; onClose: () => void; onSaved?: (companyId: string) => void }) {
  const data = useAtlas((s) => s.data);
  const repo = useAtlas((s) => s.repo)!;
  const existing = id ? data.companies.find((c) => c.id === id) : undefined;
  const [name, setName] = useState(existing?.name ?? '');
  const [domain, setDomain] = useState(existing?.domain ?? '');
  const [industry, setIndustry] = useState(existing?.industry ?? '');
  const [tier, setTier] = useState(existing?.tier ?? 2);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const original = id ? data.offices.filter((o) => o.company_id === id) : [];
  const [offices, setOffices] = useState<DraftOffice[]>(original);
  const [query, setQuery] = useState('');
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locate = async () => {
    setError(null);
    setBusy(true);
    try {
      const hit = await geocode(query);
      if (!hit) return setError(`Couldn't find "${query}". Try "City, State".`);
      const [city = '', region = ''] = query.split(',').map((s) => s.trim());
      setOffices((o) => [...o, { label: label.trim() || city || query, city, region, country: 'US', lat: hit.lat, lng: hit.lng, is_hq: o.length === 0 }]);
      setQuery('');
      setLabel('');
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!name.trim()) return setError('Company name is required.');
    setBusy(true);
    setError(null);
    try {
      const companyId = await repo.save('companies', {
        id,
        created_at: existing?.created_at,
        name: name.trim(),
        domain: domain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, ''),
        logo_url: existing?.logo_url ?? '',
        industry: industry.trim(),
        tier,
        notes,
      });
      for (const o of offices) await repo.save('offices', { ...o, company_id: companyId });
      for (const o of original) if (!offices.some((d) => d.id === o.id)) await repo.remove('offices', o.id);
      onSaved?.(companyId);
      onClose();
    } catch (e) {
      setError(errMsg(e));
      setBusy(false);
    }
  };

  return (
    <Modal
      title={existing ? `Edit ${existing.name}` : 'Add company'}
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
      <Field label="Name">
        <input autoFocus className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="CrowdStrike" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Website domain" hint="Used later to match Gmail senders">
          <input className={inputCls} value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="crowdstrike.com" />
        </Field>
        <Field label="Industry">
          <input className={inputCls} value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Cybersecurity" />
        </Field>
      </div>
      <Field label="Tier (how much you want it)">
        <select className={inputCls} value={tier} onChange={(e) => setTier(Number(e.target.value))}>
          <option value={1}>1 · Dream target</option>
          <option value={2}>2 · Strong fit</option>
          <option value={3}>3 · Worth a shot</option>
        </select>
      </Field>

      <div>
        <div className="mb-1 text-[12px] font-medium text-muted">Offices</div>
        {offices.length === 0 && <p className="mb-2 text-[12px] text-faint">Add at least one office so roles can sit on the map.</p>}
        <ul className="mb-2 space-y-1">
          {offices.map((o, i) => (
            <li key={o.id ?? `new-${i}`} className="flex items-center justify-between rounded-md border border-line bg-panel-2 px-2.5 py-1.5 text-[13px]">
              <span>
                {o.label}
                {o.is_hq && <span className="ml-1.5 text-[10px] uppercase text-faint">HQ</span>}
                <span className="tnum ml-2 text-[11px] text-faint">
                  {o.lat.toFixed(3)}, {o.lng.toFixed(3)}
                </span>
              </span>
              <button onClick={() => setOffices(offices.filter((_, j) => j !== i))} className="text-[12px] text-muted hover:text-danger">
                Remove
              </button>
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <input className={inputCls} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="City, State (e.g. Austin, TX)" aria-label="Office location" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), void locate())} />
          <input className={inputCls} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (optional)" aria-label="Office label" />
          <Button onClick={locate} disabled={busy || !query.trim()}>
            Locate
          </Button>
        </div>
      </div>
      <Field label="Notes">
        <textarea className={`${inputCls} min-h-[64px]`} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <FormError error={error} />
    </Modal>
  );
}
