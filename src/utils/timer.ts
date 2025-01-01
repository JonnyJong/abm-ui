import { run } from './function';

export function sleep(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, Math.max(ms, 0));
	});
}

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

export class RepeatingTriggerController<F extends Function | ((...args: any) => any) = Function> {
	#fn: F;
	#initialDelay = 500;
	#repeatInterval = 100;
	#repeating = false;
	#timer: number | null = null;
	constructor(fn: F, initialDelay?: number, repeatInterval?: number) {
		if (typeof fn !== 'function') throw new TypeError('fn must be a function');
		this.#fn = fn;
		if (initialDelay) this.initialDelay = initialDelay;
		if (repeatInterval) this.repeatInterval = repeatInterval;
	}
	start(): void {
		if (this.isRunning) return;
		run(this.#fn);
		this.#timer = setTimeout(() => {
			this.#timer = setInterval(() => run(this.#fn), this.#repeatInterval);
		}, this.#initialDelay);
	}
	stop(): void {
		if (this.#timer === null) return;
		if (this.#repeating) clearInterval(this.#timer);
		else clearTimeout(this.#timer);
		this.#timer = null;
		this.#repeating = false;
	}
	get isRunning(): boolean {
		return this.#timer !== null;
	}
	get fn(): F {
		return this.#fn;
	}
	set fn(fn: F) {
		if (typeof fn !== 'function') return;
		this.#fn = fn;
	}
	get initialDelay() {
		return this.#initialDelay;
	}
	set initialDelay(value: number) {
		if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return;
		this.#initialDelay = value;
	}
	get repeatInterval() {
		return this.#repeatInterval;
	}
	set repeatInterval(value: number) {
		if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return;
		this.#repeatInterval = value;
	}
}
