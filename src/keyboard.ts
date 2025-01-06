import { equalsSet } from 'abm-utils';
import { EventBase, IEventBaseCreateOptions } from 'event/api/base';
import { EventKey, IEventKeyCreateOptions } from 'event/api/key';
import { EventHandler, Events, IEventSource } from 'event/events';

declare global {
	class KeyboardLayoutMap {
		readonly size: number;
		entries(): MapIterator<[string, string]>;
		forEach<T = KeyboardLayoutMap>(
			callbackfn: (this: T, value: string, key: string, map: this) => void,
			thisArg?: T,
		): void;
		get(key: string): string | undefined;
		has(key: string): boolean;
		keys(): MapIterator<string>;
		values(): MapIterator<string>;
	}
	class Keyboard extends EventTarget {
		getLayoutMap(): Promise<KeyboardLayoutMap>;
		lock(keyCodes?: string[]): Promise<void>;
		unlock(): void;
	}
	interface Navigator {
		readonly keyboard: Keyboard;
	}
}

const DEFAULT_SHORTCUT_MAP: KeyBindMap = {
	'ui.navNext': [new Set(['Tab'])],
	'ui.navPrev': [new Set(['Tab', 'ShiftLeft'])],
};

const DEFAULT_ALIAS_MAP: AliasMap = {
	'ui.confirm': new Set(['Enter', 'Space']),
	'ui.cancel': new Set(['Escape']),
	'ui.up': new Set(['ArrowUp', 'KeyW']),
	'ui.right': new Set(['ArrowRight', 'KeyD']),
	'ui.down': new Set(['ArrowDown', 'KeyS']),
	'ui.left': new Set(['ArrowLeft', 'KeyA']),
	'ui.selectMulti': new Set(['ControlLeft', 'ControlRight']),
	'ui.selectRange': new Set(['ShiftLeft', 'ShiftRight']),
};

export type KeysAllow =
	| 'Escape'
	| 'F1'
	| 'F2'
	| 'F3'
	| 'F4'
	| 'F5'
	| 'F6'
	| 'F7'
	| 'F8'
	| 'F9'
	| 'F10'
	| 'F11'
	| 'F12'
	| 'F13'
	| 'F14'
	| 'F15'
	| 'F16'
	| 'F17'
	| 'F18'
	| 'F19'
	| 'F20'
	| 'ControlLeft'
	| 'AltLeft'
	| 'ShiftLeft'
	| 'ControlRight'
	| 'AltRight'
	| 'ShiftRight'
	| 'Tab'
	| 'Backquote'
	| 'Digit0'
	| 'Digit1'
	| 'Digit2'
	| 'Digit3'
	| 'Digit4'
	| 'Digit5'
	| 'Digit6'
	| 'Digit7'
	| 'Digit8'
	| 'Digit9'
	| 'Minus'
	| 'Equal'
	| 'Backspace'
	| 'Enter'
	| 'BracketLeft'
	| 'BracketRight'
	| 'Backslash'
	| 'Semicolon'
	| 'Quote'
	| 'Comma'
	| 'Period'
	| 'Slash'
	| 'Space'
	| 'Home'
	| 'End'
	| 'PageUp'
	| 'PageDown'
	| 'ArrowUp'
	| 'ArrowRight'
	| 'ArrowDown'
	| 'ArrowLeft'
	| 'KeyA'
	| 'KeyB'
	| 'KeyC'
	| 'KeyD'
	| 'KeyE'
	| 'KeyF'
	| 'KeyG'
	| 'KeyH'
	| 'KeyI'
	| 'KeyJ'
	| 'KeyK'
	| 'KeyL'
	| 'KeyM'
	| 'KeyN'
	| 'KeyO'
	| 'KeyP'
	| 'KeyQ'
	| 'KeyR'
	| 'KeyS'
	| 'KeyT'
	| 'KeyU'
	| 'KeyV'
	| 'KeyW'
	| 'KeyX'
	| 'KeyY'
	| 'KeyZ'
	| 'Numpad0'
	| 'Numpad1'
	| 'Numpad2'
	| 'Numpad3'
	| 'Numpad4'
	| 'Numpad5'
	| 'Numpad6'
	| 'Numpad7'
	| 'Numpad8'
	| 'Numpad9'
	| 'NumpadAdd'
	| 'NumpadSubtract'
	| 'NumpadMultiply'
	| 'NumpadDivide'
	| 'NumpadDecimal';
