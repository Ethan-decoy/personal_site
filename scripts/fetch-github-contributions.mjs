import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_USERNAME = "Ethan-decoy";
const OUTPUT_URL = new URL(
	"../src/data/github-contributions.json",
	import.meta.url,
);
const GRAPHQL_LEVELS = {
	NONE: 0,
	FIRST_QUARTILE: 1,
	SECOND_QUARTILE: 2,
	THIRD_QUARTILE: 3,
	FOURTH_QUARTILE: 4,
};

function readAttributes(tag) {
	return Object.fromEntries(
		[...tag.matchAll(/\s([\w:-]+)="([^"]*)"/g)].map((match) => [
			match[1],
			match[2],
		]),
	);
}

function decodeHtmlText(value) {
	return value
		.replace(/<[^>]+>/g, "")
		.replaceAll("&amp;", "&")
		.replaceAll("&quot;", '"')
		.replaceAll("&#39;", "'")
		.replaceAll("&apos;", "'")
		.trim();
}

function weekdayOf(date) {
	return new Date(`${date}T00:00:00Z`).getUTCDay();
}

function firstDayOfWeek(date) {
	const value = new Date(`${date}T00:00:00Z`);
	value.setUTCDate(value.getUTCDate() - value.getUTCDay());
	return value.toISOString().slice(0, 10);
}

function groupDaysIntoWeeks(days) {
	const weeks = new Map();
	for (const day of days) {
		const firstDay = firstDayOfWeek(day.date);
		const week = weeks.get(firstDay) ?? Array.from({ length: 7 }, () => null);
		const weekday = weekdayOf(day.date);
		if (week[weekday]) {
			throw new Error(`Duplicate contribution date: ${day.date}`);
		}
		week[weekday] = day;
		weeks.set(firstDay, week);
	}

	return [...weeks.entries()]
		.sort(([left], [right]) => left.localeCompare(right))
		.map(([firstDay, weekDays]) => ({ firstDay, days: weekDays }));
}

function createSnapshot({ username, source, days, totalContributions }) {
	const sortedDays = [...days].sort((left, right) =>
		left.date.localeCompare(right.date),
	);
	if (sortedDays.length < 350 || sortedDays.length > 371) {
		throw new Error(
			`Expected roughly one year of contribution days, received ${sortedDays.length}`,
		);
	}

	const dates = new Set(sortedDays.map((day) => day.date));
	if (dates.size !== sortedDays.length) {
		throw new Error("Contribution calendar contains duplicate dates");
	}

	return {
		version: 1,
		username,
		generatedAt: new Date().toISOString(),
		source,
		from: sortedDays[0].date,
		to: sortedDays.at(-1).date,
		totalContributions,
		weeks: groupDaysIntoWeeks(sortedDays),
	};
}

async function fetchGraphqlSnapshot(username, token) {
	const query = `
		query Contributions($login: String!) {
			user(login: $login) {
				contributionsCollection {
					contributionCalendar {
						totalContributions
						weeks {
							contributionDays {
								date
								contributionCount
								contributionLevel
							}
						}
					}
				}
			}
		}
	`;
	const response = await fetch("https://api.github.com/graphql", {
		method: "POST",
		headers: {
			Accept: "application/vnd.github+json",
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
			"User-Agent": "Ethan-decoy-personal-site",
		},
		body: JSON.stringify({ query, variables: { login: username } }),
	});

	if (!response.ok) {
		throw new Error(
			`GitHub GraphQL returned ${response.status} ${response.statusText}`,
		);
	}

	const payload = await response.json();
	if (payload.errors?.length) {
		throw new Error(
			`GitHub GraphQL error: ${payload.errors
				.map((error) => error.message)
				.join("; ")}`,
		);
	}

	const calendar =
		payload.data?.user?.contributionsCollection?.contributionCalendar;
	if (!calendar) {
		throw new Error(`GitHub user not found: ${username}`);
	}

	const days = calendar.weeks.flatMap((week) =>
		week.contributionDays.map((day) => {
			const level = GRAPHQL_LEVELS[day.contributionLevel];
			if (level === undefined) {
				throw new Error(`Unknown contribution level: ${day.contributionLevel}`);
			}
			return {
				date: day.date,
				count: day.contributionCount,
				level,
			};
		}),
	);

	return createSnapshot({
		username,
		source: "github-graphql",
		days,
		totalContributions: calendar.totalContributions,
	});
}

