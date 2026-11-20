import { useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Database,
  Download,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import audit from './data/audit.json';
import type { Feed } from './domain';
import { formatDate } from './domain';

export default function Evidence({ data }: { data: Feed | null }) {
  const [health, setHealth] = useState<any>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [showAll, setShowAll] = useState(false);
  async function refresh() {
    setBusy(true);
    try {
      const r = await fetch('/api/status', {
        signal: AbortSignal.timeout(18000),
      });
      if (!r.ok) throw Error('Unavailable');
      setHealth(await r.json());
      setError('');
    } catch {
      setError(
        'Live collection status is unavailable. The saved job board remains accessible.',
      );
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    refresh();
  }, []);
  const stale = data && Date.now() - Date.parse(data.updatedAt) > 36 * 3600000;
  const flagged = audit.rows.filter((row) => row.joint_verdict !== 'correct');
  const rows = showAll ? audit.rows : flagged;
  return (
    <section className="evidence-view">
      <div className="page-title">
        <div>
          <span className="section-kicker">
            A WORKING PRODUCT SHOULD SHOW ITS WORK
          </span>
          <h1>
            Evidence, not guesswork<span>.</span>
          </h1>
          <p>
            Where the opportunities come from, what we checked, and what still
            needs work.
          </p>
        </div>
        <span className="outline-pill">
          <ShieldCheck size={14} />
          Open about our limits
        </span>
      </div>
      <div className="proof-banner">
        <Activity size={22} />
        <div>
          <strong>
            {stale
              ? 'The collection snapshot is overdue'
              : 'A real dataset. A traceable pipeline.'}
          </strong>
          <p>
            {data
              ? data.jobs.length +
                ' active listings · ' +
                data.collected +
                ' source rows collected · ' +
                data.duplicatesRemoved +
                ' duplicates removed'
              : 'Loading the latest dataset…'}
          </p>
        </div>
        <button className="secondary-button" disabled={busy} onClick={refresh}>
          <RefreshCw size={14} className={busy ? 'spin' : ''} />
          {busy ? 'Checking…' : 'Check status'}
        </button>
      </div>
      <div className="proof-grid">
        <article className="proof-card">
          <span className="small-label">LAST SUCCESSFUL COLLECTION</span>
          <h3>
            {data ? formatDate(data.updatedAt, true) + ' IST' : 'Loading…'}
          </h3>
          <p>Collection time, not the date every employer published a job.</p>
          <div className="proof-status">
            <span className={stale ? 'status-dot amber' : 'status-dot'} />
            {stale ? 'Over 36 hours old' : 'Snapshot within freshness window'}
          </div>
        </article>
        <article className="proof-card">
          <span className="small-label">DURABLE STORAGE</span>
          <h3>
            <Database size={19} />
            {health?.storage === 'connected'
              ? 'R2 connected'
              : busy
                ? 'Checking…'
                : 'Status unavailable'}
          </h3>
          <p>
            Run <code>{health?.runId?.slice(0, 16) || '—'}</code>
          </p>
          <div className="proof-status">
            {health?.lastAttempt?.status === 'success' ? (
              <CheckCircle2 size={13} />
            ) : (
              <Activity size={13} />
            )}
            Last recorded attempt:{' '}
            {health?.lastAttempt?.status || 'not available'}
          </div>
        </article>
        <article className="proof-card">
          <span className="small-label">DAILY REFRESH</span>
          <h3>
            7:00 AM <span>IST</span>
          </h3>
          <p>
            A scheduled cloud task collects and LLM-tags new or changed records.
          </p>
          <div className="proof-status muted">
            Schedule configured; execution history is not exposed here.
          </div>
        </article>
      </div>
      {error && (
        <div className="error-banner" role="alert">
          {error}
          <button onClick={refresh}>Retry</button>
        </div>
      )}
      {health?.lastAttempt?.status === 'failed' && (
        <div className="review-notice">
          <TriangleAlert size={16} />
          The latest collection attempt failed. The last successful snapshot was
          preserved.
        </div>
      )}
      <section className="proof-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">FROM SOURCE TO SHORTLIST</span>
            <h2>The path every post takes</h2>
          </div>
        </div>
        <div className="pipeline-flow">
          {[
            ['01', 'Public sources', 'Unstop API + Internshala HTML'],
            ['02', 'Collect & stage', 'Open posts, source IDs, deadlines'],
            ['03', 'LLM annotation', 'Role + normalized city tags'],
            ['04', 'Publication gate', 'Complete tags, duplicates, 200+'],
            ['05', 'Saved snapshot', 'Conditional write to Cloudflare R2'],
            ['06', 'Your board', 'Vercel API + searchable UI'],
          ].map(([n, title, detail], i) => (
            <div className="flow-cell" key={n}>
              <span>{n}</span>
              <strong>{title}</strong>
              <small>{detail}</small>
              {i < 5 && <ArrowRight size={14} />}
            </div>
          ))}
        </div>
        <div className="safety-row">
          <span>
            <CheckCircle2 size={14} />
            Failed refresh keeps last good data
          </span>
          <span>
            <ShieldCheck size={14} />
            Authenticated maintenance writes
          </span>
          <span>
            <Database size={14} />
            Concurrent updates use ETag checks
          </span>
        </div>
      </section>
      <section className="proof-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">QUALITY YOU CAN INSPECT</span>
            <h2>The 50-post audit</h2>
            <p>
              Baseline before corrections · {audit.date} · AI self-review, not
              independent human validation.
            </p>
          </div>
          <a href="./tagging-audit.csv" download className="secondary-button">
            <Download size={14} />
            All 50 rows
          </a>
        </div>
        <div className="audit-metrics">
          {[
            ['96%', 'Role tags', '48 correct · 1 wrong · 1 ambiguous'],
            [
              '94%',
              'City/location tags',
              '47 correct · 1 incomplete · 2 ambiguous',
            ],
            [
              '90%',
              'Both fields together',
              '45 correct · 2 wrong · 3 ambiguous',
            ],
          ].map(([value, label, detail]) => (
            <article key={label}>
              <strong>{value}</strong>
              <h3>{label}</h3>
              <p>{detail}</p>
            </article>
          ))}
        </div>
        <p className="audit-caveat">
          Ambiguous cases stay in the denominator and do not count as correct.
          This small self-audit is not a production accuracy guarantee.
        </p>
        <div className="review-summary">
          <CheckCircle2 size={17} />
          <p>
            <strong>
              {data?.quality?.corrected || 0} corrections currently apply
            </strong>{' '}
            to matching source versions.{' '}
            <strong>
              {data?.quality?.needs_review || 0} listings need review.
            </strong>{' '}
            If source text changes, the old review is invalidated automatically.
          </p>
        </div>
        <div className="audit-table-wrap">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Post / company</th>
                <th>Published baseline</th>
                <th>Review decision</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.title}</strong>
                    <small>{row.company}</small>
                  </td>
                  <td>
                    {row.published_role}
                    <small>{row.published_locations.join(', ')}</small>
                  </td>
                  <td>
                    <span className={'verdict ' + row.joint_verdict}>
                      {row.joint_verdict === 'wrong'
                        ? 'Correction needed'
                        : row.joint_verdict === 'ambiguous'
                          ? 'Ambiguous'
                          : 'Consistent'}
                    </span>
                    <p>{row.review_note}</p>
                  </td>
                  <td>
                    <a
                      href={row.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={'Open source for ' + row.company}
                    >
                      <ExternalLink size={15} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="text-button" onClick={() => setShowAll(!showAll)}>
          {showAll
            ? 'Show the five error/ambiguous cases'
            : 'Inspect all 50 reviewed posts'}
          <ChevronDown size={14} />
        </button>
      </section>
      <div className="proof-grid two">
        <article className="proof-card cost-card">
          <span className="small-label">COST, WITHOUT A MADE-UP NUMBER</span>
          <h3>Actual cost: unmetered</h3>
          <p>
            Cost-estimate model: GPT-5.6 Luna. The scheduled task performs
            LLM-powered tagging. Billable tokens, retries and task charges are
            not metered in this implementation.
          </p>
          <div className="cost-example">
            <strong>~$0.10 / 1,000</strong>
            <span>
              Illustrative visible-text API token subtotal only. Not measured
              spend, not all-in cost.
            </span>
          </div>
          <a
            className="text-button"
            href="https://developers.openai.com/api/docs/models/gpt-5.6-luna"
            target="_blank"
            rel="noopener noreferrer"
          >
            GPT-5.6 Luna pricing reference
            <ArrowUpRight size={13} />
          </a>
        </article>
        <article className="proof-card">
          <span className="small-label">WHY THE REVIEW LAYER MATTERS</span>
          <h3>A correction needs an expiry, too.</h3>
          <p>
            Each audit decision is bound to a SHA-256 fingerprint of the title,
            company, location, work mode and description. A changed listing gets
            its source tags back and a re-review notice.
          </p>
          <p>
            Corrections are a transparent read-time layer. The original source
            metadata remains available in every detail view.
          </p>
          <a
            className="text-button"
            href="https://github.com/PrateekSingh070/firststep-india"
            target="_blank"
            rel="noopener noreferrer"
          >
            Architecture & source code
            <ArrowUpRight size={13} />
          </a>
          <small className="muted">
            Public source code and technical documentation.
          </small>
        </article>
      </div>
    </section>
  );
}
