interface MarkdownNode {
	type: string;
	value?: string;
	tagName?: string;
	properties?: Record<string, unknown>;
	children?: MarkdownNode[];
}

const CALLOUTS = {
	NOTE: { label: "说明", icon: "M12 16v-4m0-4h.01", outline: "circle" },
	TIP: {
		label: "提示",
		icon: "M9 18h6m-5 3h4M8.1 14.5a6 6 0 1 1 7.8 0c-.7.6-.9 1.2-.9 2.5H9c0-1.3-.2-1.9-.9-2.5Z",
	},
	PRACTICE: {
		label: "工程实践",
		icon: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94L14.7 6.3Z",
	},
	IMPORTANT: {
		label: "核心",
		icon: "M12 2.5 20.25 7.25v9.5L12 21.5l-8.25-4.75v-9.5L12 2.5Zm0 5L16 10v4l-4 2.5L8 14v-4l4-2.5Z",
	},
	WARNING: {
		label: "易错",
		icon: "m12 3 10 18H2L12 3Zm0 6v4m0 4h.01",
	},
	CAUTION: {
		label: "注意",
		icon: "m8 3-5 5v8l5 5h8l5-5V8l-5-5H8Zm4 4v6m0 4h.01",
	},
} satisfies Record<string, { label: string; icon: string; outline?: string }>;

type CalloutType = keyof typeof CALLOUTS;

function element(
	tagName: string,
	properties: Record<string, unknown>,
	children: MarkdownNode[] = [],
): MarkdownNode {
	return { type: "element", tagName, properties, children };
}

function isWhitespace(node: MarkdownNode): boolean {
	return node.type === "text" && !node.value?.trim();
}

/** Split the title line without discarding inline formatting or body nodes. */
function splitFirstLine(nodes: MarkdownNode[]): {
	line: MarkdownNode[];
	rest: MarkdownNode[];
	hasBreak: boolean;
} {
	const line: MarkdownNode[] = [];
	for (const [index, node] of nodes.entries()) {
		if (node.type === "text") {
			const match = /\r?\n/.exec(node.value ?? "");
			if (match) {
				const before = node.value?.slice(0, match.index) ?? "";
				const after = node.value?.slice(match.index + match[0].length) ?? "";
				if (before) line.push({ ...node, value: before });
				return {
					line,
					rest: [
						...(after ? [{ ...node, value: after }] : []),
						...nodes.slice(index + 1),
					],
					hasBreak: true,
				};
			}
		}
		if (node.type === "element" && node.tagName === "br") {
			return { line, rest: nodes.slice(index + 1), hasBreak: true };
		}
		if (node.children?.length) {
			const split = splitFirstLine(node.children);
			if (split.hasBreak) {
				if (split.line.length) line.push({ ...node, children: split.line });
				return {
					line,
					rest: [
						...(split.rest.length ? [{ ...node, children: split.rest }] : []),
						...nodes.slice(index + 1),
					],
					hasBreak: true,
				};
			}
		}
		line.push(node);
	}
	return { line, rest: [], hasBreak: false };
}

function textContent(nodes: MarkdownNode[]): string {
	return nodes
		.map((node) =>
			node.type === "text"
				? (node.value ?? "")
				: textContent(node.children ?? []),
		)
		.join("");
}

function calloutIcon(type: CalloutType): MarkdownNode {
	const callout = CALLOUTS[type];
	return element(
		"svg",
		{
			className: ["markdown-callout-icon"],
			ariaHidden: "true",
			focusable: "false",
			viewBox: "0 0 24 24",
			fill: "none",
			stroke: "currentColor",
			strokeWidth: 1.7,
			strokeLinecap: "round",
			strokeLinejoin: "round",
		},
		[
			...("outline" in callout
				? [element("circle", { cx: 12, cy: 12, r: 9 })]
				: []),
			element("path", { d: callout.icon }),
		],
	);
}

function transformBlockquote(node: MarkdownNode): void {
	const children = node.children ?? [];
	const firstIndex = children.findIndex((child) => !isWhitespace(child));
	const paragraph = children[firstIndex];
	const firstText = paragraph?.children?.[0];
	if (
		paragraph?.tagName !== "p" ||
		firstText?.type !== "text" ||
		!firstText.value
	) {
		return;
	}

	const marker =
		/^\[!(NOTE|TIP|PRACTICE|IMPORTANT|WARNING|CAUTION)\](?:[\t ]+|(?=\r?\n|$))/.exec(
			firstText.value,
		);
	if (!marker) return;

	const type = marker[1] as CalloutType;
	const { label } = CALLOUTS[type];
	const { line, rest } = splitFirstLine([
		{ ...firstText, value: firstText.value.slice(marker[0].length) },
		...(paragraph.children?.slice(1) ?? []),
	]);
	const titleText = textContent(line).trim();
	const body = [
		...(rest.some((child) => !isWhitespace(child))
			? [{ ...paragraph, children: rest }]
			: []),
		...children.slice(firstIndex + 1),
	];

	node.tagName = "aside";
	node.properties = {
		...node.properties,
		className: [
			"markdown-callout",
			...(!titleText ? ["markdown-callout-compact"] : []),
		],
		dataCallout: type.toLowerCase(),
		ariaLabel: titleText ? `${label}：${titleText}` : label,
	};
	node.children = [
		...(titleText
			? [
					element("div", { className: ["markdown-callout-title"] }, [
						calloutIcon(type),
						element("span", {}, line),
					]),
				]
			: [calloutIcon(type)]),
		element("div", { className: ["markdown-callout-body"] }, body),
	];
}

/** GitHub alert markers plus PRACTICE, with an optional inline Markdown title. */
export function rehypeMarkdownCallouts() {
	return (tree: MarkdownNode) => {
		function visit(node: MarkdownNode): void {
			for (const child of node.children ?? []) visit(child);
			if (node.type === "element" && node.tagName === "blockquote") {
				transformBlockquote(node);
			}
		}
		visit(tree);
	};
}
