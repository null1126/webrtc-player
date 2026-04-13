<script setup lang="ts">
import { useData } from 'vitepress';
import { computed } from 'vue';

const { relativePath } = useData() as unknown as { relativePath: string };

const currentLang = computed(() => {
  return relativePath?.startsWith('en') ? 'en' : 'zh';
});

const switchPath = computed(() => {
  if (currentLang.value === 'zh') {
    return relativePath?.replace(/^zh/, 'en') || '/en/';
  } else {
    return relativePath?.replace(/^en/, 'zh') || '/zh/';
  }
});

const langLabel = computed(() => (currentLang.value === 'zh' ? 'EN' : '中'));
</script>

<template>
  <a
    class="lang-switch"
    :href="switchPath"
    :title="currentLang === 'zh' ? 'Switch to English' : '切换到中文'"
  >
    {{ langLabel }}
  </a>
</template>

<style scoped>
.lang-switch {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 50%;
  background-color: var(--vp-c-bg);
  font-size: 12px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition: all 0.3s ease;
}

.lang-switch:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
</style>
