import { useEffect, useRef } from "react";
import { useI18n } from "../i18n";
import type { Section, Theme } from "../themes";

// Primary-gaze measurements: 6.4 ± 2.4 s between blinks (PMID: 12137399).
// Empirical inter-blink intervals follow a log-normal distribution (PMID: 20944934).
const BLINK_INTERVAL_MEAN_MS = 6400;
const BLINK_INTERVAL_SD_MS = 2400;
const BLINK_LOG_VARIANCE = Math.log(
	1 + (BLINK_INTERVAL_SD_MS / BLINK_INTERVAL_MEAN_MS) ** 2,
);
const BLINK_LOG_SIGMA = Math.sqrt(BLINK_LOG_VARIANCE);
const BLINK_LOG_MU = Math.log(BLINK_INTERVAL_MEAN_MS) - BLINK_LOG_VARIANCE / 2;

function sampleBlinkInterval() {
	const firstUniform = Math.max(Math.random(), Number.EPSILON);
	const secondUniform = Math.random();
	const standardNormal =
		Math.sqrt(-2 * Math.log(firstUniform)) *
		Math.cos(2 * Math.PI * secondUniform);
	return Math.round(Math.exp(BLINK_LOG_MU + BLINK_LOG_SIGMA * standardNormal));
}

function SmileyAvatar({ theme }: { theme: Theme }) {
	const faceRef = useRef<HTMLDivElement>(null);
	const eyesRef = useRef<HTMLDivElement>(null);
	const eyeShapeRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const face = faceRef.current;
		const eyes = eyesRef.current;
		const eyeShape = eyeShapeRef.current;
		if (!face || !eyes || !eyeShape) return;

		const gazeQuery = window.matchMedia(
			"(min-width: 768px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
		);
		let centerX = 0;
		let centerY = 0;
		let currentX = 0;
		let currentY = 0;
		let targetX = 0;
		let targetY = 0;
		let frameId: number | null = null;
		let blinkTimer: number | null = null;
		let tracking = false;

		const updateCenter = () => {
			const bounds = face.getBoundingClientRect();
			centerX = bounds.left + bounds.width / 2;
			centerY = bounds.top + bounds.height / 2;
		};

		const renderGaze = () => {
			currentX += (targetX - currentX) * 0.14;
			currentY += (targetY - currentY) * 0.14;
			eyes.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;

			if (
				Math.abs(targetX - currentX) > 0.01 ||
				Math.abs(targetY - currentY) > 0.01
			) {
				frameId = window.requestAnimationFrame(renderGaze);
			} else {
				frameId = null;
			}
		};

		const scheduleGaze = () => {
			if (frameId === null) {
				frameId = window.requestAnimationFrame(renderGaze);
			}
		};

		const followPointer = (event: PointerEvent) => {
			const horizontalRange = Math.max(window.innerWidth * 0.45, 1);
			const verticalRange = Math.max(window.innerHeight * 0.5, 1);
			const horizontalIntent = Math.max(
				-1,
				Math.min(1, (event.clientX - centerX) / horizontalRange),
			);
			const verticalIntent = Math.max(
				-1,
				Math.min(1, (event.clientY - centerY) / verticalRange),
			);

			targetX = horizontalIntent * 6;
			targetY = verticalIntent * 3;
			scheduleGaze();
		};

		const returnToCenter = () => {
			targetX = 0;
			targetY = 0;
			scheduleGaze();
		};

		const handlePointerOut = (event: PointerEvent) => {
			if (event.relatedTarget === null) returnToCenter();
		};

		const scheduleBlink = () => {
			if (blinkTimer !== null) window.clearTimeout(blinkTimer);
			blinkTimer = window.setTimeout(() => {
				blinkTimer = null;
				eyeShape.classList.add("home-avatar-eyes-blinking");
			}, sampleBlinkInterval());
		};

		const handleBlinkEnd = () => {
			eyeShape.classList.remove("home-avatar-eyes-blinking");
			scheduleBlink();
		};

		const startTracking = () => {
			if (tracking) return;
			tracking = true;
			updateCenter();
			window.addEventListener("pointermove", followPointer, { passive: true });
			window.addEventListener("pointerout", handlePointerOut);
			window.addEventListener("resize", updateCenter);
			window.addEventListener("scroll", updateCenter, { passive: true });
			window.addEventListener("blur", returnToCenter);
			eyeShape.addEventListener("animationend", handleBlinkEnd);
			scheduleBlink();
		};

		const stopTracking = () => {
			if (!tracking) return;
			tracking = false;
			window.removeEventListener("pointermove", followPointer);
			window.removeEventListener("pointerout", handlePointerOut);
			window.removeEventListener("resize", updateCenter);
			window.removeEventListener("scroll", updateCenter);
			window.removeEventListener("blur", returnToCenter);
			eyeShape.removeEventListener("animationend", handleBlinkEnd);
			if (blinkTimer !== null) window.clearTimeout(blinkTimer);
			if (frameId !== null) window.cancelAnimationFrame(frameId);
			blinkTimer = null;
			frameId = null;
			currentX = 0;
			currentY = 0;
			targetX = 0;
			targetY = 0;
			eyes.style.transform = "translate3d(0, 0, 0)";
			eyeShape.classList.remove("home-avatar-eyes-blinking");
		};

		const syncTracking = () => {
			if (gazeQuery.matches) startTracking();
			else stopTracking();
		};

		gazeQuery.addEventListener("change", syncTracking);
		syncTracking();

		return () => {
			gazeQuery.removeEventListener("change", syncTracking);
			stopTracking();
		};
	}, []);

	const mask = `url(${import.meta.env.BASE_URL}assets/avatar.svg) center/contain no-repeat`;

	return (
		<div
			ref={faceRef}
			className="relative h-[280px] w-[280px] opacity-10 pointer-events-none lg:h-[400px] lg:w-[400px]"
			style={{ transform: "rotate(6deg)" }}
		>
			<div
				className="absolute inset-0"
				style={{
					WebkitMask: mask,
					mask,
					backgroundColor: theme.accent,
					clipPath: "inset(48% 0 0)",
				}}
			/>
			<div ref={eyesRef} className="absolute inset-0 will-change-transform">
				<div
					ref={eyeShapeRef}
					className="absolute inset-0 will-change-transform"
					style={{
						WebkitMask: mask,
						mask,
						backgroundColor: theme.accent,
						clipPath: "inset(0 0 52% 0)",
						transformOrigin: "50% 39%",
					}}
				/>
			</div>
		</div>
	);
}

