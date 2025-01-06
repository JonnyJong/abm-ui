import { run } from 'abm-utils/function';

export type LocaleOptions = Record<string, any>;

export interface LocaleDict {
	get(key: string, options?: LocaleOptions): string;
}

export type UIDefaultKeys =
	| 'ui.confirm'
	| 'ui.cancel'
	| 'ui.ok'
	| 'ui.color_picker'
	| 'ui.alpha'
	| 'ui.red'
	| 'ui.green'
	| 'ui.blue'
	| 'ui.hue'
	| 'ui.saturation'
	| 'ui.lightness';
export type UIDefaultDict = {
	[Key in UIDefaultKeys]: any;
};

class Locale {
	#dicts: Map<string, LocaleDict> = new Map();
	#subscriptions: Map<string, Set<Function>> = new Map();
	get perfers() {
		return navigator.languages;
	}
	get dictsNamespace() {
		return [...this.#dicts.keys()];
	}
	get(key: string, options?: LocaleOptions): string {
		const i = key.indexOf(':');
		let namespace = '';
		if (i !== -1) {
			namespace = key.slice(0, i);
		}
		const dict = this.#dicts.get(namespace);
		if (!dict) return key;
		return dict.get(key.slice(i + 1), options);
	}
	emitUpdate(namespace: string) {
		const subscriptions = this.#subscriptions.get(namespace);
		if (!subscriptions) return;
		for (const handler of subscriptions) {
			run(handler);
		}
	}
	setLocaleDict(namespace: string, dict: LocaleDict) {
		this.#dicts.set(namespace, dict);
		this.emitUpdate(namespace);
	}
	removeLocaleDict(namespace: string) {
		this.#dicts.delete(namespace);
		this.emitUpdate(namespace);
	}
	on(namespace: string, handler: Function) {
		let subscriptions = this.#subscriptions.get(namespace);
		if (!subscriptions) {
			subscriptions = new Set();
			this.#subscriptions.set(namespace, subscriptions);
		}
		subscriptions.add(handler);
	}
	off(namespace: string, handler: Function) {
		const subscriptions = this.#subscriptions.get(namespace);
		if (!subscriptions) return;
		subscriptions.delete(handler);
	}
}

export const locale = new Locale();
