// ============================================================
// Design Tokens — generated from design-system/global.json
//                              & design-system/tx-84.json
// ============================================================

// ------------------------------------------------------------
// Primitives
// ------------------------------------------------------------

export const primitive = {
  neutral: {
    white:    '#F7F5F0',
    gray50:   '#EFEFEB',
    gray100:  '#E2E0DA',
    gray200:  '#C8C5BC',
    gray300:  '#A8A49A',
    gray400:  '#7A766C',
    gray500:  '#504D46',
    gray600:  '#353330',
    gray700:  '#232220',
    gray800:  '#161514',
    gray900:  '#0E0D0C',
    black:    '#0A0908',
  },
  red: {
    50:  '#FAEDE9',
    100: '#F5D0C8',
    200: '#EBA898',
    400: '#E8735A',
    500: '#D94F2B',
    600: '#B83F22',
    700: '#8C2F18',
    800: '#5E1F10',
  },
  blue: {
    50:  '#E8EEF9',
    100: '#C8D5F5',
    200: '#95AEEE',
    400: '#5A82E8',
    500: '#2B5FD9',
    600: '#1F4AB0',
    700: '#153680',
    800: '#0C2254',
  },
  teal: {
    50:  '#E5F4F2',
    100: '#C0E6E1',
    200: '#88CAC2',
    400: '#65B8AC',
    500: '#3B9E8E',
    600: '#2C7A6E',
    700: '#1E564E',
    800: '#103530',
  },
  yellow: {
    50:  '#FDF8E0',
    100: '#FAF0B0',
    200: '#F5E070',
    400: '#F0D258',
    500: '#E8C840',
    600: '#C8A800',
    700: '#8A7000',
    800: '#544400',
  },
  magenta: {
    400: '#CC77AA',
    500: '#B84A8E',
  },
} as const

// ------------------------------------------------------------
// Semantic Tokens
// ------------------------------------------------------------

export const colors = {
  bg: {
    app:    '#D8D3CA',
    canvas: '#1C1A18',
    panel:  '#E8E3D9',
    overlay: '#D8D2C4',
  },
  border: {
    default: primitive.neutral.gray100,
    subtle:  primitive.neutral.gray50,
    strong:  primitive.neutral.gray200,
    canvas:  '#D8D5CC',
  },
  text: {
    primary:   primitive.neutral.gray800,
    secondary: '#58595B',
    muted:     primitive.neutral.gray400,
    dim:       primitive.neutral.gray300,
    inverse:   primitive.neutral.white,
    title:     '#2A2520',
  },
  control: {
    track:     '#D4CEC4',
    handle:    primitive.neutral.white,
    indicator: primitive.neutral.gray400,
  },
  operator: {
    carrier:  primitive.blue[500],
    modA:     primitive.red[500],
    modB1:    primitive.teal[500],
    modB2:    primitive.yellow[500],
    inactive: primitive.neutral.gray300,
    bg:       primitive.neutral.gray50,
  },
  section: {
    adsr:   '#4E7AAA',
    filter: '#5A7870',
    lfo1:   '#4A8C5C',
    lfo2:   '#6AAF72',
  },
  state: {
    hover:  'rgba(10, 9, 8, 0.05)',
    active: 'rgba(217, 79, 43, 0.12)',
    focus:  primitive.blue[500],
  },
} as const

// ------------------------------------------------------------
// Sizing
// ------------------------------------------------------------

export const sizing = {
  knob: {
    sm: 54,
    md: 48,
    lg: 112,
  },
  slider: {
    width: 4,
    panel:  { height: 104 },
    canvas: { height: 140, handle: 12 },
  },
  operator: 120,
} as const

// ------------------------------------------------------------
// Spacing
// ------------------------------------------------------------

export const spacing = {
  xs:  4,
  sm:  8,
  md:  20,
  lg:  24,
  xl:  32,
  '2xl': 48,
  '3xl': 64,
} as const

// ------------------------------------------------------------
// Border
// ------------------------------------------------------------

export const borderWidth = {
  thin:    1,
  default: 2,
  thick:   3,
  control: 1.5,
  track:   2.5,
  heavy: 4
} as const

export const borderRadius = {
  sm:   4,
  md:   8,
  lg:   24,
  full: 9999,
} as const

// ------------------------------------------------------------
// Panel Layout
// ------------------------------------------------------------

export const panel = {
  padding: {
    x: 24,  // horizontal padding inside a panel
    y: 24,  // vertical padding inside a panel
  },
  gap: {
    control: 24,  // gap between controls within a panel
    group:   48,  // gap between logical groups within a panel
  },
  section: {
    labelHeight: 16,  // height reserved for the section label row
  },
} as const

// ------------------------------------------------------------
// Typography
// ------------------------------------------------------------

export const typography = {
  label: {
    sm: {
      fontFamily:    'PP Fraktion Mono',
      fontWeight:    '700',
      fontSize:      8,
      letterSpacing: 2,
      textTransform: 'uppercase' as const,
    },
    lg: {
      fontFamily:    'PP Fraktion Mono',
      fontWeight:    '700',
      fontSize:      12,
      letterSpacing: 2,
      textTransform: 'uppercase' as const,
    },
  },
  title: {
    sm: {
      fontFamily:    'PP Mori',
      fontWeight:    '600',
      fontSize:      24,
      letterSpacing: 2,
      textTransform: 'uppercase' as const,
    },
    lg: {
      fontFamily:    'PP Mori',
      fontWeight:    '600',
      fontSize:      120,
      letterSpacing: 2,
      textTransform: 'uppercase' as const,
    },
  },
} as const
