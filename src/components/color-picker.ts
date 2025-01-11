import { Color, clamp } from 'abm-utils';
import { configs } from '../configs';
import { events } from '../event';
import { EventBase, IEventBaseCreateOptions } from '../event/api/base';
import { EventValue, IEventValueCreateOptions } from '../event/api/value';
import { EventHandler, Events, IEventSource } from '../event/events';
import { $div, $new } from '../utils/dom';
import { Dialog } from './dialog';
import { WidgetNumber, WidgetText } from './widgets/input';
import { WidgetLang } from './widgets/lang';
import { WidgetNav } from './widgets/nav';
import { WidgetSlider } from './widgets/slider';

export interface ColorPickerEvents {
	input: IEventValueCreateOptions<ColorPicker, Color>;
	change: IEventBaseCreateOptions<ColorPicker>;
	confirm: IEventBaseCreateOptions<ColorPicker>;
	cancel: IEventBaseCreateOptions<ColorPicker>;
}

const HEX_REGEX = /[0-9a-fA-F]{1,8}/;

export class ColorPicker implements IEventSource<ColorPickerEvents> {
	#events = new Events<ColorPickerEvents>(['change', 'input', 'confirm', 'cancel']);
	#color: Color;
	#current: Color;
	constructor(value?: Color | string, alpha?: boolean) {
		if (value instanceof Color) this.#color = value.clone();
		else if (typeof value === 'string') this.#color = Color.hexa(value);
		else this.#color = configs.theme.color;
		this.#current = this.#color;
		if (alpha) {
			this.#alpha = true;
			this.#content.classList.add('ui-color-alpha-enable');
		}
		// Controls
		this.#tab.display = 'text';
		this.#tab.items = [
			{ id: 'rgb', content: { text: 'RGB', icon: '' } },
			{ id: 'hsl', content: { text: 'HSL', icon: '' } },
		];
		this.#tab.value = 'rgb';
		this.#alphaSlider.from = 0;
		this.#alphaSlider.to = 255;
		this.#alphaSlider.step = 1;
		this.#alphaValue.min = 0;
		this.#alphaValue.max = 255;
		this.#alphaValue.step = 1;
		this.#alphaValue.default = 255;
		this.#hslMainSlider.from = 0;
		this.#hslMainSlider.to = 1;
		this.#hSlider.from = 0;
		this.#hSlider.to = 360;
		this.#hValue.min = 0;
		this.#hValue.max = 360;
		this.#sSlider.from = 0;
		this.#sSlider.to = 100;
		this.#sValue.min = 0;
		this.#sValue.max = 100;
		this.#lSlider.from = 0;
		this.#lSlider.to = 100;
		this.#lValue.min = 0;
		this.#lValue.max = 100;
		this.#rSlider.from = 0;
		this.#rSlider.to = 255;
		this.#rSlider.step = 1;
		this.#rValue.min = 0;
		this.#rValue.max = 255;
		this.#rValue.step = 1;
		this.#gSlider.from = 0;
		this.#gSlider.to = 255;
		this.#gSlider.step = 1;
		this.#gValue.min = 0;
		this.#gValue.max = 255;
		this.#gValue.step = 1;
		this.#bSlider.from = 0;
		this.#bSlider.to = 255;
		this.#bSlider.step = 1;
		this.#bValue.min = 0;
		this.#bValue.max = 255;
		this.#bValue.step = 1;
		// Event
		this.#dialog.on('action', ({ details }) => this.#events.emit(new EventBase(details, { target: this })));
		this.#tab.on('change', () => {
			const rgb = this.#tab.value === 'rgb';
			this.#rgbContent.style.display = rgb ? '' : 'none';
			this.#hslContent.style.display = rgb ? 'none' : '';
		});
		// Event: HEX
		this.#hexValue.on('input', () => {
			const result = this.#hexValue.value.match(HEX_REGEX);
			if (!result) return;
			let hex = result[0];
			if (hex.length < 3) {
				hex = hex.repeat(3).slice(0, 3);
			} else if (hex.length === 5) {
				hex += hex[4];
			} else if (hex.length === 7) {
				hex += hex[6];
			}
			if (hex.length === 3) hex += 'f';
			if (hex.length === 6) hex += 'ff';
			this.#current.hexa(hex);
			this.#updateIndicator();
			this.#updateRGB();
			this.#updateHSL();
			this.#updateAlpha();
			this.#emit(true);
		});
		this.#hexValue.on('confirm', () => {
			this.#updateHEX();
			this.#emit();
		});
		// Event: Alpha
		this.#alphaSlider.on('input', ({ value }) => {
			this.#alphaValue.value = value;
			this.#current.alphaByte(value);
			this.#updateIndicator();
			this.#updateHEX();
			this.#emit(true);
		});
		this.#alphaSlider.on('change', () => {
			this.#alphaValue.value = this.#alphaSlider.value;
			this.#current.alphaByte(this.#alphaSlider.value);
			this.#updateIndicator();
			this.#emit();
		});
		this.#alphaValue.on('input', () => {
			this.#alphaSlider.value = this.#alphaValue.value;
			this.#current.alphaByte(this.#alphaValue.value);
			this.#updateIndicator();
			this.#emit(true);
		});
		this.#alphaValue.on('confirm', () => this.#emit());
		// Event: RGB
		this.#rSlider.on('input', ({ value }) => {
			this.#current.rgba([value, this.#gSlider.value, this.#bSlider.value, this.#alphaSlider.value]);
			this.#rValue.value = value;
			this.#rSlider.style.setProperty('--w-slider-thumb', `#${value.toString(16).padStart(2, '0')}0000`);
			this.#updateIndicator();
			this.#updateHEX();
			this.#updateHSL();
			this.#emit(true);
		});
		this.#rSlider.on('change', () => {
			this.#current.rgba([this.#rSlider.value, this.#gSlider.value, this.#bSlider.value, this.#alphaSlider.value]);
			this.#rValue.value = this.#rSlider.value;
			this.#rSlider.style.setProperty('--w-slider-thumb', `#${this.#rSlider.value.toString(16).padStart(2, '0')}0000`);
			this.#updateIndicator();
			this.#updateHEX();
			this.#updateHSL();
			this.#emit();
		});
		this.#rValue.on('input', () => {
			this.#current.rgba([this.#rValue.value, this.#gSlider.value, this.#bSlider.value, this.#alphaSlider.value]);
			this.#rSlider.value = this.#rValue.value;
			this.#rSlider.style.setProperty('--w-slider-thumb', `#${this.#rValue.value.toString(16).padStart(2, '0')}0000`);
			this.#updateIndicator();
			this.#updateHEX();
			this.#updateHSL();
			this.#emit(true);
		});
		this.#rValue.on('confirm', () => this.#emit());
		this.#gSlider.on('input', ({ value }) => {
			this.#current.rgba([this.#rSlider.value, value, this.#bSlider.value, this.#alphaSlider.value]);
			this.#gValue.value = value;
			this.#gSlider.style.setProperty('--w-slider-thumb', `#00${value.toString(16).padStart(2, '0')}00`);
			this.#updateIndicator();
			this.#updateHEX();
			this.#updateHSL();
			this.#emit(true);
		});
		this.#gSlider.on('change', () => {
			this.#current.rgba([this.#rSlider.value, this.#gSlider.value, this.#bSlider.value, this.#alphaSlider.value]);
			this.#gValue.value = this.#gSlider.value;
			this.#gSlider.style.setProperty('--w-slider-thumb', `#00${this.#gSlider.value.toString(16).padStart(2, '0')}00`);
			this.#updateIndicator();
			this.#updateHEX();
			this.#updateHSL();
			this.#emit();
		});
		this.#gValue.on('input', () => {
			this.#current.rgba([this.#rSlider.value, this.#gValue.value, this.#bSlider.value, this.#alphaSlider.value]);
			this.#gSlider.value = this.#gValue.value;
			this.#gSlider.style.setProperty('--w-slider-thumb', `#00${this.#gValue.value.toString(16).padStart(2, '0')}00`);
			this.#updateIndicator();
			this.#updateHEX();
			this.#updateHSL();
			this.#emit(true);
		});
		this.#gValue.on('confirm', () => this.#emit());
		this.#bSlider.on('input', ({ value }) => {
			this.#current.rgba([this.#rSlider.value, this.#gSlider.value, value, this.#alphaSlider.value]);
			this.#bValue.value = value;
			this.#bSlider.style.setProperty('--w-slider-thumb', `#0000${value.toString(16).padStart(2, '0')}`);
			this.#updateIndicator();
			this.#updateHEX();
			this.#updateHSL();
			this.#emit(true);
		});
		this.#bSlider.on('change', () => {
			this.#current.rgba([this.#rSlider.value, this.#gSlider.value, this.#bSlider.value, this.#alphaSlider.value]);
			this.#bValue.value = this.#bSlider.value;
			this.#bSlider.style.setProperty('--w-slider-thumb', `#0000${this.#bSlider.value.toString(16).padStart(2, '0')}`);
			this.#updateIndicator();
			this.#updateHEX();
			this.#updateHSL();
			this.#emit();
		});
		this.#bValue.on('input', () => {
			this.#current.rgba([this.#rSlider.value, this.#gSlider.value, this.#bValue.value, this.#alphaSlider.value]);
			this.#bSlider.value = this.#bValue.value;
			this.#bSlider.style.setProperty('--w-slider-thumb', `#0000${this.#bValue.value.toString(16).padStart(2, '0')}`);
			this.#updateIndicator();
			this.#updateHEX();
			this.#updateHSL();
			this.#emit(true);
		});
		this.#bValue.on('confirm', () => this.#emit());
		// Event: HSL
		events.slide.on(this.#hslMain, (event) => {
			const { left, width, top, height } = this.#hslMain.getBoundingClientRect();
			const h = clamp(0, ((event.x - left) / width) * 360, 360);
			const s = clamp(0, 1 - (event.y - top) / height, 1);

			this.#hslPicker.style.left = `${h / 3.6}%`;
			this.#hslPicker.style.top = `${(1 - s) * 100}%`;
			this.#hSlider.value = h;
			this.#hSlider.style.setProperty('--w-slider-thumb', Color.hsl([h, 1, 0.5]).hex());
			this.#hValue.value = h;
			this.#sSlider.value = s * 100;
			this.#sSlider.style.setProperty('--w-slider-thumb', Color.hsl([h, s, 0.5]).hex());
			this.#sSlider.style.setProperty(
				'--w-slider-track',
				`linear-gradient(to right, #888, hsl(${h.toFixed(2)}deg 100% 50%))`,
			);
			this.#sValue.value = s * 100;

			this.#current.hsla([h, s, this.#lSlider.value / 100, this.#alphaSlider.value / 255]);
			this.#updateIndicator();
			this.#updateHEX();
			this.#updateRGB();
			this.#emit(event.state !== 'end');
		});
		this.#hslMainSlider.on('input', ({ value: l }) => {
			this.#hslMainSlider.style.setProperty(
				'--w-slider-thumb',
				`#${Math.round(l * 255)
					.toString(16)
					.padStart(2, '0')
					.repeat(3)}`,
			);
			this.#lSlider.value = l * 100;
			this.#lSlider.style.setProperty(
				'--w-slider-thumb',
				`#${Math.round(l * 255)
					.toString(16)
					.padStart(2, '0')
					.repeat(3)}`,
			);
			this.#lValue.value = l * 100;

			this.#current.hsla([this.#hSlider.value, this.#sSlider.value / 100, l, this.#alphaSlider.value / 255]);
			this.#updateIndicator();
			this.#updateHEX();
			this.#updateRGB();
			this.#emit(true);
		});
		this.#hslMainSlider.on('change', () => this.#emit());
		this.#hSlider.on('input', ({ value: h }) => {
			const s = this.#sValue.value / 100;

			this.#hslPicker.style.left = `${h / 3.6}%`;
			this.#hSlider.style.setProperty('--w-slider-thumb', Color.hsl([h, 1, 0.5]).hex());
			this.#hValue.value = h;
			this.#sSlider.style.setProperty('--w-slider-thumb', Color.hsl([h, s, 0.5]).hex());
			this.#sSlider.style.setProperty(
				'--w-slider-track',
				`linear-gradient(to right, #888, hsl(${h.toFixed(2)}deg 100% 50%))`,
			);

			this.#current.hsla([h, this.#sSlider.value / 100, this.#lSlider.value / 100, this.#alphaSlider.value / 255]);
			this.#updateIndicator();
			this.#updateHEX();
			this.#updateRGB();
			this.#emit(true);
		});
		this.#hSlider.on('change', () => this.#emit());
		this.#hValue.on('input', () => {
			const h = this.#hValue.value;
			const s = this.#sValue.value / 100;

			this.#hslPicker.style.left = `${h / 3.6}%`;
			this.#hSlider.value = h;
			this.#hSlider.style.setProperty('--w-slider-thumb', Color.hsl([h, 1, 0.5]).hex());
			this.#sSlider.style.setProperty('--w-slider-thumb', Color.hsl([h, s, 0.5]).hex());
			this.#sSlider.style.setProperty(
				'--w-slider-track',
				`linear-gradient(to right, #888, hsl(${h.toFixed(2)}deg 100% 50%))`,
			);

			this.#current.hsla([h, this.#sSlider.value / 100, this.#lSlider.value / 100, this.#alphaSlider.value / 255]);
			this.#updateIndicator();
			this.#updateHEX();
			this.#updateRGB();
			this.#emit(true);
		});
		this.#hValue.on('confirm', () => this.#emit());
		this.#sSlider.on('input', ({ value: s }) => {
			const h = this.#hValue.value;

			this.#hslPicker.style.top = `${100 - s}%`;
			this.#sSlider.style.setProperty('--w-slider-thumb', Color.hsl([h, s / 100, 0.5]).hex());
			this.#sValue.value = s;

			this.#current.hsla([h, s / 100, this.#lSlider.value / 100, this.#alphaSlider.value / 255]);
			this.#updateIndicator();
			this.#updateHEX();
			this.#updateRGB();
			this.#emit(true);
		});
		this.#sSlider.on('change', () => this.#emit());
		this.#sValue.on('input', () => {
			const h = this.#hValue.value;
			const s = this.#sValue.value;

			this.#hslPicker.style.top = `${100 - s}%`;
			this.#sSlider.style.setProperty('--w-slider-thumb', Color.hsl([h, s / 100, 0.5]).hex());
			this.#sSlider.value = s;

			this.#current.hsla([h, s / 100, this.#lSlider.value / 100, this.#alphaSlider.value / 255]);
			this.#updateIndicator();
			this.#updateHEX();
			this.#updateRGB();
			this.#emit(true);
		});
		this.#sValue.on('confirm', () => this.#emit());
		this.#lSlider.on('input', ({ value: l }) => {
			this.#hslMainSlider.value = l / 100;
			this.#hslMainSlider.style.setProperty(
				'--w-slider-thumb',
				`#${Math.round(l * 2.55)
					.toString(16)
					.padStart(2, '0')
					.repeat(3)}`,
			);
			this.#lSlider.style.setProperty(
				'--w-slider-thumb',
				`#${Math.round(l * 2.55)
					.toString(16)
					.padStart(2, '0')
					.repeat(3)}`,
			);
			this.#lValue.value = l;

			this.#current.hsla([this.#hSlider.value, this.#sSlider.value / 100, l / 100, this.#alphaSlider.value / 255]);
			this.#updateIndicator();
			this.#updateHEX();
			this.#updateRGB();
			this.#emit(true);
		});
		this.#lSlider.on('change', () => this.#emit());
		this.#lValue.on('input', () => {
			const l = this.#lValue.value;

			this.#hslMainSlider.value = l / 100;
			this.#hslMainSlider.style.setProperty(
				'--w-slider-thumb',
				`#${Math.round(l * 2.55)
					.toString(16)
					.padStart(2, '0')
					.repeat(3)}`,
			);
			this.#lSlider.value = l;
			this.#lSlider.style.setProperty(
				'--w-slider-thumb',
				`#${Math.round(l * 2.55)
					.toString(16)
					.padStart(2, '0')
					.repeat(3)}`,
			);

			this.#current.hsla([this.#hSlider.value, this.#sSlider.value / 100, l / 100, this.#alphaSlider.value / 255]);
			this.#updateIndicator();
			this.#updateHEX();
			this.#updateRGB();
			this.#emit(true);
		});
		this.#lValue.on('confirm', () => this.#emit());
	}
	#emit(tmp?: boolean) {
		if (tmp) {
			this.#events.emit(new EventValue('input', { target: this, value: this.#current.clone() }));
			return;
		}
		this.#color = this.#current.clone();
		this.#events.emit(new EventBase('change', { target: this }));
	}
	#update() {
		this.#updateIndicator();
		this.#updateHEX();
		this.#updateAlpha();
		this.#updateHSL();
		this.#updateRGB();
	}
	//#region Tab
	#tab = $new<WidgetNav>('w-nav', { class: 'ui-color-tab' });
	//#region Indicator
	#indicator = $div({ class: 'ui-color-indicator' });
	#updateIndicator() {
		const hex = this.#current[this.#alpha ? 'hexa' : 'hex']();
		this.#indicator.style.setProperty('--ui-color', hex);
	}
	//#region Hex
	#hexValue = $new<WidgetText>('w-text', { class: 'ui-color-hex-value' });
	#updateHEX() {
		this.#hexValue.value = this.#current[this.#alpha ? 'hexa' : 'hex']().toUpperCase();
	}
	//#region Alpha
	#alphaSlider = $new<WidgetSlider>('w-slider', { class: 'ui-color-alpha-slider' });
	#alphaValue = $new<WidgetNumber>('w-number', { class: 'ui-color-alpha-value' });
	#updateAlpha() {
		this.#alphaSlider.value = this.#current.alphaByte();
		this.#alphaValue.value = this.#current.alphaByte();
	}
	//#region HSL
	#hslPicker = $div({ class: 'ui-color-picker' });
	#hslMain = $div({ class: 'ui-color-main' }, this.#hslPicker);
	#hslMainSlider = $new<WidgetSlider>('w-slider', { class: 'ui-color-main-slider' });
	#hSlider = $new<WidgetSlider>('w-slider', { class: 'ui-color-h', style: { gridArea: 'h-slider' } });
	#hValue = $new<WidgetNumber>('w-number', { style: { gridArea: 'h-value' } });
	#sSlider = $new<WidgetSlider>('w-slider', { class: 'ui-color-s', style: { gridArea: 's-slider' } });
	#sValue = $new<WidgetNumber>('w-number', { style: { gridArea: 's-value' } });
	#lSlider = $new<WidgetSlider>('w-slider', { class: 'ui-color-l', style: { gridArea: 'l-slider' } });
	#lValue = $new<WidgetNumber>('w-number', { style: { gridArea: 'l-value' } });
	#hslContent = $div(
		{ class: ['ui-color-hsl', 'ui-color-tab-content'], style: { display: 'none' } },
		$new<WidgetLang>('w-lang', { style: { gridArea: 'h-label' } }, 'ui.hue'),
		this.#hSlider,
		this.#hValue,
		$new<WidgetLang>('w-lang', { style: { gridArea: 's-label' } }, 'ui.saturation'),
		this.#sSlider,
		this.#sValue,
		$new<WidgetLang>('w-lang', { style: { gridArea: 'l-label' } }, 'ui.lightness'),
		this.#lSlider,
		this.#lValue,
	);
	#updateHSL() {
		const [h, s, l] = this.#current.hsl();
		this.#hslPicker.style.left = `${h / 3.6}%`;
		this.#hslPicker.style.top = `${(1 - s) * 100}%`;
		this.#hslMainSlider.value = l;
		this.#hslMainSlider.style.setProperty(
			'--w-slider-thumb',
			`#${Math.round(l * 255)
				.toString(16)
				.padStart(2, '0')
				.repeat(3)}`,
		);
		this.#hSlider.value = h;
		this.#hSlider.style.setProperty('--w-slider-thumb', Color.hsl([h, 1, 0.5]).hex());
		this.#hValue.value = h;
		this.#sSlider.value = s * 100;
		this.#sSlider.style.setProperty('--w-slider-thumb', Color.hsl([h, s, 0.5]).hex());
		this.#sSlider.style.setProperty(
			'--w-slider-track',
			`linear-gradient(to right, #888, hsl(${h.toFixed(2)}deg 100% 50%))`,
		);
		this.#sValue.value = s * 100;
		this.#lSlider.value = l * 100;
		this.#lSlider.style.setProperty(
			'--w-slider-thumb',
			`#${Math.round(l * 255)
				.toString(16)
				.padStart(2, '0')
				.repeat(3)}`,
		);
		this.#lValue.value = l * 100;
	}
	//#region RGB
	#rSlider = $new<WidgetSlider>('w-slider', { class: 'ui-color-r', style: { gridArea: 'h-slider' } });
	#rValue = $new<WidgetNumber>('w-number', { style: { gridArea: 'h-value' } });
	#gSlider = $new<WidgetSlider>('w-slider', { class: 'ui-color-g', style: { gridArea: 's-slider' } });
	#gValue = $new<WidgetNumber>('w-number', { style: { gridArea: 's-value' } });
	#bSlider = $new<WidgetSlider>('w-slider', { class: 'ui-color-b', style: { gridArea: 'l-slider' } });
	#bValue = $new<WidgetNumber>('w-number', { style: { gridArea: 'l-value' } });
	#rgbContent = $div(
		{ class: ['ui-color-rgb', 'ui-color-tab-content'] },
		$new<WidgetLang>('w-lang', { style: { gridArea: 'h-label' } }, 'ui.red'),
		this.#rSlider,
		this.#rValue,
		$new<WidgetLang>('w-lang', { style: { gridArea: 's-label' } }, 'ui.green'),
		this.#gSlider,
		this.#gValue,
		$new<WidgetLang>('w-lang', { style: { gridArea: 'l-label' } }, 'ui.blue'),
		this.#bSlider,
		this.#bValue,
	);
	#updateRGB() {
		const [r, g, b] = this.#current.rgb();
		this.#rSlider.value = r;
		this.#rSlider.style.setProperty('--w-slider-thumb', `#${r.toString(16).padStart(2, '0')}0000`);
		this.#rValue.value = r;
		this.#gSlider.value = g;
		this.#gSlider.style.setProperty('--w-slider-thumb', `#00${g.toString(16).padStart(2, '0')}00`);
		this.#gValue.value = g;
		this.#bSlider.value = b;
		this.#bSlider.style.setProperty('--w-slider-thumb', `#0000${b.toString(16).padStart(2, '0')}`);
		this.#bValue.value = b;
	}
	//#region Dialog
	#content = $div(
		{ class: 'ui-color' },
		this.#tab,
		this.#hslContent,
		this.#rgbContent,
		this.#indicator,
		$div({ class: 'ui-color-hex-label' }, 'HEX'),
		this.#hexValue,
		$new<WidgetLang>('w-lang', { class: 'ui-color-alpha-label' }, 'ui.alpha'),
		this.#alphaSlider,
		this.#alphaValue,
		this.#hslMain,
		this.#hslMainSlider,
	);
	#dialog = new Dialog({
		title: 'ui.color_picker',
		content: this.#content,
		actions: [
			{
				id: 'confirm',
				content: 'ui.confirm',
				state: 'primary',
			},
			{
				id: 'cancel',
				content: 'ui.cancel',
			},
		],
	});
	open() {
		this.#dialog.open();
		this.#update();
		// HACK: fix tab indicator
		setTimeout(() => {
			this.#tab.value = this.#tab.value;
		}, 300);
	}
	close() {
		this.#dialog.close();
	}
	//#region Value
	get value(): Color {
		return this.#color.clone();
	}
	set value(value: Color | string) {
		if (value instanceof Color) this.#color = value.clone();
		else value = Color.hexa(value);
		this.#update();
	}
	//#region Alpha
	#alpha = false;
	get alpha() {
		return this.#alpha;
	}
	set alpha(value: boolean) {
		this.#alpha = !!value;
		this.#update();
		this.#content.classList.toggle('ui-color-alpha-enable', value);
	}
	//#region Event
	on<Type extends keyof ColorPickerEvents>(type: Type, handler: EventHandler<Type, ColorPickerEvents[Type], any>): void {
		this.#events.on(type, handler);
	}
	off<Type extends keyof ColorPickerEvents>(
		type: Type,
		handler: EventHandler<Type, ColorPickerEvents[Type], any>,
	): void {
		this.#events.off(type, handler);
	}
	//#region Other
	static async pickColor(value?: Color | string, alpha?: boolean): Promise<Color | undefined> {
		const picker = new ColorPicker(value, alpha);
		picker.open();
		const result = await new Promise<Color | undefined>((resolve) => {
			picker.on('confirm', () => resolve(picker.value));
			picker.on('cancel', () => resolve(undefined));
		});
		picker.close();
		return result;
	}
}
