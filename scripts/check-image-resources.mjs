import assert from "node:assert/strict";
import { createServer } from "vite";

const vite = await createServer({
	server: { middlewareMode: true },
	appType: "custom",
	logLevel: "silent",
});

class FakeImage {
	decoding = "auto";
	fetchPriority = "auto";
	src = "";
	decodeCalls = 0;
	listeners = new Map();
	releaseDecode = () => undefined;

	addEventListener(name, listener) {
		this.listeners.set(name, listener);
	}

	emit(name) {
		this.listeners.get(name)?.();
		this.listeners.delete(name);
	}

	decode() {
		this.decodeCalls += 1;
		return new Promise((resolve) => {
			this.releaseDecode = resolve;
		});
	}
}

try {
	const { createImageResourceCache } = await vite.ssrLoadModule(
		"/src/image-resources.ts",
	);
	const images = [];
	const cache = createImageResourceCache(() => {
		const image = new FakeImage();
		images.push(image);
		return image;
	});

	const lowPriorityRequest = cache.prepare("poster.webp", "low");
	const highPriorityRequest = cache.prepare("poster.webp", "high");
	const poster = images[0];

	assert.equal(images.length, 1, "one source should create one image request");
	assert.equal(
		lowPriorityRequest,
		highPriorityRequest,
		"concurrent callers should share the same readiness promise",
	);
	assert.equal(
		poster.fetchPriority,
		"high",
		"visible intent should upgrade an idle preload",
	);

	let ready = false;
	void highPriorityRequest.then(() => {
		ready = true;
	});
	poster.emit("load");
	await Promise.resolve();
	assert.equal(
		ready,
		false,
		"network completion alone must not reveal the image",
	);
	assert.equal(
		poster.decodeCalls,
		1,
		"the loaded image should be decoded once",
	);
	poster.releaseDecode();
	await highPriorityRequest;
	assert.equal(ready, true, "the shared promise should resolve after decoding");

	const failedRequest = cache.prepare("retry.webp", "auto");
	images.at(-1).emit("error");
	await assert.rejects(failedRequest, /Unable to load image/);
	const retryRequest = cache.prepare("retry.webp", "auto");
	assert.equal(images.length, 3, "failed requests should be evicted for retry");
	images.at(-1).emit("load");
	images.at(-1).releaseDecode();
	await retryRequest;

	console.log("PASS image requests are deduplicated and priority-aware");
	console.log("PASS image readiness waits for decode completion");
	console.log("PASS failed image requests remain retryable");
} finally {
	await vite.close();
}
