'use client';

import { useTranslation } from "react-i18next";
import { Mail, Phone, ExternalLink, Zap, Sparkles } from "lucide-react";

export function Footer() {
  const { t } = useTranslation();
  const friendlyLinks = [
    { name: "Deepseek大模型", url: "https://www.deepseek.com" },
    { name: "Claude大模型", url: "https://claude.ai" },
    { name: "豆包大模型", url: "https://www.doubao.com" },
    { name: "中国知网", url: "https://www.cnki.net" },
    { name: "百度学术", url: "https://xueshu.baidu.com" },
    { name: "谷歌学术", url: "https://scholar.google.com" },
    { name: "万方数据", url: "https://www.wanfangdata.com.cn" },
    { name: "维普网", url: "https://www.cqvip.com" }
  ];

  const companyInfo = [
    { label: t('footer.companyName'), value: "PPTKING" },
    { label: t('footer.productName'), value: "PPTKING AI智能PPT生成平台" },
    { label: t('footer.customerService'), value: "0755-32867416", icon: Phone },
    { label: t('footer.customerEmail'), value: "support@pptking.cn", icon: Mail }
  ];

  const quickLinks = [
    { name: t('navigation.home'), path: "/" },
    { name: t('navigation.generate'), path: "/generate" },
    { name: t('navigation.copywriting'), path: "/copywriting" },
    { name: t('navigation.membership'), path: "/membership" },
    { name: t('navigation.help'), path: "/help" }
  ];

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container mx-auto px-4 py-8 lg:py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* 公司LOGO和信息 */}
          <div className="md:col-span-2 lg:col-span-1 space-y-4 lg:space-y-6">
            {/* LOGO */}
            <div className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <Zap className="w-5 h-5 lg:w-6 lg:h-6 text-white animate-pulse" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-2 h-2 lg:w-3 lg:h-3 text-white" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  PPTKING
                </span>
                <span className="text-xs lg:text-sm text-gray-400 -mt-1">AI智能PPT生成</span>
              </div>
            </div>

            {/* 公司信息 */}
            <div className="space-y-2 lg:space-y-3">
              {companyInfo.map((info, index) => (
                <div key={index} className="flex items-start space-x-2 lg:space-x-3 text-xs lg:text-sm">
                  {info.icon && (
                    <info.icon className="w-3 h-3 lg:w-4 lg:h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <span className="text-gray-400">{info.label}：</span>
                    <span className="text-gray-200">{info.value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 版权信息 */}
            <div className="pt-3 lg:pt-4 border-t border-gray-700/50">
              <p className="text-xs text-gray-400 leading-relaxed">
                © 2024 万睿智能科技
                <br />
                {t('footer.allRightsReserved')}
              </p>
            </div>
          </div>

          {/* 快捷链接 */}
          <div className="space-y-4 lg:space-y-6">
            <h3 className="text-base lg:text-lg font-semibold text-white flex items-center">
              <div className="w-1 h-4 lg:h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full mr-2 lg:mr-3"></div>
              {t('navigation.quickNavigation')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-3">
              {quickLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.path}
                  className="text-gray-300 hover:text-purple-400 transition-colors duration-300 text-xs lg:text-sm hover:translate-x-1 transform transition-transform"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>

          {/* 友情链接 */}
          <div className="space-y-4 lg:space-y-6">
            <h3 className="text-base lg:text-lg font-semibold text-white flex items-center">
              <div className="w-1 h-4 lg:h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full mr-2 lg:mr-3"></div>
              {t('navigation.friendlyLinks')}
            </h3>
            <div className="grid grid-cols-1 gap-2 lg:gap-3">
              {friendlyLinks.slice(0, 6).map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-blue-400 transition-colors duration-300 text-xs lg:text-sm flex items-center group hover:translate-x-1 transform transition-transform"
                >
                  <span>{link.name}</span>
                  <ExternalLink className="w-2 h-2 lg:w-3 lg:h-3 ml-1 lg:ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </div>

          {/* 联系我们 */}
          <div className="space-y-4 lg:space-y-6">
            <h3 className="text-base lg:text-lg font-semibold text-white flex items-center">
              <div className="w-1 h-4 lg:h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full mr-2 lg:mr-3"></div>
              {t('navigation.contactUs')}
            </h3>
            <div className="space-y-3 lg:space-y-4">
              <div className="p-3 lg:p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center space-x-2 lg:space-x-3 mb-2">
                  <Phone className="w-4 h-4 lg:w-5 lg:h-5 text-green-400" />
                  <span className="font-medium text-white text-sm lg:text-base">{t('footer.customerService')}</span>
                </div>
                <p className="text-gray-300 text-xs lg:text-sm">0755-32867416</p>
                <p className="text-xs text-gray-400 mt-1">{t('footer.workingHours')}</p>
              </div>

              <div className="p-3 lg:p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center space-x-2 lg:space-x-3 mb-2">
                  <Mail className="w-4 h-4 lg:w-5 lg:h-5 text-blue-400" />
                  <span className="font-medium text-white text-sm lg:text-base">{t('footer.customerEmail')}</span>
                </div>
                <p className="text-gray-300 text-xs lg:text-sm">support@pptking.cn</p>
                <p className="text-xs text-gray-400 mt-1">{t('footer.replyWithin24h')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 底部分割线和额外信息 */}
        <div className="mt-8 lg:mt-12 pt-6 lg:pt-8 border-t border-gray-700/50">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-xs lg:text-sm text-gray-400 text-center md:text-left">
              <p>{t('footer.dedicatedTo')}</p>
              <p className="mt-1">
                Make designing PPT{" "}
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Easier than breathing.</span>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs text-gray-500">
              <a href="/privacy" className="hover:text-purple-400 transition-colors">{t('footer.privacyPolicy')}</a>
              <span className="hidden sm:inline">|</span>
              <a href="/terms" className="hover:text-purple-400 transition-colors">{t('footer.serviceTerms')}</a>
              <span className="hidden sm:inline">|</span>
              <a href="/legal" className="hover:text-purple-400 transition-colors">{t('footer.legalNotice')}</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
