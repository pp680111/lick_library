const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

class PhraseDatabase {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
    this.SQL = null;
    this._ready = false;
    this._initPromise = null;
  }

  get ready() {
    return this._ready;
  }

  // Initialize the database - can be called multiple times safely
  initialize() {
    if (!this._initPromise) {
      this._initPromise = this._doInitialize();
    }
    return this._initPromise;
  }

  async _doInitialize() {
    const SQL = await initSqlJs();
    this.SQL = SQL;

    // Ensure directory exists
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Load existing database or create new one
    if (fs.existsSync(this.dbPath)) {
      const fileBuffer = fs.readFileSync(this.dbPath);
      this.db = new SQL.Database(fileBuffer);
    } else {
      this.db = new SQL.Database();
    }

    // Create tables
    this.db.run('PRAGMA foreign_keys = ON');

    this.db.run(`
      CREATE TABLE IF NOT EXISTS phrases (
        rowid INTEGER PRIMARY KEY AUTOINCREMENT,
        id TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        music_xml TEXT NOT NULL,
        note TEXT DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL CHECK(type IN ('preset', 'custom'))
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS phrase_tags (
        phrase_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        PRIMARY KEY (phrase_id, tag_id),
        FOREIGN KEY (phrase_id) REFERENCES phrases(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      )
    `);

    // sql.js doesn't support FTS5, so we use simple LIKE search instead
    // No FTS virtual table needed

    // Initialize preset tags
    const presetTags = ['Blues', 'Jazz', 'Rock', 'Country', 'Funk', 'Pop', 'R&B', 'Soul'];
    const existingTags = this.db.exec("SELECT name FROM tags WHERE type = 'preset'");
    const existingTagNames = existingTags.length > 0 ? existingTags[0].values.map(row => row[0]) : [];

    presetTags.forEach(tag => {
      if (!existingTagNames.includes(tag)) {
        this.db.run('INSERT INTO tags (id, name, type) VALUES (?, ?, ?)', [uuidv4(), tag, 'preset']);
      }
    });

    this._ready = true;
    this.save();
    return this;
  }

  save() {
    if (this.db) {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbPath, buffer);
    }
  }

  _rowsToObjects(result) {
    if (!result || result.length === 0) return [];
    const { columns, values } = result[0];
    return values.map(row => {
      const obj = {};
      columns.forEach((col, i) => obj[col] = row[i]);
      return obj;
    });
  }

  getPhrases(filter = {}) {
    let sql = `
      SELECT DISTINCT p.*
      FROM phrases p
      LEFT JOIN phrase_tags pt ON p.id = pt.phrase_id
      LEFT JOIN tags t ON t.id = pt.tag_id
      WHERE 1=1
    `;
    const params = [];

    if (filter.query) {
      sql += ' AND (p.note LIKE ? OR p.title LIKE ? OR t.name LIKE ?)';
      params.push(
        `%${filter.query}%`,
        `%${filter.query}%`,
        `%${filter.query}%`
      );
    }

    sql += ' ORDER BY p.updated_at DESC';
    const result = this.db.exec(sql, params);
    return this._rowsToObjects(result);
  }

  getPhrase(id) {
    const result = this.db.exec('SELECT * FROM phrases WHERE id = ?', [id]);
    const phrases = this._rowsToObjects(result);
    if (phrases.length === 0) return null;

    const phrase = phrases[0];
    const tagsResult = this.db.exec(`
      SELECT t.* FROM tags t
      JOIN phrase_tags pt ON t.id = pt.tag_id
      WHERE pt.phrase_id = ?
    `, [id]);
    phrase.tags = this._rowsToObjects(tagsResult);
    return phrase;
  }

  createPhrase(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    this.db.run(`
      INSERT INTO phrases (id, title, music_xml, note, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, data.title, data.musicXml, data.note || '', now, now]);

    if (data.tagIds && data.tagIds.length > 0) {
      data.tagIds.forEach(tagId => {
        this.db.run('INSERT INTO phrase_tags (phrase_id, tag_id) VALUES (?, ?)', [id, tagId]);
      });
    }

    this.save();
    return id;
  }

  updatePhrase(id, data) {
    const now = new Date().toISOString();
    this.db.run(`
      UPDATE phrases SET title = ?, music_xml = ?, note = ?, updated_at = ?
      WHERE id = ?
    `, [data.title, data.musicXml, data.note || '', now, id]);

    this.db.run('DELETE FROM phrase_tags WHERE phrase_id = ?', [id]);
    if (data.tagIds && data.tagIds.length > 0) {
      data.tagIds.forEach(tagId => {
        this.db.run('INSERT INTO phrase_tags (phrase_id, tag_id) VALUES (?, ?)', [id, tagId]);
      });
    }

    this.save();
  }

  deletePhrase(id) {
    this.db.run('DELETE FROM phrase_tags WHERE phrase_id = ?', [id]);
    this.db.run('DELETE FROM phrases WHERE id = ?', [id]);
    this.save();
  }

  getTags() {
    const result = this.db.exec('SELECT * FROM tags ORDER BY type, name');
    return this._rowsToObjects(result);
  }

  createTag(name, type) {
    const id = uuidv4();
    this.db.run('INSERT INTO tags (id, name, type) VALUES (?, ?, ?)', [id, name, type]);
    this.save();
    return id;
  }

  deleteTag(id) {
    this.db.run('DELETE FROM phrase_tags WHERE tag_id = ?', [id]);
    this.db.run('DELETE FROM tags WHERE id = ?', [id]);
    this.save();
  }

  searchPhrases(query) {
    if (!query) return this.getPhrases();

    // Simple LIKE-based search (sql.js doesn't support FTS5)
    return this.getPhrases({ query });
  }

  close() {
    if (this.db) {
      this.save();
      this.db.close();
      this.db = null;
      this._ready = false;
    }
  }
}

module.exports = PhraseDatabase;
