import { EventBase, IEventBaseCreateOptions } from 'event/api/base';
import { EventCustom, IEventCustomCreateOptions } from 'event/api/custom';
import { EventHandler, Events, IEventSource } from 'event/events';
import { $new } from 'utils/dom';
import { makeURLForceReload } from 'utils/url';

//#region Importer
/**
 * @description Auto import and update css link of icons
 * Do not modify children or html of the importer
 */
export class UIImporterIcon extends HTMLElement {
	#inited = false;
	#links: Map<string, HTMLLinkElement> = new Map();
	#handler = () => {
		const iconPacks = icons.iconPacks;
		for (const [namespace, link] of iconPacks) {
			let linkElement = this.#links.get(namespace);
			if (!linkElement) {
				linkElement = $new<HTMLLinkElement>('link');
				linkElement.rel = 'stylesheet';
				super.append(linkElement);
				this.#links.set(namespace, linkElement);
			}
			linkElement.href = makeURLForceReload(link);
		}
		for (const [namespace, linkElement] of [...this.#links]) {
			if (iconPacks.find(([n]) => n === namespace)) continue;
			linkElement.remove();
			this.#links.delete(namespace);
		}
	};
	connectedCallback() {
		icons.on('update:packs', this.#handler);
		this.#handler();
		if (this.#inited) return;
		this.#inited = true;
		super.style.display = 'none';
	}
	disconnectedCallback() {
		icons.off('update:packs', this.#handler);
	}
}
customElements.define('ui-importer-icon', UIImporterIcon);

//#region Default
class UIDefaultIcons {
	#emit: (icon: string) => void;
	constructor(handler: (icon: string) => void) {
		this.#emit = handler;
	}
	#selectExpand = '';
	#msgHide = '';
	#msgClose = '';
	get selectExpand() {
		return this.#selectExpand;
	}
	set selectExpand(icon: string) {
		if (typeof icon !== 'string') {
			console.error(new Error('Invalid icon name'));
			return;
		}
		this.#selectExpand = icon;
		this.#emit('selectExpand');
	}
	get msgHide() {
		return this.#msgHide;
	}
	set msgHide(icon: string) {
		if (typeof icon !== 'string') {
			console.error(new Error('Invalid icon name'));
			return;
		}
		this.#msgHide = icon;
		this.#emit('msgHide');
	}
	get msgClose() {
		return this.#msgClose;
	}
	set msgClose(icon: string) {
		if (typeof icon !== 'string') {
			console.error(new Error('Invalid icon name'));
			return;
		}
		this.#msgClose = icon;
		this.#emit('msgClose');
	}
}

//#region Manage
export interface IconManageEvents {
	'update:packs': IEventBaseCreateOptions<IconManage>;
	'update:default-namespace': IEventCustomCreateOptions<IconManage, string>;
	'update:default-icon': IEventCustomCreateOptions<IconManage, string>;
}

class IconManage implements IEventSource<IconManageEvents> {
	#events = new Events<IconManageEvents>(['update:default-namespace', 'update:packs', 'update:default-icon']);
	#icons: Map<string, string> = new Map();
	#defaultNamespace = 'icon';
	#defaultIcons = new UIDefaultIcons((icon) =>
		this.#events.emit(new EventCustom('update:default-icon', { target: this, details: icon })),
	);
	constructor() {
		document.addEventListener('DOMContentLoaded', () => {
			document.head.append(this.getImporter());
		});
	}
	getImporter() {
		return $new<UIImporterIcon>('ui-importer-icon');
	}
	get iconPacksNamespace() {
		return [...this.#icons.keys()];
	}
	get iconPacks() {
		return [...this.#icons.entries()];
	}
	get cssLinks(): string[] {
		return [...this.#icons.values()];
	}
	getCSSLink(namespace: string): string | undefined {
		return this.#icons.get(namespace);
	}
	emitIconPack() {
		this.#events.emit(
			new EventBase('update:packs', {
				target: this,
			}),
		);
	}
	setIconPack(namespace: string, cssUrl: string) {
		this.#icons.set(namespace, cssUrl);
		this.emitIconPack();
	}
	removeIconPack(namespace: string) {
		this.#icons.delete(namespace);
		this.emitIconPack();
	}
	on<Type extends keyof IconManageEvents>(type: Type, handler: EventHandler<Type, IconManageEvents[Type], any>): void {
		this.#events.on(type, handler);
	}
	off<Type extends keyof IconManageEvents>(type: Type, handler: EventHandler<Type, IconManageEvents[Type], any>): void {
		this.#events.off(type, handler);
	}
	get defaultNamespace() {
		return this.#defaultNamespace;
	}
	set defaultNamespace(value: string) {
		if (value === this.#defaultNamespace) return;
		this.#defaultNamespace = value;
		this.#events.emit(
			new EventCustom('update:default-namespace', {
				target: this,
				details: this.#defaultNamespace,
			}),
		);
	}
	get defaults() {
		return this.#defaultIcons;
	}
}

export const icons = new IconManage();
