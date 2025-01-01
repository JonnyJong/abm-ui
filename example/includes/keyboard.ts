import type * as _UI from '../../dist';

function bind(): Promise<Set<_UI.KeysAllow> | null> {
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const binder = UI.keyboard.bind();
	if (!binder) return new Promise(() => null);
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const info = UI.$div();
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const dialog = new UI.Dialog({
		title: 'Press Key to Bind',
		content: info,
		actions: [],
	});
	dialog.open();
	binder.on('update', () => {
		info.textContent = [...binder.keys].join(' ');
	});
	return new Promise((resolve) => {
		binder.on('done', () => {
			dialog.close();
			resolve(binder.keys);
		});
	});
}

function refreshPanel(panel: HTMLElement) {
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const input = UI.$new<_UI.WidgetText>('w-text');
	input.placeholder = 'ID';
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const btn = UI.$new<_UI.WidgetBtn>('w-btn');
	btn.content.text = 'Add';
	btn.on('active', async () => {
		if (input.value.length === 0) return;
		const keys = await bind();
		if (!keys) return;
		// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
		UI.keyboard.add(input.value, keys);
		refreshPanel(panel);
	});

	panel.replaceChildren(
		// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
		...Object.entries(UI.keyboard.bindMap).map(([id, group]) => {
			// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
			return UI.$new(
				'tr',
				// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
				UI.$new('td', { data: { id } }, id),
				// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
				UI.$new(
					'td',
					...group.map((item) => {
						// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
						const btn = UI.$new<_UI.WidgetBtn>('w-btn', { style: { display: 'inline-block' } });
						btn.content.text = [...item].join(' ');
						btn.on('active', async () => {
							// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
							const result = await UI.Dialog.confirm({
								title: `Unbind key "${[...item].join(' ')}" ?`,
								content: '',
							});
							if (!result) return;
							// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
							UI.keyboard.rm(id, item);
							refreshPanel(panel);
						});
						return btn;
					}),
				),
				// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
				UI.$new(
					'td',
					...(() => {
						// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
						const add = UI.$new<_UI.WidgetBtn>('w-btn', { style: { display: 'inline-block' } });
						add.content.text = 'Add';
						add.on('active', async () => {
							const keys = await bind();
							if (!keys) return;
							// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
							UI.keyboard.add(id, keys);
							refreshPanel(panel);
						});
						// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
						const set = UI.$new<_UI.WidgetBtn>('w-btn', { style: { display: 'inline-block' } });
						set.content.text = 'Set';
						set.on('active', async () => {
							const keys = await bind();
							if (!keys) return;
							// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
							UI.keyboard.set(id, [keys]);
							refreshPanel(panel);
						});
						// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
						const del = UI.$new<_UI.WidgetBtn>('w-btn', { style: { display: 'inline-block' } });
						del.content.text = 'Delete';
						del.on('active', async () => {
							// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
							const result = await UI.Dialog.confirm({
								title: `Delete bind group "${id}" ?`,
								content: '',
							});
							if (!result) return;
							// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
							UI.keyboard.delete(id);
							refreshPanel(panel);
						});
						return [add, set, del];
					})(),
				),
			);
		}),
		// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
		UI.$new(
			'tr',
			// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
			UI.$new('td', input),
			// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
			UI.$new('td'),
			// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
			UI.$new('td', btn),
		),
	);
}

export function initKeyboard() {
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	const panel = UI.$('#dev-ui-keyboard')!;
	refreshPanel(panel);
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	UI.keyboard.on('shortcut', (event) => {
		const tr = panel.querySelector<HTMLElement>(`[data-id="${event.key}"]`);
		if (!tr) return;
		tr.style.background = 'var(--theme)';
		setTimeout(() => {
			tr.style.background = '';
		}, 100);
	});
}