const KEYS_ALLOW: KeysAllow[] = [
	'Escape',
	'F1',
	'F2',
	'F3',
	'F4',
	'F5',
	'F6',
	'F7',
	'F8',
	'F9',
	'F10',
	'F11',
	'F12',
	'F13',
	'F14',
	'F15',
	'F16',
	'F17',
	'F18',
	'F19',
	'F20',
	'ControlLeft',
	'AltLeft',
	'ShiftLeft',
	'ControlRight',
	'AltRight',
	'ShiftRight',
	'Tab',
	'Backquote',
	'Digit0',
	'Digit1',
	'Digit2',
	'Digit3',
	'Digit4',
	'Digit5',
	'Digit6',
	'Digit7',
	'Digit8',
	'Digit9',
	'Minus',
	'Equal',
	'Backspace',
	'Enter',
	'BracketLeft',
	'BracketRight',
	'Backslash',
	'Semicolon',
	'Quote',
	'Comma',
	'Period',
	'Slash',
	'Space',
	'Home',
	'End',
	'PageUp',
	'PageDown',
	'ArrowUp',
	'ArrowRight',
	'ArrowDown',
	'ArrowLeft',
	'KeyA',
	'KeyB',
	'KeyC',
	'KeyD',
	'KeyE',
	'KeyF',
	'KeyG',
	'KeyH',
	'KeyI',
	'KeyJ',
	'KeyK',
	'KeyL',
	'KeyM',
	'KeyN',
	'KeyO',
	'KeyP',
	'KeyQ',
	'KeyR',
	'KeyS',
	'KeyT',
	'KeyU',
	'KeyV',
	'KeyW',
	'KeyX',
	'KeyY',
	'KeyZ',
	'Numpad0',
	'Numpad1',
	'Numpad2',
	'Numpad3',
	'Numpad4',
	'Numpad5',
	'Numpad6',
	'Numpad7',
	'Numpad8',
	'Numpad9',
	'NumpadAdd',
	'NumpadSubtract',
	'NumpadMultiply',
	'NumpadDivide',
	'NumpadDecimal',
];

const DEFAULT_WEB_BEHAVIOR_RELATED_BUTTONS = new Set<KeysAllow>([
	'ArrowUp',
	'ArrowRight',
	'ArrowDown',
	'ArrowLeft',
	'Space',
	'Tab',
]);

export type KeyBindItem = Set<KeysAllow>;
export type KeyBindGroup = KeyBindItem[];
export type KeyBindMap = {
	[id: string]: KeyBindGroup;
};
export type AliasItem = Set<KeysAllow>;
export type AliasMap = {
	[id: string]: AliasItem;
};

const BINDING = Symbol();
const DEACTIVATION_DELAY = 100;

export interface KeyBinderEvents {
	update: IEventBaseCreateOptions<KeyBinder>;
	done: IEventBaseCreateOptions<KeyBinder>;
}

