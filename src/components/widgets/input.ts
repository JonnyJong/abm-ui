import { clamp, insertAt, sleep, toArray, wrapInRange } from 'abm-utils';
import { UIContent, UIContentCreateOptions } from 'components/content';
import { LocaleOptions, configs } from 'configs';
import { events } from 'event';
import { EventBase, IEventBaseCreateOptions } from 'event/api/base';
import { EventCustom, IEventCustomCreateOptions } from 'event/api/custom';
import { EventHandler, Events, IEventSource } from 'event/events';
import { KeyboardEvents, keyboard } from 'keyboard';
import { Navigable, NavigateCallbackArgs, navigate } from 'navigate';
import { $apply, $div, $new, DOMContents } from 'utils/dom';
import { AnimationFrameController } from 'utils/timer';
import { Widget } from './base';
import { WidgetBtn } from './btn';
import { WidgetLang } from './lang';
import TEMPLATE from './templates/input.static.pug';

export interface WidgetInputEvents<
	Value extends WidgetInputValue,
	Target extends WidgetInput<Value> = WidgetInput<Value>,
> {
	input: IEventBaseCreateOptions<Target>;
	// action
	// focus
	// TODO: enter & etc confirm
	confirm: IEventBaseCreateOptions<Target>;
	autofill: IEventCustomCreateOptions<
		Target & {
			readonly autoFill: WidgetInputAutoFill<Value>;
		},
		string | undefined
	>;
	action: IEventCustomCreateOptions<Target, string>;
}

export interface WidgetInputProp<Value extends WidgetInputValue> {
	value?: Value;
	placeholder?: string;
	placeholderLocaleOptions?: LocaleOptions;
	disabled?: boolean;
	readOnly?: boolean;
	invalid?: boolean;
}

const EVENTS = Symbol();
const INPUT_ELEMENT = Symbol();
const SHADOW_ROOT = Symbol();
const SET_PLACEHOLDER_VISIBILITY = Symbol();

type WidgetInputValue = string | number;
const VALUE_TYPES = ['string', 'number'];

//#region Auto Fill

interface WidgetInputAutoFillItemValue<Value extends WidgetInputValue> {
	id: string;
	value: Value;
	label?: DOMContents;
}

interface WidgetInputAutoFillItemLabel<Value extends WidgetInputValue> {
	id: string;
	value?: Value;
	label: DOMContents;
}

export type WidgetInputAutoFillItem<Value extends WidgetInputValue> =
	| Value
	| WidgetInputAutoFillItemValue<Value>
	| WidgetInputAutoFillItemLabel<Value>;

function createAutoFillItem<Value extends WidgetInputValue>(item: WidgetInputAutoFillItem<Value>) {
	let label: DOMContents;
	if (VALUE_TYPES.includes(typeof item)) {
		label = String(item);
	} else if ((item as WidgetInputAutoFillItemLabel<Value>).label) {
		label = (item as WidgetInputAutoFillItemLabel<Value>).label;
	} else {
		label = String((item as WidgetInputAutoFillItemValue<Value>).value);
	}
	const element = $div({ class: 'w-input-autofill-item' });
	element.append(...toArray(label));
	return element;
}

class WidgetInputAutoFill<
	Value extends WidgetInputValue,
	Item extends WidgetInputAutoFillItem<Value> = WidgetInputAutoFillItem<Value>,
