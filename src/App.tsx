import { type ReactNode, useEffect, useState } from "react";
import { Footer, LangToggle, NavBar, ThemeToggle } from "./components";
import { useI18n } from "./i18n";
import { I18nProvider } from "./i18n/index";
import AboutPage, {
	type EntertainmentSectionId,
	type PersonalSectionId,
	type WorkSectionId,
} from "./pages/about";
import ContactPage from "./pages/contact";
import HomePage from "./pages/home";
import NotesPage from "./pages/notes";
import ProjectsPage from "./pages/projects";
import { ThemeModeProvider, useThemeMode } from "./theme-mode";
import { type Section, type ThemeKey, getAboutTheme, getTheme } from "./themes";

type AboutView = "personal" | "work";

const sectionMap = {
	home: HomePage,
	about: AboutPage,
	projects: ProjectsPage,
	notes: NotesPage,
	contact: ContactPage,
};

const sectionTheme: Record<Section, ThemeKey> = {
	home: "sage",
	about: "sage",
	projects: "github",
	notes: "ocean",
	contact: "contact",
};

function AppInner() {
	const { locale, setLocale } = useI18n();
	const { mode, setMode } = useThemeMode();
	const [active, setActive] = useState<Section>("home");
	const [aboutView, setAboutView] = useState<AboutView>("work");
	const [workSection, setWorkSection] = useState<WorkSectionId>("experience");
	const [personalSection, setPersonalSection] =
		useState<PersonalSectionId>("beliefs");
	const [entertainmentSection, setEntertainmentSection] =
		useState<EntertainmentSectionId>("playing");
	const theme =
		active === "about"
			? getAboutTheme(aboutView, mode)
			: getTheme(sectionTheme[active], mode);

	useEffect(() => {
		const hash = window.location.hash.replace("#", "");
		if (!hash) return;
		const [section, sub] = hash.split("/") as [Section, AboutView?];
		if (sectionMap[section]) {
			setActive(section);
			if (section === "about" && sub) setAboutView(sub);
		}
	}, []);

	const navigate = (s: Section, sub?: AboutView) => {
		setActive(s);
		if (s === "about" && sub) {
			setAboutView(sub);
			window.history.replaceState(null, "", `#${s}/${sub}`);
		} else {
			window.history.replaceState(null, "", `#${s}`);
		}
		window.scrollTo({ top: 0 });
	};

	let pageContent: ReactNode;
	if (active === "about") {
		pageContent = (
			<AboutPage
				theme={theme}
				onNavigate={navigate}
				aboutView={aboutView}
				workSection={workSection}
				onWorkSectionChange={setWorkSection}
				personalSection={personalSection}
				onPersonalSectionChange={setPersonalSection}
				entertainmentSection={entertainmentSection}
				onEntertainmentSectionChange={setEntertainmentSection}
			/>
		);
	} else {
		const Page = sectionMap[active];
		pageContent = <Page theme={theme} onNavigate={navigate} mode={mode} />;
	}

	return (
		<div
			className="min-h-screen flex flex-col motion-safe:transition-colors motion-safe:duration-300 motion-safe:ease-out"
			style={{ backgroundColor: theme.bg, color: theme.text }}
		>
			<NavBar theme={theme} active={active} onNavigate={navigate} />
			<div className="fixed top-[18px] right-5 z-50 flex items-center gap-2">
				<ThemeToggle mode={mode} setMode={setMode} theme={theme} />
				<LangToggle locale={locale} setLocale={setLocale} theme={theme} />
			</div>
			<main className="flex-1">{pageContent}</main>
			<Footer theme={theme} onNavigate={navigate} />
		</div>
	);
}

export default function App() {
	return (
		<I18nProvider>
			<ThemeModeProvider>
				<AppInner />
			</ThemeModeProvider>
		</I18nProvider>
	);
}
