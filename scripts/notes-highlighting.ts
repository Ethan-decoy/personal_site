import { renderToString } from "katex";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import remarkCjkFriendly from "remark-cjk-friendly/parseOnly";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { bundledLanguages, codeToHtml, getSingletonHighlighter } from "shiki";
import { unified } from "unified";
import { rehypeMarkdownBlockquotes } from "../src/markdown-blockquotes";
import {
	type NoteBody,
	type NoteDocument,
	codeHighlightKey,
	readMarkdownCodeBlock,
} from "../src/note-markdown";

const processor = unified()
	.use(remarkParse)
	.use(remarkMath)
	.use(remarkGfm)
	.use(remarkCjkFriendly)
	.use(remarkRehype, { allowDangerousHtml: true })
	.use(rehypeRaw)
	.use(rehypeMarkdownBlockquotes)
	.use(rehypeSlug)
	.freeze();

const renderRemainingMath = unified().use(rehypeKatex).freeze();
const highlightThemes = { light: "light-plus", dark: "dark-plus" } as const;
type DocumentChild = NoteDocument["children"][number];
type DocumentElement = Extract<DocumentChild, { type: "element" }>;

export function warmNoteHighlighting() {
	return getSingletonHighlighter({
		themes: Object.values(highlightThemes),
		langs: [],
	});
}

function prepareFormula(node: DocumentElement): boolean {
	const fenced = node.tagName === "pre";
	const code = fenced ? node.children[0] : node;
	if (code?.type !== "element" || code.tagName !== "code") return false;
	const classes = code.properties.className;
	const text = code.children[0];
	if (
		!Array.isArray(classes) ||
		code.children.length !== 1 ||
		text?.type !== "text"
	) {
		return false;
	}
	const languageMath = classes.includes("language-math");
	const displayMath = classes.includes("math-display");
	if (
		fenced
			? !languageMath
			: !languageMath && !displayMath && !classes.includes("math-inline")
	) {
		return false;
	}

	const displayMode = fenced || displayMath;
	const className = displayMode ? "katex-display" : "katex";
	const opening = `<span class="${className}">`;
	const closing = "</span>";
	try {
		const html = renderToString(text.value, { displayMode, trust: false });
		if (!html.startsWith(opening) || !html.endsWith(closing)) return false;
		node.tagName = "span";
		node.properties = { className: [className] };
		node.data = Object.assign({}, node.data, {
			noteMathHtml: html.slice(opening.length, -closing.length),
		});
		// Keep the source text available to the excerpt's character budget.
		node.children = [{ type: "text", value: text.value }];
		return true;
	} catch {
		// Delegate malformed formulas to rehype-katex.
		return false;
	}
}

export function prepareNoteDocument(content: string): NoteDocument {
	const tree = processor.runSync(processor.parse(content));
	function prepare(node: NoteDocument | DocumentChild) {
		delete node.position;
		if (node.type === "element" && prepareFormula(node)) return;
		if ("children" in node) for (const child of node.children) prepare(child);
	}
	prepare(tree);
	renderRemainingMath.runSync(tree);
	return tree;
}

export async function prepareNoteBody(raw: string): Promise<NoteBody> {
	const normalized = raw.replace(/\r\n/g, "\n");
	const frontmatter = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/.exec(
		normalized,
	);
	const content = (frontmatter?.[2] ?? normalized).trim();
	const documentTree = prepareNoteDocument(content);
	const blocks = new Map<
		string,
		{ lang: keyof typeof bundledLanguages; value: string }
	>();

	function collect(node: NoteDocument | DocumentChild) {
		if (node.type === "element" && node.tagName === "pre") {
			const { language, value } = readMarkdownCodeBlock(node);
			const lang = language.toLowerCase();
			if (Object.hasOwn(bundledLanguages, lang)) {
				blocks.set(codeHighlightKey(lang, value), {
					lang: lang as keyof typeof bundledLanguages,
					value,
				});
			}
			return;
		}
		if ("children" in node) for (const child of node.children) collect(child);
	}
	collect(documentTree);

	const highlighted = await Promise.all(
		Array.from(blocks, async ([key, { lang, value }]) => [
			key,
			await codeToHtml(value, {
				lang,
				themes: highlightThemes,
				defaultColor: false,
				transformers: [
					{
						root(root) {
							// Shiki supplies the tokens. The reader supplies the frame and controls.
							const pre = root.children[0];
							const code = pre?.type === "element" ? pre.children[0] : null;
							if (code?.type !== "element" || code.tagName !== "code") {
								throw new Error("Shiki did not produce a code element");
							}
							root.children = code.children;
						},
					},
				],
			}),
		]),
	);
	return {
		content,
		documentTree,
		codeHighlights: Object.fromEntries(highlighted),
	};
}
