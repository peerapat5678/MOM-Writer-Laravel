import { createRouter, createWebHistory } from 'vue-router';
import { isAuthenticated } from '../utils/auth';

const publicBase = import.meta.env.VITE_PUBLIC_BASE || '/';
const normalizedBase = publicBase === '/' ? '' : publicBase.replace(/\/+$/g, '');
const backofficeBase = `${normalizedBase}/backoffice/`;

const routes = [
    {
        path: '/',
        redirect: { name: 'backoffice.moms' },
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
        path: '/moms',
        name: 'backoffice.moms',
        component: () => import('../pages/MomWriter.vue'),
        meta: { requiresAuth: true },
    },
    {
        // Old starter links and anything unknown land on MOM Writer.
        path: '/:pathMatch(.*)*',
        redirect: { name: 'backoffice.moms' },
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
        return { name: 'backoffice.moms' };
    }

    return true;
});

export default router;

