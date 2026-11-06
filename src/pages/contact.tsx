import { type CSSProperties, useEffect, useState } from "react";
import { useI18n } from "../i18n";
import type { Section, Theme, ThemeMode } from "../themes";

const TYPE_SPEED_MS = 20;
const TYPE_PUNCTUATION_PAUSE_MS = 36;
const TYPE_START_DELAY_MS = 460;

function nextCharacterDelay(character: string): number {
	return /[./@-]/.test(character) ? TYPE_PUNCTUATION_PAUSE_MS : TYPE_SPEED_MS;
}

function TypingText({
	text,
	delay = 0,
}: {
	text: string;
	delay?: number;
}) {
	const [visible, setVisible] = useState(0);
	const [started, setStarted] = useState(false);

	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			setVisible(text.length);
			setStarted(false);
			return;
		}

		setVisible(0);
		setStarted(false);
		let typingTimer: number | null = null;
		const startTimer = window.setTimeout(() => {
			setStarted(true);
			let nextIndex = 0;

			const revealNext = () => {
				nextIndex += 1;
				setVisible(nextIndex);
				if (nextIndex < text.length) {
					typingTimer = window.setTimeout(
						revealNext,
						nextCharacterDelay(text[nextIndex - 1]),
					);
				}
			};

			revealNext();
		}, delay);

		return () => {
			window.clearTimeout(startTimer);
			if (typingTimer !== null) window.clearTimeout(typingTimer);
		};
	}, [delay, text]);

	const caretVisible = started && visible < text.length;

	return (
		<span aria-hidden="true" className="contact-typing-line">
			{text.slice(0, visible)}
			<span
				className="contact-typing-caret"
				data-visible={caretVisible ? "true" : "false"}
			/>
		</span>
	);
}

export default function ContactPage({
	theme,
}: {
	theme: Theme;
	onNavigate: (s: Section) => void;
	mode?: ThemeMode;
}) {
	const { t } = useI18n();
	const contactStyle = {
		"--contact-text": theme.text,
		"--contact-text-sec": theme.textSec,
		"--contact-accent": theme.accent,
		"--contact-accent-hover": theme.accentHover,
		"--contact-border": theme.border,
	} as CSSProperties;
	const channels = [
		{
			label: t("contact.email"),
			value: "decoy.thievish318@passinbox.com",
			href: "mailto:decoy.thievish318@passinbox.com",
			external: false,
		},
		{
			label: t("contact.github"),
			value: "github.com/Ethan-decoy",
			href: "https://github.com/Ethan-decoy",
			external: true,
		},
	] as const;

	return (
		<section
			aria-labelledby="contact-heading"
			className="contact-page"
			style={contactStyle}
		>
			<div className="contact-shell">
				<div className="contact-composition">
					<header className="contact-page-heading">
						<h1 id="contact-heading">{t("contact.title")}</h1>
					</header>

					<div className="contact-body">
						<p className="contact-intro">{t("contact.desc")}</p>

						<ul className="contact-channels">
							{channels.map((item) => (
								<li key={item.href}>
									<a
										aria-label={`${item.label}: ${item.value}`}
										className="contact-channel"
										href={item.href}
										rel={item.external ? "noreferrer" : undefined}
										target={item.external ? "_blank" : undefined}
									>
										<span className="contact-channel-label">{item.label}</span>
										<span className="contact-channel-value">
											<TypingText
												delay={TYPE_START_DELAY_MS}
												text={item.value}
											/>
										</span>
									</a>
								</li>
							))}
						</ul>
					</div>
				</div>
			</div>
		</section>
	);
}