> {
	#input: WidgetInput<Value> & {
		readonly autoFill: WidgetInputAutoFill<Value>;
	};
	#items: Item[] = [];
	#list = $div({ class: 'w-input-autofill' });
	#inputFocsing = false;
	#frameController = new AnimationFrameController(() => {
		const { bottom, left, width } = this.#input.getBoundingClientRect();
		$apply(this.#list, {
			style: { top: bottom, left, width },
		});
	});
	constructor(
		input: WidgetInput<Value> & {
			readonly autoFill: WidgetInputAutoFill<Value>;
		},
	) {
		this.#input = input;
		this.#input[INPUT_ELEMENT].addEventListener('focus', this.#focalHandler);
		this.#input[INPUT_ELEMENT].addEventListener('blur', this.#focalHandler);
		this.#list.addEventListener('pointerdown', (ev) => ev.preventDefault());
		this.#list.addEventListener('click', this.#clickHandler);
	}
	#emit(id?: string) {
		this.#input[EVENTS].emit(
			new EventCustom('autofill', {
				target: this.#input,
				details: id,
			}),
		);
	}
	#active(index: number) {
		const item = this.#items[index];
		if (VALUE_TYPES.includes(typeof item)) {
			this.#input.value = item as Value;
			this.#emit();
			return;
		}
		const { id, value } = item as WidgetInputAutoFillItemLabel<Value> | WidgetInputAutoFillItemValue<Value>;
		if (value !== undefined) {
			this.#input.value = value;
		}
		this.#emit(id);
	}
	#toggleVisibility() {
		if (this.#inputFocsing && this.#items.length) {
			document.body.append(this.#list);
			this.#frameController.start();
			this.#input.classList.add('w-input-autofill-visible');
			return;
		}
		this.#list.remove();
		this.#frameController.stop();
		this.#input.classList.remove('w-input-autofill-visible');
	}
	#focalHandler = (event: FocusEvent) => {
		this.#inputFocsing = event.type === 'focus' && !this.#input[INPUT_ELEMENT].readOnly;
		this.#toggleVisibility();
	};
	#clickHandler = (event: MouseEvent) => {
		const itemElements = [...this.#list.children];
		const target = (event.target as HTMLElement).closest<HTMLElement>('.w-input-autofill-item');
		if (!target) return;
		const index = itemElements.indexOf(target);
		if (index === -1) return;
		this.#active(index);
	};
	//#region Item Setters
	get items() {
		return this.#items.map((v) => {
			if (VALUE_TYPES.includes(typeof v)) return v;
			return { ...(v as any) };
		});
	}
	set items(items: Item[]) {
		const newItems: Item[] = [];
		for (const item of items) {
			if (VALUE_TYPES.includes(typeof item)) {
				if (newItems.includes(item)) continue;
				newItems.push(item);
				continue;
			}
			const { id, label, value } = item as WidgetInputAutoFillItemLabel<Value> | WidgetInputAutoFillItemValue<Value>;
			newItems.push({ id, label, value } as any);
			/* const index = newItems.findIndex((v: any) => v.id === id);
			if (index === -1) {
				newItems.push({ id, label, value } as any);
				continue;
			}
			(newItems[index] as any).label = label;
			(newItems[index] as any).value = value; */
		}
		this.#list.replaceChildren(...newItems.map(createAutoFillItem));
		this.#items = newItems;
		this.#toggleVisibility();
	}
	append(item: Item) {
		const element = createAutoFillItem(item);
		if (VALUE_TYPES.indexOf(typeof item)) {
			this.#items.push(item);
		} else {
			this.#items.push({ ...(item as any) });
		}
		this.#list.append(element);
		this.#toggleVisibility();
	}
	prepend(item: Item) {
		const element = createAutoFillItem(item);
		if (VALUE_TYPES.indexOf(typeof item)) {
			this.#items.unshift(item);
		} else {
			this.#items.unshift({ ...(item as any) });
		}
		this.#list.prepend(element);
		this.#toggleVisibility();
	}
	set(index: number, item: Item) {
		if (this.#items.length === 0) return;
		index = wrapInRange(index, this.#items.length);
		const element = createAutoFillItem(item);
		if (VALUE_TYPES.indexOf(typeof item)) {
			this.#items[index] = item;
		} else {
			this.#items[index] = { ...(item as any) };
		}
		this.#list.replaceChild(element, this.#list.children[index]);
		this.#toggleVisibility();
	}
	insert(index: number, item: Item) {
		index = wrapInRange(index, this.#items.length + 1);
		if (index === this.#items.length) return this.append(item);
		const element = createAutoFillItem(item);
		if (VALUE_TYPES.indexOf(typeof item)) {
			insertAt(this.#items, index, item);
		} else {
			insertAt(this.#items, index, { ...(item as any) });
		}
		this.#list.children[index].before(element);
		this.#toggleVisibility();
	}
	remove(index: number) {
		if (this.#items.length === 0) return;
		index = wrapInRange(index, this.#items.length);
		this.#items.splice(index, 1);
		this.#list.children[index].remove();
		this.#toggleVisibility();
	}
}

//#region Action
export interface WidgetInputActionItemCreateOptions {
	id: string;
	content: UIContent | string | UIContentCreateOptions;
	toggle?: boolean;
	checked?: boolean;
	disabled?: boolean;
	hidden?: boolean;
	delay?: number;
}

type WidgetInputActionCallback = (type: 'action' | 'update', id: string) => any;

const ACTION_BTN = Symbol();
const ACTION_BTN_SIZE = 28 + 2;

export class WidgetInputActionItem {
	#id: string;
	#callback: WidgetInputActionCallback;
	[ACTION_BTN] = $new<WidgetBtn & Navigable>('w-btn', { class: 'w-input-action-item' });
	constructor(
		{ id, content, toggle, checked, disabled, hidden, delay }: WidgetInputActionItemCreateOptions,
		callback: WidgetInputActionCallback,
		input: WidgetInput<any>,
	) {
		this.#callback = callback;
		this.#id = id;
		this.content = content;
		if (toggle) this.toggle = toggle;
		if (checked) this.checked = checked;
		if (disabled) this.disabled = disabled;
		if (hidden) this.hidden = hidden;
		if (delay) this.delay = delay;
		this[ACTION_BTN].flat = true;
		this[ACTION_BTN].on('active', () => this.#callback('action', this.#id));
		// Nav
		this[ACTION_BTN].navParent = input;
	}
	get id() {
		return this.#id;
	}
	set id(value: string) {
		this.#id = value;
	}
	get content(): UIContent {
		return this[ACTION_BTN].content;
	}
	set content(value: UIContent | string | UIContentCreateOptions) {
		this[ACTION_BTN].content = value;
	}
	get toggle() {
		return this[ACTION_BTN].state === 'toggle';
	}
	set toggle(value: boolean) {
		this[ACTION_BTN].state = value ? 'toggle' : '';
	}
	get checked() {
		return this[ACTION_BTN].checked;
	}
	set checked(value: boolean) {
		this[ACTION_BTN].checked = value;
	}
	#disabled = false;
	get disabled() {
		return this.#disabled;
	}
	set disabled(value: boolean) {
		this.#disabled = !!value;
		this[ACTION_BTN].disabled = this.#disabled || this.#hidden;
	}
	#hidden = false;
	get hidden() {
		return this.#hidden;
	}
	set hidden(value: boolean) {
		this.#hidden = !!value;
		this[ACTION_BTN].classList.toggle('w-input-action-item-hidden', value);
		this[ACTION_BTN].disabled = this.#disabled || this.#hidden;
		this.#callback('update', this.#id);
	}
	get delay() {
		return this[ACTION_BTN].delay;
	}
	set delay(value: number) {
		this[ACTION_BTN].delay = value;
	}
}

class WidgetInputAction<Value extends WidgetInputValue, Input extends WidgetInput<Value> = WidgetInput<Value>> {
	#input: Input;
	#container: HTMLDivElement;
	#side: 'left' | 'right' = 'left';
	#items: WidgetInputActionItem[] = [];
	constructor(input: Input, container: HTMLDivElement) {
		this.#input = input;
		this.#container = container;
		if (this.#container.hasAttribute('right')) this.#side = 'right';
	}
	#callback: WidgetInputActionCallback = (type, id) => {
		if (type === 'update') {
			this.#updateSize();
			return;
		}
		this.#input[EVENTS].emit(
			new EventCustom('action', {
				target: this.#input,
				details: id,
			}),
		);
	};
	#updateSize = () => {
		this.#input.style.setProperty(
			`--w-input-action-${this.#side}`,
			`${this.#items.map((v) => (v.hidden ? 0 : ACTION_BTN_SIZE)).reduce((a, b) => a + b, 0)}px`,
		);
	};
	get items(): WidgetInputActionItem[] {
		return [...this.#items];
	}
	set items(items: WidgetInputActionItemCreateOptions[]) {
		this.#items = items.map((options) => new WidgetInputActionItem(options, this.#callback, this.#input));
		this.#container.replaceChildren(...this.#items.map((item) => item[ACTION_BTN]));
		this.#updateSize();
	}
	get(id: string): WidgetInputActionItem | undefined;
	get(index: number): WidgetInputActionItem;
	get(arg0: string | number): WidgetInputActionItem | undefined {
		if (typeof arg0 === 'string') return this.#items.find((item) => item.id === arg0);
		return this.#items[wrapInRange(arg0, this.#items.length)];
	}
	append(options: WidgetInputActionItemCreateOptions) {
		const item = new WidgetInputActionItem(options, this.#callback, this.#input);
		this.#items.push(item);
		this.#container.append(item[ACTION_BTN]);
		this.#updateSize();
	}
	prepend(options: WidgetInputActionItemCreateOptions) {
		const item = new WidgetInputActionItem(options, this.#callback, this.#input);
		this.#items.unshift(item);
		this.#container.prepend(item[ACTION_BTN]);
		this.#updateSize();
	}
	set(index: number, options: WidgetInputActionItemCreateOptions) {
		if (this.#items.length === 0) return;
		index = wrapInRange(index, this.#items.length);
		const item = new WidgetInputActionItem(options, this.#callback, this.#input);
		this.#items[index] = item;
		this.#container.replaceChild(item[ACTION_BTN], this.#container.children[index]);
		this.#updateSize();
	}
	insert(index: number, options: WidgetInputActionItemCreateOptions) {
		index = wrapInRange(index, this.#items.length + 1);
		if (index === this.#items.length) return this.append(options);
		const item = new WidgetInputActionItem(options, this.#callback, this.#input);
		this.#container.children[index].before(item[ACTION_BTN]);
		this.#updateSize();
	}
	remove(id: string): boolean;
	remove(index: number): boolean;
	remove(arg0: string | number): boolean {
		if (this.#items.length === 0) return false;
		if (typeof arg0 === 'string') {
			arg0 = this.#items.findIndex((item) => item.id === arg0);
			if (arg0 === -1) return false;
		}
		arg0 = wrapInRange(arg0, this.#items.length);
		this.#items.splice(arg0, 1);
		this.#container.children[arg0].remove();
		this.#updateSize();
		return true;
	}
}

//#region Input
export class WidgetInput<Value extends WidgetInputValue>
	extends Widget
	implements IEventSource<WidgetInputEvents<Value>>, Navigable
{
	#inited = false;
	#valueChanged = false;
	[EVENTS] = new Events<WidgetInputEvents<Value>>(['input', 'autofill', 'action', 'confirm']);
	[SHADOW_ROOT] = this.attachShadow({ mode: 'open' });
	[INPUT_ELEMENT]: HTMLInputElement;
	constructor() {
		super();
		this[SHADOW_ROOT].innerHTML = TEMPLATE;
		this[SHADOW_ROOT].prepend(configs.getCSSImporter());
		this[INPUT_ELEMENT] = this[SHADOW_ROOT].querySelector('input')!;
		// Placeholder
		this.#placeholder = this[SHADOW_ROOT].querySelector('.w-input-placeholder')!;
	}
	connectedCallback() {
		this.toggleAttribute('ui-nav', true);
		if (this.#inited) return;
		this.#inited = true;
		// Event
		events.hover.on(this[INPUT_ELEMENT], (event) => {
			super.toggleAttribute('ui-hover', event.hover);
		});
		this[INPUT_ELEMENT].addEventListener('input', this.#inputHandler);
		this[INPUT_ELEMENT].addEventListener('compositionstart', this.#compositionHandler);
		this[INPUT_ELEMENT].addEventListener('compositionend', this.#compositionHandler);
		if (this.#valueChanged) return;
		this.#valueChanged = true;
		// Value
		const value = super.getAttribute('value');
		if (value) this.value = value as Value;
		// Placeholder
		const placeholder = super.getAttribute('placeholder');
		if (placeholder) this.placeholder = placeholder;
		// ReadOnly
		this[INPUT_ELEMENT].readOnly = super.hasAttribute('readonly');
	}
	//#region Value
	get value(): Value {
		return this[INPUT_ELEMENT].value as Value;
	}
	set value(value: Value) {
		this.#valueChanged = true;
		(this[INPUT_ELEMENT].value as Value) = value;
		this[SET_PLACEHOLDER_VISIBILITY]();
	}
	//#region Placeholder
	#placeholder: WidgetLang;
	[SET_PLACEHOLDER_VISIBILITY]() {
		this.#placeholder.classList.toggle('w-input-placeholder-hidden', !!this[INPUT_ELEMENT].value.length);
	}
	get placeholder() {
		return this.#placeholder.key;
	}
	set placeholder(value: string) {
		this.#valueChanged = true;
		this.#placeholder.key = value;
	}
	get placeholderLocaleOptions() {
		return this.#placeholder.options;
	}
	set placeholderLocaleOptions(options) {
		this.#valueChanged = true;
		this.#placeholder.options = options;
	}
	//#region Disabled
	#setInputDisabled(value: boolean) {
		this[INPUT_ELEMENT].disabled = value;
	}
	get disabled() {
		return super.hasAttribute('disabled');
	}
	set disabled(value: boolean) {
		this.#valueChanged = true;
		this.toggleAttribute('disabled', value);
	}
	//#region Readonly
	#setInputReadonly(value: boolean) {
		this[INPUT_ELEMENT].readOnly = value;
	}
	get readOnly() {
		return super.hasAttribute('readonly');
	}
	set readOnly(value: boolean) {
		this.#valueChanged = true;
		this.toggleAttribute('readonly', value);
	}
	//#region Valid
	get invalid() {
		return this.hasAttribute('invalid');
	}
	set invalid(value: boolean) {
		this.toggleAttribute('invalid', value);
	}
	//#region Auto Fill
	//#region Event
	#compositing = false;
	#compositionHandler = (event: CompositionEvent) => {
		this.#compositing = event.type.endsWith('start');
		// compositionend is emit later than input
		if (this.#compositing || !event.data) return;
		this[EVENTS].emit(new EventBase('input', { target: this }));
	};
	#inputHandler = (_event: Event) => {
		if (this.#compositing) return;
		this[EVENTS].emit(new EventBase('input', { target: this }));
		// Placeholder
		this[SET_PLACEHOLDER_VISIBILITY]();
	};
	on<Type extends keyof WidgetInputEvents<Value>>(
		type: Type,
		handler: EventHandler<Type, WidgetInputEvents<Value>[Type], any>,
	): void {
		this[EVENTS].on(type, handler);
	}
	off<Type extends keyof WidgetInputEvents<Value>>(
		type: Type,
		handler: EventHandler<Type, WidgetInputEvents<Value>[Type], any>,
	): void {
		this[EVENTS].off(type, handler);
	}
	//#region Proxy Fn
	setAttribute(qualifiedName: string, value: string): void {
		super.setAttribute(qualifiedName, value);
		if (qualifiedName === 'readonly') {
			this.#setInputReadonly(!!value);
			return;
		}
		if (qualifiedName !== 'disabled') return;
		this.#setInputDisabled(!!value);
	}
	toggleAttribute(qualifiedName: string, force?: boolean): boolean {
		const result = super.toggleAttribute(qualifiedName, force);
		if (qualifiedName === 'readonly') {
			this.#setInputReadonly(result);
			return result;
		}
		if (qualifiedName === 'disabled') {
			this.#setInputDisabled(result);
			return result;
		}
		return result;
	}
	removeAttribute(qualifiedName: string): void {
		super.removeAttribute(qualifiedName);
		if (qualifiedName === 'readonly') {
			this.#setInputReadonly(false);
			return;
		}
		if (qualifiedName !== 'disabled') return;
		this.#setInputDisabled(false);
	}
	//#region Clone
	cloneNode(deep?: boolean): WidgetInput<Value> {
		const input = super.cloneNode(deep) as WidgetInput<Value>;
		input.value = this.value;
		input.placeholder = this.placeholder;
		input.disabled = this.disabled;
		input.readOnly = this.readOnly;
		input.invalid = this.invalid;
		return input;
	}
	//#region Nav
	get nonNavigable() {
		return this.disabled;
	}
	//#region Prop
	_prop?: WidgetInputProp<Value>;
}

//#region Text
export interface WidgetTextProp extends WidgetInputProp<string> {}
export class WidgetText extends WidgetInput<string> implements Navigable {
	declare _prop?: WidgetTextProp;
	#autoFill?: WidgetInputAutoFill<string>;
	#actionsLeftElement = this[SHADOW_ROOT].querySelector<HTMLDivElement>('.w-input-action[left]')!;
	#actionsRightElement = this[SHADOW_ROOT].querySelector<HTMLDivElement>('.w-input-action[right]')!;
	#actionsLeft = new WidgetInputAction<string>(this, this.#actionsLeftElement);
	#actionsRight = new WidgetInputAction<string>(this, this.#actionsRightElement);
	constructor() {
		super();
		this[INPUT_ELEMENT].addEventListener('focus', () => {
			keyboard.on('aliasPress', this.#aliasPressHandler);
			navigate.addLayer(this[SHADOW_ROOT] as unknown as Navigable);
			navigate.on('cancel', this.#navCancelHandler);
			navigate.blockKeyboard = true;
			keyboard.preventDefaultWebBehavior = false;
			keyboard.on('shortcutTrigger', this.#shortcutHandler);
			window.addEventListener('keydown', this.#keyDownHandler);
		});
		this[INPUT_ELEMENT].addEventListener('blur', () => {
			keyboard.off('aliasPress', this.#aliasPressHandler);
			this[EVENTS].emit(new EventBase('confirm', { target: this }));
			navigate.rmLayer(this[SHADOW_ROOT] as unknown as Navigable);
			navigate.off('cancel', this.#navCancelHandler);
			navigate.blockKeyboard = false;
			keyboard.preventDefaultWebBehavior = true;
			keyboard.off('shortcutTrigger', this.#shortcutHandler);
			window.removeEventListener('keydown', this.#keyDownHandler);
		});
	}
	get autoFill(): WidgetInputAutoFill<string> {
		if (!this.#autoFill) this.#autoFill = new WidgetInputAutoFill(this);
		return this.#autoFill;
	}
	get actionsLeft() {
		return this.#actionsLeft;
	}
	get actionsRight() {
		return this.#actionsRight;
	}
	cloneNode(deep?: boolean): WidgetText {
		const text = super.cloneNode(deep) as WidgetText;
		text.autoFill.items = this.autoFill.items;
		text.actionsLeft.items = this.actionsLeft.items;
		text.actionsRight.items = this.actionsRight.items;
		return text;
	}
	#aliasPressHandler = (event: KeyboardEvents['aliasPress']) => {
		if (event.key !== 'ui.confirm') return;
		this[EVENTS].emit(new EventBase('confirm', { target: this }));
	};
	// Nav
	navCallback = ({ active, cancel }: NavigateCallbackArgs[0]) => {
		if (cancel) this[INPUT_ELEMENT].blur();
		if (active !== false) return;
		this[INPUT_ELEMENT].focus();
	};
	#navCancelHandler = () => {
		this[INPUT_ELEMENT].blur();
	};
	get navChildern() {
		return [...this.#actionsLeft.items, ...this.#actionsRight.items].map((v) => v[ACTION_BTN]);
	}
	#keyDownHandler = (event: KeyboardEvent) => {
		if (event.code === 'Tab') event.preventDefault();
	};
	#shortcutHandler = (event: KeyboardEvents['shortcutTrigger']) => {
		if (event.key === 'ui.navPrev') navigate.nav('prev');
		else if (event.key === 'ui.navNext') navigate.nav('next');
	};
}

customElements.define('w-text', WidgetText);

//#region Password
export interface WidgetPasswordProp extends WidgetInputProp<string> {
	passwordVisibility?: boolean;
}
export class WidgetPassword extends WidgetInput<string> implements Navigable {
	declare _prop?: WidgetPasswordProp;
	#autoFill?: WidgetInputAutoFill<string>;
	#actionsLeftElement = this[SHADOW_ROOT].querySelector<HTMLDivElement>('.w-input-action[left]')!;
	#actionsRightElement = this[SHADOW_ROOT].querySelector<HTMLDivElement>('.w-input-action[right]')!;
	#actionsLeft = new WidgetInputAction<string>(this, this.#actionsLeftElement);
	#actionsRight = new WidgetInputAction<string>(this, this.#actionsRightElement);
	constructor() {
		super();
		this[INPUT_ELEMENT].type = 'password';
		this[INPUT_ELEMENT].addEventListener('focus', () => {
			keyboard.on('aliasPress', this.#aliasPressHandler);
			navigate.addLayer(this[SHADOW_ROOT] as unknown as Navigable);
			navigate.on('cancel', this.#navCancelHandler);
			navigate.blockKeyboard = true;
			keyboard.preventDefaultWebBehavior = false;
			keyboard.on('shortcutTrigger', this.#shortcutHandler);
			window.addEventListener('keydown', this.#keyDownHandler);
		});
		this[INPUT_ELEMENT].addEventListener('blur', () => {
			keyboard.off('aliasPress', this.#aliasPressHandler);
			this[EVENTS].emit(new EventBase('confirm', { target: this }));
			navigate.rmLayer(this[SHADOW_ROOT] as unknown as Navigable);
			navigate.off('cancel', this.#navCancelHandler);
			navigate.blockKeyboard = false;
			keyboard.preventDefaultWebBehavior = true;
			keyboard.off('shortcutTrigger', this.#shortcutHandler);
			window.removeEventListener('keydown', this.#keyDownHandler);
		});
	}
	get autoFill(): WidgetInputAutoFill<string> {
		if (!this.#autoFill) this.#autoFill = new WidgetInputAutoFill(this);
		return this.#autoFill;
	}
	get actionsLeft() {
		return this.#actionsLeft;
	}
	get actionsRight() {
		return this.#actionsRight;
	}
	get passwordVisibility() {
		return this[INPUT_ELEMENT].type !== 'password';
	}
	set passwordVisibility(value: boolean) {
		this[INPUT_ELEMENT].type = value ? 'text' : 'password';
	}
	cloneNode(deep?: boolean): WidgetPassword {
		const psw = super.cloneNode(deep) as WidgetPassword;
		psw.autoFill.items = this.autoFill.items;
		psw.actionsLeft.items = this.actionsLeft.items;
		psw.actionsRight.items = this.actionsRight.items;
		psw.passwordVisibility = this.passwordVisibility;
		return psw;
	}
	#aliasPressHandler = (event: KeyboardEvents['aliasPress']) => {
		if (event.key !== 'ui.confirm') return;
		this[EVENTS].emit(new EventBase('confirm', { target: this }));
	};
	// Nav
	navCallback = ({ active, cancel }: NavigateCallbackArgs[0]) => {
		if (cancel) this[INPUT_ELEMENT].blur();
		if (active !== false) return;
		this[INPUT_ELEMENT].focus();
	};
	#navCancelHandler = () => {
		this[INPUT_ELEMENT].blur();
	};
	get navChildern() {
		return [...this.#actionsLeft.items, ...this.#actionsRight.items].map((v) => v[ACTION_BTN]);
	}
	#keyDownHandler = (event: KeyboardEvent) => {
		if (event.code === 'Tab') event.preventDefault();
	};
	#shortcutHandler = (event: KeyboardEvents['shortcutTrigger']) => {
		if (event.key === 'ui.navPrev') navigate.nav('prev');
		else if (event.key === 'ui.navNext') navigate.nav('next');
	};
}

customElements.define('w-password', WidgetPassword);

//#region Number
/**
 * @returns
 * - number: complete calculation
 * - null: calculation error
 */
type WidgetNumberExpressionCalculator = (expression: string) => number | null;

export interface WidgetNumberProp extends WidgetInputProp<number> {
	expression?: WidgetNumberExpressionCalculator | undefined;
	min?: number;
	max?: number;
	step?: number;
	default?: number;
}

export class WidgetNumber extends WidgetInput<number> implements Navigable {
	declare _prop?: WidgetNumberProp;
	#inited = false;
	#valueChanged = false;
	#autoFill?: WidgetInputAutoFill<number>;
	get autoFill(): WidgetInputAutoFill<number> {
		if (!this.#autoFill) this.#autoFill = new WidgetInputAutoFill(this);
		return this.#autoFill;
	}
	#actionsLeftElement = this[SHADOW_ROOT].querySelector<HTMLDivElement>('.w-input-action[left]')!;
	#actionsRightElement = this[SHADOW_ROOT].querySelector<HTMLDivElement>('.w-input-action[right]')!;
	#actionsLeft = new WidgetInputAction<number>(this, this.#actionsLeftElement);
	#actionsRight = new WidgetInputAction<number>(this, this.#actionsRightElement);
	constructor() {
		super();
		this[INPUT_ELEMENT].type = 'number';
		this[INPUT_ELEMENT].addEventListener('focus', () => {
			keyboard.on('aliasPress', this.#aliasPressHandler);
			navigate.addLayer(this[SHADOW_ROOT] as unknown as Navigable);
			navigate.on('cancel', this.#navCancelHandler);
			navigate.blockKeyboard = true;
			keyboard.preventDefaultWebBehavior = false;
			keyboard.on('shortcutTrigger', this.#shortcutHandler);
			window.addEventListener('keydown', this.#keyDownHandler);
		});
		this[INPUT_ELEMENT].addEventListener('blur', () => {
			keyboard.off('aliasPress', this.#aliasPressHandler);
			this.#updateInput();
			this[EVENTS].emit(new EventBase('confirm', { target: this }));
			navigate.rmLayer(this[SHADOW_ROOT] as unknown as Navigable);
			navigate.off('cancel', this.#navCancelHandler);
			navigate.blockKeyboard = false;
			keyboard.preventDefaultWebBehavior = true;
			keyboard.off('shortcutTrigger', this.#shortcutHandler);
			window.removeEventListener('keydown', this.#keyDownHandler);
		});
		this.on('action', ({ details }) => {
			switch (details) {
				case 'calc':
					this.#updateInput();
					break;
				case 'increase':
					this.#increase();
					break;
				case 'decrease':
					this.#decrease();
					break;
				default:
					return;
			}
			this[SET_PLACEHOLDER_VISIBILITY]();
			this[EVENTS].emit(new EventBase('input', { target: this }));
		});
	}
	connectedCallback() {
		super.connectedCallback();
		if (this.#inited) return;
		this.#inited = true;
		this.#actionsLeft.items = [
			{
				id: 'calc',
				content: new UIContent({ icon: 'CalculatorEqualTo' }),
				hidden: true,
			},
		];
		this.#actionsRight.items = [
			{
				id: 'increase',
				content: new UIContent({ icon: 'CalculatorAddition' }),
			},
			{
				id: 'decrease',
				content: new UIContent({ icon: 'CalculatorSubtract' }),
			},
		];
		if (this.#valueChanged) return;
		this.#valueChanged = true;
		const defaultValue = this.getAttribute('default');
		if (defaultValue) this.#default = parseFloat(defaultValue);
		const min = this.getAttribute('min');
		if (min) this.min = parseFloat(min);
		const max = this.getAttribute('max');
		if (max) this.max = parseFloat(max);
		const step = this.getAttribute('step');
		if (step) this.step = parseFloat(step);
	}
	#expressionCalc?: WidgetNumberExpressionCalculator;
	get expression() {
		return this.#expressionCalc;
	}
	set expression(value: WidgetNumberExpressionCalculator | undefined) {
		this.#expressionCalc = value;
		if (!value) this.#updateInput();
		this[INPUT_ELEMENT].type = this.#expressionCalc ? 'text' : 'number';
		this.#actionsLeft.get(0).hidden = !this.#expressionCalc;
	}
	#prevValue = NaN;
	#getValue() {
		if (this[INPUT_ELEMENT].value === '') return this.#default;
		if (!this.#expressionCalc) {
			const value = parseFloat(this[INPUT_ELEMENT].value);
			if (isNaN(value)) return this.#default;
			this.#prevValue = this.#fitValue(value);
			return this.#prevValue;
		}
		let value = null;
		try {
			value = this.#expressionCalc(this[INPUT_ELEMENT].value);
		} catch (error) {
			console.error(error);
			console.error(new Error('Error in expression or expression calculator'));
		}
		if (value === null) value = this.#prevValue;
		if (isNaN(value)) return this.#default;
		this.#prevValue = this.#fitValue(value);
		return this.#prevValue;
	}
	#fitValue(value: number): number {
		value = clamp(this.#min, value, this.#max);
		if (this.#step === 0) return value;
		let offset = (value - this.#min) % this.#step;
		if (isNaN(offset)) return value;
		if (offset >= this.#step / 2) offset -= this.#step;
		value -= offset;
		return Math.min(value, this.#max);
	}
	#updateInput() {
		if (this[INPUT_ELEMENT].value === '') return;
		let value = this.#getValue();
		if (isNaN(value)) {
			value = this.#default;
			this[INPUT_ELEMENT].value = '';
		} else {
			this[INPUT_ELEMENT].value = String(value);
		}
		this.#updateAction(value);
	}
	#increase() {
		let from = this.value;
		if (!Number.isFinite(from)) from = this.#min;
		if (!Number.isFinite(from)) from = 0;
		this.value = from + (this.#step ? this.#step : 1);
	}
	#decrease() {
		let from = this.value;
		if (!Number.isFinite(from)) from = this.#max;
		if (!Number.isFinite(from)) from = 0;
		this.value = from - (this.#step ? this.#step : 1);
	}
	#updateAction(value: number) {
		const increase = this.#actionsRight.get(0);
		const decrease = this.#actionsRight.get(1);
		if (increase) increase.disabled = value + (this.#step ? this.#step : 1) > this.#max;
		if (decrease) decrease.disabled = value - (this.#step ? this.#step : 1) < this.#min;
	}
	get value() {
		return this.#getValue();
	}
	set value(value: number) {
		if (typeof value !== 'number' || isNaN(value)) {
			this[INPUT_ELEMENT].value = '';
			return;
		}
		value = this.#fitValue(value);
		if (this.#expressionCalc) this[INPUT_ELEMENT].value = String(value);
		else if (Number.isFinite(value)) this[INPUT_ELEMENT].valueAsNumber = value;
		else this[INPUT_ELEMENT].value = '';
		this.#updateAction(value);
	}
	#min = -Infinity;
	get min() {
		return this.#min;
	}
	set min(value: number) {
		if (typeof value !== 'number' || isNaN(value)) return;
		this.#valueChanged = true;
		this.#min = value;
		this[INPUT_ELEMENT].min = String(this.#min);
		this.#updateInput();
	}
	#max = Infinity;
	get max() {
		return this.#max;
	}
	set max(value: number) {
		if (typeof value !== 'number' || isNaN(value)) return;
		this.#valueChanged = true;
		this.#max = value;
		this[INPUT_ELEMENT].max = String(this.#max);
		this.#updateInput();
	}
	#step = 0;
	get step() {
		return this.#step;
	}
	set step(value: number) {
		if (typeof value !== 'number' || isNaN(value)) return;
		this.#valueChanged = true;
		this.#step = Math.max(value, 0);
		this[INPUT_ELEMENT].step = String(this.#step);
		this.#updateInput();
	}
	#default = 0;
	get default() {
		return this.#default;
	}
	set default(value: number) {
		this.#valueChanged = true;
		this.#default = typeof value === 'number' ? value : parseFloat(value as any);
	}
	#aliasPressHandler = (event: KeyboardEvents['aliasPress']) => {
		if (event.key !== 'ui.confirm') return;
		this[EVENTS].emit(new EventBase('confirm', { target: this }));
	};
	// Nav
	navCallback = ({ active, cancel }: NavigateCallbackArgs[0]) => {
		if (cancel) this[INPUT_ELEMENT].blur();
		if (active !== false) return;
		this[INPUT_ELEMENT].focus();
	};
	#navCancelHandler = () => {
		this[INPUT_ELEMENT].blur();
	};
	get navChildern() {
		return [...this.#actionsLeft.items, ...this.#actionsRight.items].map((v) => v[ACTION_BTN]);
	}
	#keyDownHandler = (event: KeyboardEvent) => {
		if (event.code === 'Tab') event.preventDefault();
	};
	#shortcutHandler = (event: KeyboardEvents['shortcutTrigger']) => {
		if (event.key === 'ui.navPrev') navigate.nav('prev');
		else if (event.key === 'ui.navNext') navigate.nav('next');
	};
}

customElements.define('w-number', WidgetNumber);

//#region Text Field
export interface WidgetTextFieldProp extends WidgetInputProp<string> {
	autoHeight?: boolean;
}
export class WidgetTextField extends WidgetInput<string> implements Navigable {
	declare _prop?: WidgetTextFieldProp;
	#field = $div({ class: ['w-input', 'w-text-field'] });
	constructor() {
		super();
		const textarea = $new<HTMLInputElement>('textarea', { class: 'w-input' });
		this[SHADOW_ROOT].replaceChild(textarea, this[INPUT_ELEMENT]);
		this[INPUT_ELEMENT] = textarea;
		this[SHADOW_ROOT].prepend(this.#field);
		this[INPUT_ELEMENT].addEventListener('input', this.#updateHeight);
		this[INPUT_ELEMENT].addEventListener('keyup', this.#updateHeight);
		this[INPUT_ELEMENT].addEventListener('focus', () => {
			this[EVENTS].emit(new EventBase('confirm', { target: this }));
			navigate.addLayer(this[SHADOW_ROOT] as unknown as Navigable);
			navigate.on('cancel', this.#navCancelHandler);
			navigate.blockKeyboard = true;
			keyboard.preventDefaultWebBehavior = false;
			keyboard.on('shortcutTrigger', this.#shortcutHandler);
			window.addEventListener('keydown', this.#keyDownHandler);
		});
		this[INPUT_ELEMENT].addEventListener('blur', () => {
			this[EVENTS].emit(new EventBase('confirm', { target: this }));
			navigate.rmLayer(this[SHADOW_ROOT] as unknown as Navigable);
			navigate.off('cancel', this.#navCancelHandler);
			navigate.blockKeyboard = false;
			keyboard.preventDefaultWebBehavior = true;
			keyboard.off('shortcutTrigger', this.#shortcutHandler);
			window.removeEventListener('keydown', this.#keyDownHandler);
		});
	}
	#updateHeight = async () => {
		if (!this.autoHeight) return;
		let value = this[INPUT_ELEMENT].value;
		if (value.endsWith('\n')) value += '\n';
		this.#field.textContent = value;
		await sleep(0);
		this.style.height = `${this.#field.scrollHeight}px`;
		this[INPUT_ELEMENT].scrollIntoView({
			behavior: 'smooth',
			block: 'nearest',
		});
	};
	get autoHeight() {
		return this.hasAttribute('autoheight');
	}
	set autoHeight(value: boolean) {
		this.toggleAttribute('autoheight', value);
	}
	get value() {
		return this[INPUT_ELEMENT].value;
	}
	set value(value: string) {
		this[INPUT_ELEMENT].value = value;
		this.#updateHeight();
	}
	cloneNode(deep?: boolean): WidgetTextField {
		const textField = super.cloneNode(deep) as WidgetTextField;
		textField.autoHeight = this.autoHeight;
		textField.value = this.value;
		return textField;
	}
	// Nav
	navCallback = ({ active, cancel }: NavigateCallbackArgs[0]) => {
		if (cancel) this[INPUT_ELEMENT].blur();
		if (active !== false) return;
		this[INPUT_ELEMENT].focus();
	};
	#navCancelHandler = () => {
		this[INPUT_ELEMENT].blur();
	};
	#keyDownHandler = (event: KeyboardEvent) => {
		if (event.code === 'Tab') event.preventDefault();
	};
	#shortcutHandler = (event: KeyboardEvents['shortcutTrigger']) => {
		if (event.key === 'ui.navPrev') navigate.nav('prev');
		else if (event.key === 'ui.navNext') navigate.nav('next');
	};
}

customElements.define('w-text-field', WidgetTextField);
