// Run with: node --import tsx --test tests/ai-usage.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aggregate } from 'mingo';
import { getUsageStats, usageFilter, usagePipeline } from '../server/aiUsage.ts';

const now = Date.parse('2026-10-19T02:00:00Z');
const rows = [
  { status: 'success', mode: 'image', durationMs: 10000, createdAt: now - 600000, request: { ip: '203.0.113.1', userAgent: 'iPhone', country: 'CN' }, model: 'model-a' },
  { status: 'archive_failed', mode: 'text', durationMs: 20000, createdAt: now - 500000, error: 'storage failed', request: { ip: '203.0.113.1', userAgent: 'Android', country: 'CN' }, model: 'model-a' },
  { status: 'failed', mode: 'text', durationMs: 500, createdAt: now - 400000, error: 'quota', request: { ip: '203.0.113.2', userAgent: 'Windows', country: 'US' }, model: 'model-b' },
  { status: 'pending', mode: 'image', createdAt: now - 180001, request: { ip: '203.0.113.2' } },
  { status: 'pending', mode: 'text', createdAt: now, request: { ip: 'unknown' } },
  { status: 'success', mode: 'text', durationMs: 30000, createdAt: Date.parse('2026-10-18T15:59:59Z') },
];

test('counts generated images even when archival fails, separates timeout and active work, excludes unknown IPs', () => {
  const [result] = aggregate(rows, usagePipeline({}, 1, now));
  const s = result.summary[0];
  assert.equal(s.requests, 6);
  assert.equal(s.generated, 3);
  assert.equal(s.archiveFailed, 1);
  assert.equal(s.failed, 1);
  assert.equal(s.timeout, 1);
  assert.equal(s.pending, 1);
  assert.equal(s.image, 2);
  assert.equal(s.text, 4);
  assert.equal(s.avgDurationMs, 20000);
  assert.equal(result.uniqueIps[0].total, 2);
  assert.equal(result.users.length, 2);
  assert.equal(result.users[0].requests, 2);
  assert.equal(result.users[0].request.userAgent, 'Android');
  assert.equal(result.users[0].firstSeen, rows[0].createdAt);
  assert.equal(result.daily.length, 2);
  assert.equal(result.daily[0]._id, '2026-10-18');
  assert.equal(result.daily[1].requests, 5);
  assert.equal(result.errors.reduce((n, error) => n + error.requests, 0), 2);
});

test('inclusive Beijing dates, exact IP and mode filters consistently narrow usage', () => {
  const filter = usageFilter({ start: '2026-10-19', end: '2026-10-19', ip: '203.0.113.1', mode: 'image' });
  assert.equal(filter.createdAt.$gte, Date.parse('2026-10-18T16:00:00Z'));
  assert.equal(filter.createdAt.$lt, Date.parse('2026-10-19T16:00:00Z'));
  const [result] = aggregate(rows, usagePipeline(filter, 1, now));
  assert.equal(result.summary[0].requests, 1);
  assert.equal(result.summary[0].image, 1);
  assert.equal(result.users[0]._id, '203.0.113.1');
  const [day] = aggregate(rows, usagePipeline(usageFilter({ start: '2026-10-19', end: '2026-10-19' }), 1, now));
  assert.equal(day.summary[0].requests, 5);
});

test('rejects invalid/reversed dates and structured IP injection; search is literal', () => {
  for (const query of [{ start: '2026-02-30' }, { end: 'bad' }, { start: ['2026-10-19'] },
    { start: '2026-10-20', end: '2026-10-19' }, { ip: { $ne: null } }]) {
    assert.throws(() => usageFilter(query));
  }
  const filter = usageFilter({ search: '.*', status: 'failed' });
  const [result] = aggregate([{ ...rows[2], prompt: '.*' }, { ...rows[2], prompt: 'cat' }], usagePipeline(filter, 1, now));
  assert.equal(result.summary[0].requests, 1);
});

test('paginates all IPs with deterministic ordering, caps daily history, and returns zeroes for empty data', async () => {
  const users = Array.from({ length: 25 }, (_, n) => ({ ...rows[0], request: { ip: `ip-${String(n).padStart(2, '0')}` } }));
  const [first] = aggregate(users, usagePipeline({}, 1, now));
  const [second] = aggregate(users, usagePipeline({}, 2, now));
  assert.equal(first.uniqueIps[0].total, 25);
  assert.equal(first.users.length, 20);
  assert.equal(second.users.length, 5);
  assert.equal(second.users[0]._id, 'ip-20');
  const days = Array.from({ length: 400 }, (_, n) => ({ ...rows[0], createdAt: now - n * 86400000 }));
  const [history] = aggregate(days, usagePipeline({}, 1, now));
  assert.equal(history.summary[0].requests, 400);
  assert.equal(history.daily.length, 366);
  const db = { collection: () => ({ aggregate: pipeline => ({ toArray: async () => aggregate([], pipeline) }) }) };
  const empty = await getUsageStats(db, {}, 1);
  assert.equal(empty.summary.requests, 0);
  assert.equal(empty.summary.uniqueIps, 0);
  assert.equal(empty.summary.avgDurationMs, null);
  assert.deepEqual(empty.daily, []);
});
