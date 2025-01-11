import { UIContentAll, UIContentAllCreateOptions } from '../../components/content';
import { configs } from '../../configs';
import { events } from '../../event';
import { EventBase, IEventBaseCreateOptions } from '../../event/api/base';
import { EventHandler, Events, IEventSource } from '../../event/events';
import { Navigable } from '../../navigate';
import { $div } from '../../utils/dom';
import { Widget } from './base';

export interface WidgetNavEvents<ID extends string = string> {
	change: IEventBaseCreateOptions<WidgetNav<ID>>;
}

export interface WidgetNavProp<ID extends string = string> {
	value?: ID | undefined;
	items?: (IWidgetNavItem<ID> | WidgetNavItem<ID>)[];
	endItems?: (IWidgetNavItem<ID> | WidgetNavItem<ID>)[];
	disabled?: boolean;
	vertical?: boolean;
	display?: WidgetNavDisplay;
}

export interface WidgetNavItemEvents<ID extends string = string> {
	active: IEventBaseCreateOptions<WidgetNavItem<ID>>;
}

export interface IWidgetNavItem<ID extends string = string> {
	id: ID;
	content: UIContentAllCreateOptions | UIContentAll | string;
}

export type WidgetNavDisplay = 'all' | 'icon' | 'text';

const ITEM = Symbol();
const DISPLAYS: WidgetNavDisplay[] = ['all', 'icon', 'text'];

