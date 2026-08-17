const rawModules = import.meta.glob("./**/*.md", {
	eager: true,
	query: "?raw",
	import: "default",
}) as Record<string, string>;

const WIKI_FILE = "./wiki.md";
const INDEX_FILE_SUFFIX = "/_index.md";
const DIRECTORY_LABELS: Record<string, string> = {
	ai: "AI",
	books: "书籍",
	cpp: "C++",
	math: "数学",
	philosophy: "哲学",
	robotics: "机器人",
	ros2: "ROS 2",
};

interface Frontmatter {
	title: string;
	date: string;
	order?: number;
}

export interface NoteContent {
	file: string;
	title: string;
	date: string;
	content: string;
}

export interface NestedFileNode {
	title: string;
	date: string;
	order?: number;
	file: string;
	filename: string;
}

export interface NestedTreeNode {
	key: string;
	title: string;
	noteCount: number;
	children: (NestedTreeNode | NestedFileNode)[];
	isDir: true;
	indexFile?: string;
}

export interface SearchResult {
	title: string;
	date: string;
	file: string;
	category: string;
}

export interface NoteSuggestion {
	title: string;
	file: string;
}

export interface NoteLinkTarget {
	file: string;
	anchor: string | null;
	isWiki: boolean;
}

interface DirectoryBuilder {
	key: string;
	title: string;
	dirs: Record<string, DirectoryBuilder>;
	files: NestedFileNode[];
}

interface NotesIndex {
	sidebarTree: NestedTreeNode[];
	notesByFile: Record<string, NoteContent>;
	directoryTitles: Record<string, string>;
	visibleFiles: string[];
	isEmpty: boolean;
}

