import { useState, useEffect } from 'react';
import { Plus, Search, Calendar, Clock, User, X, Sparkles, AlertCircle, Edit3, Trash2, CheckCircle } from 'lucide-react';
import { bookingApi, customerApi, hrApi } from '../api';

const cardStyle = {
  boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
  borderRadius: 12
};

export function Booking() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  // Form state for creation
  const [selectedCustomer, setSelectedCustomer] = useState<number | ''>('');
  const [customerPets, setCustomerPets] = useState<any[]>([]);
  const [selectedPet, setSelectedPet] = useState<number | ''>('');
  const [bookingTime, setBookingTime] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<number | ''>('');
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editStatus, setEditStatus] = useState('Đợi check-in');
  const [editEmployee, setEditEmployee] = useState<number | ''>('');
  const [editNote, setEditNote] = useState('');
  const [editTime, setEditTime] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await bookingApi.getAll();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadInitialData = async () => {
    try {
      const [custs, emps, servs] = await Promise.all([
        customerApi.getAll(),
        hrApi.getEmployees(),
        bookingApi.getServices()
      ]);
      setCustomers(Array.isArray(custs) ? custs : []);
      setEmployees(Array.isArray(emps) ? emps : []);
      setServices(Array.isArray(servs) ? servs : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBookings();
    loadInitialData();
  }, []);

  // Khi chọn khách hàng thì tự động gọi API lấy thú cưng
  useEffect(() => {
    if (selectedCustomer !== '') {
      bookingApi.getPets(Number(selectedCustomer)).then(pets => {
        setCustomerPets(Array.isArray(pets) ? pets : []);
        setSelectedPet('');
      }).catch(err => {
        console.error(err);
        setCustomerPets([]);
      });
    } else {
      setCustomerPets([]);
      setSelectedPet('');
    }
  }, [selectedCustomer]);

  const handleServiceToggle = (id: number) => {
    if (selectedServices.includes(id)) {
      setSelectedServices(selectedServices.filter(sId => sId !== id));
    } else {
      setSelectedServices([...selectedServices, id]);
    }
  };

  const calculateTotal = () => {
    return selectedServices.reduce((sum, sId) => {
      const s = services.find(srv => srv.madichvu === sId);
      return sum + (s ? s.gia : 0);
    }, 0);
  };

  const handleCreateBooking = async () => {
    if (!selectedCustomer || !bookingTime || selectedServices.length === 0) {
      alert('Vui lòng điền đầy đủ: Khách hàng, Thời gian và ít nhất 1 dịch vụ!');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        makh: Number(selectedCustomer),
        mathucung: selectedPet !== '' ? Number(selectedPet) : null,
        thoigianhen: bookingTime,
        manv: selectedEmployee !== '' ? Number(selectedEmployee) : null,
        ghichu: note,
        services: selectedServices
      };

      await bookingApi.create(payload);
      alert('Đặt lịch hẹn spa/dịch vụ thành công!');
      setShowAddModal(false);
      
      // Reset form
      setSelectedCustomer('');
      setSelectedPet('');
      setBookingTime('');
      setSelectedEmployee('');
      setSelectedServices([]);
      setNote('');
      
      fetchBookings();
    } catch (err: any) {
      alert(err.message || 'Lỗi đặt lịch hẹn');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEdit = (booking: any) => {
    setSelectedBooking(booking);
    setEditStatus(booking.trangthai);
    setEditEmployee(booking.manv || '');
    setEditNote(booking.ghichu || '');
    // Chuyển sang định dạng datetime-local nếu cần
    if (booking.thoigianhen) {
      const date = new Date(booking.thoigianhen);
      const tzOffset = date.getTimezoneOffset() * 60000; // offset in milliseconds
      const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
      setEditTime(localISOTime);
    } else {
      setEditTime('');
    }
    setShowEditModal(true);
  };

  const handleUpdateBooking = async () => {
    if (!selectedBooking) return;
    setSaving(true);
    try {
      const payload = {
        trangthai: editStatus,
        manv: editEmployee !== '' ? Number(editEmployee) : null,
        ghichu: editNote,
        thoigianhen: editTime
      };

      await bookingApi.update(selectedBooking.malichhen, payload);
      alert('Cập nhật thông tin lịch hẹn thành công!');
      setShowEditModal(false);
      fetchBookings();
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật lịch hẹn');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelBooking = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) return;
    try {
      await bookingApi.cancel(id);
      alert('Đã hủy lịch hẹn!');
      fetchBookings();
    } catch (err: any) {
      alert(err.message || 'Lỗi hủy lịch hẹn');
    }
  };

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const filteredBookings = bookings.filter((b: any) => {
    const term = search.toLowerCase();
    return (
      (b.tenkhachhang || '').toLowerCase().includes(term) ||
      (b.sdtkhachhang || '').includes(term) ||
      (b.tenthucung || '').toLowerCase().includes(term) ||
      (b.danhsachdichvu || '').toLowerCase().includes(term)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Đợi check-in':
        return 'bg-blue-100 text-blue-800';
      case 'Đang làm':
        return 'bg-amber-100 text-amber-800';
      case 'Hoàn thành':
        return 'bg-emerald-100 text-emerald-800';
      case 'Đã hủy':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6" style={{ fontFamily: 'Roboto, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] text-[#111827]" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800 }}>
            Đặt lịch & Spa chăm sóc
          </h1>
          <p className="text-sm text-[#6B7280]">Đặt lịch tắm sấy, tỉa lông nghệ thuật, lưu thông tin chăm sóc thú cưng</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-white text-sm hover:opacity-90 transition-all shadow-md shadow-orange-500/20"
          style={{ backgroundColor: '#F97316', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}
        >
          <Plus size={16} /> Đặt lịch hẹn mới
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 flex items-center gap-4" style={cardStyle}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 text-blue-500 font-bold text-lg">
            {bookings.filter(b => b.trangthai === 'Đợi check-in').length}
          </div>
          <div>
            <p className="text-xs text-[#9CA3AF] uppercase font-bold tracking-wider">Đợi check-in</p>
            <h3 className="text-lg font-bold text-[#111827] mt-0.5">Chờ khách đến</h3>
          </div>
        </div>
        <div className="bg-white p-5 flex items-center gap-4" style={cardStyle}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-50 text-amber-500 font-bold text-lg">
            {bookings.filter(b => b.trangthai === 'Đang làm').length}
          </div>
          <div>
            <p className="text-xs text-[#9CA3AF] uppercase font-bold tracking-wider">Đang spa</p>
            <h3 className="text-lg font-bold text-[#111827] mt-0.5">Đang xử lý</h3>
          </div>
        </div>
        <div className="bg-white p-5 flex items-center gap-4" style={cardStyle}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-500 font-bold text-lg">
            {bookings.filter(b => b.trangthai === 'Hoàn thành').length}
          </div>
          <div>
            <p className="text-xs text-[#9CA3AF] uppercase font-bold tracking-wider font-semibold">Hoàn thành</p>
            <h3 className="text-lg font-bold text-emerald-600 mt-0.5">Đã bàn giao</h3>
          </div>
        </div>
        <div className="bg-white p-5 flex items-center gap-4" style={cardStyle}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-rose-50 text-rose-500 font-bold text-lg">
            {bookings.filter(b => b.trangthai === 'Đã hủy').length}
          </div>
          <div>
            <p className="text-xs text-[#9CA3AF] uppercase font-bold tracking-wider">Đã hủy</p>
            <h3 className="text-lg font-bold text-red-600 mt-0.5">Hủy bỏ lịch</h3>
          </div>
        </div>
      </div>

      {/* Bookings table */}
      <div className="bg-white overflow-hidden" style={cardStyle}>
        <div className="p-4 border-b border-[#F3F4F6] flex items-center justify-between gap-4">
          <div className="relative w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm khách hàng, thú cưng, dịch vụ..."
              className="pl-9 pr-4 py-2 text-sm text-[#111827] w-full"
              style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-[#6B7280]">Loading...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-12 text-center text-[#9CA3AF]">
            <Calendar className="mx-auto text-gray-300 mb-3" size={40} />
            <p className="text-sm">Chưa có lịch đặt chăm sóc nào</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB' }}>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#6B7280] uppercase">Mã lịch</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#6B7280] uppercase">Khách hàng</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#6B7280] uppercase">Thú cưng</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#6B7280] uppercase">Thời gian</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#6B7280] uppercase">Dịch vụ Spa</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-[#6B7280] uppercase">Tổng tiền</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#6B7280] uppercase">Nhân viên</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-[#6B7280] uppercase">Trạng thái</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-[#6B7280] uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {filteredBookings.map((b: any) => (
                <tr key={b.malichhen} className="hover:bg-[#FAF9F6] transition-colors">
                  <td className="px-5 py-4 text-sm font-bold text-[#111827]">#{b.malichhen}</td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-[#111827]">{b.tenkhachhang}</p>
                    <p className="text-xs text-[#9CA3AF]">{b.sdtkhachhang}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-orange-600">{b.tenthucung || 'Chưa cập nhật'}</p>
                    {b.loaithucung && <p className="text-xs text-[#9CA3AF]">{b.loaithucung}</p>}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#4B5563]">
                    {new Date(b.thoigianhen).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-xs font-semibold text-[#4B5563] bg-orange-50 text-orange-800 px-2 py-0.5 rounded inline-block max-w-[180px] truncate">
                      {b.danhsachdichvu || '—'}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-sm text-right font-bold text-emerald-600">
                    {formatPrice(b.tongtien || 0)}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#6B7280] font-semibold">{b.tennhanvien || 'Chưa phân công'}</td>
                  <td className="px-5 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(b.trangthai)}`}>
                      {b.trangthai}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex justify-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(b)}
                        className="p-1 rounded hover:bg-orange-50 text-[#F97316]"
                        title="Cập nhật trạng thái"
                      >
                        <Edit3 size={15} />
                      </button>
                      {b.trangthai !== 'Đã hủy' && b.trangthai !== 'Hoàn thành' && (
                        <button
                          onClick={() => handleCancelBooking(b.malichhen)}
                          className="p-1 rounded hover:bg-rose-50 text-rose-500"
                          title="Hủy lịch hẹn"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Booking Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 p-6" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.14)' }}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F3F4F6]">
              <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 18, color: '#111827' }} className="flex items-center gap-2">
                <Sparkles size={20} className="text-orange-500" /> Đặt lịch hẹn Spa chăm sóc
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-gray-100 text-[#6B7280]">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Khách hàng</label>
                <select
                  value={selectedCustomer}
                  onChange={e => setSelectedCustomer(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                >
                  <option value="">Chọn khách hàng...</option>
                  {customers.map(c => (
                    <option key={c.madoitac} value={c.madoitac}>{c.tendoitac || c.hoten} ({c.sodienthoai || c.sdt})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Thú cưng</label>
                <select
                  value={selectedPet}
                  disabled={selectedCustomer === ''}
                  onChange={e => setSelectedPet(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm disabled:bg-gray-50"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                >
                  <option value="">Chọn thú cưng...</option>
                  {customerPets.map(p => (
                    <option key={p.mathucung} value={p.mathucung}>{p.tenthucung} ({p.loai || 'Chưa phân loại'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Thời gian hẹn</label>
                <input
                  type="datetime-local"
                  value={bookingTime}
                  onChange={e => setBookingTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Nhân viên phục vụ</label>
                <select
                  value={selectedEmployee}
                  onChange={e => setSelectedEmployee(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                >
                  <option value="">Phân công nhân viên...</option>
                  {employees.map(e => (
                    <option key={e.manhanvien} value={e.manhanvien}>{e.hoten}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dịch vụ Checkbox list */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">Chọn dịch vụ Spa</label>
              <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto pr-1">
                {services.map(s => (
                  <label key={s.madichvu} className="flex items-center gap-2.5 p-2 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] hover:border-orange-200 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={selectedServices.includes(s.madichvu)}
                      onChange={() => handleServiceToggle(s.madichvu)}
                      className="accent-orange-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-gray-800">{s.tendichvu}</p>
                      <p className="text-[11px] text-orange-600 font-semibold">{formatPrice(s.gia)}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Ghi chú</label>
              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Ghi chú yêu cầu cắt lông, tắm thơm..."
                className="w-full px-3 py-2 text-sm"
                style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
              />
            </div>

            {/* Total and actions */}
            <div className="border-t border-[#F3F4F6] pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-[#6B7280] font-semibold uppercase">Tổng chi phí dự kiến</p>
                <h3 className="text-xl font-bold text-emerald-600 mt-0.5">{formatPrice(calculateTotal())}</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-sm font-semibold border border-[#E5E7EB] rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleCreateBooking}
                  disabled={saving}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-orange-500 rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-orange-500/10"
                >
                  {saving ? 'Đang tạo...' : 'Xác nhận đặt lịch'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Booking Modal */}
      {showEditModal && selectedBooking && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-6" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.14)' }}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F3F4F6]">
              <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 18, color: '#111827' }}>
                Cập nhật lịch hẹn #{selectedBooking.malichhen}
              </h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 rounded-lg hover:bg-gray-100 text-[#6B7280]">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Thời gian hẹn mới</label>
                <input
                  type="datetime-local"
                  value={editTime}
                  onChange={e => setEditTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Trạng thái xử lý</label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                >
                  <option value="Đợi check-in">Đợi check-in</option>
                  <option value="Đang làm">Đang làm</option>
                  <option value="Hoàn thành">Hoàn thành</option>
                  <option value="Đã hủy">Đã hủy</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Nhân viên spa phụ trách</label>
                <select
                  value={editEmployee}
                  onChange={e => setEditEmployee(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                >
                  <option value="">Chưa phân công nhân viên...</option>
                  {employees.map(e => (
                    <option key={e.manhanvien} value={e.manhanvien}>{e.hoten}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Ghi chú bổ sung</label>
                <input
                  value={editNote}
                  onChange={e => setEditNote(e.target.value)}
                  placeholder="Thêm ghi chú..."
                  className="w-full px-3 py-2 text-sm"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end border-t border-[#F3F4F6] pt-4">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm font-semibold border border-[#E5E7EB] rounded-xl hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateBooking}
                disabled={saving}
                className="px-5 py-2 text-sm font-semibold text-white bg-orange-500 rounded-xl hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
