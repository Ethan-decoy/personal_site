import {
	type ReactNode,
	Suspense,
	lazy,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { SectionTitle } from "../components";
import {
	type NestedFileNode,
	type NestedTreeNode,
	type NoteContent,
	type NoteLinkTarget,
	type NoteSuggestion,
	type SearchResult,
	getInitialExpandedKeys,
	getSidebarTree,
	getSuggestions,
	isDirectoryNode,
	isNotesEmpty,
	loadNote,
	resolveNoteHref as resolveCatalogNoteHref,
	searchNotes,
} from "../notes";
import {
	revealFileInExpandedKeys,
	toggleExpandedKey,
} from "../notes/sidebar-state";
import type { Section, Theme, ThemeMode } from "../themes";

/* ---- Reading Progress SliderTrack ---- */
const NUM_SEGMENTS = 60;
const SEGMENT_IDS = Array.from(
	{ length: NUM_SEGMENTS },
	(_, index) => `progress-segment-${index}`,
);
const sidebarTree = getSidebarTree();
const SIDEBAR_BRANCH_TRANSITION_MS = 180;
const SIDEBAR_BRANCH_UNMOUNT_BUFFER_MS = 80;
const loadMarkdownRenderer = () => import("../notes-renderer");
const MarkdownPreview = lazy(() =>
	loadMarkdownRenderer().then(({ MarkdownPreview: Preview }) => ({
		default: Preview,
	})),
);

function preloadNoteReader(file: string): Promise<void> {
	return Promise.all([loadNote(file), loadMarkdownRenderer()]).then(
		() => undefined,
	);
}

function SliderTrack({
	progress,
	accent,
	accentLight,
}: { progress: number; accent: string; accentLight: string }) {
	const trackRef = useRef<HTMLDivElement>(null);
	const [dragging, setDragging] = useState(false);

	const scrollToRatio = useCallback(
		(ratio: number) => {
			const docHeight =
				document.documentElement.scrollHeight - window.innerHeight;
			window.scrollTo({
				top: ratio * docHeight,
				behavior: dragging ? "auto" : "smooth",
			});
		},
		[dragging],
	);

	const handleStart = useCallback(
		(clientY: number) => {
			if (!trackRef.current) return;
			const rect = trackRef.current.getBoundingClientRect();
			const ratio = Math.max(
				0,
				Math.min((clientY - rect.top) / rect.height, 1),
			);
			scrollToRatio(ratio);
			setDragging(true);
		},
		[scrollToRatio],
	);

	useEffect(() => {
		if (!dragging) return;
		const onMove = (e: MouseEvent) => {
			e.preventDefault();
			handleStart(e.clientY);
		};
		const onUp = () => setDragging(false);
		window.addEventListener("mousemove", onMove, { passive: false });
		window.addEventListener("mouseup", onUp);
		return () => {
			window.removeEventListener("mousemove", onMove);
			window.removeEventListener("mouseup", onUp);
		};
	}, [dragging, handleStart]);

	const currentIdx = Math.round((progress / 100) * (NUM_SEGMENTS - 1));

	return (
		<div
			ref={trackRef}
			className="flex flex-col items-center gap-[2px] cursor-pointer py-1"
			onMouseDown={(e) => handleStart(e.clientY)}
		>
			{SEGMENT_IDS.map((segmentId, i) => {
				const dist = Math.abs(i - currentIdx);
				const isCurrent = i === currentIdx;
				return (
					<div
						key={segmentId}
						className="rounded-full transition-all duration-150 ease-out"
						style={{
							width: "16px",
							height: "2px",
							backgroundColor: accent,
							opacity: isCurrent ? 1 : Math.max(0.08, 1 - dist * 0.18),
							boxShadow: isCurrent ? `0 0 0 3px ${accentLight}` : "none",
						}}
					/>
				);
			})}
		</div>
	);
}

function CollapsibleBranch({
	expanded,
	id,
	children,
}: {
	expanded: boolean;
	id: string;
	children: ReactNode;
}) {
	const [mounted, setMounted] = useState(expanded);
	const [visible, setVisible] = useState(expanded);
	const mountedRef = useRef(expanded);
	const animationFrameRef = useRef<number | null>(null);
	const unmountTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (animationFrameRef.current !== null) {
			cancelAnimationFrame(animationFrameRef.current);
			animationFrameRef.current = null;
		}
		if (unmountTimerRef.current !== null) {
			clearTimeout(unmountTimerRef.current);
			unmountTimerRef.current = null;
		}

		if (expanded) {
			if (!mountedRef.current) {
				mountedRef.current = true;
				setMounted(true);
				setVisible(false);
			}
			animationFrameRef.current = requestAnimationFrame(() => {
				animationFrameRef.current = null;
				setVisible(true);
			});
		} else if (mountedRef.current) {
			setVisible(false);
			unmountTimerRef.current = setTimeout(() => {
				mountedRef.current = false;
				setMounted(false);
				unmountTimerRef.current = null;
			}, SIDEBAR_BRANCH_TRANSITION_MS + SIDEBAR_BRANCH_UNMOUNT_BUFFER_MS);
		}

		return () => {
			if (animationFrameRef.current !== null) {
				cancelAnimationFrame(animationFrameRef.current);
			}
			if (unmountTimerRef.current !== null) {
				clearTimeout(unmountTimerRef.current);
			}
		};
	}, [expanded]);

	if (!mounted && !expanded) return null;

	return (
		<div
			id={id}
			className="notes-sidebar-branch"
			data-expanded={visible}
			aria-hidden={!visible}
			inert={!visible}
			onTransitionEnd={(event) => {
				if (
					event.target !== event.currentTarget ||
					event.propertyName !== "grid-template-rows" ||
					expanded
				) {
					return;
				}
				if (unmountTimerRef.current !== null) {
					clearTimeout(unmountTimerRef.current);
					unmountTimerRef.current = null;
				}
				mountedRef.current = false;
				setMounted(false);
			}}
		>
			<div className="notes-sidebar-branch-clip">{children}</div>
		</div>
	);
}

