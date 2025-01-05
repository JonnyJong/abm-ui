import { UIDefaultDict } from '../dist';
import { UI } from './base';
import { initDialog } from './includes/components/dialog';
import { initMsg } from './includes/components/message';
import { initTestEvents } from './includes/event';
import { initGameController } from './includes/gamecontroller';
import { initKeyboard } from './includes/keyboard';
// Widgets
import { widgetBtn } from './includes/widgets/btn';
import { widgetCheckbox } from './includes/widgets/checkbox';
import { widgetColor } from './includes/widgets/color';
import { widgetInput } from './includes/widgets/input';
import { widgetNav } from './includes/widgets/nav';
import { widgetProgress } from './includes/widgets/progress';
import { widgetSelect } from './includes/widgets/select';
import { widgetSlider } from './includes/widgets/slider';
import { widgetSwitch } from './includes/widgets/switch';

//#region Init Config
// CSS
UI.configs.globalCSS = '../dist/style.css';
// Locale
const DICT: Record<string, UIDefaultDict> & Record<string, Record<string, string>> = {
	zh: {
		// Basic
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
		// Other
		'dev.properties': '属性',
		'dev.events': '事件',
	},
	en: {
		// Basic
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
		// Other
		'dev.properties': 'Properties',
		'dev.events': 'Events',
	},
};
const perferLanguage = UI.configs.locale.perfers[0].split('-')[0];
UI.configs.locale.setLocaleDict('', {
	get(key, _options) {
		let dict = DICT.en;
		if (perferLanguage in DICT) dict = DICT[perferLanguage];
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

document.addEventListener('DOMContentLoaded', () => {
	//#region Widgets
	widgetBtn();
	widgetInput();
	widgetSwitch();
	widgetSelect();
	widgetProgress();
	widgetCheckbox();
	widgetSlider();
	widgetNav();
	widgetColor();
	//#region Components
	initDialog();
	initMsg();
	//#region Other
	initTestEvents();
	initKeyboard();
	initGameController();
});
