import { createContext } from "react";

export interface CodeReferenceNote {
	file: string;
	title: string;
}

export interface CodeReferenceSource {
	value: string;
	language: string;
	label: string;
	file: string;
	noteTitle: string;
	blockIndex: number;
}

export interface CodeReferenceBounds {
	x: number;
	y: number;
	width: number;
	height: number;
}

// Share one context even when hot updates load different versions of the UI module.
export const CodeReferenceContext = createContext<{
	note: CodeReferenceNote | null;
	source: CodeReferenceSource | null;
	pin: (source: CodeReferenceSource) => void;
} | null>(null);
