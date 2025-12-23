import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

// Naive UI
import naive from 'naive-ui';

// Styles
import './assets/styles/variables.scss';
import './assets/styles/base.scss';
import './assets/styles/animations.scss';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(naive);

app.mount('#app');
