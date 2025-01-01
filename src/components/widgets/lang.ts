import { LocaleOptions, configs } from 'configs';

export class WidgetLang extends HTMLElement {
	#inited = false;
	#shadowRoot = this.attachShadow({ mode: 'open' });
	#namespace = '';
	#key = '';
	options?: LocaleOptions;
	#handler = () => {
		this.#reset();
	};
	connectedCallback() {
		configs.locale.on(this.#namespace, this.#handler);
		if (this.#inited) {
			this.#reset();
			return;
		}
		this.#inited = true;
		this.key = this.textContent ?? '';
	}
	disconnectedCallback() {
		configs.locale.off(this.#namespace, this.#handler);
	}
	#reset() {
		this.#shadowRoot.textContent = configs.locale.get(this.key, this.options);
		this.#shadowRoot.innerHTML = this.#shadowRoot.innerHTML.replace('\n', '<br>');
	}
	get namespace() {
		return this.#namespace;
	}
	set namespace(value: string) {
		this.#inited = true;
		if (value === this.#namespace) return;
		configs.locale.off(this.#namespace, this.#handler);
		this.#namespace = value;
		configs.locale.on(this.#namespace, this.#handler);
		this.#reset();
	}
	get key() {
		if (!this.#namespace) return this.#key;
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
	cloneNode(deep?: boolean): WidgetLang {
		const lang = super.cloneNode(deep) as WidgetLang;
		lang.key = this.key;
		lang.options = this.options;
		return lang;
	}
}

customElements.define('w-lang', WidgetLang);
