import { type CSSProperties, useEffect, useRef } from "react";
import { SectionTitle } from "../components";
import {
	type ContributionDay,
	type GitHubContributionCalendar,
	githubContributionCalendar,
} from "../github-contributions";
import { type DictKey, type Locale, useI18n } from "../i18n";
import type { Section, Theme, ThemeMode } from "../themes";
import "./projects.css";

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;

function dateAtNoonUtc(value: string): Date {
	return new Date(`${value}T12:00:00Z`);
}

function localeCode(locale: Locale): string {
	return locale === "zh" ? "zh-CN" : "en-US";
}

function formatDate(value: string, locale: Locale): string {
	return new Intl.DateTimeFormat(localeCode(locale), {
		year: "numeric",
		month: "short",
		day: "numeric",
		timeZone: "UTC",
	}).format(dateAtNoonUtc(value));
}

function formatMonth(value: string, locale: Locale): string {
	return new Intl.DateTimeFormat(localeCode(locale), {
		month: "short",
		timeZone: "UTC",
	}).format(dateAtNoonUtc(value));
}

function formatWeekday(weekday: number, locale: Locale): string {
	const date = new Date(Date.UTC(2026, 7, 16 + weekday, 12));
	return new Intl.DateTimeFormat(localeCode(locale), {
		weekday: "narrow",
		timeZone: "UTC",
	}).format(date);
}

function getMonthMarkers(
	calendar: GitHubContributionCalendar,
	locale: Locale,
): Array<{ key: string; label: string; weekIndex: number }> {
	const firstDay = calendar.weeks
		.flatMap((week) => week.days)
		.find((day): day is ContributionDay => day !== null);
	if (!firstDay) return [];

	const markers = [
		{
			key: firstDay.date.slice(0, 7),
			label: formatMonth(firstDay.date, locale),
			weekIndex: 0,
		},
	];
	const seenMonths = new Set([markers[0].key]);

	for (const [weekIndex, week] of calendar.weeks.entries()) {
		const monthStart = week.days.find((day) => day?.date.endsWith("-01"));
		if (!monthStart) continue;
		const key = monthStart.date.slice(0, 7);
		if (seenMonths.has(key)) continue;
		seenMonths.add(key);
		markers.push({
			key,
			label: formatMonth(monthStart.date, locale),
			weekIndex,
		});
	}
	return markers;
}

