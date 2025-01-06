import { Color, RGB, RGBA } from 'abm-utils/color';
import { $apply } from 'utils/dom';

export type ColorScheme = 'system' | 'light' | 'dark';

const SCHEME_LIST: ColorScheme[] = ['system', 'light', 'dark'];

class Theme {
	#color = Color.rgb([0, 0xaa, 0]);
	constructor() {
		document.addEventListener('DOMContentLoaded', () => this.#updateCSSProperty());
	}
	#updateCSSProperty() {
		$apply(document.body, {
			style: this.#color.getTokens(),
		});
	}
	get colorScheme() {
		let scheme = document.body.getAttribute('ui-scheme') as any;
		if (!SCHEME_LIST.includes(scheme as any)) {
			scheme = SCHEME_LIST[0];
		}
		return scheme;
	}
	set colorScheme(value: ColorScheme) {
		if (!SCHEME_LIST.includes(value)) {
			value = SCHEME_LIST[0];
		}
		document.body.setAttribute('ui-scheme', value);
	}
	get color(): Color {
		return this.#color.clone();
	}
	set color(value: Color | RGB | RGBA | string) {
		if (value instanceof Color) {
			this.#color = value.clone();
		} else if (typeof value === 'string') {
			this.#color.hex(value);
		} else {
			this.#color.rgb(value as RGB);
		}
		this.#updateCSSProperty();
	}
}

export const theme = new Theme();
