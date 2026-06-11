/* ==================== Tree-Sitter WASM Highlighter ==================== */
/* 用 web-tree-sitter + CDN 上的 WASM 语法文件做语法高亮。
 * 比 highlight.js 的正则分词准确得多（真正的语法分析树）。
 * 如果 WASM 加载失败或语言不支持，返回 null 让调用方 fallback。
 */

import { Parser, Language, Node } from "web-tree-sitter";

const WASM_BASE = "https://cdn.jsdelivr.net/npm/tree-sitter-wasms@0.1.13/out/";

const LANG_MAP: Record<string, string> = {
	cpp: "tree-sitter-cpp.wasm",
	c: "tree-sitter-c.wasm",
	typescript: "tree-sitter-typescript.wasm",
	tsx: "tree-sitter-tsx.wasm",
	javascript: "tree-sitter-javascript.wasm",
	ts: "tree-sitter-typescript.wasm",
	js: "tree-sitter-javascript.wasm",
	python: "tree-sitter-python.wasm",
	py: "tree-sitter-python.wasm",
	rust: "tree-sitter-rust.wasm",
	go: "tree-sitter-go.wasm",
	golang: "tree-sitter-go.wasm",
	java: "tree-sitter-java.wasm",
	kotlin: "tree-sitter-kotlin.wasm",
	swift: "tree-sitter-swift.wasm",
	bash: "tree-sitter-bash.wasm",
	sh: "tree-sitter-bash.wasm",
	shell: "tree-sitter-bash.wasm",
	css: "tree-sitter-css.wasm",
	html: "tree-sitter-html.wasm",
	xml: "tree-sitter-html.wasm",
	json: "tree-sitter-json.wasm",
	yaml: "tree-sitter-yaml.wasm",
	yml: "tree-sitter-yaml.wasm",
	toml: "tree-sitter-toml.wasm",
	ruby: "tree-sitter-ruby.wasm",
	lua: "tree-sitter-lua.wasm",
	dart: "tree-sitter-dart.wasm",
	elixir: "tree-sitter-elixir.wasm",
	elm: "tree-sitter-elm.wasm",
	ocaml: "tree-sitter-ocaml.wasm",
	php: "tree-sitter-php.wasm",
	scala: "tree-sitter-scala.wasm",
	solidity: "tree-sitter-solidity.wasm",
	zig: "tree-sitter-zig.wasm",
	csharp: "tree-sitter-c_sharp.wasm",
	"c#": "tree-sitter-c_sharp.wasm",
};

let parser: Parser | null = null;
let tsInitialized = false;
const langCache: Record<string, Language> = {};

async function ensureParser() {
	if (tsInitialized) return;
	await Parser.init();
	parser = new Parser();
	tsInitialized = true;
}

async function getLanguage(lang: string): Promise<Language | null> {
	if (langCache[lang]) return langCache[lang];
	const wasm = LANG_MAP[lang];
	if (!wasm) return null;
	const res = await fetch(WASM_BASE + wasm);
	if (!res.ok) return null;
	const buf = await res.arrayBuffer();
	const L = await Language.load(new Uint8Array(buf));
	langCache[lang] = L;
	return L;
}

/* ---- 节点类型 → 高亮类别 ---- */
function nodeCategory(node: Node): string | null {
	const t = node.type;

	switch (t) {
		/* 注释 */
		case "comment":
		case "line_comment":
		case "block_comment":
			return "comment";

		/* 字符串 */
		case "string_literal":
		case "raw_string_literal":
		case "char_literal":
		case "string":
		case "heredoc_body":
			return "string";

		/* 数字 */
		case "number_literal":
		case "number":
		case "integer_literal":
		case "float_literal":
		case "decimal_literal":
		case "hex_literal":
		case "octal_literal":
			return "number";

		/* 字面量 */
		case "true":
		case "false":
		case "nullptr":
		case "null":
		case "nil":
		case "none":
		case "boolean_literal":
			return "literal";

		/* 关键字 */
		case "keyword":
		case "type_keyword":
		case "storage_class_specifier":
			return "keyword";

		/* 类型 */
		case "type_identifier":
		case "sized_type_specifier":
		case "auto":
			return "type";

		/* 内置类型 */
		case "primitive_type":
		case "builtin_type":
		case "void_type":
			return "built_in";

		/* 预处理器 / meta */
		case "preproc_include":
		case "preproc_def":
		case "preproc_if":
		case "preproc_ifdef":
		case "preproc_directive":
		case "preprocessor":
			return "meta";

		/* 命名空间 */
		case "namespace_identifier":
			return "type";

		/* 运算符 */
		case "operator":
		case "pointer":
		case "reference":
			return "operator";
	}

	/* 标识符：根据父节点上下文决定 */
	if (t === "identifier" || t === "field_identifier") {
		return idCategory(node);
	}

	return null;
}