function GitHubContributions({ theme }: { theme: Theme }) {
	const { locale, t } = useI18n();
	const scrollRef = useRef<HTMLDivElement>(null);
	const calendar = githubContributionCalendar;
	const monthMarkers = getMonthMarkers(calendar, locale);
	const gridColumns = `repeat(${calendar.weeks.length}, minmax(9px, 1fr))`;
	const calendarStyle = {
		borderColor: theme.borderLight,
		"--github-contribution-level-0": theme.bgDeep,
		"--github-contribution-level-1": `${theme.text}24`,
		"--github-contribution-level-2": `${theme.text}52`,
		"--github-contribution-level-3": `${theme.text}8A`,
		"--github-contribution-level-4": `${theme.text}D1`,
		"--github-contribution-border": theme.borderLight,
		"--github-contribution-accent": theme.accent,
		"--github-profile-surface": theme.bg,
		"--github-profile-border": theme.borderLight,
		"--github-profile-ink": `${theme.text}73`,
		"--github-profile-hover-surface": theme.bgDeep,
		"--github-profile-hover-border": theme.border,
		"--github-profile-hover-ink": theme.textSec,
	} as CSSProperties;
	const rangeLabel = `${formatDate(calendar.from, locale)} — ${formatDate(
		calendar.to,
		locale,
	)}`;
	const contributionWord =
		calendar.totalContributions === 1
			? t("projects.activity.contribution")
			: t("projects.activity.contributions");

	useEffect(() => {
		const scroller = scrollRef.current;
		if (!scroller || !window.matchMedia("(max-width: 767px)").matches) {
			return;
		}
		const frame = requestAnimationFrame(() => {
			scroller.scrollLeft = scroller.scrollWidth;
		});
		return () => cancelAnimationFrame(frame);
	}, []);

	return (
		<section
			data-github-contribution-calendar="true"
			className="border-y py-5 sm:py-6"
			style={calendarStyle}
		>
			<header className="flex items-start justify-between gap-4 sm:gap-6">
				<div className="min-w-0">
					<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
						<p
							className="text-[10px] font-semibold uppercase tracking-[0.18em]"
							style={{ color: theme.textSec }}
						>
							{t("projects.activity.eyebrow")}
						</p>
						<p
							className="text-[10px] tabular-nums"
							style={{ color: theme.textSec, opacity: 0.55 }}
						>
							{rangeLabel}
						</p>
					</div>
					<p
						className="mt-2 text-2xl font-semibold tracking-tight tabular-nums"
						style={{ color: theme.text }}
					>
						{calendar.totalContributions.toLocaleString(localeCode(locale))}
						<span
							className="ml-2 text-sm font-normal tracking-normal"
							style={{ color: theme.textSec }}
						>
							{contributionWord}
						</span>
					</p>
				</div>
				<a
					href={`https://github.com/${calendar.username}`}
					target="_blank"
					rel="noreferrer"
					className="group mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--github-profile-border)] bg-[var(--github-profile-surface)] text-[var(--github-profile-ink)] transition-[background-color,border-color,color] duration-200 ease-out hover:border-[var(--github-profile-hover-border)] hover:bg-[var(--github-profile-hover-surface)] hover:text-[var(--github-profile-hover-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--github-contribution-accent)] motion-reduce:transition-none"
				>
					<span className="sr-only">
						{`${t("projects.activity.open")} · ${calendar.username}`}
					</span>
					<svg
						aria-hidden="true"
						className="h-4 w-4 transition-transform duration-200 ease-out group-hover:-translate-y-px group-hover:translate-x-px motion-reduce:transform-none motion-reduce:transition-none"
						viewBox="0 0 16 16"
						fill="currentColor"
					>
						<path d="M3.75 2h3.5a.75.75 0 0 1 0 1.5h-3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2Zm6.854-1h4.146a.25.25 0 0 1 .25.25v4.146a.25.25 0 0 1-.427.177L13.03 4.03 9.28 7.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.75-3.75-1.543-1.543A.25.25 0 0 1 10.604 1Z" />
					</svg>
				</a>
			</header>

			<div ref={scrollRef} className="github-contribution-scroll mt-6">
				<div className="github-contribution-canvas">
					<div className="github-contribution-calendar-row mb-1.5">
						<div />
						<div
							aria-hidden="true"
							className="github-contribution-months"
							style={{ gridTemplateColumns: gridColumns }}
						>
							{monthMarkers.map((marker) => (
								<span
									key={marker.key}
									style={{
										color: theme.textSec,
										gridColumnStart: marker.weekIndex + 1,
										gridRow: 1,
									}}
								>
									{marker.label}
								</span>
							))}
						</div>
					</div>
					<div
						role="img"
						aria-label={`${calendar.totalContributions.toLocaleString(
							localeCode(locale),
						)} ${contributionWord}, ${rangeLabel}`}
						className="github-contribution-calendar-row"
					>
						<div
							aria-hidden="true"
							className="github-contribution-weekdays"
							style={{ color: theme.textSec }}
						>
							{WEEKDAYS.map((weekday) => (
								<span key={weekday}>
									{weekday === 1 || weekday === 3 || weekday === 5
										? formatWeekday(weekday, locale)
										: ""}
								</span>
							))}
						</div>
						<div
							aria-hidden="true"
							className="github-contribution-weeks"
							style={{ gridTemplateColumns: gridColumns }}
						>
							{calendar.weeks.map((week, weekIndex) => (
								<div
									key={week.firstDay}
									className="github-contribution-week"
									style={{ animationDelay: `${weekIndex * 6}ms` }}
								>
									{week.days.map((day, weekday) =>
										day ? (
											<span
												key={day.date}
												data-contribution-day={day.date}
												data-level={day.level}
												className="github-contribution-day"
												title={`${formatDate(day.date, locale)} · ${
													day.count === 0
														? t("projects.activity.none")
														: `${day.count} ${
																day.count === 1
																	? t("projects.activity.contribution")
																	: t("projects.activity.contributions")
															}`
												}`}
											/>
										) : (
											<span
												key={`${week.firstDay}-empty-${weekday}`}
												className="github-contribution-day github-contribution-day-empty"
											/>
										),
									)}
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			<p
				className="mt-4 text-[10px] md:hidden"
				style={{ color: theme.textSec, opacity: 0.55 }}
			>
				{t("projects.activity.scrollHint")}
			</p>
		</section>
	);
}

type ProjectListing = {
	id: string;
	name: string;
	href: string;
	descriptionKey: DictKey;
	sourceLabelKey: DictKey;
	stack: string;
	editionLabelKey?: DictKey;
	companion?: {
		href: string;
		logoSrc: string;
		sourceLabelKey: DictKey;
	};
};

const PROJECT_TOOLS = [
	{
		id: "questbranch",
		name: "QuestBranch",
		href: "https://github.com/Ethan-decoy/QuestBranch",
		descriptionKey: "projects.questBranch.description",
		sourceLabelKey: "projects.questBranch.sourceLabel",
		stack: "TypeScript / React / Electron",
		editionLabelKey: "projects.questBranch.standalone.label",
		companion: {
			href: "https://github.com/Ethan-decoy/QuestBranch-DSH",
			logoSrc: "assets/projects/deepseek-whale.svg",
			sourceLabelKey: "projects.questBranch.dsh.sourceLabel",
		},
	},
	{
		id: "session-weave",
		name: "SessionWeave",
		href: "https://github.com/Ethan-decoy/session_weave",
		descriptionKey: "projects.sessionWeave.description",
		sourceLabelKey: "projects.sessionWeave.sourceLabel",
		stack: "TypeScript / Node.js",
	},
	{
		id: "spec-authoring",
		name: "spec-authoring",
		href: "https://github.com/Ethan-decoy/spec-authoring-skill",
		descriptionKey: "projects.specAuthoring.description",
		sourceLabelKey: "projects.specAuthoring.sourceLabel",
		stack: "Agent Skill / Markdown",
	},
] as const;

const PROJECT_TOYS = [
	{
		id: "try",
		name: "Try",
		href: "https://github.com/Ethan-decoy/Try",
		descriptionKey: "projects.try.description",
		sourceLabelKey: "projects.try.sourceLabel",
		stack: "Rust / Slint",
	},
	{
		id: "slint-math-input",
		name: "slint-math-input",
		href: "https://github.com/Ethan-decoy/slint_math_input",
		descriptionKey: "projects.mathInput.description",
		sourceLabelKey: "projects.mathInput.sourceLabel",
		stack: "Rust / Slint",
	},
] as const;

function ProjectSection({
	theme,
	mode,
	id,
	title,
	projects,
}: {
	theme: Theme;
	mode: ThemeMode;
	id: string;
	title: string;
	projects: readonly ProjectListing[];
}) {
	const { t } = useI18n();
	return (
		<section className="mt-14 sm:mt-16" aria-labelledby={`${id}-title`}>
			<h2
				id={`${id}-title`}
				className="text-base font-semibold tracking-tight"
				style={{ color: theme.text }}
			>
				{title}
			</h2>
			<div className="project-card-grid mt-5">
				{projects.map((project) => (
					<article
						key={project.id}
						aria-labelledby={`project-${project.id}-title`}
						className={`project-card flex w-full flex-col rounded-xl border border-[var(--experiment-border)] shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-[border-color,transform] duration-200 ease-out hover:border-[var(--experiment-hover-border)] focus-within:border-[var(--experiment-hover-border)] motion-safe:hover:-translate-y-0.5 motion-reduce:transition-none ${project.companion ? "project-card--paired" : ""}`}
						style={
							{
								backgroundColor: theme.bgCard,
								"--experiment-border": theme.borderLight,
								"--experiment-hover-border": theme.border,
								"--project-paper": theme.bgCard,
								"--project-ink": theme.text,
								"--project-companion-bg": theme.accentLight,
								"--project-divider": theme.border,
							} as CSSProperties
						}
					>
						<div className="project-card-main flex min-w-0 flex-1 flex-col gap-3 p-4">
							<div className="flex items-center gap-2">
								{project.id === "questbranch" && (
									<div className="flex h-8 w-8 shrink-0 items-center justify-center">
										{/* Original geometry and theme colors: https://github.com/Ethan-decoy/QuestBranch/blob/main/scripts/export-app-icon.mjs */}
										<svg
											aria-hidden="true"
											viewBox="-48 -90 696 696"
											className="h-7 w-7"
											fill={mode === "dark" ? "#55e9b0" : "#156146"}
										>
											<path d="M 256 0 A 256 256 0 0 0 0 256 A 256 256 0 0 0 256 512 C 198 477 166 425 166 360 C 166 284 216 243 278 210 C 340 177 366 144 366 98 C 366 38 327 0 256 0 Z" />
											<path d="M 455.442719 0 L 560 0 A 40 40 0 0 1 600 40 L 600 135.27864 A 64.72136 64.72136 0 0 1 535.27864 200 C 465.27864 200 419 234 371 275 C 331 309.166667 314 350 314 390 C 380 330 447 270 515 270 L 560 270 A 40 40 0 0 1 600 310 C 600 394 523 473 447 502 C 420 512.302632 389 516 352 516 C 288 516 240 471 240 408 C 240 344 293 298 345 253 C 397 208 430.72136 169 430.72136 105 L 430.72136 24.72136 A 24.72136 24.72136 0 0 1 455.442719 0 Z" />
										</svg>
									</div>
								)}
								{project.id === "try" && (
									<div
										className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
										style={{ backgroundColor: theme.bgDeep, color: theme.text }}
									>
										{/* Try's public mark: https://github.com/Ethan-decoy/Try/blob/main/assets/logo.svg */}
										<svg
											aria-hidden="true"
											viewBox="0 0 256 256"
											className="h-7 w-7"
											fill={theme.bgCard}
											stroke="currentColor"
											strokeWidth="8"
											strokeLinejoin="round"
										>
											<path d="M 207.7668998 36.9719554 A 8 8 0 0 1 219.0280446 48.2331002 L 164.4877097 114.4550895 A 48 48 0 0 0 161.3132815 171.1599365 L 185.6159905 208.4879198 A 8 8 0 0 1 174.5467914 219.5571189 L 137.2188081 195.2544099 A 48 48 0 0 0 84.8400635 195.2544099 L 47.5120802 219.5571189 A 8 8 0 0 1 36.4428811 208.4879198 L 60.7455901 171.1599365 A 48 48 0 0 0 60.7455901 118.7811919 L 36.4428811 81.4532086 A 8 8 0 0 1 47.5120802 70.3840095 L 84.8400635 94.6867185 A 48 48 0 0 0 141.5449105 91.5122903 L 207.7668998 36.9719554 Z" />
										</svg>
									</div>
								)}
								<h3
									id={`project-${project.id}-title`}
									lang="en"
									className="min-w-0 text-lg font-semibold tracking-tight"
									style={{ color: theme.text }}
								>
									<a
										href={project.href}
										target="_blank"
										rel="noreferrer"
										aria-label={t(project.sourceLabelKey)}
										title={
											project.editionLabelKey
												? t(project.editionLabelKey)
												: undefined
										}
										className="project-card-source inline-flex min-h-8 max-w-full items-center rounded-sm no-underline [overflow-wrap:anywhere] focus-visible:outline-2 focus-visible:outline-offset-4"
									>
										{project.name}
									</a>
								</h3>
							</div>
							<p
								className="text-[13px] leading-6"
								style={{ color: theme.text }}
							>
								{t(project.descriptionKey)}
							</p>
							<p
								lang="en"
								className="mt-auto font-mono text-[11px]"
								style={{ color: theme.textSec }}
							>
								{project.stack}
							</p>
						</div>
						{project.companion && (
							<>
								<a
									href={project.companion.href}
									target="_blank"
									rel="noreferrer"
									aria-label={t(project.companion.sourceLabelKey)}
									title={t(project.companion.sourceLabelKey)}
									className="project-card-companion"
								>
									<span className="project-card-companion-copy">
										<img
											src={`${import.meta.env.BASE_URL}${project.companion.logoSrc}`}
											alt=""
											width={36}
											height={27}
											className="project-card-companion-logo"
										/>
									</span>
								</a>
								<svg
									aria-hidden="true"
									className="project-card-divider"
									viewBox="0 0 24 180"
									preserveAspectRatio="none"
								>
									<path
										d="M24 0 0 180"
										fill="none"
										stroke="currentColor"
										vectorEffect="non-scaling-stroke"
									/>
								</svg>
							</>
						)}
					</article>
				))}
			</div>
		</section>
	);
}

export default function ProjectsPage({
	theme,
	mode = "light",
}: {
	theme: Theme;
	onNavigate: (s: Section) => void;
	mode?: ThemeMode;
}) {
	const { t } = useI18n();
	return (
		<div className="section-page-frame pb-16 sm:pb-24 md:pb-32">
			<SectionTitle theme={theme}>{t("projects.title")}</SectionTitle>
			<div
				style={{
					animation: "fade-up 0.35s ease-out both",
				}}
			>
				<GitHubContributions theme={theme} />
				<ProjectSection
					theme={theme}
					mode={mode}
					id="project-tools"
					title={t("projects.tools.title")}
					projects={PROJECT_TOOLS}
				/>
				<ProjectSection
					theme={theme}
					mode={mode}
					id="project-toys"
					title={t("projects.toys.title")}
					projects={PROJECT_TOYS}
				/>
			</div>
		</div>
	);
}
