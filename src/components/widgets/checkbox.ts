import { configs } from 'configs';
import { events } from 'event';
import { EventBase, IEventBaseCreateOptions } from 'event/api/base';
import { EventHandler, Events, IEventSource } from 'event/events';
import { Navigable } from 'navigate';
import { Widget } from './base';
import TEMPLATE from './templates/checkbox.static.pug';

export interface WidgetCheckboxEvents {
	change: IEventBaseCreateOptions<WidgetCheckbox>;
}

export interface WidgetCheckboxProp {
	checked?: boolean;
	disabled?: boolean;
}

export class WidgetCheckbox extends Widget implements IEventSource<WidgetCheckboxEvents>, Navigable {
	#inited = false;
	#events = new Events<WidgetCheckboxEvents>(['change']);
	#shadowRoot = this.attachShadow({ mode: 'open' });
	constructor() {
		super();
		this.#shadowRoot.innerHTML = TEMPLATE;
		this.#shadowRoot.prepend(configs.getCSSImporter());
		events.hover.add(this);
		events.active.on(this, (event) => {
			if (event.active || event.cancel) return;
			if (this.disabled) return;
			this.checked = !this.checked;
			this.#events.emit(new EventBase('change', { target: this }));
		});
	}
	connectedCallback() {
		this.toggleAttribute('ui-nav', true);
		if (this.#inited) return;
		this.#inited = true;
	}
	//#region Checked
	get checked() {
		return this.hasAttribute('checked');
	}
	set checked(value: boolean) {
		this.toggleAttribute('checked', value);
	}
	//#region Disabled
	get disabled() {
		return this.hasAttribute('disabled');
	}
	set disabled(value: boolean) {
		this.#inited = true;
		this.toggleAttribute('disabled', value);
	}
	//#region Event
	on<Type extends keyof WidgetCheckboxEvents>(
		type: Type,
		handler: EventHandler<Type, WidgetCheckboxEvents[Type], any>,
	): void {
		this.#events.on(type, handler);
	}
	off<Type extends keyof WidgetCheckboxEvents>(
		type: Type,
		handler: EventHandler<Type, WidgetCheckboxEvents[Type], any>,
	): void {
		this.#events.off(type, handler);
	}
	//#region Clone
	cloneNode(deep?: boolean): WidgetCheckbox {
		const checkbox = super.cloneNode(deep) as WidgetCheckbox;
		checkbox.disabled = this.disabled;
		checkbox.checked = this.checked;
		return checkbox;
	}
	//#region Nav
	get nonNavigable() {
		return this.disabled;
	}
	//#region Prop
	_prop?: WidgetCheckboxProp;
}

customElements.define('w-checkbox', WidgetCheckbox);
