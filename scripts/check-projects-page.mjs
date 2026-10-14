import { readFile } from "node:fs/promises";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const vite = await createServer({
	server: { middlewareMode: true },
	appType: "custom",
	logLevel: "silent",
});

try {
	const [projectsSource, css, workflow, generatorSource] = await Promise.all([
		readFile(new URL("../src/pages/projects.tsx", import.meta.url), "utf8"),
		readFile(new URL("../src/index.css", import.meta.url), "utf8"),
		readFile(
			new URL("../.github/workflows/deploy.yml", import.meta.url),
			"utf8",
		),
		readFile(
			new URL("./fetch-github-contributions.mjs", import.meta.url),
			"utf8",
		),
	]);
	const [
		{ default: ProjectsPage },
		{ getTheme },
		{ I18nProvider },
		{ githubContributionCalendar: calendar },
	] = await Promise.all([
		vite.ssrLoadModule("/src/pages/projects.tsx"),
		vite.ssrLoadModule("/src/themes.ts"),
		vite.ssrLoadModule("/src/i18n/index.tsx"),
		vite.ssrLoadModule("/src/github-contributions.ts"),
	]);

	const days = calendar.weeks.flatMap((week) =>
		week.days.filter((day) => day !== null),
	);
	const renderedHtml = renderToStaticMarkup(
		React.createElement(
			I18nProvider,
			null,
			React.createElement(ProjectsPage, {
				theme: getTheme("github", "light"),
				onNavigate: () => {},
			}),
		),
	);
	const renderedDayCount =
		renderedHtml.split("data-contribution-day=").length - 1;
	const refreshStep = workflow.indexOf("pnpm fetch:contributions");
	const buildStep = workflow.indexOf("pnpm build");
	const checks = [
		{
			name: "the snapshot contains one complete contribution year",
			pass:
				calendar.weeks.length >= 52 &&
				calendar.weeks.length <= 54 &&
				days.length >= 365 &&
				days.length <= 371,
		},
		{
			name: "the snapshot total matches its daily contribution counts",
			pass:
				days.reduce((total, day) => total + day.count, 0) ===
				calendar.totalContributions,
		},
		{
			name: "every contribution day is rendered by the local calendar",
			pass: renderedDayCount === days.length,
		},
		{
			name: "the projects page no longer embeds a remote chart image",
			pass:
				!renderedHtml.includes("<img") &&
				!renderedHtml.includes("ghchart.rshah.org"),
		},
		{
			name: "the calendar exposes a concise accessible chart summary",
			pass:
				renderedHtml.includes('role="img"') &&
				renderedHtml.includes(
					calendar.totalContributions.toLocaleString("zh-CN"),
				),
		},
		{
			name: "the activity view links to the canonical GitHub profile",
			pass: renderedHtml.includes(`https://github.com/${calendar.username}`),
		},
		{
			name: "narrow screens start at the most recent contribution weeks",
			pass: projectsSource.includes(
				"scroller.scrollLeft = scroller.scrollWidth",
			),
		},
		{
			name: "calendar motion respects reduced-motion preferences",
			pass:
				css.includes("@media (prefers-reduced-motion: reduce)") &&
				css.includes(".github-contribution-week"),
		},
		{
			name: "the generator prefers official GraphQL with a public fallback",
			pass:
				generatorSource.includes("https://api.github.com/graphql") &&
				generatorSource.includes("fetchPublicProfileSnapshot"),
		},
		{
			name: "a failed refresh preserves the last valid snapshot",
			pass: generatorSource.includes("keeping the existing snapshot"),
		},
		{
			name: "deployment refreshes contribution data before building",
			pass: refreshStep !== -1 && buildStep !== -1 && refreshStep < buildStep,
		},
	];

	console.log(
		JSON.stringify(
			{
				username: calendar.username,
				from: calendar.from,
				to: calendar.to,
				totalContributions: calendar.totalContributions,
				weeks: calendar.weeks.length,
				days: days.length,
				renderedDayCount,
				htmlBytes: Buffer.byteLength(renderedHtml),
			},
			null,
			2,
		),
	);
	for (const check of checks) {
		console.log(`${check.pass ? "PASS" : "FAIL"} ${check.name}`);
	}
	if (checks.some((check) => !check.pass)) process.exitCode = 1;
} finally {
	await vite.close();
}
