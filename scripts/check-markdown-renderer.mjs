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
			].join("\n"),
			theme: { name: "fixture", accent: "#1B3A5C" },
			isDark: false,
		}),
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
