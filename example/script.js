(function () {
    'use strict';

    function getBox(element) {
        if (!element)
            element = UI.$div();
        UI.$apply(element, {
            style: {
                width: 100,
                height: 100,
                background: 'var(--text)',
            },
        });
        return element;
    }
    function hover() {
        const box = getBox(UI.$('#dev-e-hover'));
        UI.events.hover.on(box, (event) => {
            UI.$apply(box, {
                style: {
                    background: `var(--${event.hover ? 'theme' : 'text'})`,
                },
            });
        });
    }
    function active() {
        const box = getBox(UI.$('#dev-e-active'));
        UI.events.active.on(box, (event) => {
            UI.$apply(box, {
                style: {
                    background: `var(--${event.active ? 'theme' : 'text'})`,
                },
            });
        });
    }
    function slide() {
        const panel = UI.$('#dev-e-slide');
        const box1 = getBox();
        box1.style.position = 'absolute';
        const box2 = getBox();
        box2.style.position = 'absolute';
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
        const board = UI.$div({
            style: {
                width: '100%',
                height: 300,
                background: 'var(--ui-panel-bg)',
                position: 'relative',
            },
        }, box1, box2, info1, info2);
        panel.append(board);
        let diffX1 = 0;
        let diffY1 = 0;
        UI.events.slide.on(box1, (event) => {
            box1.style.background = event.state === 'end' ? 'var(--text)' : 'var(--theme)';
            if (event.state === 'start') {
                const { x, y } = box1.getBoundingClientRect();
                diffX1 = event.x - x;
                diffY1 = event.y - y;
                return;
            }
            const { width, height, x, y } = board.getBoundingClientRect();
            const finalX = UI.clamp(0, event.x - diffX1 - x, width - 100);
            const finalY = UI.clamp(0, event.y - diffY1 - y, height - 100);
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
        UI.events.slide.on(box2, (event) => {
            box2.style.background = event.state === 'end' ? 'var(--text)' : 'var(--theme)';
            if (event.state === 'start') {
                const { x, y } = box2.getBoundingClientRect();
                diffX2 = event.x - x;
                diffY2 = event.y - y;
                return;
            }
            const { width, height, x, y } = board.getBoundingClientRect();
            const finalX = UI.clamp(0, event.x - diffX2 - x, width - 100);
            const finalY = UI.clamp(0, event.y - diffY2 - y, height - 100);
            UI.$apply(box2, {
                style: {
                    left: `${(finalX / width) * 100}%`,
                    top: `${(finalY / height) * 100}%`,
                },
            });
            info2.innerHTML = `X: ${finalX}<br>Y: ${finalY}`;
        });
    }
    function initTestEvents() {
        hover();
        active();
        slide();
    }

    function setup(id) {
        const pad = UI.GameController.getInstance(id);
        const connecting = UI.$new('w-btn');
        connecting.disabled = true;
        connecting.content.text = `${id} not connected`;
        pad.on('connectivity', (event) => {
            connecting.state = event.value ? 'primary' : '';
            connecting.content.text = `${id} ${event.value ? 'connected' : 'not connected'}`;
        });
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
        const ls = UI.$div({
            style: {
                position: 'relative',
                width: 200,
                height: 200,
                borderRadius: 200,
                background: 'var(--ui-panel-bg)',
                overflow: 'hidden',
            },
        }, lsDirection, lsPoint);
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
        const rs = UI.$div({
            style: {
                position: 'relative',
                width: 200,
                height: 200,
                borderRadius: 200,
                background: 'var(--ui-panel-bg)',
                overflow: 'hidden',
            },
        }, rsDirection, rsPoint);
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
        const lt = UI.$new('w-progress-bar');
        lt.value = 0;
        pad.on('lt', () => {
            lt.value = pad.lt * 100;
        });
        const lb = UI.$new('w-btn');
        lb.disabled = true;
        lb.content.text = 'LB';
        pad.on('lb', () => {
            lb.state = pad.lb ? 'primary' : '';
        });
        const left = UI.$div({ attr: { 'ui-layout': 'flow-column' } }, lt, lb, ls);
        const rt = UI.$new('w-progress-bar');
        rt.value = 0;
        pad.on('rt', () => {
            rt.value = pad.rt * 100;
        });
        const rb = UI.$new('w-btn');
        rb.disabled = true;
        rb.content.text = 'RB';
        pad.on('rb', () => {
            rb.state = pad.rb ? 'primary' : '';
        });
        const right = UI.$div({ attr: { 'ui-layout': 'flow-column' } }, rt, rb, rs);
        const upBtn = UI.$new('w-btn', { style: { gridArea: 'w' } });
        upBtn.disabled = true;
        upBtn.content.icon = 'ChevronUp';
        const rightBtn = UI.$new('w-btn', { style: { gridArea: 'd' } });
        rightBtn.disabled = true;
        rightBtn.content.icon = 'ChevronRight';
        const downBtn = UI.$new('w-btn', { style: { gridArea: 's' } });
        downBtn.disabled = true;
        downBtn.content.icon = 'ChevronDown';
        const leftBtn = UI.$new('w-btn', { style: { gridArea: 'a' } });
        leftBtn.disabled = true;
        leftBtn.content.icon = 'ChevronLeft';
        pad.on('arrow', () => {
            upBtn.state = pad.up ? 'primary' : '';
            rightBtn.state = pad.right ? 'primary' : '';
            downBtn.state = pad.down ? 'primary' : '';
            leftBtn.state = pad.left ? 'primary' : '';
        });
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
        const y = UI.$new('w-btn', { style: { gridArea: 'w' } });
        y.disabled = true;
        y.content.text = 'Y';
        pad.on('y', () => {
            y.state = pad.y ? 'primary' : '';
        });
        const b = UI.$new('w-btn', { style: { gridArea: 'd' } });
        b.disabled = true;
        b.content.text = 'B';
        pad.on('b', () => {
            b.state = pad.b ? 'primary' : '';
        });
        const a = UI.$new('w-btn', { style: { gridArea: 's' } });
        a.disabled = true;
        a.content.text = 'A';
        pad.on('a', () => {
            a.state = pad.a ? 'primary' : '';
        });
        const x = UI.$new('w-btn', { style: { gridArea: 'a' } });
        x.disabled = true;
        x.content.text = 'X';
        pad.on('x', () => {
            x.state = pad.x ? 'primary' : '';
        });
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
        const home = UI.$new('w-btn');
        home.content.text = 'Home';
        home.disabled = true;
        pad.on('home', () => {
            home.state = pad.home ? 'primary' : '';
        });
        const start = UI.$new('w-btn');
        start.content.text = 'Start';
        start.disabled = true;
        pad.on('start', () => {
            start.state = pad.start ? 'primary' : '';
        });
        const back = UI.$new('w-btn');
        back.content.text = 'Back';
        back.disabled = true;
        pad.on('back', () => {
            back.state = pad.back ? 'primary' : '';
        });
        const other = UI.$div({ attr: { 'ui-layout': 'flow-column' } }, home, start, back);
        const switchs = UI.$div({ attr: { 'ui-layout': 'flow' } }, left, right, arrows, abxy, other);
        const panel = UI.$div(connecting, switchs);
        return panel;
    }
    function initGameController() {
        const panel = UI.$('#dev-ui-gamepad');
        panel.append(...[0, 1, 2, 3].map(setup));
    }

    function bind() {
        const binder = UI.keyboard.bind();
        if (!binder)
            return new Promise(() => null);
        const info = UI.$div();
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
    function refreshPanel(panel) {
        const input = UI.$new('w-text');
        input.placeholder = 'ID';
        const btn = UI.$new('w-btn');
        btn.content.text = 'Add';
        btn.on('active', async () => {
            if (input.value.length === 0)
                return;
            const keys = await bind();
            if (!keys)
                return;
            UI.keyboard.add(input.value, keys);
            refreshPanel(panel);
        });
        panel.replaceChildren(...Object.entries(UI.keyboard.bindMap).map(([id, group]) => {
            return UI.$new('tr', UI.$new('td', { data: { id } }, id), UI.$new('td', ...group.map((item) => {
                const btn = UI.$new('w-btn', { style: { display: 'inline-block' } });
                btn.content.text = [...item].join(' ');
                btn.on('active', async () => {
                    const result = await UI.Dialog.confirm({
                        title: `Unbind key "${[...item].join(' ')}" ?`,
                        content: '',
                    });
                    if (!result)
                        return;
                    UI.keyboard.rm(id, item);
                    refreshPanel(panel);
                });
                return btn;
            })), UI.$new('td', ...(() => {
                const add = UI.$new('w-btn', { style: { display: 'inline-block' } });
                add.content.text = 'Add';
                add.on('active', async () => {
                    const keys = await bind();
                    if (!keys)
                        return;
                    UI.keyboard.add(id, keys);
                    refreshPanel(panel);
                });
                const set = UI.$new('w-btn', { style: { display: 'inline-block' } });
                set.content.text = 'Set';
                set.on('active', async () => {
                    const keys = await bind();
                    if (!keys)
                        return;
                    UI.keyboard.set(id, [keys]);
                    refreshPanel(panel);
                });
                const del = UI.$new('w-btn', { style: { display: 'inline-block' } });
                del.content.text = 'Delete';
                del.on('active', async () => {
                    const result = await UI.Dialog.confirm({
                        title: `Delete bind group "${id}" ?`,
                        content: '',
                    });
                    if (!result)
                        return;
                    UI.keyboard.delete(id);
                    refreshPanel(panel);
                });
                return [add, set, del];
            })()));
        }), UI.$new('tr', UI.$new('td', input), UI.$new('td'), UI.$new('td', btn)));
    }
    function initKeyboard() {
        const panel = UI.$('#dev-ui-keyboard');
        refreshPanel(panel);
        UI.keyboard.on('shortcut', (event) => {
            const tr = panel.querySelector(`[data-id="${event.key}"]`);
            if (!tr)
                return;
            tr.style.background = 'var(--theme)';
            setTimeout(() => {
                tr.style.background = '';
            }, 100);
        });
    }

    const TEST_DICT = {
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
        UI.configs.globalCSS = '../dist/style.css';
        const perferLanguage = UI.configs.locale.perfers[0].split('-')[0];
        UI.configs.locale.setLocaleDict('', {
            get(key, _options) {
                let dict = TEST_DICT.en;
                if (perferLanguage in TEST_DICT)
                    dict = TEST_DICT[perferLanguage];
                if (key in dict)
                    return dict[key];
                return key;
            },
        });
        UI.configs.icons.setIconPack('icon', './assets/icon.css');
        UI.configs.icons.setIconPack('icon-extra', './assets/icon-extra.css');
        UI.configs.icons.defaults.selectExpand = 'icon-extra:ChevronUpDown';
        UI.configs.icons.defaults.msgHide = 'icon:ChevronUp';
        UI.configs.icons.defaults.msgClose = 'icon:Clear';
    })();
    function numberToChinese(num) {
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
            }
            else if (result.charAt(0) !== chineseNumbers[0] && (unitIndex === 1 || unitIndex === 2 || unitIndex === 3)) {
                result = chineseNumbers[0] + result;
            }
            unitIndex++;
        }
        return result;
    }
    function setValue(obj, key, value) {
        const keys = key.split('.');
        for (const key of keys.slice(0, keys.length - 1)) {
            obj = obj[key];
        }
        obj[keys.at(-1)] = value;
    }
    function getValue(obj, key) {
        for (const k of key.split('.')) {
            obj = obj[k];
        }
        return obj;
    }
    function createValuePanel(target, items) {
        const inputs = [];
        const others = [];
        for (const item of items) {
            switch (item.type) {
                case 'string': {
                    const strInput = UI.$new('w-text');
                    if (typeof item.init === 'string')
                        strInput.value = item.init;
                    strInput.placeholder = item.description ?? item.key;
                    strInput.on('input', () => setValue(target, item.key, strInput.value));
                    if (item.onEvent)
                        target.on(item.onEvent, () => {
                            strInput.value = getValue(target, item.key);
                        });
                    inputs.push(strInput);
                    continue;
                }
                case 'number': {
                    const numInput = UI.$new('w-number');
                    if (typeof item.init === 'number')
                        numInput.value = item.init;
                    numInput.placeholder = item.description ?? item.key;
                    if (typeof item.min === 'number')
                        numInput.min = item.min;
                    if (typeof item.max === 'number')
                        numInput.max = item.max;
                    if (typeof item.default === 'number')
                        numInput.default = item.default;
                    numInput.on('input', () => setValue(target, item.key, numInput.value));
                    inputs.push(numInput);
                    continue;
                }
                case 'boolean': {
                    const boolBtn = UI.$new('w-btn');
                    boolBtn.content.key = item.description ?? item.key;
                    boolBtn.state = 'toggle';
                    if (typeof item.init === 'boolean')
                        boolBtn.checked = item.init;
                    boolBtn.on('active', () => setValue(target, item.key, boolBtn.checked));
                    others.push(boolBtn);
                    continue;
                }
                case 'color': {
                    const colorInput = UI.$new('w-color');
                    if (typeof item.init === 'string')
                        colorInput.value = item.init;
                    colorInput.on('change', () => setValue(target, item.key, colorInput.value));
                    others.push(colorInput);
                    continue;
                }
                case 'enum': {
                    const enumInput = UI.$new('w-select');
                    enumInput.options = item.values.map((v) => {
                        return { value: v, label: v };
                    });
                    if (item.init !== undefined)
                        enumInput.value = item.init;
                    enumInput.on('change', () => setValue(target, item.key, enumInput.value));
                    others.push(enumInput);
                    continue;
                }
                case 'strArr': {
                    const strArrInput = UI.$new('w-text');
                    if (Array.isArray(item.init))
                        strArrInput.value = item.init.join(', ');
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
    function createEventPanel(target, events) {
        const lights = events.map((name) => {
            const light = UI.$new('w-btn');
            light.content.text = name;
            light.state = 'toggle';
            light.disabled = true;
            target.on(name, () => {
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
    document.addEventListener('DOMContentLoaded', () => {
        const btnPanel = UI.$('#dev-btn');
        const btn = UI.$new('w-btn');
        btn.content.key = 'dev.btn';
        btnPanel.append(createValuePanel(btn, [
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
        ]), createEventPanel(btn, ['active']), btn);
        const textPanel = UI.$('#dev-text');
        const text = UI.$new('w-text');
        text.actionsLeft.items = [
            {
                id: 'search',
                content: new UI.UIContent({ icon: 'Search' }),
                disabled: true,
            },
        ];
        text.actionsRight.items = [{ id: 'clear', content: new UI.UIContent({ icon: 'Clear' }), hidden: true }];
        textPanel.append(createValuePanel(text, [
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
        ]), createEventPanel(text, ['input', 'autofill', 'action', 'confirm']), text);
        text.on('input', () => {
            text.actionsRight.get(0).hidden = !text.value;
        });
        text.on('action', ({ details }) => {
            if (details !== 'clear')
                return;
            text.value = '';
            text.actionsRight.get(0).hidden = true;
        });
        const pswPanel = UI.$('#dev-psw');
        const psw = UI.$new('w-password');
        psw.actionsLeft.items = [{ id: 'psw', content: new UI.UIContent({ icon: 'VPN' }), disabled: true }];
        psw.actionsRight.items = [
            { id: 'clear', content: new UI.UIContent({ icon: 'Clear' }), hidden: true },
            {
                id: 'show',
                content: new UI.UIContent({ icon: 'PasswordKeyHide' }),
                toggle: true,
            },
        ];
        pswPanel.append(createValuePanel(psw, [
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
        ]), createEventPanel(psw, ['input', 'autofill', 'action', 'confirm']), psw);
        psw.on('input', () => {
            psw.actionsRight.get(0).hidden = !psw.value;
        });
        psw.on('action', ({ details }) => {
            if (details === 'clear') {
                psw.value = '';
                psw.actionsRight.get(0).hidden = true;
            }
            if (details !== 'show')
                return;
            psw.passwordVisibility = psw.actionsRight.get(1).checked;
        });
        const numPanel = UI.$('#dev-num');
        const num = UI.$new('w-number');
        numPanel.append(createValuePanel(num, [
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
        ]), createEventPanel(num, ['input', 'autofill', 'action', 'confirm']), num);
        const switchPanel = UI.$('#dev-switch');
        const switchE = UI.$new('w-switch');
        switchPanel.append(createValuePanel(switchE, [
            {
                type: 'boolean',
                key: 'disabled',
            },
            {
                type: 'boolean',
                key: 'checked',
                description: 'checked (wont auto update)',
            },
        ]), createEventPanel(switchE, ['change']), switchE);
        const selectPanel = UI.$('#dev-select');
        const select = UI.$new('w-select');
        select.placeholder.text = 'Click me';
        const selectOptions = [];
        for (const i of UI.range(120)) {
            selectOptions.push({
                value: i,
                label: numberToChinese(i),
            });
        }
        select.options = selectOptions;
        selectPanel.append(createValuePanel(select, [
            {
                type: 'boolean',
                key: 'disabled',
            },
        ]), createEventPanel(select, ['change']), select);
        const dialogTitle = UI.$('#dev-dialog[dev="title"]');
        const dialogIcon = UI.$('#dev-dialog[dev="icon"]');
        const dialogContent = UI.$('#dev-dialog[dev="content"]');
        const dialogState = UI.$('#dev-dialog[dev="state"]');
        const dialogDelay = UI.$('#dev-dialog[dev="delay"]');
        const dialogCreate = UI.$('#dev-dialog[dev="new"]');
        const dialogConfirm = UI.$('#dev-dialog[dev="confirm"]');
        const dialogOk = UI.$('#dev-dialog[dev="ok"]');
        dialogState.options = [
            { value: '', label: '' },
            { value: 'primary', label: 'primary' },
            { value: 'danger', label: 'danger' },
        ];
        dialogState.value = '';
        function getDialogOptions() {
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
                const btn = UI.$(`#dev-dialog[dev-action="${details}"]`);
                btn.checked = true;
                setTimeout(() => {
                    btn.checked = false;
                }, 500);
            });
            dialog.open();
        });
        dialogConfirm.on('active', async () => {
            const result = await UI.Dialog.confirm(getDialogOptions());
            const btn = UI.$(`#dev-dialog[dev-action="${result ? 'confirm' : 'cancel'}"]`);
            btn.checked = true;
            setTimeout(() => {
                btn.checked = false;
            }, 500);
        });
        dialogOk.on('active', async () => {
            await UI.Dialog.ok(getDialogOptions());
            const btn = UI.$(`#dev-dialog[dev-action="ok"]`);
            btn.checked = true;
            setTimeout(() => {
                btn.checked = false;
            }, 500);
        });
        const progressPanel = UI.$('#dev-progress');
        const progressBar = UI.$new('w-progress-bar');
        const progressRing = UI.$new('w-progress-ring');
        progressPanel.append(createValuePanel(progressBar, [
            {
                type: 'number',
                key: 'value',
                default: NaN,
            },
            {
                type: 'color',
                key: 'color',
            },
        ]), progressBar, createValuePanel(progressRing, [
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
        ]), progressRing);
        const msgTitle = UI.$('#dev-msg[dev="title"]');
        const msgIcon = UI.$('#dev-msg[dev="icon"]');
        const msgContent = UI.$('#dev-msg[dev="content"]');
        const msgDelay = UI.$('#dev-msg[dev="delay"]');
        const msgAutoClose = UI.$('#dev-msg[dev="autoClose"]');
        const msgNew = UI.$('#dev-msg[dev="new"]');
        const msgToggle = UI.$('#dev-msg[dev="toggle"]');
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
        const checkboxPanel = UI.$('#dev-checkbox');
        const checkbox = UI.$new('w-checkbox');
        checkbox.append('Hello world');
        checkboxPanel.append(createValuePanel(checkbox, [
            {
                type: 'boolean',
                key: 'disabled',
            },
            {
                type: 'boolean',
                key: 'checked',
            },
        ]), createEventPanel(checkbox, ['change']), checkbox);
        const sliderPanel = UI.$('#dev-slider');
        const slider = UI.$new('w-slider');
        sliderPanel.append(createValuePanel(slider, [
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
        ]), createEventPanel(slider, ['change', 'input']), slider);
        const navPanel = UI.$('#dev-nav');
        const nav = UI.$new('w-nav');
        navPanel.append(createValuePanel(nav, [
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
        ]), createEventPanel(nav, ['change']), nav);
        nav.items = [
            { id: 'home', content: { icon: 'Home', text: 'Home' } },
            { id: 'mail', content: { icon: 'Mail', text: 'Mail' } },
            { id: 'video', content: { icon: 'Video', text: 'Video' } },
        ];
        nav.endItems = [{ id: 'settings', content: { icon: 'Settings', text: 'Settings' } }];
        const colorPanel = UI.$('#dev-color');
        const color = UI.$new('w-color');
        colorPanel.append(createValuePanel(color, [
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
        ]), createEventPanel(color, ['change']), color);
        initTestEvents();
        initKeyboard();
        initGameController();
    });

})();
//# sourceMappingURL=script.js.map
