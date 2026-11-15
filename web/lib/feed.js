import { createHash } from 'node:crypto';
import reviews from './review-records.json' with { type: 'json' };
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
export function fingerprint(job) {
  return createHash('sha256')
    .update(
      JSON.stringify([
        job.title,
        job.company,
        job.location,
        job.mode,
        job.description,
      ]),
    )
    .digest('hex');
}
const sameSet = (a, b) =>
  Array.isArray(a) &&
  Array.isArray(b) &&
  a.length === b.length &&
  a.every((v) => b.includes(v));
export function reviewJob(job, records = reviews) {
  const record = records.find((r) => r.id === job.id);
  const baseMode =
    { wfh: 'remote', hybrid: 'hybrid', in_office: 'office', on_field: 'field' }[
      job.mode
    ] || 'unknown';
  const base = { ...job, workMode: baseMode, tagReview: null };
  if (!record) return base;
  if (record.inputFingerprint !== fingerprint(job))
    return {
      ...base,
      tagReview: {
        status: 'changed',
        note: 'This listing changed after its audit. The old review was not applied.',
        date: record.date,
      },
    };
  const roleChanged =
    record.roleVerdict === 'wrong' &&
    roles.includes(record.role) &&
    record.role !== job.role;
  const locationChanged =
    record.locationVerdict === 'wrong' &&
    Array.isArray(record.cities) &&
    record.cities.length &&
    !sameSet(record.cities, job.cities);
  const uncertain = record.jointVerdict === 'ambiguous' || record.modeConflict;
  return {
    ...base,
    role: roleChanged ? record.role : job.role,
    cities: locationChanged ? record.cities : job.cities,
    workMode: locationChanged
      ? 'mixed'
      : record.modeConflict
        ? 'unknown'
        : baseMode,
    tagReview: {
      status: uncertain
        ? 'needs_review'
        : roleChanged || locationChanged
          ? 'corrected'
          : 'reviewed',
      note: record.note,
      date: record.date,
      method: 'AI self-review',
      previousRole: roleChanged ? job.role : null,
      previousCities: locationChanged ? job.cities : null,
    },
  };
}
export function prepareFeed(data, records = reviews) {
  if (
    !data ||
    !Array.isArray(data.jobs) ||
    !Number.isFinite(Date.parse(data.updatedAt))
  )
    throw Error('Invalid feed contract');
  let rejected = 0;
  const jobs = data.jobs
    .filter((job) => {
      try {
        const url = new URL(job.url);
        const valid =
          job.id &&
          typeof job.title === 'string' &&
          typeof job.company === 'string' &&
          typeof job.description === 'string' &&
          roles.includes(job.role) &&
          Array.isArray(job.cities) &&
          job.cities.length &&
          job.cities.every((c) => typeof c === 'string' && c.length < 120) &&
          url.protocol === 'https:' &&
          ['unstop.com', 'internshala.com'].includes(url.hostname) &&
          (!job.deadline || Date.parse(job.deadline) > Date.now());
        if (!valid) rejected++;
        return valid;
      } catch {
        rejected++;
        return false;
      }
    })
    .map((job) => reviewJob(job, records));
  if (!jobs.length) throw Error('No valid active listings in feed');
  const counts = Object.fromEntries(
    ['reviewed', 'corrected', 'needs_review', 'changed'].map((status) => [
      status,
      jobs.filter((j) => j.tagReview?.status === status).length,
    ]),
  );
  return {
    ...data,
    jobs,
    quality: {
      ...counts,
      unreviewed: jobs.filter((j) => !j.tagReview).length,
      rejected,
      auditDate: '2026-11-16',
      auditMethod: 'AI self-review',
      baselineSampleSize: 50,
      baselineBothCorrect: 45,
    },
  };
}
