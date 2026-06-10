interface Window {
  theme?: {
    themeValue: string;
    setPreference: () => void;
    reflectPreference: () => void;
    getTheme: () => string;
    setTheme: (val: string) => void;
  };
  cleanupReadingPosition?: () => void;
  cleanupReadingMode?: () => void;
  cleanupProgressBar?: () => void;
}
