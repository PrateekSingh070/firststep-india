import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fingerprint, prepareFeed, reviewJob } from '../lib/feed.js';
import jobsHandler from '../api/jobs.js';
import statusHandler from '../api/status.js';
import {
  skillMatches,
  matchesQuery,
  csvCell,
  exportJobs,
  workMode,
} from '../src/domain.ts';
const base = {
  id: 'unstop-test',
  title: 'Business Development Internship',
  company: 'Training Co',
  location: 'Anekal',
  cities: ['Anekal'],
  role: 'Sales & Business',
  kind: 'Internship',
  source: 'Unstop',
  url: 'https://unstop.com/internships/example',
  description: 'Guide students during workshops and assess their progress.',
  salary: '₹5000/month',
  deadline: null,
  postedAt: null,
  collectedAt: new Date().toISOString(),
  mode: 'on_field',
  taggedBy: 'LLM',
};
const record = {
  id: base.id,
  inputFingerprint: fingerprint(base),
  roleVerdict: 'wrong',
  locationVerdict: 'correct',
  jointVerdict: 'wrong',
  role: 'Education',
  cities: ['Anekal'],
  note: 'Training is the primary duty.',
  date: '2026-11-16',
};
const capture = () => ({
  statusCode: 0,
  headers: {},
  setHeader(key, value) {
    this.headers[key] = value;
  },
  status(value) {
    this.statusCode = value;
    return this;
  },
  json(value) {
    this.data = value;
    return this;
  },
});
test('review corrections preserve original evidence and expire on every source-field change', () => {
  const result = reviewJob(base, [record]);
  assert.equal(result.role, 'Education');
  assert.equal(result.tagReview.status, 'corrected');
  assert.equal(result.tagReview.previousRole, 'Sales & Business');
  assert.equal(result.description, base.description);
  for (const field of ['title', 'company', 'location', 'mode', 'description']) {
    const changed = reviewJob({ ...base, [field]: base[field] + ' changed' }, [
      record,
    ]);
    assert.equal(changed.role, 'Sales & Business');
    assert.equal(changed.tagReview.status, 'changed');
  }
  assert.equal(
    reviewJob({ ...base, role: 'Education' }, [record]).tagReview.status,
    'reviewed',
  );
});
test('mixed-presence correction is excluded from fully remote discovery; source conflicts stay unresolved', () => {
  const remote = { ...base, mode: 'wfh', cities: ['Remote'] };
  const r = {
    ...record,
    inputFingerprint: fingerprint(remote),
    roleVerdict: 'correct',
    locationVerdict: 'wrong',
    cities: ['Unspecified'],
  };
  const mixed = reviewJob(remote, [r]);
  assert.equal(workMode(mixed), 'mixed');
  assert.deepEqual(mixed.cities, ['Unspecified']);
  assert.equal(mixed.mode, 'wfh');
  const conflict = reviewJob(base, [
    {
      ...record,
      roleVerdict: 'correct',
      jointVerdict: 'ambiguous',
      modeConflict: true,
    },
  ]);
  assert.equal(conflict.tagReview.status, 'needs_review');
  assert.equal(workMode(conflict), 'unknown');
  assert.equal(conflict.role, base.role);
});
test('feed contract excludes expired records, unsafe links and malformed role/location values', () => {
  const data = {
    updatedAt: new Date().toISOString(),
    jobs: [
      base,
      { ...base, id: 'evil', url: 'https://unstop.com.attacker.example/path' },
      { ...base, id: 'http', url: 'http://unstop.com/path' },
      { ...base, id: 'expired', deadline: '2000-01-01' },
      { ...base, id: 'bad-role', role: 'Invented' },
      { ...base, id: 'bad-cities', cities: [42] },
    ],
  };
  const output = prepareFeed(data, []);
  assert.equal(output.jobs.length, 1);
  assert.equal(output.quality.rejected, 5);
  assert.equal(output.quality.unreviewed, 1);
  assert.throws(
    () => prepareFeed({ ...data, updatedAt: 'invalid' }),
    /contract/,
  );
  assert.throws(
    () => prepareFeed({ updatedAt: data.updatedAt, jobs: [] }),
    /No valid/,
  );
});
test('skill matches use literal skill terms, not arbitrary substrings or eligibility claims', () => {
  const job = {
    ...base,
    title: 'Full stack role',
    description: 'Build React interfaces and Node.js APIs using C++ and SQL.',
  };
  assert.deepEqual(
    skillMatches(job, ['react', 'node.js', 'c++', 'sql', 'r', 'python']),
    ['react', 'node.js', 'c++', 'sql'],
  );
  assert.equal(matchesQuery(job, 'react "node.js"'), true);
  assert.equal(matchesQuery(job, 'react python'), false);
  assert.deepEqual(
    skillMatches({ ...job, description: 'A reaction to market growth.' }, [
      'react',
    ]),
    [],
  );
});
test('CSV exports escape quotes, delimiters and spreadsheet formula payloads', () => {
  assert.equal(csvCell('Hello, "team"'), '"Hello, ""team"""');
  for (const value of [
    '=IMPORTDATA("x")',
    '   =1+1',
    '+123',
    '@SUM(A1)',
    '-1',
    '\tvalue',
  ])
    assert.equal(csvCell(value)[1], "'");
  const csv = exportJobs([{ ...base, title: '=2+2' }], {});
  assert.ok(csv.includes("'=2+2"));
  assert.ok(csv.includes(base.url));
});
test('public API routes reject writes and return visible errors instead of invented job data', async () => {
  for (const handler of [jobsHandler, statusHandler]) {
    const denied = capture();
    await handler({ method: 'POST' }, denied);
    assert.equal(denied.statusCode, 405);
    assert.equal(denied.headers.Allow, 'GET');
  }
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => {
      throw Error('upstream down');
    };
    for (const handler of [jobsHandler, statusHandler]) {
      const failed = capture();
      await handler({ method: 'GET' }, failed);
      assert.equal(failed.statusCode, 502);
      assert.ok(failed.data.error);
      assert.equal(failed.data.jobs, undefined);
    }
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({ jobs: [base], updatedAt: new Date().toISOString() }),
    });
    const valid = capture();
    await jobsHandler({ method: 'GET' }, valid);
    assert.equal(valid.statusCode, 200);
    assert.equal(valid.data.jobs.length, 1);
  } finally {
    globalThis.fetch = original;
  }
});
