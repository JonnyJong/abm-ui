import { EventBase, IEventBaseCreateOptions } from 'event/api/base';
import { EventValue, IEventValueCreateOptions } from 'event/api/value';
import { EventHandler, Events, IEventSource } from 'event/events';
import { GameController } from 'gamecontroller';
import { KeyboardEvents, keyboard } from 'keyboard';
import { $apply, $div } from 'utils/dom';
import { run } from 'utils/function';
import { AnimationFrameController, RepeatingTriggerController } from 'utils/timer';
import { Direction4, Vec2, Vector2 } from 'utils/vector';

export type NavigateCallbackArgs = [{ direction?: Direction4; active?: boolean; cancel?: boolean }];

export interface Navigable extends HTMLElement {
	nonNavigable?: boolean;
	navCallback?: (...args: NavigateCallbackArgs) => any;
	navParent?: Navigable;
	navChildern?: Navigable[];
}

type NavFilter = (from: Vec2, to: DOMRect) => boolean;
type Rect = {
	top: number;
	left: number;
	height: number;
	width: number;
};
type StackItem = [root: Navigable, current: WeakRef<Navigable> | null, lock: WeakRef<Navigable> | null];

const KEY_ALIAS_DIRECTION_MAP = {
	'ui.up': 'up',
	'ui.right': 'right',
	'ui.down': 'down',
	'ui.left': 'left',
};
const GAME_CONTROLLER_SWITCH_DEAD_ZONE = 0.3;
const SCROLL_OPTIONS: ScrollIntoViewOptions = {
	block: 'center',
	inline: 'center',
	behavior: 'smooth',
};

const NAV_FILTERS: {
	[key in Direction4]: NavFilter;
} = {
	up: (from, to) => to.bottom < from[1],
	right: (from, to) => from[0] < to.left,
	down: (from, to) => from[1] < to.top,
	left: (from, to) => to.right < from[0],
};

function getDistance(rectA: Rect, rectB: Rect): number {
	const { width: widthA, height: heightA, top: topA, left: leftA } = rectA;
	const { width: widthB, height: heightB, top: topB, left: leftB } = rectB;
	const xA = leftA + widthA / 2;
	const yA = topA + heightA / 2;
	const xB = leftB + widthB / 2;
	const yB = topB + heightB / 2;

	const vec = new Vector2(Math.abs(xB - xA), Math.abs(yB - yA));
	const length = vec.length;

	if (vec.x === 0) {
		return vec.y - heightA / 2 - heightB / 2;
	}
	if (vec.y === 0) {
		return vec.x - widthA / 2 - widthB / 2;
	}

	const sin = vec.y / length;
	const cos = vec.x / length;
	return length - Math.min(heightA / 2 / sin, widthA / 2 / cos) - Math.min(heightB / 2 / sin, widthB / 2 / cos);
}

function isInside([x, y]: Vec2, { top, bottom, left, right }: DOMRect) {
	return x >= left && x <= right && y >= top && y <= bottom;
}

function NearestFinder(begin: Rect, direction: Direction4) {
	const position: Vec2 = [begin.left + begin.width / 2, begin.top + begin.height / 2];
	let distance = Infinity;
	return function next(nextRect: DOMRect): boolean {
		if (nextRect.x === 0 && nextRect.y === 0 && nextRect.width === 0 && nextRect.height === 0) return false;
		const nextDistance = getDistance(begin, nextRect);
		if (nextDistance >= distance) return false;
		if (!(NAV_FILTERS[direction](position, nextRect) || isInside(position, nextRect))) return false;
		distance = nextDistance;
		return true;
	};
}

