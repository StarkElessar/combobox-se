import { defineConfig } from 'vite';

export default defineConfig(({ command }) => {
	return {
		base: command === 'serve' ? '/' : '/combobox-se/',
		server: {
			host: '0.0.0.0',
			port: 3000
		}
	};
});