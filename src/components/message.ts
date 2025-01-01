import { configs } from 'configs';
import { EventCustom, IEventCustomCreateOptions } from 'event/api/custom';
import { EventHandler, Events, IEventSource } from 'event/events';
import { toArray } from 'utils/array';
import { Color } from 'utils/color';
import { $div, $new, DOMContents } from 'utils/dom';
import { sleep } from 'utils/timer';
import { UIContent, UIContentCreateOptions, UIContentEvents } from './content';
import { WidgetBtn, WidgetBtnState } from './widgets/btn';

export interface MessageActionCreateOptions<ID extends string = string> {
	id: ID;
	label: UIContent | string | UIContentCreateOptions;
	disabled?: boolean;
	state?: WidgetBtnState;
	delay?: number;
	progress?: number;
	checked?: boolean;
	color?: Color;
}

export interface MessageCreateOptions<ID extends string = string> {
	id: string;
	title: UIContent | string | UIContentCreateOptions;
	content: DOMContents;
	actions?: (MessageActionCreateOptions<ID> | MessageAction<ID>)[];
	delay?: number;
	autoClose?: boolean;
}

//#region Action
const BTN = Symbol();
export class MessageAction<ID extends string = string> {
	id: ID;
	[BTN] = $new<WidgetBtn>('w-btn');
	constructor(options: MessageActionCreateOptions<ID> | MessageAction<ID>) {
		this.id = options.id;
		this[BTN].content = options.label;
		if (options.disabled) this[BTN].disabled = options.disabled;
		if (options.state) this[BTN].state = options.state;
		if (options.delay) this[BTN].delay = options.delay;
		if (options.progress) this[BTN].progress = options.progress;
		if (options.checked) this[BTN].checked = options.checked;
		if (options.color) this[BTN].color = options.color;
	}
	get label() {
		return this[BTN].content;
	}
	set label(value: UIContent | string | UIContentCreateOptions) {
		this[BTN].content = value;
	}
	get disabled() {
		return this[BTN].disabled;
	}
	set disabled(value: boolean) {
		this[BTN].disabled = value;
	}
	get state() {
		return this[BTN].state;
	}
	set state(value: WidgetBtnState) {
		this[BTN].state = value;
	}
	get delay() {
		return this[BTN].delay;
	}
	set delay(value: number) {
		this[BTN].delay = value;
	}
	get progress() {
		return this[BTN].progress;
	}
	set progress(value: number) {
		this[BTN].progress = value;
	}
	get checked() {
		return this[BTN].checked;
	}
	set checked(value: boolean) {
		this[BTN].checked = value;
	}
	get color() {
		return this[BTN].color;
	}
	set color(value: Color | undefined) {
		this[BTN].color = value;
	}
}

