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
                <h1 class="text-3xl font-bold tracking-tight text-slate-950">Set New Password</h1>
                <p class="mt-2 text-sm leading-6 text-slate-600">
                    กรอกรหัสพนักงานและรหัสผ่านใหม่ ระบบจะตั้งรหัสผ่านใหม่ให้ทันที (อัปเดตคอลัมน์ pass_jwt)
                </p>
            </div>

            <form class="mt-6 space-y-5" @submit.prevent="submit">
                <div v-if="error" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
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
                    {{ loading ? 'Updating password...' : 'Set New Password' }}
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
const form = reactive({
    employee_code: '',
    password: '',
    password_confirmation: '',
});
const errors = reactive({
    employee_code: '',
    password: '',
    password_confirmation: '',
});

function validate() {
    errors.employee_code = form.employee_code ? '' : 'กรุณากรอกรหัสพนักงาน';
    errors.password = form.password.length >= 8 ? '' : 'Password must be at least 8 characters.';
    errors.password_confirmation = form.password === form.password_confirmation ? '' : 'Password confirmation does not match.';

    return !errors.employee_code && !errors.password && !errors.password_confirmation;
}

async function submit() {
    error.value = '';

    if (!validate()) {
        await showWarning('ข้อมูลยังไม่ถูกต้อง', 'กรุณากรอกรหัสพนักงานและรหัสผ่านใหม่ให้ครบถ้วน');
        return;
    }

    loading.value = true;

    try {
        await window.axios.post(`${apiBase}/backoffice/forgot-password`, { ...form });
        await showSuccess('ตั้งรหัสผ่านใหม่สำเร็จ', 'สามารถกลับไปเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้แล้ว');
        router.push({ name: 'backoffice.login' });
    } catch (exception) {
        error.value = exception.response?.data?.message || 'Unable to set a new password.';
        await showError('ตั้งรหัสผ่านใหม่ไม่สำเร็จ', error.value);
    } finally {
        loading.value = false;
    }
}

function goLogin() {
    router.push({ name: 'backoffice.login' });
}
</script>

