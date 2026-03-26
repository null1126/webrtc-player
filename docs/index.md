---
layout: home
---

<script setup>
import { onMounted } from 'vue';

onMounted(() => {
  if (window.location.pathname === '/webrtc-player/') {
    window.location.pathname = '/webrtc-player/zh/';
  }
});
</script>
