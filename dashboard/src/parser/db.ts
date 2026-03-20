import { Database } from "bun:sqlite";
import { mkdirSync } from "fs";
import { homedir } from "os";
import { dirname, resolve } from "path";

const DB_PATH = resolve(homedir(), ".codeforge/data/dashboard.db");

const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS projects (
  encoded_name TEXT PRIMARY KEY,
  path TEXT NOT NULL,
  name TEXT NOT NULL,
  last_synced TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(encoded_name) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  slug TEXT,
  team_name TEXT,
  cwd TEXT,
  git_branch TEXT,
  models TEXT,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cache_creation_tokens INTEGER DEFAULT 0,
  cache_read_tokens INTEGER DEFAULT 0,
  message_count INTEGER DEFAULT 0,
  time_start TEXT,
  time_end TEXT,
  file_size INTEGER DEFAULT 0,
  parent_session_id TEXT,
  agent_name TEXT,
  agent_type TEXT,
  last_synced TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_sessions_time_end ON sessions(time_end);
CREATE INDEX IF NOT EXISTS idx_sessions_slug ON sessions(slug);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  session_id TEXT NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
  parent_uuid TEXT,
  type TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  model TEXT,
  stop_reason TEXT,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cache_creation_tokens INTEGER DEFAULT 0,
  cache_read_tokens INTEGER DEFAULT 0,
  is_sidechain INTEGER DEFAULT 0,
  raw_json TEXT NOT NULL,
  searchable_text TEXT
);
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(type);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_model ON messages(model);

CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
  searchable_text,
  content=messages, content_rowid=id
);
CREATE TRIGGER IF NOT EXISTS messages_fts_ai AFTER INSERT ON messages BEGIN
  INSERT INTO messages_fts(rowid, searchable_text)
  VALUES (new.id, new.searchable_text);
END;
CREATE TRIGGER IF NOT EXISTS messages_fts_ad AFTER DELETE ON messages BEGIN
  INSERT INTO messages_fts(messages_fts, rowid, searchable_text)
  VALUES('delete', old.id, old.searchable_text);
END;

CREATE TABLE IF NOT EXISTS tool_calls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_uuid TEXT NOT NULL,
  session_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  file_path TEXT,
  timestamp TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tool_calls_session ON tool_calls(session_id);
CREATE INDEX IF NOT EXISTS idx_tool_calls_name ON tool_calls(tool_name);

CREATE TABLE IF NOT EXISTS files_touched (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  action TEXT NOT NULL,
  UNIQUE(session_id, file_path, action)
);
CREATE INDEX IF NOT EXISTS idx_files_session ON files_touched(session_id);

CREATE TABLE IF NOT EXISTS history_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  display TEXT,
  project TEXT,
  timestamp INTEGER NOT NULL,
  UNIQUE(session_id, timestamp)
);
CREATE INDEX IF NOT EXISTS idx_history_session ON history_entries(session_id);
CREATE INDEX IF NOT EXISTS idx_history_project ON history_entries(project);
CREATE INDEX IF NOT EXISTS idx_history_timestamp ON history_entries(timestamp);

CREATE TABLE IF NOT EXISTS file_changes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  message_uuid TEXT NOT NULL,
  file_path TEXT NOT NULL,
  action TEXT NOT NULL,
  content TEXT,
  old_string TEXT,
  new_string TEXT,
  timestamp TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_file_changes_session ON file_changes(session_id);
CREATE INDEX IF NOT EXISTS idx_file_changes_path ON file_changes(file_path);
CREATE INDEX IF NOT EXISTS idx_file_changes_timestamp ON file_changes(timestamp);

CREATE TABLE IF NOT EXISTS plan_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL,
  session_id TEXT,
  content TEXT NOT NULL,
  captured_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_plan_snapshots_slug ON plan_snapshots(slug);

CREATE TABLE IF NOT EXISTS context_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT,
  session_id TEXT,
  scope TEXT NOT NULL,
  path TEXT NOT NULL,
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  captured_at TEXT NOT NULL,
  UNIQUE(project_id, path, content_hash)
);
CREATE INDEX IF NOT EXISTS idx_context_snapshots_project ON context_snapshots(project_id);
CREATE INDEX IF NOT EXISTS idx_context_snapshots_session ON context_snapshots(session_id);

CREATE TABLE IF NOT EXISTS file_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  session_id TEXT,
  captured_at TEXT NOT NULL,
  UNIQUE(file_path, content_hash)
);
CREATE INDEX IF NOT EXISTS idx_file_snapshots_path ON file_snapshots(file_path);
CREATE INDEX IF NOT EXISTS idx_file_snapshots_type ON file_snapshots(file_type);
CREATE INDEX IF NOT EXISTS idx_file_snapshots_time ON file_snapshots(captured_at);

