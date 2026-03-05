-- Create GIN index for full-text search on RecordValue text and json (searchable content)
CREATE INDEX IF NOT EXISTS "record_value_fts_idx" ON "RecordValue"
USING GIN (to_tsvector('english', coalesce("value_text", '') || ' ' || coalesce("value_json"::text, '')));
