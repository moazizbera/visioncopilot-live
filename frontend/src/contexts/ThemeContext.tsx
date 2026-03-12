import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type ThemeName = 
  | 'light' 
  | 'dark' 
  | 'ocean' 
  | 'sunset' 
  | 'forest' 
  | 'midnight' 
  | 'rose'
  | 'amber'

export interface ThemeColors {
  name: ThemeName
  displayName: string
  emoji: string
  
  // Background colors
  bgPrimary: string
  bgSecondary: string
  bgTertiary: string
  
  // Panel colors
  panelBg: string
  panelBorder: string
  panelShadow: string
  
  // Text colors
  textPrimary: string
  textSecondary: string
  textTertiary: string
  
  // Accent/Brand colors
  accentPrimary: string
  accentSecondary: string
  accentGradient: string
  
  // Status colors
  success: string
  warning: string
  error: string
  info: string
  
  // Interactive elements
  buttonBg: string
  buttonHover: string
  buttonText: string
  
  // Chat message colors
  userMessageBg: string
  aiMessageBg: string
  systemMessageBg: string
}

const themes: Record<ThemeName, ThemeColors> = {
  light: {
    name: 'light',
    displayName: 'Light',
    emoji: '☀️',
    bgPrimary: '#f8fafc',
    bgSecondary: '#f1f5f9',
    bgTertiary: '#e2e8f0',
    panelBg: '#ffffff',
    panelBorder: '#e2e8f0',
    panelShadow: 'rgba(0, 0, 0, 0.1)',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textTertiary: '#94a3b8',
    accentPrimary: '#3b82f6',
    accentSecondary: '#6366f1',
    accentGradient: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    buttonBg: '#3b82f6',
    buttonHover: '#2563eb',
    buttonText: '#ffffff',
    userMessageBg: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
    aiMessageBg: '#f1f5f9',
    systemMessageBg: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
  },
  
  dark: {
    name: 'dark',
    displayName: 'Dark',
    emoji: '🌙',
    bgPrimary: '#0f172a',
    bgSecondary: '#1e293b',
    bgTertiary: '#334155',
    panelBg: '#1e293b',
    panelBorder: '#334155',
    panelShadow: 'rgba(0, 0, 0, 0.5)',
    textPrimary: '#ffffff',
    textSecondary: '#e2e8f0',
    textTertiary: '#94a3b8',
    accentPrimary: '#60a5fa',
    accentSecondary: '#818cf8',
    accentGradient: 'linear-gradient(135deg, #60a5fa 0%, #818cf8 100%)',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa',
    buttonBg: '#60a5fa',
    buttonHover: '#3b82f6',
    buttonText: '#ffffff',
    userMessageBg: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
    aiMessageBg: '#334155',
    systemMessageBg: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
  },
  
  ocean: {
    name: 'ocean',
    displayName: 'Ocean',
    emoji: '🌊',
    bgPrimary: '#ecfeff',
    bgSecondary: '#cffafe',
    bgTertiary: '#a5f3fc',
    panelBg: '#ffffff',
    panelBorder: '#67e8f9',
    panelShadow: 'rgba(6, 182, 212, 0.2)',
    textPrimary: '#083344',
    textSecondary: '#0e7490',
    textTertiary: '#155e75',
    accentPrimary: '#06b6d4',
    accentSecondary: '#0891b2',
    accentGradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    success: '#14b8a6',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
    buttonBg: '#06b6d4',
    buttonHover: '#0891b2',
    buttonText: '#ffffff',
    userMessageBg: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    aiMessageBg: '#cffafe',
    systemMessageBg: 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)',
  },
  
  sunset: {
    name: 'sunset',
    displayName: 'Sunset',
    emoji: '🌅',
    bgPrimary: '#fff7ed',
    bgSecondary: '#ffedd5',
    bgTertiary: '#fed7aa',
    panelBg: '#ffffff',
    panelBorder: '#fdba74',
    panelShadow: 'rgba(251, 146, 60, 0.2)',
    textPrimary: '#431407',
    textSecondary: '#7c2d12',
    textTertiary: '#9a3412',
    accentPrimary: '#f97316',
    accentSecondary: '#ec4899',
    accentGradient: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
    success: '#84cc16',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#f97316',
    buttonBg: '#f97316',
    buttonHover: '#ea580c',
    buttonText: '#ffffff',
    userMessageBg: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
    aiMessageBg: '#ffedd5',
    systemMessageBg: 'linear-gradient(135deg, #a855f7 0%, #f97316 100%)',
  },
  
  forest: {
    name: 'forest',
    displayName: 'Forest',
    emoji: '🌲',
    bgPrimary: '#f0fdf4',
    bgSecondary: '#dcfce7',
    bgTertiary: '#bbf7d0',
    panelBg: '#ffffff',
    panelBorder: '#86efac',
    panelShadow: 'rgba(34, 197, 94, 0.2)',
    textPrimary: '#052e16',
    textSecondary: '#14532d',
    textTertiary: '#166534',
    accentPrimary: '#22c55e',
    accentSecondary: '#10b981',
    accentGradient: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
    buttonBg: '#22c55e',
    buttonHover: '#16a34a',
    buttonText: '#ffffff',
    userMessageBg: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
    aiMessageBg: '#dcfce7',
    systemMessageBg: 'linear-gradient(135deg, #84cc16 0%, #22c55e 100%)',
  },
  
  midnight: {
    name: 'midnight',
    displayName: 'Midnight',
    emoji: '🌃',
    bgPrimary: '#0f0a1e',
    bgSecondary: '#1a1333',
    bgTertiary: '#2d1b69',
    panelBg: '#1a1333',
    panelBorder: '#4c1d95',
    panelShadow: 'rgba(124, 58, 237, 0.3)',
    textPrimary: '#f5f3ff',
    textSecondary: '#e9d5ff',
    textTertiary: '#c4b5fd',
    accentPrimary: '#8b5cf6',
    accentSecondary: '#6366f1',
    accentGradient: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#818cf8',
    buttonBg: '#8b5cf6',
    buttonHover: '#7c3aed',
    buttonText: '#ffffff',
    userMessageBg: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
    aiMessageBg: '#2d1b69',
    systemMessageBg: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
  },
  
  rose: {
    name: 'rose',
    displayName: 'Rose',
    emoji: '🌹',
    bgPrimary: '#fff1f2',
    bgSecondary: '#ffe4e6',
    bgTertiary: '#fecdd3',
    panelBg: '#ffffff',
    panelBorder: '#fda4af',
    panelShadow: 'rgba(244, 63, 94, 0.2)',
    textPrimary: '#4c0519',
    textSecondary: '#881337',
    textTertiary: '#9f1239',
    accentPrimary: '#f43f5e',
    accentSecondary: '#ec4899',
    accentGradient: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#ec4899',
    buttonBg: '#f43f5e',
    buttonHover: '#e11d48',
    buttonText: '#ffffff',
    userMessageBg: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)',
    aiMessageBg: '#ffe4e6',
    systemMessageBg: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)',
  },
  
  amber: {
    name: 'amber',
    displayName: 'Amber',
    emoji: '✨',
    bgPrimary: '#fffbeb',
    bgSecondary: '#fef3c7',
    bgTertiary: '#fde68a',
    panelBg: '#ffffff',
    panelBorder: '#fcd34d',
    panelShadow: 'rgba(245, 158, 11, 0.2)',
    textPrimary: '#451a03',
    textSecondary: '#78350f',
    textTertiary: '#92400e',
    accentPrimary: '#f59e0b',
    accentSecondary: '#d97706',
    accentGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    buttonBg: '#f59e0b',
    buttonHover: '#d97706',
    buttonText: '#ffffff',
    userMessageBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    aiMessageBg: '#fef3c7',
    systemMessageBg: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)',
  },
}

