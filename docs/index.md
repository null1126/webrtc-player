---
layout: home
---

<script setup>
import { onMounted } from 'vue';

onMounted(() => {
  if (window.location.pathname === '/webrtc-engine/') {
    window.location.pathname = '/webrtc-engine/zh/';
  }
});
</script>
