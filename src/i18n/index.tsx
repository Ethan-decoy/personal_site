import { createContext, useContext, useState, type ReactNode } from "react";
import { dict, type DictKey, type Locale } from "./dict";

const I18nContext = createContext<{
	locale: Locale;
	t: (key: DictKey) => string;
	setLocale: (l: Locale) => void;
}>({
	locale: "zh",
	t: (key) => key,
	setLocale: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }): ReactNode {
	const [locale, setLocale] = useState<Locale>(() => {
		if (typeof navigator !== "undefined") {
			const langs = [navigator.language, ...(navigator.languages || [])];
			if (langs.some((l) => l.startsWith("zh"))) return "zh";
			return "en";
		}
		return "zh";
	});
	const t = (key: DictKey) => dict[key][locale] ?? dict[key].zh;

	return (
		<I18nContext.Provider value={{ locale, t, setLocale }}>
			{children}
		</I18nContext.Provider>
	);
}

export function useI18n() {
	return useContext(I18nContext);
}

export type { Locale, DictKey };
