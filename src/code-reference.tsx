import {
	type ReactNode,
	type RefObject,
	Suspense,
	lazy,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	type CodeReferenceBounds,
	CodeReferenceContext,
	type CodeReferenceNote,
	type CodeReferenceSource,
} from "./code-reference-context";
import type { Theme } from "./themes";

export type {
	CodeReferenceBounds,
	CodeReferenceSource,
} from "./code-reference-context";

const CodeReferenceWindow = lazy(() => import("./code-reference-window"));

export function findCodeReferenceBlock(file: string, blockIndex: number) {
	const article = document.querySelector<HTMLElement>("[data-note-content]");
	if (article?.dataset.noteFile !== file) return null;
	return article
		.querySelectorAll<HTMLElement>(".markdown-code-block")
		.item(blockIndex);
}

function sourceLabel(element: HTMLElement): string {
	const article = element.closest(".markdown-prose");
	let label = "代码参考";
	for (const heading of article?.querySelectorAll("h1, h2, h3, h4, h5, h6") ??
		[]) {
		if (
			heading.compareDocumentPosition(element) &
			Node.DOCUMENT_POSITION_FOLLOWING
		)
			label = heading.textContent?.trim() || label;
	}
	return label;
}

export function CodeReferencePin({
	value,
	language,
	sourceRef,
}: {
	value: string;
	language?: string;
	sourceRef: RefObject<HTMLElement | null>;
}) {
	const reference = useContext(CodeReferenceContext);
	const [blockIndex, setBlockIndex] = useState(-1);
	useEffect(() => {
		const element = sourceRef.current;
		const blocks = element
			?.closest("[data-note-content]")
			?.querySelectorAll(".markdown-code-block");
		setBlockIndex(element && blocks ? Array.from(blocks).indexOf(element) : -1);
	}, [sourceRef]);
	const note = reference?.note;
	if (!reference || !note) return null;
	const pinned =
		reference.source?.file === note.file &&
		reference.source.blockIndex === blockIndex;
	return (
		<button
			type="button"
			className="markdown-code-copy markdown-code-pin"
			aria-label="固定代码"
			aria-pressed={pinned}
			title="固定代码"
			onClick={() => {
				const element = sourceRef.current;
				if (!element || blockIndex < 0) return;
				reference.pin({
					value,
					language: language ?? "",
					label: sourceLabel(element),
					file: note.file,
					noteTitle: note.title,
					blockIndex,
				});
			}}
		>
			<svg
				className="markdown-code-copy-icon"
				viewBox="0 0 24 24"
				fill="none"
				aria-hidden="true"
			>
				<path
					d="m15 3 6 6-3 1-4 4v3l-3-3-7 7 7-7-3-3h3l4-4z"
					stroke="currentColor"
					strokeWidth="1.6"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		</button>
	);
}

/** Keep one reference throughout the notes page, independent of the open article. */
export function CodeReferenceProvider({
	children,
	theme,
	isDark,
	note,
	onOpenSource,
}: {
	children: ReactNode;
	theme: Theme;
	isDark: boolean;
	note: CodeReferenceNote | null;
	onOpenSource: (file: string, blockIndex: number) => void;
}) {
	const [source, setSource] = useState<CodeReferenceSource | null>(null);
	const rememberedBounds = useRef<CodeReferenceBounds | null>(null);
	const currentSource = useRef(source);
	currentSource.current = source;
	const close = useCallback(() => {
		const current = currentSource.current;
		if (current)
			findCodeReferenceBlock(current.file, current.blockIndex)
				?.querySelector<HTMLButtonElement>(".markdown-code-pin")
				?.focus({ preventScroll: true });
		setSource(null);
	}, []);
	const returnToSource = useCallback(() => {
		const current = currentSource.current;
		if (!current) return;
		const element = findCodeReferenceBlock(current.file, current.blockIndex);
		close();
		if (element)
			element.scrollIntoView({ block: "center", behavior: "smooth" });
		else onOpenSource(current.file, current.blockIndex);
	}, [close, onOpenSource]);
	const context = useMemo(
		() => ({ note, source, pin: setSource }),
		[note, source],
	);
	return (
		<CodeReferenceContext.Provider value={context}>
			{children}
			{source && (
				<Suspense fallback={null}>
					<CodeReferenceWindow
						source={source}
						theme={theme}
						isDark={isDark}
						rememberedBounds={rememberedBounds}
						onClose={close}
						onReturnToSource={returnToSource}
					/>
				</Suspense>
			)}
		</CodeReferenceContext.Provider>
	);
}
