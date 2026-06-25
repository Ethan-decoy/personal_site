import { useState, useEffect, useRef, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import hljs from "highlight.js/lib/core";
import { highlight as tsHighlight } from "./highlighter";
import ts from "highlight.js/lib/languages/typescript";
import bash from "highlight.js/lib/languages/bash";
import json from "highlight.js/lib/languages/json";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import yaml from "highlight.js/lib/languages/yaml";
import markdown from "highlight.js/lib/languages/markdown";
import python from "highlight.js/lib/languages/python";
import rust from "highlight.js/lib/languages/rust";
import cpp from "highlight.js/lib/languages/cpp";
import java from "highlight.js/lib/languages/java";
import sql from "highlight.js/lib/languages/sql";
import go from "highlight.js/lib/languages/go";
import ruby from "highlight.js/lib/languages/ruby";
import swift from "highlight.js/lib/languages/swift";
import kotlin from "highlight.js/lib/languages/kotlin";
import shell from "highlight.js/lib/languages/shell";
import { modules } from "./notes";

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
hljs.registerLanguage("cmake", hljs => ({
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
const HLJS_THEMES = {
	light: {
		bg: "#F5F0EB",
		text: "#2D2A24",
		comment: "#8C8378",
		keyword: "#8B5A7C",
		string: "#5B7A3A",
		number: "#B85A2E",
		function: "#3A6B8C",
		class_: "#8C6B3A",
		type: "#8C6B3A",
		builtIn: "#A03A5A",
		variable: "#2D2A24",
		templateVar: "#A03A5A",
		attr: "#B85A2E",
		meta: "#8C8378",
		metaKeyword: "#8B5A7C",
		metaString: "#5B7A3A",
		punctuation: "#6B6358",
		operator: "#6B6358",
		bullet: "#3A8C6B",
		link: "#3A6B8C",
		deletion: "#A03A5A",
		addition: "#5B7A3A",
		border: "rgba(45, 36, 24, 0.12)",
		langBar: "rgba(45, 36, 24, 0.35)",
	},
	dark: {
		bg: "#1E1E2E",
		text: "#CDD6F4",
		comment: "#585B70",
		keyword: "#CBA6F7",
		string: "#A6E3A1",
		number: "#FAB387",
		function: "#89B4FA",
		class_: "#F9E2AF",
		type: "#F9E2AF",
		builtIn: "#F38BA8",
		variable: "#CDD6F4",
		templateVar: "#F38BA8",
		attr: "#FAB387",
		meta: "#585B70",
		metaKeyword: "#CBA6F7",
		metaString: "#A6E3A1",
		punctuation: "#9399B2",
		operator: "#9399B2",
		bullet: "#89DCEB",
		link: "#89B4FA",
		deletion: "#F38BA8",
		addition: "#A6E3A1",
		border: "rgba(255,255,255,0.06)",
		langBar: "rgba(255,255,255,0.35)",
	},
};

export function useHljsTheme(isDark: boolean) {
	const t = isDark ? HLJS_THEMES.dark : HLJS_THEMES.light;
	useEffect(() => {
		const id = "hljs-theme-catppuccin";
		const old = document.getElementById(id);
		if (old) old.remove();
		const style = document.createElement("style");
		style.id = id;
		style.textContent = `
      .hljs-theme-catppuccin {
        color: ${t.text} !important;
        background: ${t.bg} !important;
        border: 1px solid ${t.border} !important;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08) !important;
        margin: 1rem 0 !important;
        overflow: hidden;
      }
      .hljs-theme-catppuccin pre {
        color: ${t.text} !important;
        background: transparent !important;
        font-family: 'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace !important;
        font-size: 0.875rem !important;
        line-height: 1.7 !important;
        tab-size: 2 !important;
      }
      .hljs-theme-catppuccin code { color: ${t.text} !important; background: transparent !important; }
      .hljs-theme-catppuccin .hljs-comment, .hljs-theme-catppuccin .hljs-quote { color: ${t.comment} !important; font-style: italic !important; }
      .hljs-theme-catppuccin .hljs-keyword, .hljs-theme-catppuccin .hljs-selector-tag { color: ${t.keyword} !important; }
      .hljs-theme-catppuccin .hljs-string, .hljs-theme-catppuccin .hljs-template-tag { color: ${t.string} !important; }
      .hljs-theme-catppuccin .hljs-number, .hljs-theme-catppuccin .hljs-literal { color: ${t.number} !important; }
      .hljs-theme-catppuccin .hljs-title.function_, .hljs-theme-catppuccin .hljs-title.function_.invoke { color: ${t.function} !important; }
      .hljs-theme-catppuccin .hljs-title.class_ { color: ${t.class_} !important; }
      .hljs-theme-catppuccin .hljs-type { color: ${t.type} !important; }
      .hljs-theme-catppuccin .hljs-built_in, .hljs-theme-catppuccin .hljs-builtin-name { color: ${t.builtIn} !important; }
      .hljs-theme-catppuccin .hljs-function { color: ${t.function} !important; }
      .hljs-theme-catppuccin .hljs-variable { color: ${t.variable} !important; }
      .hljs-theme-catppuccin .hljs-template-variable { color: ${t.templateVar} !important; }
      .hljs-theme-catppuccin .hljs-attr, .hljs-theme-catppuccin .hljs-attribute { color: ${t.attr} !important; }
      .hljs-theme-catppuccin .hljs-meta { color: ${t.meta} !important; }
      .hljs-theme-catppuccin .hljs-meta .hljs-string { color: ${t.metaString} !important; }
      .hljs-theme-catppuccin .hljs-meta .hljs-keyword { color: ${t.metaKeyword} !important; }
      .hljs-theme-catppuccin .hljs-operator, .hljs-theme-catppuccin .hljs-punctuation { color: ${t.punctuation} !important; }
      .hljs-theme-catppuccin .hljs-bullet, .hljs-theme-catppuccin .hljs-link { color: ${t.bullet} !important; }
      .hljs-theme-catppuccin .hljs-emphasis { font-style: italic !important; }
      .hljs-theme-catppuccin .hljs-strong { font-weight: 600 !important; }
      .hljs-theme-catppuccin .hljs-deletion { color: ${t.deletion} !important; }
      .hljs-theme-catppuccin .hljs-addition { color: ${t.addition} !important; }
    `;
		document.head.appendChild(style);
		return () => {
			style.remove();
		};
	}, [isDark]);
}

/* ---- remark plugin: CJK emphasis ---- */
function remarkCJKEmphasis() {
	return (tree: any) => {
		for (const node of tree.children ?? []) {
			processEmphasis(node);
		}
	};
}

function processEmphasis(node: any) {
	const children = node.children;
	if (!children || !Array.isArray(children) || children.length === 0) return;

	const newChildren: any[] = [];
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

/* ---- Markdown frontmatter strip ---- */
export function parseMarkdownBody(raw: string) {
	raw = raw.replace(/\r\n/g, "\n");
	const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
	return m ? m[2].trim() : raw.trim();
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

/* ---- Code block with async tree-sitter highlighting ---- */
function CodeBlock({
	className,
	children,
	isDark,
}: { className?: string; children?: ReactNode; isDark: boolean }) {
	const match = /language-(\w+)/.exec(className || "");
	const lang = match ? match[1] : "";

	if (!className) {
		return (
			<code
				style={{
					fontFamily: "'JetBrains Mono', monospace",
					fontSize: "0.875rem",
					padding: "0.15em 0.4em",
					backgroundColor: isDark
						? "rgba(255,255,255,0.08)"
						: "rgba(0,0,0,0.06)",
					borderRadius: "4px",
				}}
			>
				{children}
			</code>
		);
	}

	const value = typeof children === "string" ? children : "";

	if (!lang) {
		return (
			<div className="hljs-theme-catppuccin" style={{ borderRadius: "12px" }}>
				<pre style={{ margin: 0, padding: "1rem 1.25rem" }}>
					<code>{children}</code>
				</pre>
			</div>
		);
	}

	return (
		<AsyncCodeBlock
			lang={lang}
			value={value}
			className={className}
			isDark={isDark}
		/>
	);
}

function AsyncCodeBlock({
	lang,
	value,
	className,
	isDark,
}: { lang: string; value: string; className: string; isDark: boolean }) {
	const [html, setHtml] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		tsHighlight(value, lang)
			.then((result) => {
				if (!cancelled && result) setHtml(result);
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, [value, lang]);

	const hljsHtml = hljs.highlight(value, {
		language: lang,
		ignoreIllegals: true,
	}).value;
	const t = isDark ? HLJS_THEMES.dark : HLJS_THEMES.light;

	return (
		<div className="hljs-theme-catppuccin" style={{ borderRadius: "12px" }}>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					padding: "0.5rem 1.25rem",
					borderBottom: `1px solid ${t.border}`,
					fontSize: "0.7rem",
					fontFamily: "'JetBrains Mono', monospace",
					color: t.langBar,
					textTransform: "uppercase",
					letterSpacing: "0.05em",
				}}
			>
				<span>{lang}</span>
			</div>
			<pre className={className} style={{ margin: 0, padding: "1rem 1.25rem" }}>
				<span dangerouslySetInnerHTML={{ __html: html || hljsHtml }} />
			</pre>
		</div>
	);
}

/* ---- Function Plot component ---- */
function makePlotFn(expr: string): (x: number) => number {
	const fn = new Function(
		"x",
		"with(Math){return(" + expr.replace(/;/g, "") + ")}",
	) as (x: number) => number;
	return fn;
}

function parseRange(raw: string): [number, number] | null {
	const inner = raw.replace(/^\[?\s*/, "").replace(/\s*\]?$/, "");
	const parts = inner.split(",").map((s) => {
		s = s.trim();
		try {
			return Function("with(Math){return(" + s + ")}")();
		} catch {
			return NaN;
		}
	});
	return parts.length === 2 && parts.every((n) => !isNaN(n))
		? (parts as [number, number])
		: null;
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
		canvas.style.height = cssH + "px";
		canvas.width = cssW * dpr;
		canvas.height = cssH * dpr;
		ctx.scale(dpr, dpr);

		const fn = makePlotFn(fnExpr);
		const samples = Math.max(cssW * 2, 400);

		// sample y values to determine y range
		const pts: number[] = [];
		for (let i = 0; i <= samples; i++) {
			const x = xMin + ((xMax - xMin) * i) / samples;
			try {
				const y = fn(x);
				if (isFinite(y)) pts.push(y);
			} catch {}
		}
		if (pts.length === 0) return;
		let yMin = Math.min(...pts);
		let yMax = Math.max(...pts);
		const yPad = (yMax - yMin) * 0.12 || 1;
		yMin -= yPad;
		yMax += yPad;

		const pad = { top: 12, right: 16, bottom: 24, left: 42 };
		const pw = cssW - pad.left - pad.right;
		const ph = cssH - pad.top - pad.bottom;

		const toX = (v: number) => pad.left + ((v - xMin) / (xMax - xMin)) * pw;
		const toY = (v: number) => pad.top + (1 - (v - yMin) / (yMax - yMin)) * ph;

		// helpers
		function niceStep(range: number, targetTicks: number): number {
			const rough = range / targetTicks;
			const mag = Math.pow(10, Math.floor(Math.log10(rough)));
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
		for (let i = 0; i <= samples; i++) {
			const x = xMin + ((xMax - xMin) * i) / samples;
			try {
				const y = fn(x);
				if (!isFinite(y)) {
					drawing = false;
					prevY = null;
					continue;
				}
				const cy = toY(y);
				if (prevY !== null && Math.abs(cy - prevY) > ph * 2) {
					drawing = false;
				}
				if (!drawing) {
					ctx.moveTo(toX(x), cy);
					drawing = true;
				} else {
					ctx.lineTo(toX(x), cy);
				}
				prevY = cy;
			} catch {
				drawing = false;
				prevY = null;
			}
		}
		ctx.stroke();
	}, [fnExpr, xMin, xMax, strokeColor, isDark]);

	return (
		<div style={{ minHeight: 220, margin: "0.5em 0" }}>
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

/* ---- Cached components (same reference for same dark/theme combo) ---- */
const _compCache = new Map<string, any>();
function getComponents(dark: boolean, theme: { accent: string }) {
	const key = `${dark}:${theme.accent}`;
	if (!_compCache.has(key)) {
		_compCache.set(key, makeComponents(dark, theme));
	}
	return _compCache.get(key);
}

/* ---- Components factory (avoids TS type conflict with custom Plot) ---- */
function makeComponents(dark: boolean, theme: { accent: string }) {
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
			const [path, anchor] = href.replace(/^\.\/?/, "").split("#");
			const noteFile = `./${path.replace(/\.md$/, "")}.md`;
			if (modules[noteFile]) {
				const isWiki = noteFile === "./wiki.md";
				return (
					<a
						href="javascript:void(0)"
						onClick={(e) => {
							e.preventDefault();
							window.dispatchEvent(
								new CustomEvent("note:open", {
									detail: { file: noteFile, anchor: anchor || null },
								}),
							);
						}}
						className={`inline-flex items-center gap-0.5 ${isWiki ? "font-medium" : ""}`}
						style={isWiki ? { color: theme.accent } : undefined}
					>
						{children}
						{isWiki && (
							<svg
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
		blockquote: (props: any) => <Callout {...props} isDark={dark} />,
		code: (props: any) => {
			const cls = props.className || "";
			if (/^language-plot\b/.test(cls) && typeof props.children === "string") {
				return <Plot fn={props.children.trim()} isDark={dark} />;
			}
			return <CodeBlock {...props} isDark={dark} />;
		},
	};
}

/* ---- Main renderer ---- */
export interface ThemeColors {
	name: string;
	accent: string;
}

export function MarkdownPreview({
	content,
	theme,
	isDark,
}: { content: string; theme: ThemeColors; isDark?: boolean }) {
	const dark = isDark ?? false;
	useHljsTheme(dark);

	const proseThemeMap: Record<string, string> = {
		浅棕米白: "earth",
		深棕暗色: "earth",
		深蓝黑: "ocean",
		深海暗蓝: "ocean",
		浅青绿: "sage",
		暗青墨绿: "sage",
		黑: "black",
		极夜黑: "black",
	};
	const proseTheme = proseThemeMap[theme.name] || "earth";

	const termVars = {
		"--term-border": theme.accent + (dark ? "40" : "33"),
		"--term-bg": theme.accent + (dark ? "20" : "14"),
		"--term-text": theme.accent,
	} as React.CSSProperties;

	return (
		<div
			className={`w-full prose prose-${proseTheme}${dark ? " dark" : ""} prose-headings:tracking-tight prose-a:no-underline hover:prose-a:underline`}
			style={termVars}
		>
			<style>{`
        .prose-${proseTheme} { max-width: none !important; }
        .prose-${proseTheme} code::before,
        .prose-${proseTheme} code::after {
          content: '' !important;
        }
        .prose-${proseTheme} kbd {
          display: inline-block;
          font-family: inherit;
          font-weight: 500;
          font-size: 0.88em;
          letter-spacing: 0.02em;
          padding: 0.12em 0.45em;
          border-radius: 6px;
          border: 1px solid var(--term-border);
          background: var(--term-bg);
          color: var(--term-text);
          vertical-align: baseline;
          transition: background 0.2s ease-out;
        }
        /* KaTeX — only reset table-related styles (matrix rendering), preserve spacing */
        .prose-${proseTheme} .katex table,
        .prose-${proseTheme} .katex tbody,
        .prose-${proseTheme} .katex thead,
        .prose-${proseTheme} .katex tr,
        .prose-${proseTheme} .katex td,
        .prose-${proseTheme} .katex th {
          border: none !important;
          background: transparent !important;
        }
        .prose-${proseTheme} .katex-display {
          display: block !important;
          margin: 1em 0 !important;
        }
        .prose-${proseTheme} .katex table {
          display: table !important;
          border-collapse: collapse !important;
          border-spacing: 0 !important;
        }
      `}</style>
			<ReactMarkdown
				remarkPlugins={REMARK_PLUGINS}
				rehypePlugins={REHYPE_PLUGINS}
				components={getComponents(dark, theme)}
			>
				{content}
			</ReactMarkdown>
		</div>
	);
}
