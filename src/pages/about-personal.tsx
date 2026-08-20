// 正式生活页：近来记录当下，相信承载价值，娱乐收纳正在玩的、看的与听的。
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

const SERVE_PEOPLE_RED = "#D52B1E";

type PersonalLifeLabels = {
	index: string;
	beliefs: string;
	recent: string;
	entertainment: string;
	entertainmentIndex: string;
	playing: string;
	watching: string;
	listening: string;
	back: string;
};

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

export type PersonalSectionId = "recent" | "beliefs" | "entertainment";
export type EntertainmentSectionId = "playing" | "watching" | "listening";
type LifePanelId =
	| Exclude<PersonalSectionId, "entertainment">
	| EntertainmentSectionId;
type BeliefsLayer = "overview" | "service";

const personalSectionOrder: readonly PersonalSectionId[] = [
	"recent",
	"beliefs",
	"entertainment",
];
const entertainmentSectionOrder: readonly EntertainmentSectionId[] = [
	"playing",
	"watching",
	"listening",
];

function isEntertainmentPanel(
	panel: LifePanelId,
): panel is EntertainmentSectionId {
	return entertainmentSectionOrder.includes(panel as EntertainmentSectionId);
}

function focusAdjacentTab<T extends string>(
	event: ReactKeyboardEvent<HTMLButtonElement>,
	current: T,
	order: readonly T[],
	tabRefs: Record<T, HTMLButtonElement | null>,
) {
	const currentIndex = order.indexOf(current);
	let nextIndex: number | undefined;

	switch (event.key) {
		case "ArrowLeft":
			nextIndex = (currentIndex - 1 + order.length) % order.length;
			break;
		case "ArrowRight":
			nextIndex = (currentIndex + 1) % order.length;
			break;
		case "Home":
			nextIndex = 0;
			break;
		case "End":
			nextIndex = order.length - 1;
			break;
		default:
			return;
	}

	event.preventDefault();
	const next = order[nextIndex];
	if (!next) return;
	requestAnimationFrame(() => tabRefs[next]?.focus());
}

type MagneticPoster = {
	accent: string;
	alt: string;
	credit: string;
	sourceUrl: string;
	src: string;
	title: string;
};

type MagneticTransition = {
	from: MagneticPoster;
	to: MagneticPoster;
};

const MAGNETIC_POSTERS: MagneticPoster[] = [
	{
		accent: "#C83225",
		alt: "《荒野大镖客：救赎 2》红色主视觉，亚瑟·摩根举枪面向画面",
		credit: "Rockstar Games",
		sourceUrl:
			"https://media-rockstargames-com.akamaized.net/rockstargames-newsite/img/global/downloads/wallpapers/games/rdr2_officialart_3840x2160.jpg",
		src: "assets/favorites/games/rdr2-official-art.webp",
		title: "Red Dead Redemption 2",
	},
	{
		accent: "#C4473D",
		alt: "《彩虹六号：围攻》主视觉，五名干员在破碎墙体两侧协同推进",
		credit: "Ubisoft Montréal",
		sourceUrl:
			"https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUQTn/1lKKKfKHD5f84ViM2NHBOJ/b9c76f9a1e2356f1338d82122041282a/R6_KEYART_1920x1080.jpg",
		src: "assets/favorites/games/rainbow-six-siege-key-art.webp",
		title: "Rainbow Six Siege",
	},
];

const MAGNETIC_PIXEL_SPREAD_MS = 280;
const MAGNETIC_PIXEL_DURATION_MS = MAGNETIC_PIXEL_SPREAD_MS;
const MAGNETIC_AUTOPLAY_DELAY_MS = 6_000;

type PosterImageCacheEntry = {
	image: HTMLImageElement;
	promise: Promise<HTMLImageElement>;
};

type NetworkAwareNavigator = Navigator & {
	connection?: {
		effectiveType?: string;
		saveData?: boolean;
	};
};

