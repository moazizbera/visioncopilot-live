/**
 * Detects if text contains Arabic characters
 * Arabic Unicode range: \u0600-\u06FF, \u0750-\u077F, \u08A0-\u08FF, \uFB50-\uFDFF, \uFE70-\uFEFF
 */
export function isArabicText(text: string): boolean {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/
  return arabicRegex.test(text)
}

/**
 * Returns text direction class based on content
 */
export function getTextDirection(text: string): 'ltr' | 'rtl' {
  return isArabicText(text) ? 'rtl' : 'ltr'
}

/**
 * Returns text alignment class based on content
 */
export function getTextAlign(text: string): string {
  return isArabicText(text) ? 'text-right' : 'text-left'
}
