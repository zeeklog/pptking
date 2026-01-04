-- Create temp_login_states table for WeChat login flow
CREATE TABLE IF NOT EXISTS temp_login_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  state TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  token TEXT,
  user_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 minutes')
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_temp_login_states_state ON temp_login_states (state);
CREATE INDEX IF NOT EXISTS idx_temp_login_states_expires_at ON temp_login_states (expires_at);

-- Add RLS policy
ALTER TABLE temp_login_states ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for login flow
CREATE POLICY "Allow anonymous access for login flow" ON temp_login_states
  FOR ALL USING (true);

-- Add function to clean up expired states
CREATE OR REPLACE FUNCTION cleanup_expired_login_states()
RETURNS void AS $$
BEGIN
  DELETE FROM temp_login_states 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Add profiles table modifications for WeChat integration
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_openid TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_unionid TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_bound BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_info JSONB;

-- Create index for WeChat openid lookups
CREATE INDEX IF NOT EXISTS idx_profiles_wechat_openid ON profiles (wechat_openid);