type IdleAwareWindow = Window & {
	requestIdleCallback?: (
		callback: () => void,
		options?: { timeout: number },
	) => number;
	cancelIdleCallback?: (handle: number) => void;
};

const posterImageCache = new Map<string, PosterImageCacheEntry>();

function resolvePosterSrc(poster: MagneticPoster) {
	return `${import.meta.env.BASE_URL}${poster.src}`;
}

function loadPosterImage(
	poster: MagneticPoster,
	priority: "auto" | "low" = "auto",
) {
	const source = resolvePosterSrc(poster);
	const cached = posterImageCache.get(source);
	if (cached) {
		if (priority === "auto" && cached.image.fetchPriority === "low")
			cached.image.fetchPriority = "auto";
		return cached.promise;
	}

	const image = new Image();
	image.decoding = "async";
	image.fetchPriority = priority;
	const promise = new Promise<HTMLImageElement>((resolve, reject) => {
		image.addEventListener(
			"load",
			() => {
				void image
					.decode()
					.catch(() => undefined)
					.finally(() => resolve(image));
			},
			{ once: true },
		);
		image.addEventListener(
			"error",
			() => reject(new Error(`Unable to load poster: ${poster.title}`)),
			{ once: true },
		);
	});
	const entry = { image, promise };
	posterImageCache.set(source, entry);
	void promise.catch(() => {
		if (posterImageCache.get(source) === entry) posterImageCache.delete(source);
	});
	image.src = source;
	return promise;
}

function scheduleGamePosterWarmup() {
	const connection = (navigator as NetworkAwareNavigator).connection;
	if (
		connection?.saveData ||
		connection?.effectiveType === "slow-2g" ||
		connection?.effectiveType === "2g"
	) {
		return () => undefined;
	}

	const idleWindow = window as IdleAwareWindow;
	const pendingImages = new Set<HTMLImageElement>();
	let cancelled = false;
	let idleHandle: number | undefined;
	let timeoutHandle: number | undefined;

	const warmup = () => {
		if (cancelled || document.visibilityState !== "visible") return;
		for (const poster of MAGNETIC_POSTERS) {
			const image = new Image();
			image.decoding = "async";
			image.fetchPriority = "low";
			const release = () => pendingImages.delete(image);
			image.addEventListener("load", release, { once: true });
			image.addEventListener("error", release, { once: true });
			pendingImages.add(image);
			image.src = resolvePosterSrc(poster);
		}
	};

	const schedule = () => {
		if (cancelled) return;
		if (idleWindow.requestIdleCallback) {
			idleHandle = idleWindow.requestIdleCallback(warmup, { timeout: 2_500 });
			return;
		}
		timeoutHandle = window.setTimeout(warmup, 1_200);
	};

	if (document.readyState === "complete") schedule();
	else window.addEventListener("load", schedule, { once: true });

	return () => {
		cancelled = true;
		window.removeEventListener("load", schedule);
		if (idleHandle !== undefined) idleWindow.cancelIdleCallback?.(idleHandle);
		if (timeoutHandle !== undefined) window.clearTimeout(timeoutHandle);
		for (const image of pendingImages) image.src = "";
		pendingImages.clear();
	};
}

function clearGamePosterImageCache() {
	for (const { image } of posterImageCache.values()) {
		if (!image.complete) image.src = "";
	}
	posterImageCache.clear();
}

function fillRandomSwitchPoints(points: Uint8Array) {
	const maximumChunkSize = 65_536;
	for (let offset = 0; offset < points.length; offset += maximumChunkSize) {
		crypto.getRandomValues(
			points.subarray(
				offset,
				Math.min(offset + maximumChunkSize, points.length),
			),
		);
	}
}

