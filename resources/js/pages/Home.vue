<script setup>
import { ref } from 'vue';

const count = ref(0);
const project = import.meta.env.VITE_APP_PROJECT || '(root)';
const apiBase = import.meta.env.VITE_API_BASE || '/api';
</script>

<template>
    <main class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
        <div class="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-lg p-8 text-center">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                Laravel 12 + Vue 3 + Vite
            </h1>
            <p class="mt-2 text-gray-500 dark:text-gray-400">
                It works under <code class="font-mono">/{{ project }}/</code>
            </p>

            <button
                class="mt-6 rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-500 transition"
                @click="count++"
            >
                count is {{ count }}
            </button>

            <p class="mt-6 text-xs text-gray-400">
                API base: <code class="font-mono">{{ apiBase }}</code>
            </p>
        </div>
    </main>
</template>
