import {
	type ReactNode,
	Suspense,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { Footer, LangToggle, NavBar, ThemeToggle } from "./components";
import { useI18n } from "./i18n";
import { I18nProvider } from "./i18n/index";
import {
	AboutPage,
	ContactPage,
	HomePage,
	NotesPage,
	ProjectsPage,
	preloadSection,
	scheduleCommonPagePreload,
} from "./page-modules";
import type {
	EntertainmentSectionId,
	PersonalSectionId,
	WorkSectionId,
} from "./pages/about";
import { ThemeModeProvider, useThemeMode } from "./theme-mode";
import { type Section, type ThemeKey, getAboutTheme, getTheme } from "./themes";

type AboutView = "personal" | "work";

const sections: readonly Section[] = [
	"home",
	"about",
	"projects",
	"notes",
	"contact",
];

function isSection(value: string): value is Section {
	return sections.includes(value as Section);
}

function isAboutView(value: string | undefined): value is AboutView {
	return value === "work" || value === "personal";
}

function readInitialRoute(): { section: Section; aboutView: AboutView } {
	const [rawSection, rawAboutView] = window.location.hash
		.replace(/^#/, "")
		.split("/");
	return {
		section: isSection(rawSection) ? rawSection : "home",
		aboutView: isAboutView(rawAboutView) ? rawAboutView : "work",
	};
}

const sectionMap = {
	home: HomePage,
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
	const [initialRoute] = useState(readInitialRoute);
	const [active, setActive] = useState<Section>(initialRoute.section);
	const [aboutView, setAboutView] = useState<AboutView>(initialRoute.aboutView);
	const [workSection, setWorkSection] = useState<WorkSectionId>("experience");
	const [personalSection, setPersonalSection] =
		useState<PersonalSectionId>("beliefs");
	const [entertainmentSection, setEntertainmentSection] =
		useState<EntertainmentSectionId>("playing");
	const navigationRequestRef = useRef(0);
	const theme =
		active === "about"
			? getAboutTheme(aboutView, mode)
			: getTheme(sectionTheme[active], mode);

	useEffect(() => scheduleCommonPagePreload(), []);

	const prefetch = useCallback((section: Section) => {
		void preloadSection(section).catch(() => undefined);
	}, []);

	const navigate = useCallback((section: Section, sub?: AboutView) => {
		const requestId = ++navigationRequestRef.current;
		const commitNavigation = () => {
			if (requestId !== navigationRequestRef.current) return;
			setActive(section);
			if (section === "about" && isAboutView(sub)) setAboutView(sub);
			window.history.replaceState(
				null,
				"",
				section === "about" && isAboutView(sub)
					? `#${section}/${sub}`
					: `#${section}`,
			);
			window.scrollTo({ top: 0 });
		};

		if (section === "home") {
			commitNavigation();
			return;
		}

		void preloadSection(section)
			.then(commitNavigation)
			.catch(() => undefined);
	}, []);

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
			<NavBar
				theme={theme}
				active={active}
				onNavigate={navigate}
				onPrefetch={prefetch}
			/>
			<div className="fixed top-[18px] right-5 z-50 flex items-center gap-2">
				<ThemeToggle mode={mode} setMode={setMode} theme={theme} />
				<LangToggle locale={locale} setLocale={setLocale} theme={theme} />
			</div>
			<main className="flex-1">
				<Suspense
					fallback={
						<div aria-busy="true" className="min-h-[calc(100svh-4.75rem)]">
							<span className="sr-only">Loading page</span>
						</div>
					}
				>
					{pageContent}
				</Suspense>
			</main>
			<Footer theme={theme} onNavigate={navigate} onPrefetch={prefetch} />
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
