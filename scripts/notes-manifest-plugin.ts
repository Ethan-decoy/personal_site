import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import type { Plugin } from "vite";

const NOTES_MANIFEST_ID = "virtual:notes-manifest";
const NOTES_SEARCH_INDEX_ID = "virtual:notes-search-index";
const RESOLVED_NOTES_MANIFEST_ID = `\0${NOTES_MANIFEST_ID}`;
const RESOLVED_NOTES_SEARCH_INDEX_ID = `\0${NOTES_SEARCH_INDEX_ID}`;

type NoteManifestRecord = {
	file: string;
	title: string;
	date: string;
	order?: number;
	sidebarAfter?: string;
	sidebarGroups?: SidebarGroup[];
	searchText: string;
	absolutePath: string;
};

type SidebarGroup = {
	title: string;
	directories: string[];
};

export function parseSidebarGroups(body: string, file: string): SidebarGroup[] {
	const groups: SidebarGroup[] = [];
	const directories = new Set<string>();
	let fence: string | undefined;
	for (const line of body.split("\n")) {
		const fenceMatch = /^\s*(\x60{3,}|~{3,})/.exec(line);
		if (fenceMatch) {
			if (!fence) fence = fenceMatch[1];
			else if (
				fenceMatch[1][0] === fence[0] &&
				fenceMatch[1].length >= fence.length
			)
				fence = undefined;
			continue;
		}
		if (fence) continue;
		const heading = /^##\s+(.+?)\s*$/.exec(line);
		if (heading) {
			if (groups.some((group) => group.title === heading[1])) {
				throw new Error(`Duplicate sidebar group ${heading[1]} in ${file}`);
			}
			groups.push({ title: heading[1], directories: [] });
			continue;
		}
		const item = /^\s*(?:[-*+]|\d+[.)])\s+\[([^\]]+)\]\(([^)]+)\)\s*$/.exec(
			line,
		);
		if (!item) continue;
		const target = /^(?:\.\/)?([^/]+)\/_index\.md$/.exec(item[2]);
		const group = groups.at(-1);
		if (
			!group ||
			!target ||
			target[1] === "." ||
			target[1] === ".." ||
			target[1].startsWith("_") ||
			/[:\\?#]/.test(target[1])
		) {
			throw new Error(
				`Invalid sidebar group link ${item[2]} in ${file}: use a direct child directory index under a level-two heading`,
			);
		}
		const directory = path.posix.join(path.posix.dirname(file), target[1]);
		if (directories.has(directory)) {
			throw new Error(
				`Duplicate sidebar group directory ${directory} in ${file}`,
			);
		}
		directories.add(directory);
		group.directories.push(directory);
	}
	if (!groups.length || groups.some((group) => !group.directories.length)) {
		throw new Error(
			`Invalid sidebar groups in ${file}: each level-two heading needs child directory links`,
		);
	}
	return groups;
}

function parseNote(
	raw: string,
	file: string,
): Omit<NoteManifestRecord, "absolutePath"> {
	const normalized = raw.replace(/\r\n/g, "\n");
	const match = normalized.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
	const frontmatter = match?.[1] ?? "";
	const fields = Object.fromEntries(
		frontmatter.split("\n").map((line) => {
			const separator = line.indexOf(":");
			return separator === -1
				? [line.trim(), ""]
				: [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
		}),
	);
	const filename = file.replace(/^.*\//, "").replace(/\.md$/, "");
	const order = fields.order === undefined ? undefined : Number(fields.order);
	const sidebarAfter = fields.sidebarAfter?.trim() || undefined;
	if (
		fields.sidebarGroups &&
		(fields.sidebarGroups !== "headings" || !file.endsWith("/_index.md"))
	) {
		throw new Error(
			`Invalid sidebarGroups in ${file}: use headings on a directory index`,
		);
	}

	return {
		file,
		title: fields.title || filename,
		date: fields.date || "",
		order: Number.isNaN(order) ? undefined : order,
		sidebarAfter,
		sidebarGroups: fields.sidebarGroups
			? parseSidebarGroups(match?.[2] ?? "", file)
			: undefined,
		searchText: normalized.trim(),
	};
}

async function collectNoteFiles(directory: string): Promise<string[]> {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = await Promise.all(
		entries.map(async (entry) => {
			const absolutePath = path.join(directory, entry.name);
			if (entry.isDirectory()) {
				if (entry.name.startsWith("_")) return [];
				return collectNoteFiles(absolutePath);
			}
			if (!entry.isFile() || !entry.name.endsWith(".md")) return [];
			return [absolutePath];
		}),
	);
	return files.flat();
}

async function collectNotes(notesRoot: string): Promise<NoteManifestRecord[]> {
	const files = (await collectNoteFiles(notesRoot)).sort((left, right) =>
		left.localeCompare(right),
	);
	return Promise.all(
		files.map(async (absolutePath) => {
			const relativePath = path
				.relative(notesRoot, absolutePath)
				.replaceAll("\\", "/");
			const file = `./${relativePath}`;
			return {
				...parseNote(await readFile(absolutePath, "utf8"), file),
				absolutePath,
			};
		}),
	);
}

export function notesManifestPlugin(): Plugin {
	let notesRoot = "";

	return {
		name: "notes-manifest",
		configResolved(config) {
			notesRoot = path.resolve(config.root, "src/notes");
		},
		resolveId(id) {
			if (id === NOTES_MANIFEST_ID) return RESOLVED_NOTES_MANIFEST_ID;
			if (id === NOTES_SEARCH_INDEX_ID) return RESOLVED_NOTES_SEARCH_INDEX_ID;
		},
		async load(id) {
			if (
				id !== RESOLVED_NOTES_MANIFEST_ID &&
				id !== RESOLVED_NOTES_SEARCH_INDEX_ID
			) {
				return;
			}

			this.addWatchFile(notesRoot);
			const notes = await collectNotes(notesRoot);
			for (const note of notes) this.addWatchFile(note.absolutePath);

			if (id === RESOLVED_NOTES_MANIFEST_ID) {
				const manifest = notes.map(
					({ file, title, date, order, sidebarAfter, sidebarGroups }) => ({
						file,
						title,
						date,
						order,
						sidebarAfter,
						sidebarGroups,
					}),
				);
				return `export default ${JSON.stringify(manifest)};`;
			}

			const searchIndex = notes.map(({ file, searchText }) => ({
				file,
				body: searchText.toLowerCase(),
			}));
			return `export default ${JSON.stringify(searchIndex)};`;
		},
		handleHotUpdate({ file, server }) {
			const relativePath = path.relative(notesRoot, file);
			if (
				relativePath.startsWith("..") ||
				path.isAbsolute(relativePath) ||
				!file.endsWith(".md")
			) {
				return;
			}

			const affected = [
				server.moduleGraph.getModuleById(RESOLVED_NOTES_MANIFEST_ID),
				server.moduleGraph.getModuleById(RESOLVED_NOTES_SEARCH_INDEX_ID),
			].filter((module) => module !== undefined);
			for (const module of affected)
				server.moduleGraph.invalidateModule(module);
			return affected;
		},
	};
}