//#region Msg
export interface MessageEvents<ID extends string = string> {
	action: IEventCustomCreateOptions<Message<ID>, ID>;
}
const DEFAULT_DELAY = 3000;
export class Message<ID extends string = string> implements IEventSource<MessageEvents<ID>> {
	#events = new Events<MessageEvents<ID>>(['action']);
	#mgr: MessageManager;
	#id: string;
	#msg = $div({ class: 'ui-msg' });
	#titleElement = $div({ class: 'ui-msg-title' });
	#title: UIContent;
	#content = $div({ class: 'ui-msg-content' });
	#actions: MessageAction<ID>[] = [];
	#actionsElement = $div({ class: 'ui-msg-actions' });
	#delay = DEFAULT_DELAY;
	#timer: number | null = null;
	#autoClose = true;
	constructor(mgr: MessageManager, options: MessageCreateOptions<ID>) {
		this.#mgr = mgr;
		this.#msg.append(this.#titleElement, this.#content, this.#actionsElement);
		this.#id = options.id;
		const msgControl = $div({ class: 'ui-msg-control' });
		const msgHide = $new<WidgetBtn>('w-btn', { class: 'ui-msg-c-hide' });
		const msgClose = $new<WidgetBtn>('w-btn', { class: 'ui-msg-c-close' });
		msgControl.append(msgHide, msgClose);
		this.#msg.append(msgControl);
		msgHide.content.icon = configs.icons.defaults.msgHide;
		msgClose.content.icon = configs.icons.defaults.msgClose;
		msgHide.flat = true;
		msgClose.flat = true;
		msgHide.on('active', () => this.hide());
		msgClose.on('active', () => this.close());
		// Title
		if (options.title instanceof UIContent) this.#title = options.title;
		else this.#title = new UIContent(options.title);
		if (this.#title.iconElement) this.#titleElement.append(this.#title.iconElement);
		if (this.#title.labelElement) this.#titleElement.append(this.#title.labelElement);
		this.#title.on('update:icon', this.#updateTitleIcon);
		this.#title.on('update:label', this.#updateTitleLabel);
		// Content
		this.content = options.content;
		// Actions
		if (options.actions) this.actions = options.actions;
		// Delay
		this.delay = typeof options.delay === 'number' ? options.delay : DEFAULT_DELAY;
		// AutoClose
		if (options.autoClose !== undefined) this.#autoClose = !!options.autoClose;
	}
	get id() {
		return this.#id;
	}
	get element() {
		return this.#msg;
	}
	//#region Title
	#updateTitleIcon = ({ details }: UIContentEvents['update:icon']) => {
		details.before?.remove();
		if (details.after) this.#titleElement.prepend(details.after);
	};
	#updateTitleLabel = ({ details }: UIContentEvents['update:label']) => {
		details.before?.remove();
		if (details.after) this.#titleElement.append(details.after);
	};
	get title() {
		return this.#title;
	}
	set title(value: UIContent | string | UIContentCreateOptions) {
		if (typeof value === 'string') {
			this.#title.key = value;
			return;
		}
		if (!(value instanceof UIContent)) value = new UIContent(value);
		this.#title.on('update:icon', this.#updateTitleIcon);
		this.#title.on('update:label', this.#updateTitleLabel);
		this.#title = value as UIContent;
		this.#titleElement.replaceChildren();
		if (this.#title.iconElement) this.#titleElement.append(this.#title.iconElement);
		if (this.#title.labelElement) this.#titleElement.append(this.#title.labelElement);
		this.#title.off('update:icon', this.#updateTitleIcon);
		this.#title.off('update:label', this.#updateTitleLabel);
	}
	//#region Content
	get content(): HTMLElement[] {
		return [...this.#content.children] as HTMLElement[];
	}
	set content(value: DOMContents) {
		this.#content.replaceChildren(...toArray(value));
	}
	//#region AutoClose
	get autoClose() {
		return this.#autoClose;
	}
	set autoClose(value: boolean) {
		this.#autoClose = value;
	}
	//#region Delay
	get delay() {
		return this.#delay;
	}
	set delay(value: number) {
		if (typeof value !== 'number' || isNaN(value)) return;
		this.#delay = Math.max(value);
		if (value === Infinity) this.#delay = 0;
		if (this.#timer !== null) clearTimeout(this.#timer);
		if (this.#delay === 0) {
			this.#timer = null;
			return;
		}
		this.#timer = setTimeout(() => this.hide(), this.#delay);
	}
	//#region Actions
	get actions(): MessageAction[] {
		return [...this.#actions];
	}
	set actions(value: (MessageActionCreateOptions<ID> | MessageAction<ID>)[]) {
		this.#actions = value.map((v) => new MessageAction(v));
		this.#actionsElement.replaceChildren(
			...this.#actions.map((action) => {
				action[BTN].on('active', () => {
					this.#events.emit(new EventCustom('action', { target: this, details: action.id }));
					if (this.#autoClose) this.close();
				});
				return action[BTN];
			}),
		);
	}
	//#region Event
	on<Type extends keyof MessageEvents<ID>>(type: Type, handler: EventHandler<Type, MessageEvents<ID>[Type], any>): void {
		this.#events.on(type, handler);
	}
	off<Type extends keyof MessageEvents<ID>>(
		type: Type,
		handler: EventHandler<Type, MessageEvents<ID>[Type], any>,
	): void {
		this.#events.off(type, handler);
	}
	//#region Other
	hide() {
		this.#mgr.hide(this);
	}
	close() {
		this.#mgr.close(this);
	}
}

//#region Mgr
const MSG_GAP = 16;
export class MessageManager {
	#container = $div({ class: 'ui-msg-container' });
	#msgs: Message<any>[] = [];
	#opening = false;
	constructor() {
		document.body.append(this.#container);
	}
	get container() {
		return this.#container;
	}
	new(options: MessageCreateOptions): Message {
		const msg = new Message(this, options);
		this.#msgs.push(msg);
		this.show(msg);
		return msg;
	}
	get<ID extends string = string>(id: string): Message<ID>[] {
		return this.#msgs.filter((msg) => {
			return msg.id === id;
		});
	}
	async #resetView() {
		let height = 0;
		let displayHeight = 0;
		for (const element of this.#container.children as unknown as HTMLElement[]) {
			element.style.top = `${height}px`;
			if (element.classList.contains('ui-msg-closing')) continue;
			const size = element.getBoundingClientRect().height + MSG_GAP;
			height += size;
			if (!element.classList.contains('ui-msg-show')) continue;
			displayHeight += size;
		}
		height -= MSG_GAP;
		displayHeight -= MSG_GAP;

		this.#container.style.setProperty('--ui-msg-mgr-top', `${displayHeight - Math.min(height, innerHeight)}px`);
		this.#container.style.setProperty('--ui-msg-mgr-height', `${height}px`);

		if (this.#opening) return;

		await sleep(100);

		this.#container.scroll({
			top: Math.max(0, height - this.#container.getBoundingClientRect().height),
			behavior: 'smooth',
		});
	}
	show(msg: Message<any>) {
		if (!this.#msgs.includes(msg)) return;
		this.#container.append(msg.element);
		[...this.#container.querySelectorAll<HTMLElement>('.ui-msg-show')]
			.reverse()
			.slice(2)
			.forEach((e) => e.classList.remove('ui-msg-show'));
		msg.element.classList.add('ui-msg-show');
		this.#resetView();
	}
	hide(msg: Message<any>) {
		if (!this.#msgs.includes(msg)) return;
		msg.element.classList.remove('ui-msg-show');
		this.#resetView();
	}
	async close(msg: Message<any>) {
		const index = this.#msgs.indexOf(msg);
		if (index === -1) return;
		msg.element.classList.add('ui-msg-closing');
		this.#msgs.splice(index, 1);
		this.#resetView();
		await sleep(100);
		msg.element.remove();
	}
	toggle() {
		this.#opening = this.#container.classList.toggle('ui-msg-mgr-open');
		this.#container.querySelectorAll<HTMLElement>('.ui-msg-show').forEach((e) => e.classList.remove('ui-msg-show'));
		this.#resetView();
	}
}

export const msgMgr = new MessageManager();
