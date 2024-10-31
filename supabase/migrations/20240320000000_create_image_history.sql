CREATE TABLE IF NOT EXISTS image_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  prompt TEXT NOT NULL,
  params JSONB NOT NULL,
  storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_image_history_user_id ON image_history(user_id);
CREATE INDEX idx_image_history_timestamp ON image_history(timestamp); 