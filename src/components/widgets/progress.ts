import { configs } from 'configs';
import { Color } from 'utils/color';
import { $applyColor, $div } from 'utils/dom';
import { runSync } from 'utils/function';
import { clamp } from 'utils/math';
import { Widget } from './base';

export interface WidgetProgressProp {
	value?: number;
	color?: Color | undefined;
}

export class WidgetProgress extends Widget {
	#inited = false;
	connectedCallback() {
		if (this.#inited) return;
		this.#inited = true;
		const color = this.getAttribute('color');
		if (color)
			runSync(() => {
				this.color = Color.hex(color);
			});
	}
	get value(): number {
		return NaN;
	}
	// biome-ignore lint/suspicious/noEmptyBlockStatements: <explanation>
	set value(_value: number) {}
	#color?: Color;
	get color() {
		return this.#color?.clone();
	}
	set color(value: Color | undefined) {
		this.#inited = true;
		this.#color = value?.clone();
		$applyColor(this, this.#color);
	}
	cloneNode(deep?: boolean): WidgetProgress {
		const prog = super.cloneNode(deep) as WidgetProgress;
		prog.color = this.color;
		return prog;
	}
	_prop?: WidgetProgressProp;
}

//#region Line
export class WidgetProgressBar extends WidgetProgress {
	#inited = false;
	#shadowRoot = this.attachShadow({ mode: 'open' });
	#track = $div({ class: 'w-progress-bar-track' });
	#thumb = $div({ class: ['w-progress-bar-thumb', 'w-progress-bar-running'] });
	#value = NaN;
	constructor() {
		super();
		this.#shadowRoot.append(configs.getCSSImporter(), this.#track);
		this.#track.append(this.#thumb);
	}
	connectedCallback() {
		super.connectedCallback();
		if (this.#inited) return;
		this.#inited = true;
		const value = this.getAttribute('value');
		if (value) this.value = parseFloat(value);
	}
	get value() {
		return this.#value;
	}
	set value(value: number) {
		if (typeof value !== 'number') value = parseFloat(value);
		this.#value = clamp(0, value, 100);
		if (isNaN(this.#value)) {
			this.#thumb.style.width = '';
			this.#thumb.classList.add('w-progress-bar-running');
			return;
		}
		this.#thumb.classList.remove('w-progress-bar-running');
		this.#thumb.style.width = `${this.#value}%`;
	}
	cloneNode(deep?: boolean): WidgetProgressBar {
		const prog = super.cloneNode(deep) as WidgetProgressBar;
		prog.value = this.value;
		return prog;
	}
}

customElements.define('w-progress-bar', WidgetProgressBar);

//#region Ring
export interface WidgetProgressRingProp extends WidgetProgressProp {
	thickness?: number;
}

const RING_TEMPLATE =
	'<svg class="w-progress-ring-track w-progress-ring-track-running" viewBox="25 25 50 50"><circle class="w-progress-ring-thumb" r="20" cy="50" cx="50"></circle></svg>';
const RING_OFFSET_BEGIN = 157.3;
const RING_OFFSET_SLOPE = -74 / 24;
export class WidgetProgressRing extends WidgetProgress {
	declare _prop?: WidgetProgressRingProp;
	#inited = false;
	#shadowRoot = this.attachShadow({ mode: 'open' });
	#track: SVGElement;
	#value = NaN;
	#thickness = 5;
	#offset = 141;
	constructor() {
		super();
		this.#shadowRoot.innerHTML = RING_TEMPLATE;
		this.#shadowRoot.prepend(configs.getCSSImporter());
		this.#track = this.#shadowRoot.querySelector('svg')!;
	}
	connectedCallback() {
		super.connectedCallback();
		if (this.#inited) return;
		this.#inited = true;
		const value = this.getAttribute('value');
		if (value) this.value = parseFloat(value);
		const thickness = this.getAttribute('thickness');
		if (thickness) this.value = parseFloat(thickness);
	}
	get value() {
		return this.#value;
	}
	set value(value: number) {
		if (typeof value !== 'number') value = parseFloat(value);
		this.#value = clamp(0, value, 100);
		if (isNaN(this.#value)) {
			this.#track.classList.add('w-progress-ring-track-running');
			return;
		}
		this.#track.classList.remove('w-progress-ring-track-running');
		this.#track.style.setProperty('--w-progress', `${((100 - this.#value) / 100) * this.#offset}`);
	}
	get thickness() {
		return this.#thickness;
	}
	set thickness(value: number) {
		if (isNaN(value)) return;
		this.#thickness = clamp(1, value, 24);
		this.#track.style.setProperty('--w-progress-ring-thickness', `${this.#thickness}`);
		this.#offset = RING_OFFSET_BEGIN + value * RING_OFFSET_SLOPE;
		this.#track.style.setProperty('--w-progress-offset', `${this.#offset}`);
		this.#track.style.setProperty('--w-progress-offset-a', `${this.#offset * 0.75}`);
		this.#track.style.setProperty('--w-progress-offset-b', `-${this.#offset * 0.25}`);
		this.#track.style.setProperty('--w-progress-offset-c', `-${this.#offset}`);
	}
	cloneNode(deep?: boolean): WidgetProgressRing {
		const prog = super.cloneNode(deep) as WidgetProgressRing;
		prog.value = this.value;
		prog.thickness = this.thickness;
		return prog;
	}
}

customElements.define('w-progress-ring', WidgetProgressRing);
