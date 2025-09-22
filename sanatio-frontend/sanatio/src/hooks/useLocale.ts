import { useEffect, useState } from 'react';
import i18n from '../i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'locale';

export function useLocale() {
  const [lang, setLang] = useState(i18n.language);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((val) => {
      if (val && val !== lang) change(val);
    });
  }, []);

  function change(code: string) {
    i18n.changeLanguage(code);
    setLang(code);
    AsyncStorage.setItem(KEY, code).catch(() => {});
  }

  return { lang, change, t: i18n.t.bind(i18n) };
}

