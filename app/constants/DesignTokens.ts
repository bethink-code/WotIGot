export const Colors = {
  bgCanvas: '#FFFDF9',
  textDark: '#2D3436',
  textGrey: '#636E72',
  textMuted: '#95A5A6',
  
  greyLight: '#CCC',
  greyMid: '#AAA',
  greyDark: '#999',
  greyBorder: '#E0E0E0',
  greyBg: '#FAFAFA',
  greyInput: '#F8F9FA',
  
  green: '#00B894',
  greenSoft: '#E0F9F4',
  
  yellow: '#F7B731',
  yellowSoft: '#FFF5D8',
  
  orange: '#FA8231',
  orangeSoft: '#FFF0E6',
  
  danger: '#FF7675',
  dangerSoft: '#FEF2F2',
  
  white: '#FFFFFF',
  black: '#000000',
  
  inputBg: '#F8F9FA',
  cardBg: '#FFFFFF',
  overlayBg: 'rgba(0,0,0,0.4)',
  loaderBg: 'rgba(0,0,0,0.9)',
} as const;

export const Radii = {
  xs: 10,
  sm: 12,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  round: 44,
  pill: 100,
} as const;

export const Shadows = {
  card: {
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.04)',
    elevation: 2,
  },
  cardSoft: {
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.05)',
    elevation: 2,
  },
  float: {
    boxShadow: '0px 20px 40px rgba(0, 0, 0, 0.1)',
    elevation: 8,
  },
  toolbar: {
    boxShadow: '0px 20px 60px rgba(0, 0, 0, 0.2)',
    elevation: 12,
  },
  button: {
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
} as const;

export const Typography = {
  fontFamily: {
    thin: 'Poppins_100Thin',
    light: 'Poppins_300Light',
    regular: 'Poppins_400Regular',
    medium: 'Poppins_500Medium',
    semiBold: 'Poppins_600SemiBold',
    bold: 'Poppins_700Bold',
    extraBold: 'Poppins_800ExtraBold',
    black: 'Poppins_900Black',
    bodyRegular: 'DMSans_400Regular',
    bodyMedium: 'DMSans_500Medium',
    bodySemiBold: 'DMSans_600SemiBold',
    bodyBold: 'DMSans_700Bold',
  },
  
  fontSize: {
    caption: 12,
    body2: 14,
    body1: 14,
    subhead: 16,
    title: 20,
    headline: 24,
    display1: 34,
    display2: 45,
    display3: 56,
    xs: 10,
    sm: 11,
    base: 12,
    md: 14,
    lg: 15,
    xl: 16,
    xxl: 18,
    xxxl: 20,
    hero: 30,
    display: 40,
    splash: 48,
    logo: 64,
  },
  
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
} as const;

export const Spacing = {
  xxs: 4,
  xs: 8,
  sm: 10,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 40,
  screen: 60,
  pageHorizontal: 40,
} as const;

export const Sizes = {
  thumbnailSm: 50,
  thumbnail: 60,
  iconCircle: 160,
  iconMain: 70,
  iconBox: 50,
  fab: 60,
  fabBorder: 5,
  toolbar: {
    width: 320,
    height: 64,
  },
  navIcon: 26,
  dotActive: 24,
  dotInactive: 8,
  buttonNext: 60,
} as const;

export const HeaderColors = {
  portfolio: Colors.green,
  property: Colors.yellow,
  room: Colors.orange,
} as const;

export const BadgeColors = {
  portfolio: {
    bg: Colors.greenSoft,
    text: Colors.green,
  },
  property: {
    bg: Colors.yellowSoft,
    text: Colors.yellow,
  },
  room: {
    bg: Colors.orangeSoft,
    text: Colors.orange,
  },
} as const;
