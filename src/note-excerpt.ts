export interface NoteExcerptOptions {
	anchor: string | null;
	idPrefix: string;
}

interface MarkdownNode {
	type: string;
	value?: string;
	tagName?: string;
	properties?: Record<string, unknown>;
	children?: MarkdownNode[];
}

function headingLevel(node: MarkdownNode): number {
	return /^h[1-6]$/.test(node.tagName ?? "")
		? Number(node.tagName?.slice(1))
		: 0;
}

function textLength(node: MarkdownNode): number {
	return node.type === "text"
		? (node.value?.length ?? 0)
		: (node.children ?? []).reduce((sum, child) => sum + textLength(child), 0);
}

function findId(node: MarkdownNode, id: string): MarkdownNode | undefined {
	if (node.properties?.id === id) return node;
	for (const child of node.children ?? []) {
		const found = findId(child, id);
		if (found) return found;
	}
	return undefined;
}

function decodeAnchor(anchor: string): string {
	try {
		return decodeURIComponent(anchor.replace(/^#/, ""));
	} catch {
		return anchor.replace(/^#/, "");
	}
}

/** A soft size budget: keep complete blocks even when one code block is long. */
function introductoryBlocks(children: MarkdownNode[]): MarkdownNode[] {
	let blockCount = 0;
	let length = 0;
	let end = children.length;
	for (const [index, child] of children.entries()) {
		const isHeading = headingLevel(child) > 0;
		const isContent =
			child.type === "element" && !isHeading && child.tagName !== "hr";
		if (
			blockCount > 0 &&
			(blockCount >= 6 ||
				length >= 1800 ||
				(isHeading && (blockCount >= 3 || length >= 1000)))
		) {
			end = index;
			break;
		}
		if (isContent) blockCount++;
		length += textLength(child);
	}
	// Do not end on a heading whose body was excluded by the budget.
	while (
		end > 0 &&
		(headingLevel(children[end - 1]) > 0 ||
			(children[end - 1].type === "text" && !children[end - 1].value?.trim()))
	) {
		end--;
	}
	return children.slice(0, end || children.length);
}

const ID_REFERENCE_PROPERTIES = [
	"ariaActiveDescendant",
	"ariaControls",
	"ariaDescribedBy",
	"ariaDetails",
	"ariaErrorMessage",
	"ariaFlowTo",
	"ariaLabelledBy",
	"ariaOwns",
	"headers",
	"htmlFor",
];

function namespaceIds(tree: MarkdownNode, prefix: string): void {
	const ids = new Set<string>();
	function visit(node: MarkdownNode, apply: (node: MarkdownNode) => void) {
		apply(node);
		for (const child of node.children ?? []) visit(child, apply);
	}
	visit(tree, (node) => {
		const id = node.properties?.id;
		if (typeof id === "string") ids.add(id);
	});
	const mapId = (id: string) => (ids.has(id) ? `${prefix}${id}` : id);
	visit(tree, (node) => {
		const properties = node.properties;
		if (!properties) return;
		if (typeof properties.id === "string") {
			properties.id = mapId(properties.id);
		}
		for (const key of ["href", "xLinkHref"]) {
			const value = properties[key];
			if (typeof value === "string" && value.startsWith("#")) {
				const id = decodeAnchor(value);
				if (ids.has(id)) properties[key] = `#${mapId(id)}`;
			}
		}
		for (const key of ID_REFERENCE_PROPERTIES) {
			const value = properties[key];
			if (typeof value === "string") {
				properties[key] = value.split(/\s+/).map(mapId).join(" ");
			} else if (Array.isArray(value)) {
				properties[key] = value.map((id) =>
					typeof id === "string" ? mapId(id) : id,
				);
			}
		}
	});
}

/** Run after rehypeSlug so repeated headings keep their full-document anchors. */
export function rehypeNoteExcerpt(options: NoteExcerptOptions) {
	return (tree: MarkdownNode) => {
		const children = tree.children ?? [];
		const anchor = options.anchor ? decodeAnchor(options.anchor) : null;
		const start = anchor
			? children.findIndex((child) => findId(child, anchor))
			: -1;
		if (start >= 0 && anchor) {
			const target = findId(children[start], anchor);
			const level = target ? headingLevel(target) : 0;
			let end = start + 1;
			if (level) {
				while (end < children.length) {
					const nextLevel = headingLevel(children[end]);
					if (nextLevel && nextLevel <= level) break;
					end++;
				}
			}
			tree.children = children.slice(start, end);
		} else {
			tree.children = introductoryBlocks(children);
			if (anchor) {
				tree.children.unshift({
					type: "element",
					tagName: "p",
					properties: { className: ["note-excerpt-notice"] },
					children: [
						{
							type: "text",
							value: "未找到该小节，显示章节开头。",
						},
					],
				});
			}
		}
		namespaceIds(tree, options.idPrefix);
	};
}
