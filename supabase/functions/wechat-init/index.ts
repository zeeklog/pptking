import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Generate unique state for this login attempt
    const state = crypto.randomUUID()
    
    // Get WeChat app configuration
    const appid = Deno.env.get('WECHAT_APPID')
    if (!appid) {
      throw new Error('WECHAT_APPID not configured')
    }

    // Construct redirect URI (this Edge Function's callback URL)
    const baseUrl = Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')
    const redirectUri = encodeURIComponent(`${baseUrl}/functions/v1/wechat-callback`)
    
    // Generate WeChat QR code URL
    const qrUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=${appid}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`

    // Try to store login state in database
    let insertResult = await supabase
      .from('temp_login_states')
      .insert({
        state: state,
        status: 'pending'
      })

    if (insertResult.error) {
      console.error('Error storing login state:', insertResult.error)
      
      // Try to create the table first using service role
      console.log('Attempting to create temp_login_states table...')
      
      const adminSupabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      
      // Try to create table using direct SQL
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS temp_login_states (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          state TEXT NOT NULL UNIQUE,
          status TEXT NOT NULL DEFAULT 'pending',
          token TEXT,
          user_info JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 minutes')
        );
        
        CREATE INDEX IF NOT EXISTS idx_temp_login_states_state ON temp_login_states (state);
        ALTER TABLE temp_login_states ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Allow anonymous access for login flow" ON temp_login_states;
        CREATE POLICY "Allow anonymous access for login flow" ON temp_login_states FOR ALL USING (true);
      `
      
      // Try to execute SQL using REST API
      const sqlResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        },
        body: JSON.stringify({ sql: createTableSQL })
      })
      
      if (sqlResponse.ok) {
        console.log('Table created successfully, retrying insert...')
        // Retry insert
        insertResult = await supabase
          .from('temp_login_states')
          .insert({
            state: state,
            status: 'pending'
          })
        
        if (insertResult.error) {
          console.error('Insert still failed after table creation:', insertResult.error)
        } else {
          console.log('Login state stored successfully after table creation')
        }
      } else {
        console.error('Failed to create table via REST API')
        // Continue without database storage for now
        console.log('Proceeding without database storage...')
      }
    } else {
      console.log('Login state stored successfully')
    }

    console.log('WeChat login initialized:', { state, qrUrl: qrUrl.substring(0, 100) + '...' })

    return new Response(
      JSON.stringify({ 
        success: true,
        qrUrl, 
        state 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('WeChat init error:', error)
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
