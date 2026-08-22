import { readFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const vite = await createServer({
	server: { middlewareMode: true },
	appType: "custom",
	logLevel: "silent",
});

function directories(nodes) {
	return nodes.flatMap((node) => [
		node,
		...directories(node.children.filter((child) => "key" in child)),
	]);
}

function files(nodes) {
	return nodes.flatMap((node) => [
		...node.children.filter((child) => !("key" in child)),
		...files(node.children.filter((child) => "key" in child)),
	]);
}

function findElement(node, predicate) {
	if (Array.isArray(node)) {
		for (const child of node) {
			const match = findElement(child, predicate);
			if (match) return match;
		}
		return null;
	}
	if (!React.isValidElement(node)) return null;
	if (predicate(node)) return node;
	return findElement(node.props.children, predicate);
}

try {
	const [sidebarCss, notesPageSource] = await Promise.all([
		readFile(new URL("../src/index.css", import.meta.url), "utf8"),
		readFile(new URL("../src/pages/notes.tsx", import.meta.url), "utf8"),
	]);
	const loadStarted = performance.now();
	const notes = await vite.ssrLoadModule("/src/notes/index.ts");
	const indexLoadMs = performance.now() - loadStarted;
	const [{ default: NotesPage, SidebarCatalog }, { getTheme }, sidebarState] =
		await Promise.all([
			vite.ssrLoadModule("/src/pages/notes.tsx"),
			vite.ssrLoadModule("/src/themes.ts"),
			vite.ssrLoadModule("/src/notes/sidebar-state.ts"),
		]);
	const tree = notes.getSidebarTree();
	const allDirectories = directories(tree);
	const allFiles = files(tree);
	const sampleFile = allFiles[0];
	const loadedSample = sampleFile
		? await notes.loadNote(sampleFile.file)
		: null;
	const sampleSearchResults = sampleFile
		? await notes.searchNotes(sampleFile.title)
		: [];
	const indexedDirectory = allDirectories.find(
		(node) => node.indexFile && node.children.length > 0,
	);

	if (!indexedDirectory) {
		throw new Error(
			"Fixture requires a non-empty directory with an index file",
		);
	}

	const initiallyExpanded = new Set([indexedDirectory.key]);
	const afterDirectoryRowClick = sidebarState.toggleExpandedKey(
		initiallyExpanded,
		indexedDirectory.key,
	);

	const fileInAnotherBranch = allFiles.find(
		(file) => !file.file.includes(`${indexedDirectory.key}/`),
	);
	const afterOpeningFile = fileInAnotherBranch
		? sidebarState.revealFileInExpandedKeys(
				initiallyExpanded,
				fileInAnotherBranch.file,
			)
		: new Set();
	const renderStarted = performance.now();
	const initialHtml = renderToStaticMarkup(
		React.createElement(NotesPage, {
			theme: getTheme("ocean", "light"),
			mode: "light",
			onNavigate: () => {},
		}),
	);
	const searchQuery = sampleFile?.title ?? "C++";
	const searchCatalogProps = {
		theme: getTheme("ocean", "light"),
		searchQuery,
		searchFocused: true,
		suggestions: notes.getSuggestions(searchQuery),
		searchResults: sampleSearchResults,
		searchLoading: false,
		expandedKeys: new Set(),
		selectedFile: null,
		onSearchQueryChange: () => {},
		onSearchFocusedChange: () => {},
		onToggle: () => {},
		onOpen: () => {},
		onPrefetch: () => {},
	};
	const searchCatalogHtml = renderToStaticMarkup(
		React.createElement(SidebarCatalog, searchCatalogProps),
	);
	const searchCatalogTree = SidebarCatalog(searchCatalogProps);
	const searchResultButton = findElement(
		searchCatalogTree,
		(element) => element.props["data-notes-search-result"] === sampleFile?.file,
	);
	let searchResultMouseDownPrevented = false;
	searchResultButton?.props.onMouseDown?.({
		preventDefault: () => {
			searchResultMouseDownPrevented = true;
		},
	});
	const searchResultSurfaceCount = (
		searchCatalogHtml.match(/data-notes-search-results=/g) ?? []
	).length;
	const sampleSearchResultOccurrences = sampleFile
		? searchCatalogHtml.split(`data-notes-search-result="${sampleFile.file}"`)
				.length - 1
		: 0;
	const initialRenderMs = performance.now() - renderStarted;
	const topLevelTitleOccurrences =
		initialHtml.split(`>${tree[0]?.title}<`).length - 1;
	const rawFallbackDirectories = allDirectories.filter((node) => {
		const segment = node.key.split("/").at(-1);
		return !node.indexFile && node.title === segment;
	});

	const checks = [
		{
			name: "the initial catalog contains metadata instead of note bodies",
			pass:
				!sampleFile ||
				!("content" in notes.notesIndex.notesByFile[sampleFile.file]),
		},
		{
			name: "a note body remains available through the lazy loader",
			pass:
				!sampleFile ||
				(loadedSample?.file === sampleFile.file &&
					typeof loadedSample.content === "string"),
		},
		{
			name: "the deferred full-text index preserves title search",
			pass:
				!sampleFile ||
				sampleSearchResults.some((result) => result.file === sampleFile.file),
		},
		{
			name: "an expanded indexed directory stays collapsed after one row click",
			pass: !afterDirectoryRowClick.has(indexedDirectory.key),
		},
		{
			name: "opening a note preserves unrelated branches opened by the reader",
			pass: !fileInAnotherBranch || afterOpeningFile.has(indexedDirectory.key),
		},
		{
			name: "collapsed branches do not mount their leaf rows on initial render",
			pass:
				!fileInAnotherBranch ||
				!initialHtml.includes(fileInAnotherBranch.title),
		},
		{
			name: "the closed mobile catalog is not mounted beside the desktop catalog",
			pass: topLevelTitleOccurrences === 1,
		},
		{
			name: "the catalog starts collapsed instead of opening an arbitrary first category",
			pass: notes.getInitialExpandedKeys().size === 0,
		},
		{
			name: "private underscore directories stay out of the public catalog",
			pass: allDirectories.every((node) =>
				node.key.split("/").every((segment) => !segment.startsWith("_")),
			),
		},
		{
			name: "directories without index pages receive readable fallback labels",
			pass: rawFallbackDirectories.length === 0,
		},
		{
			name: "expanded branches are not clipped by a fixed height ceiling",
			pass: !initialHtml.includes("max-height:800px"),
		},
		{
			name: "the notes entry animation has no artificial 150ms wait",
			pass: !initialHtml.includes("animation-delay:150ms"),
		},
		{
			name: "branch feedback animates real content height without a fixed ceiling",
			pass:
				sidebarCss.includes("grid-template-rows: 0fr") &&
				sidebarCss.includes("grid-template-rows: 1fr") &&
				!sidebarCss.includes("max-height: 800px"),
		},
		{
			name: "closing branches unmount after their transition",
			pass:
				notesPageSource.includes(
					'event.propertyName !== "grid-template-rows"',
				) && notesPageSource.includes("setMounted(false)"),
		},
		{
			name: "branch feedback respects reduced-motion preferences",
			pass:
				sidebarCss.includes("@media (prefers-reduced-motion: reduce)") &&
				sidebarCss.includes(".notes-sidebar-chevron"),
		},
		{
			name: "the shared search header stays pinned above deep catalog branches",
			pass:
				initialHtml.includes('data-notes-search-header="true"') &&
				sidebarCss.includes(".notes-sidebar-search-header") &&
				sidebarCss.includes("position: sticky") &&
				sidebarCss.includes("top: 4.5rem") &&
				sidebarCss.includes("top: 0"),
		},
		{
			name: "one search query mounts exactly one result surface",
			pass: searchResultSurfaceCount === 1,
		},
		{
			name: "overlapping title and full-text matches mount one result row",
			pass: !sampleFile || sampleSearchResultOccurrences === 1,
		},
		{
			name: "selecting a search result allows the input to lose native focus",
			pass: Boolean(searchResultButton) && !searchResultMouseDownPrevented,
		},
	];

	console.log(
		JSON.stringify(
			{
				fixture: {
					indexedDirectory: indexedDirectory.key,
					indexFile: indexedDirectory.indexFile,
					otherFile: fileInAnotherBranch?.file,
				},
				catalog: {
					topLevelDirectories: tree.length,
					directories: allDirectories.length,
					files: allFiles.length,
					indexLoadMs: Number(indexLoadMs.toFixed(1)),
					initialRenderMs: Number(initialRenderMs.toFixed(1)),
					initialHtmlBytes: Buffer.byteLength(initialHtml),
					searchResultSurfaceCount,
					sampleSearchResultOccurrences,
					searchResultButtonFound: Boolean(searchResultButton),
					searchResultMouseDownPrevented,
					topLevelTitleOccurrences,
					topLevel: tree.map((node) => ({
						key: node.key,
						title: node.title,
						noteCount: node.noteCount,
					})),
				},
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
