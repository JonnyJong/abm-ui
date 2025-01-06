import { Color, runSync } from 'abm-utils';
import { ColorPicker } from 'components/color-picker';
import { configs } from 'configs';
import { events } from 'event';
import { EventBase, IEventBaseCreateOptions } from 'event/api/base';
import { EventHandler, Events, IEventSource } from 'event/events';
import { Navigable } from 'navigate';
import { $div } from 'utils/dom';
import { Widget } from './base';

export interface WidgetColorEvents {
	change: IEventBaseCreateOptions<WidgetColor>;
}

export interface WidgetColorProp {
	value?: Color | string;
	readOnly?: boolean;
	alpha?: boolean;
}

export class WidgetColor extends Widget implements IEventSource<WidgetColorEvents>, Navigable {
	#inited = false;
	#events = new Events<WidgetColorEvents>(['change']);
	#shadowRoot = this.attachShadow({ mode: 'open' });
	#indicator = $div({ class: 'w-color' });
	#color = configs.theme.color;
	constructor() {
		super();
		this.#shadowRoot.append(configs.getCSSImporter(), this.#indicator);
		events.active.on(this, async ({ active, cancel }) => {
			if (this.readOnly || active || cancel) return;
			const color = await ColorPicker.pickColor(this.#color, this.alpha);
			if (!color) return;
			this.#color = color;
			this.#updateIndicator();
			this.#events.emit(new EventBase('change', { target: this }));
		});
	}
	connectedCallback() {
		this.toggleAttribute('ui-nav', true);
		if (this.#inited) return;
		this.#inited = true;
		const value = this.getAttribute('value');
		if (value)
			runSync(() => {
				this.value = value;
			});
		this.#updateIndicator();
	}
	#updateIndicator(color?: Color) {
		if (!color) color = this.#color;
		this.#indicator.style.setProperty('--w-color', color[this.alpha ? 'hexa' : 'hex']());
	}
	//#region Value
	get value(): Color {
		return this.#color.clone();
	}
	set value(value: Color | string) {
		if (typeof value === 'string') {
			if (value.length < 8) value = Color.hex(value);
			else value = Color.hexa(value);
		}
		if (!(value instanceof Color)) return;
		this.#color = value.clone();
		this.#updateIndicator();
	}
	//#region Readonly
	get readOnly() {
		return this.hasAttribute('readonly');
	}
	set readOnly(value: boolean) {
		this.toggleAttribute('readonly', value);
	}
	//#region Alpha
	get alpha() {
		return this.hasAttribute('alpha');
	}
	set alpha(value: boolean) {
		this.toggleAttribute('alpha', value);
	}
	//#region Event
	on<Type extends keyof WidgetColorEvents>(type: Type, handler: EventHandler<Type, WidgetColorEvents[Type], any>): void {
		this.#events.on(type, handler);
	}
	off<Type extends keyof WidgetColorEvents>(
		type: Type,
		handler: EventHandler<Type, WidgetColorEvents[Type], any>,
	): void {
		this.#events.off(type, handler);
	}
	//#region Proxy Fn
	setAttribute(qualifiedName: string, value: string): void {
		super.setAttribute(qualifiedName, value);
		if (qualifiedName === 'alpha') this.#updateIndicator();
	}
	toggleAttribute(qualifiedName: string, force?: boolean): boolean {
		const result = super.toggleAttribute(qualifiedName, force);
		if (qualifiedName === 'alpha') this.#updateIndicator();
		return result;
	}
	removeAttribute(qualifiedName: string): void {
		super.removeAttribute(qualifiedName);
		if (qualifiedName === 'alpha') this.#updateIndicator();
	}
	//#region Clone
	cloneNode(deep?: boolean): WidgetColor {
		const color = super.cloneNode(deep) as WidgetColor;
		color.readOnly = this.readOnly;
		color.alpha = this.alpha;
		color.value = this.value;
		return color;
	}
	//#region Nav
	get nonNavigable() {
		return this.readOnly;
	}
	//#region Prop
	_prop?: WidgetColorProp;
}

customElements.define('w-color', WidgetColor);
