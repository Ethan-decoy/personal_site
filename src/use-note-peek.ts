import { useCallback, useEffect, useRef, useState } from "react";
import type { NoteLinkTarget } from "./notes";

export type NotePeekActivation = "hover" | "focus" | "press";

interface PeekState {
	key: number;
	target: NoteLinkTarget;
	trigger: HTMLAnchorElement;
	activation: NotePeekActivation;
}

const OPEN_DELAY = 180;
const CLOSE_DELAY = 240;

export function useNotePeek(
	sourceFile: string | null,
	preload: (file: string) => Promise<void>,
) {
	const [peek, setPeek] = useState<PeekState | null>(null);
	const activePeek = useRef<PeekState | null>(null);
	const nextKey = useRef(0);
	const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const hoveredTrigger = useRef<HTMLAnchorElement | null>(null);
	const focusedTrigger = useRef<HTMLAnchorElement | null>(null);
	const dismissedPointer = useRef<HTMLAnchorElement | null>(null);
	const dismissedFocus = useRef<HTMLAnchorElement | null>(null);
	const mousePosition = useRef<{ x: number; y: number } | null>(null);

	useEffect(() => {
		const trackMouse = (event: PointerEvent) => {
			if (event.pointerType === "mouse") {
				mousePosition.current = { x: event.clientX, y: event.clientY };
			}
		};
		const leaveDocument = (event: PointerEvent) => {
			if (event.pointerType === "mouse" && event.relatedTarget === null) {
				mousePosition.current = null;
			}
		};
		document.addEventListener("pointermove", trackMouse, { passive: true });
		document.addEventListener("pointerdown", trackMouse, { passive: true });
		document.addEventListener("pointerout", leaveDocument, { passive: true });
		return () => {
			document.removeEventListener("pointermove", trackMouse);
			document.removeEventListener("pointerdown", trackMouse);
			document.removeEventListener("pointerout", leaveDocument);
		};
	}, []);

	const cancelOpen = useCallback(() => {
		if (openTimer.current !== null) clearTimeout(openTimer.current);
		openTimer.current = null;
	}, []);
	const keepOpen = useCallback(() => {
		if (closeTimer.current !== null) clearTimeout(closeTimer.current);
		closeTimer.current = null;
	}, []);
	const updatePeek = useCallback((next: PeekState | null) => {
		activePeek.current = next;
		setPeek(next);
	}, []);

	const closePeek = useCallback(() => {
		cancelOpen();
		keepOpen();
		const trigger = activePeek.current?.trigger;
		if (trigger) {
			const pointer = mousePosition.current;
			const rect = trigger.getBoundingClientRect();
			// Closing a card can uncover its source beneath a stationary pointer.
			const pointerOverSource =
				pointer &&
				pointer.x >= rect.left &&
				pointer.x <= rect.right &&
				pointer.y >= rect.top &&
				pointer.y <= rect.bottom;
			dismissedPointer.current =
				hoveredTrigger.current === trigger || pointerOverSource
					? trigger
					: null;
			// Restoring focus after an explicit dismissal must not reopen the card.
			dismissedFocus.current = trigger;
		}
		updatePeek(null);
	}, [cancelOpen, keepOpen, updatePeek]);

	const scheduleClose = useCallback(() => {
		cancelOpen();
		keepOpen();
		closeTimer.current = setTimeout(() => {
			closeTimer.current = null;
			const current = activePeek.current;
			if (
				!current ||
				hoveredTrigger.current === current.trigger ||
				focusedTrigger.current === current.trigger ||
				(current.activation === "press" &&
					document.activeElement === current.trigger) ||
				document.activeElement?.closest(".note-peek")
			)
				return;
			updatePeek(null);
		}, CLOSE_DELAY);
	}, [cancelOpen, keepOpen, updatePeek]);

	const openPeek = useCallback(
		(
			target: NoteLinkTarget,
			trigger: HTMLAnchorElement,
			activation: NotePeekActivation = "press",
		) => {
			if (
				!sourceFile ||
				sourceFile.endsWith("/_index.md") ||
				target.file === sourceFile
			)
				return;
			cancelOpen();
			keepOpen();
			if (
				(activation === "hover" && dismissedPointer.current === trigger) ||
				(activation === "focus" && dismissedFocus.current === trigger)
			)
				return;

			void preload(target.file).catch(() => undefined);
			const reveal = () => {
				openTimer.current = null;
				if (!trigger.isConnected) return;
				const current = activePeek.current;
				if (
					current?.trigger === trigger &&
					current.target.file === target.file &&
					current.target.anchor === target.anchor
				) {
					if (activation === "press" && current.activation !== "press") {
						updatePeek({ ...current, activation });
					}
					return;
				}
				if (current) dismissedFocus.current = current.trigger;
				updatePeek({ key: ++nextKey.current, target, trigger, activation });
			};
			if (activation === "press") {
				dismissedPointer.current = null;
				dismissedFocus.current = null;
				reveal();
			} else {
				openTimer.current = setTimeout(reveal, OPEN_DELAY);
			}
		},
		[cancelOpen, keepOpen, preload, sourceFile, updatePeek],
	);

	const onNoteLinkPointerEnter = useCallback(
		(target: NoteLinkTarget, trigger: HTMLAnchorElement) => {
			hoveredTrigger.current = trigger;
			openPeek(target, trigger, "hover");
		},
		[openPeek],
	);
	const onNoteLinkPointerLeave = useCallback(
		(trigger: HTMLAnchorElement) => {
			if (hoveredTrigger.current === trigger) hoveredTrigger.current = null;
			if (dismissedPointer.current === trigger) dismissedPointer.current = null;
			scheduleClose();
		},
		[scheduleClose],
	);
	const onNoteLinkFocus = useCallback(
		(target: NoteLinkTarget, trigger: HTMLAnchorElement) => {
			focusedTrigger.current = trigger;
			openPeek(target, trigger, "focus");
		},
		[openPeek],
	);
	const onNoteLinkBlur = useCallback(
		(trigger: HTMLAnchorElement, relatedTarget: EventTarget | null) => {
			if (focusedTrigger.current === trigger) focusedTrigger.current = null;
			if (dismissedFocus.current === trigger) dismissedFocus.current = null;
			if (
				relatedTarget instanceof Element &&
				relatedTarget.closest(".note-peek")
			) {
				keepOpen();
			} else {
				scheduleClose();
			}
		},
		[keepOpen, scheduleClose],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: A source change invalidates every pending preview interaction.
	useEffect(() => {
		cancelOpen();
		keepOpen();
		updatePeek(null);
		hoveredTrigger.current = null;
		focusedTrigger.current = null;
		dismissedPointer.current = null;
		dismissedFocus.current = null;
		return () => {
			cancelOpen();
			keepOpen();
		};
	}, [sourceFile, cancelOpen, keepOpen, updatePeek]);

	return {
		peek,
		openPeek,
		closePeek,
		keepOpen,
		scheduleClose,
		onNoteLinkPointerEnter,
		onNoteLinkPointerLeave,
		onNoteLinkFocus,
		onNoteLinkBlur,
	};
}
