<template>
    <header class="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div class="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div class="flex min-w-0 items-center gap-3">
                <button
                    type="button"
                    class="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 lg:hidden"
                    aria-label="Open sidebar"
                    @click="$emit('toggle-sidebar')"
                >
                    <span class="h-0.5 w-5 rounded bg-current shadow-[0_6px_0_currentColor,0_-6px_0_currentColor]" />
                </button>
                <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-slate-950">Admin Dashboard</p>
                    <p class="truncate text-xs text-slate-500">{{ todayLabel }}</p>
                </div>
            </div>

            <div class="flex items-center gap-3">
                <div class="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 sm:block">
                    {{ userRole }}
                </div>
                <div class="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-2 py-1.5 shadow-sm">
                    <div class="grid h-8 w-8 place-items-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">
                        AD
                    </div>
                    <div class="hidden pr-2 sm:block">
                        <p class="text-xs font-semibold text-slate-950">{{ userName }}</p>
                        <p class="text-[11px] text-slate-500">{{ userEmployeeCode }}</p>
                    </div>
                </div>
                <button
                    type="button"
                    class="rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    @click="$emit('logout')"
                >
                    Logout
                </button>
            </div>
        </div>
    </header>
</template>

<script setup>
import { computed } from 'vue';

defineEmits(['toggle-sidebar', 'logout']);

const savedUser = computed(() => {
    try {
        return JSON.parse(localStorage.getItem('backoffice_user') || '{}');
    } catch {
        return {};
    }
});

const userName = computed(() => savedUser.value.name || 'Admin User');
const userEmployeeCode = computed(() => savedUser.value.employee_code || 'EMP001');
const userRole = computed(() => savedUser.value.role || 'Administrator');
const todayLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
}).format(new Date());
</script>

