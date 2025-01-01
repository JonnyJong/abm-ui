const ts = require('@rollup/plugin-typescript');
// const tarser = require('@rollup/plugin-terser');
const pug = require('rollup-plugin-pug');

const GLOBAL_CSS = '../dist/style.css';

module.exports = [
	{
		input: './src/index.ts',
		output: {
			file: './dist/index.js',
			format: 'iife',
			name: 'UI',
			sourcemap: true,
		},
		plugins: [pug({ GLOBAL_CSS }), ts()/* , tarser() */],
		external: ['@types/node'],
	},
	{
		input: './example/script.ts',
		output: {
			file: './example/script.js',
			format: 'iife',
			// name: 'UI',
			sourcemap: true,
		},
		plugins: [ts({ tsconfig: './example/tsconfig.json' })],
		external: ['@types/node', 'dist'],
	},
];
