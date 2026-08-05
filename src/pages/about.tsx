import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SectionTitle, Tag } from "../components";
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
						className="block h-auto w-full rounded-2xl"
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
					<dl className="grid grid-cols-2 gap-3">
						{quickStats.map((item, index) => (
							<div
								key={item.label}
								className={`relative overflow-hidden rounded-xl px-3.5 py-3 ${index === 0 ? "col-span-2" : ""}`}
								style={{
									backgroundColor: theme.accentLight,
									border: `1px solid ${theme.borderLight}`,
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
						className="mt-7 flex-1 overflow-hidden rounded-2xl"
						style={{
							backgroundColor: theme.bgCard,
							border: `1px solid ${theme.border}`,
							boxShadow: "0 8px 24px rgba(24,40,32,0.04)",
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
									className="rounded-xl p-4"
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

function ViewSwitcher({
	view,
	theme,
	onSelect,
}: { view: AboutView; theme: Theme; onSelect: (v: AboutView) => void }) {
	const { t } = useI18n();
	const [open, setOpen] = useState(false);
	const btnRef = useRef<HTMLButtonElement>(null);
	const wrapperRef = useRef<HTMLDivElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);
	const views: { key: AboutView; label: string }[] = [
		{ key: "work", label: t("about.view.work") },
		{ key: "personal", label: t("about.view.personal") },
	];
	const current = views.find((v) => v.key === view) ?? views[0];

	useEffect(() => {
		if (!open) return;
		const handler = (e: MouseEvent) => {
			const target = e.target as Node;
			if (
				!wrapperRef.current?.contains(target) &&
				!panelRef.current?.contains(target)
			)
				setOpen(false);
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [open]);

	const [rect, setRect] = useState<DOMRect | null>(null);
	useEffect(() => {
		if (!open || !btnRef.current) return;
		setRect(btnRef.current.getBoundingClientRect());
	}, [open]);

	const dropdown = open ? (
		<div
			ref={panelRef}
			style={{
				position: "fixed",
				top: rect ? `${rect.bottom + 6}px` : 0,
				left: rect ? `${rect.left}px` : 0,
				minWidth: rect ? `${rect.width}px` : "auto",
				zIndex: 100,
				animation: "fade-up 150ms ease-out both",
				backgroundColor: theme.bg,
				border: `1px solid ${theme.border}`,
				borderRadius: "12px",
				boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
				padding: "4px",
			}}
		>
			{views.map((v) => (
				<button
					type="button"
					key={v.key}
					onClick={() => {
						onSelect(v.key);
						setOpen(false);
					}}
					className="w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ease-out"
					style={{
						color: view === v.key ? theme.accent : theme.textSec,
						backgroundColor: view === v.key ? theme.accentLight : "transparent",
					}}
				>
					{v.label}
				</button>
			))}
		</div>
	) : null;

	return (
		<div ref={wrapperRef} className="mb-3" style={{ width: "fit-content" }}>
			<button
				type="button"
				ref={btnRef}
				onClick={() => setOpen((v) => !v)}
				className="px-4 py-2 text-sm font-medium rounded-xl cursor-pointer transition-all duration-200 ease-out flex items-center gap-2"
				style={{
					color: theme.text,
					backgroundColor: theme.bg,
					borderColor: open ? theme.accent : theme.border,
					borderWidth: "1px",
					borderStyle: "solid",
					boxShadow: open
						? `0 4px 12px ${theme.border}`
						: "0 1px 2px rgba(0,0,0,0.05)",
					transform: open ? "translateY(-1px)" : "none",
				}}
			>
				{current.label}
				<svg
					aria-hidden="true"
					width="12"
					height="12"
					viewBox="0 0 12 12"
					fill="none"
					style={{
						transition: "transform 200ms ease-out",
						transform: open ? "rotate(180deg)" : "rotate(0deg)",
						color: theme.textSec,
					}}
				>
					<path
						d="M3 4.5L6 7.5L9 4.5"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			</button>
			{open && createPortal(dropdown, document.body)}
		</div>
	);
}

export default function AboutPage({
	theme,
	onNavigate,
	aboutView,
}: {
	theme: Theme;
	onNavigate: (s: Section, sub?: AboutView) => void;
	aboutView?: AboutView;
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
			<div
				style={{
					animation: "fade-up 0.6s ease-out both",
					animationDelay: "0ms",
				}}
			>
				<SectionTitle theme={theme}>{t("about.title")}</SectionTitle>
				<ViewSwitcher
					view={view}
					theme={theme}
					onSelect={(v) => onNavigate("about", v)}
				/>
			</div>

			{view === "personal" && (
				<div
					key="personal"
					style={{
						animation: "fade-up 0.6s ease-out both",
						animationDelay: "150ms",
					}}
				>
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
				</div>
			)}

			{view === "work" && (
				<div
					key="work"
					style={{
						animation: "fade-up 0.6s ease-out both",
						animationDelay: "150ms",
					}}
				>
					<div className="space-y-16">
						<div>
							<h3
								className="text-sm font-semibold tracking-wider uppercase mb-5"
								style={{ color: theme.text }}
							>
								{t("about.bio")}
							</h3>
							<div
								className="max-w-prose space-y-4"
								style={{ color: theme.textSec }}
							>
								<p className="text-lg leading-relaxed">{t("about.bio.p1")}</p>
								<p className="leading-relaxed">{t("about.bio.p2")}</p>
							</div>
						</div>

						<div>
							<h3
								className="text-sm font-semibold tracking-wider uppercase mb-5"
								style={{ color: theme.text }}
							>
								{t("about.exp")}
							</h3>
							<div className="space-y-4">
								{[
									{
										role: t("about.exp.role"),
										company: t("about.exp.company"),
										period: t("about.exp.period"),
										details: [
											t("about.exp.d0"),
											t("about.exp.d1"),
											t("about.exp.d2"),
										],
									},
								].map((exp) => (
									<div
										key={exp.role}
										className="p-6 rounded-2xl border"
										style={{
											backgroundColor: theme.bgDeep,
											borderColor: theme.border,
										}}
									>
										<div className="flex items-start justify-between mb-2">
											<div>
												<p
													className="text-base font-semibold"
													style={{ color: theme.text }}
												>
													{exp.role}
												</p>
												<p className="text-sm" style={{ color: theme.textSec }}>
													{exp.company}
												</p>
											</div>
											<span
												className="text-xs font-mono"
												style={{ color: theme.textSec }}
											>
												{exp.period}
											</span>
										</div>
										<ul
											className="mt-3 space-y-1.5"
											style={{ color: theme.textSec }}
										>
											{exp.details.map((d) => (
												<li
													key={d}
													className="text-sm leading-relaxed list-disc list-inside"
												>
													{d}
												</li>
											))}
										</ul>
									</div>
								))}
							</div>
						</div>

						<div>
							<h3
								className="text-sm font-semibold tracking-wider uppercase mb-5"
								style={{ color: theme.text }}
							>
								{t("about.skills")}
							</h3>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
								{skills.map((cat) => (
									<div
										key={cat.label}
										className="p-5 rounded-2xl"
										style={{
											backgroundColor: theme.bgDeep,
											border: `1px solid ${theme.borderLight}`,
										}}
									>
										<p
											className="text-xs tracking-wider uppercase mb-3"
											style={{ color: theme.text }}
										>
											{cat.label}
										</p>
										<div className="flex flex-wrap gap-2">
											{cat.items.map((t) => (
												<Tag key={t} theme={theme}>
													{t}
												</Tag>
											))}
										</div>
									</div>
								))}
							</div>
						</div>

						<div
							className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-6 rounded-2xl"
							style={{
								backgroundColor: theme.bgDeep,
								border: `1px solid ${theme.border}`,
							}}
						>
							<p className="text-sm" style={{ color: theme.textSec }}>
								{t("about.cta")}
							</p>
							<button
								type="button"
								className="px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ease-out"
								style={{
									color: theme.accent,
									border: `1px solid ${theme.border}`,
								}}
								onClick={() => onNavigate("contact")}
								onMouseEnter={(e) => {
									e.currentTarget.style.backgroundColor = theme.accentLight;
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.backgroundColor = "transparent";
								}}
							>
								{t("about.cta.btn")}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
