import {
	type CSSProperties,
	type ReactNode,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import "katex/dist/katex.min.css";
import { CodeReferencePin } from "./code-reference";
import "./markdown-answers.css";
import "./markdown-tabs.css";
import {
	MarkdownTabs,
	MarkdownTabsProvider,
	revealNoteTab,
} from "./markdown-tabs";
import { type NoteExcerptOptions, rehypeNoteExcerpt } from "./note-excerpt";
import {
	type NoteBody,
	codeHighlightKey,
	readMarkdownCodeBlock,
} from "./note-markdown";
import type { NoteLinkTarget } from "./notes";

// Notes supplies the frame. The code surface uses the stock Shiki themes.
const CODE_FRAME_THEMES = {
	light: {
		bg: "#FFFFFF",
		text: "#000000",
		headerBg: "#D5E1E9",
		border: "#718A9B",
		label: "#293E4B",
		accent: "#004C9E",
		success: "#075B1D",
		error: "#A31525",
	},
	dark: {
		bg: "#1E1E1E",
		text: "#D4D4D4",
		headerBg: "#0D171F",
		border: "#526877",
		label: "#A7B1BB",
		accent: "#79C0FF",
		success: "#7EE787",
		error: "#FF8A82",
	},
};

/* ---- Code blocks: <pre> is the only block-level rendering seam ---- */
interface CodeElementProps {
	className?: string;
	children?: ReactNode;
}

function InlineCode({ className, children }: CodeElementProps) {
	return (
		<code className={className || "markdown-inline-code"}>{children}</code>
	);
}

type CopyStatus = "idle" | "copied" | "error";

function CodeBlockCopyIcon({ status }: { status: CopyStatus }) {
	if (status === "copied") {
		return (
			<svg
				aria-hidden="true"
				className="markdown-code-copy-icon"
				fill="none"
				focusable="false"
				viewBox="0 0 24 24"
			>
				<path
					d="m5 12 4 4L19 6"
					stroke="currentColor"
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="1.8"
				/>
			</svg>
		);
	}

	if (status === "error") {
		return (
			<svg
				aria-hidden="true"
				className="markdown-code-copy-icon"
				fill="none"
				focusable="false"
				viewBox="0 0 24 24"
			>
				<path
					d="m7 7 10 10M17 7 7 17"
					stroke="currentColor"
					strokeLinecap="round"
					strokeWidth="1.8"
				/>
			</svg>
		);
	}

	return (
		<svg
			aria-hidden="true"
			className="markdown-code-copy-icon"
			fill="none"
			focusable="false"
			viewBox="0 0 24 24"
		>
			<rect
				height="13"
				rx="2"
				stroke="currentColor"
				strokeWidth="1.7"
				width="13"
				x="8"
				y="8"
			/>
			<path
				d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="1.7"
			/>
		</svg>
	);
}

async function writeCodeToClipboard(value: string): Promise<void> {
	if (navigator.clipboard && window.isSecureContext) {
		try {
			await navigator.clipboard.writeText(value);
			return;
		} catch {
			// Fall through for browsers that expose Clipboard API but deny access.
		}
	}

	const activeElement =
		document.activeElement instanceof HTMLElement
			? document.activeElement
			: null;
	const textArea = document.createElement("textarea");
	textArea.value = value;
	textArea.setAttribute("readonly", "");
	textArea.style.position = "fixed";
	textArea.style.left = "-9999px";
	textArea.style.top = "-9999px";
	document.body.appendChild(textArea);

	let copied = false;
	try {
		textArea.select();
		textArea.setSelectionRange(0, value.length);
		copied = document.execCommand("copy");
	} finally {
		textArea.remove();
		activeElement?.focus({ preventScroll: true });
	}

	if (!copied) throw new Error("Unable to copy code");
}

export function CodeBlockCopyButton({ value }: { value: string }) {
	const [status, setStatus] = useState<CopyStatus>("idle");
	const resetTimer = useRef<number | null>(null);

	useEffect(
		() => () => {
			if (resetTimer.current !== null) {
				window.clearTimeout(resetTimer.current);
			}
		},
		[],
	);

	async function handleCopy() {
		if (resetTimer.current !== null) {
			window.clearTimeout(resetTimer.current);
		}

		try {
			await writeCodeToClipboard(value);
			setStatus("copied");
		} catch {
			setStatus("error");
		}

		resetTimer.current = window.setTimeout(() => {
			setStatus("idle");
			resetTimer.current = null;
		}, 1800);
	}

	return (
		<>
			<button
				aria-label={status === "error" ? "重新复制代码" : "复制代码"}
				className="markdown-code-copy"
				data-copy-state={status}
				onClick={handleCopy}
				type="button"
			>
				<CodeBlockCopyIcon status={status} />
			</button>
			<output aria-atomic="true" className="sr-only">
				{status === "copied"
					? "代码已复制"
					: status === "error"
						? "复制失败，请重试"
						: ""}
			</output>
		</>
	);
}

function CodeBlockFrame({
	value,
	language,
	highlightedHtml,
	isDark,
}: {
	value: string;
	language: string;
	highlightedHtml?: string;
	isDark: boolean;
}) {
	const sourceRef = useRef<HTMLElement>(null);
	return (
		<figure ref={sourceRef} className="not-prose markdown-code-block">
			<figcaption className="markdown-code-toolbar">
				<span className="markdown-code-language">{language || "text"}</span>
				<div className="markdown-code-actions">
					<CodeReferencePin
						value={value}
						language={language}
						highlightedHtml={highlightedHtml}
						sourceRef={sourceRef}
					/>
					<CodeBlockCopyButton value={value} />
				</div>
			</figcaption>
			<CodeBlockContent
				value={value}
				language={language}
				highlightedHtml={highlightedHtml}
				isDark={isDark}
			/>
		</figure>
	);
}

export function CodeBlockContent({
	language,
	value,
	highlightedHtml,
	isDark,
	focusable = false,
}: {
	language: string;
	value: string;
	highlightedHtml?: string;
	isDark: boolean;
	focusable?: boolean;
}) {
	const markup =
		highlightedHtml === undefined ? undefined : { __html: highlightedHtml };
	return (
		<pre tabIndex={focusable ? 0 : undefined}>
			<code
				className={language ? "language-" + language : undefined}
				data-code-theme={markup && (isDark ? "dark" : "light")}
				// biome-ignore lint/security/noDangerouslySetInnerHtml: the build generates escaped Shiki markup from the original code
				dangerouslySetInnerHTML={markup}
			>
				{markup ? undefined : value}
			</code>
		</pre>
	);
}

/* ---- Function Plot component ---- */
function makePlotFn(expr: string): (x: number) => number {
	const fn = new Function(
		"x",
		`with(Math){return(${expr.replace(/;/g, "")})}`,
	) as (x: number) => number;
	return fn;
}

function parseRange(raw: string): [number, number] | null {
	const inner = raw.replace(/^\[?\s*/, "").replace(/\s*\]?$/, "");
	const parts = inner.split(",").map((s) => {
		const expression = s.trim();
		try {
			return Function(`with(Math){return(${expression})}`)();
		} catch {
			return Number.NaN;
		}
	});
	return parts.length === 2 && parts.every((n) => !Number.isNaN(n))
		? (parts as [number, number])
		: null;
}

interface PlotPoint {
	x: number;
	y: number | null;
}

interface PlotModel {
	points: PlotPoint[];
	yMin: number;
	yMax: number;
}

function percentile(sorted: number[], q: number): number {
	if (sorted.length === 1) return sorted[0];
	const index = (sorted.length - 1) * q;
	const lower = Math.floor(index);
	const upper = Math.ceil(index);
	if (lower === upper) return sorted[lower];
	const weight = index - lower;
	return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function getPlotYRange(values: number[]): [number, number] | null {
	if (values.length === 0) return null;

	const sorted = [...values].sort((a, b) => a - b);
	const fullMin = sorted[0];
	const fullMax = sorted[sorted.length - 1];
	const fullRange = fullMax - fullMin;
	const robustMin = percentile(sorted, 0.02);
	const robustMax = percentile(sorted, 0.98);
	const robustRange = robustMax - robustMin;

	let yMin = fullMin;
	let yMax = fullMax;
	if (robustRange > 0 && fullRange / robustRange > 8) {
		yMin = robustMin;
		yMax = robustMax;
	}

	const yPad = (yMax - yMin) * 0.12 || 1;
	yMin -= yPad;
	yMax += yPad;

	if (yMin > 0) yMin = 0;
	if (yMax < 0) yMax = 0;

	return [yMin, yMax];
}

function buildPlotModel(
	fnExpr: string,
	xMin: number,
	xMax: number,
	samples: number,
): PlotModel | null {
	const fn = makePlotFn(fnExpr);
	const points: PlotPoint[] = [];
	const values: number[] = [];

	for (let i = 0; i <= samples; i++) {
		const x = xMin + ((xMax - xMin) * i) / samples;
		try {
			const y = fn(x);
			if (Number.isFinite(y)) {
				points.push({ x, y });
				values.push(y);
			} else {
				points.push({ x, y: null });
			}
		} catch {
			points.push({ x, y: null });
		}
	}

	const yRange = getPlotYRange(values);
	if (!yRange) return null;
	return { points, yMin: yRange[0], yMax: yRange[1] };
}

function PlotCanvas({
	fnExpr,
	xMin,
	xMax,
	strokeColor,
	isDark,
}: {
	fnExpr: string;
	xMin: number;
	xMax: number;
	strokeColor: string;
	isDark: boolean;
}) {
	const ref = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = ref.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const dpr = window.devicePixelRatio || 1;
		const cssW = canvas.clientWidth;
		if (cssW === 0) return;
		const cssH = Math.max(200, Math.min(300, cssW * 0.45));
		canvas.style.height = `${cssH}px`;
		canvas.width = cssW * dpr;
		canvas.height = cssH * dpr;
		ctx.scale(dpr, dpr);

		const samples = Math.max(cssW * 2, 400);
		const model = buildPlotModel(fnExpr, xMin, xMax, samples);
		if (!model) return;
		const { points, yMin, yMax } = model;

		const pad = { top: 12, right: 16, bottom: 24, left: 42 };
		const pw = cssW - pad.left - pad.right;
		const ph = cssH - pad.top - pad.bottom;

		const toX = (v: number) => pad.left + ((v - xMin) / (xMax - xMin)) * pw;
		const toY = (v: number) => pad.top + (1 - (v - yMin) / (yMax - yMin)) * ph;

		// helpers
		function niceStep(range: number, targetTicks: number): number {
			const rough = range / targetTicks;
			const mag = 10 ** Math.floor(Math.log10(rough));
			const residual = rough / mag;
			let nice: number;
			if (residual <= 1.5) nice = 1;
			else if (residual <= 3.5) nice = 2;
			else if (residual <= 7.5) nice = 5;
			else nice = 10;
			return nice * mag;
		}

		const gridColor = isDark ? "#333344" : "#e8e4e0";
		const axisColor = isDark ? "#777788" : "#555";
		const labelColor = isDark ? "#9999aa" : "#777";

		// grid
		const xStep = niceStep(xMax - xMin, 8);
		const yStep = niceStep(yMax - yMin, 6);

		ctx.strokeStyle = gridColor;
		ctx.lineWidth = 0.5;
		for (let v = Math.ceil(xMin / xStep) * xStep; v <= xMax; v += xStep) {
			ctx.beginPath();
			ctx.moveTo(toX(v), pad.top);
			ctx.lineTo(toX(v), pad.top + ph);
			ctx.stroke();
		}
		for (let v = Math.ceil(yMin / yStep) * yStep; v <= yMax; v += yStep) {
			ctx.beginPath();
			ctx.moveTo(pad.left, toY(v));
			ctx.lineTo(pad.left + pw, toY(v));
			ctx.stroke();
		}

		// axes
		ctx.strokeStyle = axisColor;
		ctx.lineWidth = 1;
		if (yMin <= 0 && yMax >= 0) {
			ctx.beginPath();
			ctx.moveTo(pad.left, toY(0));
			ctx.lineTo(pad.left + pw, toY(0));
			ctx.stroke();
		}
		if (xMin <= 0 && xMax >= 0) {
			ctx.beginPath();
			ctx.moveTo(toX(0), pad.top);
			ctx.lineTo(toX(0), pad.top + ph);
			ctx.stroke();
		}

		// labels
		ctx.fillStyle = labelColor;
		ctx.font = "10px sans-serif";
		ctx.textAlign = "center";
		for (let v = Math.ceil(xMin / xStep) * xStep; v <= xMax; v += xStep) {
			const label =
				Math.abs(v) < 1e-10 ? "0" : Number(v.toPrecision(4)).toString();
			ctx.fillText(label, toX(v), cssH - 4);
		}
		ctx.textAlign = "right";
		for (let v = Math.ceil(yMin / yStep) * yStep; v <= yMax; v += yStep) {
			const label =
				Math.abs(v) < 1e-10 ? "0" : Number(v.toPrecision(4)).toString();
			ctx.fillText(label, pad.left - 4, toY(v) + 3);
		}

		// curve
		ctx.strokeStyle = strokeColor;
		ctx.lineWidth = 2;
		ctx.lineJoin = "round";
		ctx.lineCap = "round";
		ctx.beginPath();
		let drawing = false;
		let prevY: number | null = null;
		const ySpan = yMax - yMin;
		for (const point of points) {
			const { x, y } = point;
			if (y === null || y < yMin || y > yMax) {
				drawing = false;
				prevY = null;
				continue;
			}

			const cy = toY(y);
			if (prevY !== null && Math.abs(y - prevY) > ySpan * 0.75) {
				drawing = false;
			}
			if (!drawing) {
				ctx.moveTo(toX(x), cy);
				drawing = true;
			} else {
				ctx.lineTo(toX(x), cy);
			}
			prevY = y;
		}
		ctx.stroke();
	}, [fnExpr, xMin, xMax, strokeColor, isDark]);

	return (
		<div style={{ minHeight: 220 }}>
			<canvas
				ref={ref}
				style={{
					display: "block",
					width: "100%",
					height: "100%",
					borderRadius: "8px",
				}}
			/>
		</div>
	);
}

