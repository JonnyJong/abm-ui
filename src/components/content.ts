import { LocaleOptions } from 'configs/locale';
import { EventCustom, IEventCustomCreateOptions } from 'event/api/custom';
import { EventHandler, Events, IEventSource } from 'event/events';
import { $div, $new } from 'utils/dom';
import { WidgetIcon } from './widgets/icon';
import { WidgetLang } from './widgets/lang';
import { WidgetProgressRing } from './widgets/progress';

//#region Normal
export interface UIContentEvents {
	'update:icon': IEventCustomCreateOptions<
		UIContent,
		{ before?: WidgetIcon | WidgetProgressRing; after?: WidgetIcon | WidgetProgressRing }
	>;
	'update:label': IEventCustomCreateOptions<
		UIContent,
		{
			before?: HTMLDivElement | WidgetLang;
			after?: HTMLDivElement | WidgetLang;
		}
	>;
}

export interface UIContentCreateOptions {
	icon?: string;
	key?: string;
	localeOptions?: LocaleOptions;
	text?: string;
	progress?: number;
}

export class UIContent implements IEventSource<UIContentEvents> {
	#events = new Events<UIContentEvents>(['update:icon', 'update:label']);
	#icon?: string;
	#progress?: number;
	#localeKey?: string;
	#localeOptions?: LocaleOptions;
	#text?: string;
	#iconElement?: WidgetIcon | WidgetProgressRing;
	#labelElement?: HTMLDivElement | WidgetLang;
	constructor(options?: UIContentCreateOptions | string | UIContent) {
		if (options === undefined) return;
		if (typeof options === 'string') {
			this.key = options;
			return;
		}
		const { icon, key, localeOptions, text, progress } = options;
		if (icon !== undefined) this.icon = icon;
		if (localeOptions !== undefined) this.localeOptions = localeOptions;
		if (key !== undefined) this.key = key;
		if (text !== undefined) this.text = text;
		if (progress !== undefined) this.progress = progress;
	}
	#updateIcon() {
		const before = this.#iconElement;
		if (this.#progress !== undefined) {
			if (this.#iconElement instanceof WidgetProgressRing) {
				this.#iconElement.value = this.#progress;
				return;
			}
			this.#iconElement = $new<WidgetProgressRing>('w-progress-ring');
			this.#iconElement.value = this.#progress;
		} else if (this.#icon !== undefined) {
			if (this.#iconElement instanceof WidgetIcon) {
				this.#iconElement.key = this.#icon;
				return;
			}
			this.#iconElement = $new<WidgetIcon>('w-icon');
			this.#iconElement.key = this.#icon;
		} else {
			if (this.#iconElement === undefined) return;
			this.#iconElement = undefined;
		}
		this.#events.emit(
			new EventCustom('update:icon', {
				target: this,
				details: { before, after: this.#iconElement },
			}),
		);
	}
	get icon() {
		return this.#icon;
	}
	set icon(value: string | undefined) {
		if (value === this.#icon || !['undefined', 'string'].includes(typeof value)) return;
		this.#icon = value;
		this.#updateIcon();
	}
	get progress() {
		return this.#progress;
	}
	set progress(value: number | undefined) {
		if (value === this.#progress || !['undefined', 'number'].includes(typeof value)) return;
		this.#progress = value;
		this.#updateIcon();
	}
	#updateLabel() {
		const before = this.#labelElement;
		if (this.#localeKey !== undefined) {
			if (this.#labelElement instanceof WidgetLang) {
				this.#labelElement.key = this.#localeKey;
				this.#labelElement.options = this.#localeOptions;
				return;
			}
			this.#labelElement = $new<WidgetLang>('w-lang');
			this.#labelElement.key = this.#localeKey;
			this.#labelElement.options = this.#localeOptions;
		} else if (this.#text !== undefined) {
			if (this.#labelElement instanceof HTMLDivElement) {
				this.#labelElement.textContent = this.#text;
				return;
			}
			this.#labelElement = $div();
			this.#labelElement.textContent = this.#text;
		} else {
			if (this.#labelElement === undefined) return;
			this.#labelElement = undefined;
		}
		this.#events.emit(
			new EventCustom('update:label', {
				target: this,
				details: { before, after: this.#labelElement },
			}),
		);
	}
	get key() {
		return this.#localeKey;
	}
	set key(value: string | undefined) {
		if (value === this.#localeKey || !['undefined', 'string'].includes(typeof value)) return;
		this.#localeKey = value;
		this.#updateLabel();
	}
	get localeOptions() {
		return this.#localeOptions;
	}
	set localeOptions(value: LocaleOptions | undefined) {
		this.#localeOptions = value;
		if (!(this.#labelElement instanceof WidgetLang)) return;
		this.#labelElement.options = value;
	}
	get text() {
		return this.#text;
	}
	set text(value: string | undefined) {
		if (value === this.#text || !['undefined', 'string'].includes(typeof value)) return;
		this.#text = value;
		this.#updateLabel();
	}
	on<Type extends keyof UIContentEvents>(type: Type, handler: EventHandler<Type, UIContentEvents[Type], any>): void {
		this.#events.on(type, handler);
	}
	off<Type extends keyof UIContentEvents>(type: Type, handler: EventHandler<Type, UIContentEvents[Type], any>): void {
		this.#events.off(type, handler);
	}
	get iconElement() {
		return this.#iconElement;
	}
	get labelElement() {
		return this.#labelElement;
	}
	clone() {
		return new UIContent({
			icon: this.icon,
			key: this.key,
			localeOptions: this.localeOptions,
			text: this.text,
			progress: this.progress,
		});
	}
}

//#region Text
export interface UIContentTextEvents {
	'update:label': IEventCustomCreateOptions<
		UIContentText,
		{
			before?: HTMLDivElement | WidgetLang;
			after?: HTMLDivElement | WidgetLang;
		}
	>;
}

export type UIContentTextCreateOptions =
	| {
			key: string;
			localeOptions?: LocaleOptions;
			text?: string;
	  }
	| {
			text: string;
			key?: string;
			localeOptions?: LocaleOptions;
	  };

export class UIContentText implements IEventSource<UIContentTextEvents> {
	#events = new Events<UIContentTextEvents>(['update:label']);
	#localeKey?: string;
	#localeOptions?: LocaleOptions;
	#text = '';
	#labelElement: HTMLDivElement | WidgetLang = $div();
	constructor(options?: UIContentTextCreateOptions | string | UIContentText) {
		if (options === undefined) return;
		if (typeof options === 'string') {
			this.key = options;
			return;
		}
		const { key, localeOptions, text } = options;
		if (localeOptions !== undefined) this.localeOptions = localeOptions;
		if (key !== undefined) this.key = key;
		if (text !== undefined) this.text = text;
	}
	#updateLabel() {
		const before = this.#labelElement;
		if (this.#localeKey !== undefined) {
			if (this.#labelElement instanceof WidgetLang) {
				this.#labelElement.key = this.#localeKey;
				this.#labelElement.options = this.#localeOptions;
				return;
			}
			this.#labelElement = $new<WidgetLang>('w-lang');
			this.#labelElement.key = this.#localeKey;
			this.#labelElement.options = this.#localeOptions;
		} else {
			if (this.#labelElement instanceof HTMLDivElement) {
				this.#labelElement.textContent = this.#text;
				return;
			}
			this.#labelElement = $div();
			this.#labelElement.textContent = this.#text;
		}
		this.#events.emit(
			new EventCustom('update:label', {
				target: this,
				details: { before, after: this.#labelElement },
			}),
		);
	}
	get key() {
		return this.#localeKey;
	}
	set key(value: string | undefined) {
		if (value === this.#localeKey || !['undefined', 'string'].includes(typeof value)) return;
		this.#localeKey = value;
		this.#updateLabel();
	}
	get localeOptions() {
		return this.#localeOptions;
	}
	set localeOptions(value: LocaleOptions | undefined) {
		this.#localeOptions = value;
		if (!(this.#labelElement instanceof WidgetLang)) return;
		this.#labelElement.options = value;
	}
	get text() {
		return this.#text;
	}
	set text(value: string) {
		if (value === this.#text) return;
		this.#localeKey = String(value);
		this.#updateLabel();
	}
	on<Type extends keyof UIContentTextEvents>(
		type: Type,
		handler: EventHandler<Type, UIContentTextEvents[Type], any>,
	): void {
		this.#events.on(type, handler);
	}
	off<Type extends keyof UIContentTextEvents>(
		type: Type,
		handler: EventHandler<Type, UIContentTextEvents[Type], any>,
	): void {
		this.#events.off(type, handler);
	}
	get labelElement() {
		return this.#labelElement;
	}
	clone() {
		return new UIContentText({
			key: this.key,
			localeOptions: this.localeOptions,
			text: this.text,
		});
	}
}

//#region All
export type UIContentAllCreateOptions =
	| {
			icon: string;
			key: string;
			localeOptions?: LocaleOptions;
			text?: string;
			progress?: number;
	  }
	| {
			icon: string;
			key?: string;
			localeOptions?: LocaleOptions;
			text: string;
			progress?: number;
	  };

export class UIContentAll extends UIContent {
	constructor(options: UIContentCreateOptions | string | UIContentAll) {
		super(options);
		if (!super.text) super.text = '';
		if (!super.icon) super.icon = '';
	}
	get text(): string {
		return super.text!;
	}
	set text(value: string) {
		if (typeof value !== 'string') value = '';
		super.text = value;
	}
	get icon() {
		return super.icon!;
	}
	set icon(value: string) {
		if (typeof value !== 'string') value = '';
		super.icon = value;
	}
	get labelElement() {
		return super.labelElement!;
	}
	get iconElement() {
		return super.iconElement!;
	}
	clone() {
		return new UIContentAll({
			icon: this.icon,
			key: this.key,
			localeOptions: this.localeOptions,
			text: this.text,
			progress: this.progress,
		});
	}
}
