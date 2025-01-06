export class AnimationFrameController {
	#fn: FrameRequestCallback;
	#requestId: number = NaN;
	#ignoreErrors = false;
	#async: boolean;
	constructor(fn: FrameRequestCallback, async?: boolean) {
		this.#fn = fn;
		this.#async = !!async;
	}
	#frameRequestCallback = (time: DOMHighResTimeStamp) => {
		try {
			this.#fn(time);
		} catch (error) {
			this.#handleError(error);
		}
		if (!this.isRunning) return;
		this.#requestNextFrame();
	};
	#frameRequestCallbackAsync = async (time: DOMHighResTimeStamp) => {
		try {
			await this.#fn(time);
		} catch (error) {
			this.#handleError(error);
		}
		if (!this.isRunning) return;
		this.#requestNextFrame();
	};
	#requestNextFrame() {
		this.#requestId = requestAnimationFrame(this.#async ? this.#frameRequestCallbackAsync : this.#frameRequestCallback);
	}
	#handleError(error: unknown) {
		console.error(error);
		if (this.#ignoreErrors) return;
		this.#requestId = NaN;
	}
	start() {
		if (this.isRunning) return;
		this.#requestNextFrame();
	}
	stop() {
		if (!this.isRunning) return;
		cancelAnimationFrame(this.#requestId);
		this.#requestId = NaN;
	}
	get isRunning() {
		return !isNaN(this.#requestId);
	}
	get ignoreErrors() {
		return this.#ignoreErrors;
	}
	set ignoreErrors(value: boolean) {
		this.#ignoreErrors = !!value;
	}
	get fn() {
		return this.#fn;
	}
	set fn(fn: FrameRequestCallback) {
		this.#fn = fn;
	}
	get async() {
		return this.#async;
	}
	set async(value: boolean) {
		this.#async = !!value;
	}
}
