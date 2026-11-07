import {
	type KeyboardEvent,
	type PointerEvent,
	type RefObject,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";
import {
	type CodeReferenceBounds,
	type CodeReferenceSource,
	findCodeReferenceBlock,
} from "./code-reference";
import {
	CodeBlockContent,
	CodeBlockCopyButton,
	markdownThemeVariables,
} from "./notes-renderer";
import type { Theme } from "./themes";
import "./code-reference.css";

const MARGIN = 12;
const HEADER_HEIGHT = 44;

function viewport() {
	return {
		width: document.documentElement.clientWidth,
		height: window.visualViewport?.height ?? window.innerHeight,
	};
}

function referenceWidth(viewWidth: number) {
	const article = document.querySelector<HTMLElement>("[data-note-content]");
	return Math.min(
		Math.max(0, viewWidth - MARGIN * 2),
		(article?.getBoundingClientRect().width ?? 896) + MARGIN * 2,
	);
}

function constrain(
	bounds: CodeReferenceBounds,
	collapsed = false,
): CodeReferenceBounds {
	const view = viewport();
	const top = Math.min(80, Math.max(MARGIN, view.height - 212));
	const maxHeight = Math.max(HEADER_HEIGHT, view.height - top - MARGIN);
	const width = referenceWidth(view.width);
	const height = Math.min(
		maxHeight,
		Math.max(Math.min(200, maxHeight), bounds.height),
	);
	return {
		width,
		height,
		x: Math.max(MARGIN, Math.min(bounds.x, view.width - width - MARGIN)),
		y: Math.max(
			top,
			Math.min(
				bounds.y,
				view.height - (collapsed ? HEADER_HEIGHT : height) - MARGIN,
			),
		),
	};
}

function initialBounds(source: CodeReferenceSource): CodeReferenceBounds {
	const view = viewport();
	const content = document.querySelector<HTMLElement>("[data-note-content]");
	const article = content?.getBoundingClientRect();
	const pre =
		findCodeReferenceBlock(source.file, source.blockIndex)?.querySelector(
			"pre",
		) ?? content?.querySelector("pre");
	const style = pre ? getComputedStyle(pre) : null;
	const fontSize = Number.parseFloat(style?.fontSize ?? "") || 14;
	const lineHeight =
		Number.parseFloat(style?.lineHeight ?? "") || fontSize * 1.7;
	const lineCount = source.value.trimEnd().split("\n").length;
	const width = referenceWidth(view.width);
	const height = Math.min(
		400,
		view.height * 0.4,
		HEADER_HEIGHT + lineCount * lineHeight + 48,
	);
	return constrain({
		x: article
			? article.left + (article.width - width) / 2
			: (view.width - width) / 2,
		y: 80,
		width,
		height,
	});
}

function Icon({ kind }: { kind: "close" | "collapse" | "expand" | "return" }) {
	const paths = {
		close: "m6 6 12 12M18 6 6 18",
		collapse: "M5 12h14",
		expand: "M5 5h14v14H5z",
		return: "M19 19V9H5m5-5L5 9l5 5",
	};
	return (
		<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<path
				d={paths[kind]}
				stroke="currentColor"
				strokeWidth="1.7"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function resizeHeight(
	bounds: CodeReferenceBounds,
	dy: number,
): CodeReferenceBounds {
	const maxHeight = Math.max(
		HEADER_HEIGHT,
		viewport().height - bounds.y - MARGIN,
	);
	const minHeight = Math.min(200, maxHeight);
	return {
		...bounds,
		height: Math.max(minHeight, Math.min(bounds.height + dy, maxHeight)),
	};
}

interface Gesture {
	kind: "move" | "resize";
	pointerId: number;
	x: number;
	y: number;
	bounds: CodeReferenceBounds;
}

export default function CodeReferenceWindow({
	source,
	theme,
	isDark,
	rememberedBounds,
	onClose,
	onReturnToSource,
}: {
	source: CodeReferenceSource;
	theme: Theme;
	isDark: boolean;
	rememberedBounds: RefObject<CodeReferenceBounds | null>;
	onClose: () => void;
	onReturnToSource: () => void;
}) {
	const [bounds, setBounds] = useState(() =>
		constrain(rememberedBounds.current ?? initialBounds(source)),
	);
	const sourceTitle =
		source.noteTitle === source.label
			? source.label
			: `${source.noteTitle} · ${source.label}`;
	const [collapsed, setCollapsed] = useState(false);
	const [mobile, setMobile] = useState(() => viewport().width < 768);
	const [viewHeight, setViewHeight] = useState(() => viewport().height);
	const panelRef = useRef<HTMLDialogElement>(null);
	const codeRef = useRef<HTMLDivElement>(null);
	const bodyScroll = useRef({ top: 0, left: 0 });
	const activeSource = useRef<CodeReferenceSource | null>(null);
	const gesture = useRef<Gesture | null>(null);
	const closeRef = useRef(onClose);
	closeRef.current = onClose;

	const updateBounds = (next: CodeReferenceBounds) => {
		const fitted = constrain(next, collapsed);
		rememberedBounds.current = fitted;
		setBounds(fitted);
	};

	useLayoutEffect(() => {
		const resize = () => {
			const view = viewport();
			setMobile(view.width < 768);
			setViewHeight(view.height);
			if (view.width < 768) return;
			setBounds(
				constrain(rememberedBounds.current ?? initialBounds(source), collapsed),
			);
		};
		setBounds((current) => constrain(current, collapsed));
		window.addEventListener("resize", resize);
		window.visualViewport?.addEventListener("resize", resize);
		return () => {
			window.removeEventListener("resize", resize);
			window.visualViewport?.removeEventListener("resize", resize);
		};
	}, [collapsed, rememberedBounds, source]);

	useLayoutEffect(() => {
		const changed = activeSource.current !== source;
		if (changed) {
			activeSource.current = source;
			setCollapsed(false);
			bodyScroll.current = { top: 0, left: 0 };
			panelRef.current?.focus({ preventScroll: true });
		}
		if (!collapsed || changed) {
			const pre = codeRef.current?.querySelector("pre");
			pre?.scrollTo(bodyScroll.current.left, bodyScroll.current.top);
		}
	}, [collapsed, source]);

	useEffect(() => {
		const onKeyDown = (event: globalThis.KeyboardEvent) => {
			// A transient note preview gets the first Escape before the pinned reference.
			if (
				event.key !== "Escape" ||
				event.defaultPrevented ||
				document.querySelector(".note-peek[open]")
			)
				return;
			event.preventDefault();
			closeRef.current();
		};
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, []);

	function startGesture(
		event: PointerEvent<HTMLButtonElement>,
		kind: Gesture["kind"],
	) {
		if (mobile || !event.isPrimary || event.button !== 0) return;
		event.preventDefault();
		event.currentTarget.focus({ preventScroll: true });
		event.currentTarget.setPointerCapture(event.pointerId);
		gesture.current = {
			kind,
			pointerId: event.pointerId,
			x: event.clientX,
			y: event.clientY,
			bounds,
		};
	}

	function moveGesture(event: PointerEvent<HTMLButtonElement>) {
		const active = gesture.current;
		if (!active || active.pointerId !== event.pointerId) return;
		const dx = event.clientX - active.x;
		const dy = event.clientY - active.y;
		updateBounds(
			active.kind === "move"
				? { ...active.bounds, x: active.bounds.x + dx, y: active.bounds.y + dy }
				: resizeHeight(active.bounds, dy),
		);
	}

	function endGesture(event: PointerEvent<HTMLButtonElement>) {
		if (gesture.current?.pointerId !== event.pointerId) return;
		gesture.current = null;
		if (event.currentTarget.hasPointerCapture(event.pointerId))
			event.currentTarget.releasePointerCapture(event.pointerId);
	}

	function nudge(
		event: KeyboardEvent<HTMLButtonElement>,
		kind: Gesture["kind"],
	) {
		const arrows =
			kind === "move"
				? ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"]
				: ["ArrowUp", "ArrowDown"];
		if (mobile || !arrows.includes(event.key)) return;
		event.preventDefault();
		const step = event.shiftKey ? 32 : 8;
		const dx =
			event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
		const dy =
			event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
		updateBounds(
			kind === "move"
				? { ...bounds, x: bounds.x + dx, y: bounds.y + dy }
				: resizeHeight(bounds, dy),
		);
	}

	function toggleCollapsed() {
		const pre = codeRef.current?.querySelector("pre");
		if (!collapsed && pre)
			bodyScroll.current = { top: pre.scrollTop, left: pre.scrollLeft };
		if (collapsed && !mobile) setBounds(constrain(bounds));
		setCollapsed((current) => !current);
	}

	return createPortal(
		<dialog
			ref={panelRef}
			open
			aria-modal="false"
			aria-label={`代码参考：${sourceTitle}`}
			tabIndex={-1}
			className="code-reference-window"
			data-collapsed={collapsed}
			style={{
				...markdownThemeVariables(theme, isDark),
				...(mobile
					? {
							left: MARGIN,
							right: MARGIN,
							width: "calc(100% - 24px)",
							bottom: MARGIN,
							height: collapsed
								? HEADER_HEIGHT
								: Math.min(520, viewHeight * 0.58),
						}
					: {
							left: bounds.x,
							top: bounds.y,
							width: bounds.width,
							height: collapsed ? HEADER_HEIGHT : bounds.height,
						}),
			}}
		>
			<header className="code-reference-header">
				<button
					type="button"
					className="code-reference-drag"
					disabled={mobile}
					aria-label="移动代码参考窗"
					title={mobile ? sourceTitle : `${sourceTitle} · 拖动或使用方向键移动`}
					onPointerDown={(event) => startGesture(event, "move")}
					onPointerMove={moveGesture}
					onPointerUp={endGesture}
					onPointerCancel={endGesture}
					onLostPointerCapture={() => {
						gesture.current = null;
					}}
					onKeyDown={(event) => nudge(event, "move")}
				>
					<span className="markdown-code-language">
						{source.language || "text"}
					</span>
					<span className="code-reference-title">{source.label}</span>
				</button>
				<div className="code-reference-actions">
					<CodeBlockCopyButton value={source.value} />
					<button
						type="button"
						className="markdown-code-copy"
						aria-label="返回原代码"
						title={`返回原代码 · ${source.noteTitle}`}
						onClick={onReturnToSource}
					>
						<Icon kind="return" />
					</button>
					<button
						type="button"
						className="markdown-code-copy"
						aria-label={collapsed ? "展开代码参考窗" : "收起代码参考窗"}
						title={collapsed ? "展开" : "收起"}
						aria-expanded={!collapsed}
						onClick={toggleCollapsed}
					>
						<Icon kind={collapsed ? "expand" : "collapse"} />
					</button>
					<button
						type="button"
						className="markdown-code-copy"
						aria-label="关闭代码参考窗"
						title="关闭"
						onClick={onClose}
					>
						<Icon kind="close" />
					</button>
				</div>
			</header>
			<div
				ref={codeRef}
				className="markdown-code-block code-reference-code"
				hidden={collapsed}
			>
				<CodeBlockContent
					value={source.value}
					language={source.language}
					focusable
				/>
			</div>
			{!mobile && !collapsed && (
				<button
					type="button"
					className="code-reference-resize"
					aria-label="调整代码参考窗高度"
					title="拖动下边框或使用上下方向键调整高度"
					onPointerDown={(event) => startGesture(event, "resize")}
					onPointerMove={moveGesture}
					onPointerUp={endGesture}
					onPointerCancel={endGesture}
					onLostPointerCapture={() => {
						gesture.current = null;
					}}
					onKeyDown={(event) => nudge(event, "resize")}
				/>
			)}
		</dialog>,
		document.body,
	);
}
