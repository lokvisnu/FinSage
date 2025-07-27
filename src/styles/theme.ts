// Modern black and white theme configuration
export const theme = {
    colors: {
        // Primary colors (using Tailwind slate)
        primary: {
            50: 'slate-50',
            100: 'slate-100',
            200: 'slate-200',
            300: 'slate-300',
            400: 'slate-400',
            500: 'slate-500',
            600: 'slate-600',
            700: 'slate-700',
            800: 'slate-800',
            900: 'slate-900',
            950: 'slate-950',
        },
        
        // Grayscale (using Tailwind zinc)
        gray: {
            50: 'zinc-50',
            100: 'zinc-100',
            200: 'zinc-200',
            300: 'zinc-300',
            400: 'zinc-400',
            500: 'zinc-500',
            600: 'zinc-600',
            700: 'zinc-700',
            800: 'zinc-800',
            900: 'zinc-900',
            950: 'zinc-950',
        },
        
        // Semantic colors
        white: 'white',
        black: 'black',
        
        // Status colors (Tailwind classes)
        success: 'emerald-500',
        error: 'red-500',
        warning: 'amber-500',
        info: 'blue-500',
    },
    
    gradients: {
        // Tailwind gradient classes
        darkToLight: 'bg-gradient-to-br from-zinc-900 to-zinc-700',
        lightToDark: 'bg-gradient-to-br from-zinc-100 to-zinc-500',
        subtle: 'bg-gradient-to-br from-zinc-50 to-zinc-100',
        card: 'bg-gradient-to-br from-white to-slate-50',
        dark: 'bg-gradient-to-br from-slate-900 to-slate-800',
        
        // Professional gradients
        professional: 'bg-gradient-to-br from-slate-100 to-slate-200',
        elegantDark: 'bg-gradient-to-br from-slate-800 to-slate-700',
        elegantLight: 'bg-gradient-to-br from-white to-slate-100',
    },
    
    shadows: {
        sm: 'shadow-sm',
        md: 'shadow-md',
        lg: 'shadow-lg',
        xl: 'shadow-xl',
        elegant: 'shadow-2xl',
        subtle: 'shadow',
    },
    
    spacing: {
        xs: 'p-2',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        xl: 'p-12',
        '2xl': 'p-16',
        '3xl': 'p-24',
    },
    
    borderRadius: {
        sm: 'rounded',
        md: 'rounded-lg',
        lg: 'rounded-xl',
        xl: 'rounded-2xl',
        '2xl': 'rounded-3xl',
    },
    
    typography: {
        fontFamily: {
            sans: 'font-sans',
            mono: 'font-mono',
        },
        fontSize: {
            xs: 'text-xs',
            sm: 'text-sm',
            base: 'text-base',
            lg: 'text-lg',
            xl: 'text-xl',
            '2xl': 'text-2xl',
            '3xl': 'text-3xl',
            '4xl': 'text-4xl',
            '5xl': 'text-5xl',
        },
    },
};

// CSS-in-JS helper functions
export const getGradient = (gradientName: keyof typeof theme.gradients) => ({
  background: theme.gradients[gradientName],
});

export const getColor = (colorPath: string) => {
  const keys = colorPath.split('.');
  let value: any = theme.colors;
  for (const key of keys) {
    value = value[key];
  }
  return value;
};

export const getShadow = (shadowName: keyof typeof theme.shadows) => ({
  boxShadow: theme.shadows[shadowName],
});

// Tailwind-compatible class generators
export const tw = {
  // Background classes
  bgPrimary: (shade: keyof typeof theme.colors.primary = 500) => `bg-slate-${shade}`,
  bgGray: (shade: keyof typeof theme.colors.gray = 500) => `bg-gray-${shade}`,
  
  // Text classes
  textPrimary: (shade: keyof typeof theme.colors.primary = 500) => `text-slate-${shade}`,
  textGray: (shade: keyof typeof theme.colors.gray = 500) => `text-gray-${shade}`,
  
  // Card styles
  card: 'bg-white border border-gray-200 rounded-xl shadow-sm',
  cardDark: 'bg-gray-900 border border-gray-800 rounded-xl shadow-sm',
  cardElegant: 'bg-gradient-to-br from-white to-gray-50 border border-gray-100 rounded-xl shadow-lg p-6',
  
  // Button styles
  button: {
    primary: 'bg-gray-900 hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-sm',
    outline: 'border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 font-medium py-2 px-4 rounded-lg transition-all duration-200',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-medium py-2 px-4 rounded-lg transition-all duration-200',
  },
  
  // Input styles
  input: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all duration-200',
  
  // Layout
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  section: 'py-8 sm:py-12 lg:py-16',
};

export default theme;
