import {
  useEffect,
  useMemo,
  useRef,
  useState,
  lazy,
  Suspense,
  type ReactNode,
} from 'react';
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  GitCompareArrows,
  LayoutDashboard,
  MapPin,
  Menu,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Target,
  TriangleAlert,
  X,
} from 'lucide-react';
const Evidence = lazy(() => import('./Evidence'));
import {
  daysToDeadline,
  exportJobs,
  formatDate,
  hasStipend,
  matchesQuery,
  modeLabels,
  parseSkills,
  roles,
  skillMatches,
  stageLabels,
  stages,
  workMode,
  type Application,
  type Feed,
  type Job,
  type Stage,
} from './domain';

type View = 'discover' | 'saved' | 'tracker' | 'evidence';
type Filters = {
  q: string;
  role: string;
  city: string;
  source: string;
  mode: string;
  paid: boolean;
  review: boolean;
};
const emptyFilters: Filters = {
  q: '',
  role: '',
  city: '',
  source: '',
  mode: '',
  paid: false,
  review: false,
};
function initialFilters(): Filters {
  const p = new URLSearchParams(location.search);
  return {
    ...emptyFilters,
    q: p.get('q') || '',
    role: p.get('role') || '',
    city: p.get('city') || '',
    source: p.get('source') || '',
    mode: p.get('mode') || '',
    paid: p.get('paid') === '1',
    review: p.get('review') === '1',
  };
}
function readStore<T>(
  key: string,
  fallback: T,
  valid: (value: any) => boolean,
): T {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    return valid(value) ? value : fallback;
  } catch {
    return fallback;
  }
}
function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current
      ?.querySelector<HTMLElement>('button,a[href],input,select,textarea')
      ?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab') return;
      const controls = ref.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled),a[href],input,select,textarea,[tabindex="0"]',
      );
      if (!controls?.length) return;
      const first = controls[0],
        last = controls[controls.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', key);
      previous?.focus();
    };
  }, []);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <section
        ref={ref}
        className={'modal v2-modal ' + (wide ? 'wide' : '')}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="modal-close"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={21} />
        </button>
        {children}
      </section>
    </div>
  );
}
function ReviewBadge({ job }: { job: Job }) {
  if (!job.tagReview) return null;
  const { status } = job.tagReview;
  return (
    <span className={'review-badge ' + status} title={job.tagReview.note}>
      {status === 'needs_review' || status === 'changed' ? (
        <TriangleAlert size={11} />
      ) : (
        <CheckCircle2 size={11} />
      )}
      {
        {
          reviewed: 'Self-reviewed',
          corrected: 'Tag corrected',
          needs_review: 'Needs review',
          changed: 'Source changed',
        }[status]
      }
    </span>
  );
}

