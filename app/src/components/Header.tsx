import { PresetSelect } from './PresetSelect';
import { MasterOutput } from './MasterOutput';
import { spacing, typography, colors } from '../tokens'
import LogoSmall from '../assets/svgs/logo-small.svg?react'

export function Header() {
  return (
    <div style={{ width: 1200, height: 125, color: colors.text.primary, display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <div style={{ paddingBottom: spacing.md }}>
        <LogoSmall width={50} height={29} style={{ display: 'block' }} />
      </div>
      {/* Divider */}
      <hr style={{ margin: 0 }} />
      {/* Main row — 3 columns, 3 shared rows: pill/title | category/subtitle | dots */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gridTemplateRows: '28px 12px', width: '100%', flex: 1, alignContent: 'center', columnGap: spacing['3xl'], rowGap: spacing.sm, }}>
        {/* Title column — spans both rows via subgrid */}
        <div style={{ gridColumn: 1, gridRow: '1 / 3', display: 'grid', gridTemplateRows: 'subgrid', alignItems: 'center' }}>
          <span style={{ ...typography.title.sm, fontSize: 28, color: colors.text.title, lineHeight: 1, display: 'block' }}>TX-04</span>
          <span style={{ ...typography.label.sm, fontSize: 8, color: colors.text.title, lineHeight: 1, display: 'block' }}>BROWSER-BASED FM SOUND DESIGN INSTRUMENT</span>
        </div>
        {/* PresetSelect — spans both rows via subgrid */}
        <PresetSelect />
        {/* MasterOutput — spans both rows */}
        <MasterOutput />
      </div>
    </div>
  );
}
