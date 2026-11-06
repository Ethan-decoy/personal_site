import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const notesRoot = path.join(root, "src/notes");
const reportIndex = process.argv.indexOf("--report");
const reportPath = reportIndex >= 0 ? process.argv[reportIndex + 1] : null;
if (reportIndex >= 0 && !reportPath)
	throw new Error("--report requires a path");

async function publicMarkdownFiles(directory) {
	const files = [];
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const absolute = path.join(directory, entry.name);
		if (entry.isDirectory() && !entry.name.startsWith("_")) {
			files.push(...(await publicMarkdownFiles(absolute)));
		} else if (entry.isFile() && entry.name.endsWith(".md")) {
			files.push(
				`./${path.relative(notesRoot, absolute).replaceAll("\\", "/")}`,
			);
		}
	}
	return files.sort();
}

function decodeHtml(value) {
	const named = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">" };
	return value.replace(
		/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt);/gi,
		(_, entity) => {
			if (entity.startsWith("#")) {
				const hex = entity[1].toLowerCase() === "x";
				return String.fromCodePoint(
					Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10),
				);
			}
			return named[entity.toLowerCase()];
		},
	);
}

function decodeHref(href) {
	try {
		return decodeURIComponent(href);
	} catch {
		return href;
	}
}

const plainText = (html) => decodeHtml(html.replace(/<[^>]*>/g, "")).trim();
const vite = await createServer({
	root,
	server: { middlewareMode: true },
	appType: "custom",
	logLevel: "silent",
});

try {
	const { MarkdownPreview } = await vite.ssrLoadModule(
		"/src/notes-renderer.tsx",
	);
	const { loadNote, resolveNoteHref } = await vite.ssrLoadModule(
		"/src/notes/index.ts",
	);
	const rendered = new Map();
	async function readNote(file) {
		if (rendered.has(file)) return rendered.get(file);
		const note = await loadNote(file);
		if (!note) throw new Error(`Public note could not be loaded: ${file}`);
		const html = renderToStaticMarkup(
			React.createElement(MarkdownPreview, {
				content: note.content,
				theme: { accent: "#2F5D7C" },
			}),
		);
		const headings = Array.from(
			html.matchAll(/<h([1-6])\b[^>]*\sid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g),
			(match) => ({
				level: Number(match[1]),
				id: decodeHtml(match[2]),
				title: plainText(match[3]),
			}),
		);
		const ids = new Set(
			Array.from(html.matchAll(/\sid="([^"]+)"/g), (match) =>
				decodeHtml(match[1]),
			),
		);
		const lines = note.content.split("\n");
		const links = Array.from(
			html.matchAll(/<a\b[^>]*\shref="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g),
			(match) => {
				const href = decodeHtml(match[1]);
				const line = lines.findIndex((value) =>
					decodeHref(value).includes(`](${decodeHref(href)})`),
				);
				return {
					href,
					label: plainText(match[2]),
					bodyLine: line >= 0 ? line + 1 : null,
					context: line >= 0 ? lines[line] : null,
				};
			},
		).filter(
			({ href }) =>
				!(/^[a-z][a-z\d+.-]*:/i.test(href) || href.startsWith("//")) &&
				(href.startsWith("#") ||
					/\.md(?:#|$)/i.test(href) ||
					resolveNoteHref(href, file) !== null),
		);
		const result = { file, title: note.title, headings, ids, links };
		rendered.set(file, result);
		return result;
	}

	const errors = [];
	const report = [];
	const summary = {
		files: 0,
		crossArticleReferences: 0,
		anchoredReferences: 0,
		wholeArticleReferences: 0,
		directoryLinks: 0,
		localAnchors: 0,
	};
	for (const file of await publicMarkdownFiles(path.join(notesRoot, "cpp"))) {
		const source = await readNote(file);
		summary.files++;
		const links = [];
		for (const link of source.links) {
			const target = resolveNoteHref(link.href, source.file);
			if (!target) {
				errors.push(`${source.file}: unresolved note link ${link.href}`);
				continue;
			}
			const destination = await readNote(target.file);
			if (target.anchor && !destination.ids.has(target.anchor)) {
				errors.push(`${source.file}: missing anchor ${link.href}`);
			}
			if (source.file.endsWith("/_index.md")) summary.directoryLinks++;
			else if (target.file === source.file) summary.localAnchors++;
			else {
				summary.crossArticleReferences++;
				if (target.anchor) summary.anchoredReferences++;
				else summary.wholeArticleReferences++;
			}
			links.push({
				...link,
				targetFile: target.file,
				anchor: target.anchor,
				targetHeading:
					destination.headings.find(({ id }) => id === target.anchor)?.title ??
					null,
			});
		}
		report.push({
			file: source.file,
			title: source.title,
			headings: source.headings,
			links,
		});
	}
	if (reportPath) {
		await mkdir(path.dirname(path.resolve(reportPath)), { recursive: true });
		await writeFile(
			reportPath,
			`${JSON.stringify({ summary, errors, notes: report }, null, 2)}\n`,
		);
	}
	console.log(JSON.stringify(summary, null, 2));
	if (errors.length) throw new Error(errors.join("\n"));
	console.log(
		"PASS public C++ note links resolve and every fragment matches a rendered anchor",
	);
} finally {
	await vite.close();
}
