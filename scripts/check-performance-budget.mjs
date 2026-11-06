import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const root = new URL("../", import.meta.url);
const distRoot = new URL("dist/", root);
const distRootPath = fileURLToPath(distRoot);
const html = fs.readFileSync(new URL("index.html", distRoot), "utf8");
const entryUrl = html.match(/<script[^>]+src="([^"]+)"/)?.[1];

if (!entryUrl)
	throw new Error("Production HTML does not expose an entry script");

function relativeAssetUrl(assetUrl) {
	return assetUrl.replace(/^\/personal_site\//, "").replace(/^\//, "");
}

function gzipKiB(file) {
	return gzipSync(fs.readFileSync(file)).length / 1024;
}

function walk(directory) {
	return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const file = path.join(directory, entry.name);
		return entry.isDirectory() ? walk(file) : [file];
	});
}

const entryFile = new URL(relativeAssetUrl(entryUrl), distRoot);
const jsFiles = walk(distRootPath)
	.filter((file) => file.endsWith(".js"))
	.map((file) => ({
		file,
		name: path.relative(distRootPath, file).split(path.sep).join("/"),
		gzipKiB: gzipKiB(file),
	}))
	.sort((left, right) => right.gzipKiB - left.gzipKiB);
const entryGzipKiB = gzipKiB(entryFile);
const largestChunk = jsFiles[0];
const notesRootPath = fileURLToPath(new URL("src/notes/", root));
const privateNotePaths = walk(notesRootPath)
	.map((file) => path.relative(notesRootPath, file).split(path.sep).join("/"))
	.filter((notePath) =>
		notePath
			.split("/")
			.slice(0, -1)
			.some((segment) => segment.startsWith("_")),
	);
const builtJavascript = jsFiles.map(({ file }) =>
	fs.readFileSync(file, "utf8"),
);
const privateDraftLeak = privateNotePaths.find((notePath) =>
	builtJavascript.some((source) => source.includes(notePath)),
);

const measurements = {
	entry: {
		file: relativeAssetUrl(entryUrl),
		gzipKiB: Number(entryGzipKiB.toFixed(2)),
	},
	largestChunk: largestChunk
		? {
				file: largestChunk.name,
				gzipKiB: Number(largestChunk.gzipKiB.toFixed(2)),
			}
		: null,
	jsChunkCount: jsFiles.length,
	largestJsChunks: jsFiles.slice(0, 12).map((chunk) => ({
		file: chunk.name,
		gzipKiB: Number(chunk.gzipKiB.toFixed(2)),
	})),
};

console.log(JSON.stringify(measurements, null, 2));

const checks = [
	["the initial entry stays within 100 KiB gzip", entryGzipKiB <= 100],
	[
		"no JavaScript chunk exceeds 350 KiB gzip",
		(largestChunk?.gzipKiB ?? 0) <= 350,
	],
	["private underscore directories stay out of JavaScript", !privateDraftLeak],
];

let failed = false;
for (const [label, passed] of checks) {
	console.log(`${passed ? "PASS" : "FAIL"} ${label}`);
	failed ||= !passed;
}

if (failed) process.exit(1);
