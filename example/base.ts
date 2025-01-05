//#region Define
import type * as _UI from '../dist';
declare global {
	interface Window {
		UI: typeof _UI;
	}
	const UI: typeof _UI;
}
export const UI = window.UI;

//#region Helper
export function numberToChinese(num: number): string {
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
