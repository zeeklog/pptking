'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Z_INDEX } from '../constants/z-index';
import { 
  Search, 
  Replace, 
  ChevronDown, 
  ChevronUp,
  X
} from 'lucide-react';
import { usePPTStore } from '../store/ppt-store';

interface SearchReplaceProps {
  trigger?: React.ReactNode;
}

export function SearchReplace({ trigger }: SearchReplaceProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);

  // 监听快捷键事件
  useEffect(() => {
    const handleOpenSearchReplace = () => {
      setIsOpen(true);
    };

    window.addEventListener('openSearchReplace', handleOpenSearchReplace);
    
    return () => {
      window.removeEventListener('openSearchReplace', handleOpenSearchReplace);
    };
  }, []);

  const {
    slides,
    activeSlideIndex,
    updateElement,
    setActiveSlide,
    selectElements,
    updateElementBatch,
  } = usePPTStore();

  // 查找匹配的文本元素
  const findMatches = () => {
    if (!searchText.trim()) {
      setTotalMatches(0);
      setCurrentMatch(0);
      return [];
    }

    const matches: Array<{
      slideIndex: number;
      elementId: string;
      element: any;
      content: string;
      matchIndex: number;
    }> = [];

    slides.forEach((slide, slideIndex) => {
      slide.elements.forEach(element => {
        if (element.type === 'text' && element.text?.content) {
          const content = element.text.content;
          const searchPattern = matchCase ? searchText : searchText.toLowerCase();
          const contentToSearch = matchCase ? content : content.toLowerCase();
          
          let startIndex = 0;
          let matchIndex = 0;
          
          while (true) {
            const index = contentToSearch.indexOf(searchPattern, startIndex);
            if (index === -1) break;
            
            // 检查整词匹配
            if (wholeWord) {
              const beforeChar = index > 0 ? content[index - 1] : ' ';
              const afterChar = index + searchPattern.length < content.length 
                ? content[index + searchPattern.length] 
                : ' ';
              
              if (!/\s/.test(beforeChar) || !/\s/.test(afterChar)) {
                startIndex = index + 1;
                continue;
              }
            }
            
            matches.push({
              slideIndex,
              elementId: element.id,
              element,
              content,
              matchIndex,
            });
            
            startIndex = index + 1;
            matchIndex++;
          }
        }
      });
    });

    setTotalMatches(matches.length);
    if (matches.length > 0 && currentMatch >= matches.length) {
      setCurrentMatch(0);
    }

    return matches;
  };

  // 查找下一个
  const findNext = () => {
    const matches = findMatches();
    if (matches.length === 0) return;

    const nextMatch = (currentMatch + 1) % matches.length;
    setCurrentMatch(nextMatch);
    
    const match = matches[nextMatch];
    setActiveSlide(match.slideIndex);
    selectElements([match.elementId]);
  };

  // 查找上一个
  const findPrevious = () => {
    const matches = findMatches();
    if (matches.length === 0) return;

    const prevMatch = currentMatch === 0 ? matches.length - 1 : currentMatch - 1;
    setCurrentMatch(prevMatch);
    
    const match = matches[prevMatch];
    setActiveSlide(match.slideIndex);
    selectElements([match.elementId]);
  };

  // 替换当前
  const replaceCurrent = () => {
    const matches = findMatches();
    if (matches.length === 0 || currentMatch >= matches.length) return;

    const match = matches[currentMatch];
    const newContent = match.content.replace(
      new RegExp(
        matchCase ? searchText : searchText, 
        matchCase ? 'g' : 'gi'
      ),
      replaceText
    );

    updateElement(match.elementId, {
      text: {
        ...match.element.text,
        content: newContent,
      },
    });

    // 重新查找以更新匹配数量
    setTimeout(() => findMatches(), 100);
  };

  // 全部替换
  const replaceAll = () => {
    const matches = findMatches();
    if (matches.length === 0) return;

    const updates = matches.map(match => {
      const newContent = match.content.replace(
        new RegExp(
          matchCase ? searchText : searchText, 
          matchCase ? 'g' : 'gi'
        ),
        replaceText
      );

      return {
        elementId: match.elementId,
        updates: {
          text: {
            ...match.element.text,
            content: newContent,
          },
        },
      };
    });

    updateElementBatch(updates, '批量替换文本');
    
    // 清空搜索
    setSearchText('');
    setReplaceText('');
    setTotalMatches(0);
    setCurrentMatch(0);
  };

  const defaultTrigger = (
    <Button variant="ghost" size="sm">
      <Search className="w-4 h-4 mr-2" />
      查找替换
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" style={{ zIndex: Z_INDEX.DIALOG }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            查找和替换
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 查找 */}
          <div className="space-y-2">
            <Label htmlFor="search-text" className="text-sm">查找内容</Label>
            <div className="flex gap-2">
              <Input
                id="search-text"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setTimeout(() => findMatches(), 100);
                }}
                placeholder="输入要查找的文本..."
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={findNext}
                disabled={totalMatches === 0}
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={findPrevious}
                disabled={totalMatches === 0}
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
            </div>
            {totalMatches > 0 && (
              <div className="text-xs text-gray-500">
                第 {currentMatch + 1} 个，共 {totalMatches} 个匹配项
              </div>
            )}
          </div>

          {/* 替换 */}
          <div className="space-y-2">
            <Label htmlFor="replace-text" className="text-sm">替换为</Label>
            <div className="flex gap-2">
              <Input
                id="replace-text"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                placeholder="输入替换文本..."
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={replaceCurrent}
                disabled={totalMatches === 0}
              >
                替换
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={replaceAll}
                disabled={totalMatches === 0}
              >
                全部替换
              </Button>
            </div>
          </div>

          {/* 选项 */}
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="match-case"
                checked={matchCase}
                onCheckedChange={(checked) => {
                  setMatchCase(checked as boolean);
                  setTimeout(() => findMatches(), 100);
                }}
              />
              <Label htmlFor="match-case" className="text-sm">区分大小写</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="whole-word"
                checked={wholeWord}
                onCheckedChange={(checked) => {
                  setWholeWord(checked as boolean);
                  setTimeout(() => findMatches(), 100);
                }}
              />
              <Label htmlFor="whole-word" className="text-sm">全字匹配</Label>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              关闭
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}