function NavItemFilter(from: any) {
	const SAME = (item: Element) => item === from;
	const NAVIGABLE = (item: Element) =>
		!(item as Navigable).nonNavigable && (item.clientHeight !== 0 || item.clientWidth !== 0);
	const IS_NAV_ITEM = (item: Element) => item.hasAttribute('ui-nav');
	// Group Check
	const IS_GROUP_DIRECT = (item: Element) => (item as Navigable).navChildern?.some(NAVIGABLE);
	const IS_GROUP_A = (item: Element) => [...item.querySelectorAll('[ui-nav]')].some(NAVIGABLE);
	const IS_GROUP_B = (item: Element) =>
		[...item.querySelectorAll<Navigable>('[ui-nav-group]')].some((group) => group.navChildern?.some(NAVIGABLE));

	return function filter(item: Element) {
		if (SAME(item)) return false;
		if (!NAVIGABLE(item)) return false;
		if (IS_NAV_ITEM(item)) return true;

		if (IS_GROUP_DIRECT(item)) return true;
		if (IS_GROUP_A(item)) return true;
		if (IS_GROUP_B(item)) return true;

		return false;
	};
}

function searchInwards(root: Navigable, direction: Direction4, begin: Rect | HTMLElement): Navigable | null {
	const children = [...(root.navChildern ?? root.children)].filter(NavItemFilter(begin));
	if (children.length === 0) return null;

	const rect = begin instanceof HTMLElement ? begin.getBoundingClientRect() : begin;
	const finder = NearestFinder(rect, direction);
	let item: Navigable | null = null;
	for (const child of children) {
		if (child === begin) continue;
		if (finder(child.getBoundingClientRect())) item = child as Navigable;
	}

	if (!item) return null;
	if (item.hasAttribute('ui-nav')) return item;
	return searchInwards(item, direction, rect);
}

function searchOutwards(border: HTMLElement, direction: Direction4, rect: Rect, from: Navigable) {
	const root = from.navParent ?? (from.parentNode as Navigable);
	if (!(root && checkAvailability(root, border))) return null;

	const children = [...(root.navChildern ?? root.children)].filter(NavItemFilter(from));
	if (children.length === 0) return searchOutwards(border, direction, rect, root);

	const finder = NearestFinder(rect, direction);
	let item: Navigable | null = null;
	for (const child of children) {
		if (finder(child.getBoundingClientRect())) item = child as Navigable;
	}

	if (!item) return searchOutwards(border, direction, rect, root);
	if (item.hasAttribute('ui-nav')) return item;
	return searchInwards(item, direction, rect);
}

function checkAvailability(target?: Navigable | null, perferParent: HTMLElement = document.body): boolean {
	while (target) {
		if (perferParent.contains(target)) return true;
		target = ((target as unknown as ShadowRoot)?.host ?? (target?.getRootNode() as ShadowRoot)?.host) as Navigable;
	}
	return false;
}

//#region Navigate
export interface NavigateEvents {
	nav: IEventBaseCreateOptions<Navigate>;
	active: IEventValueCreateOptions<Navigate, boolean>;
	cancel: IEventValueCreateOptions<Navigate, boolean>;
}

