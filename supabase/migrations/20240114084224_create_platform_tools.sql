-- Create the platform_tools table
CREATE TABLE IF NOT EXISTS platform_tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    version TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    schema JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX platform_tools_name_idx ON platform_tools(name);
CREATE INDEX platform_tools_enabled_idx ON platform_tools(enabled);

-- Add trigger for updated_at
CREATE TRIGGER update_platform_tools_updated_at
    BEFORE UPDATE ON platform_tools
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Enable RLS
ALTER TABLE platform_tools ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for read access
CREATE POLICY "Allow read access to platform_tools for authenticated users"
    ON platform_tools
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Add RLS policy for insert/update access (restricted to service role)
CREATE POLICY "Allow insert/update access to platform_tools for service role"
    ON platform_tools
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role'); 