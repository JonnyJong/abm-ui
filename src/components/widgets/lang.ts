import { LocaleOptions, configs } from '../../configs';
import { LocaleProvider } from '../../configs/locale';
import { Widget } from './base';

export interface WidgetLangProp {
	namespace?: string;
	key?: string;
}

export class WidgetLang extends Widget {
	#inited = false;
	#shadowRoot = this.attachShadow({ mode: 'open' });
	#locale = new LocaleProvider();
	#handler = () => {
		this.#reset();
	};
	connectedCallback() {
		configs.locale.on(this.#locale.namespace, this.#handler);
		if (this.#inited) {
			this.#reset();
			return;
		}
		this.#inited = true;
		this.key = this.textContent ?? '';
	}
	disconnectedCallback() {
		configs.locale.off(this.#locale.namespace, this.#handler);
	}
	#reset() {
		this.#shadowRoot.textContent = this.#locale.text();
		this.#shadowRoot.innerHTML = this.#shadowRoot.innerHTML.replace('\n', '<br>');
	}
	get namespace() {
		return this.#locale.namespace;
	}
	set namespace(value: string) {
		this.#inited = true;
		const namespace = this.#locale.namespace;
		if (value === namespace) return;
		configs.locale.off(namespace, this.#handler);
		this.#locale.namespace = value;
		configs.locale.on(value, this.#handler);
		this.#reset();
	}
	get key() {
		return this.#locale.key;
	}
	set key(value: string) {
		this.#inited = true;
		this.#locale.key = value;
		this.#reset();
	}
	get options() {
		return this.#locale.options;
	}
	set options(value: LocaleOptions | undefined) {
		this.#locale.options = value;
		this.#reset();
	}
	cloneNode(deep?: boolean): WidgetLang {
		const lang = super.cloneNode(deep) as WidgetLang;
		lang.options = this.options;
		lang.key = this.key;
		return lang;
	}
	toString() {
		return this.textContent;
	}
	_prop?: WidgetLang;
}

customElements.define('w-lang', WidgetLang);
