import { WidgetNumber, WidgetPassword, WidgetText } from '../../../dist';
import { UI } from '../../base';
import { $panel } from './base';

export function widgetInput() {
	//#region Text
	const text = UI.$new<WidgetText>('w-text');
	text.actionsLeft.items = [
		{
			id: 'search',
			content: new UI.UIContent({ icon: 'Search' }),
			disabled: true,
		},
	];
	text.actionsRight.items = [{ id: 'clear', content: new UI.UIContent({ icon: 'Clear' }), hidden: true }];
	text.on('input', () => {
		text.actionsRight.get(0).hidden = text.value.length === 0;
	});
	text.on('confirm', () => {
		text.actionsRight.get(0).hidden = text.value.length === 0;
	});
	text.autoFill.items = [
		'No ID Auto Fill Item',
		{
			id: 'value',
			value: 'Value Only',
		},
		{
			id: 'label',
			label: "Label Only (Won't fill)",
		},
		{
			id: 'all',
			label: 'label can be different from value',
			value: 'A value different from the label',
		},
	];
	text.on('action', ({ details }) => {
		if (details !== 'clear') return;
		text.value = '';
		text.actionsRight.get(0).hidden = true;
	});
	$panel(
		'text',
		text,
		[
			{
				type: 'string',
				key: 'value',
				default: '',
			},
			{
				type: 'string',
				key: 'placeholder',
				default: '',
			},
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
		],
		['input', 'autofill', 'action', 'confirm'],
	);
	//#region Password
	const psw = UI.$new<WidgetPassword>('w-password');
	psw.actionsLeft.items = [{ id: 'psw', content: new UI.UIContent({ icon: 'VPN' }), disabled: true }];
	psw.actionsRight.items = [
		{ id: 'clear', content: new UI.UIContent({ icon: 'Clear' }), hidden: true },
		{
			id: 'show',
			content: new UI.UIContent({ icon: 'PasswordKeyHide' }),
			toggle: true,
		},
	];
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
	$panel(
		'psw',
		psw,
		[
			{
				type: 'string',
				key: 'value',
				default: '',
			},
			{
				type: 'string',
				key: 'placeholder',
				default: '',
			},
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
			},
		],
		['input', 'autofill', 'action', 'confirm'],
	);
	//#region Num
	const num = UI.$new<WidgetNumber>('w-number');
	$panel(
		'num',
		num,
		[
			{
				type: 'number',
				key: 'value',
			},
			{
				type: 'string',
				key: 'placeholder',
				default: '',
			},
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
				type: 'number',
				key: 'default',
				description: 'Default (NaN)',
				default: NaN,
			},
			{
				type: 'number',
				key: 'min',
				description: 'Min (-Infinity)',
				default: -Infinity,
			},
			{
				type: 'number',
				key: 'max',
				description: 'Max (Infinity)',
				default: Infinity,
			},
			{
				type: 'number',
				key: 'step',
				description: 'Step (0)',
				default: 0,
			},
		],
		['input', 'autofill', 'action', 'confirm'],
	);
}
