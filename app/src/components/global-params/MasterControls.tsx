import { ADSRSection } from './ADSRSection';

import { spacing } from '../../tokens';

export function MasterControls() {
  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', gap: spacing.sm }}>
      <ADSRSection />
    </div>
  );
}