function Plot({
	fn,
	range,
	accent,
	isDark,
}: { fn?: string; range?: string; accent?: string; isDark?: boolean }) {
	const fnExpr = fn || "Math.cos(x)";
	const [xMin, xMax] = range
		? (parseRange(range) ?? [-Math.PI * 2, Math.PI * 2])
		: [-Math.PI * 2, Math.PI * 2];
	const stroke = accent || "#2563eb";
	const dk = isDark ?? false;
	return (
		<PlotCanvas
			fnExpr={fnExpr}
			xMin={xMin}
			xMax={xMax}
			strokeColor={stroke}
			isDark={dk}
		/>
	);
}

interface NoteLinkAdapter {
	resolveNoteHref?: (href: string) => NoteLinkTarget | null;
	onNoteOpen?: (target: NoteLinkTarget, trigger: HTMLAnchorElement) => void;
	onNoteLinkPointerEnter?: (
		target: NoteLinkTarget,
		trigger: HTMLAnchorElement,
	) => void;
	onNoteLinkPointerLeave?: (trigger: HTMLAnchorElement) => void;
	onNoteLinkFocus?: (
		target: NoteLinkTarget,
		trigger: HTMLAnchorElement,
	) => void;
	onNoteLinkBlur?: (
		trigger: HTMLAnchorElement,
		relatedTarget: EventTarget | null,
	) => void;
	excerptIdPrefix?: string;
}