/* ---- Recursive Sidebar Node ---- */
function SidebarNode({
	node,
	theme,
	depth,
	expandedKeys,
	onToggle,
	selectedFile,
	onOpen,
	onPrefetch,
}: {
	node: NestedTreeNode;
	theme: Theme;
	depth: number;
	expandedKeys: Set<string>;
	onToggle: (key: string) => void;
	selectedFile: string | null;
	onOpen: (file: string) => void;
	onPrefetch: (file: string) => void;
}) {
	const [hoveredFile, setHoveredFile] = useState<string | null>(null);
	const expanded = expandedKeys.has(node.key);

	const fileChildren: NestedFileNode[] = [];
	const dirChildren: NestedTreeNode[] = [];
	for (const c of node.children) {
		if (isDirectoryNode(c)) dirChildren.push(c);
		else fileChildren.push(c);
	}

	const hasChildren = node.children.length > 0;
	const selectedIndex = Boolean(
		selectedFile && node.indexFile && selectedFile === node.indexFile,
	);
	const branchId = `notes-branch-${encodeURIComponent(node.key)
		.replace(/%/g, "")
		.replace(/[^a-zA-Z0-9_-]/g, "-")}`;

	return (
		<div style={{ marginLeft: depth > 0 ? 8 : 0 }}>
			<div
				className="group flex w-full items-center rounded-lg transition-colors duration-150"
				style={{
					backgroundColor: selectedIndex ? theme.accentLight : "transparent",
				}}
				onMouseEnter={(event) => {
					if (!selectedIndex) {
						event.currentTarget.style.backgroundColor = `${theme.accentLight}60`;
					}
				}}
				onMouseLeave={(event) => {
					if (!selectedIndex)
						event.currentTarget.style.backgroundColor = "transparent";
				}}
			>
				<button
					type="button"
					className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left"
					aria-expanded={hasChildren ? expanded : undefined}
					aria-controls={hasChildren ? branchId : undefined}
					onPointerEnter={() => {
						if (!hasChildren && node.indexFile) onPrefetch(node.indexFile);
					}}
					onFocus={() => {
						if (!hasChildren && node.indexFile) onPrefetch(node.indexFile);
					}}
					onClick={() => {
						if (hasChildren) onToggle(node.key);
						else if (node.indexFile) onOpen(node.indexFile);
					}}
				>
					<svg
						aria-hidden="true"
						className="notes-sidebar-chevron h-2.5 w-2.5 shrink-0 transition-transform duration-150 ease-out"
						style={{
							transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
							color: theme.accent,
							opacity: hasChildren ? 1 : 0.15,
						}}
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
					>
						<path d="M6 4l4 4-4 4" />
					</svg>
					<span
						className={`truncate text-xs ${depth === 0 ? "font-semibold" : "font-medium"}`}
						style={{ color: theme.text }}
					>
						{node.title}
					</span>
					<span
						className="ml-auto text-[10px] tabular-nums"
						style={{ color: theme.textSec, opacity: 0.45 }}
					>
						{node.noteCount}
					</span>
				</button>
				{node.indexFile && (
					<button
						type="button"
						aria-label={`打开“${node.title}”分类概览`}
						title="打开分类概览"
						className="mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md opacity-50 transition-opacity duration-150 hover:opacity-100"
						style={{
							color: theme.accent,
							opacity: selectedIndex ? 1 : undefined,
						}}
						onPointerEnter={() => onPrefetch(node.indexFile as string)}
						onFocus={() => onPrefetch(node.indexFile as string)}
						onTouchStart={() => onPrefetch(node.indexFile as string)}
						onClick={() => onOpen(node.indexFile as string)}
					>
						<svg
							aria-hidden="true"
							className="h-3 w-3"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.25"
						>
							<rect x="3.25" y="2.25" width="9.5" height="11.5" rx="1.25" />
							<path d="M5.75 5.5h4.5M5.75 8h4.5M5.75 10.5h2.75" />
						</svg>
					</button>
				)}
			</div>
			{hasChildren && (
				<CollapsibleBranch expanded={expanded} id={branchId}>
					<div
						className="ml-2 border-l pl-1"
						style={{ borderColor: theme.border }}
					>
						{dirChildren.map((d) => (
							<SidebarNode
								key={d.key}
								node={d}
								theme={theme}
								depth={depth + 1}
								expandedKeys={expandedKeys}
								onToggle={onToggle}
								selectedFile={selectedFile}
								onOpen={onOpen}
								onPrefetch={onPrefetch}
							/>
						))}
						{fileChildren.map((file) => (
							<button
								type="button"
								key={file.file}
								className="w-full rounded-r py-1 pl-3 pr-2 text-left text-xs leading-5 transition-colors duration-150"
								style={{
									backgroundColor:
										selectedFile === file.file
											? theme.accentLight
											: hoveredFile === file.file
												? `${theme.accentLight}60`
												: "transparent",
									color:
										selectedFile === file.file ? theme.text : theme.textSec,
								}}
								onClick={() => onOpen(file.file)}
								onPointerEnter={() => {
									onPrefetch(file.file);
									setHoveredFile(file.file);
								}}
								onFocus={() => onPrefetch(file.file)}
								onTouchStart={() => onPrefetch(file.file)}
								onMouseLeave={() => setHoveredFile(null)}
							>
								{file.title}
							</button>
						))}
					</div>
				</CollapsibleBranch>
			)}
		</div>
	);
}

