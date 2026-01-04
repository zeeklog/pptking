"use client";

import { useTranslation } from "react-i18next";
import { WelcomeLogo } from "./logo";

export function Loading(props: { noLogo?: boolean }) {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white dark:bg-gray-900">
      {!props.noLogo && (
        <div className="flex flex-col items-center mb-8">
          <WelcomeLogo size={96} />
          <div className="text-2xl font-bold text-gray-800 dark:text-white mt-4">
            PPT Visionary AI
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {t('chat.subtitle')}
          </div>
        </div>
      )}
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      <div className="text-gray-600 dark:text-gray-400 mt-4">
        {t('common.loading')}
      </div>
    </div>
  );
}
