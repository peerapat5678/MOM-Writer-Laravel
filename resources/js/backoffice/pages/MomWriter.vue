<template>
    <BackofficeLayout>
        <div ref="host" />
    </BackofficeLayout>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import BackofficeLayout from '../layouts/BackofficeLayout.vue';
import { mountMomWriter } from '../mom/momWriter';
import { confirmAction } from '../utils/alerts';
import { getUser } from '../utils/auth';

const host = ref(null);
const apiBase = (import.meta.env.VITE_BACKOFFICE_API_BASE || '/api').replace(/\/+$/g, '');
let app = null;

onMounted(() => {
    const user = getUser();

    app = mountMomWriter(host.value, {
        apiBase: `${apiBase}/backoffice/`,
        senderName: import.meta.env.VITE_MOM_SENDER_NAME || user.name_user || '',
        googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
        brandMark: import.meta.env.VITE_MOM_BRAND ?? 'TG',
    });
});

onBeforeUnmount(() => {
    app?.destroy();
    app = null;
});

// Autosave usually covers this; ask only when the current MOM could not be saved
// (no meeting title yet, an edit conflict, or a server error).
onBeforeRouteLeave(async () => {
    if (!app) {
        return true;
    }

    await app.flush();

    if (!app.hasUnsaved()) {
        return true;
    }

    const answer = await confirmAction(
        'ทิ้งการแก้ไขที่ยังไม่บันทึก?',
        'MOM นี้ยังบันทึกไม่สำเร็จ ถ้าออกจากหน้านี้การแก้ไขจะหาย'
    );

    return answer.isConfirmed;
});
</script>
