import { WidgetBtn, WidgetNumber, WidgetText } from '../../../dist';
import { UI } from '../../base';

export function initMsg() {
	const msgTitle = UI.$<WidgetText>('#dev-msg[dev="title"]')!;
	const msgIcon = UI.$<WidgetText>('#dev-msg[dev="icon"]')!;
	const msgContent = UI.$<WidgetText>('#dev-msg[dev="content"]')!;
	const msgDelay = UI.$<WidgetNumber>('#dev-msg[dev="delay"]')!;
	const msgAutoClose = UI.$<WidgetBtn>('#dev-msg[dev="autoClose"]')!;
	const msgNew = UI.$<WidgetBtn>('#dev-msg[dev="new"]')!;
	const msgToggle = UI.$<WidgetBtn>('#dev-msg[dev="toggle"]')!;
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
}
