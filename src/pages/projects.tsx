import { type CSSProperties, useEffect, useRef } from "react";
import { SectionTitle } from "../components";
import {
	type ContributionDay,
	type GitHubContributionCalendar,
	githubContributionCalendar,
} from "../github-contributions";
import { type Locale, useI18n } from "../i18n";
import type { Section, Theme } from "../themes";

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

export default function ProjectsPage({
	theme,
}: { theme: Theme; onNavigate: (s: Section) => void }) {
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
			</div>
			<div
				className="p-6 rounded-2xl mt-6 sm:p-8"
				style={{
					animation: "fade-up 0.35s ease-out both",
					animationDelay: "80ms",
					backgroundColor: theme.bgDeep,
					border: `1px solid ${theme.borderLight}`,
				}}
			>
				<p
					className="text-base leading-relaxed"
					style={{ color: theme.textSec }}
				>
					{t("projects.empty")}
				</p>
				<p
					className="text-sm mt-2"
					style={{ color: theme.textSec, opacity: 0.6 }}
				>
					{t("projects.hint")}
				</p>
			</div>
		</div>
	);
}
