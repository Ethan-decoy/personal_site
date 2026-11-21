import assert from "node:assert/strict";
import { EventEmitter, once } from "node:events";
import {
	copyFile,
	mkdir,
	mkdtemp,
	realpath,
	rm,
	writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
const quietServer = { middlewareMode: true, watch: null, ws: false };
const bootstrap = await createServer({
	root,
	server: quietServer,
	appType: "custom",
	logLevel: "silent",
});
let notesManifestPlugin;
try {
	({ notesManifestPlugin } = await bootstrap.ssrLoadModule(
		"/scripts/notes-manifest-plugin.ts",
	));
} finally {
	await bootstrap.close();
}

const buildDirectory = path.join(root, "dist");
await mkdir(buildDirectory, { recursive: true });
const temporaryRoot = await realpath(buildDirectory);
const fixturePrefix = "personal-site-notes-manifest-";
const fixture = await mkdtemp(path.join(temporaryRoot, fixturePrefix));
const notesRoot = path.join(fixture, "src/notes");
const first = {
	file: "./existing/first.md",
	title: "已有笔记",
	body: "Existing article body.",
};
const second = {
	file: "./new-category/新 笔记.md",
	title: "新增笔记",
	body: "New article body.",
	code: "const marker = 1;",
};
const draft = {
	file: "./existing/_drafts/private.md",
	title: "私有草稿",
	body: "Private draft body.",
};
const hidden = {
	file: "./existing/.hidden.md",
	title: "隐藏笔记",
	body: "Hidden article body.",
};
const updates = new EventEmitter();
let server;

function markdownBody({ title, body, code }) {
	return [
		`# ${title}`,
		body,
		...(code ? [`\`\`\`js\n${code}\n\`\`\``] : []),
	].join("\n\n");
}

async function writeNote(note) {
	const { file, title } = note;
	const absolutePath = path.join(notesRoot, file);
	await mkdir(path.dirname(absolutePath), { recursive: true });
	await writeFile(
		absolutePath,
		`---\ntitle: ${title}\ndate: 2026-11-13\n---\n\n${markdownBody(note)}\n`,
	);
	return absolutePath;
}

try {
	await writeNote(first);
	await writeNote(draft);
	await writeNote(hidden);
	await copyFile(
		path.join(root, "src/notes/index.ts"),
		path.join(notesRoot, "index.ts"),
	);
	server = await createServer({
		root: fixture,
		configFile: false,
		plugins: [
			notesManifestPlugin(),
			{
				name: "observe-note-update",
				enforce: "post",
				handleHotUpdate() {
					updates.emit("handled");
				},
			},
		],
		server: quietServer,
		appType: "custom",
		logLevel: "silent",
	});

	function readNotes() {
		return server.ssrLoadModule("/src/notes/index.ts");
	}

	async function assertPublicNotes(notes, expected) {
		const files = expected.map(({ file }) => file).sort();
		const catalog = notes
			.getSidebarTree()
			.flatMap(({ children }) => children.map(({ file }) => file));
		assert.deepEqual(catalog.sort(), files, "The sidebar lists the expected notes");

		const { default: loadSearchIndex } = await server.ssrLoadModule(
			"virtual:notes-search-index",
		);
		const searchFiles = (await loadSearchIndex()).map(({ file }) => file).sort();
		assert.deepEqual(searchFiles, files, "The search index uses the public note list");

		for (const entry of expected) {
			const { file, title, body, code } = entry;
			const note = await notes.loadNote(file);
			assert.equal(note?.title, title);
			assert.equal(note?.content, markdownBody(entry));
			const highlights = note?.codeHighlights;
			const highlightKey = code ? "js\0" + code : undefined;
			assert.deepEqual(
				Object.keys(highlights ?? {}),
				highlightKey ? [highlightKey] : [],
			);
			if (highlightKey) assert.match(highlights[highlightKey], /--shiki-dark:/);
			const matches = await notes.searchNotes(body);
			assert.deepEqual(matches.map((match) => match.file), [file]);
		}
	}

	const initial = await readNotes();
	await assertPublicNotes(initial, [first]);
	assert.equal(await initial.loadNote(draft.file), null);
	assert.equal(await initial.loadNote(hidden.file), null);
	console.log("PASS private and hidden notes stay out of the catalog, loader, and search");

	let reloadedNotes;
	const send = server.ws.send.bind(server.ws);
	server.ws.send = (payload, ...args) => {
		if (payload.type === "full-reload") reloadedNotes = readNotes();
		return send(payload, ...args);
	};

	const addedPath = await writeNote(second);
	server.watcher.emit("add", addedPath);
	assert(reloadedNotes, "Adding a note reloads the client");
	await assertPublicNotes(await reloadedNotes, [first, second]);
	console.log("PASS adding a note updates the catalog, body, and search before reload");

	const revised = {
		...second,
		title: "修订后的笔记",
		body: "Revised article body.",
		code: "const marker = 2;",
	};
	await writeNote(revised);
	const updated = once(updates, "handled", {
		signal: AbortSignal.timeout(5_000),
	});
	server.watcher.emit("change", addedPath);
	await updated;
	const changed = await readNotes();
	await assertPublicNotes(changed, [first, revised]);
	assert.deepEqual(await changed.searchNotes(second.body), []);
	console.log("PASS editing a note updates its title, body, highlighting, and search");

	reloadedNotes = undefined;
	await rm(addedPath);
	server.watcher.emit("unlink", addedPath);
	assert(reloadedNotes, "Removing a note reloads the client");
	const removed = await reloadedNotes;
	await assertPublicNotes(removed, [first]);
	assert.equal(await removed.loadNote(second.file), null);
	assert.deepEqual(await removed.searchNotes(revised.body), []);
	console.log("PASS deleting a note removes it from the catalog, loader, and search");
} finally {
	await server?.close();
	const resolvedFixture = await realpath(fixture);
	assert.equal(path.dirname(resolvedFixture), temporaryRoot);
	assert(path.basename(resolvedFixture).startsWith(fixturePrefix));
	await rm(resolvedFixture, { recursive: true, force: true });
}
