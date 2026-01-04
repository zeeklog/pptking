'use client';

import { Z_INDEX } from '../constants/z-index';

interface SelectionBoxProps {
  start: { x: number; y: number };
  end: { x: number; y: number };
}

export function SelectionBox({ start, end }: SelectionBoxProps) {
  const left = Math.min(start.x, end.x);
  const top = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  return (
    <div
      className="absolute border-2 border-purple-500 bg-purple-500/10 pointer-events-none"
      style={{
        left,
        top,
        width,
        height,
        zIndex: Z_INDEX.SELECTION_BOX,
      }}
    />
  );
}