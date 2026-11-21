import type { ExtraProps } from "react-markdown";
import remarkCjkFriendly from "remark-cjk-friendly/parseOnly";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

export const noteRemarkPlugins = [remarkMath, remarkGfm, remarkCjkFriendly];

export interface NoteBody {
	content: string;
	codeHighlights: Readonly<Record<string, string>>;
}

type Element = NonNullable<ExtraProps["node"]>;
type Child = Element["children"][number];

function collectText(node: Child): string {
	if (node.type === "text") return node.value;
	if (node.type === "element") return node.children.map(collectText).join("");
	return "";
}

export function readMarkdownCodeBlock(pre?: Element) {
	const code = pre?.children.find(
		(child): child is Element =>
			child.type === "element" && child.tagName === "code",
	);
	const classes = code?.properties.className;
	const className = Array.isArray(classes) ? classes.join(" ") : classes;
	const language =
		typeof className === "string"
			? (/(?:^|\s)language-([^\s]+)/.exec(className)?.[1] ?? "")
			: "";
	const value = (code?.children ?? pre?.children ?? [])
		.map(collectText)
		.join("")
		.replace(/\n$/, "");
	return { language, value };
}

export function codeHighlightKey(language: string, value: string): string {
	// The same source can be rendered from several excerpts, with different block indexes.
	return language.toLowerCase() + "\0" + value;
}
