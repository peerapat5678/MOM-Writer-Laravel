<template>
    <aside
        class="fixed inset-y-0 left-0 z-40 flex w-72 transform flex-col border-r border-slate-200 bg-white shadow-xl shadow-slate-200/60 transition duration-200 lg:translate-x-0"
        :class="open ? 'translate-x-0' : '-translate-x-full'"
    >
        <div class="flex h-16 items-center gap-3 border-b border-slate-200 px-6">
            <div class="grid h-10 w-10 place-items-center rounded-2xl bg-slate-950 text-sm font-bold text-white shadow-lg shadow-slate-300">
                BO
            </div>
            <div>
                <p class="text-sm font-semibold text-slate-950">Backoffice</p>
                <p class="text-xs text-slate-500">Admin console</p>
            </div>
        </div>

        <nav class="flex-1 space-y-2 overflow-y-auto px-4 py-6">
            <RouterLink
                v-for="item in navigation"
                :key="item.name"
                :to="item.to"
                class="group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition"
                :class="isActive(item)
                    ? 'bg-slate-950 text-white shadow-lg shadow-slate-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'"
                @click="$emit('close')"
            >
                <span class="flex items-center gap-3">
                    <span
                        class="grid h-8 w-8 place-items-center rounded-xl border text-xs font-bold transition"
                        :class="isActive(item)
                            ? 'border-white/15 bg-white/10 text-white'
                            : 'border-slate-200 bg-white text-slate-500 group-hover:border-slate-300 group-hover:text-slate-950'"
                    >
                        {{ item.icon }}
                    </span>
                    {{ item.name }}
                </span>
                <span
                    v-if="item.badge"
                    class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    :class="isActive(item) ? 'bg-white/15 text-white' : 'bg-emerald-50 text-emerald-700'"
                >
                    {{ item.badge }}
                </span>
            </RouterLink>
        </nav>

        <div class="border-t border-slate-200 p-4">
            <div class="rounded-2xl bg-slate-50 p-4">
                <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Environment</p>
                <p class="mt-2 text-sm font-semibold text-slate-950">{{ projectName }}</p>
                <p class="mt-1 text-xs text-slate-500">Dynamic APP_PROJECT path</p>
            </div>
        </div>
    </aside>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

defineProps({
    open: {
        type: Boolean,
        default: false,
    },
});

defineEmits(['close']);

const route = useRoute();
const navigation = [
    {
        name: 'Dashboard',
        icon: 'DB',
        badge: 'Live',
        to: { name: 'backoffice.dashboard' },
    },
];

const projectName = computed(() => import.meta.env.VITE_APP_PROJECT || 'root');

function isActive(item) {
    return route.name === item.to.name;
}
</script>

