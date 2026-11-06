import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import type { Plugin, ViteDevServer } from "vite";

const NOTES_MANIFEST_ID = "virtual:notes-manifest";
const NOTES_SEARCH_INDEX_ID = "virtual:notes-search-index";
const RESOLVED_NOTES_MANIFEST_ID = `\0${NOTES_MANIFEST_ID}`;
const RESOLVED_NOTES_SEARCH_INDEX_ID = `\0${NOTES_SEARCH_INDEX_ID}`;
const NOTES_SEARCH_CHUNK_PREFIX = `${NOTES_SEARCH_INDEX_ID}/`;
const RESOLVED_NOTES_SEARCH_CHUNK_PREFIX = `\0${NOTES_SEARCH_CHUNK_PREFIX}`;
const SEARCH_CHUNK_TARGET_BYTES = 256 * 1024;

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

function createSearchChunks(notes: NoteManifestRecord[]): string[] {
	// Keep each note intact; a single large note can exceed the chunk target.
	const chunks: string[] = [];
	let entries: string[] = [];
	let bytes = 2;
	for (const { file, searchText } of notes) {
		const entry = JSON.stringify({ file, body: searchText.toLowerCase() });
		const entryBytes = Buffer.byteLength(entry, "utf8");
		if (entries.length && bytes + 1 + entryBytes > SEARCH_CHUNK_TARGET_BYTES) {
			chunks.push(`[${entries.join(",")}]`);
			entries = [];
			bytes = 2;
		}
		bytes += entryBytes + (entries.length ? 1 : 0);
		entries.push(entry);
	}
	if (entries.length) chunks.push(`[${entries.join(",")}]`);
	return chunks;
}

export function notesManifestPlugin(): Plugin {
	let notesRoot = "";
	let snapshot:
		| Promise<{
				notes: NoteManifestRecord[];
				chunks: string[];
		  }>
		| undefined;
	const loadedChunkIds = new Set<string>();

	function getSnapshot() {
		snapshot ??= collectNotes(notesRoot)
			.then((notes) => ({ notes, chunks: createSearchChunks(notes) }))
			.catch((error) => {
				snapshot = undefined;
				throw error;
			});
		return snapshot;
	}

	function isNotePath(file: string) {
		const relativePath = path.relative(notesRoot, file);
		return (
			!relativePath.startsWith("..") &&
			!path.isAbsolute(relativePath) &&
			file.endsWith(".md")
		);
	}

	function invalidateIndexes(server: ViteDevServer) {
		snapshot = undefined;
		const affected = [
			RESOLVED_NOTES_MANIFEST_ID,
			RESOLVED_NOTES_SEARCH_INDEX_ID,
			...loadedChunkIds,
		]
			.map((id) => server.moduleGraph.getModuleById(id))
			.filter((module) => module !== undefined);
		for (const module of affected) server.moduleGraph.invalidateModule(module);
		return affected;
	}

	return {
		name: "notes-manifest",
		configResolved(config) {
			notesRoot = path.resolve(config.root, "src/notes");
		},
		buildStart() {
			snapshot = undefined;
		},
		configureServer(server) {
			const refreshStructure = (file: string) => {
				if (!isNotePath(file)) return;
				invalidateIndexes(server);
				server.ws.send({ type: "full-reload" });
			};
			server.watcher.on("add", refreshStructure);
			server.watcher.on("unlink", refreshStructure);
		},
		resolveId(id) {
			if (id === NOTES_MANIFEST_ID) return RESOLVED_NOTES_MANIFEST_ID;
			if (id === NOTES_SEARCH_INDEX_ID) return RESOLVED_NOTES_SEARCH_INDEX_ID;
			if (
				id.startsWith(NOTES_SEARCH_CHUNK_PREFIX) &&
				/^\d+$/.test(id.slice(NOTES_SEARCH_CHUNK_PREFIX.length))
			) {
				const resolved = `\0${id}`;
				loadedChunkIds.add(resolved);
				return resolved;
			}
		},
		async load(id) {
			const isSearchChunk = id.startsWith(RESOLVED_NOTES_SEARCH_CHUNK_PREFIX);
			if (
				id !== RESOLVED_NOTES_MANIFEST_ID &&
				id !== RESOLVED_NOTES_SEARCH_INDEX_ID &&
				!isSearchChunk
			) {
				return;
			}

			this.addWatchFile(notesRoot);
			const { notes, chunks } = await getSnapshot();
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

			if (isSearchChunk) {
				const index = Number(
					id.slice(RESOLVED_NOTES_SEARCH_CHUNK_PREFIX.length),
				);
				const chunk = chunks[index];
				if (chunk === undefined)
					throw new Error(`Unknown notes search chunk: ${id}`);
				return `export default ${chunk};`;
			}

			const imports = chunks.map(
				(_, index) =>
					`import(${JSON.stringify(`${NOTES_SEARCH_CHUNK_PREFIX}${index}`)})`,
			);
			return `export default async function loadSearchIndex() {
				const chunks = await Promise.all([${imports.join(",")}]);
				return chunks.flatMap((chunk) => chunk.default);
			}`;
		},
		handleHotUpdate({ file, server }) {
			if (!isNotePath(file)) return;
			return invalidateIndexes(server);
		},
	};
}
