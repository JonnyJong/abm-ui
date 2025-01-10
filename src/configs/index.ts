import { makeURLForceReload } from 'abm-utils';
import { EventCustom, IEventCustomCreateOptions } from 'event/api/custom';
import { EventHandler, Events, IEventSource } from 'event/events';
import { $new } from 'utils/dom';
import { icons } from './icon';
import { locale } from './locale';
import { theme } from './theme';
export {
	UIDefaultKeys,
	UIDefaultDict,
	LocaleOptions,
	LocaleDict,
} from './locale';
export { UIImporterIcon, IconManageEvents } from './icon';
export { ColorScheme } from './theme';

interface UIConfigEvents {
	'update:global-css': IEventCustomCreateOptions<UIConfig, string>;
}

export class UIImporterCSS extends HTMLElement {
	#inited = false;
	#link = $new<HTMLLinkElement>('link');
	constructor() {
		super();
		this.#link.rel = 'stylesheet';
	}
	#handler = (event: UIConfigEvents['update:global-css']) => {
		this.#link.href = configs.dev ? makeURLForceReload(event.details) : event.details;
	};
	connectedCallback() {
		configs.on('update:global-css', this.#handler);
		this.#link.href = configs.dev ? makeURLForceReload(configs.globalCSS) : configs.globalCSS;
		if (this.#inited) return;
		this.#inited = true;
		super.style.display = 'none';
		super.append(this.#link);
	}
	disconnectedCallback() {
		configs.off('update:global-css', this.#handler);
	}
}
customElements.define('ui-importer-css', UIImporterCSS);

class UIConfig implements IEventSource<UIConfigEvents> {
	#event = new Events<UIConfigEvents>(['update:global-css']);
	#globalCSSLink = $new<HTMLLinkElement>('link');
	#globalCSS = '';
	#observer: MutationObserver | null = null;
	constructor() {
		this.#globalCSSLink.rel = 'stylesheet';
		document.addEventListener('DOMContentLoaded', () => {
			if (!this.#autoInsertCSSLink) return;
			document.head.append(this.#globalCSSLink);
		});
	}
	get theme() {
		return theme;
	}
	get locale() {
		return locale;
	}
	get icons() {
		return icons;
	}
	get globalCSS() {
		return this.#globalCSS;
	}
	set globalCSS(value: string) {
		this.#globalCSS = value;
		this.#globalCSSLink.href = this.#globalCSS;
	}
	on<Type extends keyof UIConfigEvents>(type: Type, handler: EventHandler<Type, UIConfigEvents[Type], any>): void {
		this.#event.on(type, handler);
	}
	off<Type extends keyof UIConfigEvents>(type: Type, handler: EventHandler<Type, UIConfigEvents[Type], any>): void {
		this.#event.off(type, handler);
	}
	getCSSImporter() {
		return $new<UIImporterCSS>('ui-importer-css');
	}
	#autoInsertCSSLink = false;
	get autoInsertCSSLink() {
		return this.#autoInsertCSSLink;
	}
	set autoInsertCSSLink(value: boolean) {
		value = !!value;
		if (this.#autoInsertCSSLink === value) return;
		this.#autoInsertCSSLink = value;
		if (value) {
			document.head.append(this.#globalCSSLink);
			return;
		}
		this.#globalCSSLink.remove();
	}
	#dev = false;
	get dev() {
		return this.#dev;
	}
	set dev(value: boolean) {
		value = !!value;
		if (this.#dev === value) return;
		this.#dev = value;
		if (this.#observer) {
			this.#observer.disconnect();
			this.#observer = null;
			return;
		}
		this.#observer = new MutationObserver(() =>
			this.#event.emit(
				new EventCustom('update:global-css', {
					target: this,
					details: this.#globalCSS,
				}),
			),
		);
		this.#observer.observe(this.#globalCSSLink, {
			attributeFilter: ['href'],
			attributes: true,
		});
	}
}

export const configs = new UIConfig();
