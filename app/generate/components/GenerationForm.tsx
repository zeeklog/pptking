'use client';

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Sparkles, 
  Presentation, 
  Palette, 
  Wand2, 
  Loader2, 
  ArrowRight,
  Settings,
  Eye,
  Bot,
} from "lucide-react";
import { getPPTStyles, getColorSchemes } from '../constants';
import type { FormData } from '../types';

interface GenerationFormProps {
  formData: FormData;
  onFormDataChange: (data: FormData) => void;
  onGenerate: () => void;
  onEnhance: () => void;
  isGenerating: boolean;
  isGeneratingOutline: boolean;
}

export function GenerationForm({
  formData,
  onFormDataChange,
  onGenerate,
  onEnhance,
  isGenerating,
  isGeneratingOutline,
}: GenerationFormProps) {
  const { t } = useTranslation();
  const pptStyles = getPPTStyles(t);
  const colorSchemes = getColorSchemes(t);

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Options Card */}
      <Card className="template-card border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-4 lg:pb-6">
          <CardTitle className="flex items-center text-lg lg:text-2xl text-tech-800">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl lg:rounded-2xl flex items-center justify-center mr-3 lg:mr-4 shadow-md">
              <Settings className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600" />
            </div>
            {t('generate.ui.pptAttributePresets')}
          </CardTitle>
          {/* <CardDescription className="text-base lg:text-lg text-tech-600">
            {t('generate.ui.choosePPTStyleAndConfig')}
          </CardDescription> */}
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {/* Design Style Dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-tech-700 flex items-center">
              <Palette className="w-4 h-4 mr-2 text-purple-500" />
              {t('generate.ui.designStyle')}
            </label>
            <Select 
              value={formData.style} 
              onValueChange={(value) => onFormDataChange({...formData, style: value})}
            >
              <SelectTrigger className="input-glass h-12 text-base focus:border-purple-500 focus:ring-purple-500/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pptStyles.map((style) => (
                  <SelectItem key={style.value} value={style.value}>
                    <span className="flex items-center">
                      <span className="mr-2">{style.icon}</span>
                      {style.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Color Scheme Dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-tech-700 flex items-center">
              <Eye className="w-4 h-4 mr-2 text-purple-500" />
              {t('generate.ui.colorScheme')}
            </label>
            <Select 
              value={formData.colorScheme} 
              onValueChange={(value) => onFormDataChange({...formData, colorScheme: value})}
            >
              <SelectTrigger className="input-glass h-12 text-base focus:border-purple-500 focus:ring-purple-500/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {colorSchemes.map((scheme) => (
                  <SelectItem key={scheme.value} value={scheme.value}>
                    <div className="flex items-center space-x-2">
                      <div className={`w-4 h-4 rounded bg-gradient-to-r ${scheme.gradient}`}></div>
                      <span>{scheme.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Slide Count Dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-tech-700 flex items-center">
              <Presentation className="w-4 h-4 mr-2 text-purple-500" />
              {t('generate.ui.pageCount')}
            </label>
            <Select 
              value={formData.slideCount} 
              onValueChange={(value) => onFormDataChange({...formData, slideCount: value})}
            >
              <SelectTrigger className="input-glass h-12 text-base focus:border-purple-500 focus:ring-purple-500/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">{t('generate.ui.pages5')}</SelectItem>
                <SelectItem value="10">{t('generate.ui.pages10')}</SelectItem>
                <SelectItem value="15">{t('generate.ui.pages15')}</SelectItem>
                <SelectItem value="20">{t('generate.ui.pages20')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content Input Card */}
      <Card className="template-card border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-4 lg:pb-6">
          <CardTitle className="flex items-center text-lg lg:text-2xl text-tech-800">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl lg:rounded-2xl flex items-center justify-center mr-3 lg:mr-4 shadow-md">
              <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600" />
            </div>
            {t('generate.ui.oneClickPPTGeneration')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 lg:space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-tech-700 flex items-center">
                <Wand2 className="w-4 h-4 mr-2 text-purple-500" />
                {t('generate.ui.describePPTContent')}
              </label>
              <Button
                onClick={onEnhance}
                disabled={isGeneratingOutline || !formData.content.trim()}
                variant="outline"
                size="sm"
                className="text-purple-600 border-purple-200 hover:bg-purple-50"
              >
                {isGeneratingOutline ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('generate.ui.enhancing')}
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4 mr-2" />
                    {t('generate.ui.aiEnhancePrompt')}
                  </>
                )}
              </Button>
            </div>
            
            <div className="relative">
              <Textarea
                placeholder={t('generate.ui.quickSendHint', { 
                  shortcut: navigator.platform.toLowerCase().includes('mac') ? 
                    t('generate.ui.cmdEnter') : 
                    t('generate.ui.ctrlEnter') 
                }) + '（至少输入10个字符）'}
                value={formData.content}
                onChange={(e) => onFormDataChange({...formData, content: e.target.value})}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    if (!isGenerating && formData.content.trim()) {
                      onGenerate();
                    }
                  }
                }}
                className="input-glass min-h-40 text-base resize-none focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300 pr-16 pb-16"
              />
              
              {/* Floating send button */}
              <Button
                onClick={onGenerate}
                disabled={isGenerating || !formData.content.trim()}
                className="absolute bottom-3 right-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group border-0 p-0 px-3 flex items-center justify-center"
              >
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>{t('generate.ui.startGeneration')}</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

