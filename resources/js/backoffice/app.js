import '../bootstrap';
import '../../css/app.css';
import 'sweetalert2/dist/sweetalert2.min.css';

import { createApp, h } from 'vue';
import { RouterView } from 'vue-router';
import router from './router';
import { installAuth } from './utils/auth';

installAuth(router);

createApp({
    render: () => h(RouterView),
}).use(router).mount('#backoffice-app');
