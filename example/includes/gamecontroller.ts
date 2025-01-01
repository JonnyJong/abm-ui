import type * as _UI from '../../dist';

function setup(id: number): HTMLElement {
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const pad = UI.GameController.getInstance(id);

	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const connecting = UI.$new<_UI.WidgetBtn>('w-btn');
	connecting.disabled = true;
	connecting.content.text = `${id} not connected`;
	pad.on('connectivity', (event) => {
		connecting.state = event.value ? 'primary' : '';
		connecting.content.text = `${id} ${event.value ? 'connected' : 'not connected'}`;
	});

	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const lsPoint = UI.$div({
		style: {
			position: 'absolute',
			width: 3,
			height: 3,
			borderRadius: 3,
			background: 'var(--text)',
			translate: '99px 99px',
		},
	});
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const lsDirection = UI.$div({
		style: {
			position: 'absolute',
			background: 'var(--ui-panel-bg)',
			rotate: '45deg',
			width: 200,
			height: 200,
			top: -141.42,
			left: 0,
			opacity: '0',
		},
	});
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const ls = UI.$div(
		{
			style: {
				position: 'relative',
				width: 200,
				height: 200,
				borderRadius: 200,
				background: 'var(--ui-panel-bg)',
				overflow: 'hidden',
			},
		},
		lsDirection,
		lsPoint,
	);
	pad.on('ls', (event) => {
		lsPoint.style.left = `${event.x * 50}%`;
		lsPoint.style.top = `${event.y * 50}%`;
		const direction = pad.ls.direction;
		lsDirection.style.opacity = direction ? '1' : '0';
		let top = '';
		let left = '';
		switch (direction) {
			case 'up':
				top = '-141.42px';
				break;
			case 'right':
				left = '141.42px';
				break;
			case 'down':
				top = '141.42px';
				break;
			case 'left':
				left = '-141.42px';
				break;
		}
		lsDirection.style.top = top;
		lsDirection.style.left = left;
	});
	pad.on('lsb', () => {
		lsPoint.style.background = pad.lsb ? 'var(--theme)' : 'var(--text)';
	});
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const rsPoint = UI.$div({
		style: {
			position: 'absolute',
			width: 3,
			height: 3,
			borderRadius: 3,
			background: 'var(--text)',
			translate: '99px 99px',
		},
	});
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const rsDirection = UI.$div({
		style: {
			position: 'absolute',
			background: 'var(--ui-panel-bg)',
			rotate: '45deg',
			width: 200,
			height: 200,
			top: -141.42,
			left: 0,
			opacity: '0',
		},
	});
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const rs = UI.$div(
		{
			style: {
				position: 'relative',
				width: 200,
				height: 200,
				borderRadius: 200,
				background: 'var(--ui-panel-bg)',
				overflow: 'hidden',
			},
		},
		rsDirection,
		rsPoint,
	);
	pad.on('rs', (event) => {
		rsPoint.style.left = `${event.x * 50}%`;
		rsPoint.style.top = `${event.y * 50}%`;
		const direction = pad.rs.direction;
		rsDirection.style.opacity = direction ? '1' : '0';
		let top = '';
		let left = '';
		switch (direction) {
			case 'up':
				top = '-141.42px';
				break;
			case 'right':
				left = '141.42px';
				break;
			case 'down':
				top = '141.42px';
				break;
			case 'left':
				left = '-141.42px';
				break;
		}
		rsDirection.style.top = top;
		rsDirection.style.left = left;
	});
	pad.on('rsb', () => {
		rsPoint.style.background = pad.rsb ? 'var(--theme)' : 'var(--text)';
	});
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const lt = UI.$new<_UI.WidgetProgressBar>('w-progress-bar');
	lt.value = 0;
	pad.on('lt', () => {
		lt.value = pad.lt * 100;
	});
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const lb = UI.$new<_UI.WidgetBtn>('w-btn');
	lb.disabled = true;
	lb.content.text = 'LB';
	pad.on('lb', () => {
		lb.state = pad.lb ? 'primary' : '';
	});
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const left = UI.$div({ attr: { 'ui-layout': 'flow-column' } }, lt, lb, ls);
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const rt = UI.$new<_UI.WidgetProgressBar>('w-progress-bar');
	rt.value = 0;
	pad.on('rt', () => {
		rt.value = pad.rt * 100;
	});
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const rb = UI.$new<_UI.WidgetBtn>('w-btn');
	rb.disabled = true;
	rb.content.text = 'RB';
	pad.on('rb', () => {
		rb.state = pad.rb ? 'primary' : '';
	});
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const right = UI.$div({ attr: { 'ui-layout': 'flow-column' } }, rt, rb, rs);

	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const upBtn = UI.$new<_UI.WidgetBtn>('w-btn', { style: { gridArea: 'w' } });
	upBtn.disabled = true;
	upBtn.content.icon = 'ChevronUp';
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const rightBtn = UI.$new<_UI.WidgetBtn>('w-btn', { style: { gridArea: 'd' } });
	rightBtn.disabled = true;
	rightBtn.content.icon = 'ChevronRight';
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const downBtn = UI.$new<_UI.WidgetBtn>('w-btn', { style: { gridArea: 's' } });
	downBtn.disabled = true;
	downBtn.content.icon = 'ChevronDown';
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const leftBtn = UI.$new<_UI.WidgetBtn>('w-btn', { style: { gridArea: 'a' } });
	leftBtn.disabled = true;
	leftBtn.content.icon = 'ChevronLeft';
	pad.on('arrow', () => {
		upBtn.state = pad.up ? 'primary' : '';
		rightBtn.state = pad.right ? 'primary' : '';
		downBtn.state = pad.down ? 'primary' : '';
		leftBtn.state = pad.left ? 'primary' : '';
	});
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const arrows = UI.$div(upBtn, rightBtn, downBtn, leftBtn);
	arrows.style.cssText = `
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		grid-template-rows: 1fr 1fr 1fr;
		gap: 0px 0px;
		grid-auto-flow: row;
		grid-template-areas:
			". w ."
			"a . d"
			". s .";
		height: max-content`;

	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const y = UI.$new<_UI.WidgetBtn>('w-btn', { style: { gridArea: 'w' } });
	y.disabled = true;
	y.content.text = 'Y';
	pad.on('y', () => {
		y.state = pad.y ? 'primary' : '';
	});
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const b = UI.$new<_UI.WidgetBtn>('w-btn', { style: { gridArea: 'd' } });
	b.disabled = true;
	b.content.text = 'B';
	pad.on('b', () => {
		b.state = pad.b ? 'primary' : '';
	});
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const a = UI.$new<_UI.WidgetBtn>('w-btn', { style: { gridArea: 's' } });
	a.disabled = true;
	a.content.text = 'A';
	pad.on('a', () => {
		a.state = pad.a ? 'primary' : '';
	});
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const x = UI.$new<_UI.WidgetBtn>('w-btn', { style: { gridArea: 'a' } });
	x.disabled = true;
	x.content.text = 'X';
	pad.on('x', () => {
		x.state = pad.x ? 'primary' : '';
	});
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const abxy = UI.$div(a, b, x, y);
	abxy.style.cssText = `
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		grid-template-rows: 1fr 1fr 1fr;
		gap: 0px 0px;
		grid-auto-flow: row;
		grid-template-areas:
			". w ."
			"a . d"
			". s .";
		height: max-content`;

	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const home = UI.$new<_UI.WidgetBtn>('w-btn');
	home.content.text = 'Home';
	home.disabled = true;
	pad.on('home', () => {
		home.state = pad.home ? 'primary' : '';
	});
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const start = UI.$new<_UI.WidgetBtn>('w-btn');
	start.content.text = 'Start';
	start.disabled = true;
	pad.on('start', () => {
		start.state = pad.start ? 'primary' : '';
	});
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const back = UI.$new<_UI.WidgetBtn>('w-btn');
	back.content.text = 'Back';
	back.disabled = true;
	pad.on('back', () => {
		back.state = pad.back ? 'primary' : '';
	});
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const other = UI.$div({ attr: { 'ui-layout': 'flow-column' } }, home, start, back);

	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const switchs = UI.$div({ attr: { 'ui-layout': 'flow' } }, left, right, arrows, abxy, other);

	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const panel = UI.$div(connecting, switchs);

	return panel;
}

export function initGameController() {
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const panel = UI.$('#dev-ui-gamepad')!;
	panel.append(...[0, 1, 2, 3].map(setup));
}
