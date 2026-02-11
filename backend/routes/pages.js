const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');

const router = express.Router();

// Get all pages as a flat list (tree is built client-side)
router.get('/', (req, res) => {
  const db = getDb();
  const pages = db.prepare(`
    SELECT id, title, parent_id, position, icon, created_at, updated_at
    FROM pages ORDER BY position ASC, created_at ASC
  `).all();
  res.json(pages);
});

// Search pages
router.get('/search', (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length === 0) {
    return res.json([]);
  }
  const db = getDb();
  const pages = db.prepare(`
    SELECT id, title, parent_id, icon, updated_at,
      substr(content, 1, 200) as snippet
    FROM pages
    WHERE title LIKE ? OR content LIKE ?
    ORDER BY updated_at DESC
    LIMIT 20
  `).all(`%${q}%`, `%${q}%`);
  res.json(pages);
});

// Get a single page
router.get('/:id', (req, res) => {
  const db = getDb();
  const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(req.params.id);
  if (!page) {
    return res.status(404).json({ error: 'Page not found' });
  }
  res.json(page);
});

// Get page versions
router.get('/:id/versions', (req, res) => {
  const db = getDb();
  const versions = db.prepare(`
    SELECT id, page_id, title, created_at
    FROM page_versions WHERE page_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `).all(req.params.id);
  res.json(versions);
});

// Get a specific version
router.get('/:id/versions/:versionId', (req, res) => {
  const db = getDb();
  const version = db.prepare(`
    SELECT * FROM page_versions WHERE id = ? AND page_id = ?
  `).get(req.params.versionId, req.params.id);
  if (!version) {
    return res.status(404).json({ error: 'Version not found' });
  }
  res.json(version);
});

// Create a new page
router.post('/', (req, res) => {
  const db = getDb();
  const id = uuidv4();
  const { title = 'Untitled', content = '', parent_id = null, icon = '📄' } = req.body;

  // Get next position
  const maxPos = db.prepare(
    'SELECT COALESCE(MAX(position), -1) + 1 as next FROM pages WHERE parent_id IS ?'
  ).get(parent_id);

  db.prepare(`
    INSERT INTO pages (id, title, content, parent_id, position, icon)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, title, content, parent_id, maxPos.next, icon);

  const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(id);
  res.status(201).json(page);
});

// Update a page
router.put('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM pages WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Page not found' });
  }

  const { title, content, parent_id, position, icon } = req.body;

  // Save version if content or title changed
  if (
    (content !== undefined && content !== existing.content) ||
    (title !== undefined && title !== existing.title)
  ) {
    db.prepare(`
      INSERT INTO page_versions (page_id, title, content)
      VALUES (?, ?, ?)
    `).run(existing.id, existing.title, existing.content);
  }

  const updates = [];
  const params = [];

  if (title !== undefined) { updates.push('title = ?'); params.push(title); }
  if (content !== undefined) { updates.push('content = ?'); params.push(content); }
  if (parent_id !== undefined) { updates.push('parent_id = ?'); params.push(parent_id); }
  if (position !== undefined) { updates.push('position = ?'); params.push(position); }
  if (icon !== undefined) { updates.push('icon = ?'); params.push(icon); }

  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')");
    params.push(req.params.id);
    db.prepare(`UPDATE pages SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }

  const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(req.params.id);
  res.json(page);
});

// Delete a page (children get parent_id set to null via ON DELETE SET NULL)
router.delete('/:id', (req, res) => {
  const db = getDb();
  const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(req.params.id);
  if (!page) {
    return res.status(404).json({ error: 'Page not found' });
  }
  db.prepare('DELETE FROM pages WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Reorder pages
router.post('/reorder', (req, res) => {
  const db = getDb();
  const { pages } = req.body; // Array of { id, parent_id, position }
  if (!Array.isArray(pages)) {
    return res.status(400).json({ error: 'pages must be an array' });
  }

  const stmt = db.prepare('UPDATE pages SET parent_id = ?, position = ? WHERE id = ?');
  const updateMany = db.transaction((items) => {
    for (const item of items) {
      stmt.run(item.parent_id || null, item.position, item.id);
    }
  });
  updateMany(pages);

  res.json({ success: true });
});

module.exports = router;