CREATE TABLE IF NOT EXISTS subagents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_session_id TEXT NOT NULL,
  session_id TEXT,
  tool_use_id TEXT,
  message_uuid TEXT,
  agent_name TEXT,
  agent_type TEXT,
  description TEXT,
  mode TEXT,
  team_name TEXT,
  file_path TEXT,
  time_spawned TEXT,
  UNIQUE(parent_session_id, tool_use_id)
);
CREATE INDEX IF NOT EXISTS idx_subagents_parent ON subagents(parent_session_id);
CREATE INDEX IF NOT EXISTS idx_subagents_session ON subagents(session_id);
CREATE INDEX IF NOT EXISTS idx_subagents_team ON subagents(team_name);

CREATE TABLE IF NOT EXISTS memory_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT NOT NULL UNIQUE,
  session_id TEXT,
  project_id TEXT NOT NULL,
  run_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  model TEXT,
  prompt TEXT NOT NULL,
  budget_usd REAL DEFAULT 3.0,
  cost_usd REAL DEFAULT 0,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  num_turns INTEGER DEFAULT 0,
  duration_ms INTEGER DEFAULT 0,
  events_json TEXT,
  result_json TEXT,
  error TEXT,
  started_at TEXT NOT NULL,
  completed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_memory_runs_session ON memory_runs(session_id);
CREATE INDEX IF NOT EXISTS idx_memory_runs_project ON memory_runs(project_id);
CREATE INDEX IF NOT EXISTS idx_memory_runs_type ON memory_runs(run_type);

CREATE TABLE IF NOT EXISTS observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  key TEXT NOT NULL,
  evidence TEXT,
  count INTEGER DEFAULT 1,
  first_seen_run_id TEXT NOT NULL,
  last_seen_run_id TEXT NOT NULL,
  first_seen_session_id TEXT,
  last_seen_session_id TEXT,
  sessions_since_last_seen INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  promoted_to_memory_id INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(project_id, key)
);
CREATE INDEX IF NOT EXISTS idx_observations_project ON observations(project_id);
CREATE INDEX IF NOT EXISTS idx_observations_category ON observations(category);
CREATE INDEX IF NOT EXISTS idx_observations_status ON observations(status);

CREATE TABLE IF NOT EXISTS memories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  source_observation_ids TEXT,
  confidence REAL DEFAULT 0,
  status TEXT DEFAULT 'approved',
  approved_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_memories_project ON memories(project_id);

CREATE TABLE IF NOT EXISTS run_observations (
  run_id TEXT NOT NULL,
  observation_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  PRIMARY KEY(run_id, observation_id)
);

CREATE TABLE IF NOT EXISTS observation_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    observation_id INTEGER NOT NULL,
    run_id TEXT,
    session_id TEXT,
    action TEXT NOT NULL,
    old_content TEXT,
    new_content TEXT,
    old_evidence TEXT,
    new_evidence TEXT,
    old_status TEXT,
    new_status TEXT,
    metadata TEXT,
    changed_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_obs_history_obs ON observation_history(observation_id);
CREATE INDEX IF NOT EXISTS idx_obs_history_time ON observation_history(changed_at);
`;

export function openDatabase(dbPath: string): Database {
	const db = new Database(dbPath, { create: true });
	db.exec("PRAGMA journal_mode = WAL;");
	db.exec("PRAGMA foreign_keys = ON;");
	db.exec("PRAGMA busy_timeout = 5000;");
	db.exec("PRAGMA synchronous = NORMAL;");
	db.exec("PRAGMA cache_size = -64000;");
	db.exec("PRAGMA mmap_size = 268435456;");
	db.exec("PRAGMA temp_store = MEMORY;");
	db.exec("PRAGMA auto_vacuum = INCREMENTAL;");

	// Migrate context_snapshots BEFORE CREATE_TABLES_SQL —
	// old table lacks project_id, so CREATE INDEX on that column would fail.
	try {
		const cols = db
			.prepare("PRAGMA table_info(context_snapshots)")
			.all() as Array<{ name: string }>;
		if (cols.length > 0 && !cols.some((c) => c.name === "project_id")) {
			db.exec("DROP TABLE IF EXISTS context_snapshots;");
		}
	} catch {
		// Table may not exist yet — that's fine
	}

	// Migrate sessions table for subagent columns
	try {
		const sessionCols = db
			.prepare("PRAGMA table_info(sessions)")
			.all() as Array<{ name: string }>;
		if (
			sessionCols.length > 0 &&
			!sessionCols.some((c) => c.name === "parent_session_id")
		) {
			db.exec("ALTER TABLE sessions ADD COLUMN parent_session_id TEXT;");
			db.exec("ALTER TABLE sessions ADD COLUMN agent_name TEXT;");
			db.exec("ALTER TABLE sessions ADD COLUMN agent_type TEXT;");
		}
	} catch {
		// Table may not exist yet — that's fine
	}

	db.exec(CREATE_TABLES_SQL);
	return db;
}

export function closeDatabase(db: Database): void {
	db.close();
}

let _db: Database | null = null;

export function getDb(): Database {
	if (!_db) {
		mkdirSync(dirname(DB_PATH), { recursive: true });
		_db = openDatabase(DB_PATH);
	}
	return _db;
}
