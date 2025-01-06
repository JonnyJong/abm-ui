import { range } from 'abm-utils/math';
import { sleep } from 'abm-utils/timer';
import { events, UIEventActive, UIEventSlide } from 'event';
import { EventBase, IEventBaseCreateOptions } from 'event/api/base';
import { EventHandler, Events, IEventSource } from 'event/events';
import { keyboard } from 'keyboard';
import { Navigable } from 'navigate';
import { Widget } from './base';

export interface WidgetListEvents {
	sort: IEventBaseCreateOptions<WidgetList>;
	select: IEventBaseCreateOptions<WidgetList>;
}

export interface WidgetListProp<Data = any> {
	items?: Data[];
	comparator?: WidgetListItemComparator<Data> | undefined;
	renderer?: WidgetListItemRenderer<Data> | undefined;
	itemClass?: WidgetListItemConstructor<Data> | undefined;
	sortable?: boolean;
}

const DRAG_START_TIME = 1000;
const DRAG_DECISION_OFFSET = 2;

// Rendering solution: custom elements
export abstract class WidgetListItem<Data = any> extends HTMLElement implements Navigable {
	abstract get data(): Data;
	abstract set data(value: Data);
	abstract equals(data: Data): boolean;
	viewTop = 0;
	viewBottom = 0;
	get nonNavigable() {
		return this.classList.contains('w-list-filtered');
	}
}
export interface WidgetListItemConstructor<Data = any> {
	new (...args: any[]): WidgetListItem<Data>;
	create(data: Data): WidgetListItem<Data>;
}
// Rendering solution: renderer
export type WidgetListItemComparator<Data = any> = (a: Data, b: Data) => boolean;
export type WidgetListItemRenderer<Data = any> = (data: Data, element?: HTMLElement) => HTMLElement;

