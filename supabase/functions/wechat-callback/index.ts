import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body for code and state
    const body = await req.json()
    const { code, state } = body

    if (!code || !state) {
      throw new Error('Missing code or state parameter')
    }

    console.log('WeChat callback received:', { code: code.substring(0, 10) + '...', state })

    // Create Supabase Admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Create regular Supabase client for OTP verification
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get WeChat app configuration
    const appid = Deno.env.get('WECHAT_APPID')
    const secret = Deno.env.get('WECHAT_APP_SECRET')
    
    if (!appid || !secret) {
      throw new Error('WeChat app configuration missing')
    }

    // Exchange code for access token
    const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appid}&secret=${secret}&code=${code}&grant_type=authorization_code`
    
    const tokenResponse = await fetch(tokenUrl)
    const tokenData = await tokenResponse.json()

    if (tokenData.errcode) {
      console.error('WeChat token error:', tokenData)
      throw new Error(`WeChat API error: ${tokenData.errmsg}`)
    }

    const { access_token, openid, unionid } = tokenData

    // Get user info from WeChat
    const userInfoUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}`
    const userInfoResponse = await fetch(userInfoUrl)
    const userInfo = await userInfoResponse.json()

    if (userInfo.errcode) {
      console.error('WeChat userinfo error:', userInfo)
      throw new Error(`WeChat userinfo error: ${userInfo.errmsg}`)
    }

    console.log('WeChat user info retrieved:', { openid, nickname: userInfo.nickname })

    const email = `${openid}@pptking.cn`
    let userId: string

    // Check if user exists in Supabase Auth by email using filter
    const { data: existingUsers, error: userError } = await supabaseAdmin.auth.admin.listUsers({
      filter: `email:${email}`,
      perPage: 1
    })
    
    if (userError) {
      console.error('Failed to get user by email:', userError)
      throw new Error('Failed to check existing user')
    }

    let user = existingUsers?.users?.[0] || null

    if (user) {
      // User exists in Auth, use existing user
      console.log('Existing user found in Auth:', user.id)
      userId = user.id
      
      // Update user metadata with latest WeChat info
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          wechat_openid: openid,
          wechat_unionid: unionid,
          wechat_info: userInfo,
          wechat_bound: true,
          provider: 'wechat'
        }
      })

      if (updateError) {
        console.error('Failed to update user metadata:', updateError)
      }
    } else {
      // Create new user
      console.log('Creating new user for openid:', openid)
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        email_confirm: true,
        user_metadata: {
          wechat_openid: openid,
          wechat_unionid: unionid,
          wechat_info: userInfo,
          wechat_bound: true,
          provider: 'wechat'
        }
      })

      if (createError || !newUser.user) {
        console.error('Failed to create user:', createError)
        throw new Error('Failed to create user account')
      }

      userId = newUser.user.id
      user = newUser.user
    }

    // Update or create profile
    console.log('Attempting to upsert profile for user:', userId);
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          user_id: userId,
          wechat_openid: openid,
          wechat_unionid: unionid,
          wechat_bound: true,
          wechat_info: userInfo,
          full_name: userInfo.nickname,
          avatar_url: userInfo.headimgurl
        },
        { onConflict: 'user_id' } // 指定冲突列
      );

    if (profileError) {
      console.error('Failed to upsert profile:', profileError, { userId, openid });
      throw new Error(`Profile update failed: ${profileError.message}`);
    }
    console.log('Profile upsert successful for user:', userId);

    // Step 1: Generate magic link token using Admin
    // Use 'signup' for new users, 'magiclink' for existing users
    // Step 1: Generate OTP token using Admin
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink', // 使用推荐的 'email' 类型
      email: email
    });

    if (linkError) {
      console.error('Failed to generate magic link:', linkError)
      throw new Error('Failed to generate session token')
    }

    if (!linkData?.properties?.hashed_token) {
      throw new Error('No valid token generated')
    }

    const hashedToken = linkData.properties.hashed_token

     // Step 2: Verify OTP to create session using regular client
    console.log('Attempting to verify OTP:', { type: 'email', hashedToken: hashedToken.substring(0, 10) + '...' });
    const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
      type: 'magiclink',
      token_hash: hashedToken
    });

    if (sessionError) {
      console.error('Failed to verify OTP:', sessionError)
      throw new Error('Failed to create session')
    }

    if (!sessionData.session) {
      throw new Error('No session created')
    }

    console.log('WeChat login completed successfully for user:', userId)

    // Return session data to frontend
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Login completed successfully',
        session: {
          access_token: sessionData.session.access_token,
          refresh_token: sessionData.session.refresh_token,
          expires_at: sessionData.session.expires_at
        },
        user_info: {
          user_id: userId,
          wechat_info: userInfo
        }
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('WeChat callback error:', error)
    
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
