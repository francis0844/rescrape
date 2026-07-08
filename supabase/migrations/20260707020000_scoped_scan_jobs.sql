-- Null = global scope (scans every eligible pending/scanning source), matching prior behavior.
-- Non-null = scan is scoped to sources discovered via these keyword ids only.
alter table scan_jobs add column keyword_ids uuid[] null;
