import { UIContent, UIContentCreateOptions, UIContentEvents } from 'components/content';
import { configs } from 'configs';
import { events } from 'event';
import { EventBase, IEventBaseCreateOptions } from 'event/api/base';
import { EventHandler, Events, IEventSource } from 'event/events';
import { Navigable } from 'navigate';
import { Color } from 'utils/color';
import { $applyColor } from 'utils/dom';
import { runSync } from 'utils/function';
import { clamp } from 'utils/math';
import { AnimationFrameController } from 'utils/timer';
import TEMPLATE from './templates/btn.static.pug';

export interface WidgetBtnEvents {
	active: IEventBaseCreateOptions<WidgetBtn>;
}

export type WidgetBtnState = '' | 'primary' | 'danger' | 'toggle';

const STATES: WidgetBtnState[] = ['', 'primary', 'danger', 'toggle'];

export class WidgetBtn extends HTMLElement implements IEventSource<WidgetBtnEvents>, Navigable {
	#inited = false;
	#events = new Events<WidgetBtnEvents>(['active']);
	#shadowRoot = this.attachShadow({ mode: 'open' });
	constructor() {
		super();
		this.#shadowRoot.innerHTML = TEMPLATE;
		this.#contentElement = this.#shadowRoot.querySelector('.w-btn-content')!;
		this.#shadowRoot.prepend(configs.getCSSImporter());
		// Contents
		this.#content.on('update:icon', this.#iconUpdateHandler);
		this.#content.on('update:label', this.#labelUpdateHandler);
		// Delay
		this.#activeProgress = this.#shadowRoot.querySelector('.w-btn-active-progress')!;
		// Progress
		this.#progressElement = this.#shadowRoot.querySelector('.w-btn-progress')!;
		// Event
		events.hover.add(this);
		events.active.on(this, (event) => {
			if (this.disabled) return;
			if (this.#delay === 0) {
				if (event.active || event.cancel) return;
				if (this.state === 'toggle') this.toggleAttribute('checked');
				this.#events.emit(new EventBase('active', { target: this }));
				return;
			}
			// Delay
			if (event.active) {
				this.#activeController.start();
				return;
			}
			if (this.#activeDuration < this.#delay || event.cancel) {
				this.#resetActiveDuration();
				return;
			}
			this.#resetActiveDuration();
			if (this.state === 'toggle') this.toggleAttribute('checked');
			this.#events.emit(new EventBase('active', { target: this }));
		});
	}
	connectedCallback() {
		this.toggleAttribute('ui-nav', true);
		if (this.#inited) return;
		this.#inited = true;
		if (this.textContent) this.#content.key = this.textContent;
		const icon = this.getAttribute('icon');
		if (icon) this.#content.icon = icon;
		const delay = this.getAttribute('delay');
		if (delay) this.delay = Number(delay);
		const progress = this.getAttribute('progress');
		if (progress) this.progress = Number(progress);
		const color = this.getAttribute('color');
		if (color)
			runSync(() => {
				this.color = Color.hex(color);
				if (!this.hasAttribute('state')) this.state = 'primary';
			});
	}
	//#region Contents
	#content = new UIContent();
	#contentElement: HTMLDivElement;
	#iconUpdateHandler = (event: UIContentEvents['update:icon']) => {
		this.#inited = true;
		event.details.before?.remove();
		if (event.details.after) this.#contentElement.prepend(event.details.after);
	};
	#labelUpdateHandler = (event: UIContentEvents['update:label']) => {
		this.#inited = true;
		event.details.before?.remove();
		if (event.details.after) this.#contentElement.append(event.details.after);
	};
	get content(): UIContent {
		return this.#content;
	}
	set content(value: UIContent | string | UIContentCreateOptions) {
		if (typeof value === 'string') {
			this.#content.key = value;
			return;
		}
		if (!(value instanceof UIContent)) value = new UIContent(value);
		this.#inited = true;
		if (value === this.#content) return;
		this.#content.off('update:icon', this.#iconUpdateHandler);
		this.#content.off('update:label', this.#labelUpdateHandler);
		this.#content = value as UIContent;
		this.#content.on('update:icon', this.#iconUpdateHandler);
		this.#content.on('update:label', this.#labelUpdateHandler);
		this.#contentElement.replaceChildren();
		if (this.#content.iconElement) this.#contentElement.append(this.#content.iconElement);
		if (this.#content.labelElement) this.#contentElement.append(this.#content.labelElement);
	}
	//#region Disabled
	get disabled() {
		return this.hasAttribute('disabled');
	}
	set disabled(value: boolean) {
		this.#inited = true;
		this.toggleAttribute('disabled', value);
	}
	//#region State
	get state() {
		const state = this.getAttribute('state') as WidgetBtnState;
		if (STATES.includes(state)) return state;
		return '';
	}
	set state(value: WidgetBtnState) {
		if (!STATES.includes(value)) return;
		this.#inited = true;
		this.setAttribute('state', value);
	}
	//#region Flat
	get flat() {
		return this.hasAttribute('flat');
	}
	set flat(value: boolean) {
		this.#inited = true;
		this.toggleAttribute('flat', value);
	}
	//#region Rounded
	get rounded() {
		return this.hasAttribute('rounded');
	}
	set rounded(value: boolean) {
		this.#inited = true;
		this.toggleAttribute('rounded', value);
	}
	//#region Delay
	#delay = 0;
	#activeDuration = 0;
	#activeProgress: HTMLDivElement;
	#activePrevTime = 0;
	#activeController = new AnimationFrameController((time) => {
		if (this.#activePrevTime === 0) {
			this.#activePrevTime = time;
		}
		const intervals = time - this.#activePrevTime;
		this.#activePrevTime = time;
		this.#activeDuration += intervals;
		this.#activeProgress.style.width = `${(clamp(0, this.#activeDuration, this.#delay) / this.#delay) * 100}%`;
	});
	#resetActiveDuration() {
		this.#activeController.stop();
		this.#activeDuration = 0;
		this.#activePrevTime = 0;
		this.#activeProgress.style.width = '';
	}
	/** Unit: ms */
	get delay() {
		return this.#delay;
	}
	set delay(value: number) {
		this.#inited = true;
		if (isNaN(value) || value < 0) value = 0;
		if (value === Infinity) console.warn('Delay value is Infinity');
		this.#delay = value;
	}
	//#region Progress
	#progress = 100;
	#progressElement: HTMLDivElement;
	get progress() {
		return this.#progress;
	}
	set progress(value: number) {
		if (isNaN(value)) return;
		this.#inited = true;
		this.#progress = clamp(0, value, 100);
		this.#progressElement.style.width = `${this.#progress}%`;
	}
	//#region Checked
	get checked() {
		return this.hasAttribute('checked');
	}
	set checked(value: boolean) {
		this.#inited = true;
		this.toggleAttribute('checked', value);
	}
	//#region Event
	on<Type extends keyof WidgetBtnEvents>(type: Type, handler: EventHandler<Type, WidgetBtnEvents[Type], any>): void {
		this.#events.on(type, handler);
	}
	off<Type extends keyof WidgetBtnEvents>(type: Type, handler: EventHandler<Type, WidgetBtnEvents[Type], any>): void {
		this.#events.off(type, handler);
	}
	//#region Color
	#color?: Color;
	get color() {
		return this.#color?.clone();
	}
	set color(value: Color | undefined) {
		this.#inited = true;
		this.#color = value?.clone();
		$applyColor(this, this.#color);
	}
	//#region Clone
	cloneNode(deep?: boolean): WidgetBtn {
		const btn = super.cloneNode(deep) as WidgetBtn;
		btn.content = this.content.clone();
		btn.disabled = this.disabled;
		btn.state = this.state;
		btn.flat = this.flat;
		btn.rounded = this.rounded;
		btn.delay = this.delay;
		btn.progress = this.progress;
		btn.checked = this.checked;
		btn.color = this.color;
		return btn;
	}
	//#region Nav
	get nonNavigable() {
		return this.disabled;
	}
}

customElements.define('w-btn', WidgetBtn);
