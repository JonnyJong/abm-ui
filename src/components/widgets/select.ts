import { clamp } from 'abm-utils/math';
import { sleep } from 'abm-utils/timer';
import { UIContentText, UIContentTextCreateOptions } from 'components/content';
import { configs } from 'configs';
import { events } from 'event';
import { EventBase, IEventBaseCreateOptions } from 'event/api/base';
import { IEventCustom } from 'event/api/custom';
import { EventHandler, Events, IEventSource } from 'event/events';
import { Navigable, NavigateEvents, navigate } from 'navigate';
import { $div, $new } from 'utils/dom';
import { Widget } from './base';
import { WidgetIcon } from './icon';
import TEMPLATE from './templates/select.static.pug';

const ITEM_HEIGHT = 32;

export interface WidgetSelectEvents {
	change: IEventBaseCreateOptions<WidgetSelect>;
}

export interface WidgetSelectProp<Value = any> {
	options?: (WidgetSelectOption<Value> | IWidgetSelectOption<Value>)[];
	value?: Value | undefined;
	placeholder?: string | UIContentText | UIContentTextCreateOptions;
	disabled?: boolean;
}

export interface WidgetSelectOptionProp<Value = any> {
	value?: Value;
	label?: string | UIContentText | UIContentTextCreateOptions;
}

export interface IWidgetSelectOption<Value = any> {
	value: Value;
	label: UIContentText | string | UIContentTextCreateOptions;
}

//#region Option
export class WidgetSelectOption<Value = any> extends Widget implements Navigable {
	#shadowRoot = this.attachShadow({ mode: 'open' });
	value!: Value;
	#label: UIContentText = new UIContentText();
	constructor() {
		super();
		this.#label.on('update:label', this.#updateContent);
		this.#updateContent();
	}
	connectedCallback() {
		this.toggleAttribute('ui-nav', true);
	}
	#updateContent = () => {
		this.#shadowRoot.replaceChildren(this.#label.labelElement);
	};
	get label(): UIContentText {
		return this.#label;
	}
	set label(value: string | UIContentText | UIContentTextCreateOptions) {
		if (typeof value === 'string') {
			this.#label.key = value;
			return;
		}
		if (!(value instanceof UIContentText)) value = new UIContentText(value);
		this.#label.off('update:label', this.#updateContent);
		this.#label = value as UIContentText;
		this.#label.on('update:label', this.#updateContent);
		this.#updateContent();
	}
	static new<Value = any>({ value, label }: IWidgetSelectOption<Value>): WidgetSelectOption<Value> {
		const item = $new<WidgetSelectOption>('w-select-option');
		item.value = value;
		item.label = label;
		return item;
	}
	cloneNode(deep?: boolean): WidgetSelectOption<Value> {
		const option = super.cloneNode(deep) as WidgetSelectOption<Value>;
		option.value = this.value;
		option.label = this.label.clone();
		return option;
	}
	_prop?: WidgetSelectOptionProp;
}

customElements.define('w-select-option', WidgetSelectOption);

