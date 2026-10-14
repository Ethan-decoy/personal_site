declare module "virtual:notes-manifest" {
	const manifest: Array<{
		file: string;
		title: string;
		date: string;
		order?: number;
		sidebarAfter?: string;
		sidebarGroups?: Array<{
			title: string;
			directories: string[];
		}>;
	}>;
	export default manifest;
}

declare module "virtual:notes-search-index" {
	function loadSearchIndex(): Promise<
		Array<{
			file: string;
			body: string;
		}>
	>;
	export default loadSearchIndex;
}
