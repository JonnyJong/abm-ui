import { run } from 'abm-utils/function';
import { EventBase } from 'event/api/base';
import { NavigateEvents, navigate } from 'navigate';
import { IUIEventBase, IUIEventBaseManage, IUIEventHandler } from './base';

export class UIEventActive extends EventBase<'active', HTMLElement> implements IUIEventBase<'active'> {
	#active: boolean;
	#cancel: boolean;
	#pointerId: number;
	constructor(target: HTMLElement, active: boolean, cancel: boolean, pointerId: number) {
		super('active', { target });
		this.#active = active;
		this.#cancel = cancel;
		this.#pointerId = pointerId;
	}
	get active() {
		return this.#active;
	}
	get cancel() {
		return this.#cancel;
	}
	/**
	 * @description
	 * * `-2`: Nav
	 * * `-1`: Mouse
	 * * `>= 0`: Touch & Pen
	 */
	get pointerId() {
		return this.#pointerId;
	}
}

export type UIEventActiveHandler = IUIEventHandler<'active', HTMLElement, UIEventActive>;

export class UIEventActiveManager implements IUIEventBaseManage<'active'> {
	constructor() {
		navigate.on('nav', this.#navHandler);
		navigate.on('active', this.#activeHandler);
	}
	#subscriptions: WeakMap<HTMLElement, Set<UIEventActiveHandler>> = new WeakMap();
	/**
	 * * `-2`: Nav
	 * * `-1`: Mouse
	 * * `>= 0`: Touch & Pen
	 */
	#activated: Map<HTMLElement, number> = new Map();
	#emit(target: HTMLElement, active: boolean, cancel: boolean, pointerId: number) {
		const handlers = this.#subscriptions.get(target);
		if (!handlers) return;
		const event = new UIEventActive(target, active, cancel, pointerId);
		for (const handler of handlers) {
			run(handler, event);
		}
	}
	on<Target extends HTMLElement>(target: Target, handler: UIEventActiveHandler): void {
		let handlers = this.#subscriptions.get(target);
		if (!handlers) {
			handlers = new Set();
			this.#subscriptions.set(target, handlers);
			this.#bind(target);
		}
		handlers.add(handler);
	}
	off<Target extends HTMLElement>(target: Target, handler: UIEventActiveHandler): void {
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
		target.addEventListener('touchstart', this.#touchStart);
		// TODO: Bind Events
	}
	#unbind<Target extends HTMLElement>(target: Target): void {
		target.removeEventListener('mousedown', this.#mouseDownHandler);
		// TODO: Unbind
	}
	#activate(target: HTMLElement, identifier: number) {
		this.#activated.set(target, identifier);
		target.toggleAttribute('ui-active', true);
		if (identifier === -2) return;
		if (identifier === -1) {
			target.addEventListener('mouseup', this.#mouseUpHandler);
			target.addEventListener('mouseleave', this.#mouseLeaveHandler);
			return;
		}
		target.addEventListener('touchend', this.#touchEnd);
		target.addEventListener('touchmove', this.#touchMove);
	}
	#deactivate(target: HTMLElement) {
		this.#activated.delete(target);
		target.toggleAttribute('ui-active', false);
		target.removeEventListener('mouseup', this.#mouseUpHandler);
		target.removeEventListener('mouseleave', this.#mouseLeaveHandler);
		target.removeEventListener('touchend', this.#touchEnd);
		target.removeEventListener('touchmove', this.#touchMove);
	}
	cancel(target: HTMLElement): boolean {
		if (!(target && this.#activated.has(target))) return false;
		this.#deactivate(target);
		return true;
	}
	//#region Mouse
	#mouseDownHandler = (event: MouseEvent) => {
		if (event.button !== 0) return;
		const target = event.currentTarget as HTMLElement;
		if (!target || this.#activated.has(target)) return;
		this.#activate(target, -1);
		this.#emit(target, true, false, -1);
	};
	#mouseUpHandler = (event: MouseEvent) => {
		const target = event.currentTarget as HTMLElement;
		if (!(target && this.#activated.has(target))) return;
		this.#deactivate(target);
		this.#emit(target, false, false, -1);
	};
	#mouseLeaveHandler = (event: MouseEvent) => {
		const target = event.currentTarget as HTMLElement;
		if (!(target && this.#activated.has(target))) return;
		this.#deactivate(target);
		this.#emit(target, false, true, -1);
	};
	//#region Touch
	#touchStart = (event: TouchEvent) => {
		const target = event.currentTarget as HTMLElement;
		if (!target || this.#activated.has(target)) return;
		event.preventDefault();
		this.#activate(target, event.changedTouches[0].identifier);
		this.#emit(target, true, false, event.changedTouches[0].identifier);
	};
	#touchEnd = (event: TouchEvent) => {
		const target = event.currentTarget as HTMLElement;
		const identifier = this.#activated.get(target);
		if (!(target && typeof identifier === 'number')) return;
		if (![...event.changedTouches].find((touch) => touch.identifier === identifier)) return;
		this.#deactivate(target);
		this.#emit(target, false, false, identifier);
	};
	#touchMove = (event: TouchEvent) => {
		const target = event.currentTarget as HTMLElement;
		const identifier = this.#activated.get(target);
		if (!(target && typeof identifier === 'number')) return;
		const touch = [...event.changedTouches].find((touch) => touch.identifier === identifier);
		if (!touch) return;
		const { left, right, top, bottom } = target.getBoundingClientRect();
		if (touch.clientX >= left && touch.clientX <= right && touch.clientY >= top && touch.clientY <= bottom) return;
		this.#deactivate(target);
		this.#emit(target, false, true, identifier);
	};
	//#region Nav
	#navHandler = () => {
		const target = navigate.current;
		for (const item of [...this.#activated.keys()]) {
			if (target === item) continue;
			this.#deactivate(item);
			this.#emit(item, false, true, -2);
		}
	};
	#activeHandler = (event: NavigateEvents['active']) => {
		const target = navigate.current;
		if (!(target && this.#subscriptions.has(target))) return;
		const activating = this.#activated.has(target);
		if (event.value === activating) return;

		if (event.value) this.#activate(target, -2);
		else this.#deactivate(target);
		this.#emit(target, event.value, false, -2);
	};
}
