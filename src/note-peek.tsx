import {
	type CSSProperties,
	useCallback,
	useEffect,
	useId,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";
import {
	type NoteContent,
	type NoteLinkTarget,
	loadNote,
	resolveNoteHref,
} from "./notes";
import { MarkdownPreview } from "./notes-renderer";
import type { Theme, ThemeMode } from "./themes";

interface PeekVisit {
	target: NoteLinkTarget;
	scrollTop: number;
}

function positionNearLink(trigger: HTMLElement): CSSProperties {
	const width = window.innerWidth;
	const height = window.visualViewport?.height ?? window.innerHeight;
	if (width < 640) {
		return { left: 0, bottom: 0, width: "100%", maxHeight: height * 0.78 };
	}
	const rect = trigger.getBoundingClientRect();
	const panelWidth = Math.min(540, width - 32);
	const below = height - rect.bottom - 24;
	const above = rect.top - 24;
	const left = Math.max(16, Math.min(rect.left, width - panelWidth - 16));
	if (below >= Math.min(300, height * 0.45)) {
		return {
			left,
			top: rect.bottom + 8,
			width: panelWidth,
			maxHeight: Math.min(480, below),
		};
	}
	if (above >= Math.min(300, height * 0.45)) {
		return {
			left,
			bottom: height - rect.top + 8,
			width: panelWidth,
			maxHeight: Math.min(480, above),
		};
	}
	return {
		left,
		top: Math.max(16, (height - 480) / 2),
		width: panelWidth,
		maxHeight: Math.min(480, height - 32),
	};
}

export default function NotePeek({
	target,
	trigger,
	activation,
	theme,
	mode,
	onClose,
	onOpenFull,
	onPointerEnter,
	onPointerLeave,
}: {
	target: NoteLinkTarget;
	trigger: HTMLAnchorElement;
	activation: "hover" | "focus" | "press";
	theme: Theme;
	mode?: ThemeMode;
	onClose: () => void;
	onOpenFull: (target: NoteLinkTarget) => void;
	onPointerEnter: () => void;
	onPointerLeave: () => void;
}) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const bodyRef = useRef<HTMLElement>(null);
	const pointerDownInside = useRef(false);
	const [visits, setVisits] = useState<PeekVisit[]>([{ target, scrollTop: 0 }]);
	const visit = visits[visits.length - 1];
	const [loaded, setLoaded] = useState<{
		file: string;
		note: NoteContent | null;
	} | null>(null);
	const [retry, setRetry] = useState(0);
	const [position, setPosition] = useState<CSSProperties>({});
	const [mobile, setMobile] = useState(() => window.innerWidth < 640);
	const modal = mobile && activation === "press";
	const id = useId();
	const note = loaded?.file === visit.target.file ? loaded.note : null;
	const loading = loaded?.file !== visit.target.file;
	const closeRef = useRef(onClose);
	const leaveRef = useRef(onPointerLeave);
	closeRef.current = onClose;
	leaveRef.current = onPointerLeave;

	const leaveIfIdle = useCallback(() => {
		const panel = dialogRef.current;
		const selection = window.getSelection();
		if (
			!panel ||
			pointerDownInside.current ||
			panel.contains(document.activeElement) ||
			(selection &&
				!selection.isCollapsed &&
				panel.contains(selection.anchorNode))
		)
			return;
		leaveRef.current();
	}, []);

	useLayoutEffect(() => {
		const positionDialog = () => {
			setMobile(window.innerWidth < 640);
			setPosition(positionNearLink(trigger));
		};
		positionDialog();
		window.addEventListener("resize", positionDialog);
		window.visualViewport?.addEventListener("resize", positionDialog);
		return () => {
			window.removeEventListener("resize", positionDialog);
			window.visualViewport?.removeEventListener("resize", positionDialog);
		};
	}, [trigger]);

	useLayoutEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		const root = document.documentElement;
		const previousOverflow = root.style.overflow;
		const previousGutter = root.style.scrollbarGutter;
		if (modal) {
			if (window.innerWidth > root.clientWidth)
				root.style.scrollbarGutter = "stable";
			root.style.overflow = "hidden";
			dialog.showModal();
			bodyRef.current?.focus({ preventScroll: true });
		} else {
			// Setting open directly keeps a hover preview from moving keyboard focus.
			dialog.open = true;
		}
		return () => {
			const returnFocus = dialog.contains(document.activeElement);
			dialog.close();
			if (modal) {
				root.style.overflow = previousOverflow;
				root.style.scrollbarGutter = previousGutter;
			}
			if (returnFocus && trigger.isConnected)
				trigger.focus({ preventScroll: true });
		};
	}, [trigger, modal]);

	useLayoutEffect(() => {
		if (activation === "press") bodyRef.current?.focus({ preventScroll: true });
	}, [activation]);

	useEffect(() => {
		const sourceScroll = { left: window.scrollX, top: window.scrollY };
		const onPointerDown = (event: PointerEvent) => {
			const panel = dialogRef.current;
			const targetNode = event.target instanceof Node ? event.target : null;
			const rect = panel?.getBoundingClientRect();
			const inside = !!(
				panel &&
				targetNode &&
				panel.contains(targetNode) &&
				rect &&
				event.clientX >= rect.left &&
				event.clientX <= rect.right &&
				event.clientY >= rect.top &&
				event.clientY <= rect.bottom
			);
			pointerDownInside.current = inside;
			if (!inside && !trigger.contains(targetNode)) closeRef.current();
		};
		const onPointerUp = () => {
			pointerDownInside.current = false;
			if (!dialogRef.current?.matches(":hover") && !trigger.matches(":hover"))
				leaveIfIdle();
		};
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				event.preventDefault();
				closeRef.current();
			} else if (
				event.key === "ArrowDown" &&
				document.activeElement === trigger
			) {
				event.preventDefault();
				bodyRef.current?.focus({ preventScroll: true });
			}
		};
		const onScroll = () => {
			if (
				modal ||
				(window.scrollX === sourceScroll.left &&
					window.scrollY === sourceScroll.top)
			)
				return;
			const selection = window.getSelection();
			if (
				pointerDownInside.current ||
				(selection &&
					!selection.isCollapsed &&
					dialogRef.current?.contains(selection.anchorNode))
			) {
				// Browser text-selection autoscroll must stay inside the excerpt.
				window.scrollTo({ ...sourceScroll, behavior: "instant" });
				return;
			}
			closeRef.current();
		};
		document.addEventListener("pointerdown", onPointerDown);
		document.addEventListener("pointerup", onPointerUp);
		document.addEventListener("keydown", onKeyDown);
		window.addEventListener("scroll", onScroll);
		return () => {
			document.removeEventListener("pointerdown", onPointerDown);
			document.removeEventListener("pointerup", onPointerUp);
			document.removeEventListener("keydown", onKeyDown);
			window.removeEventListener("scroll", onScroll);
		};
	}, [trigger, modal, leaveIfIdle]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: retry restarts a failed request for the same file.
	useEffect(() => {
		let cancelled = false;
		setLoaded(null);
		void loadNote(visit.target.file)
			.then((nextNote) => {
				if (!cancelled) setLoaded({ file: visit.target.file, note: nextNote });
			})
			.catch(() => {
				if (!cancelled) setLoaded({ file: visit.target.file, note: null });
			});
		return () => {
			cancelled = true;
		};
	}, [visit.target.file, retry]);

	useLayoutEffect(() => {
		if (bodyRef.current && note) bodyRef.current.scrollTop = visit.scrollTop;
	}, [note, visit]);

	const resolvePreviewHref = useCallback(
		(href: string) => resolveNoteHref(href, visit.target.file),
		[visit.target.file],
	);
	const openReference = useCallback((nextTarget: NoteLinkTarget) => {
		bodyRef.current?.focus({ preventScroll: true });
		const scrollTop = bodyRef.current?.scrollTop ?? 0;
		setVisits((previous) => [
			...previous.slice(0, -1),
			{ ...previous[previous.length - 1], scrollTop },
			{ target: nextTarget, scrollTop: 0 },
		]);
	}, []);

	return createPortal(
		<dialog
			ref={dialogRef}
			className="note-peek"
			aria-label={note?.title ?? "引用"}
			aria-modal={modal}
			onPointerEnter={onPointerEnter}
			onPointerLeave={leaveIfIdle}
			onFocusCapture={onPointerEnter}
			onBlurCapture={(event) => {
				const next = event.relatedTarget;
				if (
					next instanceof Node &&
					(event.currentTarget.contains(next) || trigger.contains(next))
				)
					return;
				if (
					!event.currentTarget.matches(":hover") &&
					!trigger.matches(":hover")
				)
					onPointerLeave();
			}}
			onCancel={(event) => {
				event.preventDefault();
				onClose();
			}}
			style={
				{
					...position,
					"--peek-bg": theme.bg,
					"--peek-border": theme.borderLight,
					"--peek-text": theme.text,
					"--peek-muted": theme.textSec,
					"--peek-accent": theme.accent,
					colorScheme: mode === "dark" ? "dark" : "light",
				} as CSSProperties
			}
		>
			<header className="note-peek-header">
				{visits.length > 1 && (
					<button
						type="button"
						className="note-peek-icon"
						aria-label="返回上一条"
						title="返回上一条"
						onClick={() => {
							bodyRef.current?.focus({ preventScroll: true });
							setVisits((previous) => previous.slice(0, -1));
						}}
					>
						<svg
							aria-hidden="true"
							width="15"
							height="15"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
						>
							<path d="m14 6-6 6 6 6" />
						</svg>
					</button>
				)}
				<button
					type="button"
					className="note-peek-source"
					aria-label="阅读全文"
					title={note?.title}
					disabled={!note}
					onClick={() => onOpenFull(visit.target)}
				>
					<span className="note-peek-title">{note?.title ?? "…"}</span>
					<svg
						aria-hidden="true"
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
					>
						<path d="M6 18 18 6M6 6h12v12" />
					</svg>
				</button>
				<button
					type="button"
					className="note-peek-icon"
					aria-label="关闭速览"
					title="关闭"
					onClick={onClose}
				>
					<svg
						aria-hidden="true"
						width="15"
						height="15"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
					>
						<path d="m6 6 12 12M18 6 6 18" />
					</svg>
				</button>
			</header>
			<section
				ref={bodyRef}
				// biome-ignore lint/a11y/noNoninteractiveTabindex: The scrollable excerpt needs a keyboard focus target.
				tabIndex={0}
				aria-label="引用内容"
				className="note-peek-body"
				data-note-preview-scroll
				aria-busy={loading}
			>
				{note ? (
					<MarkdownPreview
						content={note.content}
						theme={theme}
						isDark={mode === "dark"}
						excerpt={{
							anchor: visit.target.anchor,
							idPrefix: `${id}-excerpt-`,
						}}
						resolveNoteHref={resolvePreviewHref}
						onNoteOpen={openReference}
					/>
				) : loading ? (
					<output className="note-peek-status">加载中…</output>
				) : (
					<div className="note-peek-status">
						<output>加载失败。</output>
						<button
							type="button"
							className="note-peek-retry"
							onClick={() => {
								bodyRef.current?.focus({ preventScroll: true });
								setRetry((value) => value + 1);
							}}
						>
							重试
						</button>
					</div>
				)}
			</section>
		</dialog>,
		document.body,
	);
}
