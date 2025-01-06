import { run } from 'abm-utils';
import { EventBase } from 'event/api/base';
import { IUIEventBase, IUIEventBaseManage, IUIEventHandler } from './base';

export type UIEventSlideState = 'start' | 'move' | 'end';

export class UIEventSlide extends EventBase<'slide', HTMLElement> implements IUIEventBase<'slide'> {
	#state: UIEventSlideState;
	#x: number;
	#y: number;
	constructor(target: HTMLElement, state: UIEventSlideState, x: number, y: number) {
		super('slide', { target });
		this.#state = state;
		this.#x = x;
		this.#y = y;
	}
	get state() {
		return this.#state;
	}
	get x() {
		return this.#x;
	}
	get y() {
		return this.#y;
	}
}

export type UIEventSlideHandler = IUIEventHandler<'slide', HTMLElement, UIEventSlide>;

export class UIEventSlideManager implements IUIEventBaseManage<'slide'> {
	#subscriptions: WeakMap<HTMLElement, Set<UIEventSlideHandler>> = new WeakMap();
	#activated: Map<HTMLElement, number> = new Map();
	#emit(target: HTMLElement, state: UIEventSlideState, x: number, y: number) {
		const handlers = this.#subscriptions.get(target);
		if (!handlers) return;
		const event = new UIEventSlide(target, state, x, y);
		for (const handler of handlers) {
			run(handler, event);
		}
	}
	on<Target extends HTMLElement>(target: Target, handler: UIEventSlideHandler): void {
		let handlers = this.#subscriptions.get(target);
		if (!handlers) {
			handlers = new Set();
			this.#subscriptions.set(target, handlers);
			this.#bind(target);
		}
		handlers.add(handler);
	}
	off<Target extends HTMLElement>(target: Target, handler: UIEventSlideHandler): void {
		this.#subscriptions.get(target)?.delete(handler);
	}
	add<Target extends HTMLElement>(target: Target): void {
		if (this.#subscriptions.has(target)) return;
		this.#subscriptions.set(target, new Set());
		this.#bind(target);
	}
	rm<Target extends HTMLElement>(target: Target): void {
		this.#subscriptions.delete(target);
		this.#deactivate(target);
		this.#unbind(target);
	}
	#bind<Target extends HTMLElement>(target: Target): void {
		target.addEventListener('mousedown', this.#mouseDownHandler);
		target.addEventListener('touchstart', this.#touchStartHandler);
	}
	#unbind<Target extends HTMLElement>(target: Target): void {
		target.removeEventListener('mousedown', this.#mouseDownHandler);
		target.removeEventListener('touchstart', this.#touchStartHandler);
	}
	#activate(target: HTMLElement, identifier: number) {
		this.#activated.set(target, identifier);
		target.toggleAttribute('ui-slide', true);
		if (this.#activated.size !== 1) return;
		this.#start();
	}
	#deactivate(target: HTMLElement) {
		this.#activated.delete(target);
		target.toggleAttribute('ui-slide', false);
		if (this.#activated.size !== 0) return;
		this.#stop();
	}
	#start() {
		window.addEventListener('mousemove', this.#mouseMoveHandler);
		window.addEventListener('mouseup', this.#mouseUpHandler);
		window.addEventListener('touchmove', this.#touchMoveHandler);
		window.addEventListener('touchend', this.#touchEndHandler);
	}
	#stop() {
		window.removeEventListener('mousemove', this.#mouseMoveHandler);
		window.removeEventListener('mouseup', this.#mouseUpHandler);
		window.removeEventListener('touchmove', this.#touchMoveHandler);
		window.removeEventListener('touchend', this.#touchEndHandler);
	}
	/**
	 * @param identifier
	 * * `-2`: Nav
	 * * `-1`: Mouse
	 * * `>= 0`: Touch & Pen
	 */
	start<Target extends HTMLElement>(target: Target, identifier: number): boolean {
		if (!(target && this.#subscriptions.has(target)) || this.#activated.has(target)) return false;
		this.#activate(target, identifier);
		return true;
	}
	cancel<Target extends HTMLElement>(target: Target): boolean {
		if (!(target && this.#activated.has(target))) return false;
		this.#deactivate(target);
		return true;
	}
	//#region Mouse
	#mouseDownHandler = (event: MouseEvent) => {
		const target = event.currentTarget as HTMLElement;
		if (!target || this.#activated.has(target)) return;
		this.#activate(target, -1);
		this.#emit(target, 'start', event.x, event.y);
	};
	#mouseMoveHandler = (event: MouseEvent) => {
		for (const [target, identifier] of this.#activated) {
			if (identifier !== -1) continue;
			this.#emit(target, 'move', event.x, event.y);
		}
	};
	#mouseUpHandler = (event: MouseEvent) => {
		for (const [target, identifier] of this.#activated) {
			if (identifier !== -1) continue;
			this.#emit(target, 'end', event.x, event.y);
			target.toggleAttribute('ui-slide', false);
			this.#activated.delete(target);
		}
		if (this.#activated.size !== 0) return;
		this.#stop();
	};
	//#region Touch
	#touchStartHandler = (event: TouchEvent) => {
		const target = event.currentTarget as HTMLElement;
		if (!target || this.#activated.has(target)) return;
		event.preventDefault();
		this.#activate(target, event.changedTouches[0].identifier);
		const { clientX, clientY } = event.changedTouches[0];
		this.#emit(target, 'start', clientX, clientY);
	};
	#touchMoveHandler = (event: TouchEvent) => {
		for (const [target, identifier] of this.#activated) {
			if (identifier === -1) continue;
			const touch = [...event.changedTouches].find((touch) => touch.identifier === identifier);
			if (!touch) continue;
			const { clientX, clientY } = touch;
			this.#emit(target, 'move', clientX, clientY);
		}
	};
	#touchEndHandler = (event: TouchEvent) => {
		for (const [target, identifier] of this.#activated) {
			if (identifier === -1) continue;
			const touch = [...event.changedTouches].find((touch) => touch.identifier === identifier);
			if (!touch) continue;
			const { clientX, clientY } = touch;
			this.#emit(target, 'end', clientX, clientY);
			target.toggleAttribute('ui-slide', false);
			this.#activated.delete(target);
		}
		if (this.#activated.size !== 0) return;
		this.#stop();
	};
}
