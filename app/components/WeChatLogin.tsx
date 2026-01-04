'use client';import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { RefreshCw, X } from 'lucide-react';

export function WeChatLogin() {
  const [qrUrl, setQrUrl] = useState<string>('');

  // 组件挂载时生成二维码URL
  useEffect(() => {
    generateWeChatQRCode();
  }, []);

  // 生成微信二维码URL
  const generateWeChatQRCode = () => {
    const appid = process.env.NEXT_PUBLIC_WECHAT_APPID;
    const redirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_SUPABASE_WECHAT_CALLBACK || '');
    const state = crypto.randomUUID(); // 生成唯一state

    // 存储state到localStorage用于验证
    localStorage.setItem('wechat_state', state);

    const qrCodeUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=${appid}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`;

    setQrUrl(qrCodeUrl);
    console.log('Generated WeChat QR code URL:', qrCodeUrl);
  };

  const refreshQRCode = () => {
    generateWeChatQRCode();
    toast({
      title: "二维码已刷新",
      description: "请重新扫描二维码",
    });
  };

  const cancelWeChatLogin = () => {
    localStorage.removeItem('wechat_state');
    setQrUrl(''); // 清除二维码
    toast({
      title: "已取消微信登录",
      description: "您可以选择其他登录方式",
    });
  };

  return (
    <div className="flex justify-center items-center min-h-[320px] border-2 overflow-hidden
     border-purple-50 rounded-xl bg-purple-50 hover:border-purple-300 transition-colors shadow-purple-sm">
      {qrUrl ? (
        // 显示二维码
        <div className="flex flex-col items-center space-y-4 w-full">
          <div className="relative flex justify-center  w-full">
            <iframe
              src={qrUrl}
              title="微信登录二维码"
              className="w-[100%] h-96 rounded-lg bg-white"
              frameBorder="0"
              scrolling="no"
              allow="camera; microphone"
              sandbox="allow-scripts allow-same-origin allow-forms allow-top-navigation allow-top-navigation-by-user-activation"
              onLoad={() => {
                console.log('WeChat QR iframe loaded successfully');
              }}
              onError={(e) => {
                console.error('QR iframe failed to load:', qrUrl);
              }}
            />
          </div>
        </div>
      ) : (
        // 显示错误状态
        <div className="flex flex-col items-center space-y-4">
          <div className="text-center">
            <p className="text-sm text-error-600 mb-2">微信登录初始化失败</p>
            <Button
              onClick={generateWeChatQRCode}
              className="bg-gradient-primary hover:bg-gradient-to-r hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg shadow-purple-md hover:shadow-purple-lg transition-all duration-300"
            >
              重新尝试
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
