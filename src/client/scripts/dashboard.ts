import { syncPendingActions } from "../../services/sync.services.js";

const API = '/api';

let isOnline = navigator.onLine;

async function handleOnline() {
  isOnline = true;
  showNotification('Internet connection restored', 'success');
  const result = await syncPendingActions();
  if (result.synced > 0) {
    showNotification(`Synced ${result.synced} pending action(s).`, 'success');
  } else if (result.remaining > 0) {
    showNotification('Some pending actions remain queued.', 'info');
  }
}

window.addEventListener('online', handleOnline);

window.addEventListener('offline', () => {
  isOnline = false;
  showNotification('You are offline. Some features may not work.');
});

if (navigator.onLine) {
  showNotification('Syncing pending actions...', 'info');
  const result = await syncPendingActions();
  if (result.synced > 0) {
    showNotification(`Synced ${result.synced} pending action(s).`, 'success');
  } else if (result.remaining > 0) {
    showNotification('Some pending actions remain queued.', 'info');
  }
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch (e) {
    return {};
  }
}

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function updateUserGreeting() {
  const user = getStoredUser();
  const username = user.name || user.username || 'Family';
  const gt = document.getElementById('greetingText');
  const ud = document.getElementById('usernameDisplay');
  if (gt) gt.textContent = getTimeGreeting();
  if (ud) ud.textContent = username;
}

function setActiveNavItem(page: string) {
  document.querySelectorAll('[data-page]').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-page') === page);
  });
}

const path = window.location.pathname;
const currentPage = path.split('/').pop()?.replace('.html', '') || 'dashboard';
setActiveNavItem(currentPage);
updateUserGreeting();

const hamburger = document.getElementById('hamburgerBtn');
const overlay = document.getElementById('mobileSidebarOverlay');
const mobileSidebar = document.getElementById('mobileSidebar');
const closeBtn = document.getElementById('closeSidebarBtn');

function openSidebar() {
  if (mobileSidebar) mobileSidebar.classList.add('open');
  if (overlay) overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  if (mobileSidebar) mobileSidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
  document.body.style.overflow = '';
}

if (hamburger) hamburger.addEventListener('click', openSidebar);
if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
if (overlay) overlay.addEventListener('click', closeSidebar);
document.querySelectorAll('.mobile-nav-item').forEach(l => l.addEventListener('click', closeSidebar));

const backBtn = document.getElementById('myBackButton');
if (backBtn) {
  backBtn.addEventListener('click', () => {
    window.history.back();
  });
}

async function loadKPIs() {
  try {
    const res = await fetch(API + '/dashboard/stats');
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error);
    
    const kpiTasks = document.getElementById('kpiTasks');
    const kpiMembers = document.getElementById('kpiMembers');
    const kpiSchedules = document.getElementById('kpiSchedules');
    const kpiUpcoming = document.getElementById('kpiUpcoming');
    const activityScore = document.getElementById('activityScore');
    
    if (kpiTasks) kpiTasks.textContent = String(data.stats.tasks).padStart(2, '0');
    if (kpiMembers) kpiMembers.textContent = String(data.stats.members).padStart(2, '0');
    if (kpiSchedules) kpiSchedules.textContent = String(data.stats.schedules).padStart(2, '0');
    if (kpiUpcoming) kpiUpcoming.textContent = String(data.stats.upcoming).padStart(2, '0');
    if (activityScore) activityScore.textContent = data.stats.tasks + ' pending · ' + data.stats.members + ' members';
  } catch (err) {
    console.error('KPI load error:', err);
  }
}

async function loadRecentTasks() {
  try {
    const res = await fetch(API + '/dashboard/recent-tasks');
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error);
    
    const tbody = document.getElementById('recentEventsBody');
    if (!tbody) return;
    
    if (!data.tasks || data.tasks.length === 0) {
      tbody.innerHTML = '<tr class="data-placeholder"><td colspan="3">No completed tasks yet</td></tr>';
      return;
    }
    
    tbody.innerHTML = data.tasks.map((t: any) => {
      const d = new Date(t.EventDate);
      const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      return `<tr><td>${t.EventName}</td><td>${dateStr}</td><td><span class="badge">Done</span></td></tr>`;
    }).join('');
  } catch (err) {
    console.error('Recent tasks error:', err);
  }
}

async function loadUpcomingTasks() {
  try {
    const res = await fetch(API + '/dashboard/upcoming-tasks');
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error);
    
    const tbody = document.getElementById('upcomingEventsBody');
    if (!tbody) return;
    
    if (!data.tasks || data.tasks.length === 0) {
      tbody.innerHTML = '<tr class="data-placeholder"><td colspan="3">No upcoming tasks</td></tr>';
      return;
    }
    
    tbody.innerHTML = data.tasks.map((t: any) => {
      const d = new Date((t.TaskDate || '').includes('T') ? t.TaskDate : t.TaskDate + 'T' + (t.TaskTime || '00:00'));
      const dtStr = d.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
      return `<tr><td>${t.EventName}</td><td>${dtStr}</td><td><span class="badge">${t.Username || '—'}</span></td></tr>`;
    }).join('');
  } catch (err) {
    console.error('Upcoming tasks error:', err);
  }
}

function showNotification(message: string, type: string = 'info') {
  const container = document.getElementById('notification-container');
  const msgSpan = document.getElementById('notification-message');
  if (!container || !msgSpan) return;
  
  msgSpan.textContent = message;
  container.className = 'notif-' + type;
  container.style.opacity = '1';
  container.style.pointerEvents = 'auto';

  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      container.style.opacity = '0';
      container.style.pointerEvents = 'none';
    }, 3000);
  }
}

loadKPIs();
loadRecentTasks();
loadUpcomingTasks();
