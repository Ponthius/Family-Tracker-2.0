// src/schedules.ts

// --- 1. Data Models (Contracts) ---
interface ScheduleEvent {
  role: string;
  username: string;
  eventName: string;
  eventDate: string; // ISO 8601
  status: 'Occupied' | 'Unoccupied';
  description?: string;
}

interface Member {
 role: string;
 username: string;
}

// --- 2. State & DOM Cache ---
const API_BASE = '/api';
let events: ScheduleEvent[] = [];

// Strongly typed DOM references
const scheduleBody = document.getElementById('scheduleBody') as HTMLTableSectionElement;
const searchInput = document.getElementById('searchInput') as HTMLInputElement;
const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;

// --- 3. UI Helpers ---
const formatDate = (d: string): string => 
new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

const formatTime = (d: string): string => 
new Date(d).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

// --- 4. Logic Implementation ---
function renderTable(list: ScheduleEvent[]): void {
  scheduleBody.innerHTML = '';
                        
  if (list.length === 0) {
    document.getElementById('noResults')?.classList.remove('hidden');
    return;
 }
 document.getElementById('noResults')?.classList.add('hidden');

 list.forEach((ev: ScheduleEvent) => {
   const tr = document.createElement('tr');
                                                
   // Create cells securely to prevent XSS
   const cellData = [
     ev.role, 
     ev.username, 
     ev.eventName, 
     formatDate(ev.eventDate), 
     formatTime(ev.eventDate), 
     ev.status
 ];

 cellData.forEach(text => {       
   const td = document.createElement('td');
   td.textContent = text;
   tr.appendChild(td);
 });

 scheduleBody.appendChild(tr);
 });
}

// --- 5. Network Layer ---
async function loadEvents(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/events`);
    if (!response.ok) throw new Error('Failed to fetch events');
                                                                                                                                              
   const data = await response.json();
   events = data.events || [];
   renderTable(events);
} catch (err) {
  console.error('Data sync error:', err);
}
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  loadEvents();
 });
