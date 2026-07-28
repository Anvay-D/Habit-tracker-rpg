// Navigation handling
export function initNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all buttons and tabs
            navBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

            // Add active to clicked button and corresponding tab
            btn.classList.add('active');
            const tabId = btn.dataset.tab;
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}