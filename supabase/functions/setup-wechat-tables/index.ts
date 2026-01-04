import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Use service role key for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Setting up WeChat tables...')

    // Try to create temp_login_states table by inserting a test record
    // If the table doesn't exist, we'll get an error and know we need to create it
    const testState = crypto.randomUUID()
    
    const { error: testError } = await supabase
      .from('temp_login_states')
      .insert({
        state: testState,
        status: 'test'
      })

    if (testError) {
      console.log('temp_login_states table does not exist, will inform user to create manually')
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Database tables need to be created manually',
          instructions: {
            message: 'Please execute the following SQL in your Supabase Dashboard > SQL Editor:',
            sql: `-- Create temp_login_states table for WeChat login flow
CREATE TABLE IF NOT EXISTS temp_login_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  state TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  token TEXT,
  user_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 minutes')
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_temp_login_states_state ON temp_login_states (state);
CREATE INDEX IF NOT EXISTS idx_temp_login_states_expires_at ON temp_login_states (expires_at);

-- Enable RLS
ALTER TABLE temp_login_states ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for login flow
DROP POLICY IF EXISTS "Allow anonymous access for login flow" ON temp_login_states;
CREATE POLICY "Allow anonymous access for login flow" ON temp_login_states FOR ALL USING (true);

-- Add WeChat columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_openid TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_unionid TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_bound BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_info JSONB;

-- Create index for WeChat openid lookups
CREATE INDEX IF NOT EXISTS idx_profiles_wechat_openid ON profiles (wechat_openid);`
          }
        }),
        { 
          status: 400,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    } else {
      // Clean up test record
      await supabase
        .from('temp_login_states')
        .delete()
        .eq('state', testState)

      console.log('temp_login_states table exists and is accessible')
    }

    // Test profiles table for WeChat columns
    const { error: profileError } = await supabase
      .from('profiles')
      .select('wechat_openid')
      .limit(1)

    let profilesNeedUpdate = false
    if (profileError && profileError.message.includes('wechat_openid')) {
      profilesNeedUpdate = true
      console.log('profiles table needs WeChat columns')
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'WeChat tables setup check completed',
        temp_login_states_exists: true,
        profiles_has_wechat_columns: !profilesNeedUpdate,
        ready_for_wechat_login: true
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Setup error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})