//#region Select
export class WidgetSelect<Value = any> extends Widget implements IEventSource<WidgetSelectEvents>, Navigable {
	#inited = false;
	#events = new Events<WidgetSelectEvents>(['change']);
	#shadowRoot = this.attachShadow({ mode: 'open' });
	#icon: WidgetIcon;
	#contentElement: HTMLDivElement;
	constructor() {
		super();
		this.#shadowRoot.innerHTML = TEMPLATE;
		this.#shadowRoot.prepend(configs.getCSSImporter());
		// Content
		this.#contentElement = this.#shadowRoot.querySelector('.w-select-content')!;
		this.#icon = this.#shadowRoot.querySelector('.w-select-icon')!;
		this.#icon.key = configs.icons.defaults.selectExpand;
		// Placeholder
		this.#placeholderElement = this.#shadowRoot.querySelector('.w-select-placeholder')!;
		this.#placeholder.on('update:label', this.#updatePlaceholder);
		this.#updatePlaceholder();
		// Picker
		this.#picker.append(this.#list);
		this.#filter.addEventListener('pointerdown', () => this.#hidePicker());
		// Event
		events.hover.add(this);
		events.active.on(this, (event) => {
			if (event.active || event.cancel || this.disabled) return;
			this.#showPicker();
		});
	}
	connectedCallback() {
		this.toggleAttribute('ui-nav', true);
		configs.icons.on('update:default-icon', this.#defaultIconUpdateHandler);
		if (this.#inited) return;
		this.#inited = true;
		const placeholder = this.getAttribute('placeholder');
		if (placeholder) this.placeholder = placeholder;
	}
	disconnectedCallback() {
		configs.icons.off('update:default-icon', this.#defaultIconUpdateHandler);
	}
	//#region Picker
	#filter = $div({ class: 'ui-preset-fullscreen' });
	#picker = $div({ class: 'w-select-picker' });
	#list = $div({ class: 'w-select-list' });
	async #showPicker() {
		const length = this.#list.children.length;
		if (length === 0) return;
		document.body.append(this.#filter, this.#picker);
		await sleep(0);
		let { top, left, width } = this.getBoundingClientRect();
		width = Math.max(width, this.#list.getBoundingClientRect().width);
		// Get expand from
		let expendFrom = this.#selected;
		if (this.#selected === -1) {
			expendFrom = Math.floor(Math.min(top / ITEM_HEIGHT, (length - 1) / 2));
		}
		// Calc values
		const height = Math.min(length * ITEM_HEIGHT, window.innerHeight);
		const itemInList = expendFrom * ITEM_HEIGHT;
		const scroll = clamp(0, itemInList - top, length * ITEM_HEIGHT - height);
		const itemDiff = scroll - itemInList;
		const listTop = clamp(0, top + itemDiff, window.innerHeight - height);
		// Style
		for (const [k, v] of [
			['left', left],
			['width', width],
			['item-diff', itemDiff],
			['top-begin', top],
			['top-end', listTop],
			['height', height],
		]) {
			this.#picker.style.setProperty(`--w-select-${k}`, `${v}px`);
		}
		this.#list.scroll({ top: scroll, behavior: 'instant' });
		// Display
		this.#picker.classList.add('w-select-picker-show');
		// HACK: Prevent touch from triggering click events prematurely
		await sleep(50);
		this.#list.addEventListener('click', this.#clickHandler);
		navigate.on('active', this.#navActiveHandler);
		navigate.on('cancel', this.#navCancelHandler);
		navigate.addLayer(this.#picker, this.#list.children[expendFrom] as Navigable);
	}
	async #hidePicker() {
		navigate.rmLayer(this.#picker);
		this.#list.removeEventListener('click', this.#clickHandler);
		navigate.off('active', this.#navActiveHandler);
		navigate.off('cancel', this.#navCancelHandler);
		this.#picker.style.opacity = '0';
		await sleep(100);
		this.#picker.remove();
		this.#filter.remove();
		this.#picker.style.opacity = '';
		this.#picker.classList.remove('w-select-picker-show');
		this.#picker.style.setProperty('--w-select-width', '');
	}
	#pick(option: WidgetSelectOption) {
		const currentSelect = [...this.#list.children].indexOf(option);
		if (currentSelect === -1 || currentSelect === this.#selected) return;
		this.#selected = currentSelect;
		this.#updateContent();
		this.#events.emit(new EventBase('change', { target: this }));
	}
	#clickHandler = (event: Event) => {
		const option = (event.target as HTMLElement).closest<WidgetSelectOption>('w-select-option');
		if (!option) return;
		this.#hidePicker();
		this.#pick(option);
	};
	//#region Options
	get options() {
		return [...this.#list.children] as WidgetSelectOption<Value>[];
	}
	set options(options: (WidgetSelectOption<Value> | IWidgetSelectOption<Value>)[]) {
		const value = this.value;
		this.#list.replaceChildren(
			...options.map((option) => {
				if (option instanceof WidgetSelectOption) return option;
				return WidgetSelectOption.new(option);
			}),
		);
		this.value = value;
	}
	//#region Value
	#selected = -1;
	get value() {
		return (this.#list.children[this.#selected] as WidgetSelectOption<Value>)?.value;
	}
	set value(value: Value | undefined) {
		this.#selected = ([...this.#list.children] as WidgetSelectOption<Value>[]).findIndex(
			(option) => option.value === value,
		);
		this.#updateContent();
	}
	//#region Placeholder
	#placeholderElement: HTMLDivElement;
	#placeholder = new UIContentText();
	#updatePlaceholder = () => {
		this.#placeholderElement.replaceChildren(this.#placeholder.labelElement);
	};
	get placeholder(): UIContentText {
		return this.#placeholder;
	}
	set placeholder(value: string | UIContentText | UIContentTextCreateOptions) {
		if (typeof value === 'string') {
			this.#placeholder.key = value;
			return;
		}
		if (!(value instanceof UIContentText)) value = new UIContentText(value);
		this.#placeholder.off('update:label', this.#updatePlaceholder);
		this.#placeholder = value as UIContentText;
		this.#placeholder.on('update:label', this.#updatePlaceholder);
		this.#updatePlaceholder();
	}
	//#region Content
	#updateContent() {
		const content = (this.#list.children[this.#selected] as WidgetSelectOption)?.label.labelElement.cloneNode(true);
		if (content) this.#contentElement.replaceChildren(content);
		else this.#contentElement.replaceChildren();
	}
	//#region Disabled
	get disabled() {
		return this.hasAttribute('disabled');
	}
	set disabled(value: boolean) {
		this.#inited = true;
		this.toggleAttribute('disabled', value);
	}
	//#region Event
	#defaultIconUpdateHandler = (event: IEventCustom<string, any, string>) => {
		if (event.details !== 'selectExpand') return;
		this.#icon.key = configs.icons.defaults.selectExpand;
	};
	on<Type extends keyof WidgetSelectEvents>(
		type: Type,
		handler: EventHandler<Type, WidgetSelectEvents[Type], any>,
	): void {
		this.#events.on(type, handler);
	}
	off<Type extends keyof WidgetSelectEvents>(
		type: Type,
		handler: EventHandler<Type, WidgetSelectEvents[Type], any>,
	): void {
		this.#events.off(type, handler);
	}
	//#region Clone
	cloneNode(deep?: boolean): WidgetSelect {
		const select = super.cloneNode(deep) as WidgetSelect;
		select.options = this.options;
		select.value = this.value;
		select.placeholder = this.placeholder;
		select.disabled = this.disabled;
		return select;
	}
	//#region Nav
	get nonNavigable() {
		return this.disabled;
	}
	#navActiveHandler = ({ value }: NavigateEvents['active']) => {
		if (value) return;
		this.#pick(navigate.current as WidgetSelectOption);
		this.#hidePicker();
	};
	#navCancelHandler = () => {
		this.#hidePicker();
	};
	//#region Prop
	_prop?: WidgetSelectProp<Value>;
}

customElements.define('w-select', WidgetSelect);

// TODO: support input filter
// TODO: safezone support