class Navigate implements IEventSource<NavigateEvents> {
	#events = new Events<NavigateEvents>(['nav', 'active', 'cancel']);
	#indicator = $div({ class: 'ui-nav' });
	#controller = GameController.getInstance(0);
	#position: Vec2 = [window.innerWidth / 2, window.innerHeight / 2];
	constructor() {
		document.addEventListener('DOMContentLoaded', () => document.body.append(this.#indicator));
		keyboard.on('aliasTrigger', this.#aliasTriggerHandler);
		this.#controller.on('ls', this.#lsHandler);
		this.#controller.on('arrow', this.#arrowHandler);
		window.addEventListener('wheel', this.#stopNavHandler);
		window.addEventListener('pointermove', this.#stopNavHandler);
		keyboard.on('aliasDown', this.#aliasDownHandler);
		keyboard.on('aliasUp', this.#aliasUpHandler);
		this.#controller.on('a', this.#aHandler);
		this.#controller.on('b', this.#bHandler);
	}
	//#region Nav
	/**
	 * 导航到下一元素
	 * Navigate to the next element
	 */
	nav(direction: Direction4) {
		const root = this.#root;
		let current = this.#current;
		if (this.locking) {
			run<NavigateCallbackArgs>(current!.navCallback!, {
				direction,
			});
			return;
		}
		if (!checkAvailability(current, root)) current = null;

		let next = searchInwards(
			current?.navParent ?? (current?.parentNode as HTMLElement) ?? root,
			direction,
			current ?? { left: this.#position[0], top: this.#position[1], width: 0, height: 0 },
		);
		if (!next && current) next = searchOutwards(root, direction, current.getBoundingClientRect(), current);
		if (!next) return;

		this.#current = next;
		current = next;
		current.scrollIntoView(SCROLL_OPTIONS);
		this.#frameController.start();
		this.#events.emit(new EventBase('nav', { target: this }));
	}
	//#region View
	#update = () => {
		const root = this.#root;
		let current = this.#current;
		if (!checkAvailability(current, root)) current = null;
		const lock = this.#lock;
		if (lock) current = lock;

		if (!current) {
			this.#frameController.stop();
			this.#indicator.style.opacity = '0';
			document.body.style.cursor = '';
			this.#events.emit(new EventBase('nav', { target: this }));
			return;
		}

		document.body.style.cursor = 'none';
		const { top, left, width, height } = current.getBoundingClientRect();
		this.#position = [left + width / 2, top + height / 2];
		$apply(this.#indicator, {
			style: { top, left, width, height, '--borderRadius': getComputedStyle(current).borderRadius },
		});
		this.#indicator.style.opacity = '1';
	};
	#frameController = new AnimationFrameController(this.#update);
	//#region Event
	#aliasTriggerHandler = (event: KeyboardEvents['aliasTrigger']) => {
		const direction = (KEY_ALIAS_DIRECTION_MAP as any)[event.key];
		if (!direction) return;
		this.nav(direction);
	};
	#upController = new RepeatingTriggerController(() => this.nav('up'));
	#rightController = new RepeatingTriggerController(() => this.nav('right'));
	#downController = new RepeatingTriggerController(() => this.nav('down'));
	#leftController = new RepeatingTriggerController(() => this.nav('left'));
	#lsHandler = () => {
		const vec = this.#controller.ls;
		let direction = vec.direction;
		if (vec.length < GAME_CONTROLLER_SWITCH_DEAD_ZONE) direction = undefined;
		this.#upController[direction === 'up' ? 'start' : 'stop']();
		this.#rightController[direction === 'right' ? 'start' : 'stop']();
		this.#downController[direction === 'down' ? 'start' : 'stop']();
		this.#leftController[direction === 'left' ? 'start' : 'stop']();
	};
	#arrowHandler = () => {
		this.#upController[this.#controller.up ? 'start' : 'stop']();
		this.#rightController[this.#controller.right ? 'start' : 'stop']();
		this.#downController[this.#controller.down ? 'start' : 'stop']();
		this.#leftController[this.#controller.left ? 'start' : 'stop']();
	};
	#stopNavHandler = (event: MouseEvent) => {
		const current = this.#current;
		if (current && this.locking) {
			run<NavigateCallbackArgs>(current!.navCallback!, {
				active: false,
			});
		}

		document.body.style.cursor = '';
		this.#indicator.style.opacity = '0';
		this.#position = [event.x, event.y];
		this.#indicator.style.left = `${event.x}px`;
		this.#indicator.style.top = `${event.y}px`;
		this.#indicator.style.width = '0px';
		this.#indicator.style.height = '0px';
		if (current === null) return;
		this.#frameController.stop();
		this.#current = null;
		this.#events.emit(new EventBase('nav', { target: this }));
	};
	#aliasDownHandler = (event: KeyboardEvents['aliasDown']) => {
		const current = this.#current;
		let type: 'active' | 'cancel' | '' = '';
		if (!current) return;
		if (event.key === 'ui.confirm') type = 'active';
		if (event.key === 'ui.cancel') type = 'cancel';
		if (!type) return;
		run<NavigateCallbackArgs>(current!.navCallback!, {
			[type]: true,
		});
		if (this.locking) return;
		this.#events.emit(new EventValue(type, { target: this, value: true }));
	};
	#aliasUpHandler = (event: KeyboardEvents['aliasUp']) => {
		const current = this.#current;
		let type: 'active' | 'cancel' | '' = '';
		if (!current) return;
		if (event.key === 'ui.confirm') type = 'active';
		if (event.key === 'ui.cancel') type = 'cancel';
		if (!type) return;
		run<NavigateCallbackArgs>(current!.navCallback!, {
			[type]: false,
		});
		if (this.locking) return;
		this.#events.emit(new EventValue(type, { target: this, value: false }));
	};
	#aHandler = () => {
		const current = this.#current;
		if (!current) return;
		run<NavigateCallbackArgs>(current!.navCallback!, {
			active: this.#controller.a,
		});
		if (this.locking) return;
		this.#events.emit(new EventValue('active', { target: this, value: this.#controller.a }));
	};
	#bHandler = () => {
		const current = this.#current;
		if (!current) return;
		run<NavigateCallbackArgs>(current!.navCallback!, {
			cancel: this.#controller.b,
		});
		if (this.locking) return;
		this.#events.emit(new EventValue('cancel', { target: this, value: this.#controller.b }));
	};
	on<Type extends keyof NavigateEvents>(type: Type, handler: EventHandler<Type, NavigateEvents[Type], any>): void {
		this.#events.on(type, handler);
	}
	off<Type extends keyof NavigateEvents>(type: Type, handler: EventHandler<Type, NavigateEvents[Type], any>): void {
		this.#events.off(type, handler);
	}
	//#region Nav Stack
	/**
	 * 导航栈 Nav Stack
	 * @description
	 * 导航范围仅限栈顶元素的子元素
	 * The navigation scope is limited to the child elements of the top element of the stack
	 */
	#stack: StackItem[] = [[document.body, null, null]];
	get #current() {
		return this.#stack.at(-1)![1]?.deref() ?? null;
	}
	set #current(value: Navigable | null) {
		const topLayer = this.#stack.at(-1)!;
		if (value === null) topLayer[1] = value;
		else topLayer[1] = new WeakRef(value);
		topLayer[2] = null;
	}
	get #root() {
		return this.#stack.at(-1)![0];
	}
	get current(): HTMLElement | null {
		return this.#current;
	}
	set current(value: HTMLElement) {
		const topLayer = this.#stack.at(-1)!;
		if (!(value instanceof HTMLElement && checkAvailability(value, topLayer[0]))) return;
		topLayer[1] = new WeakRef(value);
		topLayer[2] = null;
	}
	get #lock() {
		const topLayer = this.#stack.at(-1)!;
		if (!topLayer[1]?.deref()) return null;
		return topLayer[2]?.deref() ?? null;
	}
	lock(value: HTMLElement | null) {
		if (!(value instanceof HTMLElement) && value !== null) return;
		this.#stack.at(-1)![2] = value ? new WeakRef(value) : value;
	}
	get locking() {
		return !!this.#lock;
	}
	addLayer(root: Navigable, current?: Navigable) {
		if (!((root instanceof HTMLElement || (root as any) instanceof ShadowRoot) && checkAvailability(root))) return;
		const index = this.#stack.findIndex(([r]) => r === root);
		const currentAvailable = current instanceof HTMLElement && root.contains(current);
		if (index === -1) {
			this.#stack.push([root, currentAvailable ? new WeakRef(current) : null, null]);
		} else {
			const [layer] = this.#stack.splice(index, 1);
			this.#stack.push(layer);
			if (currentAvailable) layer[1] = new WeakRef(current);
		}
	}
	rmLayer(root: Navigable): boolean {
		if (!((root instanceof HTMLElement || (root as any) instanceof ShadowRoot) && checkAvailability(root))) return false;
		const index = this.#stack.findIndex(([r]) => r === root);
		if (index === -1) return false;
		this.#stack.splice(index, 1);
		return true;
	}
}

export const navigate = new Navigate();
