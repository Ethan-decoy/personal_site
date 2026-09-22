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

function usesGlobalThemeTransition(element) {
	const classes = new Set(
		String(element?.props.className ?? "")
			.split(/\s+/)
			.filter(Boolean),
	);
	return (
		classes.has("motion-safe:transition-colors") &&
		classes.has("motion-safe:duration-300") &&
		classes.has("motion-safe:ease-out") &&
		!classes.has("transition-all") &&
		!classes.has("duration-200")
	);
}

const BREAKPOINT_WIDTHS = {
	md: 768,
	lg: 1024,
	xl: 1280,
	"2xl": 1536,
};

function responsiveFlexBreakpoint(className) {
	return /(?:^|\s)(md|lg|xl|2xl):flex(?:\s|$)/.exec(className)?.[1] ?? null;
}

function responsiveHiddenBreakpoint(className) {
	return /(?:^|\s)(md|lg|xl|2xl):hidden(?:\s|$)/.exec(className)?.[1] ?? null;
}

function readingContentStart(viewportWidth) {
	const frameWidth = Math.min(viewportWidth, 64 * 16);
	const frameLeft = (viewportWidth - frameWidth) / 2;
	return frameLeft + 2 * 16;
}

function effectiveFileOrder(file) {
	const filenamePrefix = /^(\d+)-/.exec(file.file.split("/").at(-1) ?? "");
	return (
		file.order ??
		(filenamePrefix
			? Number.parseInt(filenamePrefix[1], 10)
			: Number.POSITIVE_INFINITY)
	);
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
	const { default: loadSearchIndex } = await vite.ssrLoadModule(
		"virtual:notes-search-index",
	);
	const searchEntries = await loadSearchIndex();
	const expectedSearchBodies = new Map(
		await Promise.all(
			Object.keys(notes.notesIndex.notesByFile).map(async (file) => [
				file,
				(
					await readFile(
						new URL(`../src/notes/${file.slice(2)}`, import.meta.url),
						"utf8",
					)
				)
					.replace(/\r\n/g, "\n")
					.trim()
					.toLowerCase(),
			]),
		),
	);
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
	const searchHeader = findElement(
		searchCatalogTree,
		(element) => element.props["data-notes-search-header"] === "true",
	);
	const searchInput = findElement(
		searchCatalogTree,
		(element) => element.props["aria-label"] === "搜索笔记",
	);
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
	const numberedSiblingOrderMismatches = allDirectories.flatMap((directory) => {
		const numberedFiles = directory.children.filter(
			(child) =>
				!("key" in child) && /^\d+-/.test(child.file.split("/").at(-1) ?? ""),
		);
		const expectedFiles = [...numberedFiles].sort(
			(left, right) => effectiveFileOrder(left) - effectiveFileOrder(right),
		);
		const actualOrder = numberedFiles.map((file) => file.file);
		const expectedOrder = expectedFiles.map((file) => file.file);
		return actualOrder.every((file, index) => file === expectedOrder[index])
			? []
			: [{ directory: directory.key, actualOrder, expectedOrder }];
	});
	const appendixDirectories = allDirectories.filter((directory) =>
		directory.key.endsWith("/deep-dives"),
	);
	const appendixTitleMismatches = appendixDirectories
		.filter((directory) => directory.title !== "附章")
		.map((directory) => ({
			directory: directory.key,
			actualTitle: directory.title,
		}));
	const appendixPlacementMismatches = appendixDirectories.flatMap(
		(appendixDirectory) => {
			const directory = appendixDirectory.key;
			const afterFile = appendixDirectory.sidebarAfter;
			const parentKey = directory.split("/").slice(0, -1).join("/");
			const parent = allDirectories.find((node) => node.key === parentKey);
			if (!afterFile) {
				return [{ directory, reason: "missing sidebarAfter" }];
			}
			if (!parent) {
				return [{ directory, afterFile, reason: "missing parent" }];
			}

			const appendixIndex = parent.children.indexOf(appendixDirectory);
			const targetIndex = parent.children.findIndex(
				(child) => !("key" in child) && child.file === afterFile,
			);
			return appendixIndex === targetIndex + 1 && targetIndex >= 0
				? []
				: [
						{
							directory,
							afterFile,
							appendixIndex,
							targetIndex,
							actualOrder: parent.children.map((child) =>
								"key" in child ? child.key : child.file,
							),
						},
					];
		},
	);
	const appendixRenderDirectory = appendixDirectories.find(
		(directory) => directory.key === "cpp/05-functions/deep-dives",
	);
	const appendixRenderParentKey = appendixRenderDirectory?.key
		.split("/")
		.slice(0, -1)
		.join("/");
	const appendixRenderParent = allDirectories.find(
		(node) => node.key === appendixRenderParentKey,
	);
	const appendixRenderTarget = appendixRenderParent?.children.find(
		(child) =>
			!("key" in child) && child.file === appendixRenderDirectory?.sidebarAfter,
	);
	const appendixCatalogHtml = renderToStaticMarkup(
		React.createElement(SidebarCatalog, {
			...searchCatalogProps,
			searchQuery: "",
			searchFocused: false,
			suggestions: [],
			searchResults: [],
			expandedKeys: notes.expandedKeysForFile(appendixRenderParent.indexFile),
		}),
	);
	const appendixRenderTargetPosition = appendixRenderTarget
		? appendixCatalogHtml.indexOf(appendixRenderTarget.title)
		: -1;
	const appendixRenderDirectoryPosition = appendixRenderDirectory
		? appendixCatalogHtml.indexOf(appendixRenderDirectory.title)
		: -1;
	const appendixRenderIndentPosition = appendixCatalogHtml.lastIndexOf(
		'style="margin-left:16px"',
		appendixRenderDirectoryPosition,
	);
	const cppRoot = tree.find((node) => node.key === "cpp");
	const cppGroups = cppRoot?.children.filter((node) => "key" in node) ?? [];
	const cppChapters = cppGroups.flatMap((group) => group.children);
	const expectedChapterKeys = Object.keys(notes.notesIndex.notesByFile)
		.filter((file) => /^\.\/cpp\/\d+-[^/]+\/_index\.md$/.test(file))
		.map((file) => file.slice(2, -"/_index.md".length))
		.sort();
	const cppIndex = await notes.loadNote("./cpp/_index.md");
	const overviewGroupTitles = [...cppIndex.content.matchAll(/^## (.+)$/gm)].map(
		(match) => match[1],
	);
	const cppGroupCatalogHtml = renderToStaticMarkup(
		React.createElement(SidebarCatalog, {
			...searchCatalogProps,
			searchQuery: "",
			searchFocused: false,
			suggestions: [],
			searchResults: [],
			expandedKeys: new Set(["cpp"]),
		}),
	);
	const appendixArticle = appendixRenderDirectory?.children.find(
		(child) => !("key" in child),
	);
	const appendixGroup = cppGroups.find((group) =>
		group.children.some((child) => child.key === appendixRenderParentKey),
	);
	if (!cppRoot || !appendixArticle || !appendixGroup) {
		throw new Error(
			"Fixture requires C++ parts and an article in a nested appendix",
		);
	}
	const appendixAncestorKeys = [
		cppRoot.key,
		appendixGroup.key,
		appendixRenderParentKey,
		appendixRenderDirectory.key,
	];
	const appendixExpanded = notes.expandedKeysForFile(appendixArticle.file);
	const chapterIndexExpanded = notes.expandedKeysForFile(
		appendixRenderParent.indexFile,
	);
	const previouslyExpanded = new Set([
		indexedDirectory.key,
		cppGroups.find((group) => group !== appendixGroup).key,
	]);
	const revealedAppendix = sidebarState.revealFileInExpandedKeys(
		previouslyExpanded,
		appendixArticle.file,
	);
	const [loadedAppendix, loadedChapterIndex, appendixSearchResults] =
		await Promise.all([
			notes.loadNote(appendixArticle.file),
			notes.loadNote(appendixRenderParent.indexFile),
			notes.searchNotes(appendixArticle.title),
		]);
	const appendixSearchResult = appendixSearchResults.find(
		(result) => result.file === appendixArticle.file,
	);
	const chapterLink = notes.resolveNoteHref(
		`${appendixRenderParentKey.slice("cpp/".length)}/_index.md`,
		"./cpp/_index.md",
	);
	const appendixLink = notes.resolveNoteHref(
		`deep-dives/${appendixArticle.filename}`,
		appendixRenderParent.indexFile,
	);
	const { parseSidebarGroups } = await vite.ssrLoadModule(
		"/scripts/notes-manifest-plugin.ts",
	);
	const parsedGroups = parseSidebarGroups(
		"## First part\n2. [Second](02-second/_index.md)\n1. [First](01-first/_index.md)\n## Next part\n- [Third](03-third/_index.md)",
		"./cpp/_index.md",
	);
	const invalidGroupFixtures = [
		[
			"duplicate chapter",
			"## Part\n- [A](01-a/_index.md)\n- [A again](01-a/_index.md)",
		],
		[
			"duplicate heading",
			"## Part\n- [A](01-a/_index.md)\n## Part\n- [B](02-b/_index.md)",
		],
		["parent escape", "## Part\n- [Other](../_index.md)"],
		["nested directory", "## Part\n- [Deep](01-a/deep-dives/_index.md)"],
		["missing heading", "- [A](01-a/_index.md)"],
		["empty group", "## Empty\n## Part\n- [A](01-a/_index.md)"],
	];
	const invalidGroupChecks = invalidGroupFixtures.map(([name, body]) => {
		let rejected = false;
		try {
			parseSidebarGroups(body, "./cpp/_index.md");
		} catch {
			rejected = true;
		}
		return { name: `sidebar grouping rejects ${name}`, pass: rejected };
	});
	const desktopCatalogClasses =
		/className="([^"]*fixed bottom-0 left-8 top-32[^"]*)"/.exec(
			notesPageSource,
		)?.[1] ?? "";
	const desktopCatalogBreakpoint = responsiveFlexBreakpoint(
		desktopCatalogClasses,
	);
	const mobileCatalogButtonClasses =
		/className="([^"]*mb-2 flex w-full[^"]*)"/.exec(notesPageSource)?.[1] ?? "";
	const mobileCatalogPanelClasses =
		/id="mobile-notes-catalog" className="([^"]*)"/.exec(
			notesPageSource,
		)?.[1] ?? "";
	const mobileCatalogButtonBreakpoint = responsiveHiddenBreakpoint(
		mobileCatalogButtonClasses,
	);
	const mobileCatalogPanelBreakpoint = responsiveHiddenBreakpoint(
		mobileCatalogPanelClasses,
	);
	const desktopCatalogMinWidth = desktopCatalogBreakpoint
		? BREAKPOINT_WIDTHS[desktopCatalogBreakpoint]
		: 0;
	const desktopCatalogRight = (2 + 14) * 16;
	const desktopCatalogGap = 2 * 16;
	const desktopCatalogClearance =
		readingContentStart(desktopCatalogMinWidth) -
		(desktopCatalogRight + desktopCatalogGap);

	const checks = [
		{
			name: "C++ parts use the five overview headings without separate index pages",
			pass:
				cppRoot.children.length === 5 &&
				cppGroups.length === overviewGroupTitles.length &&
				cppGroups.every(
					(group, index) =>
						group.isGroup === true &&
						!group.indexFile &&
						group.title === overviewGroupTitles[index],
				),
		},
		{
			name: "grouping preserves every physical C++ chapter exactly once in order",
			pass:
				cppChapters.length === expectedChapterKeys.length &&
				cppChapters.every(
					(chapter, index) =>
						chapter.key === expectedChapterKeys[index] &&
						chapter.indexFile === `./${expectedChapterKeys[index]}/_index.md`,
				),
		},
		{
			name: "part counts retain their chapters' public article totals",
			pass:
				cppGroups.every(
					(group) =>
						group.noteCount ===
						group.children.reduce((total, child) => total + child.noteCount, 0),
				) &&
				cppRoot.noteCount ===
					cppGroups.reduce((total, group) => total + group.noteCount, 0),
		},
		{
			name: "opening only C++ mounts part rows while chapters remain collapsed",
			pass:
				cppGroups.every((group) => cppGroupCatalogHtml.includes(group.title)) &&
				cppChapters.every(
					(chapter) => !cppGroupCatalogHtml.includes(chapter.title),
				),
		},
		{
			name: "opening a nested appendix reveals its part and every real ancestor",
			pass:
				appendixExpanded.size === appendixAncestorKeys.length &&
				appendixAncestorKeys.every((key) => appendixExpanded.has(key)),
		},
		{
			name: "opening a chapter overview reveals its containing part",
			pass:
				chapterIndexExpanded.size === 3 &&
				appendixAncestorKeys
					.slice(0, 3)
					.every((key) => chapterIndexExpanded.has(key)),
		},
		{
			name: "revealing a grouped appendix preserves other manually expanded branches",
			pass: [...previouslyExpanded, ...appendixAncestorKeys].every((key) =>
				revealedAppendix.has(key),
			),
		},
		{
			name: "grouped chapter indexes and deep articles keep their lazy-loading paths",
			pass:
				loadedAppendix?.file === appendixArticle.file &&
				typeof loadedAppendix.content === "string" &&
				loadedChapterIndex?.file === appendixRenderParent.indexFile &&
				typeof loadedChapterIndex.content === "string",
		},
		{
			name: "overview and appendix links still resolve through physical chapter paths",
			pass:
				chapterLink?.file === appendixRenderParent.indexFile &&
				appendixLink?.file === appendixArticle.file,
		},
		{
			name: "search results include the part between subject and chapter",
			pass:
				appendixSearchResult?.category ===
				[
					cppRoot.title,
					appendixGroup.title,
					appendixRenderParent.title,
					appendixRenderDirectory.title,
				].join(" \u203a "),
		},
		{
			name: "sidebar grouping reads heading and link order from Markdown",
			pass:
				JSON.stringify(parsedGroups) ===
				JSON.stringify([
					{
						title: "First part",
						directories: ["cpp/02-second", "cpp/01-first"],
					},
					{ title: "Next part", directories: ["cpp/03-third"] },
				]),
		},
		...invalidGroupChecks,
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
			name: "search chunks preserve every public note body exactly once",
			pass:
				searchEntries.length === expectedSearchBodies.size &&
				new Set(searchEntries.map((entry) => entry.file)).size ===
					expectedSearchBodies.size &&
				searchEntries.every(
					(entry) => expectedSearchBodies.get(entry.file) === entry.body,
				),
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
			name: "the fixed desktop catalog only appears when it clears the centered reading frame",
			pass: Boolean(desktopCatalogBreakpoint) && desktopCatalogClearance >= 0,
		},
		{
			name: "the mobile catalog remains available until the fixed catalog appears",
			pass:
				mobileCatalogButtonBreakpoint === desktopCatalogBreakpoint &&
				mobileCatalogPanelBreakpoint === desktopCatalogBreakpoint,
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
			name: "numbered sibling notes follow their effective order sequence",
			pass: numberedSiblingOrderMismatches.length === 0,
		},
		{
			name: "appendix directories follow their related chapter articles",
			pass: appendixPlacementMismatches.length === 0,
		},
		{
			name: "appendix directories use the concise sidebar title",
			pass: appendixTitleMismatches.length === 0,
		},
		{
			name: "rendered appendix groups preserve the mixed sidebar order",
			pass:
				appendixRenderTargetPosition >= 0 &&
				appendixRenderTargetPosition < appendixRenderDirectoryPosition,
		},
		{
			name: "rendered appendix groups are indented beneath related articles",
			pass:
				appendixRenderTargetPosition < appendixRenderIndentPosition &&
				appendixRenderIndentPosition < appendixRenderDirectoryPosition,
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
			name: "the sticky search background follows the global theme transition",
			pass: usesGlobalThemeTransition(searchHeader),
		},
		{
			name: "the search field follows the global theme transition",
			pass: usesGlobalThemeTransition(searchInput),
		},
		{
			name: "the shared search header stays pinned above deep catalog branches",
			pass:
				initialHtml.includes('data-notes-search-header="true"') &&
				sidebarCss.includes(".notes-sidebar-search-header") &&
				sidebarCss.includes("position: sticky") &&
				sidebarCss.includes("top: 4.5rem") &&
				/@media \(min-width: 96rem\) \{\s*\.notes-sidebar-search-header \{\s*top: 0;\s*\}\s*\}/.test(
					sidebarCss,
				),
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
					cppParts: cppGroups.length,
					cppChapters: cppChapters.length,
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
				layout: {
					desktopCatalogBreakpoint,
					mobileCatalogButtonBreakpoint,
					mobileCatalogPanelBreakpoint,
					desktopCatalogMinWidth,
					desktopCatalogRight,
					desktopCatalogGap,
					readingContentStart: readingContentStart(desktopCatalogMinWidth),
					desktopCatalogClearance,
				},
				numberedSiblingOrderMismatches,
				appendixTitleMismatches,
				appendixPlacementMismatches,
				appendixRender: {
					targetPosition: appendixRenderTargetPosition,
					indentPosition: appendixRenderIndentPosition,
					directoryPosition: appendixRenderDirectoryPosition,
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
