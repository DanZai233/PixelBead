// Run with: node --import tsx --test tests/ai-generations.test.mjs
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { Readable, Writable } from 'node:stream';
import { MongoClient, GridFSBucket, ObjectId } from 'mongodb';
import generate from '../api/ai/generate-image.ts';
import admin from '../api/admin/ai-generations.ts';

test('AI generation archive and private admin access', async t => {
  const previousEnv = { ...process.env };
  process.env.MONGODB_URI = 'mongodb://test.invalid';
  process.env.PIXELBEAD_AI_API_KEY = 'test-key';
  process.env.ADMIN_PASSWORD = 'test-admin-password';
  process.env.ADMIN_USERNAME = 'admin';
  const records = [];
  const files = new Map();
  let upstreamCalls = 0;
  let upstreamStatus = 200;
  let malformedUpstream = false;
  let failUpload = false;
  const image = Buffer.from('test-image-bytes');
  const dataUrl = `data:image/png;base64,${image.toString('base64')}`;
  let lastFilter;
  const collection = {
    createIndex: async () => {},
    insertOne: async record => {
      const _id = new ObjectId();
      records.push({ ...record, _id });
      return { insertedId: _id };
    },
    updateOne: async ({ _id }, { $set }) => Object.assign(records.find(r => r._id.equals(_id)), $set),
    findOne: async ({ _id }) => records.find(r => r._id.equals(_id)),
    deleteOne: async ({ _id }) => { records.splice(records.findIndex(r => r._id.equals(_id)), 1); },
    countDocuments: async () => records.length,
    find: filter => {
      lastFilter = filter;
      let skip = 0;
      let limit = 15;
      const cursor = {
        sort: () => cursor,
        skip: value => { skip = value; return cursor; },
        limit: value => { limit = value; return cursor; },
        toArray: async () => [...records].reverse().slice(skip, skip + limit),
      };
      return cursor;
    },
  };
  const db = {
    collection: name => name === 'ai_images.files'
      ? { findOne: async ({ _id }) => files.get(_id.toString()) }
      : collection,
  };
  mock.method(MongoClient.prototype, 'connect', async function () { return this; });
  mock.method(MongoClient.prototype, 'db', () => db);
  mock.method(GridFSBucket.prototype, 'openUploadStream', (name, options) => {
    const id = new ObjectId();
    const chunks = [];
    const stream = new Writable({
      write(chunk, encoding, callback) {
        if (failUpload) return callback(new Error('storage unavailable'));
        chunks.push(chunk);
        callback();
      },
      final(callback) {
        files.set(id.toString(), { _id: id, metadata: options.metadata, bytes: Buffer.concat(chunks) });
        callback();
      },
    });
    stream.id = id;
    return stream;
  });
  mock.method(GridFSBucket.prototype, 'delete', async id => { files.delete(id.toString()); });
  mock.method(GridFSBucket.prototype, 'openDownloadStream', id => Readable.from([files.get(id.toString()).bytes]));
  mock.method(globalThis, 'fetch', async () => {
    upstreamCalls++;
    return malformedUpstream
      ? new Response('not-json', { status: 502 })
      : Response.json(upstreamStatus === 200 ? { data: [{ b64_json: image.toString('base64') }] }
        : { error: { message: 'quota exceeded' } }, { status: upstreamStatus });
  });
  t.after(() => {
    mock.restoreAll();
    for (const key of Object.keys(process.env)) if (!(key in previousEnv)) delete process.env[key];
    Object.assign(process.env, previousEnv);
  });

  function request(method = 'POST', body = {}, query = {}, authorization = undefined) {
    return {
      method, body, query, socket: { remoteAddress: '127.0.0.1' },
      headers: {
        'x-vercel-forwarded-for': '203.0.113.7', 'x-forwarded-for': '198.51.100.9',
        'user-agent': 'Mozilla/5.0 (iPhone) Safari/605.1',
        'accept-language': 'zh-CN', 'x-vercel-ip-country': 'CN',
        ...(authorization ? { authorization } : {}),
      },
    };
  }
  function response() {
    const chunks = [];
    const res = new Writable({ write(chunk, encoding, callback) { chunks.push(chunk); callback(); } });
    res.statusCode = 200;
    res.headers = {};
    res.setHeader = (key, value) => { res.headers[key] = value; };
    res.status = code => { res.statusCode = code; return res; };
    res.json = body => { res.body = body; return res; };
    res.bytes = () => Buffer.concat(chunks);
    return res;
  }
  function token(exp = Date.now() + 60000, secret = process.env.ADMIN_PASSWORD) {
    const payload = JSON.stringify({ user: 'admin', exp });
    return `Bearer ${Buffer.from(payload).toString('base64')}.${createHmac('sha256', secret).update(payload).digest('hex')}`;
  }

  await t.test('stores prompt, reference, output, server IP and device headers', async () => {
    const res = response();
    await generate(request('POST', { prompt: '像素猫', referenceImage: dataUrl }), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.imageDataUrl, dataUrl);
    assert.equal(records[0].prompt, '像素猫');
    assert.equal(records[0].status, 'success');
    assert.equal(records[0].request.ip, '203.0.113.7');
    assert.match(records[0].request.userAgent, /iPhone/);
    assert.equal(files.size, 2);
    assert.deepEqual(files.get(records[0].imageId.toString()).bytes, image);
  });
  await t.test('rejects malformed input and remote reference URLs without invoking upstream', async () => {
    const before = upstreamCalls;
    for (const body of ['{bad', { prompt: 'cat', referenceImage: 'https://example.com/image.png' }]) {
      const res = response();
      await generate(request('POST', body), res);
      assert.equal(res.statusCode, 400);
    }
    assert.equal(upstreamCalls, before);
  });
  await t.test('records upstream errors and malformed responses', async () => {
    upstreamStatus = 429;
    const res = response();
    await generate(request('POST', { prompt: 'limited' }), res);
    assert.equal(res.statusCode, 502);
    assert.equal(records.at(-1).status, 'failed');
    assert.equal(records.at(-1).error, '当前使用人数较多，请稍后再试');
    upstreamStatus = 200;
    malformedUpstream = true;
    await generate(request('POST', { prompt: 'malformed' }), response());
    assert.equal(records.at(-1).status, 'failed');
    malformedUpstream = false;
  });
  await t.test('marks archive failures while preserving generated result', async () => {
    failUpload = true;
    const res = response();
    await generate(request('POST', { prompt: 'storage-failure' }), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.imageDataUrl, dataUrl);
    assert.equal(records.at(-1).status, 'archive_failed');
    failUpload = false;
  });
  await t.test('requires valid, unexpired admin auth for list, image and deletion', async () => {
    for (const auth of [undefined, token(Date.now() - 100), token(Date.now() + 10000, 'wrong-secret')]) {
      for (const [method, query] of [
        ['GET', {}], ['GET', { id: records[0]._id.toString(), image: 'generated' }],
        ['DELETE', { id: records[0]._id.toString() }],
      ]) {
        const res = response();
        await admin(request(method, {}, query, auth), res);
        assert.equal(res.statusCode, 401);
      }
    }
    const secret = process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_PASSWORD;
    const res = response();
    await admin(request('GET', {}, {}, token(Date.now() + 10000, '')), res);
    assert.equal(res.statusCode, 401);
    process.env.ADMIN_PASSWORD = secret;
  });
  await t.test('returns pagination metadata, literal search and no inline image data', async () => {
    const res = response();
    await admin(request('GET', {}, { limit: '1', search: '.*', status: 'success' }, token()), res);
    assert.equal(res.body.records.length, 1);
    assert.equal(res.body.total, records.length);
    assert.equal(res.headers['Cache-Control'], 'private, no-store');
    assert.equal(lastFilter.$or[0].prompt.$regex, '\\.\\*');
    assert.equal(lastFilter.status, 'success');
    assert.equal('imageId' in res.body.records[0], false);
  });
  await t.test('streams archived image and deletes record with both image files', async () => {
    const id = records[0]._id.toString();
    const res = response();
    await admin(request('GET', {}, { id, image: 'generated' }, token()), res);
    assert.equal(res.headers['Content-Type'], 'image/png');
    assert.deepEqual(res.bytes(), image);
    const deleted = response();
    await admin(request('DELETE', {}, { id }, token()), deleted);
    assert.equal(deleted.statusCode, 200);
    assert.equal(files.size, 0);
    assert.equal(records.some(r => r._id.toString() === id), false);
  });
  await t.test('protects active requests but permits cleanup of abandoned requests', async () => {
    const _id = new ObjectId();
    const record = { _id, status: 'pending', createdAt: Date.now() };
    records.push(record);
    const blocked = response();
    await admin(request('DELETE', {}, { id: _id.toString() }, token()), blocked);
    assert.equal(blocked.statusCode, 409);
    record.createdAt -= 180001;
    const cleaned = response();
    await admin(request('DELETE', {}, { id: _id.toString() }, token()), cleaned);
    assert.equal(cleaned.statusCode, 200);
  });
});
