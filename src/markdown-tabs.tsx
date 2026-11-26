import {
	Children,
	type KeyboardEvent,
	type ReactNode,
	createContext,
	isValidElement,
	useContext,
	useId,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";

type TabSelection = {
	selected: ReadonlyMap<string, string>;
	select: (group: string, label: string, anchor?: HTMLElement | null) => void;
};

const TabContext = createContext<TabSelection | null>(null);

export function MarkdownTabsProvider({ children }: { children: ReactNode }) {
	const [selected, setSelected] = useState<ReadonlyMap<string, string>>(
		() => new Map(),
	);
	const anchor = useRef<{ element: HTMLElement; top: number } | null>(null);
	const selection = useMemo<TabSelection>(
		() => ({
			selected,
			select(group, label, element) {
				if (selected.get(group) === label) return;
				anchor.current = element
					? { element, top: element.getBoundingClientRect().top }
					: null;
				setSelected((previous) => new Map(previous).set(group, label));
			},
		}),
		[selected],
	);

	useLayoutEffect(() => {
		const previous = anchor.current;
		anchor.current = null;
		if (!previous?.element.isConnected) return;
		const delta = previous.element.getBoundingClientRect().top - previous.top;
		if (!delta) return;
		const scrollRoot = previous.element.closest<HTMLElement>(
			"[data-note-preview-scroll]",
		);
		if (scrollRoot) scrollRoot.scrollTop += delta;
		else window.scrollBy({ top: delta, behavior: "instant" });
	}, [selected]);

	return (
		<TabContext.Provider value={selection}>{children}</TabContext.Provider>
	);
}

function tabPanels(children: ReactNode) {
	const panels: { label: string; content: ReactNode }[] = [];
	for (const child of Children.toArray(children)) {
		if (typeof child === "string" && !child.trim()) continue;
		if (
			!isValidElement<{
				"data-note-tab"?: unknown;
				children?: ReactNode;
			}>(child)
		)
			return [];
		const value = child.props["data-note-tab"];
		const label = typeof value === "string" ? value.trim() : "";
		if (!label || panels.some((panel) => panel.label === label)) return [];
		panels.push({ label, content: child.props.children });
	}
	return panels;
}

export function MarkdownTabs({
	label,
	defaultTab,
	syncGroup,
	children,
}: {
	label: string;
	defaultTab?: string;
	syncGroup?: string;
	children: ReactNode;
}) {
	const selection = useContext(TabContext);
	const panels = useMemo(() => tabPanels(children), [children]);
	const tabList = useRef<HTMLDivElement>(null);
	const id = useId();

	if (!selection || panels.length < 2) return <div>{children}</div>;
	const group = syncGroup ? `sync:${syncGroup}` : `local:${id}`;
	const selectedLabel = selection.selected.get(group);
	const active =
		panels.find((panel) => panel.label === selectedLabel)?.label ??
		panels.find((panel) => panel.label === defaultTab)?.label ??
		panels[0].label;

	const handleKeyDown = (
		event: KeyboardEvent<HTMLButtonElement>,
		index: number,
	) => {
		let next: number;
		switch (event.key) {
			case "ArrowLeft":
				next = (index + panels.length - 1) % panels.length;
				break;
			case "ArrowRight":
				next = (index + 1) % panels.length;
				break;
			case "Home":
				next = 0;
				break;
			case "End":
				next = panels.length - 1;
				break;
			default:
				return;
		}
		event.preventDefault();
		const list = tabList.current;
		const button =
			list?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next];
		button?.focus({ preventScroll: true });
		button?.scrollIntoView({
			block: "nearest",
			inline: "nearest",
			behavior: "instant",
		});
		selection.select(group, panels[next].label, list);
	};

	return (
		<div className="markdown-tabs">
			<div
				ref={tabList}
				className="markdown-tablist"
				role="tablist"
				aria-label={label}
			>
				{panels.map(({ label }, index) => (
					<button
						key={label}
						id={`${id}-tab-${index}`}
						type="button"
						role="tab"
						className="markdown-tab"
						aria-selected={label === active}
						aria-controls={`${id}-panel-${index}`}
						tabIndex={label === active ? 0 : -1}
						onClick={(event) =>
							selection.select(
								group,
								label,
								event.isTrusted ? tabList.current : null,
							)
						}
						onKeyDown={(event) => handleKeyDown(event, index)}
					>
						{label}
					</button>
				))}
			</div>
			{panels.map(({ label, content }, index) => (
				<div
					key={label}
					id={`${id}-panel-${index}`}
					role="tabpanel"
					className="markdown-tab-panel"
					data-note-tab-panel={label}
					aria-labelledby={`${id}-tab-${index}`}
					tabIndex={0}
					hidden={label !== active}
				>
					{content}
				</div>
			))}
		</div>
	);
}

export function hiddenNoteTabPanel(element: Element) {
	return element.closest<HTMLElement>("[data-note-tab-panel][hidden]");
}

/** Keep search and code-reference targets reachable in an inactive panel. */
export function revealNoteTab(element: Element, onVisible: () => void) {
	const tabId = hiddenNoteTabPanel(element)?.getAttribute("aria-labelledby");
	const tab = tabId ? element.ownerDocument.getElementById(tabId) : null;
	if (!tab) {
		onVisible();
		return;
	}
	tab.click();
	requestAnimationFrame(() => {
		if (element.isConnected && !hiddenNoteTabPanel(element)) onVisible();
	});
}
