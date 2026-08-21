export type ImageLoadPriority = "high" | "low" | "auto";

type ImageCacheEntry = {
	image: HTMLImageElement;
	promise: Promise<HTMLImageElement>;
};

type ImageFactory = () => HTMLImageElement;

export function createImageResourceCache(
	createImage: ImageFactory = () => new Image(),
) {
	const entries = new Map<string, ImageCacheEntry>();

	const prepare = (
		source: string,
		priority: ImageLoadPriority = "auto",
	): Promise<HTMLImageElement> => {
		const cached = entries.get(source);
		if (cached) {
			if (priority === "high" && cached.image.fetchPriority !== "high") {
				cached.image.fetchPriority = "high";
			} else if (priority === "auto" && cached.image.fetchPriority === "low") {
				cached.image.fetchPriority = "auto";
			}
			return cached.promise;
		}

		const image = createImage();
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
				() => reject(new Error(`Unable to load image: ${source}`)),
				{ once: true },
			);
		});
		const entry = { image, promise };
		entries.set(source, entry);
		void promise.catch(() => {
			if (entries.get(source) === entry) entries.delete(source);
		});
		image.src = source;
		return promise;
	};

	return { prepare };
}

const sharedImageCache = createImageResourceCache();

export function prepareImage(
	source: string,
	priority: ImageLoadPriority = "auto",
): Promise<HTMLImageElement> {
	return sharedImageCache.prepare(source, priority);
}

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

export function scheduleImageWarmup(
	sources: readonly string[],
	options: { timeout?: number } = {},
): () => void {
	const connection = (navigator as NetworkAwareNavigator).connection;
	if (
		connection?.saveData ||
		connection?.effectiveType === "slow-2g" ||
		connection?.effectiveType === "2g"
	) {
		return () => undefined;
	}

	const idleWindow = window as IdleAwareWindow;
	const uniqueSources = [...new Set(sources)];
	let cancelled = false;
	let scheduled = false;
	let idleHandle: number | undefined;
	let timeoutHandle: number | undefined;
	let waitingForVisibility = false;

	const schedule = () => {
		if (cancelled || scheduled) return;
		scheduled = true;
		if (idleWindow.requestIdleCallback) {
			idleHandle = idleWindow.requestIdleCallback(warmup, {
				timeout: options.timeout ?? 1_800,
			});
		} else {
			timeoutHandle = window.setTimeout(warmup, 700);
		}
	};

	const handleVisibilityChange = () => {
		if (document.visibilityState !== "visible") return;
		document.removeEventListener("visibilitychange", handleVisibilityChange);
		waitingForVisibility = false;
		schedule();
	};

	const warmup = () => {
		scheduled = false;
		idleHandle = undefined;
		timeoutHandle = undefined;
		if (cancelled) return;
		if (document.visibilityState !== "visible") {
			if (!waitingForVisibility) {
				waitingForVisibility = true;
				document.addEventListener("visibilitychange", handleVisibilityChange);
			}
			return;
		}
		for (const source of uniqueSources) {
			void prepareImage(source, "low").catch(() => undefined);
		}
	};

	if (document.readyState === "complete") schedule();
	else window.addEventListener("load", schedule, { once: true });

	return () => {
		cancelled = true;
		window.removeEventListener("load", schedule);
		document.removeEventListener("visibilitychange", handleVisibilityChange);
		if (idleHandle !== undefined) idleWindow.cancelIdleCallback?.(idleHandle);
		if (timeoutHandle !== undefined) window.clearTimeout(timeoutHandle);
	};
}
