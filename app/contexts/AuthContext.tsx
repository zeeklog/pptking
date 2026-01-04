'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // 在服务端渲染时返回默认值
    if (typeof window === 'undefined') {
      return {
        user: null,
        session: null,
        loading: true,
        signOut: async () => {},
      };
    }
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle WeChat callback FIRST - before setting up auth
    const handleWeChatCallback = async () => {
      if (typeof window === 'undefined') return;
      
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      
      console.log('AuthContext: Checking for WeChat callback...', { code: !!code, state: !!state });
      
      if (code && state) {
        console.log('AuthContext: WeChat callback detected, processing...');
        
        try {
          setLoading(true);
          
          // 验证state
          const savedState = typeof window !== 'undefined' ? localStorage.getItem('wechat_state') : null;
          console.log('AuthContext: Validating state...', { provided: state, saved: savedState });
          
          if (state !== savedState) {
            throw new Error('Invalid state parameter');
          }
          
          console.log('AuthContext: Calling wechat-callback with code:', code.substring(0, 10) + '...');
          
          // 调用Next.js API路由处理微信登录
          const response = await fetch('/api/auth/wechat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code, state })
          });

          const { data, error } = await response.json();

          if (error) {
            console.error('AuthContext: wechat-callback error:', error);
            throw new Error(error.message || '微信登录处理失败');
          }

          if (!data.success) {
            console.error('AuthContext: wechat-callback failed:', data);
            throw new Error(data.error || '微信登录失败');
          }

          console.log('AuthContext: wechat-callback success, setting session...');

          // 设置Supabase会话
          if (data.session) {
            const { error: sessionError } = await supabase.auth.setSession(data.session);
            
            if (sessionError) {
              console.error('AuthContext: Session error:', sessionError);
              throw new Error('设置会话失败');
            }
            
            console.log('AuthContext: Session set successfully');
          }

          toast({
            title: "微信登录成功",
            description: "欢迎使用 PPT Visionary AI",
          });

          // 清除URL参数
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // 清除localStorage中的state
          if (typeof window !== 'undefined') {
            localStorage.removeItem('wechat_state');
          }

        } catch (error: any) {
          console.error('AuthContext: WeChat callback error:', error);
          toast({
            title: "微信登录失败",
            description: error.message,
            variant: "destructive",
          });
          
          // 清除URL参数
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    };

    // Process WeChat callback first
    handleWeChatCallback();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('AuthContext: Auth state change:', event, !!session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthContext: Initial session:', !!session);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};