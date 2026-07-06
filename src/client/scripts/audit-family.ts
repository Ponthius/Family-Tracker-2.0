// ─────────────────────────────────────────────────────────────────────────────
//  Family Tracker — Audit Log (Family Admin)
//  audit-family.ts
//
//  Compile:
//    tsc audit-family.ts --target ES2017 --lib ES2017,DOM --ignoreConfig
// ─────────────────────────────────────────────────────────────────────────────

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuditLog {
  username: string;
  role    : string;
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

// ── Bootstrap ─────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', (): void => {

  const ROWS_PER_PAGE = 8;
  let currentPage = 1;

  // ── DOM References ───────────────────────────────────────────────────────────

  const auditTableBody = document.getElementById('auditTableBody') as HTMLTableSectionElement;
  const noAudit        = document.getElementById('noAudit')        as HTMLParagraphElement;
  const pagination     = document.getElementById('pagination')     as HTMLDivElement;
  const filterSearch   = document.getElementById('filterSearch')   as HTMLInputElement;
  const filterRole     = document.getElementById('filterRole')     as HTMLSelectElement;
  const filterAction   = document.getElementById('filterAction')   as HTMLSelectElement;
  const filterStatus   = document.getElementById('filterStatus')   as HTMLSelectElement;
  const filterDateFrom = document.getElementById('filterDateFrom') as HTMLInputElement;
  const filterDateTo   = document.getElementById('filterDateTo')   as HTMLInputElement;
  const clearFilterBtn = document.getElementById('clearFilterBtn') as HTMLButtonElement;

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const show = (el: HTMLElement): void => el.classList.remove('hidden');
  const hide = (el: HTMLElement): void => el.classList.add('hidden');

  function formatDate(str: string): string {
    if (!str) return '';
    return new Date(str).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  }

  // ── API Call ─────────────────────────────────────────────────────────────────

  async function fetchAuditLogs(): Promise<AuditResponse> {
    const params = new URLSearchParams({
      page    : String(currentPage),
      limit   : String(ROWS_PER_PAGE),
      search  : filterSearch.value.trim(),
      role    : filterRole.value,
      action  : filterAction.value,
      status  : filterStatus.value,
      dateFrom: filterDateFrom.value,
      dateTo  : filterDateTo.value,
    });
    const res = await fetch(`/api/audit/family?${params}`);
    if (!res.ok) throw new Error('Failed to load audit logs.');
    return await res.json() as AuditResponse;
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

  // ── Load ─────────────────────────────────────────────────────────────────────

  async function loadAuditLogs(): Promise<void> {
    auditTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-[#7a6e66] py-4">Loading...</td></tr>`;
    hide(noAudit);
    try {
      const { data, total } = await fetchAuditLogs();
      renderAuditTable(data, total);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[AuditLogs]', msg);
      auditTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-[#7a6e66] py-4">Failed to load audit logs.</td></tr>`;
    }
  }

  // ── Events ───────────────────────────────────────────────────────────────────

  ([filterSearch, filterRole, filterAction, filterStatus, filterDateFrom, filterDateTo] as HTMLElement[])
    .forEach(el => el.addEventListener('input', (): void => { currentPage = 1; loadAuditLogs(); }));

  clearFilterBtn.addEventListener('click', (): void => {
    filterSearch.value = filterRole.value = filterAction.value =
    filterStatus.value = filterDateFrom.value = filterDateTo.value = '';
    currentPage = 1;
    loadAuditLogs();
  });

  // ── Init ─────────────────────────────────────────────────────────────────────

  loadAuditLogs();

}); // end DOMContentLoaded
