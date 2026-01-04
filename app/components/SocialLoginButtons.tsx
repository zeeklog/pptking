'use client';import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Github, X, RefreshCw } from 'lucide-react';
import { useSocialAuth } from '@/hooks/useSocialAuth';
import { useEffect } from 'react';

export function SocialLoginButtons() {
  const { 
    loading, 
    wechatLoginState, 
    signInWithGitHub, 
    startWeChatLogin, 
    cancelWeChatLogin,
    cleanup 
  } = useSocialAuth();

  useEffect(() => {
    // 组件卸载时清理
    return cleanup;
  }, [cleanup]);

  return (
    <div className="space-y-6">
      {/* WeChat QR Code Login - 主要登录方式 */}
      <div className="space-y-3">
        <div className="text-center">
          <div className="flex justify-center items-center min-h-[280px] border-2 border-purple-200 rounded-xl bg-purple-50 hover:border-purple-300 transition-colors shadow-purple-sm">
            {!wechatLoginState ? (
              // 显示微信登录按钮
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-purple-md">
                  微
                </div>
                <Button
                  onClick={startWeChatLogin}
                  disabled={loading}
                  className="bg-gradient-primary hover:bg-gradient-to-r hover:from-purple-600 hover:to-purple-700 text-white px-8 py-2 rounded-lg shadow-purple-md hover:shadow-purple-lg transition-all duration-300"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      初始化中...
                    </>
                  ) : (
                    '微信扫码登录'
                  )}
                </Button>
              </div>
            ) : (
              // 显示二维码和状态
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <img 
                    src={wechatLoginState.qrUrl} 
                    alt="微信登录二维码" 
                    className="w-48 h-48 border rounded-lg"
                    onError={(e) => {
                      console.error('QR code failed to load:', wechatLoginState.qrUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  {wechatLoginState.polling && (
                    <div className="absolute inset-0 bg-black bg-opacity-10 rounded-lg flex items-center justify-center">
                      <div className="bg-white rounded-full p-2 shadow-purple-md">
                        <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm text-tech-600">请使用微信扫描二维码</p>
                 
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="bg-purple-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-tech-500">或使用其他方式</span>
        </div>
      </div>

      {/* GitHub Login - 次要登录方式 */}
      <div className="space-y-3">
        <Button
          variant="outline"
          onClick={signInWithGitHub}
          disabled={loading}
          className="w-full border-purple-200 hover:border-purple-300 hover:bg-purple-50 rounded-xl py-3 text-tech-700 shadow-purple-sm"
        >
          <Github className="w-5 h-5 mr-3" />
          GitHub登录
        </Button>
      </div>
    </div>
  );
}