import { colors } from '../tokens';
import SaveIcon from '../assets/svgs/save.svg?react';
import MenuIcon from '../assets/svgs/menu.svg?react';
import { MenuList } from './UI/MenuList/MenuList';
import { useState, useEffect, useRef } from 'react';
import type { Option } from '../fm-canvas/types';

const W = 44;
const H = 20;
const R = 6;
const MID = W / 2; // 22
const S = colors.text.title;

// All arcs are 90° clockwise (sweep=1).
// Left "C": full outline of left rounded rect, minus the right vertical edge.
const LEFT = `
  M ${MID - R} 0
  A ${R} ${R} 0 0 1 ${MID} ${R}
  M ${MID} ${H - R}
  A ${R} ${R} 0 0 1 ${MID - R} ${H}
  L ${R} ${H}
  A ${R} ${R} 0 0 1 0 ${H - R}
  L 0 ${R}
  A ${R} ${R} 0 0 1 ${R} 0
  L ${MID - R} 0
`.trim();

// Right "C": full outline of right rounded rect, minus the left vertical edge.
const RIGHT = `
  M ${MID} ${R}
  A ${R} ${R} 0 0 1 ${MID + R} 0
  L ${W - R} 0
  A ${R} ${R} 0 0 1 ${W} ${R}
  L ${W} ${H - R}
  A ${R} ${R} 0 0 1 ${W - R} ${H}
  L ${MID + R} ${H}
  A ${R} ${R} 0 0 1 ${MID} ${H - R}
`.trim();

interface SaveButtonProps {
  onOpen: () => void
  onMenuSelect: (value: string) => void
}

export function SaveButton({ onOpen, onMenuSelect }: SaveButtonProps) {

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setIsMenuOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])
  const menuItems: Option[]  = [{label: 'Save As', value: 'Save as'}, {label: 'Delete', value: 'Delete'}, {label: 'Rename', value: 'Rename'}, {label: 'Init', value: 'Init'}, {label: 'Export', value: 'Export'}, {label: 'Import', value: 'Import'} ]

  const handleMenuOpen = () => {
    setIsMenuOpen(true)
  }

  const handleMenuClose = () => {
    setIsMenuOpen(false)
  }

  const handleSelect = (option: Option) => {
    setIsMenuOpen(false)
    onMenuSelect(option.value)
  }

  return (
    <div style={{ position: 'relative', width: W, height: H }}>
<div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
        <button onClick={onOpen} style={{ flex: 1, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <SaveIcon />
        </button>
        <button ref={menuRef} onClick={isMenuOpen ? handleMenuClose : handleMenuOpen} style={{ position: 'relative', flex: 1, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MenuIcon width={12} height={12} />
          {isMenuOpen && (
            <MenuList onSelect={handleSelect} options={menuItems} />
          )}
        </button>
      </div>
      <svg width={W} height={H} viewBox="-0.5 -0.5 45 21" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <path d={LEFT} stroke={S} strokeWidth={1} fill="none" />
        <path d={RIGHT} stroke={S} strokeWidth={1} fill="none" />
      </svg>
    </div>
  );
}
