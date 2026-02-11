const request = require('supertest');
const app = require('../server');
const { getDb, closeDb } = require('../db');

// Use in-memory database for tests
process.env.DB_PATH = ':memory:';

let pageId;

afterAll(() => {
  closeDb();
});

describe('Pages API', () => {
  test('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('GET /api/pages returns empty array initially', async () => {
    const res = await request(app).get('/api/pages');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('POST /api/pages creates a page', async () => {
    const res = await request(app)
      .post('/api/pages')
      .send({ title: 'Test Page', content: '<p>Hello world</p>' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Test Page');
    expect(res.body.content).toBe('<p>Hello world</p>');
    expect(res.body.id).toBeDefined();
    pageId = res.body.id;
  });

  test('GET /api/pages/:id returns the created page', async () => {
    const res = await request(app).get(`/api/pages/${pageId}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Test Page');
  });

  test('PUT /api/pages/:id updates a page', async () => {
    const res = await request(app)
      .put(`/api/pages/${pageId}`)
      .send({ title: 'Updated Title', content: '<p>Updated content</p>' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated Title');
  });

  test('GET /api/pages/:id/versions returns version history', async () => {
    const res = await request(app).get(`/api/pages/${pageId}/versions`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe('Test Page');
  });

  test('POST /api/pages creates child page', async () => {
    const res = await request(app)
      .post('/api/pages')
      .send({ title: 'Child Page', parent_id: pageId });
    expect(res.status).toBe(201);
    expect(res.body.parent_id).toBe(pageId);
  });

  test('GET /api/pages/search finds pages', async () => {
    const res = await request(app).get('/api/pages/search?q=Updated');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('DELETE /api/pages/:id deletes a page', async () => {
    const res = await request(app).delete(`/api/pages/${pageId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('GET /api/pages/:id returns 404 for deleted page', async () => {
    const res = await request(app).get(`/api/pages/${pageId}`);
    expect(res.status).toBe(404);
  });
});
