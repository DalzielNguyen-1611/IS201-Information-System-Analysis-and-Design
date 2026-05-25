const BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = {};
  const t = getToken();
  if (t) h['Authorization'] = `Bearer ${t}`;
  return h;
}

function jsonHeaders(): Record<string, string> {
  return { 'Content-Type': 'application/json', ...authHeaders() };
}

async function request<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).error || (data as any).message || 'Request failed');
  return data as T;
}

// ─── Auth ───────────────────────────────────────────────
export const authApi = {
  login: (username: string, password: string) =>
    request('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) }),
};

// ─── Dashboard ──────────────────────────────────────────
export const dashboardApi = {
  getStats: (type?: string) => request(`/dashboard/stats${type ? `?type=${type}` : ''}`),
};

// ─── Products ───────────────────────────────────────────
export const productApi = {
  getAll: () => request('/products'),
  create: (formData: FormData) =>
    request('/products', { method: 'POST', headers: authHeaders(), body: formData }),
  update: (id: number, formData: FormData) =>
    request(`/products/${id}`, { method: 'PUT', headers: authHeaders(), body: formData }),
  deactivate: (id: number) =>
    request(`/products/${id}/deactivate`, { method: 'PATCH', headers: jsonHeaders() }),
  
  // Các hàm API cho Dịch vụ (DICH_VU)
  getAllServices: () => request('/products/services', { headers: authHeaders() }),
  createService: (data: any) =>
    request('/products/services', { method: 'POST', headers: jsonHeaders(), body: JSON.stringify(data) }),
  updateService: (id: number, data: any) =>
    request(`/products/services/${id}`, { method: 'PUT', headers: jsonHeaders(), body: JSON.stringify(data) }),
  deactivateService: (id: number) =>
    request(`/products/services/${id}/deactivate`, { method: 'PATCH', headers: jsonHeaders() }),
  deleteService: (id: number) =>
    request(`/products/services/${id}`, { method: 'DELETE', headers: jsonHeaders() }),
};

// ─── POS ────────────────────────────────────────────────
export const posApi = {
  getProducts: (keyword?: string, loaiSanPham?: string) => {
    const params = new URLSearchParams();
    if (keyword) params.set('keyword', keyword);
    if (loaiSanPham) params.set('loaiSanPham', loaiSanPham);
    return request(`/pos/products?${params}`);
  },
  findCustomer: (sdt: string) => request(`/pos/customer?sdt=${encodeURIComponent(sdt)}`),
  holdOrder: (data: any) => request('/pos/hold', { method: 'POST', headers: jsonHeaders(), body: JSON.stringify(data) }),
  cancelHold: (id: number) => request(`/pos/hold/${id}`, { method: 'DELETE', headers: jsonHeaders() }),
  getHoldOrders: () => request('/pos/hold-orders'),
  getHoldOrderDetail: (id: number) => request(`/pos/hold-orders/${id}`),
  checkout: (data: any) => request('/pos/checkout', { method: 'POST', headers: jsonHeaders(), body: JSON.stringify(data) }),
};

// ─── Customers ──────────────────────────────────────────
export const customerApi = {
  getAll: () => request('/customers'),
  create: (data: { name: string; phone: string; address?: string }) =>
    request('/customers', { method: 'POST', headers: jsonHeaders(), body: JSON.stringify(data) }),
  getPets: (customerId: number) => request(`/customers/${customerId}/pets`),
  createPet: (customerId: number, data: { tenThuCung: string; loaiThuCung: string; gioiTinh: string }) =>
    request(`/customers/${customerId}/pets`, { method: 'POST', headers: jsonHeaders(), body: JSON.stringify(data) }),
  update: (id: number, data: any) =>
    request(`/customers/${id}`, { method: 'PUT', headers: jsonHeaders(), body: JSON.stringify(data) }),
  toggleStatus: (id: number, status: number) =>
    request(`/customers/${id}/status`, { method: 'PUT', headers: jsonHeaders(), body: JSON.stringify({ trangthai: status }) }),
};

// ─── Inventory ──────────────────────────────────────────
export const inventoryApi = {
  getAll: () => request('/inventory'),
  importStock: (data: any) => request('/inventory/import', { method: 'POST', headers: jsonHeaders(), body: JSON.stringify(data) }),
  check: (data: any) => request('/inventory/check', { method: 'POST', headers: jsonHeaders(), body: JSON.stringify(data) }),
  getChecks: () => request('/inventory/checks'),
  getImports: () => request('/inventory/imports'),
  getImportDetail: (id: number) => request(`/inventory/imports/${id}`),
  getSuppliers: () => request('/inventory/suppliers'),
  getSuppliersDetailed: () => request('/inventory/suppliers/detailed'),
  createSupplier: (data: any) => request('/inventory/suppliers', { method: 'POST', headers: jsonHeaders(), body: JSON.stringify(data) }),
  updateSupplier: (id: number, data: any) => request(`/inventory/suppliers/${id}`, { method: 'PUT', headers: jsonHeaders(), body: JSON.stringify(data) }),
  toggleSupplierStatus: (id: number, status: number) => request(`/inventory/suppliers/${id}/status`, { method: 'PUT', headers: jsonHeaders(), body: JSON.stringify({ trangthai: status }) }),
  deleteImport: (id: number) => request(`/inventory/imports/${id}`, { method: 'DELETE', headers: jsonHeaders() }),
  approveImport: (id: number) => request(`/inventory/imports/${id}/approve`, { method: 'PUT', headers: jsonHeaders() }),
  receiveImport: (id: number) => request(`/inventory/imports/${id}/receive`, { method: 'PUT', headers: jsonHeaders() }),
  payImport: (id: number) => request(`/inventory/imports/${id}/pay`, { method: 'PUT', headers: jsonHeaders() }),
};

// ─── HR ─────────────────────────────────────────────────
export const hrApi = {
  getEmployees: () => request('/hr/employees', { headers: jsonHeaders() }),
  register: (data: any) => request('/hr/register', { method: 'POST', headers: jsonHeaders(), body: JSON.stringify(data) }),
  updateEmployee: (id: number, data: any) =>
    request(`/hr/employees/${id}`, { method: 'PUT', headers: jsonHeaders(), body: JSON.stringify(data) }),
  deleteEmployee: (id: number) =>
    request(`/hr/employees/${id}`, { method: 'DELETE', headers: jsonHeaders() }),
  getWeeklyAttendance: () => request('/hr/employees/weekly-attendance', { headers: jsonHeaders() }),
  // Leaves
  createLeave: (data: any) => request('/hr/leaves', { method: 'POST', headers: jsonHeaders(), body: JSON.stringify(data) }),
  getMyLeaves: () => request('/hr/my-leaves', { headers: jsonHeaders() }),
  getLeaveBalance: () => request('/hr/leave-balance', { headers: jsonHeaders() }),
  getPendingLeaves: () => request('/hr/leaves/pending', { headers: jsonHeaders() }),
  getLeaveHistory: () => request('/hr/leaves/history', { headers: jsonHeaders() }),
  approveLeave: (id: number) => request(`/hr/leaves/${id}/approve`, { method: 'PUT', headers: jsonHeaders() }),
  rejectLeave: (id: number, reason?: string) =>
    request(`/hr/leaves/${id}/reject`, { method: 'PUT', headers: jsonHeaders(), body: JSON.stringify({ reason }) }),
};

// ─── Attendance ─────────────────────────────────────────
export const attendanceApi = {
  checkIn: () => request('/attendance/check-in', { method: 'POST', headers: jsonHeaders() }),
  checkOut: () => request('/attendance/check-out', { method: 'POST', headers: jsonHeaders() }),
  getMyRecords: (month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (month && year) params.set('thangnam', `${String(month).padStart(2, '0')}/${year}`);
    return request(`/attendance/my-records?${params}`, { headers: jsonHeaders() });
  },
  getAllRecords: (month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (month && year) params.set('thangnam', `${String(month).padStart(2, '0')}/${year}`);
    return request(`/attendance/all-records?${params}`, { headers: jsonHeaders() });
  },
  editRecord: (id: number, data: any) =>
    request(`/attendance/edit/${id}`, { method: 'PUT', headers: jsonHeaders(), body: JSON.stringify(data) }),
  getEditHistory: (id: number) => request(`/attendance/history/${id}`, { headers: jsonHeaders() }),
};

// ─── Payroll ────────────────────────────────────────────
export const payrollApi = {
  calculate: (month: number, year: number) =>
    request('/payroll/calculate', { method: 'POST', headers: jsonHeaders(), body: JSON.stringify({ thangnam: `${String(month).padStart(2, '0')}/${year}` }) }),
  getRecords: (month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (month && year) params.set('thangnam', `${String(month).padStart(2, '0')}/${year}`);
    return request(`/payroll?${params}`, { headers: jsonHeaders() });
  },
  getSalaryProfile: (employeeId: number) => request(`/payroll/profile/${employeeId}`, { headers: jsonHeaders() }),
  upsertSalaryProfile: (employeeId: number, data: any) =>
    request(`/payroll/profile/${employeeId}`, { method: 'PUT', headers: jsonHeaders(), body: JSON.stringify(data) }),
  approve: (id: number) => request(`/payroll/approve/${id}`, { method: 'PUT', headers: jsonHeaders() }),
  approveAll: (month: number, year: number) =>
    request('/payroll/approve-all', { method: 'PUT', headers: jsonHeaders(), body: JSON.stringify({ thangnam: `${String(month).padStart(2, '0')}/${year}` }) }),
  pay: (id: number) => request(`/payroll/pay/${id}`, { method: 'PUT', headers: jsonHeaders() }),
  getGlobalConfig: () => request('/payroll/settings/config', { headers: jsonHeaders() }),
  updateGlobalConfig: (data: any) =>
    request('/payroll/settings/config', { method: 'PUT', headers: jsonHeaders(), body: JSON.stringify(data) }),
};

// ─── Bookings (Spa & Appointments) ─────────────────────
export const bookingApi = {
  getAll: () => request('/bookings'),
  create: (data: any) => request('/bookings', { method: 'POST', headers: jsonHeaders(), body: JSON.stringify(data) }),
  update: (id: number, data: any) => request(`/bookings/${id}`, { method: 'PUT', headers: jsonHeaders(), body: JSON.stringify(data) }),
  cancel: (id: number) => request(`/bookings/${id}`, { method: 'DELETE', headers: jsonHeaders() }),
  getServices: () => request('/bookings/services'),
  getPets: (customerId: number) => request(`/bookings/customer-pets/${customerId}`),
};

