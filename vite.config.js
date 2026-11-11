import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

function normalizePath(p) {
    if (!p || p === '/') return '/';
    return `/${p.replace(/^\/+|\/+$/g, '')}/`;
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    const project = env.APP_PROJECT || '';
    const projectBase = normalizePath(project);          // "/<project>/" or "/"
    const isDev = mode === 'development';
    const vitePort = parseInt(env.VITE_PORT || '5173', 10);

    return {
        // dev serves from "/", prod assets live under "/<project>/build/"
        base: isDev ? '/' : `${projectBase}build/`,

        server: {
            host: '0.0.0.0',
            port: vitePort,
            strictPort: true,
            hmr: { host: 'localhost', protocol: 'ws', clientPort: vitePort },
            watch: {
                usePolling: true,
                interval: 1000,
                ignored: ['**/node_modules/**', '**/vendor/**', '**/storage/**', '**/public/build/**'],
            },
        },

        // Base paths consumed by the SPA (router, api, assets). Baked at build time.
        define: {
            'import.meta.env.VITE_APP_PROJECT': JSON.stringify(project),
            'import.meta.env.VITE_ROUTER_BASE': JSON.stringify(projectBase),
            'import.meta.env.VITE_API_BASE': JSON.stringify(`${projectBase.replace(/\/$/, '')}/api`),
            'import.meta.env.VITE_ASSET_BASE': JSON.stringify(`${projectBase}build/`),
            'import.meta.env.VITE_PUBLIC_BASE': JSON.stringify(projectBase),
            'import.meta.env.VITE_BACKOFFICE_API_BASE': JSON.stringify(`${projectBase.replace(/\/$/, '')}/api`),
        },

        plugins: [
            laravel({
                input: [
                    'resources/css/app.css',
                    'resources/js/backoffice/app.js',
                ],
                refresh: ['resources/views/**/*.blade.php', 'routes/**/*.php'],
            }),
            vue(),
            tailwindcss(),
        ],
    };
});