function SidebarCatalog({
	theme,
	searchQuery,
	searchFocused,
	suggestions,
	searchResults,
	searchLoading,
	expandedKeys,
	selectedFile,
	onSearchQueryChange,
	onSearchFocusedChange,
	onToggle,
	onOpen,
	onPrefetch,
}: {
	theme: Theme;
	searchQuery: string;
	searchFocused: boolean;
	suggestions: NoteSuggestion[];
	searchResults: SearchResult[];
	searchLoading: boolean;
	expandedKeys: Set<string>;
	selectedFile: string | null;
	onSearchQueryChange: (query: string) => void;
	onSearchFocusedChange: (focused: boolean) => void;
	onToggle: (key: string) => void;
	onOpen: (file: string, options?: { query?: string }) => void;
	onPrefetch: (file: string) => void;
}) {
	return (
		<>
			<div
				data-notes-search-header="true"
				className="notes-sidebar-search-header -mx-1 px-1 pb-3"
				style={{ backgroundColor: theme.bg }}
			>
				<div className="relative">
					<input
						type="search"
						aria-label="搜索笔记"
						placeholder="搜索笔记..."
						className="w-full rounded-xl px-3 py-2 text-sm outline-none transition-all duration-200"
						style={{
							backgroundColor: theme.bgDeep,
							border: `1px solid ${searchFocused ? theme.accent : theme.border}`,
							color: theme.text,
						}}
						value={searchQuery}
						onChange={(event) => onSearchQueryChange(event.target.value)}
						onFocus={() => onSearchFocusedChange(true)}
						onBlur={() => setTimeout(() => onSearchFocusedChange(false), 200)}
					/>
					{suggestions.length > 0 && (
						<div
							className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl"
							style={{
								backgroundColor: theme.bgDeep,
								border: `1px solid ${theme.border}`,
								boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
							}}
						>
							{suggestions.map((suggestion, index) => (
								<button
									type="button"
									key={suggestion.file}
									className="block w-full px-3 py-2 text-left text-sm transition-colors duration-100"
									style={{
										backgroundColor:
											index === 0 ? theme.accentLight : "transparent",
										color: theme.textSec,
									}}
									onMouseDown={(event) => event.preventDefault()}
									onPointerEnter={() => onPrefetch(suggestion.file)}
									onFocus={() => onPrefetch(suggestion.file)}
									onTouchStart={() => onPrefetch(suggestion.file)}
									onClick={() =>
										onOpen(suggestion.file, { query: searchQuery })
									}
								>
									{suggestion.title}
								</button>
							))}
						</div>
					)}
				</div>
			</div>

			{searchQuery ? (
				<div
					className="mb-3 rounded-xl p-2"
					style={{
						backgroundColor: theme.bgDeep,
						border: `1px solid ${theme.border}`,
					}}
				>
					<p
						className="mb-1 px-1 text-[10px] uppercase tracking-wider"
						style={{ color: theme.textSec, opacity: 0.5 }}
					>
						{searchLoading ? "搜索中…" : `${searchResults.length} 条结果`}
					</p>
					{searchLoading ? (
						<p className="px-2 py-3 text-xs" style={{ color: theme.textSec }}>
							正在准备全文索引
						</p>
					) : searchResults.length > 0 ? (
						searchResults.slice(0, 8).map((result) => (
							<button
								type="button"
								key={result.file}
								className="block w-full rounded px-2 py-1.5 text-left transition-colors duration-100"
								style={{ color: theme.textSec }}
								onPointerEnter={() => onPrefetch(result.file)}
								onFocus={() => onPrefetch(result.file)}
								onTouchStart={() => onPrefetch(result.file)}
								onClick={() => onOpen(result.file, { query: searchQuery })}
								onMouseEnter={(event) => {
									event.currentTarget.style.backgroundColor = theme.accentLight;
								}}
								onMouseLeave={(event) => {
									event.currentTarget.style.backgroundColor = "transparent";
								}}
							>
								<span className="block text-sm">{result.title}</span>
								<span className="block truncate text-[10px] opacity-50">
									{result.category}
								</span>
							</button>
						))
					) : (
						<p className="px-2 py-3 text-xs" style={{ color: theme.textSec }}>
							没有匹配的笔记
						</p>
					)}
				</div>
			) : (
				sidebarTree.map((node) => (
					<SidebarNode
						key={node.key}
						node={node}
						theme={theme}
						depth={0}
						expandedKeys={expandedKeys}
						onToggle={onToggle}
						selectedFile={selectedFile}
						onOpen={onOpen}
						onPrefetch={onPrefetch}
					/>
				))
			)}
		</>
	);
}