function MagneticPixelField({
	transition,
	onComplete,
}: {
	transition: MagneticTransition;
	onComplete: () => void;
}) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const onCompleteRef = useRef(onComplete);

	useEffect(() => {
		onCompleteRef.current = onComplete;
	}, [onComplete]);

	useLayoutEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		let cancelled = false;
		let animationFrame = 0;

		const renderTransition = async () => {
			try {
				const [fromImage, toImage] = await Promise.all([
					loadPosterImage(transition.from),
					loadPosterImage(transition.to),
				]);
				if (cancelled) return;

				const bounds = canvas.getBoundingClientRect();
				const width = Math.max(1, Math.round(bounds.width));
				const height = Math.max(1, Math.round(bounds.height));
				const context = canvas.getContext("2d", { alpha: false });
				if (!context) {
					onCompleteRef.current();
					return;
				}

				canvas.width = width;
				canvas.height = height;

				const sampleCanvas = document.createElement("canvas");
				sampleCanvas.width = width;
				sampleCanvas.height = height;
				const sampleContext = sampleCanvas.getContext("2d", {
					alpha: false,
					willReadFrequently: true,
				});
				if (!sampleContext) {
					onCompleteRef.current();
					return;
				}

				sampleContext.imageSmoothingEnabled = true;
				sampleContext.imageSmoothingQuality = "high";
				sampleContext.drawImage(fromImage, 0, 0, width, height);
				const fromPixels = sampleContext.getImageData(0, 0, width, height).data;
				sampleContext.clearRect(0, 0, width, height);
				sampleContext.drawImage(toImage, 0, 0, width, height);
				const toPixels = sampleContext.getImageData(0, 0, width, height).data;

				const output = context.createImageData(width, height);
				const outputPixels = output.data;
				const switchPoints = new Uint8Array(width * height);
				fillRandomSwitchPoints(switchPoints);

				const startedAt = performance.now();
				const draw = (now: number) => {
					const elapsed = now - startedAt;
					const switchThreshold = Math.min(
						255,
						Math.floor((elapsed / MAGNETIC_PIXEL_SPREAD_MS) * 256),
					);

					for (
						let index = 0, offset = 0;
						index < switchPoints.length;
						index++, offset += 4
					) {
						const source =
							switchPoints[index] > switchThreshold ? fromPixels : toPixels;
						outputPixels[offset] = source[offset];
						outputPixels[offset + 1] = source[offset + 1];
						outputPixels[offset + 2] = source[offset + 2];
						outputPixels[offset + 3] = 255;
					}

					context.putImageData(output, 0, 0);
					if (elapsed < MAGNETIC_PIXEL_DURATION_MS) {
						animationFrame = window.requestAnimationFrame(draw);
					} else {
						onCompleteRef.current();
					}
				};

				draw(startedAt);
			} catch {
				if (!cancelled) onCompleteRef.current();
			}
		};

		void renderTransition();
		return () => {
			cancelled = true;
			window.cancelAnimationFrame(animationFrame);
		};
	}, [transition]);

	return (
		<span
			aria-hidden="true"
			className="pointer-events-none absolute inset-0 block"
		>
			<img
				src={resolvePosterSrc(transition.from)}
				alt=""
				className="absolute inset-0 block h-full w-full object-cover"
				width={1440}
				height={810}
			/>
			<canvas
				ref={canvasRef}
				className="absolute inset-0 block h-full w-full [image-rendering:pixelated]"
			/>
		</span>
	);
}

