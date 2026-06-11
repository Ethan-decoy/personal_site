import { useState, useEffect, useRef } from "react";
import { type Section, type Theme, type ThemeMode } from "../themes";
import { SectionTitle } from "../components";
import {
	treeData,
	modules,
	indexMap,
	searchNotes,
	getSuggestions,
	parseFrontmatter,
	nestedTree,
	type NestedTreeNode,
} from "../notes";
import { MarkdownPreview, parseMarkdownBody } from "../notes-renderer";

/* ---- Reading Progress SliderTrack ---- */
const NUM_SEGMENTS = 60;

function SliderTrack({
	progress,
	accent,
	accentLight,
}: { progress: number; accent: string; accentLight: string }) {
	const trackRef = useRef<HTMLDivElement>(null);
	const [dragging, setDragging] = useState(false);

	const scrollToRatio = (ratio: number) => {
		const docHeight =
			document.documentElement.scrollHeight - window.innerHeight;
		window.scrollTo({
			top: ratio * docHeight,
			behavior: dragging ? "auto" : "smooth",
		});
	};

	const handleStart = (clientY: number) => {
		if (!trackRef.current) return;
		const rect = trackRef.current.getBoundingClientRect();
		const ratio = Math.max(0, Math.min((clientY - rect.top) / rect.height, 1));
		scrollToRatio(ratio);
		setDragging(true);
	};

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
	}, [dragging]);

	const currentIdx = Math.round((progress / 100) * (NUM_SEGMENTS - 1));

	return (
		<div
			ref={trackRef}
			className="flex flex-col items-center gap-[2px] cursor-pointer py-1"
			onMouseDown={(e) => handleStart(e.clientY)}
		>
			{Array.from({ length: NUM_SEGMENTS }).map((_, i) => {
				const dist = Math.abs(i - currentIdx);
				const isCurrent = i === currentIdx;
				return (
					<div
						key={i}
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

/* ---- Recursive Sidebar Node ---- */
function SidebarNode({
	node,
	theme,
	depth,
	expandedKeys,
	onToggle,
	selectedFile,
	onOpen,
}: {
	node: NestedTreeNode;
	theme: Theme;
	depth: number;
	expandedKeys: Set<string>;
	onToggle: (key: string) => void;
	selectedFile: string | null;
	onOpen: (file: string, title: string) => void;
}) {
	const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
	const expanded = expandedKeys.has(node.key);

	const fileChildren: {
		title: string;
		date: string;
		order?: number;
		file: string;
	}[] = [];
	const dirChildren: NestedTreeNode[] = [];
	for (const c of node.children) {
		if ("key" in c) dirChildren.push(c);
		else {
			const fm = parseFrontmatter(modules[c.file] || "");
			fileChildren.push({
				title: fm.title,
				date: fm.date,
				order: fm.order,
				file: c.file,
			});
		}
	}
	fileChildren.sort((a, b) => {
		if (a.order !== undefined && b.order !== undefined)
			return a.order - b.order;
		if (a.order !== undefined) return -1;
		if (b.order !== undefined) return 1;
		return a.title.localeCompare(b.title);
	});

	const hasContent =
		fileChildren.length > 0 || dirChildren.length > 0 || indexMap[node.key];

	return (
		<div style={{ marginLeft: depth > 0 ? 12 : 0 }}>
			<div
				className="flex items-center gap-1.5 w-full py-1.5 text-left cursor-pointer rounded-r transition-colors duration-150"
				style={{
					backgroundColor:
						selectedFile &&
						indexMap[node.key] &&
						selectedFile === `./${node.key}/_index.md`
							? theme.accentLight
							: "transparent",
				}}
				onClick={() => {
					if (hasContent) onToggle(node.key);
					if (indexMap[node.key]) {
						const idx = indexMap[node.key];
						onOpen(`./${node.key}/_index.md`, idx.title);
					}
				}}
			>
				<svg
					className="w-2.5 h-2.5 transition-transform duration-200 ease-out shrink-0"
					style={{
						transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
						color: theme.accent,
						opacity: hasContent ? 1 : 0.15,
					}}
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.5"
				>
					<path d="M6 4l4 4-4 4" />
				</svg>
				<span
					className="text-xs font-semibold uppercase tracking-wider truncate"
					style={{
						color: theme.text,
						fontSize: depth > 0 ? "0.6rem" : undefined,
					}}
				>
					{node.title}
				</span>
			</div>
			<div
				className="overflow-hidden"
				style={{
					transition: "max-height 0.4s ease-out, opacity 0.3s ease-out",
					maxHeight: expanded ? "800px" : "0px",
					opacity: expanded ? 1 : 0,
				}}
			>
				{fileChildren.length > 0 && (
					<div
						style={{ borderLeft: `1px solid ${theme.border}`, marginLeft: 10 }}
					>
						{fileChildren.map((f, i) => (
							<div
								key={f.file}
								className="py-1 pl-3 pr-2 cursor-pointer text-sm transition-colors duration-200 rounded-r"
								style={{
									backgroundColor:
										selectedFile === f.file
											? theme.accentLight
											: hoveredIdx === i
												? theme.accentLight + "60"
												: "transparent",
									color: selectedFile === f.file ? theme.text : theme.textSec,
								}}
								onClick={() => onOpen(f.file, f.title)}
								onMouseEnter={() => setHoveredIdx(i)}
								onMouseLeave={() => setHoveredIdx(null)}
							>
								{f.title}
							</div>
						))}
					</div>
				)}
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
					/>
				))}
			</div>
		</div>
	);
}

export default function NotesPage({
	theme,
	mode,
}: { theme: Theme; onNavigate: (s: Section) => void; mode?: ThemeMode }) {
	const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => {
		const s = new Set<string>();
		if (nestedTree.length > 0) s.add(nestedTree[0].key);
		return s;
	});
	const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
	const [selectedNote, setSelectedNote] = useState<{
		title: string;
		date: string;
		content: string;
		file: string;
	} | null>(null);
	const currentNoteFile = useRef<string | null>(null);
	const [backToSource, setBackToSource] = useState<{
		file: string;
		scrollY: number;
	} | null>(null);

	useEffect(() => {
		currentNoteFile.current = selectedNote?.file ?? null;
	}, [selectedNote]);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchFocused, setSearchFocused] = useState(false);
	const [showBackTop, setShowBackTop] = useState(false);
	const [progress, setProgress] = useState(0);

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
		const handler = (e: Event) => {
			const { file, anchor } = (e as CustomEvent).detail as {
				file: string;
				anchor: string | null;
			};
			const raw = modules[file];
			if (!raw) return;
			const fm = parseFrontmatter(raw);
			if (file === "./wiki.md") {
				setBackToSource(
					currentNoteFile.current
						? { file: currentNoteFile.current, scrollY: window.scrollY }
						: null,
				);
			} else {
				setBackToSource(null);
			}
			const body = parseMarkdownBody(raw);
			setSelectedNote({
				title: fm.title || file,
				date: fm.date,
				content: body,
				file,
			});
			if (file !== "./wiki.md") {
				const parts = file.replace(/^\.\//, "").split("/");
				const newExpanded = new Set<string>();
				for (let i = 0; i < parts.length - 1; i++)
					newExpanded.add(parts.slice(0, i + 1).join(" > "));
				setExpandedKeys(newExpanded);
			}
			if (anchor) setPendingAnchor(anchor);
		};
		window.addEventListener("note:open", handler);
		return () => window.removeEventListener("note:open", handler);
	}, []);

	useEffect(() => {
		if (!pendingAnchor) return;
		const el = document.getElementById(pendingAnchor);
		if (el) {
			el.scrollIntoView({ behavior: "smooth", block: "start" });
			setPendingAnchor(null);
		}
	}, [pendingAnchor, selectedNote?.file]);

	const toggleKey = (key: string) => {
		setExpandedKeys((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	};

	const openNote = (file: string, title: string) => {
		const raw = modules[file];
		if (!raw) return;
		const fm = parseFrontmatter(raw);
		setBackToSource(null);
		setSelectedNote({
			title: fm.title || title,
			date: fm.date,
			content: parseMarkdownBody(raw),
			file,
		});
		setSearchQuery("");
		setSearchFocused(false);
		window.scrollTo({ top: 0, behavior: "instant" });
	};

	const suggestions =
		searchFocused && searchQuery ? getSuggestions(searchQuery) : [];
	const searchResults = searchQuery ? searchNotes(searchQuery) : [];

	return (
		<div>
			<div
				className="hidden md:flex md:flex-col fixed left-8 top-32 bottom-0 w-56 z-10 overflow-y-auto"
				style={{ color: theme.textSec }}
			>
				<div className="relative mb-3">
					<input
						type="text"
						placeholder="搜索笔记..."
						className="w-full px-3 py-2 text-sm rounded-xl outline-none transition-all duration-200"
						style={{
							backgroundColor: theme.bgDeep,
							border: `1px solid ${searchFocused ? theme.accent : theme.border}`,
							color: theme.text,
						}}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						onFocus={() => setSearchFocused(true)}
						onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
					/>
					{suggestions.length > 0 && (
						<div
							className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-50"
							style={{
								backgroundColor: theme.bgDeep,
								border: `1px solid ${theme.border}`,
								boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
							}}
						>
							{suggestions.map((s, i) => (
								<div
									key={s}
									className="px-3 py-2 text-sm cursor-pointer transition-colors duration-100"
									style={{
										backgroundColor:
											i === 0 ? theme.accentLight : "transparent",
										color: theme.textSec,
									}}
									onMouseDown={() =>
										openNote(
											Object.entries(modules).find(
												([, raw]) => parseFrontmatter(raw).title === s,
											)?.[0] || "",
											s,
										)
									}
								>
									{s}
								</div>
							))}
						</div>
					)}
				</div>
				{searchQuery && searchResults.length > 0 && (
					<div
						className="mb-3 rounded-xl p-2"
						style={{
							backgroundColor: theme.bgDeep,
							border: `1px solid ${theme.border}`,
						}}
					>
						<p
							className="text-[10px] uppercase tracking-wider mb-1 px-1"
							style={{ color: theme.textSec, opacity: 0.4 }}
						>
							{searchResults.length} 条结果
						</p>
						{searchResults.slice(0, 8).map((r) => (
							<div
								key={r.file}
								className="px-2 py-1.5 text-sm cursor-pointer rounded transition-colors duration-100"
								style={{ color: theme.textSec }}
								onClick={() => openNote(r.file, r.title)}
								onMouseEnter={(e) => {
									e.currentTarget.style.backgroundColor = theme.accentLight;
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.backgroundColor = "transparent";
								}}
							>
								{r.title}
							</div>
						))}
					</div>
				)}
				{!searchQuery &&
					nestedTree.map((node) => (
						<SidebarNode
							key={node.key}
							node={node}
							theme={theme}
							depth={0}
							expandedKeys={expandedKeys}
							onToggle={toggleKey}
							selectedFile={selectedNote?.file || null}
							onOpen={openNote}
						/>
					))}
			</div>

			{selectedNote && (
				<div className="hidden md:flex flex-col items-center fixed right-[calc((100vw-96rem)/2+3rem)] top-1/2 -translate-y-1/2 z-10">
					{backToSource &&
						(() => {
							const srcRaw = modules[backToSource.file];
							const srcTitle = srcRaw ? parseFrontmatter(srcRaw).title : "笔记";
							return (
								<button
									aria-label="返回来源笔记"
									onClick={() => {
										const y = backToSource.scrollY ?? 0;
										openNote(backToSource.file, srcTitle);
										requestAnimationFrame(() =>
											window.scrollTo({ top: y, behavior: "smooth" }),
										);
									}}
									className="absolute w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 ease-out"
									style={{
										top: "-80px",
										backgroundColor: theme.bgDeep,
										border: `1px solid ${theme.border}`,
									}}
								>
									<svg
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

			<div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-24 md:py-32">
				<SectionTitle theme={theme}>笔记</SectionTitle>
				{treeData.length === 0 ? (
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
							animation: "fade-up 0.6s ease-out both",
							animationDelay: "150ms",
						}}
					>
						<button
							className="md:hidden flex items-center justify-between w-full py-3 px-4 rounded-xl mb-2"
							style={{
								backgroundColor: theme.bgDeep,
								border: `1px solid ${theme.border}`,
							}}
							onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
						>
							<span
								className="text-xs font-semibold uppercase tracking-wider"
								style={{ color: theme.text }}
							>
								笔记分类
							</span>
							<svg
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
						<div className={mobileSidebarOpen ? "block mb-6" : "hidden"}>
							<div className="relative mb-3">
								<input
									type="text"
									placeholder="搜索笔记..."
									className="w-full px-3 py-2 text-sm rounded-xl outline-none transition-all duration-200"
									style={{
										backgroundColor: theme.bgDeep,
										border: `1px solid ${searchFocused ? theme.accent : theme.border}`,
										color: theme.text,
									}}
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									onFocus={() => setSearchFocused(true)}
									onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
								/>
							</div>
							{!searchQuery &&
								nestedTree.map((node) => (
									<SidebarNode
										key={node.key}
										node={node}
										theme={theme}
										depth={0}
										expandedKeys={expandedKeys}
										onToggle={toggleKey}
										selectedFile={selectedNote?.file || null}
										onOpen={openNote}
									/>
								))}
						</div>

						{selectedNote ? (
							<div
								key={selectedNote.file}
								style={{
									animation: "fade-up 0.5s ease-out both",
									animationDelay: "0ms",
								}}
							>
								<div
									className="mb-10 pb-6"
									style={{ borderBottom: `1px solid ${theme.borderLight}` }}
								>
									<h3
										className="text-xl font-bold tracking-tight mb-2"
										style={{ color: theme.text }}
									>
										{selectedNote.title}
									</h3>
									<span
										className="text-xs font-mono"
										style={{ color: theme.textSec, opacity: 0.4 }}
									>
										{selectedNote.date}
									</span>
								</div>
								<MarkdownPreview
									content={selectedNote.content}
									theme={theme}
									isDark={mode === "dark"}
								/>
							</div>
						) : (
							<div className="flex items-center justify-center h-48">
								<p
									className="text-sm"
									style={{ color: theme.textSec, opacity: 0.3 }}
								>
									选择一篇笔记开始阅读
								</p>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
