<template>
    <main class="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,#dff7ff,transparent_34%),linear-gradient(135deg,#f8fafc_0%,#e2e8f0_48%,#f8fafc_100%)] px-4 py-10">
        <section class="w-full max-w-md">
            <div class="mb-8 text-center">
                <div class="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-slate-950 text-sm font-bold text-white shadow-xl shadow-slate-300">
                    TG
                </div>
                <h1 class="mt-5 text-3xl font-bold tracking-tight text-slate-950">Backoffice Login</h1>
                <p class="mt-2 text-sm text-slate-600">Sign in to manage the admin console.</p>
            </div>

            <form class="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-2xl shadow-slate-300/60 backdrop-blur" @submit.prevent="submit">
                <div v-if="error" class="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {{ error }}
                </div>

                <label class="block">
                    <span class="text-sm font-semibold text-slate-700">รหัสพนักงาน</span>
                    <input
                        v-model.trim="form.employee_code"
                        type="text"
                        autocomplete="off"
                        class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                        placeholder="EMP001"
                    >
                    <span v-if="errors.employee_code" class="mt-2 block text-xs font-medium text-rose-600">{{ errors.employee_code }}</span>
                </label>

                <label class="mt-5 block">
                    <span class="text-sm font-semibold text-slate-700">Password</span>
                    <input
                        v-model="form.password"
                        type="password"
                        autocomplete="current-password"
                        class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                        placeholder="Enter password"
                    >
                    <span v-if="errors.password" class="mt-2 block text-xs font-medium text-rose-600">{{ errors.password }}</span>
                </label>

                <div class="mt-4 flex items-center justify-between">
                    <label class="flex items-center gap-2 text-sm text-slate-600">
                        <input type="checkbox" class="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-950">
                        Remember me
                    </label>
                    <button
                        type="button"
                        class="text-sm font-semibold text-sky-700 transition hover:text-sky-900"
                        @click="goForgotPassword"
                    >
                        Forgot password?
                    </button>
                </div>

                <button
                    type="submit"
                    class="mt-6 flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-slate-300 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
                    :disabled="loading"
                >
                    <span v-if="loading" class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    {{ loading ? 'Signing in...' : 'Login' }}
                </button>
            </form>
        </section>
    </main>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { closeAlert, showError, showLoading, showSuccess } from '../utils/alerts';
import { setSession } from '../utils/auth';

const router = useRouter();
const apiBase = (import.meta.env.VITE_BACKOFFICE_API_BASE || '/api').replace(/\/+$/g, '');
const loading = ref(false);
const error = ref('');
const errors = reactive({
    employee_code: '',
    password: '',
});
const form = reactive({
    employee_code: '',
    password: '',
});

function validate() {
    errors.employee_code = form.employee_code ? '' : 'กรุณากรอกรหัสพนักงาน';
    errors.password = form.password ? '' : 'Password is required.';

    return !errors.employee_code && !errors.password;
}

async function submit() {
    error.value = '';

    if (!validate()) {
        return;
    }

    loading.value = true;
    showLoading('กำลังเข้าสู่ระบบ', 'กรุณารอสักครู่');

    try {
        const response = await window.axios.post(`${apiBase}/backoffice/login`, {
            employee_code: form.employee_code,
            password: form.password,
        });

        const data = response.data?.data || {};
        setSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            user: data.user,
        });
        closeAlert();
        await showSuccess('เข้าสู่ระบบสำเร็จ', 'กำลังพาไปหน้า Dashboard');
        router.push({ name: 'backoffice.dashboard' });
    } catch (exception) {
        closeAlert();
        error.value = exception.code === 'ECONNABORTED'
            ? 'การเชื่อมต่อนานเกินไป กรุณาลองใหม่อีกครั้ง'
            : exception.response?.data?.message || 'Unable to login. Please check your credentials.';
        await showError('เข้าสู่ระบบไม่สำเร็จ', error.value);
    } finally {
        loading.value = false;
    }
}

function goForgotPassword() {
    router.push({ name: 'backoffice.forgot-password' });
}
</script>

