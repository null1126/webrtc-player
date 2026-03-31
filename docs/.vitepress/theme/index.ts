import { h } from 'vue';
import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import './style.css';

// 导入自定义组件
import LanguageSwitch from './components/LanguageSwitch.vue';

export default {
  extends: DefaultTheme,

  enhanceApp({ app, router, siteData }) {
    // 注册自定义组件
    app.component('LanguageSwitch', LanguageSwitch);
  },
} satisfies Theme;
