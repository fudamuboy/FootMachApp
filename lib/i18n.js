import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import tr from '../locales/tr.json';
import en from '../locales/en.json';
import fr from '../locales/fr.json';

const resources = {
  tr: { translation: tr },
  en: { translation: en },
  fr: { translation: fr },
};

// Tries to detect language, otherwise defaults to 'tr'
const deviceLanguage = Localization.getLocales()[0]?.languageCode;
const defaultLanguage = ['tr', 'en', 'fr'].includes(deviceLanguage) ? deviceLanguage : 'tr';

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3', // Required for React Native Android
    resources,
    lng: defaultLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already safeguards from xss
    },
  });

export default i18n;
