<template>
    <main class="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
        <section class="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-200">
            <button
                type="button"
                class="text-sm font-semibold text-sky-700 transition hover:text-sky-900"
                @click="goLogin"
            >
                Back to login
            </button>

            <div class="mt-6">
                <h1 class="text-3xl font-bold tracking-tight text-slate-950">Reset Password</h1>
                <p class="mt-2 text-sm leading-6 text-slate-600">Use a reset token and create a new password for the admin account.</p>
            </div>

            <div v-if="success" class="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p class="text-sm font-semibold text-emerald-800">Password updated</p>
                <p class="mt-1 text-sm text-emerald-700">You can now return to the login page.</p>
            </div>

            <form v-else class="mt-6 space-y-5" @submit.prevent="submit">
                <div v-if="error" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {{ error }}
                </div>

                <label class="block">
                    <span class="text-sm font-semibold text-slate-700">Token</span>
                    <input
                        v-model.trim="form.token"
                        type="text"
                        class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                        placeholder="Reset token"
                    >
                    <span v-if="errors.token" class="mt-2 block text-xs font-medium text-rose-600">{{ errors.token }}</span>
                </label>

                <label class="block">
                    <span class="text-sm font-semibold text-slate-700">New password</span>
                    <input
                        v-model="form.password"
                        type="password"
                        autocomplete="new-password"
                        class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                        placeholder="At least 8 characters"
                    >
                    <span v-if="errors.password" class="mt-2 block text-xs font-medium text-rose-600">{{ errors.password }}</span>
                </label>

                <label class="block">
                    <span class="text-sm font-semibold text-slate-700">Confirm password</span>
                    <input
                        v-model="form.password_confirmation"
                        type="password"
                        autocomplete="new-password"
                        class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                        placeholder="Repeat password"
                    >
                    <span v-if="errors.password_confirmation" class="mt-2 block text-xs font-medium text-rose-600">{{ errors.password_confirmation }}</span>
                </label>

                <button
                    type="submit"
                    class="flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
                    :disabled="loading"
                >
                    <span v-if="loading" class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    {{ loading ? 'Submitting...' : 'Reset Password' }}
                </button>
            </form>
        </section>
    </main>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { showError, showSuccess, showWarning } from '../utils/alerts';

const router = useRouter();
const apiBase = (import.meta.env.VITE_BACKOFFICE_API_BASE || '/api').replace(/\/+$/g, '');
const error = ref('');
const loading = ref(false);
const success = ref(false);
const form = reactive({
    token: '',
    password: '',
    password_confirmation: '',
});
const errors = reactive({
    token: '',
    password: '',
    password_confirmation: '',
});

function validate() {
    errors.token = form.token ? '' : 'Token is required.';
    errors.password = form.password.length >= 8 ? '' : 'Password must be at least 8 characters.';
    errors.password_confirmation = form.password === form.password_confirmation ? '' : 'Password confirmation does not match.';

    return !errors.token && !errors.password && !errors.password_confirmation;
}

async function submit() {
    error.value = '';

    if (!validate()) {
        await showWarning('ข้อมูลยังไม่ถูกต้อง', 'กรุณาตรวจสอบ token และรหัสผ่านใหม่อีกครั้ง');
        return;
    }

    loading.value = true;

    try {
        await window.axios.post(`${apiBase}/backoffice/reset-password`, { ...form });
        success.value = true;
        await showSuccess('รีเซ็ตรหัสผ่านสำเร็จ', 'สามารถกลับไปหน้า Login เพื่อเข้าสู่ระบบได้แล้ว');
    } catch (exception) {
        error.value = exception.response?.data?.message || 'Unable to reset password.';
        await showError('รีเซ็ตรหัสผ่านไม่สำเร็จ', error.value);
    } finally {
        loading.value = false;
    }
}

function goLogin() {
    router.push({ name: 'backoffice.login' });
}
</script>

