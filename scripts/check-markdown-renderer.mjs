import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const vite = await createServer({
	server: { middlewareMode: true },
	appType: "custom",
	logLevel: "silent",
});

try {
	const { HLJS_THEMES, MarkdownPreview } = await vite.ssrLoadModule(
		"/src/notes-renderer.tsx",
	);
	const title = "Markdown renderer fixture";
	const cjkStrongMarkdown =
		"**在这里的 `int` 对象初始化中，新对象取得源对象当时的值，随后彼此独立；赋值只改变已经存在的对象。**这种数值初始化不会在两个对象之间建立自动同步关系。";
	const cjkStrongHtml =
		'<strong>在这里的 <code class="markdown-inline-code">int</code> 对象初始化中，新对象取得源对象当时的值，随后彼此独立；赋值只改变已经存在的对象。</strong>这种数值初始化不会在两个对象之间建立自动同步关系。';
	const html = renderToStaticMarkup(
		React.createElement(MarkdownPreview, {
			content: [
				`# ${title}`,
				"",
				"Paragraph with `inline code`.",
				"",
				"```js",
				"// Comments must remain readable and visually distinct.",
				"const answer = 42;",
				"```",
				"",
				"```",
				"plain text",
				"```",
				"",
				"| Item | Value |",
				"| --- | --- |",
				"| answer | 42 |",
				"",
				"$$",
				"x^2 + y^2",
				"$$",
				"",
				"```plot",
				"sin(x)",
				"```",
				"",
				cjkStrongMarkdown,
			].join("\n"),
			theme: { name: "fixture", accent: "#1B3A5C" },
			isDark: false,
		}),
	);

	const renderMarkdown = (content) =>
		renderToStaticMarkup(
			React.createElement(MarkdownPreview, {
				content,
				theme: { name: "fixture", accent: "#1B3A5C" },
				isDark: false,
			}),
		);
	const calloutHtml = [
		["NOTE", "说明"],
		["TIP", "提示"],
		["PRACTICE", "工程实践"],
		["IMPORTANT", "核心"],
		["WARNING", "易错"],
		["CAUTION", "注意"],
	].map(([type, label]) => ({
		type,
		label,
		html: renderMarkdown(`> [!${type}]\n> ${type} 的首行正文。`),
	}));
	const richCalloutHtml = renderMarkdown(
		[
			"> [!IMPORTANT] 记住 **表达式类别** 与 `std::move`",
			"> 首行正文包含 **粗体** 和 `value`。",
			">",
			"> 第二段包含 [标准参考](https://example.com/reference) 与 $x^2$。",
			">",
			"> - 保留列表第一项",
			">   - 保留嵌套列表",
			">",
			"> ```cpp",
			"> auto moved = std::move(value);",
			"> ```",
			">",
			"> $$",
			"> x^2 + y^2",
			"> $$",
			">",
			"> > 普通嵌套引用。",
		].join("\n"),
	);
	const ordinaryQuoteHtml = renderMarkdown(
		[
			"> 普通引用保留 **强调**。",
			"",
			"> [!UNKNOWN] 未知标记",
			"> 未知类型的正文。",
			"",
			"> 前文不是提示标记。",
			"> [!TIP] 出现在后面的标记。",
			"",
			"> `[!WARNING]` 行内代码中的标记。",
			"",
			"> ```",
			"> [!CAUTION]",
			"> 代码中的标记。",
			"> ```",
		].join("\n"),
	);

	const checks = [
		{
			name: "the Markdown module does not synthesize a metadata header",
			pass: !html.includes("<header") && !html.includes("<time"),
		},
		{
			name: "the canonical document title is rendered exactly once",
			pass: html.split(title).length - 1 === 1,
		},
		{
			name: "the canonical title keeps its document anchor",
			pass: /<h1[^>]*id="markdown-renderer-fixture"/.test(html),
		},
		{
			name: "the prose root exposes the stable markdown-prose hook",
			pass: html.includes("markdown-prose"),
		},
		{
			name: "inline code has its own styling hook",
			pass: html.includes("markdown-inline-code"),
		},
		{
			name: "CJK strong emphasis supports nested inline code at a punctuation boundary",
			pass: html.includes(cjkStrongHtml),
		},
		{
			name: "each rendered fenced block produces exactly one pre element",
			pass: (html.match(/<pre\b/g) ?? []).length === 2,
		},
		{
			name: "pre never contains a block wrapper",
			pass: !/<pre[^>]*>\s*<(?:div|figure)\b/.test(html),
		},
		{
			name: "language and plain fenced blocks expose copy controls",
			pass:
				(html.match(/class="markdown-code-copy"/g) ?? []).length === 2 &&
				(html.match(/<pre\b[^>]*>[\s\S]*?<\/pre>/g) ?? []).every(
					(block) => !block.includes("markdown-code-copy"),
				),
		},
		{
			name: "custom code blocks opt out of prose styling",
			pass: html.includes("markdown-code-block") && html.includes("not-prose"),
		},
		{
			name: "fenced code comments retain their syntax hook",
			pass: html.includes("hljs-comment"),
		},
		{
			name: "code comments stay readable and chromatically distinct",
			pass: Object.values(HLJS_THEMES).every(
				({ bg, comment }) =>
					contrastRatio(bg, comment) >= 7 && oklabChroma(comment) >= 0.08,
			),
		},
		{
			name: "wide technical Markdown structures remain distinct",
			pass:
				html.includes("<table>") &&
				html.includes("katex-display") &&
				html.includes("markdown-plot-block"),
		},
		{
			name: "renderer does not inject component-local style tags",
			pass: !html.includes("<style>"),
		},
		{
			name: "supported callouts keep accessible type names without visible default titles",
			pass: calloutHtml.every(
				({ type, label, html: rendered }) =>
					/<aside\b[^>]*class="[^"]*\bmarkdown-callout\b/.test(rendered) &&
					rendered.includes(`data-callout="${type.toLowerCase()}"`) &&
					rendered.includes(`aria-label="${label}"`) &&
					rendered.includes("markdown-callout-compact") &&
					!rendered.includes("markdown-callout-title") &&
					!rendered.includes(`[!${type}]`),
			),
		},
		{
			name: "a marker and body in the same Markdown paragraph keep the complete first body line",
			pass: calloutHtml.every(({ type, html: rendered }) =>
				new RegExp(
					`class="markdown-callout-body"[^>]*>\\s*<p>${type} 的首行正文。<\\/p>`,
				).test(rendered),
			),
		},
		{
			name: "custom callout titles retain inline Markdown and do not consume body text",
			pass:
				/class="markdown-callout-title"[^>]*>[\s\S]*?记住 <strong>表达式类别<\/strong> 与 <code class="markdown-inline-code">std::move<\/code>[\s\S]*?<\/div>/.test(
					richCalloutHtml,
				) &&
				/class="markdown-callout-body"[^>]*>\s*<p>首行正文包含 <strong>粗体<\/strong> 和 <code class="markdown-inline-code">value<\/code>。<\/p>/.test(
					richCalloutHtml,
				) &&
				!richCalloutHtml.includes("[!IMPORTANT]"),
		},
		{
			name: "callout bodies retain separate paragraphs, links, nested lists, and ordinary nested quotes",
			pass:
				richCalloutHtml.includes(
					'<p>第二段包含 <a href="https://example.com/reference"',
				) &&
				richCalloutHtml.includes("保留列表第一项") &&
				richCalloutHtml.includes("保留嵌套列表") &&
				(richCalloutHtml.match(/<ul\b/g) ?? []).length === 2 &&
				/<blockquote>\s*<p>普通嵌套引用。<\/p>\s*<\/blockquote>/.test(
					richCalloutHtml,
				) &&
				(richCalloutHtml.match(/<aside\b/g) ?? []).length === 1,
		},
		{
			name: "fenced code inside callouts retains highlighting and its copy control outside pre",
			pass:
				(richCalloutHtml.match(/<pre\b/g) ?? []).length === 1 &&
				(richCalloutHtml.match(/class="markdown-code-copy"/g) ?? []).length ===
					1 &&
				richCalloutHtml.includes("hljs-keyword") &&
				!/<pre[^>]*>[\s\S]*?markdown-code-copy[\s\S]*?<\/pre>/.test(
					richCalloutHtml,
				),
		},
		{
			name: "inline and display math inside callouts retain their rendered formula structure",
			pass:
				(richCalloutHtml.match(/class="katex"/g) ?? []).length === 2 &&
				richCalloutHtml.includes('class="katex-display"'),
		},
		{
			name: "ordinary quotes, unknown markers, and markers outside the opening text remain ordinary Markdown",
			pass:
				!ordinaryQuoteHtml.includes("markdown-callout") &&
				(ordinaryQuoteHtml.match(/<blockquote>/g) ?? []).length === 5 &&
				ordinaryQuoteHtml.includes("普通引用保留 <strong>强调</strong>。") &&
				ordinaryQuoteHtml.includes("[!UNKNOWN] 未知标记") &&
				ordinaryQuoteHtml.includes("未知类型的正文。") &&
				ordinaryQuoteHtml.includes("[!TIP] 出现在后面的标记。") &&
				ordinaryQuoteHtml.includes(
					'<code class="markdown-inline-code">[!WARNING]</code>',
				) &&
				/<pre\b[^>]*>[\s\S]*?\[!CAUTION\][\s\S]*?<\/pre>/.test(
					ordinaryQuoteHtml,
				),
		},
		{
			name: "static callouts use readable labels and hide decorative icons without live alert semantics",
			pass: [
				...calloutHtml.map((fixture) => fixture.html),
				richCalloutHtml,
			].every(
				(rendered) =>
					!rendered.includes('role="alert"') &&
					!rendered.includes("aria-live=") &&
					/<svg\b[^>]*aria-hidden="true"[^>]*>/.test(rendered) &&
					/<svg\b[^>]*focusable="false"[^>]*>/.test(rendered),
			),
		},
		{
			name: "callouts do not introduce invalid paragraph or pre nesting",
			pass: [
				...calloutHtml.map((fixture) => fixture.html),
				richCalloutHtml,
			].every(
				(rendered) =>
					!/<p\b[^>]*>(?:(?!<\/p>)[\s\S])*?<(?:aside|div|p|ul|ol|pre|blockquote)\b/.test(
						rendered,
					) && !/<pre[^>]*>\s*<(?:div|figure)\b/.test(rendered),
			),
		},
	];

	for (const check of checks) {
		console.log(`${check.pass ? "PASS" : "FAIL"} ${check.name}`);
	}

	if (checks.some((check) => !check.pass)) process.exitCode = 1;
} finally {
	await vite.close();
}

function contrastRatio(first, second) {
	const [lighter, darker] = [
		relativeLuminance(first),
		relativeLuminance(second),
	].sort((left, right) => right - left);
	return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(hex) {
	const [red, green, blue] = linearRgb(hex);
	return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function oklabChroma(hex) {
	const [red, green, blue] = linearRgb(hex);
	const l = 0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue;
	const m = 0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue;
	const s = 0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue;
	const a =
		1.9779984951 * Math.cbrt(l) -
		2.428592205 * Math.cbrt(m) +
		0.4505937099 * Math.cbrt(s);
	const b =
		0.0259040371 * Math.cbrt(l) +
		0.7827717662 * Math.cbrt(m) -
		0.808675766 * Math.cbrt(s);
	return Math.hypot(a, b);
}

function linearRgb(hex) {
	return [1, 3, 5].map((offset) => {
		const channel = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
		return channel <= 0.04045
			? channel / 12.92
			: ((channel + 0.055) / 1.055) ** 2.4;
	});
}