//#region Item
export class WidgetNavItem<ID extends string = string> implements IEventSource<WidgetNavItemEvents<ID>> {
	id: ID;
	#events = new Events<WidgetNavItemEvents<ID>>(['active']);
	#content: UIContentAll;
	[ITEM] = $div({ class: 'w-nav-item', attr: { 'ui-nav': '' } }) as Navigable;
	#nav: WidgetNav<ID>;
	constructor(nav: WidgetNav<ID>, options: IWidgetNavItem<ID>) {
		this.#nav = nav;
		this.id = options.id;
		if (options.content instanceof UIContentAll) this.#content = options.content;
		else this.#content = new UIContentAll(options.content);
		this.#updateContent();
		this.#content.on('update:icon', this.#updateContent);
		this.#content.on('update:label', this.#updateContent);
		events.hover.add(this[ITEM]);
		events.active.on(this[ITEM], ({ active, cancel }) => {
			if (this.#nav.disabled) return;
			if (active || cancel) return;
			this.#events.emit(new EventBase('active', { target: this }));
		});
		// Nav
		this[ITEM].navParent = nav;
	}
	#updateContent = () => {
		this[ITEM].replaceChildren(this.#content.iconElement, this.#content.labelElement);
	};
	get content() {
		return this.#content;
	}
	set content(value: UIContentAll | string) {
		this.#content.off('update:icon', this.#updateContent);
		this.#content.off('update:label', this.#updateContent);
		if (value instanceof UIContentAll) this.#content = value;
		else this.#content = new UIContentAll(value);
		this.#updateContent();
		this.#content.on('update:icon', this.#updateContent);
		this.#content.on('update:label', this.#updateContent);
	}
	on<Type extends keyof WidgetNavItemEvents<ID>>(
		type: Type,
		handler: EventHandler<Type, WidgetNavItemEvents<ID>[Type], any>,
	): void {
		this.#events.on(type, handler);
	}
	off<Type extends keyof WidgetNavItemEvents<ID>>(
		type: Type,
		handler: EventHandler<Type, WidgetNavItemEvents<ID>[Type], any>,
	): void {
		this.#events.off(type, handler);
	}
}

//#region Nav
export class WidgetNav<ID extends string = string>
	extends Widget
	implements IEventSource<WidgetNavEvents<ID>>, Navigable
{
	#inited = false;
	#events = new Events<WidgetNavEvents<ID>>(['change']);
	#shadowRoot = this.attachShadow({ mode: 'open' });
	#nav = $div({ class: 'w-nav' });
	#flex = $div({ class: 'w-nav-flex' });
	#indicator = $div({ class: 'w-nav-indicator' });
	#observer = new ResizeObserver(() => this.#updateIndicator());
	constructor() {
		super();
		this.#shadowRoot.append(configs.getCSSImporter(), this.#indicator, this.#nav);
		this.#nav.append(this.#flex);
		this.#observer.observe(this);
	}
	connectedCallback() {
		this.toggleAttribute('ui-nav-group', true);
		if (this.#inited) return;
		this.#inited = true;
	}
	#updateIndicator() {
		let item = this.#items.find((item) => item.id === this.#value);
		if (!item) item = this.#endItems.find((item) => item.id === this.#value);
		if (!item) {
			this.#indicator.style.setProperty('--w-nav-size', '0px');
			this.#indicator.style.setProperty('--w-nav-offset', '0px');
			return;
		}
		const navOffset = this.getBoundingClientRect()[this.vertical ? 'top' : 'left'];
		const { [this.vertical ? 'height' : 'width']: size, [this.vertical ? 'top' : 'left']: offset } =
			item[ITEM].getBoundingClientRect();
		this.#indicator.style.setProperty('--w-nav-offset', `${offset - navOffset}px`);
		this.#indicator.style.setProperty('--w-nav-size', `${size}px`);
	}
	//#region Value
	#value?: ID;
	get value() {
		return this.#value;
	}
	set value(value: ID | undefined) {
		this.#value = value;
		this.#updateIndicator();
	}
	#active(id: ID) {
		if (this.#value === id) return;
		this.#value = id;
		this.#updateIndicator();
		this.#events.emit(new EventBase('change', { target: this }));
	}
	//#region Item
	#updateItems() {
		this.#nav.replaceChildren(
			...this.#items.map((item) => item[ITEM]),
			this.#flex,
			...this.#endItems.map((item) => item[ITEM]),
		);
		this.#updateIndicator();
	}
	#items: WidgetNavItem<ID>[] = [];
	get items(): WidgetNavItem<ID>[] {
		return [...this.#items];
	}
	set items(value: (IWidgetNavItem<ID> | WidgetNavItem<ID>)[]) {
		this.#items = value.map((v) => new WidgetNavItem(this, v));
		this.#updateItems();
		for (const item of this.#items) {
			item.on('active', ({ target }) => this.#active(target.id));
		}
	}
	#endItems: WidgetNavItem<ID>[] = [];
	get endItems(): WidgetNavItem<ID>[] {
		return [...this.#endItems];
	}
	set endItems(value: (IWidgetNavItem<ID> | WidgetNavItem<ID>)[]) {
		this.#endItems = value.map((v) => new WidgetNavItem(this, v));
		this.#updateItems();
		for (const item of this.#endItems) {
			item.on('active', ({ target }) => this.#active(target.id));
		}
	}
	//#region Disabled
	get disabled() {
		return this.hasAttribute('disabled');
	}
	set disabled(value: boolean) {
		this.#inited = true;
		this.toggleAttribute('disabled', value);
	}
	//#region Vertical
	get vertical() {
		return this.hasAttribute('vertical');
	}
	set vertical(value: boolean) {
		this.toggleAttribute('vertical', value);
	}
	//#region Display
	get display(): WidgetNavDisplay {
		const display = this.getAttribute('display');
		if (DISPLAYS.includes(display as any)) return display as WidgetNavDisplay;
		return 'all';
	}
	set display(value: WidgetNavDisplay) {
		if (!DISPLAYS.includes(value)) return;
		this.setAttribute('display', value);
	}
	//#region Event
	on<Type extends keyof WidgetNavEvents<ID>>(
		type: Type,
		handler: EventHandler<Type, WidgetNavEvents<ID>[Type], any>,
	): void {
		this.#events.on(type, handler);
	}
	off<Type extends keyof WidgetNavEvents<ID>>(
		type: Type,
		handler: EventHandler<Type, WidgetNavEvents<ID>[Type], any>,
	): void {
		this.#events.off(type, handler);
	}
	//#region Clone
	cloneNode(deep?: boolean): WidgetNav {
		const node = super.cloneNode(deep) as WidgetNav;
		node.disabled = this.disabled;
		return node;
	}
	//#region Nav
	get nonNavigable() {
		return this.disabled;
	}
	get navChildern(): Navigable[] {
		return [...this.#items, ...this.#endItems].map((v) => v[ITEM]);
	}
	//#region Prop
	_prop?: WidgetNavProp;
}

customElements.define('w-nav', WidgetNav);