interface ThemeContextType {
  theme: ThemeColors
  themeName: ThemeName
  setTheme: (themeName: ThemeName) => void
  allThemes: ThemeColors[]
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    const saved = localStorage.getItem('visioncopilot-theme')
    return (saved as ThemeName) || 'dark'
  })

  const theme = themes[themeName]

  useEffect(() => {
    localStorage.setItem('visioncopilot-theme', themeName)
    
    // Apply theme colors as CSS variables
    const root = document.documentElement
    root.style.setProperty('--bg-primary', theme.bgPrimary)
    root.style.setProperty('--bg-secondary', theme.bgSecondary)
    root.style.setProperty('--bg-tertiary', theme.bgTertiary)
    root.style.setProperty('--panel-bg', theme.panelBg)
    root.style.setProperty('--panel-border', theme.panelBorder)
    root.style.setProperty('--text-primary', theme.textPrimary)
    root.style.setProperty('--text-secondary', theme.textSecondary)
    root.style.setProperty('--text-tertiary', theme.textTertiary)
    root.style.setProperty('--accent-primary', theme.accentPrimary)
    root.style.setProperty('--accent-secondary', theme.accentSecondary)
  }, [theme, themeName])

  const setTheme = (newTheme: ThemeName) => {
    setThemeName(newTheme)
  }

  const allThemes = Object.values(themes)

  return (
    <ThemeContext.Provider value={{ theme, themeName, setTheme, allThemes }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
