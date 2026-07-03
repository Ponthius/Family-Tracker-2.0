// ─────────────────────────────────────────────────────────────────────────────
//  Family Tracker — System Audit (Super Admin)
//  audit-super.ts
//
//  Compile:
//    tsc audit-super.ts --target ES2017 --lib ES2017,DOM --ignoreConfig
// ─────────────────────────────────────────────────────────────────────────────

// ── Types ─────────────────────────────────────────────────────────────────────

interface FamilyOverview {
  family_name   : string;
  admin_username: string;
  member_count  : number;
  status        : string;
  date_created  : string;
  last_activity : string | null;
}

interface AuditLog {
  username: string;
  role    : string;
  family  : string | null;
  action  : string;
  date    : string;
  time    : string;
  status  : 'Success' | 'Failed';
}

interface AuditResponse {
  total: number;
  page : number;
  limit: number;
  data : AuditLog[];
}

interface FamilyOverviewResponse {
  data: FamilyOverview[];
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', (): void => {

  const ROWS_PER_PAGE = 8;
  let currentPage  = 1;
  let totalRecords = 0;

  // ── DOM References ───────────────────────────────────────────────────────────

  const familyTableBody = document.getElementById('familyTableBody') as HTMLTableSectionElement;
  const auditTableBody  = document.getElementById('auditTableBody')  as HTMLTableSectionElement;
  const noFamilies      = document.getElementById('noFamilies')      as HTMLParagraphElement;
  const noAudit         = document.getElementById('noAudit')         as HTMLParagraphElement;
  const auditPanelTitle = document.getElementById('auditPanelTitle') as HTMLHeadingElement;
  const pagination      = document.getElementById('pagination')      as HTMLDivElement;
  const familySearch    = document.getElementById('familySearch')    as HTMLInputElement;
  const filterSearch    = document.getElementById('filterSearch')    as HTMLInputElement;
  const filterFamily    = document.getElementById('filterFamily')    as HTMLSelectElement;
  const filterRole      = document.getElementById('filterRole')      as HTMLSelectElement;
  const filterAction    = document.getElementById('filterAction')    as HTMLSelectElement;
  const filterStatus    = document.getElementById('filterStatus')    as HTMLSelectElement;
  const filterDateFrom  = document.getElementById('filterDateFrom')  as HTMLInputElement;
  const filterDateTo    = document.getElementById('filterDateTo')    as HTMLInputElement;
  const clearFilterBtn  = document.getElementById('clearFilterBtn')  as HTMLButtonElement;

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const show = (el: HTMLElement): void => el.classList.remove('hidden');
  const hide = (el: HTMLElement): void => el.classList.add('hidden');

  function formatDate(str: string | null): string {
    if (!str) return '';
    return new Date(str).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  }

  function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // ── API Calls ────────────────────────────────────────────────────────────────

  async function fetchFamilyOverview(search: string = ''): Promise<FamilyOverview[]> {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    const res = await fetch(`/api/audit/families-overview?${params}`);
    if (!res.ok) throw new Error('Failed to load family overview.');
    const json: FamilyOverviewResponse = await res.json();
    return json.data;
  }

  async function fetchAuditLogs(): Promise<AuditResponse> {
    const params = new URLSearchParams({
      page    : String(currentPage),
      limit   : String(ROWS_PER_PAGE),
      search  : filterSearch.value.trim(),
      family  : filterFamily.value,
      role    : filterRole.value,
      action  : filterAction.value,
      status  : filterStatus.value,
      dateFrom: filterDateFrom.value,
      dateTo  : filterDateTo.value,
    });
    const res = await fetch(`/api/audit/all?${params}`);
    if (!res.ok) throw new Error('Failed to load audit logs.');
    return await res.json() as AuditResponse;
  }

  // ── Render: Family Overview Table ────────────────────────────────────────────

