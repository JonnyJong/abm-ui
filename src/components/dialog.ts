import { toArray } from 'abm-utils/array';
import { sleep } from 'abm-utils/timer';
import { IEventBaseCreateOptions } from 'event/api/base';
import { EventCustom, IEventCustomCreateOptions } from 'event/api/custom';
import { EventHandler, Events, IEventSource } from 'event/events';
import { navigate } from 'navigate';
import { $div, $new, DOMContents } from 'utils/dom';
import { UIContent, UIContentCreateOptions, UIContentEvents } from './content';
import { WidgetBtn, WidgetBtnState } from './widgets/btn';

export interface DialogBaseCreateOptions {
	title: UIContent | string | UIContentCreateOptions;
	content: DOMContents;
}
export interface DialogActionOptions<ID extends string = string> {
	id: ID;
	content: UIContent | string | UIContentCreateOptions;
	state?: Exclude<WidgetBtnState, 'toggle'>;
	delay?: number;
}
export interface DialogCreateOptions<ID extends string = string> extends DialogBaseCreateOptions {
	actions: (DialogActionOptions<ID> | DialogAction<ID>)[];
}

const BUTTON = Symbol();
const STATES: Exclude<WidgetBtnState, 'toggle'>[] = ['', 'danger', 'primary'];

export class DialogAction<ID extends string = string> {
	id: ID;
	[BUTTON] = $new<WidgetBtn>('w-btn');
	constructor(options: DialogActionOptions<ID> | DialogAction<ID>) {
		this.id = options.id;
		this.content = options.content;
		if (options.state) this.state = options.state;
		if (options.delay) this.delay = options.delay;
	}
	get content(): UIContent {
		return this[BUTTON].content;
	}
	set content(value: UIContent | string | UIContentCreateOptions) {
		this[BUTTON].content = value;
	}
	get state() {
		const state = this[BUTTON].state;
		if (state === 'toggle') return '';
		return state;
	}
	set state(value: Exclude<WidgetBtnState, 'toggle'>) {
		if (!STATES.includes(value)) return;
		this[BUTTON].state = value;
	}
	get delay() {
		return this[BUTTON].delay;
	}
	set delay(value: number) {
		this[BUTTON].delay = value;
	}
}

export interface DialogEvents<ID extends string = string> {
	action: IEventCustomCreateOptions<Dialog<ID>, ID>;
}

export class Dialog<ID extends string = string> implements IEventSource<DialogEvents<ID>> {
	#events = new Events<DialogEvents<ID>>(['action']);
	#filter = $div({ class: ['ui-preset-fullscreen', 'ui-dialog-filter'] });
	#dialog = $div({ class: 'ui-dialog' });
	#titleElement = $div({ class: 'ui-dialog-title' });
	#title: UIContent;
	#content = $div({ class: 'ui-dialog-content' });
	#actionsElement = $div({ class: 'ui-dialog-actions' });
	#actions: DialogAction<ID>[] = [];
	constructor(options: DialogCreateOptions<ID>) {
		this.#dialog.append(this.#titleElement, this.#content, this.#actionsElement);
		// Title
		if (options.title instanceof UIContent) this.#title = options.title;
		else this.#title = new UIContent(options.title);
		if (this.#title.iconElement) this.#titleElement.append(this.#title.iconElement);
		if (this.#title.labelElement) this.#titleElement.append(this.#title.labelElement);
		this.#title.on('update:icon', this.#updateTitleIcon);
		this.#title.on('update:label', this.#updateTitleText);
		// Content
		this.content = options.content;
		// Actions
		this.actions = options.actions;
	}
	#updateTitleIcon = ({ details }: UIContentEvents['update:icon']) => {
		details.before?.remove();
		if (!details.after) return;
		this.#titleElement.prepend(details.after);
	};
	#updateTitleText = ({ details }: UIContentEvents['update:label']) => {
		details.before?.remove();
		if (!details.after) return;
		this.#titleElement.append(details.after);
	};
	get title(): UIContent {
		return this.#title;
	}
	set title(value: UIContent | string) {
		if (typeof value === 'string') {
			this.#title.key = value;
			return;
		}
		if (!(value instanceof UIContent)) return;
		this.#title.off('update:icon', this.#updateTitleIcon);
		this.#title.off('update:label', this.#updateTitleText);
		this.#title = value;
		this.#title.on('update:icon', this.#updateTitleIcon);
		this.#title.on('update:label', this.#updateTitleText);
		this.#titleElement.replaceChildren();
		if (this.#title.iconElement) this.#titleElement.append(this.#title.iconElement);
		if (this.#title.labelElement) this.#titleElement.append(this.#title.labelElement);
	}
	get content(): HTMLElement[] {
		return [...this.#content.children] as HTMLElement[];
	}
	set content(value: DOMContents) {
		this.#content.append(...toArray(value));
	}
	get actions(): DialogAction<ID>[] {
		return [...this.#actions];
	}
	set actions(value: (DialogActionOptions<ID> | DialogAction<ID>)[]) {
		for (const action of this.#actions) {
			action[BUTTON].off('active', this.#actionHandler);
		}
		this.#actions = value.map((option) => new DialogAction(option));
		this.#actionsElement.replaceChildren(
			...this.#actions.map((action) => {
				action[BUTTON].on('active', this.#actionHandler);
				return action[BUTTON];
			}),
		);
	}
	open() {
		document.body.append(this.#filter, this.#dialog);
		navigate.addLayer(this.#dialog, this.#actions[0]?.[BUTTON]);
	}
	async close() {
		this.#filter.classList.add('ui-dialog-filter-hiding');
		this.#dialog.classList.add('ui-dialog-hiding');
		await sleep(100);
		navigate.rmLayer(this.#dialog);
		this.#filter.remove();
		this.#dialog.remove();
		this.#filter.classList.remove('ui-dialog-filter-hiding');
		this.#dialog.classList.remove('ui-dialog-hiding');
	}
	#actionHandler: EventHandler<'active', IEventBaseCreateOptions<WidgetBtn>, any> = (event) => {
		const action = this.#actions.find((action) => action[BUTTON] === event.target);
		if (!action) {
			console.warn('Action not found', this, event.target);
			return;
		}
		this.#events.emit(new EventCustom('action', { target: this, details: action.id }));
	};
	on<Type extends keyof DialogEvents<ID>>(type: Type, handler: EventHandler<Type, DialogEvents<ID>[Type], any>): void {
		this.#events.on(type, handler);
	}
	off<Type extends keyof DialogEvents<ID>>(type: Type, handler: EventHandler<Type, DialogEvents<ID>[Type], any>): void {
		this.#events.off(type, handler);
	}
	static confirm(options: DialogBaseCreateOptions): Promise<boolean> {
		const dialog = new Dialog<'confirm' | 'cancel'>({
			...options,
			actions: [
				{
					id: 'confirm',
					content: 'ui.confirm',
					state: 'primary',
				},
				{
					id: 'cancel',
					content: 'ui.cancel',
				},
			],
		});
		dialog.open();
		return new Promise((resolve) => {
			dialog.on('action', ({ details }) => {
				dialog.close();
				resolve(details === 'confirm');
			});
		});
	}
	static ok(options: DialogBaseCreateOptions): Promise<void> {
		const dialog = new Dialog<'ok'>({
			...options,
			actions: [
				{
					id: 'ok',
					content: 'ui.ok',
				},
			],
		});
		dialog.open();
		return new Promise((resolve) => {
			dialog.on('action', () => {
				dialog.close();
				resolve();
			});
		});
	}
}
