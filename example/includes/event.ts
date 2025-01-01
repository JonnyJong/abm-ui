// biome-ignore lint/correctness/noUnusedImports: <explanation>
import type * as _UI from '../../dist';

function getBox(element?: HTMLDivElement): HTMLDivElement {
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	if (!element) element = UI.$div();
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	UI.$apply(element, {
		style: {
			width: 100,
			height: 100,
			background: 'var(--text)',
		},
	});
	return element;
}

//#region Hover
function hover() {
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const box = getBox(UI.$<HTMLDivElement>('#dev-e-hover')!);
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	UI.events.hover.on(box, (event) => {
		// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
		UI.$apply(box, {
			style: {
				background: `var(--${event.hover ? 'theme' : 'text'})`,
			},
		});
	});
}

//#region Active
function active() {
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const box = getBox(UI.$<HTMLDivElement>('#dev-e-active')!);
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	UI.events.active.on(box, (event) => {
		// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
		UI.$apply(box, {
			style: {
				background: `var(--${event.active ? 'theme' : 'text'})`,
			},
		});
	});
}

//#region Slide
function slide() {
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const panel = UI.$('#dev-e-slide')!;
	const box1 = getBox();
	box1.style.position = 'absolute';
	const box2 = getBox();
	box2.style.position = 'absolute';
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const info1 = UI.$div({
		style: {
			position: 'absolute',
			fontSize: 20,
			top: 0,
			left: 0,
			color: '#888',
			pointerEvents: 'none',
		},
		html: 'X: 0<br>Y: 0',
	});
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const info2 = UI.$div({
		style: {
			position: 'absolute',
			fontSize: 20,
			bottom: 0,
			left: 0,
			color: '#888',
			pointerEvents: 'none',
		},
		html: 'X: 0<br>Y: 0',
	});
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const board = UI.$div(
		{
			style: {
				width: '100%',
				height: 300,
				background: 'var(--ui-panel-bg)',
				position: 'relative',
			},
		},
		box1,
		box2,
		info1,
		info2,
	);
	panel.append(board);
	let diffX1 = 0;
	let diffY1 = 0;
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	UI.events.slide.on(box1, (event) => {
		box1.style.background = event.state === 'end' ? 'var(--text)' : 'var(--theme)';
		if (event.state === 'start') {
			const { x, y } = box1.getBoundingClientRect();
			diffX1 = event.x - x;
			diffY1 = event.y - y;
			return;
		}
		const { width, height, x, y } = board.getBoundingClientRect();
		// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
		const finalX = UI.clamp(0, event.x - diffX1 - x, width - 100);
		// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
		const finalY = UI.clamp(0, event.y - diffY1 - y, height - 100);
		// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
		UI.$apply(box1, {
			style: {
				left: `${(finalX / width) * 100}%`,
				top: `${(finalY / height) * 100}%`,
			},
		});
		info1.innerHTML = `X: ${finalX}<br>Y: ${finalY}`;
	});
	let diffX2 = 0;
	let diffY2 = 0;
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	UI.events.slide.on(box2, (event) => {
		box2.style.background = event.state === 'end' ? 'var(--text)' : 'var(--theme)';
		if (event.state === 'start') {
			const { x, y } = box2.getBoundingClientRect();
			diffX2 = event.x - x;
			diffY2 = event.y - y;
			return;
		}
		const { width, height, x, y } = board.getBoundingClientRect();
		// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
		const finalX = UI.clamp(0, event.x - diffX2 - x, width - 100);
		// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
		const finalY = UI.clamp(0, event.y - diffY2 - y, height - 100);
		// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
		UI.$apply(box2, {
			style: {
				left: `${(finalX / width) * 100}%`,
				top: `${(finalY / height) * 100}%`,
			},
		});
		info2.innerHTML = `X: ${finalX}<br>Y: ${finalY}`;
	});
}

//#region Init
export function initTestEvents() {
	hover();
	active();
	slide();
}
