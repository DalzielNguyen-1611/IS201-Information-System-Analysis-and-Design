import { useState, useEffect } from 'react';
import { Clock, LogIn, LogOut, CalendarDays } from 'lucide-react';
import { attendanceApi } from '../api';

const card = { boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)', borderRadius: 12 };

export function Attendance() {
  const [now, setNow] = useState(new Date());
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const fetchRecords = () => {
    setLoading(true);
    attendanceApi.getMyRecords(now.getMonth() + 1, now.getFullYear())
      .then(d => setRecords(d.data || d.records || d || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };
  useEffect(fetchRecords, []);

  const handleCheckIn = async () => { setCheckingIn(true); try { await attendanceApi.checkIn(); fetchRecords(); alert('Check-in thành công!'); } catch(e: any) { alert(e.message); } finally { setCheckingIn(false); } };
  const handleCheckOut = async () => { setCheckingOut(true); try { await attendanceApi.checkOut(); fetchRecords(); alert('Check-out thành công!'); } catch(e: any) { alert(e.message); } finally { setCheckingOut(false); } };

  const pad = (n: number) => String(n).padStart(2, '0');
  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const dateStr = now.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();

  const fmtTime = (v: any) => {
    if (!v) return '—';
    if (typeof v === 'string') return v;
    try { const d = new Date(v); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; } catch { return '—'; }
  };
  const fmtDate = (v: any) => {
    if (!v) return '—';
    try { const d = new Date(v); return d.toLocaleDateString('vi-VN'); } catch { return String(v); }
  };

  return (
    <div className="space-y-5" style={{ fontFamily: 'Roboto, sans-serif' }}>
      <h1 className="text-[22px] text-[#111827]" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>Chấm công</h1>

      <div className="bg-white p-8 text-center" style={card}>
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: '#F97316' }}>{(user.hoTen || 'U').charAt(0)}</div>
          <div className="text-left"><p className="text-sm font-semibold text-[#111827]">{user.hoTen || 'Nhân viên'}</p><p className="text-xs text-[#6B7280]">{dateStr}</p></div>
        </div>
        <div className="mb-6">
          <p className="text-5xl tracking-wider" style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#111827' }}>{timeStr}</p>
        </div>
        <div className="flex gap-4 justify-center">
          <button onClick={handleCheckIn} disabled={checkingIn}
            className="flex items-center gap-2 px-8 py-3 text-white text-sm"
            style={{ backgroundColor: '#10B981', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 15 }}>
            <LogIn size={18} />{checkingIn ? 'Đang xử lý...' : 'CHECK IN'}
          </button>
          <button onClick={handleCheckOut} disabled={checkingOut}
            className="flex items-center gap-2 px-8 py-3 text-white text-sm"
            style={{ backgroundColor: '#EF4444', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 15 }}>
            <LogOut size={18} />{checkingOut ? 'Đang xử lý...' : 'CHECK OUT'}
          </button>
        </div>
      </div>

      <div className="bg-white overflow-hidden" style={card}>
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center gap-2">
          <CalendarDays size={16} className="text-[#F97316]" />
          <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 16, color: '#111827' }}>Lịch sử chấm công</h3>
        </div>
        {loading ? <div className="p-6 text-center text-sm text-[#6B7280]">Đang tải...</div> : (
          <table className="w-full">
            <thead><tr style={{ backgroundColor: '#F9FAFB' }}>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#6B7280]">Ngày</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-[#6B7280]">Check-in</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-[#6B7280]">Check-out</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-[#6B7280]">Số giờ</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-[#6B7280]">Trạng thái</th>
            </tr></thead>
            <tbody>
              {records.map((r: any, idx: number) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 1 ? '#FAFAFA' : 'white' }}>
                  <td className="px-4 py-3 border-t border-[#F3F4F6] text-sm text-[#111827]">{fmtDate(r.ngay)}</td>
                  <td className="px-4 py-3 border-t border-[#F3F4F6] text-center text-sm" style={{ color: '#10B981' }}>{fmtTime(r.giovao)}</td>
                  <td className="px-4 py-3 border-t border-[#F3F4F6] text-center text-sm" style={{ color: '#EF4444' }}>{fmtTime(r.giora)}</td>
                  <td className="px-4 py-3 border-t border-[#F3F4F6] text-center text-sm text-[#6B7280]">{r.sogiolam != null ? Number(r.sogiolam).toFixed(1) : '—'}</td>
                  <td className="px-4 py-3 border-t border-[#F3F4F6] text-center">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={r.giora ? { backgroundColor: '#D1FAE5', color: '#065F46' } : { backgroundColor: '#FEF3C7', color: '#92400E' }}>
                      {r.giora ? 'Hoàn tất' : 'Đang làm'}
                    </span>
                  </td>
                </tr>
              ))}
              {records.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-[#9CA3AF]">Chưa có bản ghi</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
