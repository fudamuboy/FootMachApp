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

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources,
    lng: 'tr',
    fallbackLng: 'tr',
    interpolation: {
      escapeValue: false, // React already safeguards from xss
    },
  });

export default i18n;