export default function HomePage({
	theme,
}: { theme: Theme; onNavigate: (s: Section) => void }) {
	const { t } = useI18n();
	return (
		<div className="relative flex min-h-[calc(100svh-4rem)] flex-col justify-center overflow-hidden py-24 md:min-h-[calc(100svh-5rem)] md:py-20">
			<div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 w-full relative z-10">
				<div className="grid grid-cols-1 items-center gap-8 md:grid-cols-[minmax(0,25rem)_16rem] md:justify-center md:gap-0 lg:grid-cols-[minmax(0,32rem)_25rem]">
					<div className="motion-safe:[animation:fade-up_350ms_ease-out_both]">
						<p
							className="text-[13px] font-semibold tracking-[0.13em]"
							style={{ color: theme.accent }}
						>
							{t("home.role")}
						</p>
						<h1
							className="mt-6 text-6xl font-semibold leading-none tracking-[-0.045em] md:text-7xl lg:text-[5.5rem]"
							style={{ color: theme.text }}
						>
							{t("home.name")}
						</h1>

						<div className="mt-12 grid max-w-lg gap-8 sm:grid-cols-2 sm:gap-12">
							<div>
								<p
									className="text-[11px] font-semibold tracking-[0.16em]"
									style={{ color: theme.textSec }}
								>
									{t("home.focusLabel")}
								</p>
								<p
									className="mt-2 text-[15px] font-medium leading-6"
									style={{ color: theme.text }}
								>
									{t("home.focus")}
								</p>
							</div>
							<div>
								<p
									className="text-[11px] font-semibold tracking-[0.16em]"
									style={{ color: theme.textSec }}
								>
									{t("home.nowLabel")}
								</p>
								<div
									className="mt-2 flex items-center gap-2.5 text-[15px] leading-6"
									style={{ color: theme.text }}
								>
									<span
										aria-hidden="true"
										className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center"
									>
										<span
											className="absolute inline-flex h-full w-full rounded-full opacity-75 motion-safe:animate-ping"
											style={{ backgroundColor: theme.accent }}
										/>
										<span
											className="relative inline-flex h-2 w-2 rounded-full"
											style={{ backgroundColor: theme.accent }}
										/>
									</span>
									<p>{t("home.status")}</p>
								</div>
							</div>
						</div>
					</div>

					<div className="hidden items-center justify-center pt-6 motion-safe:[animation:fade-in_450ms_ease-out_80ms_both] md:-ml-6 md:flex lg:-ml-12 lg:pt-8">
						<SmileyAvatar theme={theme} />
					</div>
				</div>
			</div>
		</div>
	);
}
