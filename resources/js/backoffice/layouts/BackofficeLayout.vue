<template>
    <div class="min-h-screen bg-slate-50 text-slate-950">
        <Sidebar :open="sidebarOpen" @close="sidebarOpen = false" />

        <button
            v-if="sidebarOpen"
            type="button"
            class="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
            aria-label="Close sidebar"
            @click="sidebarOpen = false"
        />

        <div class="lg:pl-72">
            <Navbar @toggle-sidebar="sidebarOpen = true" @logout="logout" />

            <main class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <slot />
            </main>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Navbar from '../components/Navbar.vue';
import Sidebar from '../components/Sidebar.vue';
import { closeAlert, confirmAction, showError, showLoading, showSuccess } from '../utils/alerts';
import { clearSession } from '../utils/auth';

const sidebarOpen = ref(false);
const router = useRouter();
const apiBase = (import.meta.env.VITE_BACKOFFICE_API_BASE || '/api').replace(/\/+$/g, '');

async function logout() {
    const confirmation = await confirmAction('ออกจากระบบ?', 'ต้องการออกจาก Backoffice ตอนนี้หรือไม่');

    if (!confirmation.isConfirmed) {
        return;
    }

    showLoading('กำลังออกจากระบบ', 'กรุณารอสักครู่');

    try {
        await window.axios.post(`${apiBase}/backoffice/logout`);
        closeAlert();
        await showSuccess('ออกจากระบบสำเร็จ', 'ระบบจะพากลับไปหน้า Login');
    } catch (exception) {
        closeAlert();
        await showError(
            'ออกจากระบบไม่สำเร็จ',
            exception.code === 'ECONNABORTED'
                ? 'การเชื่อมต่อนานเกินไป ระบบจะออกจากหน้านี้ให้ก่อน'
                : exception.response?.data?.message || 'ไม่สามารถเรียก logout API ได้'
        );
    } finally {
        clearSession();
        router.push({ name: 'backoffice.login' });
    }
}
</script>

