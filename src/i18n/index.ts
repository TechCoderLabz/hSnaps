import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from './locales/en.json'
import es from './locales/es.json'

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
] as const

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code']

const STORAGE_KEY = 'hsnaps-language'

function resolveInitialLanguage(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && SUPPORTED_LANGUAGES.some((l) => l.code === stored)) {
      return stored
    }
  } catch {
    // localStorage unavailable
  }
  const navLang =
    (typeof navigator !== 'undefined' && (navigator.language || (navigator as Navigator).language)) || 'en'
  const base = String(navLang).toLowerCase().split('-')[0]
  if (SUPPORTED_LANGUAGES.some((l) => l.code === base)) return base
  return 'en'
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    lng: resolveInitialLanguage(),
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: STORAGE_KEY,
      caches: [],
    },
  })

export function setLanguage(code: string): void {
  if (!SUPPORTED_LANGUAGES.some((l) => l.code === code)) return
  try {
    localStorage.setItem(STORAGE_KEY, code)
  } catch {
    // ignore
  }
  void i18n.changeLanguage(code)
}

export default i18n
