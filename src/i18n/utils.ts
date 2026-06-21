import { ui, defaultLang } from "./ui";

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split("/");
  if (lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof (typeof ui)[typeof defaultLang]) {
    return ui[lang][key] || ui[defaultLang][key];
  };
}

export function getTargetLanguageUrl(pathname: string, targetLocale: string) {
  let path = pathname;
  if (!path.startsWith("/")) {
    path = "/" + path;
  }

  // Strip existing locale prefix
  if (path.startsWith("/es/") || path === "/es") {
    path = path.slice(3);
    if (!path.startsWith("/")) {
      path = "/" + path;
    }
  }

  // Prepend new locale if not default
  if (targetLocale === "es") {
    return `/es${path === "/" ? "" : path}`;
  }
  return path;
}