function parseFrontmatter(raw: string): Frontmatter {
	const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
	if (!m) return { title: "", date: "" };
	const fm = Object.fromEntries(
		m[1].split("\n").map((line) => {
			const idx = line.indexOf(":");
			return idx === -1
				? [line.trim(), ""]
				: [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
		}),
	);
	const order = fm.order !== undefined ? Number(fm.order) : undefined;
	return {
		title: fm.title || "",
		date: fm.date || "",
		order: Number.isNaN(order) ? undefined : order,
	};
}

function parseMarkdownBody(raw: string): string {
	const normalized = raw.replace(/\r\n/g, "\n");
	const m = normalized.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
	return m ? m[2].trim() : normalized.trim();
}

function fallbackTitle(file: string): string {
	const parts = file.replace(/^\.\//, "").replace(/\.md$/, "").split("/");
	return parts[parts.length - 1] || "Untitled";
}

function fileName(file: string): string {
	return file.replace(/^.*\//, "");
}

function isIndexFile(file: string): boolean {
	return file.endsWith(INDEX_FILE_SUFFIX);
}

function normalizeFileKey(file: string): string {
	const normalized = file.replace(/\\/g, "/").replace(/^\/+/, "");
	return normalized.startsWith("./") ? normalized : `./${normalized}`;
}

function isPrivateNoteFile(file: string): boolean {
	const directories = normalizeFileKey(file)
		.replace(/^\.\//, "")
		.split("/")
		.slice(0, -1);
	return directories.some((segment) => segment.startsWith("_"));
}

function fallbackDirectoryTitle(segment: string): string {
	if (DIRECTORY_LABELS[segment.toLowerCase()]) {
		return DIRECTORY_LABELS[segment.toLowerCase()];
	}

	return segment
		.replace(/[-_]+/g, " ")
		.replace(/\b[a-z]/g, (character) => character.toUpperCase());
}

function directoryKeyForIndexFile(file: string): string {
	return file.replace(/^\.\//, "").replace(/\/_index\.md$/, "");
}

function directoryKeyForFile(file: string): string {
	const parts = normalizeFileKey(file).replace(/^\.\//, "").split("/");
	return parts.length > 1 ? parts.slice(0, -1).join("/") : "";
}

function extractPrefix(file: string): number {
	const m = fileName(file).match(/^(\d+)/);
	return m ? Number.parseInt(m[1], 10) : Number.POSITIVE_INFINITY;
}

function compareFiles(a: NestedFileNode, b: NestedFileNode): number {
	if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
	if (a.order !== undefined) return -1;
	if (b.order !== undefined) return 1;
	const aNum = extractPrefix(a.file);
	const bNum = extractPrefix(b.file);
	if (aNum !== bNum) return aNum - bNum;
	if (a.date && b.date) return b.date.localeCompare(a.date);
	return a.title.localeCompare(b.title);
}

const directoryCollator = new Intl.Collator("en", {
	numeric: true,
	sensitivity: "base",
});

function compareDirectories(a: NestedTreeNode, b: NestedTreeNode): number {
	const aParts = a.key.split("/");
	const bParts = b.key.split("/");
	const aSegment = aParts[aParts.length - 1] ?? a.key;
	const bSegment = bParts[bParts.length - 1] ?? b.key;
	return directoryCollator.compare(aSegment, bSegment);
}

function isNestedTreeNode(
	node: NestedTreeNode | NestedFileNode,
): node is NestedTreeNode {
	return "key" in node;
}

function buildNotesIndex(): NotesIndex {
	const notesByFile: Record<string, NoteContent> = {};
	const directoryIndexes: Record<string, string> = {};
	const directoryTitles: Record<string, string> = {};
	const visibleFiles: string[] = [];
	const root: DirectoryBuilder = { key: "", title: "", dirs: {}, files: [] };

	for (const [file, raw] of Object.entries(rawModules)) {
		const fm = parseFrontmatter(raw);
		notesByFile[file] = {
			file,
			title: fm.title || fallbackTitle(file),
			date: fm.date,
			content: parseMarkdownBody(raw),
		};

		if (isIndexFile(file)) {
			directoryIndexes[directoryKeyForIndexFile(file)] = file;
			continue;
		}
		if (file === WIKI_FILE || isPrivateNoteFile(file)) continue;

		visibleFiles.push(file);
		const parts = file.replace(/^\.\//, "").split("/");
		let current = root;
		for (let i = 0; i < parts.length - 1; i++) {
			const key = parts.slice(0, i + 1).join("/");
			if (!current.dirs[key]) {
				current.dirs[key] = {
					key,
					title: fallbackDirectoryTitle(parts[i]),
					dirs: {},
					files: [],
				};
			}
			current = current.dirs[key];
		}
		current.files.push({
			title: fm.title || fallbackTitle(file),
			date: fm.date,
			order: fm.order,
			file,
			filename: fileName(file),
		});
	}

	function toTreeNode(builder: DirectoryBuilder): NestedTreeNode {
		const indexFile = directoryIndexes[builder.key];
		const dirChildren = Object.values(builder.dirs)
			.map(toTreeNode)
			.sort(compareDirectories);
		const fileChildren = [...builder.files].sort(compareFiles);
		const title = indexFile ? notesByFile[indexFile].title : builder.title;
		directoryTitles[builder.key] = title;

		return {
			key: builder.key,
			title,
			noteCount:
				fileChildren.length +
				dirChildren.reduce((total, child) => total + child.noteCount, 0),
			children: [...dirChildren, ...fileChildren],
			isDir: true,
			indexFile,
		};
	}

	const sidebarTree = Object.values(root.dirs)
		.map(toTreeNode)
		.sort(compareDirectories);

	return {
		sidebarTree,
		notesByFile,
		directoryTitles,
		visibleFiles,
		isEmpty: visibleFiles.length === 0,
	};
}

export const notesIndex = buildNotesIndex();

export function getSidebarTree(): NestedTreeNode[] {
	return notesIndex.sidebarTree;
}

export function isNotesEmpty(): boolean {
	return notesIndex.isEmpty;
}

export function getInitialExpandedKeys(): Set<string> {
	return new Set();
}

export function getNote(file: string): NoteContent | null {
	return notesIndex.notesByFile[normalizeFileKey(file)] ?? null;
}

export function expandedKeysForFile(file: string): Set<string> {
	const keys = new Set<string>();
	const parts = normalizeFileKey(file).replace(/^\.\//, "").split("/");
	for (let i = 0; i < parts.length - 1; i++) {
		keys.add(parts.slice(0, i + 1).join("/"));
	}
	return keys;
}

export function isDirectoryNode(
	node: NestedTreeNode | NestedFileNode,
): node is NestedTreeNode {
	return isNestedTreeNode(node);
}

export function searchNotes(query: string): SearchResult[] {
	if (!query.trim()) return [];
	const q = query.toLowerCase().trim();
	const results: SearchResult[] = [];

	for (const file of notesIndex.visibleFiles) {
		const note = notesIndex.notesByFile[file];
		const raw = rawModules[file] || "";
		const titleMatch = note.title.toLowerCase().includes(q);
		const bodyMatch = raw.toLowerCase().includes(q);

		if (titleMatch || bodyMatch) {
			const directoryKey = directoryKeyForFile(file);
			const segments = directoryKey ? directoryKey.split("/") : [];
			const category =
				segments
					.map((_, index) => {
						const key = segments.slice(0, index + 1).join("/");
						return (
							notesIndex.directoryTitles[key] ??
							fallbackDirectoryTitle(segments[index])
						);
					})
					.join(" › ") || "其他";
			results.push({
				title: note.title,
				date: note.date,
				file,
				category,
			});
		}
	}

	results.sort((a, b) => {
		const aTitle = a.title.toLowerCase().includes(q);
		const bTitle = b.title.toLowerCase().includes(q);
		if (aTitle && !bTitle) return -1;
		if (!aTitle && bTitle) return 1;
		return a.title.localeCompare(b.title);
	});

	return results;
}

export function getSuggestions(query: string): NoteSuggestion[] {
	if (!query.trim()) return [];
	const q = query.toLowerCase().trim();
	const suggestions: NoteSuggestion[] = [];

	for (const file of notesIndex.visibleFiles) {
		const note = notesIndex.notesByFile[file];
		const title = note.title.toLowerCase();
		let qi = 0;
		for (let ti = 0; ti < title.length && qi < q.length; ti++) {
			if (title[ti] === q[qi]) qi++;
		}
		if (qi === q.length) {
			suggestions.push({ title: note.title, file });
		}
	}

	return suggestions.slice(0, 10);
}

function safeDecode(value: string): string {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

function normalizePathParts(parts: string[]): string[] {
	const normalized: string[] = [];
	for (const part of parts) {
		if (!part || part === ".") continue;
		if (part === "..") {
			normalized.pop();
			continue;
		}
		normalized.push(part);
	}
	return normalized;
}

function pathCandidatesFromParts(
	parts: string[],
	directoryFirst: boolean,
): string[] {
	const joined = parts.join("/");
	if (!joined) return [];
	if (joined.endsWith(".md")) return [`./${joined}`];

	const fileCandidate = `./${joined}.md`;
	const indexCandidate = `./${joined}/_index.md`;
	return directoryFirst
		? [indexCandidate, fileCandidate]
		: [fileCandidate, indexCandidate];
}

function resolvePathCandidates(path: string, fromFile: string): string[] {
	const decodedPath = safeDecode(path).replace(/\\/g, "/");
	const baseParts = decodedPath.startsWith("/")
		? []
		: directoryKeyForFile(fromFile).split("/").filter(Boolean);
	const rawParts = decodedPath.replace(/^\/+/, "").split("/");
	const parts = normalizePathParts([...baseParts, ...rawParts]);
	return pathCandidatesFromParts(parts, decodedPath.endsWith("/"));
}

function resolveRootPathCandidates(path: string): string[] {
	const decodedPath = safeDecode(path).replace(/\\/g, "/").replace(/^\/+/, "");
	const parts = normalizePathParts(decodedPath.split("/"));
	return pathCandidatesFromParts(parts, decodedPath.endsWith("/"));
}

function findFirstNoteFile(candidates: string[]): string | null {
	for (const candidate of candidates) {
		const file = normalizeFileKey(candidate);
		if (notesIndex.notesByFile[file]) return file;
	}
	return null;
}

export function resolveNoteHref(
	href: string,
	fromFile: string,
): NoteLinkTarget | null {
	if (!href) return null;
	if (/^[a-z][a-z\d+.-]*:/i.test(href) || href.startsWith("//")) return null;

	const [pathPart, ...anchorParts] = href.split("#");
	const anchor =
		anchorParts.length > 0 ? safeDecode(anchorParts.join("#")) : null;
	let file = pathPart
		? findFirstNoteFile(resolvePathCandidates(pathPart, fromFile))
		: normalizeFileKey(fromFile);

	if (pathPart && !file) {
		file = findFirstNoteFile(resolveRootPathCandidates(pathPart));
	}

	if (!file || !notesIndex.notesByFile[file]) return null;

	return {
		file,
		anchor,
		isWiki: file === WIKI_FILE,
	};
}