function GamePosterCarousel({
	theme,
	label,
}: {
	theme: Theme;
	label: string;
}) {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [transition, setTransition] = useState<MagneticTransition | null>(null);
	const [postersReady, setPostersReady] = useState(false);
	const [hasKeyboardFocusWithin, setHasKeyboardFocusWithin] = useState(false);
	const [isInViewport, setIsInViewport] = useState(true);
	const figureRef = useRef<HTMLElement>(null);
	const current = MAGNETIC_POSTERS[currentIndex];

	useEffect(() => {
		const figure = figureRef.current;
		if (!figure || !("IntersectionObserver" in window)) return;

		const observer = new IntersectionObserver(
			([entry]) => setIsInViewport(entry?.isIntersecting ?? false),
			{ threshold: 0.2 },
		);
		observer.observe(figure);
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		let cancelled = false;
		void Promise.all(
			MAGNETIC_POSTERS.map((poster) => loadPosterImage(poster, "low")),
		)
			.then(() => {
				if (!cancelled) setPostersReady(true);
			})
			.catch(() => undefined);
		return () => {
			cancelled = true;
		};
	}, []);

	const selectPoster = (nextIndex: number) => {
		if (transition || nextIndex === currentIndex) return;
		const next = MAGNETIC_POSTERS[nextIndex];
		if (!next) return;

		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			setCurrentIndex(nextIndex);
			return;
		}

		setTransition({ from: current, to: next });
		setCurrentIndex(nextIndex);
	};

	const autoplayPaused =
		!postersReady ||
		transition !== null ||
		hasKeyboardFocusWithin ||
		!isInViewport;

	useEffect(() => {
		if (
			MAGNETIC_POSTERS.length < 2 ||
			autoplayPaused ||
			window.matchMedia("(prefers-reduced-motion: reduce)").matches
		) {
			return;
		}

		let timeout = 0;
		const schedule = () => {
			if (document.visibilityState !== "visible") return;
			timeout = window.setTimeout(() => {
				const nextIndex = (currentIndex + 1) % MAGNETIC_POSTERS.length;
				const next = MAGNETIC_POSTERS[nextIndex];
				if (!next) return;

				setTransition({ from: current, to: next });
				setCurrentIndex(nextIndex);
			}, MAGNETIC_AUTOPLAY_DELAY_MS);
		};
		const handleVisibilityChange = () => {
			window.clearTimeout(timeout);
			schedule();
		};

		schedule();
		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => {
			window.clearTimeout(timeout);
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [autoplayPaused, current, currentIndex]);

	return (
		<figure
			ref={figureRef}
			className="mx-auto w-full max-w-4xl"
			aria-label={`${label} · 游戏艺术轮转海报`}
			data-source={current.sourceUrl}
			onPointerDownCapture={() => setHasKeyboardFocusWithin(false)}
			onFocusCapture={(event) =>
				setHasKeyboardFocusWithin(
					event.target instanceof Element &&
						event.target.matches(":focus-visible"),
				)
			}
			onBlurCapture={(event) => {
				const nextTarget = event.relatedTarget;
				if (
					!(nextTarget instanceof Node) ||
					!event.currentTarget.contains(nextTarget)
				) {
					setHasKeyboardFocusWithin(false);
				}
			}}
		>
			<div
				className="relative isolate aspect-video w-full overflow-hidden rounded-[4px]"
				style={{
					backgroundColor: theme.bgDeep,
					border: `1px solid ${theme.borderLight}`,
				}}
			>
				<img
					src={resolvePosterSrc(current)}
					alt={current.alt}
					className="block h-full w-full object-cover"
					width={1440}
					height={810}
					decoding="async"
					fetchPriority="high"
					draggable={false}
				/>
				{transition && (
					<MagneticPixelField
						transition={transition}
						onComplete={() => setTransition(null)}
					/>
				)}
			</div>

			<div className="mt-5 flex items-center justify-center">
				<div className="flex items-center justify-center gap-4">
					{MAGNETIC_POSTERS.map((item, index) => {
						const selected = index === currentIndex;
						return (
							<button
								key={item.src}
								type="button"
								onClick={() => selectPoster(index)}
								disabled={transition !== null}
								aria-label={`${index + 1} · ${item.title}`}
								aria-current={selected ? "true" : undefined}
								className="h-3.5 w-3.5 cursor-pointer rounded-full outline-none disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-3"
								style={{
									backgroundColor: item.accent,
									boxShadow: selected
										? `0 0 0 2px ${theme.bg}, 0 0 0 3px ${theme.accent}`
										: `0 0 0 1px ${theme.border}`,
									outlineColor: theme.accent,
									transform: selected ? "scale(1.12)" : undefined,
								}}
							/>
						);
					})}
				</div>
			</div>

			<figcaption
				className="mt-4 text-center text-[10px] font-medium tracking-[0.13em] sm:text-[11px]"
				style={{ color: theme.textSec }}
			>
				{current.title}&nbsp; · &nbsp;{current.credit}
			</figcaption>
		</figure>
	);
}

type RecentLifeContent = {
	label: string;
	wish: {
		dateTime: string;
		dateLabel: string;
		text: string;
	};
	cat: {
		alt: string;
		dateTime: string;
		dateLabel: string;
		src: string;
		title: string;
	};
};

function RecentLifeNotes({
	theme,
	content,
}: {
	theme: Theme;
	content: RecentLifeContent;
}) {
	return (
		<ol
			aria-label={content.label}
			className="mx-auto grid w-full max-w-4xl gap-y-14 md:gap-y-20 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:items-start lg:gap-x-[clamp(3.5rem,7vw,6.5rem)] lg:gap-y-0"
		>
			<li className="flex min-h-[16rem] items-center sm:min-h-[19rem] lg:min-h-[30rem] lg:items-end lg:pb-[12%]">
				<article className="max-w-[28rem]">
					<time
						dateTime={content.wish.dateTime}
						className="font-mono text-[10px] font-medium tracking-[0.13em] sm:text-[11px]"
						style={{ color: theme.accent }}
					>
						{content.wish.dateLabel}
					</time>
					<p
						className="mt-6 text-[clamp(1.75rem,4.5vw,2.75rem)] font-medium leading-[1.42] tracking-[-0.035em]"
						style={{ color: theme.text }}
					>
						{content.wish.text}
					</p>
				</article>
			</li>

			<li className="w-full max-w-[31rem] sm:ml-auto lg:ml-0 lg:justify-self-end">
				<article>
					<figure>
						<div
							className="aspect-square w-full overflow-hidden rounded-[2px]"
							style={{
								backgroundColor: theme.bgDeep,
								border: `1px solid ${theme.borderLight}`,
							}}
						>
							<img
								src={`${import.meta.env.BASE_URL}${content.cat.src}`}
								alt={content.cat.alt}
								className="block h-full w-full object-cover"
								width={960}
								height={960}
								loading="lazy"
								decoding="async"
								draggable={false}
							/>
						</div>
						<figcaption className="mt-4 flex items-baseline justify-between gap-6">
							<p
								className="text-base font-medium tracking-[-0.01em] sm:text-lg"
								style={{ color: theme.text }}
							>
								{content.cat.title}
							</p>
							<time
								dateTime={content.cat.dateTime}
								className="shrink-0 font-mono text-[10px] font-medium tracking-[0.13em] sm:text-[11px]"
								style={{ color: theme.textSec }}
							>
								{content.cat.dateLabel}
							</time>
						</figcaption>
					</figure>
				</article>
			</li>
		</ol>
	);
}

function LifePrimaryIndex({
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
	sections: { id: PersonalSectionId; label: string }[];
	active: PersonalSectionId;
	onActivate: (section: PersonalSectionId) => void;
	onKeyDown: (
		event: ReactKeyboardEvent<HTMLButtonElement>,
		section: PersonalSectionId,
	) => void;
	onTabRef: (
		section: PersonalSectionId,
		element: HTMLButtonElement | null,
	) => void;
}) {
	return (
		<div
			role="tablist"
			aria-label={label}
			data-index-treatment="wash"
			className="grid w-full grid-cols-3 pb-8"
		>
			{sections.map((section) => {
				const selected = active === section.id;
				const anchor = section.id === "beliefs";

				return (
					<button
						key={section.id}
						id={`life-tab-${section.id}`}
						type="button"
						role="tab"
						aria-selected={selected}
						aria-controls="life-panel"
						tabIndex={selected ? 0 : -1}
						ref={(element) => onTabRef(section.id, element)}
						onClick={() => onActivate(section.id)}
						onKeyDown={(event) => onKeyDown(event, section.id)}
						className={`flex min-h-10 min-w-0 w-[88%] max-w-[13rem] cursor-pointer items-center justify-center justify-self-center rounded-full px-2 text-xs tracking-[0.045em] outline-none transition-[background-color,color] duration-[180ms] ease-out focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none sm:w-[78%] sm:text-[13px] ${
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

function EntertainmentIndex({
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
	sections: { id: EntertainmentSectionId; label: string }[];
	active: EntertainmentSectionId;
	onActivate: (section: EntertainmentSectionId) => void;
	onKeyDown: (
		event: ReactKeyboardEvent<HTMLButtonElement>,
		section: EntertainmentSectionId,
	) => void;
	onTabRef: (
		section: EntertainmentSectionId,
		element: HTMLButtonElement | null,
	) => void;
}) {
	return (
		<div
			role="tablist"
			aria-label={label}
			className="mx-auto grid w-full max-w-sm grid-cols-3 gap-2"
		>
			{sections.map((section) => {
				const selected = active === section.id;

				return (
					<button
						key={section.id}
						id={`life-entertainment-tab-${section.id}`}
						type="button"
						role="tab"
						aria-selected={selected}
						aria-controls="life-entertainment-panel"
						tabIndex={selected ? 0 : -1}
						ref={(element) => onTabRef(section.id, element)}
						onClick={() => onActivate(section.id)}
						onKeyDown={(event) => onKeyDown(event, section.id)}
						className={`flex min-h-9 min-w-0 cursor-pointer items-center justify-center rounded-full px-3 text-[11px] font-medium tracking-[0.06em] outline-none transition-[background-color,color] duration-[180ms] ease-out focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none sm:text-xs ${
							selected
								? "bg-[var(--life-subindex-active)] text-[var(--life-subindex-accent)]"
								: "bg-transparent text-[var(--life-subindex-idle)] hover:bg-[var(--life-subindex-hover)] hover:text-[var(--life-subindex-accent)] focus-visible:bg-[var(--life-subindex-hover)] focus-visible:text-[var(--life-subindex-accent)]"
						}`}
						style={
							{
								"--life-subindex-active": theme.bgDeep,
								"--life-subindex-hover": theme.bgCard,
								"--life-subindex-accent": theme.accent,
								"--life-subindex-idle": theme.textSec,
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

export default function PersonalLifePage({
	theme,
	activeSection,
	onActiveSectionChange,
	entertainmentSection,
	onEntertainmentSectionChange,
}: {
	theme: Theme;
	activeSection: PersonalSectionId;
	onActiveSectionChange: (section: PersonalSectionId) => void;
	entertainmentSection: EntertainmentSectionId;
	onEntertainmentSectionChange: (section: EntertainmentSectionId) => void;
}) {
	const { t } = useI18n();
	const labels: PersonalLifeLabels = {
		index: t("about.personal.index"),
		beliefs: t("about.personal.tab.beliefs"),
		recent: t("about.personal.tab.recent"),
		entertainment: t("about.personal.tab.entertainment"),
		entertainmentIndex: t("about.personal.entertainment.index"),
		playing: t("about.personal.tab.playing"),
		watching: t("about.personal.tab.watching"),
		listening: t("about.personal.tab.listening"),
		back: t("about.personal.back"),
	};
	const principleGroups = [
		{
			title: t("about.personal.group.together"),
			items: [
				t("about.personal.principle.commonGoal"),
				t("about.personal.principle.excellence"),
			],
		},
		{
			title: t("about.personal.group.contribution"),
			items: [
				t("about.personal.principle.reliability"),
				t("about.personal.principle.responsibility"),
				t("about.personal.principle.legacy"),
			],
		},
		{
			title: t("about.personal.group.growth"),
			items: [
				t("about.personal.principle.support"),
				t("about.personal.principle.effort"),
				t("about.personal.principle.pause"),
			],
		},
	];
	const inspirationCaption = t("about.personal.inspiration.caption");
	const recentContent: RecentLifeContent = {
		label: t("about.personal.recent.label"),
		wish: {
			dateTime: "2026-08-16",
			dateLabel: "2026 · 08 · 16",
			text: t("about.personal.recent.wish"),
		},
		cat: {
			alt: t("about.personal.recent.cat.alt"),
			dateTime: "2026-08-07",
			dateLabel: "2026 · 08 · 07",
			src: "assets/recent/cat-portrait.jpg",
			title: t("about.personal.recent.cat"),
		},
	};
	const seriesTitle = t("about.favorites.series");
	const musicTitle = t("about.favorites.music");
	const series = {
		label: t("about.favorites.series.modernFamily"),
		title: t("about.favorites.series.modernFamily.title"),
		src: "assets/favorites/series-modern-family.jpg",
		width: 1200,
		height: 1600,
	};
	const song = {
		label: t("about.favorites.song.homeToMama"),
		title: t("about.favorites.song.homeToMama.title"),
		credit: t("about.favorites.song.homeToMama.artist"),
		src: "assets/favorites/song-home-to-mama-justin-bieber-cody-simpson.jpg",
		width: 640,
		height: 640,
	};
	const targetPanel: LifePanelId =
		activeSection === "entertainment" ? entertainmentSection : activeSection;
	const [displayedPanel, setDisplayedPanel] =
		useState<LifePanelId>(targetPanel);
	const [beliefsLayer, setBeliefsLayer] = useState<BeliefsLayer>("overview");
	const [panelVisible, setPanelVisible] = useState(true);
	const panelRef = useRef<HTMLElement>(null);
	const initialPanelRef = useRef(true);
	const primaryTabRefs = useRef<
		Record<PersonalSectionId, HTMLButtonElement | null>
	>({
		recent: null,
		beliefs: null,
		entertainment: null,
	});
	const entertainmentTabRefs = useRef<
		Record<EntertainmentSectionId, HTMLButtonElement | null>
	>({
		playing: null,
		watching: null,
		listening: null,
	});
	const primarySections: { id: PersonalSectionId; label: string }[] = [
		{ id: "recent", label: labels.recent },
		{ id: "beliefs", label: labels.beliefs },
		{ id: "entertainment", label: labels.entertainment },
	];
	const entertainmentSections: {
		id: EntertainmentSectionId;
		label: string;
	}[] = [
		{ id: "playing", label: labels.playing },
		{ id: "watching", label: labels.watching },
		{ id: "listening", label: labels.listening },
	];
	const displayedPrimarySection: PersonalSectionId = isEntertainmentPanel(
		displayedPanel,
	)
		? "entertainment"
		: displayedPanel;

	const activatePrimarySection = (section: PersonalSectionId) => {
		if (
			section === "beliefs" &&
			section === activeSection &&
			beliefsLayer === "service"
		) {
			setBeliefsLayer("overview");
			return;
		}
		if (section !== activeSection) onActiveSectionChange(section);
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

	const handlePrimaryTabKeyDown = (
		event: ReactKeyboardEvent<HTMLButtonElement>,
		sectionId: PersonalSectionId,
	) => {
		focusAdjacentTab(
			event,
			sectionId,
			personalSectionOrder,
			primaryTabRefs.current,
		);
	};
	const handleEntertainmentTabKeyDown = (
		event: ReactKeyboardEvent<HTMLButtonElement>,
		sectionId: EntertainmentSectionId,
	) =>
		focusAdjacentTab(
			event,
			sectionId,
			entertainmentSectionOrder,
			entertainmentTabRefs.current,
		);

	useEffect(() => {
		const cancelWarmup = scheduleGamePosterWarmup();
		return () => {
			cancelWarmup();
			clearGamePosterImageCache();
		};
	}, []);

	useEffect(() => {
		if (targetPanel === displayedPanel) return;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			setDisplayedPanel(targetPanel);
			setPanelVisible(true);
			return;
		}

		setPanelVisible(false);
		const timeout = window.setTimeout(
			() => setDisplayedPanel(targetPanel),
			110,
		);
		return () => window.clearTimeout(timeout);
	}, [targetPanel, displayedPanel]);

	useLayoutEffect(() => {
		if (panelRef.current)
			panelRef.current.dataset.activeSection = displayedPanel;
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
	}, [displayedPanel]);

	useEffect(() => {
		if (displayedPanel !== "beliefs") setBeliefsLayer("overview");
	}, [displayedPanel]);

	return (
		<div className="pb-20">
			<LifePrimaryIndex
				theme={theme}
				label={labels.index}
				sections={primarySections}
				active={activeSection}
				onActivate={activatePrimarySection}
				onKeyDown={handlePrimaryTabKeyDown}
				onTabRef={(section, element) => {
					primaryTabRefs.current[section] = element;
				}}
			/>

			<section
				ref={panelRef}
				id="life-panel"
				role="tabpanel"
				aria-labelledby={`life-tab-${displayedPrimarySection}`}
				aria-busy={targetPanel !== displayedPanel}
				aria-live="polite"
				data-active-section={displayedPanel}
				className="mt-9 min-h-[31rem] sm:mt-11"
			>
				{displayedPrimarySection === "entertainment" && (
					<EntertainmentIndex
						theme={theme}
						label={labels.entertainmentIndex}
						sections={entertainmentSections}
						active={entertainmentSection}
						onActivate={onEntertainmentSectionChange}
						onKeyDown={handleEntertainmentTabKeyDown}
						onTabRef={(section, element) => {
							entertainmentTabRefs.current[section] = element;
						}}
					/>
				)}

				<div
					id={
						displayedPrimarySection === "entertainment"
							? "life-entertainment-panel"
							: undefined
					}
					role={
						displayedPrimarySection === "entertainment" ? "tabpanel" : undefined
					}
					aria-labelledby={
						displayedPrimarySection === "entertainment"
							? `life-entertainment-tab-${displayedPanel}`
							: undefined
					}
					className={`transition-opacity ease-out motion-reduce:transition-none ${
						displayedPrimarySection === "entertainment" ? "mt-8" : ""
					}`}
					style={{
						opacity: panelVisible ? 1 : 0,
						transitionDuration: panelVisible ? "240ms" : "110ms",
					}}
				>
					{displayedPanel === "recent" && (
						<RecentLifeNotes theme={theme} content={recentContent} />
					)}

					{displayedPanel === "beliefs" && beliefsLayer === "overview" && (
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

					{displayedPanel === "beliefs" && beliefsLayer === "service" && (
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

					{displayedPanel === "playing" && (
						<GamePosterCarousel theme={theme} label={labels.playing} />
					)}

					{displayedPanel === "watching" && (
						<figure className="grid min-h-[31rem] gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-end lg:gap-16">
							<div
								className="flex min-h-[31rem] items-center justify-center p-5 sm:p-8"
								style={{
									backgroundColor: theme.bgDeep,
									border: `1px solid ${theme.borderLight}`,
								}}
							>
								<img
									src={`${import.meta.env.BASE_URL}${series.src}`}
									alt={series.label}
									className="block h-auto w-full max-w-[18rem] rounded-[2px]"
									width={series.width}
									height={series.height}
								/>
							</div>
							<figcaption className="pb-2 lg:pb-10">
								<p
									className="text-[10px] font-semibold tracking-[0.16em] sm:text-[11px]"
									style={{ color: theme.accent }}
								>
									{seriesTitle}
								</p>
								<h2
									className="mt-6 max-w-2xl text-[clamp(2.8rem,8vw,6.3rem)] font-semibold leading-[0.98] tracking-[-0.06em]"
									style={{ color: theme.text }}
								>
									{series.title}
								</h2>
							</figcaption>
						</figure>
					)}

					{displayedPanel === "listening" && (
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
				</div>
			</section>
		</div>
	);
}
