export const themes = {
	earth: {
		light: {
			name: "浅棕米白",
			bg: "#F8F3EA",
			bgDeep: "#F0E8D8",
			bgCard: "#F5EDE0",
			text: "#2D2418",
			textSec: "#7A6B5A",
			accent: "#9B7B5A",
			accentHover: "#7E6045",
			accentLight: "rgba(155, 123, 90, 0.08)",
			border: "rgba(45, 36, 24, 0.12)",
			borderLight: "rgba(45, 36, 24, 0.06)",
		},
		dark: {
			name: "深棕暗色",
			bg: "#1A1612",
			bgDeep: "#241E18",
			bgCard: "#221D16",
			text: "#E8DDD0",
			textSec: "#9A8B7A",
			accent: "#C4A67D",
			accentHover: "#D4BC99",
			accentLight: "rgba(196, 166, 125, 0.12)",
			border: "rgba(232, 221, 208, 0.10)",
			borderLight: "rgba(232, 221, 208, 0.05)",
		},
	},
	ocean: {
		light: {
			name: "深蓝黑",
			bg: "#F5F0E8",
			bgDeep: "#EDE7DB",
			bgCard: "#F0EBE0",
			text: "#0F1B2D",
			textSec: "#4A5D73",
			accent: "#1B3A5C",
			accentHover: "#0F2540",
			accentLight: "rgba(27, 58, 92, 0.08)",
			border: "rgba(15, 27, 45, 0.12)",
			borderLight: "rgba(15, 27, 45, 0.06)",
		},
		dark: {
			name: "深海暗蓝",
			bg: "#0D1117",
			bgDeep: "#141C26",
			bgCard: "#121A24",
			text: "#E0E6ED",
			textSec: "#7A8FA3",
			accent: "#58A6D0",
			accentHover: "#79BDE0",
			accentLight: "rgba(88, 166, 208, 0.12)",
			border: "rgba(224, 230, 237, 0.08)",
			borderLight: "rgba(224, 230, 237, 0.12)",
		},
	},
	sage: {
		light: {
			name: "青瓷米白",
			bg: "#F7F4EC",
			bgDeep: "#E8EFEA",
			bgCard: "#F0F5F1",
			text: "#182820",
			textSec: "#53685F",
			accent: "#3F7465",
			accentHover: "#315C50",
			accentLight: "rgba(63, 116, 101, 0.10)",
			border: "rgba(24, 40, 32, 0.12)",
			borderLight: "rgba(24, 40, 32, 0.07)",
		},
		dark: {
			name: "青瓷暗色",
			bg: "#111815",
			bgDeep: "#19231F",
			bgCard: "#15201C",
			text: "#E2E9E4",
			textSec: "#91A49A",
			accent: "#7FB69F",
			accentHover: "#9CC9B7",
			accentLight: "rgba(127, 182, 159, 0.11)",
			border: "rgba(226, 233, 228, 0.10)",
			borderLight: "rgba(226, 233, 228, 0.05)",
		},
	},
	github: {
		light: {
			name: "GitHub Light",
			bg: "#FFFFFF",
			bgDeep: "#F6F8FA",
			bgCard: "#FFFFFF",
			text: "#24292F",
			textSec: "#57606A",
			accent: "#24292F",
			accentHover: "#000000",
			accentLight: "rgba(36, 41, 47, 0.06)",
			border: "rgba(31, 35, 40, 0.15)",
			borderLight: "rgba(31, 35, 40, 0.10)",
		},
		dark: {
			name: "GitHub Dark",
			bg: "#0D1117",
			bgDeep: "#161B22",
			bgCard: "#161B22",
			text: "#F0F6FC",
			textSec: "#8B949E",
			accent: "#F0F6FC",
			accentHover: "#FFFFFF",
			accentLight: "rgba(240, 246, 252, 0.08)",
			border: "rgba(240, 246, 252, 0.14)",
			borderLight: "rgba(240, 246, 252, 0.10)",
		},
	},
	black: {
		light: {
			name: "黑",
			bg: "#F5F0E8",
			bgDeep: "#EDE7DB",
			bgCard: "#E8E2D6",
			text: "#0A0A0A",
			textSec: "#555555",
			accent: "#0A0A0A",
			accentHover: "#222222",
			accentLight: "rgba(10, 10, 10, 0.08)",
			border: "rgba(10, 10, 10, 0.15)",
			borderLight: "rgba(10, 10, 10, 0.06)",
		},
		dark: {
			name: "极夜黑",
			bg: "#0A0A0A",
			bgDeep: "#141414",
			bgCard: "#111111",
			text: "#E0E0E0",
			textSec: "#888888",
			accent: "#E0E0E0",
			accentHover: "#CCCCCC",
			accentLight: "rgba(224, 224, 224, 0.08)",
			border: "rgba(224, 224, 224, 0.12)",
			borderLight: "rgba(224, 224, 224, 0.06)",
		},
	},
};

export type ThemeMode = "light" | "dark";
export type ThemeKey = keyof typeof themes;
export type Section = "home" | "about" | "projects" | "notes" | "contact";
export type Theme = (typeof themes)[ThemeKey]["light"];

export function getTheme(key: ThemeKey, mode: ThemeMode = "light"): Theme {
	return themes[key][mode];
}

const aboutPersonalSurface: Record<
	ThemeMode,
	Pick<Theme, "bg" | "bgDeep" | "bgCard" | "border" | "borderLight">
> = {
	light: {
		bg: "#F8F3EA",
		bgDeep: "#F0E9DF",
		bgCard: "#F4EEE5",
		border: "rgba(71, 56, 43, 0.12)",
		borderLight: "rgba(71, 56, 43, 0.07)",
	},
	dark: {
		bg: "#1A1612",
		bgDeep: "#211D19",
		bgCard: "#1B1A17",
		border: "rgba(226, 218, 207, 0.11)",
		borderLight: "rgba(226, 218, 207, 0.06)",
	},
};

const aboutWorkTheme: Record<ThemeMode, Theme> = {
	light: {
		name: "冷灰工作纸",
		bg: "#F4F6F7",
		bgDeep: "#E9EEF1",
		bgCard: "#F1F4F5",
		text: "#18232B",
		textSec: "#586873",
		accent: "#345E72",
		accentHover: "#274B5D",
		accentLight: "rgba(52, 94, 114, 0.09)",
		border: "rgba(24, 35, 43, 0.13)",
		borderLight: "rgba(24, 35, 43, 0.07)",
	},
	dark: {
		name: "冷钢石墨",
		bg: "#15191B",
		bgDeep: "#20262A",
		bgCard: "#1A1F22",
		text: "#E7EAEB",
		textSec: "#9AA5AA",
		accent: "#8EA8B3",
		accentHover: "#ADC0C7",
		accentLight: "rgba(142, 168, 179, 0.12)",
		border: "rgba(231, 234, 235, 0.14)",
		borderLight: "rgba(231, 234, 235, 0.07)",
	},
};

export function getAboutTheme(
	view: "personal" | "work",
	mode: ThemeMode = "light",
): Theme {
	if (view === "work") return aboutWorkTheme[mode];
	const theme = getTheme("sage", mode);
	return { ...theme, ...aboutPersonalSurface[mode] };
}
