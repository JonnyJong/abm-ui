export function makeURLForceReload(url: string): string {
	if (url.includes('?')) url += '&';
	else url += '?';
	url += `_uiForceReload=${Date.now()}`;
	return url;
}
