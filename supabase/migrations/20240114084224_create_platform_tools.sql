--------------- PLATFORM TOOLS ---------------

-- TABLE --

CREATE TABLE IF NOT EXISTS platform_tools (
    -- REQUIRED FIELDS
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    version TEXT,
    enabled BOOLEAN DEFAULT true,
    schema JSONB,

    -- METADATA
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ
);

-- INDEXES --

CREATE INDEX platform_tools_name_idx ON platform_tools(name);
CREATE INDEX platform_tools_enabled_idx ON platform_tools(enabled);

-- RLS --

ALTER TABLE platform_tools ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users
CREATE POLICY "Allow read access for authenticated users"
    ON platform_tools
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow insert/update access only for service_role
CREATE POLICY "Allow insert/update access for service_role"
    ON platform_tools
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- TRIGGERS --

CREATE TRIGGER update_platform_tools_updated_at
    BEFORE UPDATE ON platform_tools
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column(); 