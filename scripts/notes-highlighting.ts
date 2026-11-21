import rehypeRaw from "rehype-raw";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { bundledLanguages, codeToHtml } from "shiki";
import { unified } from "unified";
import {
	type NoteBody,
	codeHighlightKey,
	noteRemarkPlugins,
	readMarkdownCodeBlock,
} from "../src/note-markdown";

const processor = unified()
	.use(remarkParse)
	.use(noteRemarkPlugins)
	.use(remarkRehype, { allowDangerousHtml: true })
	.use(rehypeRaw)
	.freeze();

type MarkdownTree = Awaited<ReturnType<typeof processor.run>>;

export async function prepareNoteBody(raw: string): Promise<NoteBody> {
	const normalized = raw.replace(/\r\n/g, "\n");
	const frontmatter = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/.exec(
		normalized,
	);
	const content = (frontmatter?.[2] ?? normalized).trim();
	const tree = await processor.run(processor.parse(content));
	const blocks = new Map<
		string,
		{ lang: keyof typeof bundledLanguages; value: string }
	>();

	function collect(node: MarkdownTree | MarkdownTree["children"][number]) {
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
	collect(tree);

	const highlighted = await Promise.all(
		Array.from(blocks, async ([key, { lang, value }]) => [
			key,
			await codeToHtml(value, {
				lang,
				themes: { light: "light-plus", dark: "dark-plus" },
				defaultColor: false,
				transformers: [
					{
						root(root) {
							// Shiki supplies the tokens. The reader supplies the frame and controls.
							const pre = root.children[0];
							const code = pre?.type === "element" ? pre.children[0] : null;
							if (code?.type !== "element" || code.tagName !== "code")
								throw new Error("Shiki did not produce a code element");
							root.children = code.children;
						},
					},
				],
			}),
		]),
	);
	return { content, codeHighlights: Object.fromEntries(highlighted) };
}
