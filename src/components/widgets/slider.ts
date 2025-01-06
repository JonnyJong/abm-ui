import { clamp, genFitter } from 'abm-utils/math';
import { tooltips } from 'components/tooltips';
import { configs } from 'configs';
import { events } from 'event';
import { EventBase, IEventBaseCreateOptions } from 'event/api/base';
import { EventValue, IEventValueCreateOptions } from 'event/api/value';
import { EventHandler, Events, IEventSource } from 'event/events';
import { UIEventSlide } from 'event/ui/slide';
import { KeyboardEvents, keyboard } from 'keyboard';
import { Navigable, NavigateCallbackArgs, navigate } from 'navigate';
import { Widget } from './base';
import TEMPLATE from './templates/slider.static.pug';

export interface WidgetSliderEvents {
	input: IEventValueCreateOptions<WidgetSlider, number>;
	change: IEventBaseCreateOptions<WidgetSlider>;
}

export interface WidgetSliderProp {
	disabled?: boolean;
	from?: number;
	to?: number;
	value?: number;
	step?: number;
}

const TRAILING_ZERO = /0+$/;
const TRAILING_DOT = /\.$/;

export class WidgetSlider extends Widget implements IEventSource<WidgetSliderEvents>, Navigable {
	#inited = false;
	#events = new Events<WidgetSliderEvents>(['change', 'input']);
	#shadowRoot = this.attachShadow({ mode: 'open' });
	#container: HTMLDivElement;
	#track: HTMLDivElement;
	#thumb: HTMLDivElement;
	constructor() {
		super();
		this.#shadowRoot.innerHTML = TEMPLATE;
		this.#shadowRoot.prepend(configs.getCSSImporter());
		this.#container = this.#shadowRoot.querySelector('.w-slider')!;
		this.#track = this.#shadowRoot.querySelector('.w-slider-track')!;
		this.#thumb = this.#shadowRoot.querySelector('.w-slider-thumb')!;
		events.hover.add(this.#container);
		events.slide.on(this.#container, this.#slideHandler);
		tooltips.set(this, '0');
	}
	connectedCallback() {
		this.toggleAttribute('ui-nav', true);
		if (this.#inited) return;
		this.#inited = true;
		const from = this.getAttribute('from');
		if (from) this.from = parseFloat(from);
		const to = this.getAttribute('to');
		if (to) this.to = parseFloat(to);
		const step = this.getAttribute('step');
		if (step) this.step = parseFloat(step);
		const value = this.getAttribute('value');
		if (value) this.value = parseFloat(value);
	}
	#getPercentage(position: number) {
		const { left, width } = this.#track.getBoundingClientRect();
		return clamp(0, (position - left) / width, 1);
	}
	#getValue(percentage: number) {
		return this.#fit((this.#to - this.#from) * percentage + this.#from);
	}
	#updateView(percentage?: number) {
		if (typeof percentage === 'number') {
			this.#updateTooltips(this.#getValue(percentage));
		} else {
			this.#updateTooltips(this.#value);
			percentage = (this.#value - this.#from) / (this.#to - this.#from);
		}
		this.#container.style.setProperty('--w-slider-value', `${percentage * 100}%`);
	}
	#updateTooltips(value: number) {
		let tooltip = value.toFixed(this.#step.toString().split('.')[1]?.length ?? 2);
		tooltip = tooltip.replace(TRAILING_ZERO, '').replace(TRAILING_DOT, '');
		tooltips.set(this, tooltip);
	}
	//#region Disabled
	get disabled() {
		return this.hasAttribute('disabled');
	}
	set disabled(value: boolean) {
		this.#inited = true;
		this.toggleAttribute('disabled', value);
		if (!value) return;
		this.#container.classList.remove('w-slider-draging');
		events.slide.cancel(this.#container);
		tooltips.unlock();
		this.#updateView();
	}
	//#region Value
	#from = 0;
	#to = 100;
	#value = 0;
	#step = 0;
	#fit = genFitter(this.#from, this.#to, this.#step);
	get from() {
		return this.#from;
	}
	set from(value: number) {
		if (!Number.isFinite(value)) return;
		this.#from = value;
		this.#fit = genFitter(this.#from, this.#to, this.#step);
		this.#value = this.#fit(this.#value);
		this.#updateView();
	}
	get to() {
		return this.#to;
	}
	set to(value: number) {
		if (!Number.isFinite(value)) return;
		this.#to = value;
		this.#fit = genFitter(this.#from, this.#to, this.#step);
		this.#value = this.#fit(this.#value);
		this.#updateView();
	}
	get value() {
		return this.#value;
	}
	set value(value: number) {
		if (!Number.isFinite(value)) return;
		this.#value = this.#fit(value);
		this.#updateView();
	}
	get step() {
		return this.#step;
	}
	set step(value: number) {
		if (!Number.isFinite(value)) return;
		this.#step = value;
		this.#fit = genFitter(this.#from, this.#to, this.#step);
		this.#value = this.#fit(this.#value);
		this.#updateView();
	}
	//#region Event
	#slideHandler = (event: UIEventSlide) => {
		if (this.disabled) return;

		if (event.state === 'start') {
			keyboard.on('aliasPress', this.#aliasPressHandler);
		}

		if (event.state === 'end') {
			tooltips.unlock();
			keyboard.off('aliasPress', this.#aliasPressHandler);
		} else tooltips.lock(this);

		this.#container.classList.toggle('w-slider-draging', event.state === 'move');

		const percentage = this.#getPercentage(event.x);

		if (event.state === 'end') {
			this.#value = this.#getValue(percentage);
			this.#updateView();
			this.#events.emit(new EventBase('change', { target: this }));
			return;
		}

		this.#updateView(percentage);
		this.#events.emit(
			new EventValue('input', {
				target: this,
				value: this.#getValue(percentage),
			}),
		);
	};
	#aliasPressHandler = (event: KeyboardEvents['aliasPress']) => {
		if (event.key !== 'ui.cancel') return;
		keyboard.off('aliasPress', this.#aliasPressHandler);
		events.slide.cancel(this.#container);
		tooltips.unlock();
		this.#container.classList.remove('w-slider-draging');
		this.#updateView();
		this.#events.emit(
			new EventValue('input', {
				target: this,
				value: this.value,
			}),
		);
	};
	on<Type extends keyof WidgetSliderEvents>(
		type: Type,
		handler: EventHandler<Type, WidgetSliderEvents[Type], any>,
	): void {
		this.#events.on(type, handler);
	}
	off<Type extends keyof WidgetSliderEvents>(
		type: Type,
		handler: EventHandler<Type, WidgetSliderEvents[Type], any>,
	): void {
		this.#events.off(type, handler);
	}
	//#region Clone
	cloneNode(deep?: boolean): WidgetSlider {
		const node = super.cloneNode(deep) as WidgetSlider;
		node.disabled = this.disabled;
		node.from = this.from;
		node.to = this.to;
		node.step = this.step;
		node.value = this.value;
		return node;
	}
	//#region Nav
	get nonNavigable() {
		return this.disabled;
	}
	#navCurrent = 0;
	#navActiveHandler() {
		const locking = navigate.locking;
		navigate.lock(locking ? null : this.#thumb);
		// Locked
		if (!locking) {
			tooltips.lock(this);
			this.#navCurrent = this.#value;
			return;
		}
		// Unlocked
		tooltips.unlock();
		this.#value = this.#navCurrent;
		this.#events.emit(new EventBase('change', { target: this }));
	}
	navCallback = ({ direction, active, cancel }: NavigateCallbackArgs[0]) => {
		if (active === false) {
			this.#navActiveHandler();
			return;
		}

		if (cancel) {
			navigate.lock(null);
			this.#updateView();
			tooltips.unlock();
			this.#events.emit(new EventValue('input', { target: this, value: this.#value }));
			return;
		}

		if (!direction) return;

		let step = (this.#to - this.#from) / 100;
		if (this.#step) step = step > 0 ? this.#step : -this.#step;
		this.#navCurrent += ['up', 'right'].includes(direction) ? step : -step;
		this.#navCurrent = this.#fit(this.#navCurrent);

		const percentage = (this.#navCurrent - this.#from) / (this.#to - this.#from);
		this.#updateView(percentage);
		this.#events.emit(new EventValue('input', { target: this, value: this.#navCurrent }));
	};
	//#region Prop
	_prop?: WidgetSliderProp;
	// TODO: vertical slider
}

customElements.define('w-slider', WidgetSlider);
