import {
	type KeyboardEvent as ReactKeyboardEvent,
	type ReactNode,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { useI18n } from "../i18n";
import type { Section, Theme } from "../themes";

type AboutView = "personal" | "work";

type FavoriteItem = {
	label: string;
	title: string;
	credit?: string;
	src: string;
	width: number;
	height: number;
};

type PersonalLayoutProps = {
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

function PersonalProfile({
	theme,
	lifeCards,
	quickStats,
	principleGroups,
	valuesTitle,
	lifeLabel,
	inspirationAlt,
	inspirationCaption,
	favoritesTitle,
	moviesTitle,
	musicTitle,
	movie,
	song,
}: PersonalLayoutProps) {
	const [favoritesOpen, setFavoritesOpen] = useState(false);
	const inspirationCaptionImage = `${import.meta.env.BASE_URL}assets/mao-style-serve-the-people.png`;

	return (
		<div>
			<div className="grid grid-cols-1 gap-y-9 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-x-12 lg:gap-y-6">
				<div className="lg:col-start-1 lg:row-start-1">
					<img
						src={`${import.meta.env.BASE_URL}assets/qian_xuesen_yuan_longping_style.webp`}
						alt={inspirationAlt}
						className="block h-auto w-full rounded-xl"
						loading="eager"
						decoding="async"
					/>
					<span
						role="img"
						aria-label={inspirationCaption}
						className="mx-auto mt-2 block aspect-[1629/513] w-[clamp(112px,24%,148px)]"
						style={{
							backgroundColor: theme.textSec,
							opacity: 0.68,
							WebkitMaskImage: `url("${inspirationCaptionImage}")`,
							maskImage: `url("${inspirationCaptionImage}")`,
							WebkitMaskPosition: "center",
							maskPosition: "center",
							WebkitMaskRepeat: "no-repeat",
							maskRepeat: "no-repeat",
							WebkitMaskSize: "contain",
							maskSize: "contain",
						}}
					/>
				</div>

				<div className="flex min-w-0 flex-col lg:col-start-2 lg:row-span-2 lg:row-start-1">
					<dl
						className="grid grid-cols-2 gap-0"
						style={{
							borderTop: `1px solid ${theme.border}`,
							borderBottom: `1px solid ${theme.border}`,
						}}
					>
						{quickStats.map((item, index) => (
							<div
								key={item.label}
								className={`relative overflow-hidden px-3.5 py-4 ${index === 0 ? "col-span-2" : ""}`}
								style={{
									backgroundColor: "transparent",
									border: "none",
									borderBottom:
										index === 0 ? `1px solid ${theme.borderLight}` : undefined,
									borderLeft:
										index === 2 ? `1px solid ${theme.borderLight}` : undefined,
								}}
							>
								{item.decoration === "globe" && (
									<img
										src={`${import.meta.env.BASE_URL}assets/location-globe-print.webp`}
										alt=""
										aria-hidden="true"
										className="pointer-events-none absolute right-2 top-1/2 h-auto w-[32%] max-w-16 -translate-y-1/2 select-none object-contain opacity-40"
										loading="eager"
										decoding="async"
									/>
								)}
								<dt
									className="relative z-10 text-[10px] font-medium uppercase tracking-[0.1em] sm:text-[11px]"
									style={{ color: theme.accent }}
								>
									{item.label}
								</dt>
								<dd
									className="relative z-10 mt-1 text-xs leading-[1.55] sm:text-[13px]"
									style={{ color: theme.textSec }}
								>
									{item.value}
								</dd>
							</div>
						))}
					</dl>

					<div
						className="mt-7 flex-1 overflow-hidden rounded-lg"
						style={{
							backgroundColor: theme.bgCard,
							border: `1px solid ${theme.border}`,
							boxShadow: "none",
						}}
					>
						<header
							className="flex items-center gap-3 px-5 py-4 sm:px-6"
							style={{ borderBottom: `1px solid ${theme.border}` }}
						>
							<span
								aria-hidden="true"
								className="h-5 w-[3px] rounded-full"
								style={{ backgroundColor: theme.accent }}
							/>
							<h3
								className="text-base font-medium leading-6 tracking-normal sm:text-[17px]"
								style={{ color: theme.text }}
							>
								{valuesTitle}
							</h3>
						</header>
						{principleGroups.map((group, groupIndex) => (
							<section
								key={group.title}
								className="px-4 py-4 sm:px-5"
								style={{
									borderTop:
										groupIndex === 0
											? "none"
											: `1px solid ${theme.borderLight}`,
								}}
							>
								<h4
									className="text-xs font-medium leading-5 tracking-[0.02em] sm:text-[13px]"
									style={{ color: theme.accent }}
								>
									{group.title}
								</h4>
								<ul
									className="mt-2.5 space-y-2.5 border-l-2 pl-3"
									style={{ borderColor: theme.accent }}
								>
									{group.items.map((principle) => (
										<li key={principle}>
											<p
												className="text-[14px] font-normal leading-[1.6] sm:text-[15px] sm:leading-[1.65]"
												style={{ color: theme.text }}
											>
												{principle}
											</p>
										</li>
									))}
								</ul>
							</section>
						))}
					</div>
				</div>

				<div className="flex min-w-0 flex-col lg:col-start-1 lg:row-start-2">
					<section>
						<div className="mb-4 flex items-center gap-3">
							<span
								className="h-px w-8"
								style={{ backgroundColor: theme.accent }}
							/>
							<h3
								className="text-xs font-medium uppercase tracking-[0.1em] sm:text-[13px]"
								style={{ color: theme.text }}
							>
								{lifeLabel}
							</h3>
						</div>
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							{lifeCards.map((item) => (
								<div
									key={item.title}
									className="rounded-lg p-4"
									style={{
										backgroundColor: theme.bgDeep,
										border: `1px solid ${theme.borderLight}`,
									}}
								>
									<p
										className="text-sm font-medium leading-5 sm:text-[15px]"
										style={{ color: theme.text }}
									>
										{item.title}
									</p>
									{item.desc !== "..." && (
										<p
											className="mt-1 text-xs leading-[1.6] sm:text-[13px]"
											style={{ color: theme.textSec }}
										>
											{item.desc}
										</p>
									)}
								</div>
							))}
						</div>
					</section>

					<div className="mt-9 lg:mt-auto lg:pt-10">
						<button
							id="personal-favorites-toggle"
							type="button"
							className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-lg outline-none transition-opacity duration-200 hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-4 motion-reduce:transition-none"
							aria-expanded={favoritesOpen}
							aria-controls="personal-favorites-panel"
							onClick={() => setFavoritesOpen((open) => !open)}
						>
							<span className="flex items-center gap-3">
								<span
									className="h-px w-8"
									style={{ backgroundColor: theme.accent }}
								/>
								<span
									className="text-xs font-medium uppercase tracking-[0.1em] sm:text-[13px]"
									style={{ color: theme.text }}
								>
									{favoritesTitle}
								</span>
							</span>
							<span
								aria-hidden="true"
								className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-transform duration-200 motion-reduce:transition-none ${
									favoritesOpen ? "rotate-180" : ""
								}`}
								style={{ border: `1px solid ${theme.border}` }}
							>
								<span
									className="-mt-0.5 h-1.5 w-1.5 rotate-45 border-b border-r"
									style={{ borderColor: theme.accent }}
								/>
							</span>
						</button>
					</div>
				</div>
			</div>

			<section
				id="personal-favorites-panel"
				aria-labelledby="personal-favorites-toggle"
				aria-hidden={!favoritesOpen}
				className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none ${
					favoritesOpen
						? "grid-rows-[1fr] opacity-100"
						: "pointer-events-none grid-rows-[0fr] opacity-0"
				}`}
			>
				<div className="min-h-0 overflow-hidden">
					<div className="pt-9 lg:pt-10">
						<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10">
							{[
								{ sectionTitle: moviesTitle, item: movie },
								{ sectionTitle: musicTitle, item: song },
							].map(({ sectionTitle, item }) => (
								<article key={sectionTitle} className="min-w-0">
									<h4
										className="text-[11px] font-medium uppercase tracking-[0.1em] sm:text-xs"
										style={{ color: theme.textSec }}
									>
										{sectionTitle}
									</h4>
									<figure className="mt-3">
										<div className="flex h-72 items-start sm:h-64 md:h-72 lg:h-80">
											<img
												src={`${import.meta.env.BASE_URL}${item.src}`}
												alt={item.label}
												className="block h-auto w-auto max-h-full max-w-full rounded-xl object-contain"
												style={{ border: `1px solid ${theme.borderLight}` }}
												width={item.width}
												height={item.height}
												loading="lazy"
												decoding="async"
											/>
										</div>
										<figcaption className="mt-3">
											<p
												className="text-sm font-medium leading-5 sm:text-[15px]"
												style={{ color: theme.text }}
											>
												{item.title}
											</p>
											{item.credit && (
												<p
													className="mt-1 text-xs leading-5 sm:text-[13px]"
													style={{ color: theme.textSec }}
												>
													{item.credit}
												</p>
											)}
										</figcaption>
									</figure>
								</article>
							))}
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}

function AboutViewHeader({
	view,
	theme,
	onSwitch,
}: {
	view: AboutView;
	theme: Theme;
	onSwitch: () => void;
}) {
	const { t } = useI18n();
	const [inkVisible, setInkVisible] = useState(false);
	const currentLabel =
		view === "work" ? t("about.view.work") : t("about.view.personal");
	const nextLabel =
		view === "work" ? t("about.view.personal") : t("about.view.work");
	const switchIcon = (
		<svg
			aria-hidden="true"
			width="19"
			height="19"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.6"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M7 7h12" />
			<path d="m16 4 3 3-3 3" />
			<path d="M17 17H5" />
			<path d="m8 14-3 3 3 3" />
		</svg>
	);

	return (
		<header className="mb-12 flex items-center gap-4">
			<h2
				className="shrink-0 text-2xl font-bold tracking-tight"
				style={{ color: theme.text }}
			>
				{t("about.title")}
			</h2>
			<div
				aria-hidden="true"
				className="h-px min-w-4 flex-1"
				style={{ backgroundColor: theme.borderLight }}
			/>
			<div className="flex shrink-0 items-center gap-3">
				<span
					className="text-xs font-medium tracking-[0.04em]"
					style={{ color: theme.textSec }}
					aria-live="polite"
				>
					{currentLabel}
				</span>
				<button
					type="button"
					onClick={onSwitch}
					onPointerEnter={(event) => {
						if (event.pointerType === "touch") return;
						setInkVisible(true);
					}}
					onPointerLeave={() => setInkVisible(false)}
					onPointerCancel={() => setInkVisible(false)}
					className="relative isolate flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-4"
					style={{
						color: theme.accent,
						backgroundColor: theme.bg,
						border: `1px solid ${theme.border}`,
					}}
					aria-label={`切换到${nextLabel}`}
				>
					<span aria-hidden="true" className="relative z-0">
						{switchIcon}
					</span>
					<span
						aria-hidden="true"
						className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-full transition-[clip-path] duration-[420ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] motion-reduce:transition-none"
						style={{
							backgroundColor: theme.accent,
							color: theme.bg,
							clipPath: `circle(${inkVisible ? "160%" : "0"} at center)`,
						}}
					>
						{switchIcon}
					</span>
				</button>
			</div>
		</header>
	);
}

function AboutFaceTransition({
	view,
	front,
	back,
}: {
	view: AboutView;
	front: ReactNode;
	back: ReactNode;
}) {
	const planeRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const plane = planeRef.current;
		if (!plane || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
			return;

		const enteringWork = view === "work";
		const initialFrame = enteringWork
			? {
					opacity: 0.42,
					transform: "scale(0.997)",
				}
			: {
					opacity: 0.28,
					transform:
						"perspective(1400px) rotateY(-6deg) translateX(6px) scale(0.995)",
				};
		const animation = plane.animate(
			[initialFrame, { opacity: 1, transform: "none" }],
			{
				duration: enteringWork ? 200 : 340,
				easing: "cubic-bezier(0.22, 0.61, 0.36, 1)",
			},
		);
		animation.onfinish = () => animation.cancel();
		return () => animation.cancel();
	}, [view]);

	return (
		<div
			ref={planeRef}
			style={{
				transformOrigin: view === "personal" ? "left center" : "center top",
			}}
		>
			{view === "work" ? front : back}
		</div>
	);
}

const workSectionOrder = ["experience", "skills"] as const;
export type WorkSectionId = (typeof workSectionOrder)[number];

function EditorialWorkProfile({
	theme,
	skills,
	activeSection,
	onActiveSectionChange,
}: {
	theme: Theme;
	skills: { label: string; items: string[] }[];
	activeSection: WorkSectionId;
	onActiveSectionChange: (section: WorkSectionId) => void;
}) {
	const { t } = useI18n();
	const experience = {
		role: t("about.exp.role"),
		company: t("about.exp.company"),
		period: t("about.exp.period"),
		summary: t("about.exp.d0"),
	};
	const sectionLabels: Record<WorkSectionId, string> = {
		experience: t("about.exp"),
		skills: t("about.skills"),
	};
	const tabListRef = useRef<HTMLDivElement>(null);
	const tabLabelRefs = useRef<Record<WorkSectionId, HTMLSpanElement | null>>({
		experience: null,
		skills: null,
	});
	const [tabIndicator, setTabIndicator] = useState({
		left: 0,
		width: 0,
		ready: false,
	});

	useLayoutEffect(() => {
		const tabList = tabListRef.current;
		const activeLabel = tabLabelRefs.current[activeSection];
		if (!tabList || !activeLabel) return;
		const activeTab = activeLabel.closest<HTMLButtonElement>("[role=tab]");
		if (!activeTab) return;

		const updateIndicator = () => {
			// Layout offsets stay stable while AboutFaceTransition transforms the plane.
			// Client rects include that animation and leave a stale indicator position.
			setTabIndicator({
				left: activeTab.offsetLeft + activeLabel.offsetLeft,
				width: activeLabel.offsetWidth,
				ready: true,
			});
		};

		updateIndicator();
		const observer = new ResizeObserver(updateIndicator);
		observer.observe(tabList);
		observer.observe(activeLabel);
		return () => observer.disconnect();
	}, [activeSection]);

	const handleSectionKeyDown = (
		event: ReactKeyboardEvent<HTMLButtonElement>,
		sectionId: WorkSectionId,
	) => {
		const currentIndex = workSectionOrder.indexOf(sectionId);
		let nextIndex: number | undefined;

		switch (event.key) {
			case "ArrowLeft":
				nextIndex =
					(currentIndex - 1 + workSectionOrder.length) %
					workSectionOrder.length;
				break;
			case "ArrowRight":
				nextIndex = (currentIndex + 1) % workSectionOrder.length;
				break;
			case "Home":
				nextIndex = 0;
				break;
			case "End":
				nextIndex = workSectionOrder.length - 1;
				break;
			default:
				return;
		}

		event.preventDefault();
		const nextSection = workSectionOrder[nextIndex];
		onActiveSectionChange(nextSection);
		requestAnimationFrame(() => {
			document.getElementById(`work-tab-${nextSection}`)?.focus();
		});
	};

	return (
		<section>
			<p
				className="font-mono text-[10px] font-medium uppercase tracking-[0.13em] sm:text-[11px]"
				style={{ color: theme.accent }}
			>
				{t("about.work.kicker")}
			</p>
			<h3
				className="mt-3 text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.035em]"
				style={{ color: theme.text }}
			>
				{experience.role}
			</h3>
			<p
				className="mt-6 max-w-2xl text-[15px] leading-[1.85] sm:text-base"
				style={{ color: theme.textSec }}
			>
				{t("about.work.positioning")}
			</p>

			<div
				ref={tabListRef}
				role="tablist"
				aria-label={t("about.work.quickView")}
				aria-orientation="horizontal"
				className="relative mt-11 grid grid-cols-2 border-b"
				style={{ borderColor: theme.border }}
			>
				{workSectionOrder.map((sectionId) => {
					const active = sectionId === activeSection;
					return (
						<button
							key={sectionId}
							id={`work-tab-${sectionId}`}
							type="button"
							role="tab"
							aria-selected={active}
							aria-controls={`work-panel-${sectionId}`}
							tabIndex={active ? 0 : -1}
							onPointerEnter={(event) => {
								if (event.pointerType !== "touch")
									onActiveSectionChange(sectionId);
							}}
							onFocus={() => onActiveSectionChange(sectionId)}
							onClick={() => onActiveSectionChange(sectionId)}
							onKeyDown={(event) => handleSectionKeyDown(event, sectionId)}
							className="relative flex w-full min-w-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-[2px] px-1 pt-1 pb-4 text-[13px] font-medium outline-none transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 motion-reduce:transition-none sm:text-[15px]"
							style={{
								color: active ? theme.text : theme.textSec,
								outlineColor: theme.accent,
							}}
						>
							<span
								ref={(node) => {
									tabLabelRefs.current[sectionId] = node;
								}}
							>
								{sectionLabels[sectionId]}
							</span>
						</button>
					);
				})}
				{tabIndicator.ready && (
					<span
						aria-hidden="true"
						className="pointer-events-none absolute -bottom-px h-[2px] transition-[left,width] duration-[280ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] motion-reduce:transition-none"
						style={{
							left: tabIndicator.left,
							width: tabIndicator.width,
							backgroundColor: theme.accent,
						}}
					/>
				)}
			</div>

			<div aria-live="polite" className="mt-9 grid">
				{workSectionOrder.map((sectionId) => {
					const active = sectionId === activeSection;
					return (
						<section
							key={sectionId}
							id={`work-panel-${sectionId}`}
							role="tabpanel"
							aria-labelledby={`work-tab-${sectionId}`}
							aria-hidden={!active}
							className={`col-start-1 row-start-1 transition-[opacity,transform] duration-200 ease-out motion-reduce:translate-y-0 motion-reduce:transition-none ${
								active
									? "translate-y-0 opacity-100"
									: "translate-y-1.5 opacity-0"
							}`}
							style={{
								pointerEvents: active ? "auto" : "none",
								zIndex: active ? 1 : 0,
							}}
						>
							{sectionId === "experience" && (
								<div>
									<article className="pb-2">
										<div className="grid gap-5 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-8">
											<div>
												<p
													className="font-mono text-[11px] leading-5"
													style={{ color: theme.accent }}
												>
													{experience.period}
												</p>
												<p
													className="mt-1.5 text-xs leading-5"
													style={{ color: theme.textSec }}
												>
													{experience.company}
												</p>
											</div>
											<div>
												<h4
													className="text-lg font-semibold leading-6"
													style={{ color: theme.text }}
												>
													{experience.role}
												</h4>
												<p
													className="mt-6 border-y py-5 text-sm leading-[1.8]"
													style={{
														color: theme.textSec,
														borderColor: theme.borderLight,
													}}
												>
													{experience.summary}
												</p>
											</div>
										</div>
									</article>
									<div className="mt-4 flex max-w-2xl items-start gap-3">
										<span
											aria-hidden="true"
											className="mt-[0.6rem] h-px w-6 shrink-0"
											style={{ backgroundColor: theme.accent }}
										/>
										<p
											className="text-[11px] leading-[1.7]"
											style={{ color: theme.textSec }}
										>
											{t("about.work.scopeNote")}
										</p>
									</div>
								</div>
							)}

							{sectionId === "skills" && (
								<div>
									{skills.map((category) => (
										<div
											key={category.label}
											className="grid gap-3 py-5 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-8"
											style={{
												borderBottom: `1px solid ${theme.border}`,
											}}
										>
											<p
												className="text-[11px] font-medium uppercase tracking-[0.08em]"
												style={{ color: theme.accent }}
											>
												{category.label}
											</p>
											<div className="flex flex-wrap gap-x-5 gap-y-2">
												{category.items.map((item) => (
													<span
														key={item}
														className="text-sm font-medium leading-5"
														style={{ color: theme.text }}
													>
														{item}
													</span>
												))}
											</div>
										</div>
									))}
								</div>
							)}
						</section>
					);
				})}
			</div>
		</section>
	);
}

export default function AboutPage({
	theme,
	onNavigate,
	aboutView,
	workSection,
	onWorkSectionChange,
}: {
	theme: Theme;
	onNavigate: (s: Section, sub?: AboutView) => void;
	aboutView?: AboutView;
	workSection: WorkSectionId;
	onWorkSectionChange: (section: WorkSectionId) => void;
}) {
	const { t } = useI18n();
	const view = aboutView ?? "work";
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

	const lifeCards = [
		{
			title: t("about.life.lifelongLearner"),
			desc: t("about.life.lifelongLearner.d"),
		},
		{ title: t("about.life.racing"), desc: t("about.life.racing.d") },
		{
			title: t("about.life.personalDev"),
			desc: t("about.life.personalDev.d"),
		},
		{ title: t("about.life.walking"), desc: t("about.life.walking.d") },
	];

	const favoriteMovie = {
		label: t("about.favorites.movie.pursuit"),
		title: t("about.favorites.movie.pursuit.title"),
		src: "assets/favorites/movie-the-pursuit-of-happyness.jpg",
		width: 1000,
		height: 1500,
	};

	const favoriteSong = {
		label: t("about.favorites.song.ferrari"),
		title: t("about.favorites.song.ferrari.title"),
		credit: t("about.favorites.song.ferrari.artist"),
		src: "assets/favorites/song-ferrari-bebe-rexha.jpg",
		width: 1200,
		height: 1200,
	};

	const quickStats = [
		{ label: t("about.current"), value: t("about.current.v") },
		{
			label: t("about.location"),
			value: t("about.location.v"),
			decoration: "globe" as const,
		},
		{ label: t("about.language"), value: t("about.language.v") },
	];

	const skills = [
		{ label: t("about.skills.lang"), items: ["C++"] },
		{
			label: t("about.skills.libs"),
			items: ["Qt", "OpenCV", "Eigen", "CUDA"],
		},
		{
			label: t("about.skills.domains"),
			items: [
				t("about.skills.domains.0"),
				t("about.skills.domains.1"),
				t("about.skills.domains.2"),
				t("about.skills.domains.3"),
			],
		},
	];

	return (
		<div className="max-w-5xl mx-auto px-4 pt-16 pb-10 sm:px-6 sm:pt-24 sm:pb-12 md:px-8 md:pt-32 md:pb-12">
			<AboutViewHeader
				view={view}
				theme={theme}
				onSwitch={() =>
					onNavigate("about", view === "work" ? "personal" : "work")
				}
			/>
			<AboutFaceTransition
				view={view}
				front={
					<EditorialWorkProfile
						theme={theme}
						skills={skills}
						activeSection={workSection}
						onActiveSectionChange={onWorkSectionChange}
					/>
				}
				back={
					<PersonalProfile
						theme={theme}
						lifeCards={lifeCards}
						quickStats={quickStats}
						principleGroups={principleGroups}
						valuesTitle={t("about.personal.values.title")}
						lifeLabel={t("about.life")}
						inspirationAlt={t("about.personal.inspiration.alt")}
						inspirationCaption={t("about.personal.inspiration.caption")}
						favoritesTitle={t("about.favorites")}
						moviesTitle={t("about.favorites.movies")}
						musicTitle={t("about.favorites.music")}
						movie={favoriteMovie}
						song={favoriteSong}
					/>
				}
			/>
		</div>
	);
}
