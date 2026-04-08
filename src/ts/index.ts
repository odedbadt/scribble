import { MainApp, app_ignite } from './main_app';

// Attach app to window for test access
(window as any).app = new MainApp();
(window as any).app.init();
window.addEventListener('load', app_ignite);
