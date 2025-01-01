//#region Declaration
import type * as _UI from '../dist';
import { initTestEvents } from './includes/event';
import { initGameController } from './includes/gamecontroller';
import { initKeyboard } from './includes/keyboard';
declare global {
	interface Window {
		UI: typeof _UI;
	}
	const UI: typeof _UI;
}

//#region Main
const TEST_DICT: Record<string, _UI.UIDefaultDict> & Record<string, Record<string, string>> = {
	zh: {
		'ui.confirm': '确定',
		'ui.cancel': '取消',
		'ui.ok': '好',
		'ui.color_picker': '颜色选择器',
		'ui.alpha': '不透明度',
		'ui.red': '红',
		'ui.green': '绿',
		'ui.blue': '蓝',
		'ui.hue': '色相',
		'ui.saturation': '饱和度',
		'ui.lightness': '亮度',
		'dev.properties': '属性',
		'dev.events': '事件',
		'dev.btn': '按钮',
	},
	en: {
		'ui.confirm': 'Confirm',
		'ui.cancel': 'Cancel',
		'ui.ok': 'OK',
		'ui.color_picker': 'Color Picker',
		'ui.alpha': 'Alpha',
		'ui.red': 'Red',
		'ui.green': 'Green',
		'ui.blue': 'Blue',
		'ui.hue': 'Hue',
		'ui.saturation': 'Saturation',
		'ui.lightness': 'Lightness',
		'dev.properties': 'Properties',
		'dev.events': 'Events',
		'dev.btn': 'Button',
	},
};
(function init() {
	// Global CSS
	UI.configs.globalCSS = '../dist/style.css';
	// Locale
	const perferLanguage = UI.configs.locale.perfers[0].split('-')[0];
	UI.configs.locale.setLocaleDict('', {
		get(key, _options) {
			let dict = TEST_DICT.en;
			if (perferLanguage in TEST_DICT) dict = TEST_DICT[perferLanguage];
			if (key in dict) return (dict as any)[key];
			return key;
		},
	});
	// Icon
	UI.configs.icons.setIconPack('icon', './assets/icon.css');
	UI.configs.icons.setIconPack('icon-extra', './assets/icon-extra.css');
	UI.configs.icons.defaults.selectExpand = 'icon-extra:ChevronUpDown';
	UI.configs.icons.defaults.msgHide = 'icon:ChevronUp';
	UI.configs.icons.defaults.msgClose = 'icon:Clear';
})();

//#region Helper
function numberToChinese(num: number) {
	const chineseNumbers = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
	const chineseUnits = ['', '十', '百', '千', '万', '十万', '百万', '千万', '亿', '十亿', '百亿', '千亿'];
	if (num === 0) {
		return chineseNumbers[0];
	}
	const numStr = num.toString();
	let result = '';
	let unitIndex = 0;
	for (let i = numStr.length - 1; i >= 0; i--) {
		const digit = parseInt(numStr[i]);
		if (digit !== 0) {
			result = chineseNumbers[digit] + chineseUnits[unitIndex] + result;
		} else if (result.charAt(0) !== chineseNumbers[0] && (unitIndex === 1 || unitIndex === 2 || unitIndex === 3)) {
			result = chineseNumbers[0] + result;
		}
		unitIndex++;
	}
	return result;
}

function setValue(obj: any, key: string, value: any) {
	const keys = key.split('.');
	for (const key of keys.slice(0, keys.length - 1)) {
		obj = obj[key];
	}
	obj[keys.at(-1)!] = value;
}

function getValue(obj: any, key: string) {
	for (const k of key.split('.')) {
		obj = obj[k];
	}
	return obj;
}

