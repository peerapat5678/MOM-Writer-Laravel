<template>
    <BackofficeLayout>
        <section class="space-y-6">
            <div class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <p class="text-sm font-semibold uppercase tracking-wider text-sky-700">Overview</p>
                    <h1 class="mt-2 text-3xl font-bold tracking-tight text-slate-950">Dashboard</h1>
                    <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                        Monitor core activity, review system health, and keep daily operations moving from one responsive workspace.
                    </p>
                </div>

                <div class="flex gap-2">
                    <button
                        type="button"
                        class="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                    >
                        Export
                    </button>
                    <button
                        type="button"
                        class="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800"
                    >
                        New Report
                    </button>
                </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <article
                    v-for="stat in stats"
                    :key="stat.label"
                    class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200"
                >
                    <div class="flex items-start justify-between gap-4">
                        <div>
                            <p class="text-sm font-medium text-slate-500">{{ stat.label }}</p>
                            <p class="mt-3 text-3xl font-bold tracking-tight text-slate-950">{{ stat.value }}</p>
                        </div>
                        <span class="rounded-2xl px-3 py-1 text-xs font-bold" :class="stat.tone">
                            {{ stat.change }}
                        </span>
                    </div>
                    <p class="mt-4 text-sm text-slate-500">{{ stat.description }}</p>
                </article>
            </div>

            <div class="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
                <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div class="flex items-center justify-between gap-4">
                        <div>
                            <h2 class="text-lg font-bold text-slate-950">Recent Activity</h2>
                            <p class="mt-1 text-sm text-slate-500">Mock activity stream for the admin dashboard.</p>
                        </div>
                        <span class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Healthy</span>
                    </div>

                    <div class="mt-6 divide-y divide-slate-100">
                        <div v-for="activity in activities" :key="activity.title" class="flex gap-4 py-4 first:pt-0 last:pb-0">
                            <div class="mt-1 h-3 w-3 rounded-full" :class="activity.dot" />
                            <div class="min-w-0 flex-1">
                                <p class="text-sm font-semibold text-slate-950">{{ activity.title }}</p>
                                <p class="mt-1 text-sm leading-6 text-slate-500">{{ activity.description }}</p>
                            </div>
                            <time class="shrink-0 text-xs font-medium text-slate-400">{{ activity.time }}</time>
                        </div>
                    </div>
                </section>

                <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 class="text-lg font-bold text-slate-950">Admin Profile</h2>

                    <div v-if="loading" class="mt-6 space-y-3">
                        <div class="h-4 w-2/3 animate-pulse rounded-full bg-slate-200" />
                        <div class="h-4 w-1/2 animate-pulse rounded-full bg-slate-200" />
                        <div class="h-20 animate-pulse rounded-2xl bg-slate-100" />
                    </div>

                    <div v-else-if="user" class="mt-6">
                        <div class="flex items-center gap-4">
                            <div class="grid h-14 w-14 place-items-center rounded-2xl bg-sky-100 text-sm font-bold text-sky-700">
                                AD
                            </div>
                            <div>
                                <p class="font-semibold text-slate-950">{{ user.name }}</p>
                                <p class="text-sm text-slate-500">{{ user.employee_code }}</p>
                            </div>
                        </div>
                        <div class="mt-6 rounded-2xl bg-slate-50 p-4">
                            <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Role</p>
                            <p class="mt-2 text-sm font-semibold text-slate-950">{{ user.role }}</p>
                        </div>
                    </div>

                    <div v-else class="mt-6 rounded-2xl border border-dashed border-slate-300 p-6 text-center">
                        <p class="text-sm font-semibold text-slate-700">No profile data</p>
                        <p class="mt-1 text-sm text-slate-500">The mock API did not return a user profile.</p>
                    </div>
                </section>
            </div>
        </section>
    </BackofficeLayout>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import BackofficeLayout from '../layouts/BackofficeLayout.vue';

const apiBase = (import.meta.env.VITE_BACKOFFICE_API_BASE || '/api').replace(/\/+$/g, '');
const loading = ref(true);
const user = ref(null);

const stats = [
    {
        label: 'Active Users',
        value: '1,284',
        change: '+12%',
        tone: 'bg-emerald-50 text-emerald-700',
        description: 'Users active across the current project.',
    },
    {
        label: 'Pending Tasks',
        value: '38',
        change: '-4%',
        tone: 'bg-sky-50 text-sky-700',
        description: 'Items waiting for admin review.',
    },
    {
        label: 'System Uptime',
        value: '99.9%',
        change: 'Stable',
        tone: 'bg-slate-100 text-slate-700',
        description: 'Mock status for backoffice services.',
    },
    {
        label: 'Reports',
        value: '216',
        change: '+8%',
        tone: 'bg-amber-50 text-amber-700',
        description: 'Generated operational reports this month.',
    },
];

const activities = [
    {
        title: 'Backoffice session created',
        description: 'Mock login completed and dashboard redirected successfully.',
        time: 'Just now',
        dot: 'bg-emerald-500',
    },
    {
        title: 'API placeholders available',
        description: 'Login, logout, forgot password, reset password, and profile endpoints are ready.',
        time: '5m',
        dot: 'bg-sky-500',
    },
    {
        title: 'Responsive layout loaded',
        description: 'Sidebar, navbar, card sections, and mobile overlay are active.',
        time: '12m',
        dot: 'bg-amber-500',
    },
];

onMounted(async () => {
    try {
        const response = await window.axios.get(`${apiBase}/backoffice/me`);
        user.value = response.data.user || null;
    } catch {
        user.value = null;
    } finally {
        loading.value = false;
    }
});
</script>