/* ---- Components factory (avoids TS type conflict with custom Plot) ---- */
function makeComponents(
	dark: boolean,
	theme: { accent: string },
	noteLinks: NoteLinkAdapter,
	codeHighlights: NoteBody["codeHighlights"] | undefined,
): Components {
	return {
		span: ({ node, children, ...props }) => {
			const data = node?.data;
			const html =
				data && "noteMathHtml" in data ? data.noteMathHtml : undefined;
			if (typeof html === "string") {
				return <span {...props} dangerouslySetInnerHTML={{ __html: html }} />;
			}
			return <span {...props}>{children}</span>;
		},
		a: ({ node: _node, href, children, ...props }) => {
			if (!href) return <span>{children}</span>;
			if (
				noteLinks.excerptIdPrefix &&
				href.startsWith(`#${noteLinks.excerptIdPrefix}`)
			) {
				return (
					<a
						{...props}
						href={href}
						onClick={(event) => {
							event.preventDefault();
							const article = event.currentTarget.closest("article");
							const target = Array.from(
								article?.querySelectorAll("[id]") ?? [],
							).find((element) => element.id === href.slice(1));
							if (!target) return;
							revealNoteTab(target, () => {
								const scrollRoot = article?.closest(
									"[data-note-preview-scroll]",
								);
								if (scrollRoot) {
									const offset =
										target.getBoundingClientRect().top -
										scrollRoot.getBoundingClientRect().top;
									scrollRoot.scrollTop += offset;
								} else {
									target.scrollIntoView({ block: "nearest" });
								}
							});
						}}
					>
						{children}
					</a>
				);
			}
			if (href.startsWith("http")) {
				return (
					<a {...props} href={href} target="_blank" rel="noopener noreferrer">
						{children}
					</a>
				);
			}
			const noteTarget = noteLinks.resolveNoteHref?.(href) ?? null;
			if (noteTarget && noteLinks.onNoteOpen) {
				return (
					<a
						{...props}
						href={href}
						onPointerEnter={(event) => {
							if (
								event.pointerType === "mouse" &&
								window.matchMedia("(any-hover: hover) and (any-pointer: fine)")
									.matches
							) {
								noteLinks.onNoteLinkPointerEnter?.(
									noteTarget,
									event.currentTarget,
								);
							}
						}}
						onPointerLeave={(event) => {
							if (event.pointerType === "mouse")
								noteLinks.onNoteLinkPointerLeave?.(event.currentTarget);
						}}
						onFocus={(event) => {
							if (event.currentTarget.matches(":focus-visible"))
								noteLinks.onNoteLinkFocus?.(noteTarget, event.currentTarget);
						}}
						onBlur={(event) =>
							noteLinks.onNoteLinkBlur?.(
								event.currentTarget,
								event.relatedTarget,
							)
						}
						onClick={(e) => {
							e.preventDefault();
							noteLinks.onNoteOpen?.(noteTarget, e.currentTarget);
						}}
						className={`inline-flex items-center gap-0.5 ${noteTarget.isWiki ? "font-medium" : ""}`}
						style={noteTarget.isWiki ? { color: theme.accent } : undefined}
					>
						{children}
						{noteTarget.isWiki && (
							<svg
								aria-hidden="true"
								className="inline-block flex-shrink-0"
								width="11"
								height="11"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2.5"
								strokeLinecap="round"
								strokeLinejoin="round"
								style={{ opacity: 0.5 }}
							>
								<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
								<polyline points="15 3 21 3 21 9" />
								<line x1="10" y1="14" x2="21" y2="3" />
							</svg>
						)}
					</a>
				);
			}
			return (
				<a {...props} href={href}>
					{children}
				</a>
			);
		},
		img: ({ node: _node, src, alt, ...props }) => (
			<img
				{...props}
				src={
					src?.startsWith("/assets/")
						? `${import.meta.env.BASE_URL}${src.slice(1)}`
						: src
				}
				alt={alt ?? ""}
				loading={props.loading ?? "lazy"}
				decoding={props.decoding ?? "async"}
			/>
		),
		div: ({ node, children, ...props }) => {
			const label = node?.properties.dataNoteTabs;
			if (typeof label === "string" && label.trim()) {
				const defaultTab = node?.properties.dataNoteTabsDefault;
				const syncGroup = node?.properties.dataNoteTabsSync;
				return (
					<MarkdownTabs
						label={label.trim()}
						defaultTab={
							typeof defaultTab === "string" ? defaultTab.trim() : undefined
						}
						syncGroup={
							typeof syncGroup === "string" ? syncGroup.trim() : undefined
						}
					>
						{children}
					</MarkdownTabs>
				);
			}
			return <div {...props}>{children}</div>;
		},
		table: ({ node: _node, children, ...props }) => (
			<div className="markdown-table-scroll">
				<table {...props}>{children}</table>
			</div>
		),
		code: ({ className, children }: CodeElementProps) => (
			<InlineCode className={className}>{children}</InlineCode>
		),
		pre: ({ node }) => {
			const { language, value } = readMarkdownCodeBlock(node);
			if (language === "plot") {
				return (
					<div className="not-prose markdown-plot-block">
						<Plot fn={value.trim()} accent={theme.accent} isDark={dark} />
					</div>
				);
			}
			return (
				<CodeBlockFrame
					language={language}
					value={value}
					highlightedHtml={codeHighlights?.[codeHighlightKey(language, value)]}
					isDark={dark}
				/>
			);
		},
	};
}

