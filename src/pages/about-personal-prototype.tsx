// Prototype verdict: E / quiet wash wins; the production personal page stays intact until content review.
import {
	type CSSProperties,
	type KeyboardEvent as ReactKeyboardEvent,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { useI18n } from "../i18n";
import type { Theme } from "../themes";

type FavoriteItem = {
	label: string;
	title: string;
	credit?: string;
	src: string;
	width: number;
	height: number;
};

export type PersonalLifePrototypeProps = {
	theme: Theme;
	lifeCards: { title: string; desc: string }[];
	quickStats: {
		label: string;
		value: string;
		decoration?: "globe";
	}[];
	principleGroups: { title: string; items: string[] }[];
	valuesTitle: string;
	lifeLabel: string;
	inspirationAlt: string;
	inspirationCaption: string;
	favoritesTitle: string;
	moviesTitle: string;
	musicTitle: string;
	movie: FavoriteItem;
	song: FavoriteItem;
};

const prototypeVariants = ["A", "B", "E"] as const;
const indexPrototypeVariants = ["E"] as const;
const SERVE_PEOPLE_RED = "#D52B1E";
type PrototypeVariant = (typeof prototypeVariants)[number];
type IndexPrototypeVariant = (typeof indexPrototypeVariants)[number];

type PrototypeLabels = {
	index: string;
	beliefs: string;
	doing: string;
	playing: string;
	watching: string;
	listening: string;
	fragments: string;
	previous: string;
	next: string;
	back: string;
	variantNames: Record<PrototypeVariant, string>;
};

function readVariant(): PrototypeVariant {
	const value = new URLSearchParams(window.location.search).get("variant");
	return prototypeVariants.includes(value as PrototypeVariant)
		? (value as PrototypeVariant)
		: "E";
}

function writeVariant(variant: PrototypeVariant) {
	const url = new URL(window.location.href);
	url.searchParams.set("variant", variant);
	window.history.replaceState(null, "", url);
}

function ServePeopleMark({
	color,
	className = "",
	opacity = 1,
	label,
}: {
	color: string;
	className?: string;
	opacity?: number;
	label?: string;
}) {
	const captionMask = `${import.meta.env.BASE_URL}assets/mao-style-serve-the-people.png`;

	return (
		<span
			role={label ? "img" : undefined}
			aria-label={label}
			aria-hidden={label ? undefined : true}
			className={className}
			style={{
				backgroundColor: color,
				opacity,
				WebkitMaskImage: `url("${captionMask}")`,
				maskImage: `url("${captionMask}")`,
				WebkitMaskPosition: "center",
				maskPosition: "center",
				WebkitMaskRepeat: "no-repeat",
				maskRepeat: "no-repeat",
				WebkitMaskSize: "contain",
				maskSize: "contain",
			}}
		/>
	);
}

function InspirationFigure({
	theme,
	alt,
	caption,
	className = "",
}: {
	theme: Theme;
	alt: string;
	caption: string;
	className?: string;
}) {
	return (
		<figure className={className}>
			<img
				src={`${import.meta.env.BASE_URL}assets/qian_xuesen_yuan_longping_style.webp`}
				alt={alt}
				className="block h-auto w-full rounded-[3px]"
				loading="eager"
				decoding="async"
			/>
			<ServePeopleMark
				label={caption}
				color={theme.textSec}
				opacity={0.66}
				className="mx-auto mt-3 block aspect-[1629/513] w-[clamp(108px,25%,144px)]"
			/>
		</figure>
	);
}

function PrototypeSwitcher({
	theme,
	labels,
	current,
	onChange,
}: {
	theme: Theme;
	labels: PrototypeLabels;
	current: PrototypeVariant;
	onChange: (variant: PrototypeVariant) => void;
}) {
	if (!import.meta.env.DEV || indexPrototypeVariants.length < 2) return null;
	const currentIndex = indexPrototypeVariants.indexOf(
		current as IndexPrototypeVariant,
	);
	const move = (offset: number) => {
		const nextIndex =
			(currentIndex + offset + indexPrototypeVariants.length) %
			indexPrototypeVariants.length;
		onChange(indexPrototypeVariants[nextIndex]);
	};

	return (
		<div
			className="fixed bottom-5 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-1 rounded-full p-1.5 shadow-[0_10px_35px_rgba(0,0,0,0.24)]"
			style={{ backgroundColor: theme.text, color: theme.bg }}
		>
			<button
				type="button"
				onClick={() => move(-1)}
				className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full outline-none transition-opacity duration-200 hover:opacity-65 focus-visible:outline-2 focus-visible:outline-offset-2"
				style={{ outlineColor: theme.bg }}
				aria-label={labels.previous}
			>
				<span aria-hidden="true">←</span>
			</button>
			<div className="min-w-[9.5rem] px-3 text-center text-xs font-medium tracking-[0.04em]">
				{current} · {labels.variantNames[current]}
			</div>
			<button
				type="button"
				onClick={() => move(1)}
				className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full outline-none transition-opacity duration-200 hover:opacity-65 focus-visible:outline-2 focus-visible:outline-offset-2"
				style={{ outlineColor: theme.bg }}
				aria-label={labels.next}
			>
				<span aria-hidden="true">→</span>
			</button>
		</div>
	);
}

function AlmanacVariant({
	theme,
	lifeCards,
	quickStats,
	principleGroups,
	inspirationAlt,
	inspirationCaption,
	movie,
	song,
	labels,
}: PersonalLifePrototypeProps & { labels: PrototypeLabels }) {
	const racing = lifeCards[1];

	return (
		<div className="pb-20">
			<div className="grid gap-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-16">
				<aside className="self-start lg:sticky lg:top-10">
					<p
						className="mb-5 text-[11px] font-semibold tracking-[0.14em]"
						style={{ color: theme.accent }}
					>
						{labels.beliefs}
					</p>
					<InspirationFigure
						theme={theme}
						alt={inspirationAlt}
						caption={inspirationCaption}
					/>
					<div className="mt-8 border-t" style={{ borderColor: theme.border }}>
						{principleGroups.map((group) => (
							<section
								key={group.title}
								className="border-b py-4"
								style={{ borderColor: theme.borderLight }}
							>
								<h3
									className="text-[11px] font-medium tracking-[0.06em]"
									style={{ color: theme.textSec }}
								>
									{group.title}
								</h3>
								<p
									className="mt-2 text-[14px] leading-[1.7]"
									style={{ color: theme.text }}
								>
									{group.items[0]}
								</p>
							</section>
						))}
					</div>
					<dl className="mt-7 grid grid-cols-3 gap-4 lg:grid-cols-1">
						{quickStats.map((item) => (
							<div key={item.label} className="min-w-0">
								<dt
									className="text-[9px] font-semibold tracking-[0.1em] sm:text-[10px]"
									style={{ color: theme.accent }}
								>
									{item.label}
								</dt>
								<dd
									className="mt-1 truncate text-[11px] sm:text-xs"
									style={{ color: theme.textSec }}
								>
									{item.value}
								</dd>
							</div>
						))}
					</dl>
				</aside>

				<div>
					<header
						className="border-b pb-8"
						style={{ borderColor: theme.border }}
					>
						<p
							className="text-[11px] font-semibold tracking-[0.14em]"
							style={{ color: theme.accent }}
						>
							{labels.index}
						</p>
						<h2
							className="mt-4 text-[clamp(2.8rem,8vw,5.8rem)] font-semibold leading-[0.95] tracking-[-0.055em]"
							style={{ color: theme.text }}
						>
							{labels.fragments}
						</h2>
					</header>

					<section className="py-10">
						<div className="flex items-center gap-4">
							<h3 className="text-sm font-medium" style={{ color: theme.text }}>
								{labels.doing}
							</h3>
							<span
								className="h-px flex-1"
								style={{ backgroundColor: theme.borderLight }}
							/>
						</div>
						<div className="mt-5">
							{lifeCards.map((item, index) => (
								<article
									key={item.title}
									className="grid gap-2 border-t py-4 sm:grid-cols-[2rem_10rem_minmax(0,1fr)] sm:gap-5"
									style={{ borderColor: theme.borderLight }}
								>
									<span
										className="font-mono text-[10px]"
										style={{ color: theme.accent }}
									>
										{String(index + 1).padStart(2, "0")}
									</span>
									<h4
										className="text-sm font-medium"
										style={{ color: theme.text }}
									>
										{item.title}
									</h4>
									<p
										className="text-sm leading-[1.7]"
										style={{ color: theme.textSec }}
									>
										{item.desc}
									</p>
								</article>
							))}
						</div>
					</section>

					<section
						className="grid grid-cols-1 gap-4 sm:grid-cols-12"
						aria-label={labels.fragments}
					>
						<article
							className="p-5 sm:col-span-7 sm:p-6"
							style={{
								backgroundColor: theme.bgDeep,
								border: `1px solid ${theme.borderLight}`,
							}}
						>
							<p
								className="text-[10px] font-semibold tracking-[0.13em]"
								style={{ color: theme.accent }}
							>
								{labels.watching}
							</p>
							<figure className="mt-5 flex items-end gap-5">
								<img
									src={`${import.meta.env.BASE_URL}${movie.src}`}
									alt={movie.label}
									className="h-auto w-[42%] max-w-44 rounded-[3px]"
									width={movie.width}
									height={movie.height}
								/>
								<figcaption className="pb-1">
									<h3
										className="text-lg font-medium leading-6"
										style={{ color: theme.text }}
									>
										{movie.title}
									</h3>
								</figcaption>
							</figure>
						</article>

						<article
							className="flex min-h-56 flex-col justify-between p-5 sm:col-span-5 sm:p-6"
							style={{
								backgroundColor: theme.bgCard,
								border: `1px solid ${theme.borderLight}`,
							}}
						>
							<p
								className="text-[10px] font-semibold tracking-[0.13em]"
								style={{ color: theme.accent }}
							>
								{labels.playing}
							</p>
							<div>
								<h3
									className="text-[clamp(2rem,5vw,3.4rem)] font-semibold leading-none tracking-[-0.045em]"
									style={{ color: theme.text }}
								>
									{racing?.title}
								</h3>
								<p
									className="mt-4 text-sm leading-[1.7]"
									style={{ color: theme.textSec }}
								>
									{racing?.desc}
								</p>
							</div>
						</article>

						<article
							className="p-5 sm:col-span-5 sm:p-6"
							style={{
								backgroundColor: theme.bgCard,
								border: `1px solid ${theme.borderLight}`,
							}}
						>
							<p
								className="text-[10px] font-semibold tracking-[0.13em]"
								style={{ color: theme.accent }}
							>
								{labels.listening}
							</p>
							<figure className="mt-5">
								<img
									src={`${import.meta.env.BASE_URL}${song.src}`}
									alt={song.label}
									className="h-auto w-full rounded-[3px]"
									width={song.width}
									height={song.height}
								/>
								<figcaption className="mt-4">
									<h3
										className="text-lg font-medium"
										style={{ color: theme.text }}
									>
										{song.title}
									</h3>
									{song.credit && (
										<p
											className="mt-1 text-xs"
											style={{ color: theme.textSec }}
										>
											{song.credit}
										</p>
									)}
								</figcaption>
							</figure>
						</article>

						<div
							className="flex min-h-64 items-end p-6 sm:col-span-7 sm:p-8"
							style={{
								border: `1px solid ${theme.border}`,
								background: `linear-gradient(145deg, ${theme.bg} 0%, ${theme.bgDeep} 100%)`,
							}}
						>
							<div>
								<p
									className="text-[10px] font-semibold tracking-[0.13em]"
									style={{ color: theme.accent }}
								>
									{labels.doing}
								</p>
								<p
									className="mt-5 max-w-lg text-2xl font-medium leading-[1.35] tracking-[-0.025em]"
									style={{ color: theme.text }}
								>
									{lifeCards[3]?.desc}
								</p>
							</div>
						</div>
					</section>
				</div>
			</div>
		</div>
	);
}

type ReadingSection =
	| "beliefs"
	| "doing"
	| "playing"
	| "watching"
	| "listening";
type BeliefsLayer = "overview" | "service";

function LifeReadingIndex({
	theme,
	label,
	sections,
	active,
	onActivate,
	onKeyDown,
	onTabRef,
}: {
	theme: Theme;
	label: string;
	sections: { id: ReadingSection; label: string }[];
	active: ReadingSection;
	onActivate: (section: ReadingSection) => void;
	onKeyDown: (
		event: ReactKeyboardEvent<HTMLButtonElement>,
		section: ReadingSection,
	) => void;
	onTabRef: (
		section: ReadingSection,
		element: HTMLButtonElement | null,
	) => void;
}) {
	return (
		<div
			role="tablist"
			aria-label={label}
			data-index-treatment="wash"
			className="grid w-full grid-cols-5 pb-8"
		>
			{sections.map((section) => {
				const selected = active === section.id;
				const anchor = section.id === "beliefs";

				return (
					<button
						key={section.id}
						id={`life-c-tab-${section.id}`}
						type="button"
						role="tab"
						aria-selected={selected}
						aria-controls="life-c-panel"
						tabIndex={selected ? 0 : -1}
						ref={(element) => onTabRef(section.id, element)}
						onClick={() => onActivate(section.id)}
						onKeyDown={(event) => onKeyDown(event, section.id)}
						className={`flex min-h-10 min-w-0 w-[92%] cursor-pointer items-center justify-center justify-self-center rounded-full px-1 text-xs tracking-[0.045em] outline-none transition-[background-color,color] duration-[180ms] ease-out focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none sm:w-[86%] sm:text-[13px] ${
							selected || anchor ? "font-semibold" : "font-medium"
						} ${
							selected
								? "bg-[var(--life-index-active)] text-[var(--life-index-accent)]"
								: "bg-transparent text-[var(--life-index-idle)] hover:bg-[var(--life-index-hover)] hover:text-[var(--life-index-accent)] focus-visible:bg-[var(--life-index-hover)] focus-visible:text-[var(--life-index-accent)]"
						}`}
						style={
							{
								"--life-index-active": theme.accentLight,
								"--life-index-hover": theme.bgDeep,
								"--life-index-accent": theme.accent,
								"--life-index-idle": anchor ? theme.text : theme.textSec,
								outlineColor: theme.accent,
							} as CSSProperties
						}
					>
						<span className="truncate">{section.label}</span>
					</button>
				);
			})}
		</div>
	);
}

function IndexedReadingVariant({
	theme,
	lifeCards,
	principleGroups,
	lifeLabel,
	inspirationCaption,
	moviesTitle,
	musicTitle,
	movie,
	song,
	labels,
}: PersonalLifePrototypeProps & { labels: PrototypeLabels }) {
	const [active, setActive] = useState<ReadingSection>("beliefs");
	const [displayed, setDisplayed] = useState<ReadingSection>("beliefs");
	const [beliefsLayer, setBeliefsLayer] = useState<BeliefsLayer>("overview");
	const [panelVisible, setPanelVisible] = useState(true);
	const panelRef = useRef<HTMLElement>(null);
	const initialPanelRef = useRef(true);
	const tabRefs = useRef<Record<ReadingSection, HTMLButtonElement | null>>({
		beliefs: null,
		doing: null,
		playing: null,
		watching: null,
		listening: null,
	});
	const sections: { id: ReadingSection; label: string }[] = [
		{ id: "doing", label: labels.doing },
		{ id: "playing", label: labels.playing },
		{ id: "beliefs", label: labels.beliefs },
		{ id: "watching", label: labels.watching },
		{ id: "listening", label: labels.listening },
	];
	const doingLead = lifeCards[2] ?? lifeCards[0];
	const doingSupporting = lifeCards.filter(
		(_, index) => index === 0 || index === 3,
	);

	const activate = (section: ReadingSection) => {
		if (
			section === "beliefs" &&
			section === active &&
			beliefsLayer === "service"
		) {
			setBeliefsLayer("overview");
			return;
		}
		if (section !== active) setActive(section);
	};

	const showBeliefsLayer = (layer: BeliefsLayer) => {
		setBeliefsLayer(layer);
		window.requestAnimationFrame(() => {
			panelRef.current?.scrollIntoView({
				behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
					? "auto"
					: "smooth",
				block: "start",
			});
		});
	};

	const handleTabKeyDown = (
		event: ReactKeyboardEvent<HTMLButtonElement>,
		sectionId: ReadingSection,
	) => {
		const currentIndex = sections.findIndex(
			(section) => section.id === sectionId,
		);
		let nextIndex: number | undefined;

		switch (event.key) {
			case "ArrowLeft":
				nextIndex = (currentIndex - 1 + sections.length) % sections.length;
				break;
			case "ArrowRight":
				nextIndex = (currentIndex + 1) % sections.length;
				break;
			case "Home":
				nextIndex = 0;
				break;
			case "End":
				nextIndex = sections.length - 1;
				break;
			default:
				return;
		}

		event.preventDefault();
		const next = sections[nextIndex]?.id;
		if (!next) return;
		requestAnimationFrame(() => tabRefs.current[next]?.focus());
	};

	useEffect(() => {
		if (active === displayed) return;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			setDisplayed(active);
			setPanelVisible(true);
			return;
		}

		setPanelVisible(false);
		const timeout = window.setTimeout(() => setDisplayed(active), 110);
		return () => window.clearTimeout(timeout);
	}, [active, displayed]);

	useLayoutEffect(() => {
		if (panelRef.current) panelRef.current.dataset.activeSection = displayed;
		if (initialPanelRef.current) {
			initialPanelRef.current = false;
			return;
		}
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			setPanelVisible(true);
			return;
		}

		const frame = requestAnimationFrame(() => setPanelVisible(true));
		return () => cancelAnimationFrame(frame);
	}, [displayed]);

	useEffect(() => {
		if (displayed !== "beliefs") setBeliefsLayer("overview");
	}, [displayed]);

	return (
		<div className="pb-20">
			<LifeReadingIndex
				theme={theme}
				label={labels.index}
				sections={sections}
				active={active}
				onActivate={activate}
				onKeyDown={handleTabKeyDown}
				onTabRef={(section, element) => {
					tabRefs.current[section] = element;
				}}
			/>

			<section
				ref={panelRef}
				id="life-c-panel"
				role="tabpanel"
				aria-labelledby={`life-c-tab-${displayed}`}
				aria-busy={active !== displayed}
				aria-live="polite"
				data-active-section={displayed}
				className="mt-9 min-h-[31rem] transition-opacity ease-out motion-reduce:transition-none sm:mt-11"
				style={{
					opacity: panelVisible ? 1 : 0,
					transitionDuration: panelVisible ? "240ms" : "110ms",
				}}
			>
				{displayed === "beliefs" && beliefsLayer === "overview" && (
					<div className="mx-auto max-w-3xl">
						<div>
							{principleGroups.map((group) => (
								<section
									key={group.title}
									className="grid gap-4 border-t py-6 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-8 sm:py-7"
									style={{ borderColor: theme.border }}
								>
									<h3
										className="text-[15px] font-medium leading-7 sm:text-base"
										style={{ color: theme.accent }}
									>
										{group.title}
									</h3>
									<div className="space-y-3">
										{group.items.map((item) => (
											<p
												key={item}
												className="text-[15px] leading-[1.8] sm:text-[17px]"
												style={{ color: theme.textSec }}
											>
												{item}
											</p>
										))}
									</div>
								</section>
							))}
						</div>

						<button
							type="button"
							aria-label={inspirationCaption}
							onClick={() => showBeliefsLayer("service")}
							className="mx-auto mt-12 block aspect-[1629/513] w-[clamp(10rem,26vw,13rem)] cursor-pointer rounded-sm opacity-90 outline-none transition-opacity duration-200 ease-out hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-4 active:opacity-80 motion-reduce:transition-none"
							style={{ outlineColor: SERVE_PEOPLE_RED }}
						>
							<ServePeopleMark
								color={SERVE_PEOPLE_RED}
								className="block h-full w-full"
							/>
						</button>
					</div>
				)}

				{displayed === "beliefs" && beliefsLayer === "service" && (
					<div className="mx-auto max-w-3xl">
						<section
							lang="zh-CN"
							className="flex min-h-[31rem] flex-col px-4 py-8 sm:px-8 sm:py-10"
						>
							<h2 className="sr-only">{inspirationCaption}</h2>
							<div className="mx-auto flex w-full max-w-[38rem] flex-1 flex-col">
								<blockquote cite="https://dangjian.people.com.cn/n/2013/0313/c117092-20778945.html">
									<div
										className="space-y-1 text-[15px] font-normal leading-[1.7] tracking-[0.06em] sm:text-base sm:tracking-[0.08em]"
										style={{ color: theme.text }}
									>
										<p className="indent-[2em]">
											世界是你们的，也是我们的，但是归根结底是你们的。
										</p>
										<p className="indent-[2em]">
											你们青年人朝气蓬勃，正在兴旺时期，好像早晨八、九点钟的太阳。
										</p>
										<p className="indent-[2em]">希望寄托在你们身上。</p>
										<p className="indent-[2em]">
											世界是你们的。中国的前途是属于你们的。
										</p>
									</div>
								</blockquote>
								<button
									type="button"
									aria-label={labels.back}
									onClick={() => showBeliefsLayer("overview")}
									className="mx-auto mt-auto flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border outline-none transition-colors duration-150 ease-out hover:bg-[var(--belief-back-hover-bg)] hover:text-[var(--belief-back-hover-color)] focus-visible:outline-2 focus-visible:outline-offset-4 motion-reduce:transition-none"
									style={
										{
											"--belief-back-hover-bg": theme.bgDeep,
											"--belief-back-hover-color": theme.text,
											backgroundColor: theme.bgCard,
											borderColor: theme.border,
											color: theme.textSec,
											outlineColor: theme.accent,
										} as CSSProperties
									}
								>
									<svg
										aria-hidden="true"
										viewBox="0 0 24 24"
										fill="none"
										className="h-4 w-4"
									>
										<path
											d="M19 12H5m6-6-6 6 6 6"
											stroke="currentColor"
											strokeWidth="1.6"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
									</svg>
								</button>
							</div>
						</section>
					</div>
				)}

				{displayed === "doing" && (
					<div className="grid min-h-[31rem] gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
						<article
							className="flex min-h-[24rem] flex-col justify-between p-6 sm:p-9 lg:min-h-[31rem]"
							style={{
								backgroundColor: theme.bgDeep,
								border: `1px solid ${theme.borderLight}`,
							}}
						>
							<p
								className="text-[10px] font-semibold tracking-[0.16em] sm:text-[11px]"
								style={{ color: theme.accent }}
							>
								{lifeLabel}
							</p>
							<div>
								<h2
									className="text-[clamp(3rem,8vw,6.4rem)] font-semibold leading-[0.93] tracking-[-0.06em]"
									style={{ color: theme.text }}
								>
									{doingLead?.title}
								</h2>
								<p
									className="mt-6 max-w-lg text-sm leading-[1.85] sm:text-base"
									style={{ color: theme.textSec }}
								>
									{doingLead?.desc}
								</p>
							</div>
						</article>

						<div className="flex flex-col justify-end">
							{doingSupporting.map((item) => (
								<article
									key={item.title}
									className="border-t py-7 first:pt-6 lg:py-9"
									style={{ borderColor: theme.border }}
								>
									<h3
										className="text-2xl font-medium tracking-[-0.03em]"
										style={{ color: theme.text }}
									>
										{item.title}
									</h3>
									<p
										className="mt-3 max-w-md text-sm leading-[1.8]"
										style={{ color: theme.textSec }}
									>
										{item.desc}
									</p>
								</article>
							))}
						</div>
					</div>
				)}

				{displayed === "playing" && (
					<div className="grid min-h-[31rem] content-center gap-6 sm:grid-cols-2">
						{lifeCards.slice(0, 2).map((item) => (
							<article
								key={item.title}
								className="border-t py-7"
								style={{ borderColor: theme.border }}
							>
								<h3
									className="text-2xl font-medium tracking-[-0.03em]"
									style={{ color: theme.text }}
								>
									{item.title}
								</h3>
								<p
									className="mt-3 text-sm leading-[1.8]"
									style={{ color: theme.textSec }}
								>
									{item.desc}
								</p>
							</article>
						))}
					</div>
				)}

				{displayed === "watching" && (
					<figure className="grid min-h-[31rem] gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-end lg:gap-16">
						<div
							className="flex min-h-[31rem] items-center justify-center p-5 sm:p-8"
							style={{
								backgroundColor: theme.bgDeep,
								border: `1px solid ${theme.borderLight}`,
							}}
						>
							<img
								src={`${import.meta.env.BASE_URL}${movie.src}`}
								alt={movie.label}
								className="block h-auto w-full max-w-[18rem] rounded-[2px]"
								width={movie.width}
								height={movie.height}
							/>
						</div>
						<figcaption className="pb-2 lg:pb-10">
							<p
								className="text-[10px] font-semibold tracking-[0.16em] sm:text-[11px]"
								style={{ color: theme.accent }}
							>
								{moviesTitle}
							</p>
							<h2
								className="mt-6 max-w-2xl text-[clamp(2.8rem,8vw,6.3rem)] font-semibold leading-[0.98] tracking-[-0.06em]"
								style={{ color: theme.text }}
							>
								{movie.title}
							</h2>
						</figcaption>
					</figure>
				)}

				{displayed === "listening" && (
					<figure className="grid min-h-[31rem] gap-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] lg:items-end lg:gap-16">
						<figcaption className="order-2 pb-2 lg:order-1 lg:pb-10">
							<p
								className="text-[10px] font-semibold tracking-[0.16em] sm:text-[11px]"
								style={{ color: theme.accent }}
							>
								{musicTitle}
							</p>
							<h2
								className="mt-6 text-[clamp(3.4rem,10vw,7.4rem)] font-semibold leading-[0.9] tracking-[-0.065em]"
								style={{ color: theme.text }}
							>
								{song.title}
							</h2>
							{song.credit && (
								<p className="mt-3 text-sm" style={{ color: theme.textSec }}>
									{song.credit}
								</p>
							)}
						</figcaption>
						<div
							className="order-1 flex min-h-[24rem] items-center justify-center p-5 sm:p-8 lg:order-2 lg:min-h-[31rem]"
							style={{
								backgroundColor: theme.bgDeep,
								border: `1px solid ${theme.borderLight}`,
							}}
						>
							<img
								src={`${import.meta.env.BASE_URL}${song.src}`}
								alt={song.label}
								className="block h-auto w-full max-w-[26rem] rounded-[2px]"
								width={song.width}
								height={song.height}
							/>
						</div>
					</figure>
				)}
			</section>
		</div>
	);
}

