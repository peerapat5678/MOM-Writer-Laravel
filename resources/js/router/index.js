import { createRouter, createWebHistory } from 'vue-router';

const routes = [
    {
        path: '/',
        name: 'home',
        component: () => import('../views/HomeView.vue'),
    },
];

const routerBase = import.meta.env.VITE_ROUTER_BASE || '/';

export default createRouter({
    history: createWebHistory(routerBase),
    routes,
});