//#region Widget
export class WidgetList<Data = any> extends Widget implements IEventSource<WidgetListEvents> {
	#inited = false;
	#events = new Events<WidgetListEvents>(['sort', 'select']);
	#intersectionObserver = new IntersectionObserver((entries) => {
		for (const entry of entries) {
			(entry.target as HTMLElement).style.visibility = entry.isIntersecting ? '' : 'hidden';
		}
	});
	#resizeObserver = new ResizeObserver(() => this.#updateView());
	constructor() {
		super();
		this.#resizeObserver.observe(this);
	}
	connectedCallback() {
		if (this.#inited) return;
		this.#inited = true;
	}
	//#region Content
	#comparator?: WidgetListItemComparator<Data>;
	get comparator() {
		return this.#comparator;
	}
	set comparator(value: WidgetListItemComparator<Data> | undefined) {
		if (typeof value === 'function') this.#comparator = value;
		else this.#comparator = undefined;
		if (!this.#itemClass) this.#render(this.#datas);
	}
	#renderer?: WidgetListItemRenderer<Data>;
	get renderer() {
		return this.#renderer;
	}
	set renderer(value: WidgetListItemRenderer<Data> | undefined) {
		if (typeof value === 'function') this.#renderer = value;
		else this.#renderer = undefined;
		if (!this.#itemClass) this.#render();
	}
	#itemClass?: WidgetListItemConstructor<Data>;
	get itemClass() {
		return this.#itemClass;
	}
	set itemClass(value: WidgetListItemConstructor<Data> | undefined) {
		this.#datas = this.items;
		if (typeof value !== 'function' || typeof value.create !== 'function') {
			this.#itemClass = undefined;
		} else {
			this.#itemClass = value;
		}
		this.#render();
	}
	#datas: Data[] = [];
	get items(): Data[] {
		if (this.#itemClass) {
			return ([...this.children] as WidgetListItem<Data>[]).map((item) => item.data);
		}
		return [...this.#datas];
	}
	set items(value: Data[]) {
		const datas = [...value];
		this.#render(datas);
		this.#datas = datas;
	}
	#renderClass(datas: Data[], itemClass: WidgetListItemConstructor<Data>) {
		const items = [...this.children] as WidgetListItem<Data>[];
		this.replaceChildren(
			...datas.map((data) => {
				const item = items.find((item) => item.equals(data));
				if (item) item.data = data;
				else return this.#hook(itemClass.create(data));
				return item;
			}),
		);
	}
	#renderClassForce(itemClass: WidgetListItemConstructor<Data>) {
		this.replaceChildren(...this.#datas.map((data) => this.#hook(itemClass.create(data))));
	}
	#renderFn(datas: Data[], comparator: WidgetListItemComparator<Data>, renderer: WidgetListItemRenderer<Data>) {
		const items = [...this.children] as HTMLElement[];
		this.replaceChildren(
			...datas.map((data) => {
				const index = this.#datas.findIndex((a) => comparator(a, data));
				const element = renderer(data, index === -1 ? undefined : items[index]);
				if (index === -1) this.#hook(element);
				return element;
			}),
		);
	}
	#renderFnForce(renderer: WidgetListItemRenderer<Data>) {
		this.replaceChildren(...this.#datas.map((data) => this.#hook(renderer(data))));
	}
	#hook(target: HTMLElement): HTMLElement {
		events.active.on(target, this.#activeHandler);
		target.animate([{ opacity: '0' }, { opacity: '1' }], 300);
		return target;
	}
	#render(datas?: Data[]) {
		if (this.#itemClass) {
			if (datas) this.#renderClass(datas, this.#itemClass);
			else this.#renderClassForce(this.#itemClass);
			for (const child of this.children) {
				this.#intersectionObserver.observe(child);
			}
			this.#updateView();
			return;
		}
		if (!this.#renderer) return;
		if (this.#comparator && datas) this.#renderFn(datas, this.#comparator, this.#renderer);
		else this.#renderFnForce(this.#renderer);
		for (const child of this.children) {
			this.#intersectionObserver.observe(child);
		}
		this.#updateView();
	}
	//#region View
	async #updateView() {
		await sleep(0);
		const { paddingTop, paddingBottom } = getComputedStyle(this);
		let offset = parseFloat(paddingTop);
		for (const child of this.children) {
			if (child.classList.contains('w-list-filtered')) continue;
			const { height, top, bottom } = child.getBoundingClientRect();
			if (!child.classList.contains('w-list-draing')) {
				(child as HTMLElement).style.top = `${offset}px`;
				if (top > window.innerHeight || bottom < 0) (child as HTMLElement).style.visibility = 'hidden';
			}
			(child as WidgetListItem).viewTop = offset;
			offset += height;
			(child as WidgetListItem).viewBottom = offset;
		}
		offset += parseFloat(paddingBottom);
		this.style.height = `${offset}px`;
	}
	//#region Select
	get selected() {
		if (this.#itemClass) {
			return ([...this.children] as WidgetListItem[])
				.filter((e) => e.classList.contains('w-list-selected'))
				.map((e) => e.data);
		}
		const selected: Data[] = [];
		[...this.children].forEach((e, i) => {
			if (!e.classList.contains('w-list-selected')) return;
			selected.push(this.#datas[i]);
		});
		return selected;
	}
	#selectType: null | 'single' | 'multi' = null;
	get selectType() {
		return this.#selectType;
	}
	set selectType(value: null | 'single' | 'multi') {
		this.#selectType = value;
	}
	#prevSelect: WeakRef<HTMLElement> | null = null;
	#selectHandler(target: HTMLElement) {
		const childern = [...this.children];
		if (!this.#selectType) return;
		if (this.#selectType === 'single') {
			for (const child of childern) {
				child.classList.toggle('w-list-selected', child === target);
			}
			this.#prevSelect = new WeakRef(target);
			return;
		}
		if (this.#selectType !== 'multi') return;
		const multi = keyboard.isAliasActivated('ui.selectMulti');
		const range = keyboard.isAliasActivated('ui.selectRange');
		if (range) {
			const a = this.#prevSelect?.deref();
			if (!a) {
				this.#prevSelect = new WeakRef(target);
				target.classList.toggle('w-list-selected');
				return;
			}
			if (!multi) {
				for (const child of childern) {
					child.classList.remove('w-list-selected');
				}
			}
			let nowFrom = childern.indexOf(a);
			let nowTo = childern.indexOf(target);
			const add = !target.classList.contains('w-list-selected');
			if (nowFrom > nowTo) [nowFrom, nowTo] = [nowTo, nowFrom];
			for (const element of childern.slice(nowFrom, nowTo + 1)) {
				element.classList.toggle('w-list-selected', add);
			}
			return;
		}
		this.#prevSelect = new WeakRef(target);
		if (multi) {
			target.classList.toggle('w-list-selected');
			return;
		}
		for (const child of this.children) {
			child.classList.toggle('w-list-selected', child === target);
		}
	}
	//#region Filter
	/**
	 * @param pattern
	 * - `true`: Hide all
	 * - `false`,`null`,`undefined`: Show all
	 * - `number[]`: Display only subscripts that appear in pattern
	 * - `((data: Data)=>boolean)`: Return true to show, false to hide
	 */
	filter(pattern: boolean | number[] | ((data: Data) => boolean) | null | undefined) {
		if (!pattern) {
			for (const child of this.children) {
				child.classList.remove('w-list-filtered');
			}
			this.#updateView();
			return;
		}
		if (pattern === true) {
			for (const child of this.children) {
				child.classList.add('w-list-filtered');
			}
			this.#updateView();
			return;
		}
		if (Array.isArray(pattern)) {
			for (const i of range(this.children.length)) {
				this.children[i].classList.toggle('w-list-filtered', !pattern.includes(i));
			}
			this.#updateView();
			return;
		}
		if (typeof pattern !== 'function') return;
		const data = this.items;
		for (const i of range(this.children.length)) {
			this.children[i].classList.toggle('w-list-filtered', !pattern(data[i]));
		}
		this.#updateView();
	}
	//#region Sort
	get sortable() {
		return this.hasAttribute('sortable');
	}
	set sortable(value: boolean) {
		this.toggleAttribute('sortable', value);
	}
	#dragTimer: number | null = null;
	#dragTarget: HTMLElement | null = null;
	#dragOffset = NaN;
	#activeHandler = (event: UIEventActive) => {
		// Draging check
		if (this.#dragTarget) return;
		if (!event.active) {
			this.#dragCancel();
			if (event.cancel) return;
			// Click
			this.#selectHandler(event.target);
			return;
		}
		// Drag start
		if (this.#dragTimer !== null) return;
		this.#dragTimer = setTimeout(() => {
			this.#dragTarget = event.target;
			this.#dragTarget.classList.add('w-list-draing');
			events.slide.on(this, this.#slideHandler);
			events.slide.start(this, event.pointerId);
			this.#dragTimer = null;
			events.active.cancel(this.#dragTarget);
		}, DRAG_START_TIME);
	};
	#dragCancel() {
		if (this.#dragTimer === null) return;
		clearTimeout(this.#dragTimer);
		this.#dragTimer = null;
	}
	#getCompareTarget(way: 'previousElementSibling' | 'nextElementSibling', target = this.#dragTarget) {
		let current = target?.[way];
		while (current?.classList.contains('w-list-filtered')) {
			current = current = target?.[way];
		}
		if (!current) return null;
		return current as WidgetListItem;
	}
	#slideHandler = (event: UIEventSlide): any => {
		if (!this.#dragTarget) {
			events.slide.off(this, this.#slideHandler);
			return;
		}
		// Drag start
		if (isNaN(this.#dragOffset)) {
			this.#dragOffset = event.y - this.#dragTarget.getBoundingClientRect().top;
			return;
		}
		// Drag move
		const offset = event.y - this.#dragOffset - this.getBoundingClientRect().top;
		const center = this.#dragTarget.getBoundingClientRect().height / 2 + offset;
		this.#dragTarget.style.top = `${offset}px`;
		const prev = this.#getCompareTarget('previousElementSibling');
		const next = this.#getCompareTarget('nextElementSibling');
		if (prev && center <= (prev as WidgetListItem).viewBottom - DRAG_DECISION_OFFSET) {
			this.#dragTarget.after(prev);
		} else if (next && center >= (next as WidgetListItem).viewTop + DRAG_DECISION_OFFSET) {
			this.#dragTarget.before(next);
		}
		if (event.state !== 'end') return this.#updateView();
		// Drag end
		events.slide.off(this, this.#slideHandler);
		this.#dragTarget.classList.remove('w-list-draing');
		this.#dragTarget = null;
		this.#dragOffset = NaN;
		this.#updateView();
		this.#events.emit(new EventBase('sort', { target: this }));
	};
	sortItem(index: number, direction: 'up' | 'down'): boolean {
		const target = this.children[index] as HTMLElement;
		if (!target) return false;
		const dest = this.#getCompareTarget(direction === 'up' ? 'previousElementSibling' : 'nextElementSibling', target);
		if (!dest) return false;
		target[direction === 'up' ? 'after' : 'before'](dest);
		this.#updateView();
		return true;
	}
	//#region Event
	on<Type extends keyof WidgetListEvents>(type: Type, handler: EventHandler<Type, WidgetListEvents[Type], any>): void {
		this.#events.on(type, handler);
	}
	off<Type extends keyof WidgetListEvents>(type: Type, handler: EventHandler<Type, WidgetListEvents[Type], any>): void {
		this.#events.off(type, handler);
	}
	//#region Clone
	cloneNode(deep?: boolean): WidgetList {
		const node = super.cloneNode(deep) as WidgetList;
		return node;
	}
	//#region Prop
	_prop?: WidgetListProp<Data>;
}

customElements.define('w-list', WidgetList);
