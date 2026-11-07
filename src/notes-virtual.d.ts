declare module "virtual:notes-manifest" {
	interface SidebarGroup {
		title: string;
		directories: string[];
		groups?: SidebarGroup[];
	}
	const manifest: Array<{
		file: string;
		title: string;
		date: string;
		order?: number;
		sidebarAfter?: string;
		sidebarGroups?: SidebarGroup[];
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
