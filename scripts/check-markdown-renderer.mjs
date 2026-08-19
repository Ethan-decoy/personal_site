import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const vite = await createServer({
	server: { middlewareMode: true },
	appType: "custom",
	logLevel: "silent",
});

try {
	const { MarkdownPreview } = await vite.ssrLoadModule(
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
				"const answer = 42;",
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
			name: "a fenced block produces exactly one pre element",
			pass: (html.match(/<pre\b/g) ?? []).length === 1,
		},
		{
			name: "pre never contains a block wrapper",
			pass: !/<pre[^>]*>\s*<(?:div|figure)\b/.test(html),
		},
		{
			name: "custom code blocks opt out of prose styling",
			pass: html.includes("markdown-code-block") && html.includes("not-prose"),
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
