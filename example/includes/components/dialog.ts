import { DialogCreateOptions, WidgetBtn, WidgetBtnState, WidgetNumber, WidgetSelect, WidgetText } from '../../../dist';
import { UI } from '../../base';

export function initDialog() {
	const dialogTitle = UI.$<WidgetText>('#dev-dialog[dev="title"]')!;
	const dialogIcon = UI.$<WidgetText>('#dev-dialog[dev="icon"]')!;
	const dialogContent = UI.$<WidgetText>('#dev-dialog[dev="content"]')!;
	const dialogState = UI.$<WidgetSelect<Exclude<WidgetBtnState, 'toggle'>>>('#dev-dialog[dev="state"]')!;
	const dialogDelay = UI.$<WidgetNumber>('#dev-dialog[dev="delay"]')!;
	const dialogCreate = UI.$<WidgetBtn>('#dev-dialog[dev="new"]')!;
	const dialogConfirm = UI.$<WidgetBtn>('#dev-dialog[dev="confirm"]')!;
	const dialogOk = UI.$<WidgetBtn>('#dev-dialog[dev="ok"]')!;
	dialogState.options = [
		{ value: '', label: '' },
		{ value: 'primary', label: 'primary' },
		{ value: 'danger', label: 'danger' },
	];
	dialogState.value = '';
	function getDialogOptions(): DialogCreateOptions {
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
			const btn = UI.$<WidgetBtn>(`#dev-dialog[dev-action="${details}"]`)!;
			btn.checked = true;
			setTimeout(() => {
				btn.checked = false;
			}, 500);
		});
		dialog.open();
	});
	dialogConfirm.on('active', async () => {
		const result = await UI.Dialog.confirm(getDialogOptions());
		const btn = UI.$<WidgetBtn>(`#dev-dialog[dev-action="${result ? 'confirm' : 'cancel'}"]`)!;
		btn.checked = true;
		setTimeout(() => {
			btn.checked = false;
		}, 500);
	});
	dialogOk.on('active', async () => {
		await UI.Dialog.ok(getDialogOptions());
		const btn = UI.$<WidgetBtn>(`#dev-dialog[dev-action="ok"]`)!;
		btn.checked = true;
		setTimeout(() => {
			btn.checked = false;
		}, 500);
	});
}
