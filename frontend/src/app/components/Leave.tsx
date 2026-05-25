import { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import { Plus, Check, X as XIcon } from 'lucide-react';
import { hrApi } from '../api';

const card = { boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)', borderRadius: 12 };
const STATUS_CFG: Record<string, { bg: string; color: string; label: string }> = {
  'Chờ duyệt': { bg: '#FEF3C7', color: '#92400E', label: 'Chờ duyệt' },
  'Đã duyệt': { bg: '#D1FAE5', color: '#065F46', label: 'Đã duyệt' },
  'Từ chối': { bg: '#FEE2E2', color: '#991B1B', label: 'Từ chối' },
};

export function Leave() {
  const location = useLocation();
  const [myLeaves, setMyLeaves] = useState<any[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [historyLeaves, setHistoryLeaves] = useState<any[]>([]);
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'mine' | 'pending' | 'history'>('mine');

  useEffect(() => {
    if (location.state && (location.state as any).tab) {
      setTab((location.state as any).tab);
    }
  }, [location.state]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ fromDate: '', toDate: '', lydo: '' });
  const [saving, setSaving] = useState(false);

  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
  // Cho phép Quản lý, Admin (Quản trị viên) và tài khoản staff chạy thử cục bộ được quyền Duyệt đơn nghỉ phép
  const isManager = 
    !user.tenVaiTro || 
    user.tenVaiTro === 'Quản lý' || 
    user.tenVaiTro === 'Quản trị viên' || 
    user.tenVaiTro === 'Admin' || 
    user.tenVaiTro === 'staff';

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      hrApi.getMyLeaves().catch(() => ({ data: [] })),
      hrApi.getLeaveBalance().catch(() => ({ data: null })),
      isManager ? hrApi.getPendingLeaves().catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
      isManager ? hrApi.getLeaveHistory().catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
    ]).then(([leaves, bal, pending, history]) => {
      setMyLeaves((leaves as any).data || []);
      setBalance((bal as any).data || null);
      setPendingLeaves((pending as any).data || []);
      setHistoryLeaves((history as any).data || []);
    }).finally(() => setLoading(false));
  };
  useEffect(fetchData, []);

  const handleCreate = async () => {
    if (!form.fromDate || !form.toDate) return;
    setSaving(true);
    try {
      await hrApi.createLeave({ fromDate: form.fromDate, toDate: form.toDate, lydo: form.lydo });
      setShowModal(false); setForm({ fromDate: '', toDate: '', lydo: '' }); fetchData();
    } catch(e: any) { alert(e.message); } finally { setSaving(false); }
  };

  const handleApprove = async (id: number) => { try { await hrApi.approveLeave(id); fetchData(); } catch(e: any) { alert(e.message); } };
  const handleReject = async (id: number) => { const r = prompt('Lý do từ chối?'); try { await hrApi.rejectLeave(id, r || ''); fetchData(); } catch(e: any) { alert(e.message); } };

  const fmtDate = (v: any) => { if (!v) return '—'; try { return new Date(v).toLocaleDateString('vi-VN'); } catch { return String(v); } };

  if (loading) return <div className="flex items-center justify-center h-64 text-[#6B7280]">Loading...</div>;

  return (
    <div className="space-y-5" style={{ fontFamily: 'Roboto, sans-serif' }}>
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] text-[#111827]" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>Nghỉ phép</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 text-white text-sm"
          style={{ backgroundColor: '#F97316', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>
          <Plus size={16} /> Tạo đơn
        </button>
      </div>

      {balance && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 text-center" style={card}>
            <p className="text-xs text-[#6B7280] mb-1">Phép còn lại</p>
            <p className="text-2xl" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: '#10B981' }}>{balance.conlai ?? '—'}</p>
          </div>
          <div className="bg-white p-5 text-center" style={card}>
            <p className="text-xs text-[#6B7280] mb-1">Tổng phép năm</p>
            <p className="text-2xl" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: '#3B82F6' }}>{balance.tongphep ?? '—'}</p>
          </div>
        </div>
      )}

      {isManager && (
        <div className="flex gap-2">
          <button onClick={() => setTab('mine')} className="px-4 py-2 text-sm" style={{ borderRadius: 8, border: `2px solid ${tab === 'mine' ? '#F97316' : '#E5E7EB'}`, backgroundColor: tab === 'mine' ? '#FFF0E6' : 'white', color: tab === 'mine' ? '#F97316' : '#6B7280', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>Đơn của tôi</button>
          <button onClick={() => setTab('pending')} className="px-4 py-2 text-sm flex items-center gap-1" style={{ borderRadius: 8, border: `2px solid ${tab === 'pending' ? '#F97316' : '#E5E7EB'}`, backgroundColor: tab === 'pending' ? '#FFF0E6' : 'white', color: tab === 'pending' ? '#F97316' : '#6B7280', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>
            Chờ duyệt {pendingLeaves.length > 0 && <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">{pendingLeaves.length}</span>}
          </button>
          <button onClick={() => setTab('history')} className="px-4 py-2 text-sm flex items-center gap-1" style={{ borderRadius: 8, border: `2px solid ${tab === 'history' ? '#F97316' : '#E5E7EB'}`, backgroundColor: tab === 'history' ? '#FFF0E6' : 'white', color: tab === 'history' ? '#F97316' : '#6B7280', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>
            Lịch sử duyệt
          </button>
        </div>
      )}

      <div className="bg-white overflow-hidden" style={card}>
        <table className="w-full">
          <thead><tr style={{ backgroundColor: '#F9FAFB' }}>
            {(tab === 'pending' || tab === 'history') && <th className="px-4 py-3 text-left text-xs font-medium text-[#6B7280]">Nhân viên</th>}
            <th className="px-4 py-3 text-left text-xs font-medium text-[#6B7280]">Từ ngày</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#6B7280]">Đến ngày</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-[#6B7280]">Số ngày</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#6B7280]">Lý do</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-[#6B7280]">Trạng thái</th>
            {tab === 'pending' && <th className="px-4 py-3 text-center text-xs font-medium text-[#6B7280]">Hành động</th>}
          </tr></thead>
          <tbody>
            {(tab === 'mine' ? myLeaves : tab === 'pending' ? pendingLeaves : historyLeaves).map((l: any, idx: number) => {
              const st = STATUS_CFG[l.trangthai] || { bg: '#F3F4F6', color: '#374151', label: l.trangthai || '?' };
              return (
                <tr key={l.madon || idx} style={{ backgroundColor: idx % 2 === 1 ? '#FAFAFA' : 'white' }}>
                  {(tab === 'pending' || tab === 'history') && <td className="px-4 py-3 border-t border-[#F3F4F6] text-sm text-[#111827]">{l.hoten_nhanvien || '—'}</td>}
                  <td className="px-4 py-3 border-t border-[#F3F4F6] text-sm text-[#6B7280]">{fmtDate(l.tungay)}</td>
                  <td className="px-4 py-3 border-t border-[#F3F4F6] text-sm text-[#6B7280]">{fmtDate(l.denngay)}</td>
                  <td className="px-4 py-3 border-t border-[#F3F4F6] text-center text-sm text-[#111827] font-medium">{l.songay || '—'}</td>
                  <td className="px-4 py-3 border-t border-[#F3F4F6] text-sm text-[#6B7280] max-w-[200px] truncate">{l.lydo || '—'}</td>
                  <td className="px-4 py-3 border-t border-[#F3F4F6] text-center"><span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: st.bg, color: st.color }}>{st.label}</span></td>
                  {tab === 'pending' && (
                    <td className="px-4 py-3 border-t border-[#F3F4F6] text-center">
                      <button onClick={() => handleApprove(l.madon)} className="p-1.5 rounded-lg hover:bg-green-50 text-[#10B981] mr-1"><Check size={15} /></button>
                      <button onClick={() => handleReject(l.madon)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#EF4444]"><XIcon size={15} /></button>
                    </td>
                  )}
                </tr>
              );
            })}
            {(tab === 'mine' ? myLeaves : tab === 'pending' ? pendingLeaves : historyLeaves).length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-[#9CA3AF]">Không có đơn nào</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-6" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.14)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 18, color: '#111827' }}>Tạo đơn nghỉ phép</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 text-[#6B7280]"><XIcon size={18} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-[#374151] mb-1">Từ ngày *</label><input type="date" value={form.fromDate} onChange={e => setForm(f => ({ ...f, fromDate: e.target.value }))} className="w-full px-3 py-2.5 text-sm" style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }} /></div>
                <div><label className="block text-sm font-medium text-[#374151] mb-1">Đến ngày *</label><input type="date" value={form.toDate} onChange={e => setForm(f => ({ ...f, toDate: e.target.value }))} className="w-full px-3 py-2.5 text-sm" style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }} /></div>
              </div>
              <div><label className="block text-sm font-medium text-[#374151] mb-1">Lý do</label><textarea value={form.lydo} onChange={e => setForm(f => ({ ...f, lydo: e.target.value }))} rows={3} className="w-full px-3 py-2.5 text-sm" style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none', resize: 'none' }} /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 text-sm text-[#374151] rounded-lg" style={{ border: '1.5px solid #E5E7EB', cursor: 'pointer', backgroundColor: 'white' }}>Hủy</button>
              <button onClick={handleCreate} disabled={saving} className="flex-1 py-2.5 text-sm text-white rounded-lg" style={{ backgroundColor: '#F97316', border: 'none', cursor: 'pointer' }}>{saving ? 'Đang gửi...' : 'Gửi đơn'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
