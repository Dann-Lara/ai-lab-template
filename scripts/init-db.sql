-- ─────────────────────────────────────────────────────────────────
-- Initialize databases for the AI Lab Template
-- ─────────────────────────────────────────────────────────────────

-- Create n8n database (n8n uses its own DB)
CREATE DATABASE n8n;

-- Enable pgvector extension for AI embeddings (if available)
\c ailab;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- pgvector for semantic search (install pgvector first if needed)
-- CREATE EXTENSION IF NOT EXISTS vector;
