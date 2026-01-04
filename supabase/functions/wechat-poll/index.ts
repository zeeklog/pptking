import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body or query parameters
    let state: string | null = null

    if (req.method === 'POST') {
      const body = await req.json()
      state = body.state
    } else if (req.method === 'GET') {
      const url = new URL(req.url)
      state = url.searchParams.get('state')
    }

    if (!state) {
      throw new Error('Missing state parameter')
    }

    console.log('Polling login state:', state)

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Check login state
    const { data: loginState, error } = await supabase
      .from('temp_login_states')
      .select('status, token, user_info, expires_at')
      .eq('state', state)
      .single()

    if (error) {
      console.error('Error fetching login state:', error)
      // State not found or expired
      return new Response(
        JSON.stringify({ 
          success: false,
          status: 'not_found',
          message: 'Login state not found or expired'
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Check if state has expired
    const expiresAt = new Date(loginState.expires_at)
    const now = new Date()
    
    if (now > expiresAt) {
      // Clean up expired state
      await supabase
        .from('temp_login_states')
        .delete()
        .eq('state', state)

      return new Response(
        JSON.stringify({ 
          success: false,
          status: 'expired',
          message: 'Login session has expired'
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    if (loginState.status === 'success' && loginState.token) {
      console.log('Login successful, cleaning up state:', state)
      
      // Clean up the login state record
      await supabase
        .from('temp_login_states')
        .delete()
        .eq('state', state)

      return new Response(
        JSON.stringify({ 
          success: true,
          status: 'success',
          token: loginState.token,
          user_info: loginState.user_info,
          message: 'Login completed successfully'
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    } else if (loginState.status === 'error') {
      console.log('Login failed for state:', state)
      
      // Clean up failed state
      await supabase
        .from('temp_login_states')
        .delete()
        .eq('state', state)

      return new Response(
        JSON.stringify({ 
          success: false,
          status: 'error',
          message: 'Login failed'
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    } else {
      // Still pending
      console.log('Login still pending for state:', state)
      
      return new Response(
        JSON.stringify({ 
          success: false,
          status: 'pending',
          message: 'Login is still pending'
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

  } catch (error) {
    console.error('WeChat poll error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        status: 'error',
        message: error.message 
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
