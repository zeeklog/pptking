import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface WeChatLoginState {
  qrUrl: string;
  state: string;
  polling: boolean;
}

export const useSocialAuth = () => {
  const [loading, setLoading] = useState(false);
  const [wechatLoginState, setWechatLoginState] = useState<WeChatLoginState | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const signInWithGitHub = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        toast({
          title: "GitHub登录失败",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "GitHub登录失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startWeChatLogin = async () => {
    try {
      setLoading(true);
      
      // 调用 wechat-init Edge Function 获取二维码
      const { data, error } = await supabase.functions.invoke('wechat-init', {
        method: 'GET'
      });

      if (error) {
        throw new Error(error.message || '初始化微信登录失败');
      }

      if (!data.success) {
        throw new Error(data.error || '初始化微信登录失败');
      }

      const { qrUrl, state } = data;
      
      setWechatLoginState({
        qrUrl,
        state,
        polling: true
      });

      // 开始轮询登录状态
      startPolling(state);

      toast({
        title: "微信登录",
        description: "请使用微信扫描二维码登录",
      });

    } catch (error: any) {
      console.error('WeChat login init error:', error);
      toast({
        title: "微信登录初始化失败",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const startPolling = (state: string) => {
    // 清除之前的轮询
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    let attempts = 0;
    const maxAttempts = 150; // 5分钟 (150 * 2秒)

    pollIntervalRef.current = setInterval(async () => {
      attempts++;
      
      if (attempts > maxAttempts) {
        // 超时停止轮询
        stopPolling();
        toast({
          title: "微信登录超时",
          description: "请重新获取二维码",
          variant: "destructive",
        });
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('wechat-poll', {
          body: { state }
        });

        if (error) {
          console.error('Poll error:', error);
          return;
        }

        if (data.success && data.status === 'success') {
          // 登录成功
          stopPolling();
          
          // 设置 Supabase session
          if (data.token && data.user_info?.refresh_token) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: data.token,
              refresh_token: data.user_info.refresh_token
            });

            if (sessionError) {
              console.error('Session error:', sessionError);
              toast({
                title: "登录失败",
                description: "设置会话失败，请重试",
                variant: "destructive",
              });
              return;
            }
          }

          toast({
            title: "微信登录成功",
            description: "欢迎使用 PPT Visionary AI",
          });

          // 刷新页面或触发路由跳转
          window.location.reload();
          
        } else if (data.status === 'expired' || data.status === 'not_found') {
          // 状态过期或不存在
          stopPolling();
          toast({
            title: "二维码已过期",
            description: "请重新获取二维码",
            variant: "destructive",
          });
        } else if (data.status === 'error') {
          // 登录失败
          stopPolling();
          toast({
            title: "微信登录失败",
            description: data.message || "请重试",
            variant: "destructive",
          });
        }
        // 如果是 pending 状态，继续轮询

      } catch (error: any) {
        console.error('Poll request error:', error);
        // 网络错误等，继续轮询
      }
    }, 2000); // 每2秒轮询一次
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setWechatLoginState(null);
    setLoading(false);
  };

  const cancelWeChatLogin = () => {
    stopPolling();
    toast({
      title: "已取消微信登录",
      description: "您可以选择其他登录方式",
    });
  };

  // 组件卸载时清理
  const cleanup = () => {
    stopPolling();
  };

  return {
    loading,
    wechatLoginState,
    signInWithGitHub,
    startWeChatLogin,
    cancelWeChatLogin,
    cleanup,
  };
};