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
	searchText: string;
	absolutePath: string;
};

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

	return {
		file,
		title: fields.title || filename,
		date: fields.date || "",
		order: Number.isNaN(order) ? undefined : order,
		sidebarAfter,
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
					({ file, title, date, order, sidebarAfter }) => ({
						file,
						title,
						date,
						order,
						sidebarAfter,
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
