import { lazy } from "react";
import HomePage from "./pages/home";
import type { Section } from "./themes";

const loadAboutPage = () => import("./pages/about");
const loadProjectsPage = () => import("./pages/projects");
const loadNotesPage = () => import("./pages/notes");
const loadContactPage = () => import("./pages/contact");
const preloadAboutPage = () =>
	loadAboutPage().then((page) => {
		page.preloadPersonalImages();
	});

export const AboutPage = lazy(loadAboutPage);
export const ProjectsPage = lazy(loadProjectsPage);
export const NotesPage = lazy(loadNotesPage);
export const ContactPage = lazy(loadContactPage);
export { HomePage };

export function preloadSection(section: Section): Promise<void> {
	switch (section) {
		case "about":
			return preloadAboutPage();
		case "projects":
			return loadProjectsPage().then(() => undefined);
		case "notes":
			return loadNotesPage().then(() => undefined);
		case "contact":
			return loadContactPage().then(() => undefined);
		default:
			return Promise.resolve();
	}
}

type NetworkAwareNavigator = Navigator & {
	connection?: {
		effectiveType?: string;
		saveData?: boolean;
	};
};

type IdleAwareWindow = Window & {
	requestIdleCallback?: (
		callback: () => void,
		options?: { timeout: number },
	) => number;
	cancelIdleCallback?: (handle: number) => void;
};

export function scheduleCommonPagePreload(): () => void {
	const connection = (navigator as NetworkAwareNavigator).connection;
	if (
		connection?.saveData ||
		connection?.effectiveType === "slow-2g" ||
		connection?.effectiveType === "2g"
	) {
		return () => undefined;
	}

	const idleWindow = window as IdleAwareWindow;
	let cancelled = false;
	let idleHandle: number | undefined;
	let timeoutHandle: number | undefined;
	const preload = () => {
		if (cancelled || document.visibilityState !== "visible") return;
		void Promise.allSettled([
			preloadAboutPage(),
			loadProjectsPage(),
			loadContactPage(),
		]);
	};

	if (idleWindow.requestIdleCallback) {
		idleHandle = idleWindow.requestIdleCallback(preload, { timeout: 2_000 });
	} else {
		timeoutHandle = window.setTimeout(preload, 900);
	}

	return () => {
		cancelled = true;
		if (idleHandle !== undefined) idleWindow.cancelIdleCallback?.(idleHandle);
		if (timeoutHandle !== undefined) window.clearTimeout(timeoutHandle);
	};
}
