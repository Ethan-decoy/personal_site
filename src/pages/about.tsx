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
import PersonalLifePage, {
	type EntertainmentSectionId,
	type PersonalSectionId,
} from "./about-personal";

export type {
	EntertainmentSectionId,
	PersonalSectionId,
} from "./about-personal";
export { preloadPersonalImages } from "./about-personal";

type AboutView = "personal" | "work";

type AboutTransitionPhase = "idle" | "exiting" | "entering";

// 转场原型：验证“原位收笔、冷暖换色、内容显影”能否统一工作与生活两种气质。
const ABOUT_EXIT_DURATION = 90;
const ABOUT_PERSONAL_ENTRY_DURATION = 230;
const ABOUT_WORK_ENTRY_DURATION = 190;
const ABOUT_THEME_SETTLE_DURATION = 300;

function AboutViewHeader({
	view,
	theme,
	onSwitch,
	isSwitching,
}: {
	view: AboutView;
	theme: Theme;
	onSwitch: () => void;
	isSwitching: boolean;
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
		<header className="mb-12 flex min-h-10 items-center gap-4">
			<h2
				className="shrink-0 text-2xl font-bold tracking-tight motion-safe:transition-colors motion-safe:duration-300 motion-safe:ease-out"
				style={{ color: theme.text }}
			>
				{t("about.title")}
			</h2>
			<div
				aria-hidden="true"
				className="h-px min-w-4 flex-1 motion-safe:transition-colors motion-safe:duration-300 motion-safe:ease-out"
				style={{ backgroundColor: theme.borderLight }}
			/>
			<div className="flex shrink-0 items-center gap-3">
				<span
					className="text-xs font-medium tracking-[0.04em] motion-safe:transition-colors motion-safe:duration-300 motion-safe:ease-out"
					style={{ color: theme.textSec }}
					aria-live="polite"
				>
					{currentLabel}
				</span>
				<button
					type="button"
					onClick={onSwitch}
					disabled={isSwitching}
					onPointerEnter={(event) => {
						if (event.pointerType === "touch") return;
						setInkVisible(true);
					}}
					onPointerLeave={() => setInkVisible(false)}
					onPointerCancel={() => setInkVisible(false)}
					className={`relative isolate flex h-10 w-10 items-center justify-center overflow-hidden rounded-full outline-none motion-safe:transition-colors motion-safe:duration-300 motion-safe:ease-out focus-visible:outline-2 focus-visible:outline-offset-4 ${
						isSwitching ? "cursor-default" : "cursor-pointer"
					}`}
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
						className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-full transition-[clip-path] duration-[420ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] motion-reduce:transition-none"
						style={{
							clipPath: `circle(${inkVisible ? "160%" : "0"} at center)`,
						}}
					>
						<span
							className="flex h-full w-full items-center justify-center rounded-full motion-safe:transition-colors motion-safe:duration-300 motion-safe:ease-out"
							style={{
								backgroundColor: theme.accent,
								color: theme.bg,
							}}
						>
							{switchIcon}
						</span>
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
	phase,
	isSwitching,
}: {
	view: AboutView;
	front: ReactNode;
	back: ReactNode;
	phase: AboutTransitionPhase;
	isSwitching: boolean;
}) {
	const entryDuration =
		view === "personal"
			? ABOUT_PERSONAL_ENTRY_DURATION
			: ABOUT_WORK_ENTRY_DURATION;
	const isVisible = phase === "idle";

	return (
		<div
			aria-busy={isSwitching}
			data-about-transition={phase}
			data-about-view={view}
			style={{
				opacity: isVisible ? 1 : 0,
				pointerEvents: isSwitching ? "none" : undefined,
				transitionDuration:
					phase === "exiting"
						? `${ABOUT_EXIT_DURATION}ms`
						: phase === "entering"
							? "0ms"
							: `${entryDuration}ms`,
				transitionProperty: "opacity",
				transitionTimingFunction:
					phase === "exiting"
						? "cubic-bezier(0.4, 0, 1, 1)"
						: "cubic-bezier(0.22, 0.61, 0.36, 1)",
				willChange: isSwitching ? "opacity" : "auto",
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
	personalSection,
	onPersonalSectionChange,
	entertainmentSection,
	onEntertainmentSectionChange,
}: {
	theme: Theme;
	onNavigate: (s: Section, sub?: AboutView) => void;
	aboutView?: AboutView;
	workSection: WorkSectionId;
	onWorkSectionChange: (section: WorkSectionId) => void;
	personalSection: PersonalSectionId;
	onPersonalSectionChange: (section: PersonalSectionId) => void;
	entertainmentSection: EntertainmentSectionId;
	onEntertainmentSectionChange: (section: EntertainmentSectionId) => void;
}) {
	const { t } = useI18n();
	const view = aboutView ?? "work";
	const [transitionPhase, setTransitionPhase] =
		useState<AboutTransitionPhase>("idle");
	const [isViewSwitching, setIsViewSwitching] = useState(false);
	const switchInFlightRef = useRef(false);
	const pendingViewRef = useRef<AboutView | null>(null);
	const switchTimerRef = useRef<number | null>(null);
	const finishTimerRef = useRef<number | null>(null);
	const entryFrameRef = useRef<number | null>(null);

	useEffect(
		() => () => {
			if (switchTimerRef.current !== null)
				window.clearTimeout(switchTimerRef.current);
			if (finishTimerRef.current !== null)
				window.clearTimeout(finishTimerRef.current);
			if (entryFrameRef.current !== null)
				window.cancelAnimationFrame(entryFrameRef.current);
			switchInFlightRef.current = false;
			pendingViewRef.current = null;
		},
		[],
	);

	useLayoutEffect(() => {
		if (pendingViewRef.current !== view) return;

		setTransitionPhase("entering");
		entryFrameRef.current = window.requestAnimationFrame(() => {
			entryFrameRef.current = null;
			setTransitionPhase("idle");

			const entryDuration =
				view === "personal"
					? ABOUT_PERSONAL_ENTRY_DURATION
					: ABOUT_WORK_ENTRY_DURATION;
			finishTimerRef.current = window.setTimeout(
				() => {
					finishTimerRef.current = null;
					pendingViewRef.current = null;
					switchInFlightRef.current = false;
					setIsViewSwitching(false);
				},
				Math.max(entryDuration, ABOUT_THEME_SETTLE_DURATION),
			);
		});
	}, [view]);

	const switchAboutView = () => {
		if (switchInFlightRef.current) return;

		const nextView = view === "work" ? "personal" : "work";
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			onNavigate("about", nextView);
			return;
		}

		switchInFlightRef.current = true;
		pendingViewRef.current = nextView;
		setIsViewSwitching(true);
		setTransitionPhase("exiting");
		switchTimerRef.current = window.setTimeout(() => {
			switchTimerRef.current = null;
			onNavigate("about", nextView);
		}, ABOUT_EXIT_DURATION);
	};
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
		<div className="section-page-frame pb-10 sm:pb-12 md:pb-12">
			<AboutViewHeader
				view={view}
				theme={theme}
				onSwitch={switchAboutView}
				isSwitching={isViewSwitching}
			/>
			<AboutFaceTransition
				view={view}
				phase={transitionPhase}
				isSwitching={isViewSwitching}
				front={
					<EditorialWorkProfile
						theme={theme}
						skills={skills}
						activeSection={workSection}
						onActiveSectionChange={onWorkSectionChange}
					/>
				}
				back={
					<PersonalLifePage
						theme={theme}
						activeSection={personalSection}
						onActiveSectionChange={onPersonalSectionChange}
						entertainmentSection={entertainmentSection}
						onEntertainmentSectionChange={onEntertainmentSectionChange}
					/>
				}
			/>
		</div>
	);
}
