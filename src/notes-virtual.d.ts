declare module "virtual:notes-manifest" {
	const manifest: Array<{
		file: string;
		title: string;
		date: string;
		order?: number;
		sidebarAfter?: string;
	}>;
	export default manifest;
}

declare module "virtual:notes-search-index" {
	const searchIndex: Array<{
		file: string;
		body: string;
	}>;
	export default searchIndex;
}
