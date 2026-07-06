export function injectBackButton() {
    if (document.getElementById('global-back-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'global-back-btn';
    btn.innerHTML = '&larr; Back';
    btn.style.position = 'fixed';
    btn.style.top = '1rem';
    btn.style.left = '1rem';
    btn.style.zIndex = '9999';
    // Add your styling here
    
    btn.onclick = () => window.history.back();
    document.body.appendChild(btn);
}