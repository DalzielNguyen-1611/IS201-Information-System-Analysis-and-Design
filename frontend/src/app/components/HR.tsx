import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Users, Clock } from 'lucide-react';
import { hrApi } from '../api';

const card = { boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)', borderRadius: 12 };
const ROLES: Record<string, { bg: string; color: string }> = {
  'Quản lý': { bg: '#FEF3C7', color: '#92400E' }, 'Thu ngân': { bg: '#D1FAE5', color: '#065F46' },
  'Nhân viên kho': { bg: '#DBEAFE', color: '#1E40AF' }, 'Kế toán': { bg: '#EDE9FE', color: '#5B21B6' },
};

export function HR() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [weeklyAttendance, setWeeklyAttendance] = useState<any[]>([]);
  const [attendanceDays, setAttendanceDays] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'list' | 'attendance'>('list');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ hoten: '', username: '', password: '', sdt: '', email: '', maVaiTro: 2, trangthai: 'Đang làm việc' });
  const [saving, setSaving] = useState(false);
 
  const fetchEmployees = () => {
    setLoading(true);
    hrApi.getEmployees()
      .then(d => setEmployees(Array.isArray(d) ? d : d.employees || []))
      .catch(err => {
        console.error(err);
        alert('Lỗi tải danh sách nhân viên: ' + (err.message || err));
      })
      .finally(() => setLoading(false));
  };
  const fetchAttendance = () => { 
    hrApi.getWeeklyAttendance()
      .then(d => {
        if (d && d.success) {
          setWeeklyAttendance(d.data || []);
          setAttendanceDays(d.days || []);
        } else {
          setWeeklyAttendance([]);
          setAttendanceDays([]);
        }
      })
      .catch(err => {
        console.error(err);
      });
  };
  useEffect(() => { fetchEmployees(); fetchAttendance(); }, []);

  const [showInactive, setShowInactive] = useState(false);
  const filtered = employees.filter((e: any) => {
    const matchSearch = !search || (e.hoten || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = showInactive || e.trangthai !== 'Đã nghỉ việc';
    return matchSearch && matchStatus;
  });

  const openAdd = () => { setForm({ hoten: '', username: '', password: '', sdt: '', email: '', maVaiTro: 2, trangthai: 'Đang làm việc' }); setEditId(null); setShowModal(true); };
  const openEdit = (e: any) => {
    setForm({ hoten: e.hoten, username: e.username, password: '', sdt: e.sdt || '', email: e.email || '', maVaiTro: e.mavaitro || 2, trangthai: e.trangthai || 'Đang làm việc' });
    setEditId(e.manhanvien); setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.hoten || (!editId && !form.username)) return;
    setSaving(true);
    try {
      if (editId) {
        await hrApi.updateEmployee(editId, { hoten: form.hoten, sdt: form.sdt, email: form.email, maVaiTro: form.maVaiTro, trangthai: form.trangthai });
      } else {
        await hrApi.register({ hoten: form.hoten, username: form.username, password: form.password || '123456', sdt: form.sdt, email: form.email, maVaiTro: form.maVaiTro });
      }
      setShowModal(false); fetchEmployees();
    } catch(e: any) { alert(e.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa nhân viên này?')) return;
    try { await hrApi.deleteEmployee(id); fetchEmployees(); } catch(e: any) { alert(e.message); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-[#6B7280]">Loading...</div>;

  return (
    <div className="space-y-5" style={{ fontFamily: 'Roboto, sans-serif' }}>
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] text-[#111827]" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>Nhân sự</h1>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 text-white text-sm"
          style={{ backgroundColor: '#F97316', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>
          <Plus size={16} /> Thêm NV
        </button>
      </div>

      <div className="flex gap-2">
        {([{ key: 'list', icon: Users, label: 'Danh sách' }, { key: 'attendance', icon: Clock, label: 'Chấm công tuần' }] as const).map(t => {
          const Icon = t.icon; const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} className="flex items-center gap-2 px-4 py-2.5 text-sm"
              style={{ borderRadius: 8, border: `2px solid ${active ? '#F97316' : '#E5E7EB'}`, backgroundColor: active ? '#FFF0E6' : 'white', color: active ? '#F97316' : '#6B7280', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>
              <Icon size={16} />{t.label}
            </button>
          );
        })}
      </div>

      {tab === 'list' && (<>
        <div className="bg-white p-4 flex items-center justify-between gap-4" style={card}>
          <div className="relative flex-shrink-0">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm nhân viên..." className="pl-9 pr-4 py-2 text-sm text-[#111827]" style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none', width: 280 }} />
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-[#6B7280] cursor-pointer hover:text-[#111827] transition-all">
            <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} className="rounded text-[#F97316] w-4 h-4 cursor-pointer" />
            Hiển thị nhân viên đã nghỉ việc
          </label>
        </div>
        <div className="bg-white overflow-hidden" style={card}>
          <table className="w-full">
            <thead><tr style={{ backgroundColor: '#F9FAFB' }}>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#6B7280]">Nhân viên</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#6B7280]">Username</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#6B7280]">SĐT</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-[#6B7280]">Vai trò</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-[#6B7280]">Trạng thái</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-[#6B7280]">Hành động</th>
            </tr></thead>
            <tbody>
              {filtered.map((e: any, idx: number) => {
                const rc = ROLES[e.tenvaitro] || { bg: '#F3F4F6', color: '#374151' };
                return (
                  <tr key={e.manhanvien} style={{ backgroundColor: idx % 2 === 1 ? '#FAFAFA' : 'white' }}
                    onMouseEnter={ev => (ev.currentTarget.style.backgroundColor = '#FFF0E6')} onMouseLeave={ev => (ev.currentTarget.style.backgroundColor = idx % 2 === 1 ? '#FAFAFA' : 'white')}>
                    <td className="px-4 py-3 border-t border-[#F3F4F6]">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0" style={{ backgroundColor: '#F97316', fontWeight: 700 }}>{(e.hoten || 'N').charAt(0)}</div>
                        <span className="text-sm font-semibold text-[#111827]">{e.hoten}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-t border-[#F3F4F6] text-sm text-[#6B7280]">{e.username}</td>
                    <td className="px-4 py-3 border-t border-[#F3F4F6] text-sm text-[#6B7280]">{e.sdt || '—'}</td>
                    <td className="px-4 py-3 border-t border-[#F3F4F6] text-center"><span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: rc.bg, color: rc.color }}>{e.tenvaitro}</span></td>
                    <td className="px-4 py-3 border-t border-[#F3F4F6] text-center"><span className="px-2 py-0.5 rounded-full text-xs font-medium" style={e.trangthai === 'Đang làm việc' ? { backgroundColor: '#D1FAE5', color: '#065F46' } : { backgroundColor: '#FEE2E2', color: '#991B1B' }}>{e.trangthai}</span></td>
                    <td className="px-4 py-3 border-t border-[#F3F4F6] text-center">
                      <button onClick={() => openEdit(e)} className="p-1.5 rounded-lg hover:bg-blue-50 text-[#3B82F6] mr-1"><Edit2 size={15} /></button>
                      <button onClick={() => handleDelete(e.manhanvien)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#EF4444]"><Trash2 size={15} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>)}

      {tab === 'attendance' && (
        <div className="bg-white overflow-hidden" style={card}>
          <div className="p-5 text-center text-sm text-[#6B7280]">
            {weeklyAttendance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr style={{ backgroundColor: '#F9FAFB' }}>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Nhân viên</th>
                      {attendanceDays.map((dayStr) => {
                        const dateObj = new Date(dayStr);
                        const weekdayStr = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][dateObj.getDay()];
                        const formattedDate = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                        return (
                          <th key={dayStr} className="px-2 py-3 text-center text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                            <div className="flex flex-col items-center">
                              <span className="text-gray-500 font-bold">{weekdayStr}</span>
                              <span className="text-[10px] text-gray-400 font-normal">{formattedDate}</span>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {weeklyAttendance.map((emp: any, idx: number) => (
                      <tr 
                        key={emp.manhanvien || idx} 
                        style={{ backgroundColor: idx % 2 === 1 ? '#FAFAFA' : 'white' }}
                        onMouseEnter={ev => (ev.currentTarget.style.backgroundColor = '#FFF0E6')} 
                        onMouseLeave={ev => (ev.currentTarget.style.backgroundColor = idx % 2 === 1 ? '#FAFAFA' : 'white')}
                      >
                        <td className="px-4 py-4 text-left whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#F97316' }}>
                              {(emp.hoten || 'N').charAt(0)}
                            </div>
                            <span className="text-sm font-semibold text-[#111827]">{emp.hoten}</span>
                          </div>
                        </td>
                        {attendanceDays.map((dayStr) => {
                          const isPresent = emp.attendance && emp.attendance[dayStr];
                          return (
                            <td key={dayStr} className="px-2 py-4 text-center whitespace-nowrap">
                              {isPresent ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 font-bold text-sm" title="Có mặt">
                                  ✓
                                </span>
                              ) : (
                                <span className="text-gray-300 font-bold">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-400 py-6">Chưa có dữ liệu chấm công tuần</p>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-6" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.14)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 18, color: '#111827' }}>{editId ? 'Sửa nhân viên' : 'Thêm nhân viên'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 text-[#6B7280]"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-[#374151] mb-1">Họ tên *</label><input value={form.hoten} onChange={e => setForm(f => ({ ...f, hoten: e.target.value }))} className="w-full px-3 py-2.5 text-sm" style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }} /></div>
              {!editId && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium text-[#374151] mb-1">Username *</label><input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className="w-full px-3 py-2.5 text-sm" style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }} /></div>
                  <div><label className="block text-sm font-medium text-[#374151] mb-1">Mật khẩu</label><input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="123456" className="w-full px-3 py-2.5 text-sm" style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }} /></div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-[#374151] mb-1">SĐT</label><input value={form.sdt} onChange={e => setForm(f => ({ ...f, sdt: e.target.value }))} className="w-full px-3 py-2.5 text-sm" style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }} /></div>
                <div><label className="block text-sm font-medium text-[#374151] mb-1">Email</label><input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2.5 text-sm" style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }} /></div>
              </div>
              <div className={editId ? "grid grid-cols-2 gap-3" : ""}>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">Vai trò</label>
                  <select value={form.maVaiTro} onChange={e => setForm(f => ({ ...f, maVaiTro: Number(e.target.value) }))} className="w-full px-3 py-2.5 text-sm" style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}>
                    <option value={1}>Quản lý</option><option value={2}>Thu ngân</option><option value={3}>Nhân viên kho</option><option value={4}>Kế toán</option>
                  </select>
                </div>
                {editId && (
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-1">Trạng thái</label>
                    <select value={form.trangthai} onChange={e => setForm(f => ({ ...f, trangthai: e.target.value }))} className="w-full px-3 py-2.5 text-sm" style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}>
                      <option value="Đang làm việc">Đang làm việc</option>
                      <option value="Đã nghỉ việc">Đã nghỉ việc</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 text-sm text-[#374151] rounded-lg" style={{ border: '1.5px solid #E5E7EB', cursor: 'pointer', backgroundColor: 'white' }}>Hủy</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 text-sm text-white rounded-lg" style={{ backgroundColor: '#F97316', border: 'none', cursor: 'pointer' }}>{saving ? 'Đang lưu...' : 'Lưu'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
