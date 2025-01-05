import { configs } from 'configs';
import { icons } from 'configs/icon';
import { $div } from 'utils/dom';
import { Widget } from './base';

export interface WidgetIconProp {
	namespace?: string;
	key?: string;
}

export class WidgetIcon extends Widget {
	#inited = false;
	#shadowRoot = this.attachShadow({ mode: 'open' });
	#element = $div();
	#namespace = '';
	#key = '';
	constructor() {
		super();
		this.#shadowRoot.prepend(icons.getImporter(), this.#element);
	}
	#handler = () => {
		this.#reset();
	};
	connectedCallback() {
		configs.icons.on('update:default-namespace', this.#handler);
		if (this.#inited) {
			this.#reset();
			return;
		}
		this.#inited = true;
		this.key = this.textContent ?? '';
	}
	disconnectedCallback() {
		configs.icons.off('update:default-namespace', this.#handler);
	}
	#reset() {
		const namespace = this.namespace;
		this.#element.className = '';
		this.#element.classList.add(namespace, `${namespace}-${this.#key}`);
	}
	get namespace() {
		if (this.#namespace === '') return configs.icons.defaultNamespace;
		return this.#namespace;
	}
	set namespace(value: string) {
		this.#inited = true;
		this.#namespace = value;
		this.#reset();
	}
	get key() {
		return `${this.namespace}:${this.#key}`;
	}
	set key(value: string) {
		this.#inited = true;
		const i = value.indexOf(':');
		if (i !== -1) {
			this.#namespace = value.slice(0, i);
		}
		this.#key = value.slice(i + 1);
		this.#reset();
	}
	//#region Clone
	cloneNode(deep?: boolean): WidgetIcon {
		const icon = super.cloneNode(deep) as WidgetIcon;
		icon.key = this.key;
		return icon;
	}
	//#region Prop
	_prop?: WidgetIconProp;
}

customElements.define('w-icon', WidgetIcon);