export default function PersonalLifePrototype(
	props: PersonalLifePrototypeProps,
) {
	const { locale } = useI18n();
	const labels: PrototypeLabels =
		locale === "zh"
			? {
					index: "生活索引",
					beliefs: "相信",
					doing: "做",
					playing: "玩",
					watching: "看",
					listening: "听",
					fragments: "生活切片",
					previous: "上一个生活页方案",
					next: "下一个生活页方案",
					back: "返回",
					variantNames: {
						A: "流动书页",
						B: "双栏年鉴",
						E: "柔光文字",
					},
				}
			: {
					index: "Life index",
					beliefs: "Beliefs",
					doing: "Doing",
					playing: "Playing",
					watching: "Watching",
					listening: "Listening",
					fragments: "Life fragments",
					previous: "Previous personal-page variant",
					next: "Next personal-page variant",
					back: "Back",
					variantNames: {
						A: "Flowing page",
						B: "Split almanac",
						E: "Quiet wash",
					},
				};
	const [variant, setVariant] = useState<PrototypeVariant>(readVariant);

	const selectVariant = (next: PrototypeVariant) => {
		setVariant(next);
		writeVariant(next);
		window.scrollTo({ top: 0, behavior: "auto" });
	};

	useEffect(() => {
		if (indexPrototypeVariants.length < 2) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
			const target = event.target;
			if (
				target instanceof Element &&
				target.closest("input, textarea, button, [contenteditable=true]")
			)
				return;

			event.preventDefault();
			const currentIndex = indexPrototypeVariants.indexOf(
				variant as IndexPrototypeVariant,
			);
			const offset = event.key === "ArrowLeft" ? -1 : 1;
			const normalizedIndex = currentIndex < 0 ? 0 : currentIndex;
			const nextIndex =
				(normalizedIndex + offset + indexPrototypeVariants.length) %
				indexPrototypeVariants.length;
			const next = indexPrototypeVariants[nextIndex];
			setVariant(next);
			writeVariant(next);
			window.scrollTo({ top: 0, behavior: "auto" });
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [variant]);

	return (
		<div data-personal-life-prototype={variant}>
			{variant === "A" && <FlowingPageVariant {...props} labels={labels} />}
			{variant === "B" && <AlmanacVariant {...props} labels={labels} />}
			{variant === "E" && <IndexedReadingVariant {...props} labels={labels} />}
			<PrototypeSwitcher
				theme={props.theme}
				labels={labels}
				current={variant}
				onChange={selectVariant}
			/>
		</div>
	);
}

function FlowingPageVariant({
	theme,
	lifeCards,
	principleGroups,
	inspirationAlt,
	inspirationCaption,
	movie,
	song,
	labels,
}: PersonalLifePrototypeProps & { labels: PrototypeLabels }) {
	const racing = lifeCards[1];
	const pursuits = [lifeCards[0], lifeCards[2], lifeCards[3]].filter(Boolean);
	const indexItems = [
		{ id: "beliefs", label: labels.beliefs },
		{ id: "doing", label: labels.doing },
		{ id: "playing", label: labels.playing },
		{ id: "watching", label: labels.watching },
		{ id: "listening", label: labels.listening },
	];

	return (
		<div className="pb-20">
			<nav
				aria-label={labels.index}
				className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 border-y px-1 py-4"
				style={{ borderColor: theme.border }}
			>
				{indexItems.map((item) => (
					<button
						key={item.id}
						type="button"
						onClick={() =>
							document
								.getElementById(`life-a-${item.id}`)
								?.scrollIntoView({ block: "start" })
						}
						className="cursor-pointer text-[11px] font-medium tracking-[0.12em] outline-none transition-colors duration-200 focus-visible:underline sm:text-xs"
						style={{ color: theme.textSec }}
					>
						{item.label}
					</button>
				))}
			</nav>

			<section
				id="life-a-beliefs"
				className="grid scroll-mt-10 gap-9 py-14 sm:py-18 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14"
			>
				<InspirationFigure
					theme={theme}
					alt={inspirationAlt}
					caption={inspirationCaption}
					className="self-start"
				/>
				<div>
					<p
						className="text-[11px] font-semibold tracking-[0.14em]"
						style={{ color: theme.accent }}
					>
						{labels.beliefs}
					</p>
					<div className="mt-7">
						{principleGroups.map((group) => (
							<section
								key={group.title}
								className="grid gap-3 border-t py-5 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-7"
								style={{ borderColor: theme.border }}
							>
								<h3
									className="text-xs font-medium leading-5"
									style={{ color: theme.textSec }}
								>
									{group.title}
								</h3>
								<div className="space-y-2.5">
									{group.items.map((item) => (
										<p
											key={item}
											className="text-[14px] leading-[1.7] sm:text-[15px]"
											style={{ color: theme.text }}
										>
											{item}
										</p>
									))}
								</div>
							</section>
						))}
					</div>
				</div>
			</section>

			<section id="life-a-doing" className="scroll-mt-10 py-8 sm:py-11">
				<div className="flex items-center gap-5">
					<h2
						className="shrink-0 text-xl font-semibold tracking-[-0.02em]"
						style={{ color: theme.text }}
					>
						{labels.doing}
					</h2>
					<span
						aria-hidden="true"
						className="h-px flex-1"
						style={{ backgroundColor: theme.border }}
					/>
				</div>
				<div className="mt-8 grid gap-x-12 sm:grid-cols-2">
					{pursuits.map((item) => (
						<article
							key={item.title}
							className="border-t py-5"
							style={{ borderColor: theme.borderLight }}
						>
							<h3
								className="text-base font-medium"
								style={{ color: theme.text }}
							>
								{item.title}
							</h3>
							<p
								className="mt-2 text-sm leading-[1.75]"
								style={{ color: theme.textSec }}
							>
								{item.desc}
							</p>
						</article>
					))}
				</div>
			</section>

			<section
				id="life-a-playing"
				className="my-8 grid scroll-mt-10 gap-7 border-y py-9 sm:my-12 sm:py-11 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end"
				style={{ borderColor: theme.border }}
			>
				<div>
					<p
						className="text-[11px] font-semibold tracking-[0.14em]"
						style={{ color: theme.accent }}
					>
						{labels.playing}
					</p>
					<h2
						className="mt-4 text-[clamp(2.7rem,8vw,5.5rem)] font-semibold leading-none tracking-[-0.055em]"
						style={{ color: theme.text }}
					>
						{racing?.title}
					</h2>
				</div>
				<p
					className="max-w-md text-[15px] leading-[1.8]"
					style={{ color: theme.textSec }}
				>
					{racing?.desc}
				</p>
			</section>

			<div className="grid gap-12 pt-10 lg:grid-cols-2 lg:gap-14">
				<section
					id="life-a-watching"
					className="scroll-mt-10 border-t pt-6"
					style={{ borderColor: theme.border }}
				>
					<p
						className="text-[11px] font-semibold tracking-[0.14em]"
						style={{ color: theme.accent }}
					>
						{labels.watching}
					</p>
					<figure className="mt-6 grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] items-end gap-6 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
						<img
							src={`${import.meta.env.BASE_URL}${movie.src}`}
							alt={movie.label}
							className="block h-auto w-full rounded-[3px]"
							width={movie.width}
							height={movie.height}
						/>
						<figcaption className="pb-1">
							<h3
								className="text-lg font-medium leading-6"
								style={{ color: theme.text }}
							>
								{movie.title}
							</h3>
						</figcaption>
					</figure>
				</section>

				<section
					id="life-a-listening"
					className="scroll-mt-10 border-t pt-6"
					style={{ borderColor: theme.border }}
				>
					<p
						className="text-[11px] font-semibold tracking-[0.14em]"
						style={{ color: theme.accent }}
					>
						{labels.listening}
					</p>
					<figure className="mt-6 grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] items-end gap-6 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
						<img
							src={`${import.meta.env.BASE_URL}${song.src}`}
							alt={song.label}
							className="block h-auto w-full rounded-[3px]"
							width={song.width}
							height={song.height}
						/>
						<figcaption className="pb-1">
							<h3
								className="text-lg font-medium leading-6"
								style={{ color: theme.text }}
							>
								{song.title}
							</h3>
							{song.credit && (
								<p className="mt-1.5 text-sm" style={{ color: theme.textSec }}>
									{song.credit}
								</p>
							)}
						</figcaption>
					</figure>
				</section>
			</div>
		</div>
	);
}