/* ---- Main renderer ---- */
interface ThemeColors {
	accent: string;
	text?: string;
	textSec?: string;
	borderLight?: string;
}

export function markdownThemeVariables(
	theme: ThemeColors,
	dark: boolean,
): CSSProperties {
	const syntax = dark ? CODE_FRAME_THEMES.dark : CODE_FRAME_THEMES.light;
	return {
		"--markdown-accent": theme.accent,
		"--markdown-inline-border": `${theme.accent}${dark ? "26" : "1F"}`,
		"--markdown-inline-bg": `${theme.accent}${dark ? "1A" : "14"}`,
		"--markdown-term-border": `${theme.accent}${dark ? "40" : "33"}`,
		"--markdown-term-bg": `${theme.accent}${dark ? "1A" : "0F"}`,
		"--syntax-bg": syntax.bg,
		"--syntax-header-bg": syntax.headerBg,
		"--syntax-text": syntax.text,
		"--syntax-border": syntax.border,
		"--syntax-label": syntax.label,
		"--syntax-accent": syntax.accent,
		"--syntax-error": syntax.error,
		"--syntax-success": syntax.success,
	} as CSSProperties;
}

export function MarkdownPreview({
	documentTree,
	codeHighlights,
	theme,
	isDark,
	resolveNoteHref,
	onNoteOpen,
	onNoteLinkPointerEnter,
	onNoteLinkPointerLeave,
	onNoteLinkFocus,
	onNoteLinkBlur,
	excerpt,
}: {
	documentTree: NoteBody["documentTree"];
	codeHighlights?: NoteBody["codeHighlights"];
	theme: ThemeColors;
	isDark?: boolean;
	excerpt?: NoteExcerptOptions;
} & Omit<NoteLinkAdapter, "excerptIdPrefix">) {
	const dark = isDark ?? false;
	const components = useMemo(
		() =>
			makeComponents(
				dark,
				theme,
				{
					resolveNoteHref,
					onNoteOpen,
					onNoteLinkPointerEnter,
					onNoteLinkPointerLeave,
					onNoteLinkFocus,
					onNoteLinkBlur,
					excerptIdPrefix: excerpt?.idPrefix,
				},
				codeHighlights,
			),
		[
			dark,
			theme,
			codeHighlights,
			resolveNoteHref,
			onNoteOpen,
			onNoteLinkPointerEnter,
			onNoteLinkPointerLeave,
			onNoteLinkFocus,
			onNoteLinkBlur,
			excerpt?.idPrefix,
		],
	);

	const excerptAnchor = excerpt?.anchor;
	const excerptIdPrefix = excerpt?.idPrefix;
	const rehypePlugins = useMemo(() => {
		// The excerpt and URL transforms edit their input tree.
		const loadDocument = () => () => structuredClone(documentTree);
		return excerptIdPrefix
			? [
					loadDocument,
					() =>
						rehypeNoteExcerpt({
							anchor: excerptAnchor ?? null,
							idPrefix: excerptIdPrefix,
						}),
				]
			: [loadDocument];
	}, [documentTree, excerptAnchor, excerptIdPrefix]);

	const markdownStyle = markdownThemeVariables(theme, dark);

	return (
		<article className="w-full">
			<div
				className={`markdown-prose w-full max-w-none prose prose-ocean${dark ? " dark" : ""}`}
				style={markdownStyle}
			>
				<MarkdownTabsProvider>
					<ReactMarkdown
						rehypePlugins={rehypePlugins}
						components={components}
					/>
				</MarkdownTabsProvider>
			</div>
		</article>
	);
}
