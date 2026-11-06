import rawSnapshot from "./data/github-contributions.json";

export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

export interface ContributionDay {
	date: string;
	count: number;
	level: ContributionLevel;
}

export interface ContributionWeek {
	firstDay: string;
	days: Array<ContributionDay | null>;
}

export interface GitHubContributionCalendar {
	username: string;
	from: string;
	to: string;
	totalContributions: number;
	weeks: ContributionWeek[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown, field: string): string {
	if (typeof value !== "string" || value.length === 0) {
		throw new Error(`Invalid GitHub contribution snapshot field: ${field}`);
	}
	return value;
}

function readNonNegativeInteger(value: unknown, field: string): number {
	if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
		throw new Error(`Invalid GitHub contribution snapshot field: ${field}`);
	}
	return value;
}

function readDay(value: unknown, field: string): ContributionDay | null {
	if (value === null) return null;
	if (!isRecord(value)) {
		throw new Error(`Invalid GitHub contribution snapshot field: ${field}`);
	}
	const level = readNonNegativeInteger(value.level, `${field}.level`);
	if (level > 4) {
		throw new Error(`Invalid GitHub contribution level: ${level}`);
	}
	return {
		date: readString(value.date, `${field}.date`),
		count: readNonNegativeInteger(value.count, `${field}.count`),
		level: level as ContributionLevel,
	};
}

function readCalendar(value: unknown): GitHubContributionCalendar {
	if (!isRecord(value) || !Array.isArray(value.weeks)) {
		throw new Error("Invalid GitHub contribution snapshot");
	}

	const weeks = value.weeks.map((week, weekIndex) => {
		if (
			!isRecord(week) ||
			!Array.isArray(week.days) ||
			week.days.length !== 7
		) {
			throw new Error(`Invalid GitHub contribution week: ${weekIndex}`);
		}
		return {
			firstDay: readString(week.firstDay, `weeks[${weekIndex}].firstDay`),
			days: week.days.map((day, dayIndex) =>
				readDay(day, `weeks[${weekIndex}].days[${dayIndex}]`),
			),
		};
	});

	if (weeks.length < 52 || weeks.length > 54) {
		throw new Error(`Invalid GitHub contribution week count: ${weeks.length}`);
	}

	const dates = weeks.flatMap((week) =>
		week.days.flatMap((day) => (day ? [day.date] : [])),
	);
	if (new Set(dates).size !== dates.length) {
		throw new Error("GitHub contribution snapshot contains duplicate dates");
	}

	return {
		username: readString(value.username, "username"),
		from: readString(value.from, "from"),
		to: readString(value.to, "to"),
		totalContributions: readNonNegativeInteger(
			value.totalContributions,
			"totalContributions",
		),
		weeks,
	};
}

export const githubContributionCalendar = readCalendar(rawSnapshot);