export default function App() {
  const [data, setData] = useState<Feed | null>(null),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>(() => {
    const v = new URLSearchParams(location.search).get('view');
    return ['saved', 'tracker', 'evidence'].includes(v || '')
      ? (v as View)
      : 'discover';
  });
  const [filters, setFilters] = useState<Filters>(initialFilters),
    [sort, setSort] = useState('recent'),
    [limit, setLimit] = useState(18),
    [mobile, setMobile] = useState(false);
  const [saved, setSaved] = useState<string[]>(() =>
    readStore(
      'firststep-saved',
      [],
      (v) => Array.isArray(v) && v.every((x) => typeof x === 'string'),
    ),
  );
  const [skillsText, setSkillsText] = useState<string>(() =>
    readStore('firststep-skills', '', (v) => typeof v === 'string'),
  );
  const [onlyMatches, setOnlyMatches] = useState(false),
    [applications, setApplications] = useState<Record<string, Application>>(
      () =>
        readStore(
          'firststep-applications',
          {},
          (v) =>
            v &&
            typeof v === 'object' &&
            !Array.isArray(v) &&
            Object.values(v).every(
              (a: any) =>
                a &&
                stages.includes(a.stage) &&
                a.job?.id &&
                typeof a.notes === 'string' &&
                typeof a.nextAction === 'string',
            ),
        ),
    );
  const [selected, setSelected] = useState<Job | null>(null),
    [comparison, setComparison] = useState<string[]>([]),
    [showCompare, setShowCompare] = useState(false),
    [notice, setNotice] = useState(''),
    [storageWarning, setStorageWarning] = useState(false);
  async function load() {
    setLoading(true);
    try {
      const response = await fetch('/api/jobs', {
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok) throw Error('Feed error');
      const result = await response.json();
      if (!Array.isArray(result.jobs)) throw Error('Invalid feed');
      setData(result);
      setError('');
    } catch {
      setError(
        'Could not load the latest feed. Your current snapshot is preserved.',
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('firststep-saved', JSON.stringify(saved));
      localStorage.setItem('firststep-skills', JSON.stringify(skillsText));
      localStorage.setItem(
        'firststep-applications',
        JSON.stringify(applications),
      );
    } catch {
      setStorageWarning(true);
    }
  }, [saved, skillsText, applications]);
  useEffect(() => {
    const p = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value) p.set(key, typeof value === 'boolean' ? '1' : value);
    }
    if (view !== 'discover') p.set('view', view);
    history.replaceState(
      null,
      '',
      location.pathname + (p.toString() ? '?' + p : ''),
    );
    setLimit(18);
  }, [filters, view, onlyMatches]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!mobile) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const close = (event: KeyboardEvent) => {if (event.key === 'Escape') setMobile(false);};
    document.addEventListener('keydown', close);
    return () => {document.body.style.overflow = previous;document.removeEventListener('keydown', close);};
  }, [mobile]);
  const skills = useMemo(() => parseSkills(skillsText), [skillsText]);
  const jobs = data?.jobs || [];
  const cities = useMemo(
    () =>
      [...new Set(jobs.flatMap((j: Job) => j.cities))]
        .filter((c) => c !== 'Remote')
        .sort(),
    [data],
  );
  const matchMap = useMemo(
    () => Object.fromEntries(jobs.map((j) => [j.id, skillMatches(j, skills)])),
    [data, skillsText],
  );
  const filtered = useMemo(
    () =>
      jobs
        .filter(
          (j) =>
            (view !== 'saved' || saved.includes(j.id)) &&
            matchesQuery(j, filters.q) &&
            (!filters.role || j.role === filters.role) &&
            (!filters.city || j.cities.includes(filters.city)) &&
            (!filters.source || j.source === filters.source) &&
            (!filters.mode || workMode(j) === filters.mode) &&
            (!filters.paid || hasStipend(j)) &&
            (!filters.review ||
              j.tagReview?.status === 'needs_review' ||
              j.tagReview?.status === 'changed') &&
            (!onlyMatches || !skills.length || matchMap[j.id]?.length),
        )
        .sort((a, b) =>
          sort === 'matches'
            ? (matchMap[b.id]?.length || 0) - (matchMap[a.id]?.length || 0)
            : sort === 'company'
              ? a.company.localeCompare(b.company)
              : sort === 'deadline'
                ? (Date.parse(a.deadline || '') || Infinity) -
                  (Date.parse(b.deadline || '') || Infinity)
                : Date.parse(b.postedAt || b.collectedAt) -
                  Date.parse(a.postedAt || a.collectedAt),
        ),
    [data, filters, view, saved, onlyMatches, skillsText, sort, matchMap],
  );
  const selectedMatches = selected ? skillMatches(selected, skills) : [];
  const comparisonJobs = comparison
    .map((id) => jobs.find((j: Job) => j.id === id))
    .filter(Boolean) as Job[];
  const tracked = Object.entries(applications).map(([id, record]) => ({
    id,
    ...record,
    job: jobs.find((j: Job) => j.id === id) || record.job,
  }));
  const activeFilters = Object.values(filters).some(Boolean) || onlyMatches;
  const stale =
    !!data && Date.now() - Date.parse(data.updatedAt) > 36 * 3600000;
  const counts = Object.fromEntries(
    roles.map((r) => [r, jobs.filter((j: Job) => j.role === r).length]),
  );
  const appliedCount = tracked.filter(
    (t) => t.stage !== 'shortlisted' && t.stage !== 'closed',
  ).length;
  function updateFilters(patch: Partial<Filters>) {
    setFilters((current) => ({ ...current, ...patch }));
  }
  function reset() {
    setFilters(emptyFilters);
    setOnlyMatches(false);
  }
  function toggleSaved(id: string) {
    setSaved((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  }
  function track(job: Job, stage: Stage = 'shortlisted') {
    setApplications((current) => ({
      ...current,
      [job.id]: {
        stage,
        notes: current[job.id]?.notes || '',
        nextAction: current[job.id]?.nextAction || '',
        updatedAt: new Date().toISOString(),
        job,
      },
    }));
    setNotice('Application moved to ' + stageLabels[stage]);
  }
  function updateApplication(job: Job, patch: Partial<Application>) {
    setApplications((current) => ({
      ...current,
      [job.id]: {
        ...(current[job.id] || {
          stage: 'shortlisted' as Stage,
          notes: '',
          nextAction: '',
        }),
        ...patch,
        updatedAt: new Date().toISOString(),
        job,
      },
    }));
  }
  function toggleCompare(id: string) {
    setComparison((current) =>
      current.includes(id)
        ? current.filter((x) => x !== id)
        : current.length < 3
          ? [...current, id]
          : current,
    );
  }
  async function share() {
    try {
      await navigator.clipboard.writeText(location.href);
      setNotice('This filtered view is copied.');
    } catch {
      setNotice('Copy this view from your browser address bar.');
    }
  }
  function download() {
    const content = exportJobs(
      view === 'tracker' ? tracked.map((t) => t.job) : filtered,
      applications,
    );
    const href = URL.createObjectURL(
      new Blob([content], { type: 'text/csv;charset=utf-8;' }),
    );
    const a = document.createElement('a');
    a.href = href;
    a.download =
      'firststep-' +
      (view === 'tracker' ? 'applications' : 'opportunities') +
      '.csv';
    a.click();
    URL.revokeObjectURL(href);
  }
  function removeApplication(id: string) {
    setApplications((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setSelected(null);
    setNotice('Removed from tracker.');
  }
  const closeModal = () => {
    setSelected(null);
    setShowCompare(false);
  };
  return (
    <div className="shell v2">
      <header className="topbar">
        <a href="./" className="brand" aria-label="FirstStep home">
          <span className="brand-icon">
            f<span>↗</span>
          </span>
          firststep<span className="brand-dot">.</span>
        </a>
        <nav aria-label="Main navigation">
          {(
            [
              ['discover', 'Discover'],
              ['tracker', 'Applications'],
              ['evidence', 'Evidence'],
            ] as [View, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              className={'nav-link ' + (view === id ? 'active' : '')}
              onClick={() => {
                setView(id);
                setMobile(false);
              }}
            >
              {label}
              {id === 'tracker' && (
                <span className="nav-count">{tracked.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="top-status">
          <span className={stale ? 'status-dot amber' : 'status-dot'} />
          {data
            ? 'Collected ' + formatDate(data.updatedAt, true) + ' IST'
            : 'Connecting to the feed'}
        </div>
        <button
          className="menu-icon"
          aria-label="Open filters"
          aria-expanded={mobile}
          aria-controls="workspace-sidebar"
          onClick={() => setMobile(!mobile)}
        >
          <Menu size={21} />
        </button>
      </header>
      <div className="app-layout">
        {mobile && <button className="sidebar-backdrop" aria-label="Dismiss filters" onClick={() => setMobile(false)} />}
        <aside id="workspace-sidebar" className={'sidebar ' + (mobile ? 'open' : '')} onClick={(event) => {if ((event.target as HTMLElement).closest('button')) setMobile(false);}}>
          <div className="sidebar-head">
            YOUR CAREER WORKSPACE
            <button
              className="close-mobile"
              onClick={() => setMobile(false)}
              aria-label="Close filters"
            >
              <X size={18} />
            </button>
          </div>
          <button
            className={
              'side-all ' +
              (view === 'discover' && !filters.role ? 'chosen' : '')
            }
            onClick={() => {
              setView('discover');
              updateFilters({ role: '' });
            }}
          >
            <LayoutDashboard size={17} />
            All opportunities<span>{jobs.length || '—'}</span>
          </button>
          <button
            className={'side-save ' + (view === 'saved' ? 'chosen' : '')}
            onClick={() => setView('saved')}
          >
            <Bookmark size={16} />
            Saved for later<span>{saved.length}</span>
          </button>
          <button
            className={'side-save ' + (view === 'tracker' ? 'chosen' : '')}
            onClick={() => setView('tracker')}
          >
            <Target size={16} />
            My applications<span>{tracked.length}</span>
          </button>
          <div className="side-title">
            EXPLORE BY ROLE <Sparkles size={12} />
          </div>
          <div className="role-list">
            {roles.map((r, i) => (
              <button
                key={r}
                className={
                  'role-button ' + (filters.role === r ? 'selected' : '')
                }
                onClick={() => {
                  updateFilters({ role: filters.role === r ? '' : r });
                  setView('discover');
                  setMobile(false);
                }}
              >
                <span className={'role-dot dot-' + i} />
                {r}
                <span className="role-count">{counts[r] || 0}</span>
              </button>
            ))}
          </div>
          <div className="skills-box">
            <div>
              <Target size={15} />
              <strong>Find your overlap</strong>
            </div>
            <label htmlFor="skills">Your skills, separated by commas</label>
            <textarea
              id="skills"
              aria-label="Your skills"
              rows={2}
              maxLength={500}
              placeholder="Python, SQL, React…"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
            />
            {skills.length ? (
              <p>{skills.length} skills · Matches use terms in the listing.</p>
            ) : (
              <p>Add a few skills to see why a role could fit.</p>
            )}
            <small>Stored on this device.</small>
          </div>
          <button className="side-proof" onClick={() => setView('evidence')}>
            <Activity size={15} />
            <span>
              See the evidence<small>Sources, audit & refresh status</small>
            </span>
            <ArrowUpRight size={14} />
          </button>
        </aside>
        <main>
          {view === 'evidence' ? (
            <Suspense
              fallback={
                <div className="empty">Loading the evidence dashboard…</div>
              }
            >
              <Evidence data={data} />
            </Suspense>
          ) : view === 'tracker' ? (
            <section className="tracker-view">
              <div className="page-title">
                <div>
                  <span className="section-kicker">
                    TURN A SHORTLIST INTO A NEXT STEP
                  </span>
                  <h1>
                    Your applications<span>.</span>
                  </h1>
                  <p>
                    Keep the details, plan a follow-up, and see what’s moving.
                  </p>
                </div>
                <button
                  className="secondary-button"
                  onClick={download}
                  disabled={!tracked.length}
                >
                  <ArrowDownToLine size={14} />
                  Export tracker
                </button>
              </div>
              <div className="tracker-overview">
                <div>
                  <strong>{tracked.length}</strong>
                  <span>tracked opportunities</span>
                </div>
                <div>
                  <strong>{appliedCount}</strong>
                  <span>active applications</span>
                </div>
                <div>
                  <strong>
                    {tracked.filter((t) => t.stage === 'interview').length}
                  </strong>
                  <span>interviews</span>
                </div>
                <p>
                  <Bookmark size={15} />
                  Private to this browser. Export a copy to keep your own
                  backup.
                </p>
              </div>
              {!tracked.length ? (
                <div className="empty">
                  <Target size={32} />
                  <h3>Your next step belongs here.</h3>
                  <p>
                    Open any opportunity and choose Track application. Only mark
                    it Applied after you apply.
                  </p>
                  <button onClick={() => setView('discover')}>
                    Find an opportunity
                    <ArrowRight size={15} />
                  </button>
                </div>
              ) : (
                <div className="kanban">
                  {stages.map((stage) => (
                    <section
                      className={'kanban-column stage-' + stage}
                      key={stage}
                    >
                      <h2>
                        <span />
                        {stageLabels[stage]}
                        <b>{tracked.filter((t) => t.stage === stage).length}</b>
                      </h2>
                      {tracked
                        .filter((t) => t.stage === stage)
                        .map((t) => (
                          <article className="tracker-card" key={t.id}>
                            <button
                              className="tracker-title"
                              onClick={() => setSelected(t.job)}
                            >
                              {t.job.title}
                            </button>
                            <span>{t.job.company}</span>
                            <small>
                              <MapPin size={11} />
                              {t.job.cities.join(', ')}
                            </small>
                            {data && !jobs.some((j: Job) => j.id === t.id) && (
                              <p className="archived-label">
                                No longer in the active feed
                              </p>
                            )}
                            {t.nextAction && (
                              <p className="next-action">
                                Follow up: {formatDate(t.nextAction)}
                              </p>
                            )}
                            {t.notes && (
                              <p className="tracker-note">
                                {t.notes.slice(0, 100)}
                                {t.notes.length > 100 ? '…' : ''}
                              </p>
                            )}
                            <select
                              aria-label={'Stage for ' + t.job.title}
                              value={t.stage}
                              onChange={(e) =>
                                track(t.job, e.target.value as Stage)
                              }
                            >
                              {stages.map((s) => (
                                <option key={s} value={s}>
                                  {stageLabels[s]}
                                </option>
                              ))}
                            </select>
                          </article>
                        ))}
                      {!tracked.some((t) => t.stage === stage) && (
                        <p className="column-empty">Room for your next step.</p>
                      )}
                    </section>
                  ))}
                </div>
              )}
            </section>
          ) : (
            <>
              <section className="hero v2-hero">
                <div className="hero-copy">
                  <div className="eyebrow">
                    <span /> YOUR FIRST ROLE. A CLEARER PATH.
                  </div>
                  <h1>
                    Less scrolling.
                    <br />
                    <em>More direction.</em>
                    <span className="hero-star">✳</span>
                  </h1>
                  <p>
                    Find real internships, see why they fit,
                    <br />
                    and turn a promising post into your next move.
                  </p>
                  <div className="hero-meta">
                    <span>
                      <Check size={13} />
                      Original source links
                    </span>
                    <span>
                      <Target size={13} />
                      Explainable matches
                    </span>
                    <span>
                      <Activity size={13} />A visible quality audit
                    </span>
                  </div>
                </div>
                <div className="path-art" aria-hidden="true">
                  <div className="path-orbit" />
                  <div className="path-float">
                    A little clarity goes a long way <Sparkles size={13} />
                  </div>
                  <div className="path-step">
                    <Search size={17} />
                    <span>Find your fit</span>
                    <b>01</b>
                  </div>
                  <div className="path-step second">
                    <Bookmark size={17} />
                    <span>Make your move</span>
                    <b>02</b>
                  </div>
                  <div className="path-step third">
                    <ArrowUpRight size={24} />
                    <span>Own your next step</span>
                    <b>03</b>
                  </div>
                </div>
              </section>
              <section className="stats-strip">
                <div>
                  <strong>{jobs.length || '—'}</strong>
                  <span>open opportunities</span>
                </div>
                <span className="stat-separator" />
                <div>
                  <strong>2</strong>
                  <span>public sources</span>
                </div>
                <span className="stat-separator" />
                <button
                  className="audit-stat"
                  onClick={() => setView('evidence')}
                >
                  <strong>50</strong>
                  <span>
                    posts in the self-audit
                    <ArrowUpRight size={11} />
                  </span>
                </button>
                <div className="updated">
                  <span className={stale ? 'status-dot amber' : 'status-dot'} />
                  <span>
                    {stale ? 'Collection overdue' : 'Last collected'}
                    <b>
                      {data
                        ? formatDate(data.updatedAt, true) + ' IST'
                        : 'Loading…'}
                    </b>
                  </span>
                </div>
              </section>
              <section className="browse">
                <div className="browse-heading">
                  <div>
                    <span className="section-kicker">
                      {view === 'saved'
                        ? 'KEEP THE POSSIBILITIES CLOSE'
                        : 'A LITTLE EXPLORING GOES A LONG WAY'}
                    </span>
                    <h2>
                      {view === 'saved'
                        ? 'Your shortlist'
                        : filters.role || 'Find your next opportunity'}
                      <span className="heading-dot">.</span>
                    </h2>
                  </div>
                  <div className="browse-actions">
                    <button
                      title="Copy this filtered view"
                      aria-label="Copy filtered view"
                      onClick={share}
                    >
                      <Copy size={15} />
                    </button>
                    <button
                      title="Export these results"
                      aria-label="Export results"
                      onClick={download}
                      disabled={!filtered.length}
                    >
                      <ArrowDownToLine size={16} />
                    </button>
                  </div>
                </div>
                <div className="searchbar">
                  <Search size={19} />
                  <input
                    aria-label="Search jobs"
                  maxLength={250}
                    value={filters.q}
                    onChange={(e) => updateFilters({ q: e.target.value })}
                    placeholder="Search roles, companies, or skills…"
                  />
                  <div className="search-divider" />
                  <MapPin size={17} />
                  <select
                    aria-label="Filter by city"
                    value={filters.city}
                    onChange={(e) => updateFilters({ city: e.target.value })}
                  >
                    <option value="">Any city in India</option>
                    {cities.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  <button
                    className="search-button"
                    aria-label="Explore results"
                    onClick={() =>
                      document
                        .getElementById('results')
                        ?.scrollIntoView({ behavior: 'smooth' })
                    }
                  >
                    Explore
                    <ArrowRight size={16} />
                  </button>
                </div>
                <div className="filter-row">
                  <div className="filter-left">
                    <button
                      className="mobile-filter"
                      onClick={() => setMobile(true)}
                    >
                      <SlidersHorizontal size={13} />
                      Roles
                    </button>
                    <select
                      aria-label="Filter by source"
                      value={filters.source}
                      onChange={(e) =>
                        updateFilters({ source: e.target.value })
                      }
                    >
                      <option value="">All sources</option>
                      <option>Unstop</option>
                      <option>Internshala</option>
                    </select>
                    <select
                      aria-label="Filter by arrangement"
                      value={filters.mode}
                      onChange={(e) => updateFilters({ mode: e.target.value })}
                    >
                      <option value="">Any arrangement</option>
                      <option value="remote">Fully remote</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="office">In office</option>
                      <option value="field">Field work</option>
                      <option value="mixed">Remote + local visits</option>
                      <option value="unknown">Confirm arrangement</option>
                    </select>
                    <button
                      className={
                        'filter-chip ' + (filters.paid ? 'chip-active' : '')
                      }
                      aria-pressed={filters.paid}
                      onClick={() => updateFilters({ paid: !filters.paid })}
                    >
                      Stipend disclosed
                    </button>
                    <button
                      className={
                        'filter-chip ' + (filters.review ? 'chip-active' : '')
                      }
                      aria-pressed={filters.review}
                      onClick={() => updateFilters({ review: !filters.review })}
                    >
                      Needs review
                    </button>
                    {activeFilters && (
                      <button className="clear" onClick={reset}>
                        Reset
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
                {skills.length > 0 && (
                  <div className="matching-bar">
                    <Target size={16} />
                    <p>
                      <strong>Your skills, visible in the listing.</strong>{' '}
                      Matching terms: {skills.join(', ')}.
                    </p>
                    <button
                      className={onlyMatches ? 'active' : ''}
                      aria-pressed={onlyMatches}
                      onClick={() => {
                        setOnlyMatches(!onlyMatches);
                        setSort('matches');
                      }}
                    >
                      {onlyMatches
                        ? 'Showing skill matches'
                        : 'Show skill matches'}
                      <ArrowRight size={13} />
                    </button>
                  </div>
                )}
                {error && (
                  <div className="error-banner" role="alert">
                    <span>{error}</span>
                    <button onClick={load}>Retry</button>
                  </div>
                )}
                <div className="results-header" id="results">
                  <span>
                    <strong>{filtered.length}</strong>{' '}
                    {view === 'saved' ? 'saved opportunities' : 'opportunities'}
                    {loading && data ? ' · checking for updates' : ''}
                  </span>
                  <label>
                    Sort by
                    <select
                      aria-label="Sort opportunities"
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                    >
                      <option value="recent">Newest source activity</option>
                      <option value="deadline">Closing soon</option>
                      <option value="company">Company A–Z</option>
                      <option value="matches" disabled={!skills.length}>
                        Skill overlap
                      </option>
                    </select>
                  </label>
                </div>
                <div className="job-grid">
                  {!data && loading
                    ? Array.from({ length: 6 }, (_, i) => (
                        <div className="job-card skeleton" key={i}>
                          <div />
                          <div />
                          <div />
                        </div>
                      ))
                    : filtered.slice(0, limit).map((job) => {
                        const matched = matchMap[job.id] || [],
                          deadline = daysToDeadline(job);
                        return (
                          <article
                            className="job-card v2-job-card"
                            key={job.id}
                          >
                            <div className="card-top">
                              <div
                                className={
                                  'company-avatar avatar-' +
                                  (job.company.charCodeAt(0) % 6)
                                }
                              >
                                {job.company
                                  .split(/\s+/)
                                  .slice(0, 2)
                                  .map((s) => s[0])
                                  .join('')
                                  .toUpperCase()}
                              </div>
                              <span className="company-name">
                                {job.company}
                              </span>
                              <button
                                className={
                                  'save-button ' +
                                  (saved.includes(job.id) ? 'is-saved' : '')
                                }
                                aria-label={
                                  (saved.includes(job.id)
                                    ? 'Unsave '
                                    : 'Save ') + job.title
                                }
                                aria-pressed={saved.includes(job.id)}
                                onClick={() => toggleSaved(job.id)}
                              >
                                <Bookmark
                                  size={17}
                                  fill={
                                    saved.includes(job.id)
                                      ? 'currentColor'
                                      : 'none'
                                  }
                                />
                              </button>
                            </div>
                            <button
                              className="job-title"
                              onClick={() => setSelected(job)}
                            >
                              {job.title}
                            </button>
                            <div className="job-location">
                              <MapPin size={12} />
                              {job.cities.join(', ')}
                            </div>
                            <div className="job-tags">
                              <span className="kind-tag">{job.role}</span>
                              <span className="role-tag">
                                {modeLabels[workMode(job)]}
                              </span>
                            </div>
                            <ReviewBadge job={job} />
                            {matched.length > 0 && (
                              <button
                                className="match-reason"
                                onClick={() => setSelected(job)}
                              >
                                <Target size={12} />
                                {matched.length} skill{' '}
                                {matched.length === 1 ? 'match' : 'matches'}:{' '}
                                {matched.slice(0, 3).join(', ')}
                                <ArrowUpRight size={11} />
                              </button>
                            )}
                            <div className="salary">
                              <span>
                                {job.salary === 'Not disclosed'
                                  ? 'Stipend not disclosed'
                                  : job.salary}
                              </span>
                              {deadline !== null && deadline <= 7 ? (
                                <span className="deadline-badge">
                                  {deadline <= 1
                                    ? 'Closes soon'
                                    : deadline + ' days left'}
                                </span>
                              ) : (
                                <span className="experience">Early career</span>
                              )}
                            </div>
                            <div className="card-footer">
                              <span className="source-name">
                                <span
                                  className={
                                    'source-dot ' +
                                    (job.source === 'Unstop'
                                      ? 'blue'
                                      : 'orange')
                                  }
                                />
                                {job.source}
                              </span>
                              <button
                                className="card-view"
                                onClick={() => setSelected(job)}
                              >
                                View details
                                <ArrowUpRight size={13} />
                              </button>
                            </div>
                            <div className="card-bottom">
                              <button
                                className={
                                  'compare-toggle ' +
                                  (comparison.includes(job.id)
                                    ? 'selected'
                                    : '')
                                }
                                onClick={() => toggleCompare(job.id)}
                                disabled={
                                  comparison.length >= 3 &&
                                  !comparison.includes(job.id)
                                }
                                aria-pressed={comparison.includes(job.id)}
                              >
                                <span>
                                  {comparison.includes(job.id) && (
                                    <Check size={9} />
                                  )}
                                </span>
                                Compare
                              </button>
                              {applications[job.id] ? (
                                <button
                                  className="application-status"
                                  onClick={() => setSelected(job)}
                                >
                                  {stageLabels[applications[job.id].stage]}
                                  <ArrowRight size={10} />
                                </button>
                              ) : (
                                <button
                                  className="track-small"
                                  onClick={() => track(job)}
                                >
                                  <Plus size={11} />
                                  Track
                                </button>
                              )}
                            </div>
                          </article>
                        );
                      })}
                </div>
                {data && !filtered.length && (
                  <div className="empty">
                    <Search size={30} />
                    <h3>
                      {view === 'saved'
                        ? 'Your shortlist is waiting.'
                        : 'No matches this time.'}
                    </h3>
                    <p>
                      {view === 'saved'
                        ? 'Save an opportunity with its bookmark button, or reset your filters.'
                        : 'Try fewer search terms, a different city, or another work arrangement.'}
                    </p>
                    <button
                      onClick={() => {
                        reset();
                        setView('discover');
                      }}
                    >
                      Explore all opportunities
                      <ArrowRight size={15} />
                    </button>
                  </div>
                )}
                {filtered.length > limit && (
                  <div className="load-more">
                    <button onClick={() => setLimit(limit + 18)}>
                      Show more opportunities
                      <ChevronDown size={15} />
                    </button>
                    <span>
                      Showing {Math.min(limit, filtered.length)} of{' '}
                      {filtered.length}
                    </span>
                  </div>
                )}
                <div className="trust-note">
                  <CheckCircle2 size={17} />
                  <p>
                    Real public-source posts. LLM tags. A quality audit you can
                    inspect.
                    <br />
                    <span>
                      Check employer eligibility and availability on the
                      original listing.
                    </span>
                  </p>
                  <button onClick={() => setView('evidence')}>
                    See the evidence
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </section>
            </>
          )}
          <footer>
            <a href="./" className="footer-brand">
              firststep.
            </a>
            <span>Your next step, with a little more clarity.</span>
            <button onClick={() => setView('evidence')}>
              Sources & transparency ↗
            </button>
          </footer>
        </main>
      </div>
      {comparison.length > 0 && (
        <div className="compare-tray">
          <GitCompareArrows size={17} />
          <span>
            <strong>{comparison.length}/3</strong> selected
          </span>
          <button
            onClick={() => setShowCompare(true)}
            disabled={comparison.length < 2}
          >
            Compare side by side
            <ArrowRight size={14} />
          </button>
          <button
            className="tray-clear"
            aria-label="Clear comparison"
            onClick={() => setComparison([])}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {(notice || storageWarning) && (
        <div className="toast" role="status">
          <CheckCircle2 size={15} />
          {notice ||
            'Browser storage is unavailable. Changes will last for this session only.'}
          {storageWarning && (
            <button
              aria-label="Dismiss storage notice"
              onClick={() => setStorageWarning(false)}
            >
              <X size={13} />
            </button>
          )}
        </div>
      )}
      {showCompare && (
        <Modal title="Compare opportunities" onClose={closeModal} wide>
          <span className="eyebrow">A SIDE-BY-SIDE STARTING POINT</span>
          <h2>A little easier to choose.</h2>
          <div className="comparison-scroll">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Compare</th>
                  {comparisonJobs.map((job) => (
                    <th key={job.id}>
                      {job.title}
                      <small>{job.company}</small>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Role', (j: Job) => j.role],
                  ['Location', (j: Job) => j.cities.join(', ')],
                  ['Arrangement', (j: Job) => modeLabels[workMode(j)]],
                  ['Stipend', (j: Job) => j.salary],
                  [
                    'Deadline',
                    (j: Job) =>
                      j.deadline ? formatDate(j.deadline) : 'Check source',
                  ],
                  [
                    'Your matching skills',
                    (j: Job) =>
                      (matchMap[j.id] || []).join(', ') || 'No terms matched',
                  ],
                  [
                    'Review',
                    (j: Job) =>
                      j.tagReview?.status.replace(/_/g, ' ') ||
                      'Not in the audit',
                  ],
                ].map(([label, value]) => (
                  <tr key={label as string}>
                    <th>{label as string}</th>
                    {comparisonJobs.map((job) => (
                      <td key={job.id}>{(value as (j: Job) => string)(job)}</td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th>Original listing</th>
                  {comparisonJobs.map((job) => (
                    <td key={job.id}>
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open {job.source}
                        <ArrowUpRight size={13} />
                      </a>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Modal>
      )}
      {selected && (
        <Modal title={selected.title} onClose={closeModal}>
          <span className="eyebrow">{selected.company}</span>
          <h2>{selected.title}</h2>
          <div className="modal-tags">
            <span>{selected.role}</span>
            <span>{selected.cities.join(', ')}</span>
            <span>{modeLabels[workMode(selected)]}</span>
          </div>
          <ReviewBadge job={selected} />
          {selected.tagReview && (
            <div className={'review-explanation ' + selected.tagReview.status}>
              <strong>
                {selected.tagReview.status === 'corrected'
                  ? 'A correction, with its reasoning'
                  : selected.tagReview.status === 'needs_review'
                    ? 'Confirm these details with the employer'
                    : 'About this review'}
              </strong>
              <p>{selected.tagReview.note}</p>
              {selected.tagReview.previousRole && (
                <small>
                  Original tag: {selected.tagReview.previousRole} →{' '}
                  {selected.role}
                </small>
              )}
              {selected.tagReview.previousCities && (
                <small>
                  Original location tag:{' '}
                  {selected.tagReview.previousCities.join(', ')} →{' '}
                  {selected.cities.join(', ')}
                </small>
              )}
              <small>
                AI self-review · {selected.tagReview.date}. Employer legitimacy
                is not verified.
              </small>
            </div>
          )}
          {skills.length > 0 && (
            <div className="detail-matches">
              <Target size={17} />
              <div>
                <strong>
                  {selectedMatches.length} of your {skills.length}{' '}
                  skill terms appear in this listing
                </strong>
                <p>
                  {selectedMatches.join(', ') ||
                    'Try related terms, or check the full source description.'}
                </p>
                <small>
                  Term overlap is an explanation, not an assessment of hiring
                  eligibility.
                </small>
              </div>
            </div>
          )}
          <dl>
            <dt>Stipend</dt>
            <dd>{selected.salary}</dd>
            <dt>Source location</dt>
            <dd>{selected.location}</dd>
            <dt>Deadline</dt>
            <dd>
              {selected.deadline
                ? formatDate(selected.deadline)
                : 'Check the original listing'}
            </dd>
            <dt>Collected</dt>
            <dd>{formatDate(selected.collectedAt, true)} IST</dd>
            <dt>Tagged by</dt>
            <dd>{selected.taggedBy}</dd>
          </dl>
          <div className="description-block">
            <h3>What the source says</h3>
            <p className="description">
              {selected.description ||
                'Visit the original listing for complete responsibilities and eligibility.'}
            </p>
          </div>
          <div className="modal-actions">
            <a href={selected.url} target="_blank" rel="noopener noreferrer">
              Apply on {selected.source}
              <ArrowUpRight size={16} />
            </a>
            <button onClick={() => toggleSaved(selected.id)}>
              <Bookmark size={16} />
              {saved.includes(selected.id) ? 'Saved' : 'Save for later'}
            </button>
          </div>
          <section className="application-form">
            <div className="section-heading">
              <h3>Make your next move</h3>
              {applications[selected.id] && (
                <span className="tiny-label">Saved on this device</span>
              )}
            </div>
            {!applications[selected.id] ? (
              <>
                <p>
                  Keep a status, follow-up date, and notes. Applying still
                  happens on the original site.
                </p>
                <button
                  className="primary-button"
                  onClick={() => track(selected)}
                >
                  <Plus size={15} />
                  Track application
                </button>
              </>
            ) : (
              <>
                <div className="application-fields">
                  <label>
                    Status
                    <select
                      aria-label="Application status"
                      value={applications[selected.id].stage}
                      onChange={(e) => track(selected, e.target.value as Stage)}
                    >
                      {stages.map((stage) => (
                        <option key={stage} value={stage}>
                          {stageLabels[stage]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Next follow-up
                    <input
                      aria-label="Next follow-up date"
                      onInput={(e) => updateApplication(selected, {nextAction: e.currentTarget.value})}
                      onBlur={(e) => updateApplication(selected, {nextAction: e.currentTarget.value})}
                      type="date"
                      value={applications[selected.id].nextAction}
                      onChange={(e) =>
                        updateApplication(selected, {
                          nextAction: e.target.value,
                        })
                      }
                    />
                  </label>
                </div>
                <label>
                  Notes
                  <textarea
                    aria-label="Application notes"
                    rows={3}
                    maxLength={1500}
                    value={applications[selected.id].notes}
                    onChange={(e) =>
                      updateApplication(selected, { notes: e.target.value })
                    }
                    placeholder="Contact, interview details, or your next action…"
                  />
                </label>
                <button
                  className="remove-tracking"
                  onClick={() => removeApplication(selected.id)}
                >
                  Remove from tracker
                </button>
              </>
            )}
          </section>
          <p className="fineprint">
            Confirm stipend, eligibility and availability with the employer.
            Never pay an application fee.
          </p>
        </Modal>
      )}
    </div>
  );
}
