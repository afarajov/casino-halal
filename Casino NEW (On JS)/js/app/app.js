import { showWelcome, showMainMenu } from './app_menu.js';
import { getActiveUser } from './storage.js';

window.addEventListener('DOMContentLoaded', () => {
    const user = getActiveUser();
    if (user) {
        showMainMenu(document.getElementById('app'));
    } else {
        showWelcome(document.getElementById('app'));
    }
});