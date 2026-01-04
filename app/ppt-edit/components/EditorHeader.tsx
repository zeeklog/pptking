'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Save,
  Download,
  Upload,
  Play,
  Palette,
  FileText,
  Image,
  Video,
  Music,
  ChevronDown,
  Settings,
  Share2,
  Eye,
  Layers,
  Hash,
  FolderOpen,
  Printer,
  Search
} from 'lucide-react';
import { usePPTStore } from '../store/ppt-store';
import { PresentationMode } from './PresentationMode';
import { AIAssistant } from './AIAssistant';
import { KeyboardShortcutsHelper } from './KeyboardShortcutsHelper';
import { FileImporterComponent } from './FileImporter';
import { SearchReplace } from './SearchReplace';
import { SymbolPanel } from './SymbolPanel';
import { SelectionPane } from './SelectionPane';
import { SectionManager } from './SectionManager';
import { PrintDialog } from './PrintDialog';
import { cn } from '@/lib/utils';
import { Z_INDEX } from '../../ppt-edit/constants/z-index';


export function EditorHeader() {
  const { t } = useTranslation();
  const [titleEditing, setTitleEditing] = useState(false);
  const [showPresentation, setShowPresentation] = useState(false);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [editMenuOpen, setEditMenuOpen] = useState(false);
  const [viewMenuOpen, setViewMenuOpen] = useState(false);

  // 监听演示模式快捷键
  useEffect(() => {
    const handleStartPresentation = () => {
      setShowPresentation(true);
    };

    window.addEventListener('startPresentation', handleStartPresentation);
    
    return () => {
      window.removeEventListener('startPresentation', handleStartPresentation);
    };
  }, []);
  
  const {
    title,
    setTitle,
    createNewPPT,
    exportToPPTX,
    exportToPDF,
    exportToImages,
    exportToJSON,
    exportProgress,
    printSlides,
  } = usePPTStore();

  const handleTitleSave = (newTitle: string) => {
    setTitle(newTitle);
    setTitleEditing(false);
  };


  return (
    <header 
      className="h-14 border-b border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-900 flex items-center px-4 gap-4 shadow-sm"
      style={{ 
        boxShadow: '0 2px 4px rgba(99, 102, 241, 0.05)'
      }}
    >
      {/* 文件操作区域 */}
      <div className="flex items-center gap-2">
        <DropdownMenu open={fileMenuOpen} onOpenChange={setFileMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-3 hover:bg-purple-50 hover:text-purple-700">
              {t('pptEditor.header.file')} <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 p-2" style={{ zIndex: Z_INDEX.CONTEXT_MENU }}>
            {/* 保存区域 */}
            <div className="mb-3">
              <div className="text-xs font-medium text-gray-500 mb-2 px-2">{t('pptEditor.header.saveAndManage')}</div>
              <DropdownMenuItem onClick={() => {createNewPPT(); setFileMenuOpen(false);}} className="rounded-lg h-10 px-3">
                <FileText className="w-4 h-4 mr-3 text-blue-500" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">新建演示文稿</span>
                  <span className="text-xs text-gray-500">创建一个空白PPT</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {setFileMenuOpen(false);}} className="rounded-lg h-10 px-3">
                <Save className="w-4 h-4 mr-3 text-green-500" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{t('pptEditor.header.save')}</span>
                  <span className="text-xs text-gray-500">{t('pptEditor.header.saveDesc')}</span>
                </div>
              </DropdownMenuItem>
            </div>

            <div className="h-px bg-gray-200 my-2" />

            {/* 导入区域 */}
            <div className="mb-3">
              <div className="text-xs font-medium text-gray-500 mb-2 px-2">{t('pptEditor.header.importFiles')}</div>
              <DropdownMenuItem asChild>
                <FileImporterComponent 
                  trigger={
                    <div className="flex items-center w-full cursor-pointer rounded-lg h-10 px-3 hover:bg-gray-50">
                      <Upload className="w-4 h-4 mr-3 text-blue-500" />
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">{t('pptEditor.header.importPPTX')}</span>
                        <span className="text-xs text-gray-500">{t('pptEditor.header.importPPTXDesc')}</span>
                      </div>
                    </div>
                  }
                  onImportSuccess={() => setFileMenuOpen(false)}
                />
              </DropdownMenuItem>
            </div>

            <div className="h-px bg-gray-200 my-2" />

            {/* 导出区域 */}
            <div className="mb-3">
              <div className="text-xs font-medium text-gray-500 mb-2 px-2">{t('pptEditor.header.exportFormats')}</div>
              
              <DropdownMenuItem 
                onClick={() => {exportToPPTX(); setFileMenuOpen(false);}} 
                disabled={exportProgress.isExporting}
                className="rounded-lg h-10 px-3"
              >
                <Download className="w-4 h-4 mr-3 text-orange-500" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{t('pptEditor.header.exportPowerPoint')}</span>
                  <span className="text-xs text-gray-500">{t('pptEditor.header.exportPowerPointDesc')}</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => {exportToPDF(); setFileMenuOpen(false);}} 
                disabled={exportProgress.isExporting}
                className="rounded-lg h-10 px-3"
              >
                <Download className="w-4 h-4 mr-3 text-red-500" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{t('pptEditor.header.exportPDF')}</span>
                  <span className="text-xs text-gray-500">{t('pptEditor.header.exportPDFDesc')}</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => {exportToImages(); setFileMenuOpen(false);}} 
                disabled={exportProgress.isExporting}
                className="rounded-lg h-10 px-3"
              >
                <Image className="w-4 h-4 mr-3 text-purple-500" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{t('pptEditor.header.exportImages')}</span>
                  <span className="text-xs text-gray-500">{t('pptEditor.header.exportImagesDesc')}</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => {exportToJSON(); setFileMenuOpen(false);}}
                className="rounded-lg h-10 px-3"
              >
                <FileText className="w-4 h-4 mr-3 text-gray-500" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{t('pptEditor.header.exportJSON')}</span>
                  <span className="text-xs text-gray-500">{t('pptEditor.header.exportJSONDesc')}</span>
                </div>
              </DropdownMenuItem>
            </div>

            <div className="h-px bg-gray-200 my-2" />

            {/* 打印区域 */}
            <div>
              <div className="text-xs font-medium text-gray-500 mb-2 px-2">{t('pptEditor.header.printOptions')}</div>
              
              <DropdownMenuItem 
                onClick={() => {printSlides('slides'); setFileMenuOpen(false);}}
                className="rounded-lg h-10 px-3"
              >
                <Printer className="w-4 h-4 mr-3 text-gray-600" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{t('pptEditor.header.printSlides')}</span>
                  <span className="text-xs text-gray-500">{t('pptEditor.header.printSlidesDesc')}</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => {printSlides('handouts', 6); setFileMenuOpen(false);}}
                className="rounded-lg h-10 px-3"
              >
                <Printer className="w-4 h-4 mr-3 text-gray-600" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{t('pptEditor.header.printHandouts')}</span>
                  <span className="text-xs text-gray-500">{t('pptEditor.header.printHandoutsDesc')}</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <PrintDialog 
                  trigger={
                    <div className="flex items-center w-full rounded-lg h-10 px-3 hover:bg-gray-50 cursor-pointer">
                      <Printer className="w-4 h-4 mr-3 text-gray-600" />
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">{t('pptEditor.header.printOptions')}</span>
                        <span className="text-xs text-gray-500">{t('pptEditor.header.printOptionsDesc')}</span>
                      </div>
                    </div>
                  }
                />
              </DropdownMenuItem>
            </div>

            {exportProgress.isExporting && (
              <>
                <div className="h-px bg-gray-200 my-2" />
                <div className="px-3 py-2">
                  <div className="flex items-center gap-2 text-sm text-purple-600">
                    <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    {t('pptEditor.header.exporting')} {exportProgress.type?.toUpperCase()} ...
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div 
                      className="bg-purple-500 h-1.5 rounded-full transition-all duration-300" 
                      style={{ width: `${exportProgress.progress}%` }}
                    ></div>
                  </div>
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu open={editMenuOpen} onOpenChange={setEditMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-3 hover:bg-purple-50 hover:text-purple-700">
              {t('pptEditor.header.edit')} <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 p-2" style={{ zIndex: Z_INDEX.CONTEXT_MENU }}>
            {/* 编辑操作区域 */}
            <div className="mb-3">
              <div className="text-xs font-medium text-gray-500 mb-2 px-2">{t('pptEditor.header.textEditing')}</div>
              <DropdownMenuItem asChild>
                <SearchReplace 
                  trigger={
                    <div className="flex items-center w-full cursor-pointer rounded-lg h-10 px-3 hover:bg-gray-50">
                      <Search className="w-4 h-4 mr-3 text-blue-500" />
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">{t('pptEditor.header.findReplace')}</span>
                        <span className="text-xs text-gray-500">{t('pptEditor.header.findReplaceDesc')}</span>
                      </div>
                    </div>
                  }
                />
              </DropdownMenuItem>
            </div>

            <div className="h-px bg-gray-200 my-2" />

            {/* 更多编辑选项 */}
            <div>
              <div className="text-xs font-medium text-gray-500 mb-2 px-2">{t('pptEditor.header.advancedFeatures')}</div>
              <DropdownMenuItem onClick={() => setEditMenuOpen(false)} className="rounded-lg h-10 px-3">
                <Settings className="w-4 h-4 mr-3 text-gray-500" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{t('pptEditor.header.editorSettings')}</span>
                  <span className="text-xs text-gray-500">{t('pptEditor.header.editorSettingsDesc')}</span>
                </div>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu open={viewMenuOpen} onOpenChange={setViewMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-3 hover:bg-purple-50 hover:text-purple-700">
              {t('pptEditor.header.view')} <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 p-2" style={{ zIndex: Z_INDEX.CONTEXT_MENU }}>
            {/* 预览选项 */}
            <div className="mb-3">
              <div className="text-xs font-medium text-gray-500 mb-2 px-2">{t('pptEditor.header.previewMode')}</div>
              <DropdownMenuItem onClick={() => {setShowPresentation(true); setViewMenuOpen(false);}} className="rounded-lg h-10 px-3">
                <Eye className="w-4 h-4 mr-3 text-green-500" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{t('pptEditor.header.previewAll')}</span>
                  <span className="text-xs text-gray-500">{t('pptEditor.header.previewAllDesc')}</span>
                </div>
              </DropdownMenuItem>
            </div>

            <div className="h-px bg-gray-200 my-2" />

            {/* 窗格管理 */}
            <div className="mb-3">
              <div className="text-xs font-medium text-gray-500 mb-2 px-2">{t('pptEditor.header.paneManagement')}</div>
              <DropdownMenuItem asChild>
                <SelectionPane 
                  trigger={
                    <div className="flex items-center w-full cursor-pointer rounded-lg h-10 px-3 hover:bg-gray-50">
                      <Layers className="w-4 h-4 mr-3 text-blue-500" />
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">{t('pptEditor.header.selectionPane')}</span>
                        <span className="text-xs text-gray-500">{t('pptEditor.header.selectionPaneDesc')}</span>
                      </div>
                    </div>
                  }
                />
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <SectionManager 
                  trigger={
                    <div className="flex items-center w-full cursor-pointer rounded-lg h-10 px-3 hover:bg-gray-50">
                      <FolderOpen className="w-4 h-4 mr-3 text-orange-500" />
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">{t('pptEditor.header.sectionManager')}</span>
                        <span className="text-xs text-gray-500">{t('pptEditor.header.sectionManagerDesc')}</span>
                      </div>
                    </div>
                  }
                />
              </DropdownMenuItem>
            </div>

            <div className="h-px bg-gray-200 my-2" />

            {/* 帮助选项 */}
            <div>
              <div className="text-xs font-medium text-gray-500 mb-2 px-2">{t('pptEditor.header.helpAndSettings')}</div>
              <DropdownMenuItem asChild>
                <KeyboardShortcutsHelper 
                  trigger={
                    <div className="flex items-center w-full cursor-pointer rounded-lg h-10 px-3 hover:bg-gray-50">
                      <Settings className="w-4 h-4 mr-3 text-gray-500" />
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">{t('pptEditor.header.keyboardHelp')}</span>
                        <span className="text-xs text-gray-500">{t('pptEditor.header.keyboardHelpDesc')}</span>
                      </div>
                    </div>
                  }
                />
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>


        {/* AI助手 */}
        <AIAssistant 
          trigger={
            <Button variant="ghost" size="sm" className="h-8 px-3 text-purple-600 hover:text-purple-700 hover:bg-purple-50">
              {t('pptEditor.header.aiAssistant')}
            </Button>
          }
        />
      </div>


      <Separator orientation="vertical" className="h-6" />

      {/* 演示文稿标题 */}
      <div className="flex-1 flex items-center justify-center">
        {titleEditing ? (
          <Input
            defaultValue={title}
            className="h-8 w-64 text-center bg-transparent border-none focus:border-purple-300"
            onBlur={(e) => handleTitleSave(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleTitleSave(e.currentTarget.value);
              }
              if (e.key === 'Escape') {
                setTitleEditing(false);
              }
            }}
            autoFocus
          />
        ) : (
          <button
            className="px-3 py-1 text-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
            onClick={() => setTitleEditing(true)}
          >
            {title}
          </button>
        )}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* 放映和分享 */}
      <div className="flex items-center gap-2">
        
        <Button
          className="h-8 px-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
          onClick={() => setShowPresentation(true)}
        >
          <Play className="w-4 h-4 mr-1" />
          {t('pptEditor.header.play')}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 border-purple-300 text-purple-600 hover:bg-purple-50"
          onClick={() => {}}
        >
          <Share2 className="w-4 h-4 mr-1" />
          {t('pptEditor.header.share')}
        </Button>
      </div>

      {/* 放映模式 */}
      <PresentationMode
        isOpen={showPresentation}
        onClose={() => setShowPresentation(false)}
        mode="audience"
      />
    </header>
  );
}