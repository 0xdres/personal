import { ui, defaultLang, type Lang } from "./ui";

export function getLangFromUrl(url: URL): Lang {
  const [, lang] = url.pathname.split("/");
  if (lang && lang in ui) return lang as Lang;
  return defaultLang;
}

export function useTranslations(lang?: string | null) {
  const validLang: Lang = (lang && lang in ui) ? (lang as Lang) : defaultLang;
  return function t(key: keyof (typeof ui)[typeof defaultLang]) {
    return ui[validLang][key] || ui[defaultLang][key];
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
