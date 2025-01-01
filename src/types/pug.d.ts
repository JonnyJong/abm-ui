declare module '*static.pug' {
	const template: string;
	export default template;
}

declare module '*.pug' {
	const template: (options?: any) => string;
	export default template;
}
