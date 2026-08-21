import {
	type CSSProperties,
	type ReactElement,
	type ReactNode,
	isValidElement,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import cpp from "highlight.js/lib/languages/cpp";
import css from "highlight.js/lib/languages/css";
import go from "highlight.js/lib/languages/go";
import java from "highlight.js/lib/languages/java";
import json from "highlight.js/lib/languages/json";
import kotlin from "highlight.js/lib/languages/kotlin";
import markdown from "highlight.js/lib/languages/markdown";
import python from "highlight.js/lib/languages/python";
import ruby from "highlight.js/lib/languages/ruby";
import rust from "highlight.js/lib/languages/rust";
import shell from "highlight.js/lib/languages/shell";
import sql from "highlight.js/lib/languages/sql";
import swift from "highlight.js/lib/languages/swift";
import ts from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";

const loadTreeSitterHighlighter = () => import("./highlighter");

/* ---- highlight.js language registrations ---- */
hljs.registerLanguage("typescript", ts);
hljs.registerLanguage("ts", ts);
hljs.registerLanguage("javascript", ts);
hljs.registerLanguage("js", ts);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("sh", shell);
hljs.registerLanguage("shell", shell);
hljs.registerLanguage("json", json);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("css", css);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("yml", yaml);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("md", markdown);
hljs.registerLanguage("python", python);
hljs.registerLanguage("py", python);
hljs.registerLanguage("rust", rust);
hljs.registerLanguage("rs", rust);
hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("c++", cpp);
hljs.registerLanguage("c", cpp);
hljs.registerLanguage("java", java);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("go", go);
hljs.registerLanguage("ruby", ruby);
hljs.registerLanguage("swift", swift);
hljs.registerLanguage("kotlin", kotlin);
hljs.registerLanguage("cmake", (hljs) => ({
	name: "CMake",
	case_insensitive: true,
	keywords: {
		keyword:
			"if else elseif endif foreach endwhile while endwhile endforeach endfunction endmacro endblock cmake_minimum_required project set option macro function include find_package add_executable add_library target_link_libraries target_include_directories target_compile_definitions target_compile_options add_subdirectory install export configure_file file message string list math execute_process add_definitions remove_definitions add_compile_options source_group set_property get_property get_target_property set_target_properties get_directory_property include_directories link_directories link_libraries aux_source_directory create_test_sourcelist add_test enable_testing",
		built_in:
			"TRUE FALSE ON OFF AND OR NOT COMMAND POLICY TARGET PROPERTY CACHE ENV VARIABLE IN_LIST APPEND PREPEND REMOVE_AT REMOVE_ITEM REPLACE REGEX MATCH MATCHALL LESS GREATER EQUAL STRLESS STRGREATER STREQUAL VERSION_LESS VERSION_GREATER VERSION_EQUAL",
	},
	contains: [
		hljs.HASH_COMMENT_MODE,
		{ className: "variable", begin: /\$\{/, end: /\}/, contains: ["self"] },
		hljs.QUOTE_STRING_MODE,
		hljs.NUMBER_MODE,
	],
}));

/* ---- Code highlighter themes ---- */
// Syntax roles follow the familiar VS Code Light+/Dark+ convention. Comment
// greens are luminance-calibrated to the Notes backgrounds for small web text.
export const HLJS_THEMES = {
	light: {
		bg: "#F8FAFC",
		headerBg: "#D5E1E9",
		text: "#1F2328",
		comment: "#006400",
		keyword: "#A31525",
		string: "#075B1D",
		number: "#864000",
		function: "#004C9E",
		class_: "#6F36B3",
		type: "#6F36B3",
		builtIn: "#6F36B3",
		variable: "#1F2328",
		templateVar: "#6F36B3",
		attr: "#864000",
		meta: "#4B5560",
		metaKeyword: "#A31525",
		metaString: "#075B1D",
		punctuation: "#3F4850",
		operator: "#3F4850",
		bullet: "#005A50",
		link: "#004C9E",
		deletion: "#A31525",
		addition: "#075B1D",
		border: "#718A9B",
		langBar: "#293E4B",
		shadow: "none",
	},
	dark: {
		bg: "#16232D",
		headerBg: "#0D171F",
		text: "#F0F6FC",
		comment: "#84BA70",
		keyword: "#FF8A82",
		string: "#7EE787",
		number: "#FFA657",
		function: "#79C0FF",
		class_: "#D2A8FF",
		type: "#D2A8FF",
		builtIn: "#D2A8FF",
		variable: "#F0F6FC",
		templateVar: "#D2A8FF",
		attr: "#FFA657",
		meta: "#A7B1BB",
		metaKeyword: "#FF8A82",
		metaString: "#7EE787",
		punctuation: "#C9D1D9",
		operator: "#C9D1D9",
		bullet: "#56D4C2",
		link: "#79C0FF",
		deletion: "#FF8A82",
		addition: "#7EE787",
		border: "#526877",
		langBar: "#A7B1BB",
		shadow: "none",
	},
};

/* ---- remark plugin: CJK emphasis ---- */
interface MarkdownAstNode {
	type?: string;
	value?: unknown;
	children?: MarkdownAstNode[];
	[key: string]: unknown;
}

function isMarkdownAstNode(value: unknown): value is MarkdownAstNode {
	return typeof value === "object" && value !== null;
}

function remarkCJKEmphasis() {
	return (tree: unknown) => {
		if (!isMarkdownAstNode(tree)) return;
		for (const node of tree.children ?? []) {
			processEmphasis(node);
		}
	};
}

function processEmphasis(node: MarkdownAstNode) {
	const children = node.children;
	if (!children || !Array.isArray(children) || children.length === 0) return;

	const newChildren: MarkdownAstNode[] = [];
	for (let i = 0; i < children.length; i++) {
		const child = children[i];

		if (child.type === "text" && typeof child.value === "string") {
			let rest = child.value;
			let processed = false;

			while (rest.length > 0) {
				const strongPos = rest.indexOf("**");
				let emPos = -1;
				for (let j = 0; j < rest.length - 1; j++) {
					if (rest[j] === "*" && rest[j + 1] !== "*") {
						emPos = j;
						break;
					}
				}
				if (emPos < 0 && rest.length > 0 && rest[rest.length - 1] === "*")
					emPos = rest.length - 1;

				if (strongPos >= 0 && (emPos < 0 || strongPos <= emPos)) {
					const closePos = rest.indexOf("**", strongPos + 2);
					if (closePos < 0) break;
					if (strongPos > 0)
						newChildren.push({ type: "text", value: rest.slice(0, strongPos) });
					newChildren.push({
						type: "strong",
						children: [
							{ type: "text", value: rest.slice(strongPos + 2, closePos) },
						],
					});
					rest = rest.slice(closePos + 2);
					processed = true;
				} else if (emPos >= 0) {
					let closePos = -1;
					for (let j = emPos + 1; j < rest.length; j++) {
						if (
							rest[j] === "*" &&
							(j + 1 >= rest.length || rest[j + 1] !== "*")
						) {
							closePos = j;
							break;
						}
					}
					if (closePos < 0) break;
					if (emPos > 0)
						newChildren.push({ type: "text", value: rest.slice(0, emPos) });
					newChildren.push({
						type: "emphasis",
						children: [
							{ type: "text", value: rest.slice(emPos + 1, closePos) },
						],
					});
					rest = rest.slice(closePos + 1);
					processed = true;
				} else {
					break;
				}
			}

			if (processed) {
				if (rest.length > 0) newChildren.push({ type: "text", value: rest });
			} else {
				newChildren.push(child);
			}
		} else {
			newChildren.push(child);
			processEmphasis(child);
		}
	}
	node.children = newChildren;
}

/* ---- GitHub-style callout detection ---- */
function makeCallouts(
	isDark: boolean,
): Record<string, { label: string; border: string; bg: string; icon: string }> {
	const alpha = isDark ? 0.15 : 0.08;
	return {
		"!NOTE": {
			label: "Note",
			border: isDark ? "#58A6D0" : "#3B82F6",
			bg: `rgba(59,130,246,${alpha})`,
			icon: "ℹ️",
		},
		"!TIP": {
			label: "Tip",
			border: isDark ? "#5CC9A7" : "#10B981",
			bg: `rgba(16,185,129,${alpha})`,
			icon: "💡",
		},
		"!IMPORTANT": {
			label: "Important",
			border: isDark ? "#A78BFA" : "#8B5CF6",
			bg: `rgba(139,92,246,${alpha})`,
			icon: "❗",
		},
		"!WARNING": {
			label: "Warning",
			border: isDark ? "#FBBF24" : "#F59E0B",
			bg: `rgba(245,158,11,${alpha})`,
			icon: "⚠️",
		},
		"!CAUTION": {
			label: "Caution",
			border: isDark ? "#F87171" : "#EF4444",
			bg: `rgba(239,68,68,${alpha})`,
			icon: "🚨",
		},
	};
}

function extractText(node: ReactNode): string {
	if (typeof node === "string") return node;
	if (Array.isArray(node)) return node.map(extractText).join("");
	if (node && typeof node === "object" && "props" in node)
		return extractText(
			(node as { props: { children?: ReactNode } }).props.children,
		);
	return "";
}

function Callout({
	children,
	isDark,
	...rest
}: { children?: ReactNode; isDark: boolean } & Record<string, unknown>) {
	const text = extractText(children);
	const firstLine = text.trim().split("\n")[0].trim();
	const callout = makeCallouts(isDark)[firstLine];

	if (callout) {
		const childArray = Array.isArray(children) ? children : [children];
		const [, ...restChildren] = childArray;
		return (
			<div
				style={{
					borderLeft: `3px solid ${callout.border}`,
					backgroundColor: callout.bg,
					borderRadius: "0 8px 8px 0",
					padding: "12px 16px",
					margin: "1em 0",
				}}
				{...rest}
			>
				<div
					style={{
						fontWeight: 600,
						fontSize: "0.875rem",
						marginBottom: 4,
						color: callout.border,
					}}
				>
					{callout.icon} {callout.label}
				</div>
				{restChildren}
			</div>
		);
	}

	return <blockquote {...rest}>{children}</blockquote>;
}

/* ---- Code blocks: <pre> is the only block-level rendering seam ---- */
interface CodeElementProps {
	className?: string;
	children?: ReactNode;
}

function languageFromClassName(className?: string): string {
	return /(?:^|\s)language-([^\s]+)/.exec(className ?? "")?.[1] ?? "";
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

function CodeBlockCopyButton({ value }: { value: string }) {
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
	children,
}: {
	value: string;
	language?: string;
	children: ReactNode;
}) {
	return (
		<figure className="not-prose markdown-code-block syntax-theme-ocean">
			<figcaption className="markdown-code-toolbar">
				<span className="markdown-code-language">{language || "text"}</span>
				<CodeBlockCopyButton value={value} />
			</figcaption>
			{children}
		</figure>
	);
}

function findCodeElement(
	children: ReactNode,
): ReactElement<CodeElementProps> | null {
	const candidates = Array.isArray(children) ? children : [children];
	for (const candidate of candidates) {
		if (isValidElement<CodeElementProps>(candidate)) {
			return candidate;
		}
	}
	return null;
}

function MarkdownCodeBlock({
	children,
	isDark,
	accent,
}: {
	children?: ReactNode;
	isDark: boolean;
	accent: string;
}) {
	const code = findCodeElement(children);
	const className = code?.props.className;
	const value = extractText(code?.props.children ?? children).replace(
		/\n$/,
		"",
	);
	const lang = languageFromClassName(className);

	if (lang === "plot") {
		return (
			<div className="not-prose markdown-plot-block">
				<Plot fn={value.trim()} accent={accent} isDark={isDark} />
			</div>
		);
	}

	if (!lang) {
		return (
			<CodeBlockFrame value={value}>
				<pre>
					<code>{value}</code>
				</pre>
			</CodeBlockFrame>
		);
	}

	return <AsyncCodeBlock lang={lang} value={value} className={className} />;
}

function AsyncCodeBlock({
	lang,
	value,
	className,
}: { lang: string; value: string; className?: string }) {
	const [html, setHtml] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		void loadTreeSitterHighlighter()
			.then(({ highlight }) => highlight(value, lang))
			.then((result) => {
				if (!cancelled && result) setHtml(result);
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, [value, lang]);

	const hljsHtml = highlightWithFallback(value, lang);

	return (
		<CodeBlockFrame language={lang} value={value}>
			<pre>
				<code
					className={className}
					// biome-ignore lint/security/noDangerouslySetInnerHtml: both highlighters escape source text and only add span markup
					dangerouslySetInnerHTML={{ __html: html || hljsHtml }}
				/>
			</pre>
		</CodeBlockFrame>
	);
}

function escapeHtml(value: string): string {
	return value.replace(/[&<>"']/g, (char) => {
		switch (char) {
			case "&":
				return "&amp;";
			case "<":
				return "&lt;";
			case ">":
				return "&gt;";
			case '"':
				return "&quot;";
			case "'":
				return "&#39;";
			default:
				return char;
		}
	});
}

function highlightWithFallback(value: string, lang: string): string {
	if (!hljs.getLanguage(lang)) return escapeHtml(value);
	try {
		return hljs.highlight(value, {
			language: lang,
			ignoreIllegals: true,
		}).value;
	} catch {
		return escapeHtml(value);
	}
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

/* ---- Stable plugin arrays (prevents ReactMarkdown re-processing) ---- */
const REMARK_PLUGINS = [remarkMath, remarkGfm, remarkCJKEmphasis];
const REHYPE_PLUGINS = [rehypeRaw, rehypeSlug, rehypeKatex];

export interface NoteLinkTarget {
	file: string;
	anchor: string | null;
	isWiki: boolean;
}

interface NoteLinkAdapter {
	resolveNoteHref?: (href: string) => NoteLinkTarget | null;
	onNoteOpen?: (target: NoteLinkTarget) => void;
}

/* ---- Components factory (avoids TS type conflict with custom Plot) ---- */
function makeComponents(
	dark: boolean,
	theme: { accent: string },
	noteLinks: NoteLinkAdapter,
) {
	return {
		a: ({ href, children }: { href?: string; children?: ReactNode }) => {
			if (!href) return <span>{children}</span>;
			if (href.startsWith("http")) {
				return (
					<a href={href} target="_blank" rel="noopener noreferrer">
						{children}
					</a>
				);
			}
			const noteTarget = noteLinks.resolveNoteHref?.(href) ?? null;
			if (noteTarget && noteLinks.onNoteOpen) {
				return (
					<a
						href={href}
						onClick={(e) => {
							e.preventDefault();
							noteLinks.onNoteOpen?.(noteTarget);
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
			return <a href={href}>{children}</a>;
		},
		blockquote: ({ children }: { children?: ReactNode }) => (
			<Callout isDark={dark}>{children}</Callout>
		),
		code: ({ className, children }: CodeElementProps) => (
			<InlineCode className={className}>{children}</InlineCode>
		),
		pre: ({ children }: { children?: ReactNode }) => (
			<MarkdownCodeBlock isDark={dark} accent={theme.accent}>
				{children}
			</MarkdownCodeBlock>
		),
	};
}

/* ---- Main renderer ---- */
interface ThemeColors {
	accent: string;
	text?: string;
	textSec?: string;
	borderLight?: string;
}

function markdownThemeVariables(
	theme: ThemeColors,
	dark: boolean,
): CSSProperties {
	const syntax = dark ? HLJS_THEMES.dark : HLJS_THEMES.light;
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
		"--syntax-shadow": syntax.shadow,
		"--syntax-label": syntax.langBar,
		"--syntax-comment": syntax.comment,
		"--syntax-keyword": syntax.keyword,
		"--syntax-string": syntax.string,
		"--syntax-number": syntax.number,
		"--syntax-function": syntax.function,
		"--syntax-class": syntax.class_,
		"--syntax-type": syntax.type,
		"--syntax-builtin": syntax.builtIn,
		"--syntax-variable": syntax.variable,
		"--syntax-template-variable": syntax.templateVar,
		"--syntax-attribute": syntax.attr,
		"--syntax-meta": syntax.meta,
		"--syntax-meta-keyword": syntax.metaKeyword,
		"--syntax-meta-string": syntax.metaString,
		"--syntax-punctuation": syntax.punctuation,
		"--syntax-bullet": syntax.bullet,
		"--syntax-deletion": syntax.deletion,
		"--syntax-addition": syntax.addition,
	} as CSSProperties;
}

export function MarkdownPreview({
	content,
	theme,
	isDark,
	resolveNoteHref,
	onNoteOpen,
}: {
	content: string;
	theme: ThemeColors;
	isDark?: boolean;
	resolveNoteHref?: (href: string) => NoteLinkTarget | null;
	onNoteOpen?: (target: NoteLinkTarget) => void;
}) {
	const dark = isDark ?? false;
	const components = useMemo(
		() => makeComponents(dark, theme, { resolveNoteHref, onNoteOpen }),
		[dark, theme, resolveNoteHref, onNoteOpen],
	);

	const markdownStyle = markdownThemeVariables(theme, dark);

	return (
		<article className="w-full">
			<div
				className={`markdown-prose w-full max-w-none prose prose-ocean${dark ? " dark" : ""}`}
				style={markdownStyle}
			>
				<ReactMarkdown
					remarkPlugins={REMARK_PLUGINS}
					rehypePlugins={REHYPE_PLUGINS}
					components={components}
				>
					{content}
				</ReactMarkdown>
			</div>
		</article>
	);
}
