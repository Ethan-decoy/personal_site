import { type ReactNode } from "react";
import { type Section, type Theme } from "./themes";
import { useI18n } from "./i18n";

export function SectionTitle({
	children,
	theme,
}: { children: ReactNode; theme: Theme }) {
	return (
		<div className="flex items-center gap-4 mb-12">
			<h2
				className="text-2xl font-bold tracking-tight"
				style={{ color: theme.text }}
			>
				{children}
			</h2>
			<div
				className="flex-1 h-px"
				style={{ backgroundColor: theme.borderLight }}
			/>
		</div>
	);
}

export function Tag({
	children,
	theme,
}: { children: ReactNode; theme: Theme }) {
	return (
		<span
			className="px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide"
			style={{ backgroundColor: theme.accentLight, color: theme.accent }}
		>
			{children}
		</span>
	);
}

export function NavBar({
	theme,
	active,
	onNavigate,
}: { theme: Theme; active: Section; onNavigate: (s: Section) => void }) {
	const { t } = useI18n();
	const links: { key: Section; label: string }[] = [
		{ key: "home", label: t("nav.home") },
		{ key: "about", label: t("nav.about") },
		{ key: "projects", label: t("nav.projects") },
		{ key: "notes", label: t("nav.notes") },
		{ key: "contact", label: t("nav.contact") },
	];

	return (
		<nav
			className="fixed top-0 left-0 right-0 z-40"
			style={{ backgroundColor: `${theme.bg}ee`, backdropFilter: "blur(12px)" }}
		>
			<div className="max-w-5xl mx-auto flex items-center justify-between px-4 md:px-8 py-4">
				<span
					className="text-base font-bold tracking-widest cursor-pointer select-none shrink-0"
					style={{ color: theme.text }}
					onClick={() => onNavigate("home")}
				>
					ETHAN C.
				</span>
				<div
					className="flex gap-1 overflow-x-auto ml-2 items-center"
					style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
				>
					{links.map((l) => (
						<button
							key={l.key}
							className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ease-out relative whitespace-nowrap shrink-0"
							style={{
								color: active === l.key ? theme.text : theme.textSec,
								backgroundColor:
									active === l.key ? theme.accentLight : "transparent",
							}}
							onClick={() => onNavigate(l.key)}
						>
							{l.label}
						</button>
					))}
				</div>
			</div>
		</nav>
	);
}

function ToggleButton({
	onClick,
	icon,
	label,
	theme,
}: { onClick: () => void; icon: ReactNode; label: string; theme: Theme }) {
	return (
		<button
			className="flex items-center justify-center w-8 h-8 rounded-full cursor-pointer transition-all duration-200 ease-out"
			style={{
				color: theme.textSec,
				backgroundColor: `${theme.bg}ee`,
				backdropFilter: "blur(12px)",
				border: `1px solid ${theme.border}`,
				boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
			}}
			onClick={onClick}
			onMouseEnter={(e) => {
				e.currentTarget.style.borderColor = theme.accent;
			}}
			onMouseLeave={(e) => {
				e.currentTarget.style.borderColor = theme.border;
			}}
			aria-label={label}
		>
			{icon}
		</button>
	);
}

export function LangToggle({
	locale,
	setLocale,
	theme,
}: { locale: string; setLocale: (l: "zh" | "en") => void; theme: Theme }) {
	return (
		<ToggleButton
			theme={theme}
			label="Switch language"
			onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
			icon={
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<circle cx="12" cy="12" r="10" />
					<path d="M2 12h20" />
					<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
				</svg>
			}
		/>
	);
}

export function ThemeToggle({
	mode,
	setMode,
	theme,
}: {
	mode: "light" | "dark";
	setMode: (m: "light" | "dark") => void;
	theme: Theme;
}) {
	return (
		<ToggleButton
			theme={theme}
			label="Toggle theme"
			onClick={() => setMode(mode === "light" ? "dark" : "light")}
			icon={
				mode === "light" ? (
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
					</svg>
				) : (
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<circle cx="12" cy="12" r="5" />
						<line x1="12" y1="1" x2="12" y2="3" />
						<line x1="12" y1="21" x2="12" y2="23" />
						<line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
						<line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
						<line x1="1" y1="12" x2="3" y2="12" />
						<line x1="21" y1="12" x2="23" y2="12" />
						<line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
						<line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
					</svg>
				)
			}
		/>
	);
}

export function Footer({
	theme,
	onNavigate,
}: { theme: Theme; onNavigate: (s: Section) => void }) {
	const { t } = useI18n();
	return (
		<footer
			className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8"
			style={{ borderTop: `1px solid ${theme.borderLight}` }}
		>
			<div className="flex justify-between items-center">
				<p className="text-xs tracking-wide" style={{ color: theme.textSec }}>
					&copy; 2026 Ethan C.
				</p>
				<a
					className="text-xs font-medium transition-all duration-200 ease-out cursor-pointer"
					style={{ color: theme.textSec }}
					onClick={() => onNavigate("contact")}
					onMouseEnter={(e) => {
						e.currentTarget.style.color = theme.accent;
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.color = theme.textSec;
					}}
				>
					{t("footer.contact")}
				</a>
			</div>
		</footer>
	);
}
