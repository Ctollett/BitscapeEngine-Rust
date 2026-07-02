import { PanelSlider } from '../PanelSlider';
import { usePatch } from '../../fm-canvas/patch-context';

import { typography, colors } from '../../tokens'


export function ADSRSection() {

  const { patch, dispatch} = usePatch();

  const setEnv = (overrides: Partial<{ attack: number; decay: number; sustain: number; release: number }>) => {

    dispatch({
      type: 'SET_AMP_ENV',
      attack: patch.ampAttack,
      decay: patch.ampDecay,
      sustain: patch.ampSustain,
      release: patch.ampRelease,
      ...overrides,
    });
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', paddingTop: 24, paddingBottom: 24, paddingLeft: 24, paddingRight: 24, boxSizing: 'border-box' }}>
        <span style={{ ...typography.label.lg, lineHeight: 1, color: colors.text.muted, alignSelf: 'flex-start' }}>ADSR</span>
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 32, paddingTop: 16 }}>
      <PanelSlider color={colors.section.adsr} value={patch.ampAttack / 127} onChange={(v) => setEnv({ attack: v * 127 })} label="A" />
      <PanelSlider color={colors.section.adsr}  value={patch.ampDecay / 127} onChange={(v) => setEnv({ decay: v * 127 })} label="D" />
      <PanelSlider color={colors.section.adsr}  value={patch.ampSustain / 127} onChange={(v) => setEnv({ sustain: v * 127 })} label="S" />
      <PanelSlider color={colors.section.adsr}  value={patch.ampRelease / 127} onChange={(v) => setEnv({ release: v * 127 })} label="R" />
    </div>
    </div>
  );
}

