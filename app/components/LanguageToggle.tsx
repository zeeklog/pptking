'use client';import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Globe, Check } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

export function LanguageToggle() {
  const { t, changeLanguage, currentLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
    { code: 'en-US', name: 'English', flag: '🇺🇸' }
  ];

  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

  const handleLanguageChange = (languageCode: string) => {
    changeLanguage(languageCode);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-9 h-9 p-0 border border-purple-200 hover:bg-purple-50 dark:border-purple-700 dark:hover:bg-purple-900/20 rounded-full"
        >
          <Globe className="w-4 h-4" />
          <span className="sr-only">{t('common.language')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {languages.map((language) => (
          <DropdownMenuItem 
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={currentLanguage === language.code ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20' : ''}
          >
            <span className="mr-2">{language.flag}</span>
            {language.name}
            {currentLanguage === language.code && <Check className="w-4 h-4 ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
