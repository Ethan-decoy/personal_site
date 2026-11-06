import { expandedKeysForFile } from "./index";

export function toggleExpandedKey(
	previous: ReadonlySet<string>,
	key: string,
): Set<string> {
	const next = new Set(previous);
	if (next.has(key)) next.delete(key);
	else next.add(key);
	return next;
}

export function revealFileInExpandedKeys(
	previous: ReadonlySet<string>,
	file: string,
): Set<string> {
	const next = new Set(previous);
	for (const key of expandedKeysForFile(file)) next.add(key);
	return next;
}
