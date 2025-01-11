import { toArray } from 'abm-utils';
import { navigate } from '../navigate';
import { $div, $new, $path, DOMContents } from '../utils/dom';
import { AnimationFrameController } from '../utils/timer';
import { WidgetLang } from './widgets/lang';

interface UITooltipsPosition {
	x: number;
	y: number;
}

const PADDING = 24;

class UITooltips {
	#map = new WeakMap<HTMLElement, DOMContents>();
	#currentTarget: WeakRef<HTMLElement> | null = null;
	#currentPath: HTMLElement[] = [];
	#contentElement = $div({
		class: ['ui-tooltips-content'],
		attr: { 'ui-layout': 'flow-column' },
	});
	#tooltipsElement = $div({
		class: ['ui-tooltips'],
		content: this.#contentElement,
	});
	constructor() {
		document.addEventListener('DOMContentLoaded', () => this.#init());
		window.addEventListener('mousemove', this.#mouseMoveHandler);
		window.addEventListener('touchmove', this.#touchMoveHandler);
		window.addEventListener('touchstart', this.#touchStartHandler);
		window.addEventListener('touchend', this.#touchEndHandler);
		navigate.on('nav', this.#navHandler);
	}
	#init() {
		document.body.append(this.#tooltipsElement);
		for (const target of document.querySelectorAll<HTMLElement>('[tooltips]')) {
			const tooltips = target.getAttribute('tooltips');
			if (!tooltips) continue;
			const content = $new<WidgetLang>('w-lang');
			content.key = tooltips;
			this.#map.set(target, content);
		}
		this.#update();
	}
	#position?: UITooltipsPosition;
	#update() {
		const lockItem = this.#lock?.deref();
		if (lockItem) this.#currentPath = [lockItem];

		let target: HTMLElement | null = null;
		let content: DOMContents | undefined = undefined;
		for (const element of this.#currentPath) {
			content = this.#map.get(element);
			if (content === undefined) continue;
			target = element;
			break;
		}

		if (!target || content === undefined) {
			this.#currentTarget = null;
			this.#toggleVisibility(false);
			return;
		}
		if (this.#currentTarget?.deref() === target) {
			this.#toggleVisibility(true);
			this.#setPosition(this.#position ?? target);
			return;
		}
		this.#currentTarget = new WeakRef(target);
		this.#toggleVisibility(true);
		this.#contentElement.replaceChildren(...toArray(content));
		this.#updateSize();
		this.#setPosition(this.#position ?? target);
	}
	#updateSize() {
		const { width, height } = this.#contentElement.getBoundingClientRect();
		this.#tooltipsElement.style.width = `${width}px`;
		this.#tooltipsElement.style.height = `${height}px`;
	}
	#setPosition(arg0: UITooltipsPosition | HTMLElement) {
		const { width, height } = this.#contentElement.getBoundingClientRect();
		let x: number;
		let y: number;
		if (arg0 instanceof HTMLElement) {
			const { left, top, bottom, width: size } = arg0.getBoundingClientRect();
			y = top - height - PADDING;
			if (y < 0) y = bottom + PADDING;
			x = left + size / 2 - width / 2;
		} else {
			x = arg0.x;
			y = arg0.y;
			x += x + PADDING + width <= window.innerWidth ? PADDING : -PADDING - width;
			x = Math.max(0, x);
			y += y + PADDING + height <= window.innerHeight ? PADDING : -PADDING - height;
			y = Math.max(0, y);
		}
		this.#tooltipsElement.style.left = `${x}px`;
		this.#tooltipsElement.style.top = `${y}px`;
	}
	#toggleVisibility(visibility: boolean) {
		this.#tooltipsElement.classList.toggle('ui-tooltips-show', visibility);
		if (!visibility) this.#frameController.stop();
	}
	//#region Tooltips
	get(target: HTMLElement): DOMContents | undefined {
		return this.#map.get(target);
	}
	set(target: HTMLElement, content?: DOMContents): void {
		if (content === undefined) {
			this.#map.delete(target);
			if (this.#lock?.deref() === target) this.#lock = null;
			this.#update();
			return;
		}
		this.#map.set(target, content);
		if (this.#lock?.deref() === target) {
			this.#contentElement.replaceChildren(...toArray(content));
		}
		this.#updateSize();
		this.#update();
	}
	//#region Lock
	#lock: WeakRef<HTMLElement> | null = null;
	lock(target: HTMLElement) {
		if (!this.#map.has(target)) return;
		this.#lock = new WeakRef(target);
		this.#update();
	}
	unlock() {
		this.#lock = null;
		this.#update();
	}
	//#region Mouse
	#mouseMoveHandler = (event: MouseEvent) => {
		const newPath = event.composedPath() as HTMLElement[];
		this.#position = event;
		this.#setPosition(event);
		if (newPath[0] === this.#currentPath[0]) return;
		this.#currentPath = newPath;
		this.#update();
		this.#frameController.stop();
	};
	//#region Touch
	#touchMoveHandler = (event: TouchEvent) => {
		const newPath = event.composedPath() as HTMLElement[];
		this.#position = undefined;
		if (newPath[0] === this.#currentPath[0]) return;
		this.#currentPath = newPath;
		this.#update();
		this.#frameController.stop();
	};
	#touchStartHandler = (event: TouchEvent) => {
		event.preventDefault();
		this.#touchMoveHandler(event);
	};
	#touchEndHandler = (event: TouchEvent) => {
		if (event.touches.length !== 0) return;
		this.#currentPath = [];
		this.#toggleVisibility(false);
	};
	#frameController = new AnimationFrameController(() => this.#update());
	#navHandler = () => {
		this.#position = undefined;
		const current = navigate.current;
		if (!current) {
			this.#currentPath = [];
			this.#frameController.stop();
			return;
		}
		this.#currentPath = $path(current);
		this.#frameController.start();
	};
}

export const tooltips = new UITooltips();
