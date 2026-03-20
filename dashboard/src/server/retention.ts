import type { Database } from "bun:sqlite";

const RETENTION_DAYS = process.env.CODEFORGE_RETENTION_DAYS
	? parseInt(process.env.CODEFORGE_RETENTION_DAYS, 10)
	: null;

export function runRetention(db: Database): void {
	if (!RETENTION_DAYS) return; // unlimited retention

	const cutoff = new Date();
	cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);
	const cutoffIso = cutoff.toISOString();

	// Trim message bodies (keep metadata)
	db.run(
		"UPDATE messages SET raw_json = NULL, searchable_text = NULL WHERE timestamp < ?",
		[cutoffIso],
	);

	// Trim file_changes content
	db.run(
		"UPDATE file_changes SET content = NULL, old_string = NULL, new_string = NULL WHERE timestamp < ?",
		[cutoffIso],
	);

	// Reclaim space
	db.exec("PRAGMA incremental_vacuum;");
}