type ValueItem =
	| {
			key: string;
			type: 'string' | 'number' | 'boolean' | 'color' | 'strArr';
			init?: string | number | boolean | string[];
			description?: string;
			min?: number;
			max?: number;
			default?: number;
			onEvent?: string;
	  }
	| {
			key: string;
			type: 'enum';
			init: string;
			values: string[];
			description?: string;
	  };

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
function createValuePanel(target: HTMLElement & Object, items: ValueItem[]) {
	const inputs = [];
	const others = [];
	for (const item of items) {
		switch (item.type) {
			case 'string': {
				const strInput = UI.$new<_UI.WidgetText>('w-text');
				if (typeof item.init === 'string') strInput.value = item.init;
				strInput.placeholder = item.description ?? item.key;
				strInput.on('input', () => setValue(target, item.key, strInput.value));
				if (item.onEvent)
					(target as any).on(item.onEvent, () => {
						strInput.value = getValue(target, item.key);
					});
				inputs.push(strInput);
				continue;
			}
			case 'number': {
				const numInput = UI.$new<_UI.WidgetNumber>('w-number');
				if (typeof item.init === 'number') numInput.value = item.init;
				numInput.placeholder = item.description ?? item.key;
				if (typeof item.min === 'number') numInput.min = item.min;
				if (typeof item.max === 'number') numInput.max = item.max;
				if (typeof item.default === 'number') numInput.default = item.default;
				numInput.on('input', () => setValue(target, item.key, numInput.value));
				inputs.push(numInput);
				continue;
			}
			case 'boolean': {
				const boolBtn = UI.$new<_UI.WidgetBtn>('w-btn');
				boolBtn.content.key = item.description ?? item.key;
				boolBtn.state = 'toggle';
				if (typeof item.init === 'boolean') boolBtn.checked = item.init;
				boolBtn.on('active', () => setValue(target, item.key, boolBtn.checked));
				others.push(boolBtn);
				continue;
			}
			case 'color': {
				const colorInput = UI.$new<_UI.WidgetColor>('w-color');
				if (typeof item.init === 'string') colorInput.value = item.init;
				colorInput.on('change', () => setValue(target, item.key, colorInput.value));
				others.push(colorInput);
				continue;
			}
			case 'enum': {
				const enumInput = UI.$new<_UI.WidgetSelect>('w-select');
				enumInput.options = item.values.map((v) => {
					return { value: v, label: v };
				});
				if (item.init !== undefined) enumInput.value = item.init;
				enumInput.on('change', () => setValue(target, item.key, enumInput.value));
				others.push(enumInput);
				continue;
			}
			case 'strArr': {
				const strArrInput = UI.$new<_UI.WidgetText>('w-text');
				if (Array.isArray(item.init)) strArrInput.value = item.init.join(', ');
				strArrInput.placeholder = item.description ?? item.key;
				strArrInput.on('input', () => setValue(target, item.key, strArrInput.value.split(', ')));
				inputs.push(strArrInput);
				continue;
			}
		}
	}
	const panel = UI.$div({
		attr: {
			'ui-layout': 'flow-column',
			'ui-panel': 'middle',
		},
		content: [
			UI.$new('h6', {
				content: UI.$new('w-lang', { content: 'dev.properties' }),
			}),
			UI.$div({
				attr: { 'ui-layout': 'flow-column' },
				content: inputs,
			}),
			UI.$div({
				attr: { 'ui-layout': 'flow' },
				content: others,
			}),
		],
	});
	return panel;
}

function createEventPanel(target: HTMLElement & Object, events: string[]) {
	const lights = events.map((name) => {
		const light = UI.$new<_UI.WidgetBtn>('w-btn');
		light.content.text = name;
		light.state = 'toggle';
		light.disabled = true;
		(target as any).on(name, () => {
			light.checked = true;
			setTimeout(() => {
				light.checked = false;
			}, 100);
		});
		return light;
	});
	const panel = UI.$div({
		attr: {
			'ui-layout': 'flow-column',
			'ui-panel': 'middle',
		},
		content: [
			UI.$new('h6', { content: UI.$new('w-lang', { content: 'dev.events' }) }),
			UI.$div({
				attr: { 'ui-layout': 'flow' },
				content: lights,
			}),
		],
	});
	return panel;
}