//#region Binder
class KeyBinder implements IEventSource<KeyBinderEvents> {
	#events = new Events<KeyBinderEvents>(['done', 'update']);
	#binding = true;
	#activated = new Set<string>();
	#deactivating = new Set<string>();
	#timer: number | null = null;
	constructor() {
		window.addEventListener('keydown', this.#keyDownHandler);
		window.addEventListener('keyup', this.#keyUpHandler);
	}
	#keyDownHandler = (event: KeyboardEvent) => {
		if (event.isComposing) return;
		if (!KEYS_ALLOW.includes(event.code as any)) return;
		if (this.#activated.has(event.code) && !this.#deactivating.has(event.code)) return;

		// Clear
		if (this.#timer !== null) {
			clearTimeout(this.#timer);
			this.#timer = null;
			for (const key of this.#deactivating) {
				this.#activated.delete(key);
			}
			this.#deactivating.clear();
		}
		// Add
		this.#activated.add(event.code);
		this.#events.emit(new EventBase('update', { target: this }));
	};
	#keyUpHandler = (event: KeyboardEvent) => {
		if (event.isComposing) return;
		if (!KEYS_ALLOW.includes(event.code as any)) return;

		// Deactive
		this.#deactivating.add(event.code);
		// Done
		if (this.#deactivating.size === this.#activated.size) {
			this.cancel();
			if (this.#timer !== null) {
				clearTimeout(this.#timer);
				this.#timer = null;
			}
			this.#events.emit(new EventBase('done', { target: this }));
			return;
		}
		// Wait
		if (this.#timer !== null) {
			clearTimeout(this.#timer);
			this.#timer = null;
		}
		this.#timer = setTimeout(() => {
			this.#timer = null;
			for (const key of this.#deactivating) {
				this.#activated.delete(key);
			}
			this.#deactivating.clear();
			this.#events.emit(new EventBase('update', { target: this }));
		}, DEACTIVATION_DELAY);
	};
	cancel() {
		window.removeEventListener('keydown', this.#keyDownHandler);
		window.removeEventListener('keyup', this.#keyUpHandler);
		keyboard[BINDING] = false;
	}
	get binding() {
		return this.#binding;
	}
	get keys(): Set<KeysAllow> {
		return new Set(this.#activated) as any;
	}
	on<Type extends keyof KeyBinderEvents>(type: Type, handler: EventHandler<Type, KeyBinderEvents[Type], any>): void {
		this.#events.on(type, handler);
	}
	off<Type extends keyof KeyBinderEvents>(type: Type, handler: EventHandler<Type, KeyBinderEvents[Type], any>): void {
		this.#events.off(type, handler);
	}
}

export interface KeyboardEvents {
	down: IEventKeyCreateOptions<KeyboardManager, KeysAllow>;
	up: IEventKeyCreateOptions<KeyboardManager, KeysAllow>;
	press: IEventKeyCreateOptions<KeyboardManager, KeysAllow>;
	trigger: IEventKeyCreateOptions<KeyboardManager, KeysAllow>;
	shortcut: IEventKeyCreateOptions<KeyboardManager, string>;
	shortcutTrigger: IEventKeyCreateOptions<KeyboardManager, string>;
	aliasDown: IEventKeyCreateOptions<KeyboardManager, string>;
	aliasUp: IEventKeyCreateOptions<KeyboardManager, string>;
	aliasPress: IEventKeyCreateOptions<KeyboardManager, string>;
	aliasTrigger: IEventKeyCreateOptions<KeyboardManager, string>;
}

//#region Manager
class KeyboardManager implements IEventSource<KeyboardEvents> {
	#events = new Events<KeyboardEvents>([
		'down',
		'up',
		'press',
		'trigger',
		'shortcut',
		'shortcutTrigger',
		'aliasDown',
		'aliasUp',
		'aliasPress',
		'aliasTrigger',
	]);
	#map: KeyBindMap = DEFAULT_SHORTCUT_MAP;
	#aliasMap: AliasMap = DEFAULT_ALIAS_MAP;
	#activated = new Set<KeysAllow>();
	[BINDING] = false;
	constructor() {
		window.addEventListener('keydown', this.#keyDownHandler);
		window.addEventListener('keyup', this.#keyUpHandler);
	}
	#tryShortcut(trigger?: boolean) {
		FIND_ID: for (const [id, group] of Object.entries(this.#map)) {
			for (const item of group) {
				if (!equalsSet(item, this.#activated)) continue;
				this.#events.emit(
					new EventKey('shortcutTrigger', {
						target: this,
						key: id,
					}),
				);
				if (!trigger) continue FIND_ID;
				this.#events.emit(
					new EventKey('shortcut', {
						target: this,
						key: id,
					}),
				);
				continue FIND_ID;
			}
		}
	}
	#findAlias(key: string): string[] {
		const ids: string[] = [];
		for (const [id, item] of Object.entries(this.#aliasMap)) {
			if (item.has(key as any)) ids.push(id);
		}
		return ids;
	}
	#checkItem(item: KeyBindItem | AliasItem) {
		for (const key of item) {
			if (KEYS_ALLOW.includes(key)) continue;
			throw new Error('Invalid key bind item.');
		}
	}
	//#region ShortCut
	get bindMap() {
		const result: KeyBindMap = {};
		for (const [id, group] of Object.entries(this.#map)) {
			result[id] = group.map((item) => new Set(item as any));
		}
		return result;
	}
	set bindMap(value: KeyBindMap) {
		const map: KeyBindMap = {};
		for (const [id, group] of Object.entries(value)) {
			if (typeof id !== 'string' || !Array.isArray(group)) throw new Error('Invalid key bind map.');
			map[id] = [];
			for (const item of group) {
				this.#checkItem(item);
				if (map[id].find((v) => equalsSet(v, item))) continue;
				map[id].push(new Set(item as any));
			}
		}
		this.#map = map;
	}
	set(id: string, group: KeyBindGroup): void {
		if (typeof id !== 'string') return;
		if (!Array.isArray(group)) throw new Error('Invalid key bind group.');
		const newGroup: KeyBindGroup = [];
		for (const item of group) {
			this.#checkItem(item);
			if (newGroup.find((v) => equalsSet(v, item))) continue;
			newGroup.push(new Set(item as any));
		}
		this.#map[id] = newGroup;
	}
	add(id: string, item: KeyBindItem): boolean {
		if (typeof id !== 'string') return false;
		this.#checkItem(item);
		if (this.#map[id]?.find((v) => equalsSet(v, item))) return false;
		if (!this.#map[id]) this.#map[id] = [];
		this.#map[id].push(new Set(item as any));
		return true;
	}
	rm(id: string, item: KeyBindItem): boolean {
		if (typeof id !== 'string' || !this.#map[id]) return false;
		const index = this.#map[id].findIndex((v) => equalsSet(v, item));
		if (index === -1) return false;
		this.#map[id].splice(index, 1);
		return true;
	}
	delete(id: string): boolean {
		if (typeof id !== 'string') return false;
		if (!this.#map[id]) return false;
		delete this.#map[id];
		return true;
	}
	//#region Alias
	get aliasMap() {
		const result: AliasMap = {};
		for (const [id, item] of Object.entries(this.#aliasMap)) {
			result[id] = new Set(item);
		}
		return result;
	}
	set aliasMap(value: AliasMap) {
		const map: AliasMap = {};
		for (const [id, item] of Object.entries(value)) {
			if (typeof id !== 'string') throw new Error('Invalid key bind map.');
			this.#checkItem(item);
			map[id] = new Set(item);
		}
		this.#aliasMap = map;
	}
	setAlias(id: string, item: AliasItem): void {
		if (typeof id !== 'string') return;
		this.#checkItem(item);
		this.#aliasMap[id] = new Set(item);
	}
	addAlias(id: string, key: KeysAllow): boolean {
		if (typeof id !== 'string') return false;
		if (!KEYS_ALLOW.includes(key)) return false;
		if (this.#aliasMap[id]) this.#aliasMap[id].add(key);
		else this.#aliasMap[id] = new Set([key]);
		return true;
	}
	rmAlias(id: string, key: KeysAllow): boolean {
		if (typeof id !== 'string' || !this.#map[id]) return false;
		return this.#aliasMap[id].delete(key);
	}
	deleteAlias(id: string): boolean {
		if (typeof id !== 'string') return false;
		if (!this.#aliasMap[id]) return false;
		delete this.#aliasMap[id];
		return true;
	}
	isAliasActivated(id: string): boolean {
		const keys = this.#aliasMap[id];
		if (!keys) return false;
		for (const key of keys) {
			if (this.#activated.has(key)) return true;
		}
		return false;
	}
	//#region Bind
	bind(): KeyBinder | null {
		if (this[BINDING]) return null;
		this[BINDING] = true;
		return new KeyBinder();
	}
	//#region Event
	preventDefaultWebBehavior = true;
	#keyDownHandler = (event: KeyboardEvent) => {
		if (this.preventDefaultWebBehavior && DEFAULT_WEB_BEHAVIOR_RELATED_BUTTONS.has(event.code as any))
			event.preventDefault();
		if (this[BINDING]) return;
		if (event.isComposing) return;
		if (!KEYS_ALLOW.includes(event.code as any)) return;
		const alias = this.#findAlias(event.code);
		// Trigger
		this.#events.emit(
			new EventKey('trigger', {
				target: this,
				key: event.code as any,
			}),
		);
		for (const id of alias) {
			this.#events.emit(new EventKey('aliasTrigger', { target: this, key: id }));
		}
		// ShortcutTrigger
		this.#tryShortcut(true);
		if (this.#activated.has(event.code as KeysAllow)) return;
		this.#activated.add(event.code as KeysAllow);
		// Down
		this.#events.emit(
			new EventKey('down', {
				target: this,
				key: event.code as any,
			}),
		);
		for (const id of alias) {
			this.#events.emit(new EventKey('aliasDown', { target: this, key: id }));
		}
		// Shortcut
		this.#tryShortcut();
	};
	#keyUpHandler = (event: KeyboardEvent) => {
		if (this[BINDING]) return;
		if (event.isComposing) return;
		if (!KEYS_ALLOW.includes(event.code as any)) return;
		this.#activated.delete(event.code as KeysAllow);
		const alias = this.#findAlias(event.code);
		// Up
		this.#events.emit(
			new EventKey('up', {
				target: this,
				key: event.code as any,
			}),
		);
		for (const id of alias) {
			this.#events.emit(new EventKey('aliasUp', { target: this, key: id }));
		}
		// Press
		this.#events.emit(
			new EventKey('press', {
				target: this,
				key: event.code as any,
			}),
		);
		for (const id of alias) {
			this.#events.emit(new EventKey('aliasPress', { target: this, key: id }));
		}
	};
	on<Type extends keyof KeyboardEvents>(type: Type, handler: EventHandler<Type, KeyboardEvents[Type], any>): void {
		this.#events.on(type, handler);
	}
	off<Type extends keyof KeyboardEvents>(type: Type, handler: EventHandler<Type, KeyboardEvents[Type], any>): void {
		this.#events.off(type, handler);
	}
}

export const keyboard = new KeyboardManager();
