export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Check if required environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Validate environment variables
if (!supabaseUrl  || !supabaseAnonKey) {
  console.error('Missing required Supabase environment variables:', {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
    hasAnonKey: !!supabaseAnonKey
  });
}

// Create Supabase clients only if environment variables are available
let supabaseAdmin: any = null;
let supabase: any = null;

if (supabaseUrl && supabaseServiceKey && supabaseAnonKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export async function POST(request: NextRequest) {
  // Check if Supabase clients are properly initialized
  if (!supabaseAdmin || !supabase) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Supabase configuration is missing. Please check environment variables.' 
      },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { code, state } = body;

    if (!code || !state) {
      return NextResponse.json(
        { success: false, error: 'Missing code or state parameter' },
        { status: 400 }
      );
    }

    console.log('WeChat callback received:', { code: code.substring(0, 10) + '...', state });

    // 获取微信应用配置
    const appid = process.env.WECHAT_APPID;
    const secret = process.env.WECHAT_APP_SECRET;
    
    if (!appid || !secret) {
      return NextResponse.json(
        { success: false, error: 'WeChat app configuration missing' },
        { status: 500 }
      );
    }

    // 交换code获取access_token
    const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appid}&secret=${secret}&code=${code}&grant_type=authorization_code`;
    
    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (tokenData.errcode) {
      console.error('WeChat token error:', tokenData);
      return NextResponse.json(
        { success: false, error: `WeChat API error: ${tokenData.errmsg}` },
        { status: 400 }
      );
    }

    const { access_token, openid, unionid } = tokenData;

    // 获取用户信息
    const userInfoUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}`;
    const userInfoResponse = await fetch(userInfoUrl);
    const userInfo = await userInfoResponse.json();

    if (userInfo.errcode) {
      console.error('WeChat userinfo error:', userInfo);
      return NextResponse.json(
        { success: false, error: `WeChat userinfo error: ${userInfo.errmsg}` },
        { status: 400 }
      );
    }

    console.log('WeChat user info retrieved:', { openid, nickname: userInfo.nickname });

    const email = `${openid}@pptking.cn`;
    let userId: string;

    // 检查用户是否已存在
    const { data: existingUsers, error: userError } = await supabaseAdmin.auth.admin.listUsers({
      filter: `email:${email}`,
      perPage: 1
    });
    
    if (userError) {
      console.error('Failed to get user by email:', userError);
      return NextResponse.json(
        { success: false, error: 'Failed to check existing user' },
        { status: 500 }
      );
    }

    let user = existingUsers?.users?.[0] || null;

    if (user) {
      // 用户已存在，使用现有用户
      console.log('Existing user found in Auth:', user.id);
      userId = user.id;
      
      // 更新用户元数据
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          wechat_openid: openid,
          wechat_unionid: unionid,
          wechat_info: userInfo,
          wechat_bound: true,
          provider: 'wechat'
        }
      });

      if (updateError) {
        console.error('Failed to update user metadata:', updateError);
      }
    } else {
      // 创建新用户
      console.log('Creating new user for openid:', openid);
      
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
      });

      if (createError || !newUser.user) {
        console.error('Failed to create user:', createError);
        return NextResponse.json(
          { success: false, error: 'Failed to create user account' },
          { status: 500 }
        );
      }

      userId = newUser.user.id;
      user = newUser.user;
    }

    // 更新或创建用户资料
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
        { onConflict: 'user_id' }
      );

    if (profileError) {
      console.error('Failed to upsert profile:', profileError, { userId, openid });
      return NextResponse.json(
        { success: false, error: `Profile update failed: ${profileError.message}` },
        { status: 500 }
      );
    }
    console.log('Profile upsert successful for user:', userId);

    // 生成magic link token
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email
    });

    if (linkError) {
      console.error('Failed to generate magic link:', linkError);
      return NextResponse.json(
        { success: false, error: 'Failed to generate session token' },
        { status: 500 }
      );
    }

    if (!linkData?.properties?.hashed_token) {
      return NextResponse.json(
        { success: false, error: 'No valid token generated' },
        { status: 500 }
      );
    }

    const hashedToken = linkData.properties.hashed_token;

    // 验证OTP创建会话
    console.log('Attempting to verify OTP:', { type: 'email', hashedToken: hashedToken.substring(0, 10) + '...' });
    const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
      type: 'magiclink',
      token_hash: hashedToken
    });

    if (sessionError) {
      console.error('Failed to verify OTP:', sessionError);
      return NextResponse.json(
        { success: false, error: 'Failed to create session' },
        { status: 500 }
      );
    }

    if (!sessionData.session) {
      return NextResponse.json(
        { success: false, error: 'No session created' },
        { status: 500 }
      );
    }

    console.log('WeChat login completed successfully for user:', userId);

    // 返回会话数据
    return NextResponse.json({
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
    });

  } catch (error: any) {
    console.error('WeChat callback error:', error);
    
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