//#region Widget
document.addEventListener('DOMContentLoaded', () => {
	//#region Button
	const btnPanel = UI.$('#dev-btn')!;
	const btn = UI.$new<_UI.WidgetBtn>('w-btn');
	btn.content.key = 'dev.btn';
	btnPanel.append(
		createValuePanel(btn, [
			{
				type: 'string',
				key: 'content.key',
				init: 'dev.btn',
				description: 'locale key',
			},
			{
				type: 'string',
				key: 'content.icon',
				description: 'icon eg. Home, Settings, Cancel, Delete',
			},
			{
				type: 'string',
				key: 'content.text',
				description: 'text',
			},
			{
				type: 'number',
				key: 'content.progress',
				description: 'progress',
				default: NaN,
			},
			{
				type: 'number',
				key: 'delay',
				min: 0,
				description: 'delay (default: 0ms)',
				default: 0,
			},
			{
				type: 'number',
				key: 'progress',
				min: 0,
				max: 100,
				description: 'progress (default: 100)',
				default: 100,
			},
			{
				type: 'enum',
				init: '',
				values: ['', 'primary', 'danger', 'toggle'],
				key: 'state',
			},
			{
				type: 'color',
				key: 'color',
			},
			{
				type: 'boolean',
				key: 'disabled',
			},
			{
				type: 'boolean',
				key: 'flat',
			},
			{
				type: 'boolean',
				key: 'rounded',
			},
			{
				type: 'boolean',
				key: 'checked',
			},
		]),
		createEventPanel(btn, ['active']),
		btn,
	);
	//#region Input
	const textPanel = UI.$('#dev-text')!;
	const text = UI.$new<_UI.WidgetText>('w-text');
	text.actionsLeft.items = [
		{
			id: 'search',
			content: new UI.UIContent({ icon: 'Search' }),
			disabled: true,
		},
	];
	text.actionsRight.items = [{ id: 'clear', content: new UI.UIContent({ icon: 'Clear' }), hidden: true }];
	textPanel.append(
		createValuePanel(text, [
			{
				type: 'string',
				key: 'value',
				onEvent: 'input',
				description: 'value (auto update when input emited)',
			},
			{
				type: 'string',
				key: 'placeholder',
			},
			// placeholderLocaleOptions
			{
				type: 'boolean',
				key: 'disabled',
			},
			{
				type: 'boolean',
				key: 'readOnly',
			},
			{
				type: 'boolean',
				key: 'invalid',
			},
			{
				type: 'strArr',
				key: 'autoFill.items',
			},
		]),
		createEventPanel(text, ['input', 'autofill', 'action', 'confirm']),
		text,
	);
	text.on('input', () => {
		text.actionsRight.get(0).hidden = !text.value;
	});
	text.on('action', ({ details }) => {
		if (details !== 'clear') return;
		text.value = '';
		text.actionsRight.get(0).hidden = true;
	});
	const pswPanel = UI.$('#dev-psw')!;
	const psw = UI.$new<_UI.WidgetPassword>('w-password');
	psw.actionsLeft.items = [{ id: 'psw', content: new UI.UIContent({ icon: 'VPN' }), disabled: true }];
	psw.actionsRight.items = [
		{ id: 'clear', content: new UI.UIContent({ icon: 'Clear' }), hidden: true },
		{
			id: 'show',
			content: new UI.UIContent({ icon: 'PasswordKeyHide' }),
			toggle: true,
		},
	];
	pswPanel.append(
		createValuePanel(psw, [
			{
				type: 'string',
				key: 'value',
				onEvent: 'input',
				description: 'value (auto update when input emited)',
			},
			{
				type: 'string',
				key: 'placeholder',
			},
			// placeholderLocaleOptions
			{
				type: 'boolean',
				key: 'disabled',
			},
			{
				type: 'boolean',
				key: 'readOnly',
			},
			{
				type: 'boolean',
				key: 'invalid',
			},
			{
				type: 'boolean',
				key: 'passwordVisibility',
				description: 'passwordVisibility (wont auto update)',
			},
			{
				type: 'strArr',
				key: 'autoFill.items',
			},
		]),
		createEventPanel(psw, ['input', 'autofill', 'action', 'confirm']),
		psw,
	);
	psw.on('input', () => {
		psw.actionsRight.get(0).hidden = !psw.value;
	});
	psw.on('action', ({ details }) => {
		if (details === 'clear') {
			psw.value = '';
			psw.actionsRight.get(0).hidden = true;
		}
		if (details !== 'show') return;
		psw.passwordVisibility = psw.actionsRight.get(1).checked;
	});
	const numPanel = UI.$('#dev-num')!;
	const num = UI.$new<_UI.WidgetNumber>('w-number');
	numPanel.append(
		createValuePanel(num, [
			{
				type: 'number',
				key: 'value',
				onEvent: 'input',
				description: 'value (auto update when input emited)',
			},
			{
				type: 'string',
				key: 'placeholder',
			},
			// placeholderLocaleOptions
			{
				type: 'boolean',
				key: 'disabled',
			},
			{
				type: 'boolean',
				key: 'readOnly',
			},
			{
				type: 'boolean',
				key: 'invalid',
			},
			{
				type: 'strArr',
				key: 'autoFill.items',
			},
			{
				type: 'number',
				key: 'default',
				description: 'default (NaN)',
			},
			{
				type: 'number',
				key: 'min',
			},
			{
				type: 'number',
				key: 'max',
			},
			{
				type: 'number',
				key: 'step',
			},
		]),
		createEventPanel(num, ['input', 'autofill', 'action', 'confirm']),
		num,
	);
	//#region Switch
	const switchPanel = UI.$('#dev-switch')!;
	const switchE = UI.$new<_UI.WidgetSwitch>('w-switch');
	switchPanel.append(
		createValuePanel(switchE, [
			{
				type: 'boolean',
				key: 'disabled',
			},
			{
				type: 'boolean',
				key: 'checked',
				description: 'checked (wont auto update)',
			},
		]),
		createEventPanel(switchE, ['change']),
		switchE,
	);
	//#region Select
	const selectPanel = UI.$('#dev-select')!;
	const select = UI.$new<_UI.WidgetSelect>('w-select');
	select.placeholder.text = 'Click me';
	const selectOptions: _UI.IWidgetSelectOption[] = [];
	for (const i of UI.range(120)) {
		selectOptions.push({
			value: i,
			label: numberToChinese(i),
		});
	}
	select.options = selectOptions;
	selectPanel.append(
		createValuePanel(select, [
			{
				type: 'boolean',
				key: 'disabled',
			},
		]),
		createEventPanel(select, ['change']),
		select,
	);
	//#region Dialog
	const dialogTitle = UI.$<_UI.WidgetText>('#dev-dialog[dev="title"]')!;
	const dialogIcon = UI.$<_UI.WidgetText>('#dev-dialog[dev="icon"]')!;
	const dialogContent = UI.$<_UI.WidgetText>('#dev-dialog[dev="content"]')!;
	const dialogState = UI.$<_UI.WidgetSelect<Exclude<_UI.WidgetBtnState, 'toggle'>>>('#dev-dialog[dev="state"]')!;
	const dialogDelay = UI.$<_UI.WidgetNumber>('#dev-dialog[dev="delay"]')!;
	const dialogCreate = UI.$<_UI.WidgetBtn>('#dev-dialog[dev="new"]')!;
	const dialogConfirm = UI.$<_UI.WidgetBtn>('#dev-dialog[dev="confirm"]')!;
	const dialogOk = UI.$<_UI.WidgetBtn>('#dev-dialog[dev="ok"]')!;
	dialogState.options = [
		{ value: '', label: '' },
		{ value: 'primary', label: 'primary' },
		{ value: 'danger', label: 'danger' },
	];
	dialogState.value = '';
	function getDialogOptions(): _UI.DialogCreateOptions {
		return {
			title: new UI.UIContent({
				key: dialogTitle.value,
				icon: dialogIcon.value,
			}),
			content: dialogContent.value,
			actions: [
				{
					id: 'confirm',
					content: 'ui.confirm',
					state: dialogState.value,
					delay: dialogDelay.value,
				},
				{
					id: 'cancel',
					content: 'ui.cancel',
				},
			],
		};
	}
	dialogCreate.on('active', () => {
		const dialog = new UI.Dialog(getDialogOptions());
		dialog.on('action', ({ details }) => {
			dialog.close();
			const btn = UI.$<_UI.WidgetBtn>(`#dev-dialog[dev-action="${details}"]`)!;
			btn.checked = true;
			setTimeout(() => {
				btn.checked = false;
			}, 500);
		});
		dialog.open();
	});
	dialogConfirm.on('active', async () => {
		const result = await UI.Dialog.confirm(getDialogOptions());
		const btn = UI.$<_UI.WidgetBtn>(`#dev-dialog[dev-action="${result ? 'confirm' : 'cancel'}"]`)!;
		btn.checked = true;
		setTimeout(() => {
			btn.checked = false;
		}, 500);
	});
	dialogOk.on('active', async () => {
		await UI.Dialog.ok(getDialogOptions());
		const btn = UI.$<_UI.WidgetBtn>(`#dev-dialog[dev-action="ok"]`)!;
		btn.checked = true;
		setTimeout(() => {
			btn.checked = false;
		}, 500);
	});
	//#region Progress
	const progressPanel = UI.$('#dev-progress')!;
	const progressBar = UI.$new<_UI.WidgetProgress>('w-progress-bar')!;
	const progressRing = UI.$new<_UI.WidgetProgress>('w-progress-ring')!;
	progressPanel.append(
		createValuePanel(progressBar, [
			{
				type: 'number',
				key: 'value',
				default: NaN,
			},
			{
				type: 'color',
				key: 'color',
			},
		]),
		progressBar,
		createValuePanel(progressRing, [
			{
				type: 'number',
				key: 'value',
				default: NaN,
			},
			{
				type: 'number',
				key: 'thickness',
			},
			{
				type: 'color',
				key: 'color',
			},
		]),
		progressRing,
	);
	//#region Msg
	const msgTitle = UI.$<_UI.WidgetText>('#dev-msg[dev="title"]')!;
	const msgIcon = UI.$<_UI.WidgetText>('#dev-msg[dev="icon"]')!;
	const msgContent = UI.$<_UI.WidgetText>('#dev-msg[dev="content"]')!;
	const msgDelay = UI.$<_UI.WidgetNumber>('#dev-msg[dev="delay"]')!;
	const msgAutoClose = UI.$<_UI.WidgetBtn>('#dev-msg[dev="autoClose"]')!;
	const msgNew = UI.$<_UI.WidgetBtn>('#dev-msg[dev="new"]')!;
	const msgToggle = UI.$<_UI.WidgetBtn>('#dev-msg[dev="toggle"]')!;
	msgNew.on('active', () => {
		UI.msgMgr.new({
			id: Date.now().toString(),
			title: new UI.UIContent({ icon: msgIcon.value, key: msgTitle.value }),
			content: msgContent.value,
			delay: msgDelay.value,
			autoClose: msgAutoClose.checked,
			actions: [
				{
					id: 'close',
					label: 'Normal',
				},
				{
					id: 'delay',
					label: new UI.UIContent({ text: 'Delay', icon: 'Delete' }),
					delay: 1000,
					state: 'danger',
				},
				{
					id: 'toggle',
					label: 'toggle',
					state: 'toggle',
				},
			],
		});
	});
	msgToggle.on('active', () => UI.msgMgr.toggle());
	//#region Checkbox
	const checkboxPanel = UI.$('#dev-checkbox')!;
	const checkbox = UI.$new<_UI.WidgetCheckbox>('w-checkbox');
	checkbox.append('Hello world');
	checkboxPanel.append(
		createValuePanel(checkbox, [
			{
				type: 'boolean',
				key: 'disabled',
			},
			{
				type: 'boolean',
				key: 'checked',
			},
		]),
		createEventPanel(checkbox, ['change']),
		checkbox,
	);
	//#region Slider
	const sliderPanel = UI.$('#dev-slider')!;
	const slider = UI.$new<_UI.WidgetSlider>('w-slider');
	sliderPanel.append(
		createValuePanel(slider, [
			{
				type: 'number',
				key: 'from',
			},
			{
				type: 'number',
				key: 'to',
			},
			{
				type: 'number',
				key: 'step',
			},
			{
				type: 'number',
				key: 'value',
			},
			{
				type: 'boolean',
				key: 'disabled',
			},
		]),
		createEventPanel(slider, ['change', 'input']),
		slider,
	);
	//#region Nav
	const navPanel = UI.$('#dev-nav')!;
	const nav = UI.$new<_UI.WidgetNav>('w-nav');
	navPanel.append(
		createValuePanel(nav, [
			{
				type: 'enum',
				key: 'display',
				init: 'all',
				values: ['all', 'icon', 'text'],
			},
			{
				type: 'boolean',
				key: 'disabled',
			},
			{
				type: 'boolean',
				key: 'vertical',
			},
		]),
		createEventPanel(nav, ['change']),
		nav,
	);
	nav.items = [
		{ id: 'home', content: { icon: 'Home', text: 'Home' } },
		{ id: 'mail', content: { icon: 'Mail', text: 'Mail' } },
		{ id: 'video', content: { icon: 'Video', text: 'Video' } },
	];
	nav.endItems = [{ id: 'settings', content: { icon: 'Settings', text: 'Settings' } }];
	//#region Color
	const colorPanel = UI.$('#dev-color')!;
	const color = UI.$new<_UI.WidgetColor>('w-color');
	colorPanel.append(
		createValuePanel(color, [
			{
				type: 'boolean',
				key: 'readOnly',
			},
			{
				type: 'boolean',
				key: 'alpha',
			},
			{
				type: 'color',
				key: 'value',
			},
		]),
		createEventPanel(color, ['change']),
		color,
	);

	//#region RE-DO
	initTestEvents();
	initKeyboard();
	initGameController();
});