function idCategory(node: Node): string | null {
	const p = node.parent;
	if (!p) return null;
	const pt = p.type;

	/* 函数名场景 */
	if (
		pt === "call_expression" ||
		pt === "template_method" ||
		(pt === "field_expression" && node.type === "field_identifier") ||
		(pt === "function_declarator" &&
			!p.children.some((c) => c.type === "type_identifier"))
	) {
		return "function";
	}

	/* 类型名场景 */
	if (
		pt === "class_specifier" ||
		pt === "struct_specifier" ||
		pt === "enum_specifier" ||
		pt === "union_specifier" ||
		pt === "template_argument_list" ||
		pt === "base_class_clause" ||
		pt === "type_descriptor" ||
		pt === "type_parameter_declaration"
	) {
		return "type";
	}

	/* 变量/参数/字段 */
	return "variable";
}

/* ---- 生成高亮 HTML（与 highlight.js 共享 class 名） ---- */
const CAT_TO_CLASS: Record<string, string> = {
	comment: "hljs-comment",
	string: "hljs-string",
	number: "hljs-number",
	literal: "hljs-literal",
	keyword: "hljs-keyword",
	type: "hljs-type",
	built_in: "hljs-built_in",
	function: "hljs-function",
	variable: "hljs-variable",
	meta: "hljs-meta",
	operator: "hljs-operator",
};

function esc(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

/**
 * 用 tree-sitter 分析代码并返回高亮 HTML。
 * 如果语言不支持或 WASM 加载失败，返回 null。
 */
export async function highlight(
	code: string,
	lang: string,
): Promise<string | null> {
	await ensureParser();
	const language = await getLanguage(lang);
	if (!language || !parser) return null;

	parser.setLanguage(language);

	let tree: ReturnType<typeof parser.parse> = null;
	try {
		tree = parser.parse(code);
	} catch {
		return null;
	}
	if (!tree) return null;

	/* 遍历语法树，收集叶子节点的高亮区间 */
	const spans: Array<{ start: number; end: number; cat: string }> = [];

	function walk(node: Node) {
		if (node.childCount === 0) {
			const cat = nodeCategory(node);
			if (cat && CAT_TO_CLASS[cat]) {
				spans.push({ start: node.startIndex, end: node.endIndex, cat });
			}
		} else {
			for (let i = 0; i < node.childCount; i++) {
				const child = node.child(i);
				if (child) walk(child);
			}
		}
	}

	walk(tree.rootNode);

	/* 按字符位置排序 */
	spans.sort((a, b) => a.start - b.start);

	/* 构建 HTML */
	let html = "";
	let pos = 0;

	for (const span of spans) {
		/* 添加未高亮的文本 */
		if (span.start > pos) {
			html += esc(code.slice(pos, span.start));
		}
		/* 添加高亮文本 */
		const text = code.slice(span.start, span.end);
		const cls = CAT_TO_CLASS[span.cat];
		html += `<span class="${cls}">${esc(text)}</span>`;
		pos = span.end;
	}

	/* 尾部未覆盖的文本 */
	if (pos < code.length) {
		html += esc(code.slice(pos));
	}

	return html;
}

/* 预加载指定语言的 WASM（可在空闲时调用） */
export async function preloadLanguage(lang: string): Promise<void> {
	await getLanguage(lang);
}
