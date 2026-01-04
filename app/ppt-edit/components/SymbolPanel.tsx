'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Z_INDEX } from '../constants/z-index';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Hash,
  Search
} from 'lucide-react';
import { usePPTStore } from '../store/ppt-store';

interface SymbolPanelProps {
  trigger?: React.ReactNode;
}

// 符号分类
const SYMBOL_CATEGORIES = {
  math: {
    name: '数学符号',
    symbols: [
      '∑', '∏', '∫', '∂', '∆', '∇', '√', '∞', '≈', '≠', '≤', '≥', 
      '±', '×', '÷', '°', 'π', 'α', 'β', 'γ', 'δ', 'θ', 'λ', 'μ',
      'σ', 'φ', 'ψ', 'ω', 'Α', 'Β', 'Γ', 'Δ', 'Θ', 'Λ', 'Σ', 'Φ', 'Ψ', 'Ω'
    ]
  },
  arrows: {
    name: '箭头符号',
    symbols: [
      '→', '←', '↑', '↓', '↗', '↖', '↘', '↙', '⇒', '⇐', '⇑', '⇓',
      '⇔', '↔', '↕', '⟶', '⟵', '⟷', '↺', '↻', '⤴', '⤵'
    ]
  },
  currency: {
    name: '货币符号',
    symbols: [
      '$', '¢', '£', '¤', '¥', '€', '₹', '₽', '₩', '₪', '₫', '₡', '₦', '₨'
    ]
  },
  punctuation: {
    name: '标点符号',
    symbols: [
      '…', '–', '—', "'", "'", '"', '"', '‚', '„', '‹', '›', '«', '»',
      '¡', '¿', '§', '¶', '†', '‡', '•', '‰', '′', '″', '‴'
    ]
  },
  misc: {
    name: '其他符号',
    symbols: [
      '©', '®', '™', '℠', '℡', '№', '℮', '⁰', '¹', '²', '³', '⁴', '⁵',
      '⁶', '⁷', '⁸', '⁹', '⁺', '⁻', '⁼', '⁽', '⁾', '½', '⅓', '⅔', '¼', '¾'
    ]
  },
  emoji: {
    name: '表情符号',
    symbols: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊',
      '😇', '🥰', '😍', '🤩', '😘', '😗', '☺', '😚', '😙', '🥲', '😋', '😛',
      '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑'
    ]
  }
};

export function SymbolPanel({ trigger }: SymbolPanelProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('math');

  const { addElement, canvasScale } = usePPTStore();

  // 插入符号
  const insertSymbol = (symbol: string) => {
    const element = {
      type: 'text' as const,
      x: 100,
      y: 100,
      width: 100,
      height: 50,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      zIndex: Date.now(),
      text: {
        content: symbol,
        fontSize: 24,
        fontFamily: 'Arial, sans-serif',
        color: '#374151',
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
        align: 'center' as const,
        lineHeight: 1.5,
        letterSpacing: 0,
      },
    };

    addElement(element);
    setIsOpen(false);
  };

  // 过滤符号
  const getFilteredSymbols = () => {
    if (!searchQuery.trim()) {
      return SYMBOL_CATEGORIES[selectedCategory as keyof typeof SYMBOL_CATEGORIES]?.symbols || [];
    }

    const allSymbols = Object.values(SYMBOL_CATEGORIES).flatMap(category => category.symbols);
    return allSymbols.filter(symbol => 
      symbol.includes(searchQuery) || 
      symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredSymbols = getFilteredSymbols();

  const defaultTrigger = (
    <Button variant="ghost" size="sm">
      <Hash className="w-4 h-4 mr-2" />
      符号
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]" style={{ zIndex: Z_INDEX.DIALOG }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="w-4 h-4" />
            插入符号
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 搜索 */}
          <div className="space-y-2">
            <Label htmlFor="symbol-search" className="text-sm">搜索符号</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="symbol-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索符号..."
                className="pl-10"
              />
            </div>
          </div>

          {/* 符号分类和列表 */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-6">
              {Object.entries(SYMBOL_CATEGORIES).map(([key, category]) => (
                <TabsTrigger key={key} value={key} className="text-xs">
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <div className="mt-4">
              <ScrollArea className="h-64 w-full rounded-md border p-4">
                <div className="grid grid-cols-8 gap-2">
                  {filteredSymbols.map((symbol, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="h-12 w-12 p-0 text-xl hover:bg-purple-50 hover:text-purple-600"
                      onClick={() => insertSymbol(symbol)}
                      title={`插入符号: ${symbol}`}
                    >
                      {symbol}
                    </Button>
                  ))}
                </div>
                
                {filteredSymbols.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    {searchQuery ? '未找到匹配的符号' : '选择一个分类查看符号'}
                  </div>
                )}
              </ScrollArea>
            </div>
          </Tabs>

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