export default function NotesPage({
	theme,
	mode,
}: { theme: Theme; onNavigate: (s: Section) => void; mode?: ThemeMode }) {
	const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
		getInitialExpandedKeys,
	);
	const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
	const [selectedNote, setSelectedNote] = useState<NoteContent | null>(null);
	const currentNoteFile = useRef<string | null>(null);
	const noteRequestRef = useRef(0);
	const [noteLoading, setNoteLoading] = useState(false);
	const [backToSource, setBackToSource] = useState<{
		file: string;
		scrollY: number;
	} | null>(null);

	useEffect(() => {
		currentNoteFile.current = selectedNote?.file ?? null;
	}, [selectedNote]);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchFocused, setSearchFocused] = useState(false);
	const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
	const [searchLoading, setSearchLoading] = useState(false);
	const [showBackTop, setShowBackTop] = useState(false);
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		let cancelled = false;
		if (!searchQuery.trim()) {
			setSearchResults([]);
			setSearchLoading(false);
			return;
		}

		setSearchResults([]);
		setSearchLoading(true);
		const timer = window.setTimeout(() => {
			void searchNotes(searchQuery)
				.then((results) => {
					if (!cancelled) setSearchResults(results);
				})
				.catch(() => {
					if (!cancelled) setSearchResults([]);
				})
				.finally(() => {
					if (!cancelled) setSearchLoading(false);
				});
		}, 120);

		return () => {
			cancelled = true;
			window.clearTimeout(timer);
		};
	}, [searchQuery]);

	useEffect(() => {
		const onScroll = () => {
			const scrollTop = window.scrollY;
			const docHeight =
				document.documentElement.scrollHeight - window.innerHeight;
			setShowBackTop(scrollTop > 300);
			setProgress(
				docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0,
			);
		};
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

	const [pendingAnchor, setPendingAnchor] = useState<string | null>(null);

	useEffect(() => {
		if (!pendingAnchor) return;
		const el = document.getElementById(pendingAnchor);
		if (el) {
			el.scrollIntoView({ behavior: "smooth", block: "start" });
			setPendingAnchor(null);
			return;
		}
		// pendingAnchor is a search query — find text in rendered content
		const timer = setTimeout(() => {
			const content = document.querySelector("[data-note-content]");
			if (!content) {
				setPendingAnchor(null);
				return;
			}
			const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
			let node = walker.nextNode();
			while (node) {
				if (
					node.textContent?.toLowerCase().includes(pendingAnchor.toLowerCase())
				) {
					const parent = node.parentElement;
					if (parent) {
						parent.scrollIntoView({ behavior: "smooth", block: "center" });
					}
					break;
				}
				node = walker.nextNode();
			}
			setPendingAnchor(null);
		}, 100);
		return () => clearTimeout(timer);
	}, [pendingAnchor]);

	const toggleKey = useCallback((key: string) => {
		setExpandedKeys((previous) => toggleExpandedKey(previous, key));
	}, []);

	const openNote = useCallback(
		(
			file: string,
			options: {
				anchor?: string | null;
				query?: string;
				rememberSource?: boolean;
				restoreScrollY?: number;
				syncSidebar?: boolean;
			} = {},
		) => {
			const requestId = ++noteRequestRef.current;
			const sourceFile = currentNoteFile.current;
			const sourceScrollY = window.scrollY;
			setNoteLoading(true);
			setSearchFocused(false);

			void Promise.all([loadNote(file), loadMarkdownRenderer()])
				.then(([note]) => {
					if (requestId !== noteRequestRef.current || !note) return;

					if (options.rememberSource && sourceFile && sourceFile !== file) {
						setBackToSource({
							file: sourceFile,
							scrollY: sourceScrollY,
						});
					} else {
						setBackToSource(null);
					}

					setSelectedNote(note);
					setSearchQuery("");
					if (file !== "./wiki.md" && options.syncSidebar !== false) {
						setExpandedKeys((previous) =>
							revealFileInExpandedKeys(previous, file),
						);
					}

					const pendingTarget = options.anchor || options.query || null;
					if (pendingTarget) {
						setPendingAnchor(pendingTarget);
						return;
					}

					if (options.restoreScrollY !== undefined) {
						requestAnimationFrame(() =>
							window.scrollTo({
								top: options.restoreScrollY,
								behavior: "smooth",
							}),
						);
						return;
					}

					window.scrollTo({ top: 0, behavior: "instant" });
				})
				.catch(() => undefined)
				.finally(() => {
					if (requestId === noteRequestRef.current) setNoteLoading(false);
				});
		},
		[],
	);

	const prefetchNote = useCallback((file: string) => {
		void preloadNoteReader(file).catch(() => undefined);
	}, []);

	const selectedNoteFile = selectedNote?.file ?? null;
	const resolveMarkdownNoteHref = useCallback(
		(href: string) =>
			selectedNoteFile ? resolveCatalogNoteHref(href, selectedNoteFile) : null,
		[selectedNoteFile],
	);

	const openMarkdownNote = useCallback(
		(target: NoteLinkTarget) => {
			openNote(target.file, {
				anchor: target.anchor,
				rememberSource: target.isWiki,
			});
		},
		[openNote],
	);

	const suggestions =
		searchFocused && searchQuery ? getSuggestions(searchQuery) : [];

	return (
		<div>
			<div
				className="fixed bottom-0 left-8 top-32 z-10 hidden w-56 flex-col overflow-y-auto pb-6 md:flex"
				style={{ color: theme.textSec }}
			>
				<SidebarCatalog
					theme={theme}
					searchQuery={searchQuery}
					searchFocused={searchFocused}
					suggestions={suggestions}
					searchResults={searchResults}
					searchLoading={searchLoading}
					expandedKeys={expandedKeys}
					selectedFile={selectedNote?.file ?? null}
					onSearchQueryChange={setSearchQuery}
					onSearchFocusedChange={setSearchFocused}
					onToggle={toggleKey}
					onOpen={openNote}
					onPrefetch={prefetchNote}
				/>
			</div>

			{selectedNote && (
				<div className="hidden md:flex flex-col items-center fixed right-[calc((100vw-96rem)/2+3rem)] top-1/2 -translate-y-1/2 z-10">
					{backToSource &&
						(() => {
							return (
								<button
									type="button"
									aria-label="返回来源笔记"
									onClick={() => {
										const y = backToSource.scrollY ?? 0;
										openNote(backToSource.file, { restoreScrollY: y });
									}}
									className="absolute w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 ease-out"
									style={{
										top: "-80px",
										backgroundColor: theme.bgDeep,
										border: `1px solid ${theme.border}`,
									}}
								>
									<svg
										aria-hidden="true"
										className="w-3 h-3"
										style={{ color: theme.textSec }}
										viewBox="0 0 16 16"
										fill="none"
										stroke="currentColor"
										strokeWidth="1.5"
									>
										<path d="M10 3l-5 5 5 5" />
									</svg>
								</button>
							);
						})()}
					<SliderTrack
						progress={progress}
						accent={theme.accent}
						accentLight={theme.accentLight}
					/>
					<div className="mt-12">
						<button
							type="button"
							aria-label="返回顶部"
							onClick={scrollToTop}
							className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 ease-out"
							style={{
								backgroundColor: theme.bgDeep,
								border: `1px solid ${theme.border}`,
								opacity: showBackTop ? 1 : 0.2,
							}}
						>
							<svg
								aria-hidden="true"
								className="w-3 h-3"
								style={{ color: theme.textSec }}
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.5"
							>
								<path d="M4 10l4-4 4 4" />
							</svg>
						</button>
					</div>
				</div>
			)}

			<div className="section-page-frame pb-16 sm:pb-24 md:pb-32">
				<SectionTitle theme={theme}>笔记</SectionTitle>
				{isNotesEmpty() ? (
					<div
						style={{
							animation: "fade-up 0.6s ease-out both",
							animationDelay: "150ms",
						}}
					>
						<p
							className="text-sm mt-8 leading-relaxed"
							style={{ color: theme.textSec }}
						>
							还没有笔记。
						</p>
						<p
							className="text-xs mt-2"
							style={{ color: theme.textSec, opacity: 0.5 }}
						>
							在 src/notes/ 下创建子目录并放入 .md 文件即可自动收录。
						</p>
					</div>
				) : (
					<div
						className="mt-8 max-w-4xl"
						style={{
							animation: "fade-up 0.25s ease-out both",
							animationDelay: "0ms",
						}}
					>
						<button
							type="button"
							className="mb-2 flex w-full items-center justify-between rounded-xl px-4 py-3 md:hidden"
							aria-expanded={mobileSidebarOpen}
							aria-controls="mobile-notes-catalog"
							style={{
								backgroundColor: theme.bgDeep,
								border: `1px solid ${theme.border}`,
							}}
							onClick={() => setMobileSidebarOpen((open) => !open)}
						>
							<span
								className="text-xs font-semibold uppercase tracking-wider"
								style={{ color: theme.text }}
							>
								笔记分类
							</span>
							<svg
								aria-hidden="true"
								className="w-3 h-3 transition-transform duration-200 ease-out"
								style={{
									transform: mobileSidebarOpen
										? "rotate(90deg)"
										: "rotate(0deg)",
									color: theme.accent,
								}}
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.5"
							>
								<path d="M6 4l4 4-4 4" />
							</svg>
						</button>
						{mobileSidebarOpen && (
							<div id="mobile-notes-catalog" className="mb-6 md:hidden">
								<SidebarCatalog
									theme={theme}
									searchQuery={searchQuery}
									searchFocused={searchFocused}
									suggestions={suggestions}
									searchResults={searchResults}
									searchLoading={searchLoading}
									expandedKeys={expandedKeys}
									selectedFile={selectedNote?.file ?? null}
									onSearchQueryChange={setSearchQuery}
									onSearchFocusedChange={setSearchFocused}
									onToggle={toggleKey}
									onOpen={openNote}
									onPrefetch={prefetchNote}
								/>
							</div>
						)}

						{selectedNote ? (
							<div
								key={selectedNote.file}
								style={{
									animation: "fade-up 0.25s ease-out both",
									animationDelay: "0ms",
								}}
							>
								<div data-note-content aria-busy={noteLoading}>
									<Suspense fallback={null}>
										<MarkdownPreview
											content={selectedNote.content}
											theme={theme}
											isDark={mode === "dark"}
											resolveNoteHref={resolveMarkdownNoteHref}
											onNoteOpen={openMarkdownNote}
										/>
									</Suspense>
								</div>
							</div>
						) : (
							<div className="flex items-center justify-center h-48">
								<p
									className="text-sm"
									style={{ color: theme.textSec, opacity: 0.3 }}
								>
									{noteLoading ? "正在准备笔记" : "选择一篇笔记开始阅读"}
								</p>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
