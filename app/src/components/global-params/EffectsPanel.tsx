import { EffectCard } from './EffectCard';
import { Panel } from '../Panel';
import { DelayDesign } from './DelayDesign';
import { ReverbDesign } from './ReverbDesign';
import { ChorusDesign } from './ChorusDesign'
import Bitcrush from '../../assets/svgs/bitcrush.svg?react'
import { usePatch } from '../../fm-canvas/patch-context';
import { DelayControls } from './DelayControls';
import { ReverbControls } from './ReverbControls';
import { ChorusControls } from './ChorusControls';



export function EffectsPanel() {
  const {patch, dispatch} = usePatch()
  return (
    <Panel spread stretch>
      <EffectCard label="Delay" design={<DelayDesign/>} enabled={patch.delayEnabled} onToggle={() => dispatch({ type: 'SET_DELAY', enabled: !patch.delayEnabled, ms: patch.delayMs, feedback: patch.delayFeedback, mix: patch.delayMix })}><DelayControls /></EffectCard>
      <EffectCard label="Reverb" design={<ReverbDesign/>} enabled={patch.reverbEnabled} onToggle={() => dispatch({ type: 'SET_REVERB', enabled: !patch.reverbEnabled, decay: patch.reverbDecay, damping: patch.reverbDamping, mix: patch.reverbMix })}><ReverbControls /></EffectCard>
      <EffectCard label="Chorus" design={<ChorusDesign/>} enabled={patch.chorusEnabled} onToggle={() => dispatch({ type: 'SET_CHORUS', enabled: !patch.chorusEnabled, depth: patch.chorusDepth, speed: patch.chorusSpeed, width: patch.chorusWidth, hpfCutoff: patch.chorusHpfCutoff, delayMs: patch.chorusDelayMs, reverbSend: patch.chorusReverbSend })}><ChorusControls /></EffectCard>
      <EffectCard label="Bitcrush" design={<Bitcrush width={100} height={100} />} enabled={patch.bitcrushEnabled} onToggle={() => dispatch({ type: 'SET_BITCRUSH', enabled: !patch.bitcrushEnabled, bits: patch.bitcrushBits, rate: patch.bitcrushRate })}>{null}</EffectCard>
    </Panel>
  );
}