function readTooltipCount(value) {
	if (/^No contributions\b/i.test(value)) return 0;
	const match = value.match(/^([\d,]+)\s+contributions?\b/i);
	if (!match) {
		throw new Error(`Could not parse contribution tooltip: ${value}`);
	}
	return Number.parseInt(match[1].replaceAll(",", ""), 10);
}

async function fetchPublicProfileSnapshot(username) {
	const response = await fetch(
		`https://github.com/users/${encodeURIComponent(username)}/contributions`,
		{
			headers: {
				Accept: "text/html",
				"User-Agent": "Ethan-decoy-personal-site",
			},
		},
	);
	if (!response.ok) {
		throw new Error(
			`GitHub contributions page returned ${response.status} ${response.statusText}`,
		);
	}

	const html = await response.text();
	const tooltipCounts = new Map();
	for (const match of html.matchAll(
		/<tool-tip\b([^>]*)>([\s\S]*?)<\/tool-tip>/g,
	)) {
		const attributes = readAttributes(match[1]);
		if (!attributes.for) continue;
		tooltipCounts.set(
			attributes.for,
			readTooltipCount(decodeHtmlText(match[2])),
		);
	}

	const days = [];
	for (const match of html.matchAll(/<td\b[^>]*>/g)) {
		const attributes = readAttributes(match[0]);
		if (!attributes.class?.split(/\s+/).includes("ContributionCalendar-day")) {
			continue;
		}

		const count = tooltipCounts.get(attributes.id);
		const level = Number.parseInt(attributes["data-level"], 10);
		if (
			!attributes["data-date"] ||
			count === undefined ||
			!Number.isInteger(level) ||
			level < 0 ||
			level > 4
		) {
			throw new Error("GitHub contribution cell is missing required data");
		}
		days.push({
			date: attributes["data-date"],
			count,
			level,
		});
	}

	return createSnapshot({
		username,
		source: "github-public-profile",
		days,
		totalContributions: days.reduce((total, day) => total + day.count, 0),
	});
}

function errorMessage(error) {
	return error instanceof Error ? error.message : String(error);
}

async function hasUsableSnapshot(outputPath) {
	try {
		const snapshot = JSON.parse(await readFile(outputPath, "utf8"));
		return (
			snapshot?.version === 1 &&
			typeof snapshot.username === "string" &&
			Array.isArray(snapshot.weeks) &&
			snapshot.weeks.length >= 52
		);
	} catch {
		return false;
	}
}

async function main() {
	const username = process.env.GITHUB_USERNAME?.trim() || DEFAULT_USERNAME;
	const token = process.env.GITHUB_TOKEN?.trim();
	const outputPath = fileURLToPath(OUTPUT_URL);
	let snapshot;

	if (token) {
		try {
			snapshot = await fetchGraphqlSnapshot(username, token);
		} catch (error) {
			console.warn(
				`GraphQL contribution refresh failed; using the public profile fallback: ${errorMessage(error)}`,
			);
		}
	}

	if (!snapshot) {
		try {
			snapshot = await fetchPublicProfileSnapshot(username);
		} catch (error) {
			if (await hasUsableSnapshot(outputPath)) {
				console.warn(
					`Contribution refresh failed; keeping the existing snapshot: ${errorMessage(error)}`,
				);
				return;
			}
			throw error;
		}
	}

	await mkdir(dirname(outputPath), { recursive: true });
	await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
	console.log(
		`Wrote ${snapshot.totalContributions} contributions across ${snapshot.weeks.length} weeks to ${outputPath}`,
	);
}

await main();
