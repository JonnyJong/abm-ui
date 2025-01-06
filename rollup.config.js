const ts = require('@rollup/plugin-typescript');
const pug = require('rollup-plugin-pug');

module.exports = [
	{
		input: './src/index.ts',
		output: [
			{
				file: './dist/index.js',
				format: 'iife',
				name: 'UI',
				sourcemap: true,
			},
			{
        file: './dist/index.cjs.js',
        format: 'cjs',
        sourcemap: true,
			},
      {
        file: './dist/index.esm.js',
        format: 'esm',
        sourcemap: true,
      },
      {
        file: './dist/index.amd.js',
        format: 'amd',
        sourcemap: true,
      },
		],
		plugins: [pug(), ts()],
		external: ['@types/node'],
	},
];
