import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { type Section, type Theme } from "../themes";
import { SectionTitle, Tag } from "../components";
import { useI18n } from "../i18n";

type AboutView = "personal" | "work";

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
	const current = views.find((v) => v.key === view)!;

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
	const [valuesExpanded, setValuesExpanded] = useState(false);
	const [valuesContentOpen, setValuesContentOpen] = useState(false);
	const [valuesHovered, setValuesHovered] = useState(false);
	const [hoveredDimension, setHoveredDimension] = useState<string | null>(null);
	const [blindspotsExpanded, setBlindspotsExpanded] = useState(false);
	const [blindspotsContentOpen, setBlindspotsContentOpen] = useState(false);
	const [blindspotsHovered, setBlindspotsHovered] = useState(false);
	const [hoveredRelTrait, setHoveredRelTrait] = useState<string | null>(null);

	const values = [
		{ title: t("about.values.root"), desc: t("about.values.root.d") },
		{ title: t("about.values.energy"), desc: t("about.values.energy.d") },
		{
			title: t("about.values.resilience"),
			desc: t("about.values.resilience.d"),
		},
		{
			title: t("about.values.excellence"),
			desc: t("about.values.excellence.d"),
		},
		{ title: t("about.values.learning"), desc: t("about.values.learning.d") },
		{
			title: t("about.values.independence"),
			desc: t("about.values.independence.d"),
		},
	];

	const toggleValues = () => {
		if (!valuesExpanded) {
			setValuesExpanded(true);
			setTimeout(() => setValuesContentOpen(true), 100);
		} else {
			setValuesContentOpen(false);
			setTimeout(() => setValuesExpanded(false), 300);
		}
	};

	const lifeCards = [
		{ title: t("about.life.learner"), desc: t("about.life.learner.d") },
		{ title: t("about.life.google"), desc: t("about.life.google.d") },
		{ title: t("about.life.racing"), desc: t("about.life.racing.d") },
		{ title: t("about.life.ad"), desc: t("about.life.ad.d") },
		{ title: t("about.life.communism"), desc: t("about.life.communism.d") },
		{ title: t("about.life.walking"), desc: t("about.life.walking.d") },
	];

	const quickStats = [
		{ label: t("about.location"), value: t("about.location.v") },
		{ label: t("about.language"), value: t("about.language.v") },
		{ label: "MBTI", value: "INTJ-T" },
		{ label: t("about.current"), value: t("about.current.v") },
	];

	const mbtiDims = [
		{
			key: "I",
			label: t("mbti.I"),
			pct: 86,
			left: t("mbti.I.left"),
			right: t("mbti.I.right"),
			color: "#5A7A82",
			desc: t("mbti.I.d"),
		},
		{
			key: "N",
			label: t("mbti.N"),
			pct: 58,
			left: t("mbti.N.left"),
			right: t("mbti.N.right"),
			color: "#B8944F",
			desc: t("mbti.N.d"),
		},
		{
			key: "T",
			label: t("mbti.T"),
			pct: 85,
			left: t("mbti.T.left"),
			right: t("mbti.T.right"),
			color: "#5E8268",
			desc: t("mbti.T.d"),
		},
		{
			key: "J",
			label: t("mbti.J"),
			pct: 71,
			left: t("mbti.J.left"),
			right: t("mbti.J.right"),
			color: "#7B6B8B",
			desc: t("mbti.J.d"),
		},
		{
			key: "T2",
			label: t("mbti.T2"),
			pct: 51,
			left: t("mbti.T2.left"),
			right: t("mbti.T2.right"),
			color: "#A06060",
			desc: t("mbti.T2.d"),
		},
	];

	const pros = [
		{ title: t("about.rel.calm"), detail: t("about.rel.calm.d") },
		{ title: t("about.rel.deep"), detail: t("about.rel.deep.d") },
		{ title: t("about.rel.partner"), detail: t("about.rel.partner.d") },
		{ title: t("about.rel.growth"), detail: t("about.rel.growth.d") },
	];
	const cons = [
		{ title: t("about.rel.distant"), detail: t("about.rel.distant.d") },
		{ title: t("about.rel.control"), detail: t("about.rel.control.d") },
		{ title: t("about.rel.impatient"), detail: t("about.rel.impatient.d") },
		{ title: t("about.rel.isolation"), detail: t("about.rel.isolation.d") },
	];

	const skills = [
		{
			label: t("about.skills.algo"),
			items: [
				t("about.skills.algo.0"),
				t("about.skills.algo.1"),
				"OpenCV",
				"Eigen",
			],
		},
		{ label: t("about.skills.dev"), items: ["C++", "Python", "Qt Widgets"] },
		{ label: t("about.skills.eng"), items: ["Git", t("about.skills.eng.1")] },
	];

	return (
		<div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-24 md:py-32">
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
					<div className="flex flex-col md:flex-row gap-8 md:gap-12">
						<div className="w-full md:flex-[2]">
							<div
								className="mb-6 md:mb-8 rounded-2xl overflow-hidden"
								style={{
									border: `1px solid ${theme.borderLight}`,
									aspectRatio: "16/9",
									backgroundColor: theme.bgDeep,
								}}
							>
								<img
									src={`${import.meta.env.BASE_URL}assets/qian_xuesen_yuan_longping_style.jpg`}
									alt=""
									className="w-full h-full object-cover"
									loading="lazy"
									decoding="async"
									style={{ objectPosition: "center 30%" }}
								/>
							</div>
							<h3
								className="text-sm font-semibold tracking-wider uppercase mb-5"
								style={{ color: theme.text }}
							>
								{t("about.life")}
							</h3>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
								{lifeCards.map((item) => (
									<div
										key={item.title}
										className="p-5 rounded-2xl"
										style={{
											backgroundColor: theme.bgDeep,
											border: `1px solid ${theme.borderLight}`,
										}}
									>
										<p
											className="text-sm font-semibold mb-1"
											style={{ color: theme.text }}
										>
											{item.title}
										</p>
										<p className="text-sm" style={{ color: theme.textSec }}>
											{item.desc}
										</p>
									</div>
								))}
							</div>
						</div>

						<div className="w-full md:flex-1">
							<div className="space-y-6 mb-12" style={{ color: theme.textSec }}>
								{quickStats.map((item) => (
									<div key={item.label}>
										<p
											className="text-xs tracking-wider uppercase mb-1"
											style={{ color: theme.text }}
										>
											{item.label}
										</p>
										<p className="text-sm">{item.value}</p>
									</div>
								))}
							</div>

							<div className="mb-4">
								<h3
									className="text-sm font-semibold tracking-wider uppercase mb-5"
									style={{ color: theme.text }}
								>
									MBTI
								</h3>
								<div className="space-y-4">
									{mbtiDims.map((d) => (
										<div
											key={d.key}
											className="relative cursor-pointer"
											onMouseEnter={() => setHoveredDimension(d.key)}
											onMouseLeave={() => setHoveredDimension(null)}
										>
											<p
												className="text-center text-xs font-medium mb-1.5"
												style={{
													color:
														hoveredDimension === d.key
															? d.color
															: `${d.color}cc`,
												}}
											>
												{d.pct}% {d.label}
											</p>
											<div
												className="relative h-2 rounded-full overflow-hidden"
												style={{ backgroundColor: theme.border }}
											>
												<div
													className="absolute left-0 top-0 h-full rounded-full"
													style={{
														width: `${d.pct}%`,
														backgroundColor: d.color,
														filter:
															hoveredDimension === d.key
																? "none"
																: "brightness(0.8)",
														transition: "filter 0.25s ease-out",
													}}
												/>
											</div>
											<div className="flex justify-between mt-1">
												<span
													className="text-xs"
													style={{ color: theme.textSec, opacity: 0.5 }}
												>
													{d.left}
												</span>
												<span
													className="text-xs"
													style={{ color: theme.textSec, opacity: 0.5 }}
												>
													{d.right}
												</span>
											</div>
											<div
												className="absolute md:left-[calc(100%+20px)] md:top-0 left-0 top-full mt-2 w-72 max-w-full rounded-xl p-5 pointer-events-none z-10"
												style={{
													backgroundColor: theme.bgDeep,
													border: `1px solid ${theme.border}`,
													boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
													opacity: hoveredDimension === d.key ? 1 : 0,
													transform:
														hoveredDimension === d.key
															? "translateX(0)"
															: "translateX(-8px)",
													transition:
														"opacity 0.25s ease-out, transform 0.25s ease-out",
												}}
											>
												<p
													className="text-xs font-medium mb-2"
													style={{ color: d.color }}
												>
													{d.label}
												</p>
												<p
													className="text-sm leading-relaxed"
													style={{ color: theme.textSec }}
												>
													{d.desc}
												</p>
											</div>
										</div>
									))}
								</div>
								<p
									className="text-[10px] mt-4 text-center"
									style={{ color: theme.textSec, opacity: 0.4 }}
								>
									{t("about.mbti.footer")}
								</p>
							</div>
						</div>
					</div>

					<div className="mt-12">
						<div
							className="rounded-2xl cursor-pointer select-none transition-all duration-200 ease-out"
							onClick={toggleValues}
							style={{
								backgroundColor: theme.bgDeep,
								border: `1px solid ${valuesHovered || valuesExpanded ? theme.border : theme.borderLight}`,
								boxShadow: valuesExpanded
									? "0 2px 8px rgba(0,0,0,0.04)"
									: "none",
							}}
							onMouseEnter={() => setValuesHovered(true)}
							onMouseLeave={() => setValuesHovered(false)}
						>
							<div className="flex items-center justify-between px-3 py-3 sm:px-5 sm:py-4">
								<span
									className="text-sm font-semibold tracking-wider uppercase"
									style={{ color: theme.text }}
								>
									{t("about.values")}
								</span>
								<svg
									className="w-4 h-4 transition-transform duration-300 ease-out"
									style={{
										transform: valuesExpanded
											? "rotate(180deg)"
											: "rotate(0deg)",
										color: theme.textSec,
									}}
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									strokeWidth="1.5"
								>
									<path d="M4 6l4 4 4-4" />
								</svg>
							</div>
							<div
								className="overflow-hidden"
								style={{
									transition: "max-height 0.7s ease-out",
									maxHeight: valuesContentOpen ? "600px" : "0px",
								}}
							>
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 px-3 pb-3 sm:px-5 sm:pb-5">
									{values.map((v) => (
										<div
											key={v.title}
											className="p-4 rounded-xl"
											style={{
												backgroundColor: theme.bgCard || theme.bg,
												border: `1px solid ${theme.borderLight}`,
											}}
										>
											<p
												className="text-sm font-semibold mb-1"
												style={{ color: theme.text }}
											>
												{v.title}
											</p>
											<p className="text-sm" style={{ color: theme.textSec }}>
												{v.desc}
											</p>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>

					<div className="mt-12">
						<div
							className="rounded-2xl cursor-pointer select-none transition-all duration-200 ease-out"
							onClick={() => {
								if (!blindspotsExpanded) {
									setBlindspotsExpanded(true);
									setTimeout(() => setBlindspotsContentOpen(true), 100);
								} else {
									setBlindspotsContentOpen(false);
									setTimeout(() => setBlindspotsExpanded(false), 300);
								}
							}}
							style={{
								backgroundColor: theme.bgDeep,
								border: `1px solid ${blindspotsHovered || blindspotsExpanded ? theme.border : theme.borderLight}`,
								boxShadow: blindspotsExpanded
									? "0 2px 8px rgba(0,0,0,0.04)"
									: "none",
							}}
							onMouseEnter={() => setBlindspotsHovered(true)}
							onMouseLeave={() => setBlindspotsHovered(false)}
						>
							<div className="flex items-center justify-between px-3 py-3 sm:px-5 sm:py-4">
								<span
									className="text-sm font-semibold tracking-wider uppercase"
									style={{ color: theme.text }}
								>
									{t("about.interpersonal")}
								</span>
								<svg
									className="w-4 h-4 transition-transform duration-300 ease-out"
									style={{
										transform: blindspotsExpanded
											? "rotate(180deg)"
											: "rotate(0deg)",
										color: theme.textSec,
									}}
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									strokeWidth="1.5"
								>
									<path d="M4 6l4 4 4-4" />
								</svg>
							</div>
							<div
								className="overflow-hidden"
								style={{
									transition: "max-height 0.7s ease-out",
									maxHeight: blindspotsContentOpen ? "1000px" : "0px",
								}}
							>
								<div className="grid grid-cols-1 gap-3 md:gap-4 px-3 pb-3 sm:px-5 sm:pb-5">
									<div className="space-y-3">
										<div className="flex items-center gap-2 mb-1">
											<span
												className="inline-block w-2 h-2 rounded-full"
												style={{ backgroundColor: "#5E8268" }}
											/>
											<p
												className="text-xs tracking-wider uppercase"
												style={{ color: theme.text }}
											>
												{t("about.interpersonal.pros")}
											</p>
										</div>
										{pros.map((item) => (
											<div
												key={item.title}
												className="p-4 rounded-xl cursor-pointer"
												style={{
													backgroundColor: "rgba(94, 130, 104, 0.06)",
													borderTop: `1px solid ${hoveredRelTrait === item.title ? "rgba(94, 130, 104, 0.3)" : "rgba(94, 130, 104, 0.12)"}`,
													borderRight: `1px solid ${hoveredRelTrait === item.title ? "rgba(94, 130, 104, 0.3)" : "rgba(94, 130, 104, 0.12)"}`,
													borderBottom: `1px solid ${hoveredRelTrait === item.title ? "rgba(94, 130, 104, 0.3)" : "rgba(94, 130, 104, 0.12)"}`,
													borderLeft: `4px solid rgba(94, 130, 104, 0.5)`,
													transition: "border-color 0.2s ease-out",
												}}
												onMouseEnter={() => setHoveredRelTrait(item.title)}
												onMouseLeave={() => setHoveredRelTrait(null)}
												onClick={(e) => {
													e.stopPropagation();
													setHoveredRelTrait(
														hoveredRelTrait === item.title ? null : item.title,
													);
												}}
											>
												<p
													className="text-sm font-semibold"
													style={{ color: theme.text }}
												>
													{item.title}
												</p>
												<div
													className="overflow-hidden"
													style={{
														transition:
															"max-height 0.5s ease-out, opacity 0.4s ease-out",
														maxHeight:
															hoveredRelTrait === item.title ? "100px" : "0px",
														opacity: hoveredRelTrait === item.title ? 1 : 0,
													}}
												>
													<p
														className="text-sm leading-relaxed pt-2"
														style={{ color: theme.textSec }}
													>
														{item.detail}
													</p>
												</div>
											</div>
										))}
									</div>
									<div className="space-y-3">
										<div className="flex items-center gap-2 mb-1">
											<span
												className="inline-block w-2 h-2 rounded-full"
												style={{ backgroundColor: "#A06060" }}
											/>
											<p
												className="text-xs tracking-wider uppercase"
												style={{ color: theme.text }}
											>
												{t("about.interpersonal.cons")}
											</p>
										</div>
										{cons.map((item) => (
											<div
												key={item.title}
												className="p-4 rounded-xl cursor-pointer"
												style={{
													backgroundColor: "rgba(160, 96, 96, 0.06)",
													borderTop: `1px solid ${hoveredRelTrait === item.title ? "rgba(160, 96, 96, 0.3)" : "rgba(160, 96, 96, 0.12)"}`,
													borderRight: `1px solid ${hoveredRelTrait === item.title ? "rgba(160, 96, 96, 0.3)" : "rgba(160, 96, 96, 0.12)"}`,
													borderBottom: `1px solid ${hoveredRelTrait === item.title ? "rgba(160, 96, 96, 0.3)" : "rgba(160, 96, 96, 0.12)"}`,
													borderLeft: `4px solid rgba(160, 96, 96, 0.5)`,
													transition: "border-color 0.2s ease-out",
												}}
												onMouseEnter={() => setHoveredRelTrait(item.title)}
												onMouseLeave={() => setHoveredRelTrait(null)}
												onClick={(e) => {
													e.stopPropagation();
													setHoveredRelTrait(
														hoveredRelTrait === item.title ? null : item.title,
													);
												}}
											>
												<p
													className="text-sm font-semibold"
													style={{ color: theme.text }}
												>
													{item.title}
												</p>
												<div
													className="overflow-hidden"
													style={{
														transition:
															"max-height 0.5s ease-out, opacity 0.4s ease-out",
														maxHeight:
															hoveredRelTrait === item.title ? "100px" : "0px",
														opacity: hoveredRelTrait === item.title ? 1 : 0,
													}}
												>
													<p
														className="text-sm leading-relaxed pt-2"
														style={{ color: theme.textSec }}
													>
														{item.detail}
													</p>
												</div>
											</div>
										))}
									</div>
								</div>
							</div>
						</div>
					</div>
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
											t("about.exp.d1"),
											t("about.exp.d2"),
											t("about.exp.d3"),
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
