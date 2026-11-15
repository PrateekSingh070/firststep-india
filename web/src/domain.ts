export type ReviewStatus =
  | 'reviewed'
  | 'corrected'
  | 'needs_review'
  | 'changed';
export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  cities: string[];
  role: string;
  kind: string;
  source: string;
  url: string;
  description: string;
  salary: string;
  deadline: string | null;
  postedAt: string | null;
  collectedAt: string;
  mode: string;
  taggedBy: string;
  workMode?: string;
  tagReview?: {
    status: ReviewStatus;
    note: string;
    date: string;
    method?: string;
    previousRole?: string | null;
    previousCities?: string[] | null;
  } | null;
};
export type Feed = {
  jobs: Job[];
  updatedAt: string;
  runId: string;
  collected: number;
  duplicatesRemoved: number;
  sources: { name: string; url: string; status: string; collected: number }[];
  quality?: Record<string, number | string>;
};
export type Stage =
  | 'shortlisted'
  | 'applied'
  | 'interview'
  | 'offer'
  | 'closed';
export type Application = {
  stage: Stage;
  notes: string;
  nextAction: string;
  updatedAt: string;
  job: Job;
};
export const stages: Stage[] = [
  'shortlisted',
  'applied',
  'interview',
  'offer',
  'closed',
];
export const stageLabels: Record<Stage, string> = {
  shortlisted: 'Shortlisted',
  applied: 'Applied',
  interview: 'Interview',
  offer: 'Offer',
  closed: 'Closed',
};
export const roles = [
  'Software & IT',
  'Data & AI',
  'Design & Creative',
  'Marketing',
  'Sales & Business',
  'HR',
  'Finance',
  'Operations',
  'Engineering',
  'Research & Science',
  'Legal',
  'Education',
];
export const modeLabels: Record<string, string> = {
  remote: 'Fully remote',
  hybrid: 'Hybrid',
  office: 'In office',
  field: 'Field work',
  mixed: 'Remote + local visits',
  unknown: 'Confirm arrangement',
};
export function workMode(job: Job) {
  return (
    job.workMode ||
    (
      {
        wfh: 'remote',
        hybrid: 'hybrid',
        in_office: 'office',
        on_field: 'field',
      } as Record<string, string>
    )[job.mode] ||
    'unknown'
  );
}
export function parseSkills(text: string) {
  return [
    ...new Set(
      text
        .split(/[,\n]/)
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 1),
    ),
  ].slice(0, 12);
}
function termPresent(text: string, term: string) {
  const escaped = term
    .split('')
    .map((char) => ('\\^$.*+?()[]{}|'.includes(char) ? '\\' + char : char))
    .join('');
  return new RegExp('(^|[^a-z0-9])' + escaped + '(?=$|[^a-z0-9])', 'i').test(
    text,
  );
}
export function skillMatches(job: Job, skills: string[]) {
  const content = job.title + ' ' + job.description;
  const aliases: Record<string, string[]> = {
    js: ['javascript', 'js'],
    react: ['react', 'reactjs', 'react.js'],
    sql: ['sql', 'postgresql', 'mysql'],
    excel: ['excel', 'spreadsheets'],
    ai: ['artificial intelligence', 'ai'],
    ml: ['machine learning', 'ml'],
  };
  return skills.filter((skill) =>
    (aliases[skill] || [skill]).some((term) => termPresent(content, term)),
  );
}
export function matchesQuery(job: Job, query: string) {
  const words = (query.match(/"[^"]+"|\S+/g) || []).map((t) =>
    t.replace(/^"|"$/g, '').toLowerCase(),
  );
  const text = [
    job.title,
    job.company,
    job.description,
    job.role,
    ...job.cities,
  ]
    .join(' ')
    .toLowerCase();
  return words.every((word) => text.includes(word));
}
export function hasStipend(job: Job) {
  return /\d/.test(job.salary) && !/unpaid|not disclosed/i.test(job.salary);
}
export function formatDate(date: string | null, withTime = false) {
  if (!date || !Number.isFinite(Date.parse(date))) return 'Not provided';
  return new Date(date).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    ...(withTime
      ? { hour: '2-digit', minute: '2-digit' }
      : { year: 'numeric' }),
  });
}
export function daysToDeadline(job: Job) {
  if (!job.deadline) return null;
  return Math.ceil((Date.parse(job.deadline) - Date.now()) / 86400000);
}
export function csvCell(value: unknown) {
  let text = String(value ?? '');
  if (/^\s*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
export function exportJobs(
  jobs: Job[],
  applications: Record<string, Application>,
) {
  return (
    '\ufeff' +
    [
      [
        'Title',
        'Company',
        'Role',
        'Location',
        'Stipend',
        'Stage',
        'Deadline',
        'Original link',
      ]
        .map(csvCell)
        .join(','),
      ...jobs.map((j) =>
        [
          j.title,
          j.company,
          j.role,
          j.cities.join(' / '),
          j.salary,
          applications[j.id]?.stage || '',
          j.deadline || '',
          j.url,
        ]
          .map(csvCell)
          .join(','),
      ),
    ].join('\r\n')
  );
}
