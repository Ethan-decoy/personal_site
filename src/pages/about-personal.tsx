// 正式生活页：以“相信”为中轴，通过索引切换承载不同的生活切面。
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
	doing: string;
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

type ReadingSection =
	| "beliefs"
	| "doing"
	| "playing"
	| "watching"
	| "listening";
type BeliefsLayer = "overview" | "service";

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

function resolvePosterSrc(poster: MagneticPoster) {
	return `${import.meta.env.BASE_URL}${poster.src}`;
}

function loadPosterImage(poster: MagneticPoster) {
	return new Promise<HTMLImageElement>((resolve, reject) => {
		const image = new Image();
		image.decoding = "async";
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
		image.src = resolvePosterSrc(poster);
	});
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
	const [isPointerInside, setIsPointerInside] = useState(false);
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
		const adjacentIndexes = new Set([
			(currentIndex - 1 + MAGNETIC_POSTERS.length) % MAGNETIC_POSTERS.length,
			(currentIndex + 1) % MAGNETIC_POSTERS.length,
		]);
		for (const index of adjacentIndexes) {
			const poster = MAGNETIC_POSTERS[index];
			if (poster) void loadPosterImage(poster).catch(() => undefined);
		}
	}, [currentIndex]);

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
		transition !== null ||
		isPointerInside ||
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
			onPointerEnter={() => setIsPointerInside(true)}
			onPointerLeave={() => setIsPointerInside(false)}
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
						id={`life-tab-${section.id}`}
						type="button"
						role="tab"
						aria-selected={selected}
						aria-controls="life-panel"
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

export default function PersonalLifePage({ theme }: { theme: Theme }) {
	const { t } = useI18n();
	const labels: PersonalLifeLabels = {
		index: t("about.personal.index"),
		beliefs: t("about.personal.tab.beliefs"),
		doing: t("about.personal.tab.doing"),
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
	const doingLead = {
		title: t("about.life.personalDev"),
		desc: t("about.life.personalDev.d"),
	};
	const doingSupporting = [
		{
			title: t("about.life.lifelongLearner"),
			desc: t("about.life.lifelongLearner.d"),
		},
		{
			title: t("about.life.walking"),
			desc: t("about.life.walking.d"),
		},
	];
	const lifeLabel = t("about.life");
	const inspirationCaption = t("about.personal.inspiration.caption");
	const moviesTitle = t("about.favorites.movies");
	const musicTitle = t("about.favorites.music");
	const movie = {
		label: t("about.favorites.movie.pursuit"),
		title: t("about.favorites.movie.pursuit.title"),
		src: "assets/favorites/movie-the-pursuit-of-happyness.jpg",
		width: 1000,
		height: 1500,
	};
	const song = {
		label: t("about.favorites.song.ferrari"),
		title: t("about.favorites.song.ferrari.title"),
		credit: t("about.favorites.song.ferrari.artist"),
		src: "assets/favorites/song-ferrari-bebe-rexha.jpg",
		width: 1200,
		height: 1200,
	};
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
				id="life-panel"
				role="tabpanel"
				aria-labelledby={`life-tab-${displayed}`}
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
					<GamePosterCarousel theme={theme} label={labels.playing} />
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
