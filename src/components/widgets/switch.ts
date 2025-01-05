import { configs } from 'configs';
import { events, UIEventActive, UIEventSlide } from 'event';
import { EventBase, IEventBaseCreateOptions } from 'event/api/base';
import { EventHandler, Events, IEventSource } from 'event/events';
import { Navigable } from 'navigate';
import { Widget } from './base';
import TEMPLATE from './templates/switch.static.pug';

export interface WidgetSwitchEvents {
	change: IEventBaseCreateOptions<WidgetSwitch>;
}

export interface WidgetSwitchProp {
	checked?: boolean;
	disabled?: boolean;
}

const SAFE_ZONE = 4;
const SWITCH_DISTANCE = 8;

export class WidgetSwitch extends Widget implements IEventSource<WidgetSwitchEvents>, Navigable {
	#inited = false;
	#events = new Events<WidgetSwitchEvents>(['change']);
	#shadowRoot = this.attachShadow({ mode: 'open' });
	#track: HTMLDivElement;
	constructor() {
		super();
		this.#shadowRoot.innerHTML = TEMPLATE;
		this.#shadowRoot.prepend(configs.getCSSImporter());
		this.#track = this.#shadowRoot.querySelector('.w-switch-track')!;
		events.hover.add(this.#track);
		events.active.on(this, this.#activeHandler);
		events.slide.on(this.#track, this.#slideHandler);
		// this.#track.addEventListener('pointerdown', this.#pointerDownHandler);
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
	#startX = 0;
	#draging = false;
	#activeHandler = (event: UIEventActive) => {
		if (this.disabled || event.active || event.cancel || this.#draging) return;
		this.#events.emit(new EventBase('change', { target: this }));
		this.toggleAttribute('checked');
	};
	#slideHandler = (event: UIEventSlide) => {
		if (this.disabled) return;
		if (event.state === 'start') {
			this.#startX = event.x;
			return;
		}
		if (event.state === 'move') {
			if (!this.#draging) {
				this.#draging = Math.abs(event.x - this.#startX) >= SAFE_ZONE;
			}
			if (!this.#draging) return;
			this.#track.classList.add('w-switch-draging');
			this.#track.style.setProperty('--w-switch-offset', `${event.x - this.#startX}px`);
			return;
		}
		if (!this.#draging) return;
		this.#draging = false;
		this.#track.classList.remove('w-switch-draging');
		const distance = event.x - this.#startX;
		const newChecked = distance > 0;
		if (Math.abs(distance) < SWITCH_DISTANCE || newChecked === this.checked) return;
		this.toggleAttribute('checked');
		this.#events.emit(new EventBase('change', { target: this }));
	};
	on<Type extends keyof WidgetSwitchEvents>(
		type: Type,
		handler: EventHandler<Type, WidgetSwitchEvents[Type], any>,
	): void {
		this.#events.on(type, handler);
	}
	off<Type extends keyof WidgetSwitchEvents>(
		type: Type,
		handler: EventHandler<Type, WidgetSwitchEvents[Type], any>,
	): void {
		this.#events.off(type, handler);
	}
	//#region Clone
	cloneNode(deep?: boolean): WidgetSwitch {
		const sw = super.cloneNode(deep) as WidgetSwitch;
		sw.checked = this.checked;
		sw.disabled = this.disabled;
		return sw;
	}
	//#region Nav
	get nonNavigable() {
		return this.disabled;
	}
	//#region Prop
	_prop?: WidgetSwitchProp;
}

customElements.define('w-switch', WidgetSwitch);
