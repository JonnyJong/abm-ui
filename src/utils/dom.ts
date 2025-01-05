import { Widget } from 'components/widgets/base';
import { Arrayable, toArray } from './array';
import { Color } from './color';
import { range } from './math';

//#region Raw DOM Control

export type CSSProperty = {
	[Key in keyof CSSStyleDeclaration]?: any;
};
export type CSSVariable = {
	[key: `--${string}`]: any;
};
export type DOMContents = Arrayable<HTMLElement | string>;
export type DOMEventMap<E extends HTMLElement = HTMLElement> = {
	[K in keyof HTMLElementEventMap]?: (this: E, ev: HTMLElementEventMap[K]) => any;
};

export interface DOMApplyOptions<E extends Widget = Widget> {
	class?: Arrayable<string>;
	id?: string;
	attr?: { [key: string]: any };
	data?: { [key: string]: any };
	style?: CSSProperty & CSSVariable;
	content?: DOMContents;
	/**
	 * @description If the value is of type `string`, ignore `content`.
	 */
	html?: string;
	event?: DOMEventMap<E>;
	prop?: E['_prop'];
}

function applyBasic<E extends HTMLElement = HTMLElement>(target: E, options: DOMApplyOptions<E>) {
	if (options.class !== undefined) {
		target.className = '';
		target.classList.add(...toArray(options.class));
	}
	if (options.id !== undefined) {
		target.id = options.id;
	}
	if (options.attr !== undefined) {
		for (const [key, value] of Object.entries(options.attr)) {
			if (value === undefined) {
				target.removeAttribute(key);
				continue;
			}
			target.setAttribute(key, String(value));
		}
	}
	if (options.data !== undefined) {
		for (const [key, value] of Object.entries(options.data)) {
			if (value === undefined) {
				delete target.dataset[key];
				continue;
			}
			target.dataset[key] = String(value);
		}
	}
}
function applyStyle<E extends HTMLElement = HTMLElement>(target: E, options: DOMApplyOptions<E>) {
	if (options.style !== undefined) {
		for (let [key, value] of Object.entries(options.style)) {
			key = key.replaceAll(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`);
			if (typeof value === 'number') {
				target.style.setProperty(key, `${value}px`);
				continue;
			}
			if ([undefined, null].includes(value)) {
				target.style.removeProperty(key);
				return;
			}
			target.style.setProperty(key, String(value));
		}
	}
}
function applyContent<E extends HTMLElement = HTMLElement>(target: E, options: DOMApplyOptions<E>) {
	if (typeof options.html === 'string') {
		target.innerHTML = options.html;
	} else if (options.content !== undefined) {
		target.replaceChildren(...toArray(options.content));
	}
	if (options.event !== undefined) {
		for (const [key, value] of Object.entries(options.event)) {
			target.addEventListener(key as keyof HTMLElementEventMap, value as EventListenerOrEventListenerObject);
		}
	}
}
function applyProp<E extends Widget = Widget>(target: E, options: DOMApplyOptions<E>) {
	if (!options.prop) return;
	for (const [key, value] of Object.entries(options.prop)) {
		(target as any)[key] = value;
	}
}

export function $apply<E extends HTMLElement = HTMLElement>(target: E, options: DOMApplyOptions<E>) {
	applyBasic(target, options);
	applyStyle(target, options);
	applyContent(target, options);
	applyProp(target, options);
}

export function $<E extends HTMLElement = HTMLElement>(selector: string): E | null;
export function $<E extends HTMLElement = HTMLElement>(selector: string, scope: ParentNode): E | null;
export function $<E extends HTMLElement = HTMLElement>(selector: string, scope: ParentNode = document): E | null {
	return scope.querySelector<E>(selector);
}

export function $new<E extends HTMLElement = HTMLElement>(tag: string, options: DOMApplyOptions<E>): E;
export function $new<E extends HTMLElement = HTMLElement>(tag: string, ...content: (string | HTMLElement)[]): E;
export function $new<E extends HTMLElement = HTMLElement>(
	tag: string,
	options: DOMApplyOptions<E>,
	...content: (string | HTMLElement)[]
): E;
export function $new<E extends HTMLElement = HTMLElement>(
	tag: string,
	options?: DOMApplyOptions<E> | string | HTMLElement,
	...content: (string | HTMLElement)[]
): E {
	const element = document.createElement(tag) as E;
	if (typeof options === 'object' && !(options instanceof HTMLElement)) {
		$apply(element, options);
	} else if (options !== undefined) {
		element.append(options);
	}
	element.append(...content);
	return element;
}

export function $div(): HTMLDivElement;
export function $div(options: DOMApplyOptions<HTMLDivElement>): HTMLDivElement;
export function $div(...content: (string | HTMLElement)[]): HTMLDivElement;
export function $div(options: DOMApplyOptions<HTMLDivElement>, ...content: (string | HTMLElement)[]): HTMLDivElement;
export function $div(
	options?: DOMApplyOptions<HTMLDivElement> | string | HTMLElement,
	...content: (string | HTMLElement)[]
): HTMLDivElement {
	return $new<HTMLDivElement>('div', options as string, ...content);
}

const colorTokens = ['text'];
for (const i of range(1, 15)) {
	colorTokens.push(i.toString(16));
}
export function $applyColor(target: HTMLElement, color?: Color) {
	if (!color) {
		target.style.removeProperty('--theme');
		for (const token of colorTokens) {
			target.style.removeProperty(`--theme-${token}`);
		}
		return;
	}
	$apply(target, { style: color.getTokens() });
}

export function $path(from: HTMLElement): HTMLElement[] {
	const path = [from];
	let current = from.parentElement;
	while (current) {
		path.push(current);
		current = current.parentElement;
	}
	return path;
}