  function renderFamilyTable(list: FamilyOverview[]): void {
    familyTableBody.innerHTML = '';
    if (!list || list.length === 0) { show(noFamilies); return; }
    hide(noFamilies);

    list.forEach((f: FamilyOverview) => {
      const isActive   = f.status === 'active';
      const badgeClass = isActive
        ? 'bg-[#dff0d8] text-[#3c5a3c]'
        : 'bg-[#fef3cd] text-[#7a5a10]';
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-[#f0ebe3] transition-colors';
      tr.innerHTML = `
        <td class="px-3 py-[10px] border-b border-[#ddd4c8]">${f.family_name}</td>
        <td class="px-3 py-[10px] border-b border-[#ddd4c8]">${f.admin_username}</td>
        <td class="px-3 py-[10px] border-b border-[#ddd4c8]">${f.member_count}</td>
        <td class="px-3 py-[10px] border-b border-[#ddd4c8]">
          <span class="inline-block px-[9px] py-[2px] rounded-full text-[0.75rem] font-semibold ${badgeClass}">${capitalize(f.status)}</span>
        </td>
        <td class="px-3 py-[10px] border-b border-[#ddd4c8] whitespace-nowrap">${formatDate(f.date_created)}</td>
        <td class="px-3 py-[10px] border-b border-[#ddd4c8] whitespace-nowrap">${formatDate(f.last_activity) || '—'}</td>
        <td class="px-3 py-[10px] border-b border-[#ddd4c8]">
          <button class="text-[#5a4038] text-[0.84rem] underline cursor-pointer bg-none border-none hover:text-[#2c2420]"
                  data-family="${f.family_name}">View Logs</button>
        </td>
      `;
      familyTableBody.appendChild(tr);
    });

    familyTableBody.querySelectorAll<HTMLButtonElement>('button[data-family]').forEach(btn => {
      btn.addEventListener('click', (): void => {
        const fam = btn.getAttribute('data-family') ?? '';
        filterFamily.value = fam;
        auditPanelTitle.textContent = `Audit Logs — ${fam}`;
        currentPage = 1;
        loadAuditLogs();
        auditPanelTitle.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  // ── Render: Audit Table ──────────────────────────────────────────────────────

  function renderAuditTable(data: AuditLog[], total: number): void {
    auditTableBody.innerHTML = '';
    if (!data || data.length === 0) { show(noAudit); renderPagination(0); return; }
    hide(noAudit);

    data.forEach((log: AuditLog) => {
      const isSuccess  = log.status === 'Success';
      const badgeClass = isSuccess ? 'bg-[#dff0d8] text-[#3c5a3c]' : 'bg-[#f0dede] text-[#7a2020]';
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-[#f0ebe3] transition-colors';
      tr.innerHTML = `
        <td class="px-3 py-[10px] border-b border-[#ddd4c8]">${log.username}</td>
        <td class="px-3 py-[10px] border-b border-[#ddd4c8]">
          <span class="inline-block px-[9px] py-[2px] rounded-full text-[0.75rem] bg-[#ece1d2] text-[#5a4038] capitalize">${log.role.replace(/_/g, ' ')}</span>
        </td>
        <td class="px-3 py-[10px] border-b border-[#ddd4c8]">${log.family || '—'}</td>
        <td class="px-3 py-[10px] border-b border-[#ddd4c8]">${log.action}</td>
        <td class="px-3 py-[10px] border-b border-[#ddd4c8] whitespace-nowrap">${formatDate(log.date)}</td>
        <td class="px-3 py-[10px] border-b border-[#ddd4c8] whitespace-nowrap">${log.time}</td>
        <td class="px-3 py-[10px] border-b border-[#ddd4c8]">
          <span class="inline-block px-[9px] py-[2px] rounded-full text-[0.75rem] font-semibold ${badgeClass}">${log.status}</span>
        </td>
      `;
      auditTableBody.appendChild(tr);
    });

    renderPagination(total);
  }

  // ── Pagination ───────────────────────────────────────────────────────────────

  function renderPagination(total: number): void {
    pagination.innerHTML = '';
    const totalPages = Math.ceil(total / ROWS_PER_PAGE);
    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      const isActive = i === currentPage;
      btn.className = `px-3 py-[6px] rounded-md border text-[0.82rem] cursor-pointer transition-colors
        ${isActive ? 'bg-[#3d3530] text-[#f5f1ec] border-[#3d3530]' : 'bg-[#faf8f5] text-[#5a4e46] border-[#c8bfb5] hover:bg-[#ece6dd]'}`;
      btn.textContent = String(i);
      btn.addEventListener('click', (): void => { currentPage = i; loadAuditLogs(); });
      pagination.appendChild(btn);
    }
  }

  // ── Load Helpers ─────────────────────────────────────────────────────────────

  async function loadFamilyOverview(search: string = ''): Promise<void> {
    try {
      const data = await fetchFamilyOverview(search);
      filterFamily.innerHTML = '<option value="">All Families</option>';
      data.forEach((f: FamilyOverview) => {
        const opt = document.createElement('option');
        opt.value = f.family_name;
        opt.textContent = f.family_name;
        filterFamily.appendChild(opt);
      });
      renderFamilyTable(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[FamilyOverview]', msg);
      familyTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-[#7a6e66] py-4">Failed to load family accounts.</td></tr>`;
    }
  }

  async function loadAuditLogs(): Promise<void> {
    auditTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-[#7a6e66] py-4">Loading...</td></tr>`;
    hide(noAudit);
    try {
      const { data, total } = await fetchAuditLogs();
      totalRecords = total;
      renderAuditTable(data, total);
      const noFilter =
        !filterFamily.value && !filterRole.value && !filterAction.value &&
        !filterStatus.value && !filterDateFrom.value && !filterDateTo.value &&
        !filterSearch.value.trim();
      if (noFilter) auditPanelTitle.textContent = 'All Audit Logs';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[AuditLogs]', msg);
      auditTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-[#7a6e66] py-4">Failed to load audit logs.</td></tr>`;
    }
  }

  // ── Events ───────────────────────────────────────────────────────────────────

  familySearch.addEventListener('input', (): void => {
    loadFamilyOverview(familySearch.value.trim());
  });

  ([filterSearch, filterFamily, filterRole, filterAction, filterStatus, filterDateFrom, filterDateTo] as HTMLElement[])
    .forEach(el => el.addEventListener('input', (): void => { currentPage = 1; loadAuditLogs(); }));

  clearFilterBtn.addEventListener('click', (): void => {
    filterSearch.value = filterFamily.value = filterRole.value =
    filterAction.value = filterStatus.value = filterDateFrom.value = filterDateTo.value = '';
    auditPanelTitle.textContent = 'All Audit Logs';
    currentPage = 1;
    loadAuditLogs();
  });

  // ── Init ─────────────────────────────────────────────────────────────────────

  loadFamilyOverview();
  loadAuditLogs();

}); // end DOMContentLoaded
