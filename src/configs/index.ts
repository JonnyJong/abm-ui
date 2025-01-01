import { EventCustom, IEventCustomCreateOptions } from 'event/api/custom';
import { EventHandler, Events, IEventSource } from 'event/events';
import { $new } from 'utils/dom';
import { makeURLForceReload } from 'utils/url';
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
		this.#link.href = makeURLForceReload(event.details);
	};
	connectedCallback() {
		configs.on('update:global-css', this.#handler);
		this.#link.href = makeURLForceReload(configs.globalCSS);
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
	constructor() {
		this.#globalCSSLink.rel = 'stylesheet';
		document.addEventListener('DOMContentLoaded', () => document.head.append(this.#globalCSSLink));
		// HACK: (Dev) Detecting live-server updates to CSS
		const observer = new MutationObserver(() =>
			this.#event.emit(
				new EventCustom('update:global-css', {
					target: this,
					details: this.#globalCSS,
				}),
			),
		);
		observer.observe(this.#globalCSSLink, {
			attributeFilter: ['href'],
			attributes: true,
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
		// HACK: (Dev) Detecting live-server updates to CSS
		/* this.#event.emit(
			new EventCustom('update:global-css', {
				target: this,
				details: this.#globalCSS,
			})
		); */
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
}

export const configs = new UIConfig();
