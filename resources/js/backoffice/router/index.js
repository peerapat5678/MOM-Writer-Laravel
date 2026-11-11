import { createRouter, createWebHistory } from 'vue-router';
import { isAuthenticated } from '../utils/auth';

const publicBase = import.meta.env.VITE_PUBLIC_BASE || '/';
const normalizedBase = publicBase === '/' ? '' : publicBase.replace(/\/+$/g, '');
const backofficeBase = `${normalizedBase}/backoffice/`;

const routes = [
    {
        path: '/',
        redirect: { name: 'backoffice.login' },
    },
    {
        path: '/login',
        name: 'backoffice.login',
        component: () => import('../pages/Login.vue'),
    },
    {
        path: '/forgot-password',
        name: 'backoffice.forgot-password',
        component: () => import('../pages/ForgotPassword.vue'),
    },
    {
        path: '/reset-password',
        name: 'backoffice.reset-password',
        component: () => import('../pages/ResetPassword.vue'),
    },
    {
        path: '/dashboard',
        name: 'backoffice.dashboard',
        component: () => import('../pages/Dashboard.vue'),
        meta: { requiresAuth: true },
    },
];

const router = createRouter({
    history: createWebHistory(backofficeBase),
    routes,
});

router.beforeEach((to) => {
    if (to.meta.requiresAuth && !isAuthenticated()) {
        return { name: 'backoffice.login' };
    }

    // Already signed in? Skip the auth screens.
    if (!to.meta.requiresAuth && to.name === 'backoffice.login' && isAuthenticated()) {
        return { name: 'backoffice.dashboard' };
    }

    return true;
});

export default router;

