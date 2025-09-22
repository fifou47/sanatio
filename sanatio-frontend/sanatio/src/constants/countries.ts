export type CountryDialCode = {
  name: string;
  iso2: string;
  dialCode: string;
  flag: string;
};

export const COUNTRIES: CountryDialCode[] = [
  { name: 'Togo', iso2: 'TG', dialCode: '+228', flag: '🇹🇬' },
  { name: 'France', iso2: 'FR', dialCode: '+33', flag: '🇫🇷' },
  { name: 'États-Unis', iso2: 'US', dialCode: '+1', flag: '🇺🇸' },
  { name: 'Canada', iso2: 'CA', dialCode: '+1', flag: '🇨🇦' },
  { name: 'Belgique', iso2: 'BE', dialCode: '+32', flag: '🇧🇪' },
  { name: 'Suisse', iso2: 'CH', dialCode: '+41', flag: '🇨🇭' },
  { name: 'Royaume-Uni', iso2: 'GB', dialCode: '+44', flag: '🇬🇧' },
  { name: 'Allemagne', iso2: 'DE', dialCode: '+49', flag: '🇩🇪' },
  { name: 'Espagne', iso2: 'ES', dialCode: '+34', flag: '🇪🇸' },
  { name: 'Italie', iso2: 'IT', dialCode: '+39', flag: '🇮🇹' },
  { name: 'Maroc', iso2: 'MA', dialCode: '+212', flag: '🇲🇦' },
  { name: 'Côte d’Ivoire', iso2: 'CI', dialCode: '+225', flag: '🇨🇮' },
  { name: 'Sénégal', iso2: 'SN', dialCode: '+221', flag: '🇸🇳' },
  { name: 'Nigéria', iso2: 'NG', dialCode: '+234', flag: '🇳🇬' },
  { name: 'Ghana', iso2: 'GH', dialCode: '+233', flag: '🇬🇭' },
  { name: 'Afrique du Sud', iso2: 'ZA', dialCode: '+27', flag: '🇿🇦' },
  { name: 'Tunisie', iso2: 'TN', dialCode: '+216', flag: '🇹🇳' },
  { name: 'Algérie', iso2: 'DZ', dialCode: '+213', flag: '🇩🇿' },
  { name: 'Portugal', iso2: 'PT', dialCode: '+351', flag: '🇵🇹' },
  { name: 'Pays-Bas', iso2: 'NL', dialCode: '+31', flag: '🇳🇱' },
];

export const DEFAULT_DIAL_CODE = COUNTRIES[0].dialCode;
