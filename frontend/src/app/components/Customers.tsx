import { useState, useEffect } from 'react';
import { Plus, Search, Eye, X, Edit3, Lock, Unlock, Phone, Mail, MapPin, Award, ShoppingBag, DollarSign } from 'lucide-react';
import { customerApi } from '../api';

const TIER_CFG: Record<string, { emoji: string; bg: string; color: string }> = {
  Vàng: { emoji: '🥇', bg: '#FEF3C7', color: '#92400E' }, Gold: { emoji: '🥇', bg: '#FEF3C7', color: '#92400E' },
  'Bạch kim': { emoji: '💎', bg: '#E0F2FE', color: '#0369A1' }, Platinum: { emoji: '💎', bg: '#E0F2FE', color: '#0369A1' },
  Bạc: { emoji: '🥈', bg: '#F1F5F9', color: '#475569' }, Silver: { emoji: '🥈', bg: '#F1F5F9', color: '#475569' },
  Đồng: { emoji: '🥉', bg: '#FEF0E6', color: '#78350F' }, Bronze: { emoji: '🥉', bg: '#FEF0E6', color: '#78350F' },
  Thường: { emoji: '⭐', bg: '#F3F4F6', color: '#374151' },
  'Thành viên': { emoji: '⭐', bg: '#F3F4F6', color: '#374151' },
};

const card = { boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)', borderRadius: 12 };
const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ₫';

export function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [drawerTab, setDrawerTab] = useState<'info' | 'pets'>('info');
  const [pets, setPets] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', phone: '', address: '', email: '' });
  const [editForm, setEditForm] = useState({ id: 0, name: '', phone: '', address: '', email: '', points: 0, tier: 'Đồng' });
  const [saving, setSaving] = useState(false);

  const fetchAll = () => {
    setLoading(true);
    customerApi.getAll()
      .then(d => setCustomers(Array.isArray(d) ? d : d.customers || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(fetchAll, []);

  const filtered = customers.filter((c: any) =>
    !search ||
    (c.tendoitac || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.sodienthoai || '').includes(search) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const openDrawer = async (c: any) => {
    setSelected(c);
    setDrawerTab('info');
    setDrawerOpen(true);
    try {
      const d = await customerApi.getPets(c.madoitac);
      setPets(Array.isArray(d) ? d : d.pets || []);
    } catch {
      setPets([]);
    }
  };

  const handleAdd = async () => {
    if (!addForm.name || !addForm.phone) {
      alert('Họ tên và Số điện thoại là bắt buộc!');
      return;
    }
    setSaving(true);
    try {
      await customerApi.create({
        name: addForm.name,
        phone: addForm.phone,
        address: addForm.address,
        email: addForm.email
      } as any);
      setShowAdd(false);
      setAddForm({ name: '', phone: '', address: '', email: '' });
      fetchAll();
      alert('Thêm khách hàng thành công!');
    } catch (e: any) {
      alert(e.message || 'Lỗi thêm khách hàng');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEdit = (c: any) => {
    setEditForm({
      id: c.madoitac,
      name: c.tendoitac,
      phone: c.sodienthoai || '',
      address: c.diachi || '',
      email: c.email || '',
      points: c.diemtichluy || 0,
      tier: c.loaikhachhang || 'Đồng'
    });
    setShowEdit(true);
  };

  const handleUpdate = async () => {
    if (!editForm.name || !editForm.phone) {
      alert('Họ tên và Số điện thoại là bắt buộc!');
      return;
    }
    setSaving(true);
    try {
      await customerApi.update(editForm.id, {
        name: editForm.name,
        phone: editForm.phone,
        address: editForm.address,
        email: editForm.email,
        diemTichLuy: editForm.points,
        loaiKhachHang: editForm.tier
      });
      setShowEdit(false);
      fetchAll();
      alert('Cập nhật thông tin khách hàng thành công!');
    } catch (e: any) {
      alert(e.message || 'Lỗi khi cập nhật thông tin');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (c: any) => {
    const currentStatus = c.trangthai === 0 ? 0 : 1;
    const nextStatus = currentStatus === 1 ? 0 : 1;
    const msg = nextStatus === 0 
      ? 'Khóa khách hàng này sẽ không cho phép họ mua hàng hoặc tích điểm ở POS. Bạn có chắc chắn muốn khóa?'
      : 'Bạn muốn mở khóa hoạt động cho khách hàng này?';
    if (!confirm(msg)) return;
    try {
      const res = await customerApi.toggleStatus(c.madoitac, nextStatus);
      alert(res.message);
      fetchAll();
    } catch (e: any) {
      alert(e.message || 'Lỗi thay đổi trạng thái');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-[#6B7280]">Loading...</div>;

  return (
    <div className="space-y-5" style={{ fontFamily: 'Roboto, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] text-[#111827]" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800 }}>
            Quản lý khách hàng
          </h1>
          <p className="text-sm text-[#6B7280]">Quản lý thông tin liên hệ, tích điểm và hạng thành viên của khách hàng</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-white text-sm hover:opacity-90 shadow-md shadow-orange-500/20"
          style={{ backgroundColor: '#F97316', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}
        >
          <Plus size={16} /> Thêm khách hàng mới
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 flex gap-3" style={card}>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm tên, SĐT hoặc Email..."
            className="pl-9 pr-4 py-2 text-sm text-[#111827]"
            style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none', width: 320 }}
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white overflow-hidden" style={card}>
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: '#F9FAFB' }}>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#6B7280] uppercase">Khách hàng</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#6B7280] uppercase">Hạng thẻ</th>
              <th className="px-5 py-3.5 text-center text-xs font-semibold text-[#6B7280] uppercase">Điểm tích lũy</th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold text-[#6B7280] uppercase">Tổng chi tiêu</th>
              <th className="px-5 py-3.5 text-center text-xs font-semibold text-[#6B7280] uppercase">Số đơn mua</th>
              <th className="px-5 py-3.5 text-center text-xs font-semibold text-[#6B7280] uppercase">Trạng thái</th>
              <th className="px-5 py-3.5 text-center text-xs font-semibold text-[#6B7280] uppercase">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F6]">
            {filtered.map((c: any) => {
              const tier = c.loaikhachhang || 'Thường';
              const tc = TIER_CFG[tier] || TIER_CFG['Thường'];
              return (
                <tr key={c.madoitac} className="hover:bg-[#FAF9F6] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: '#F97316' }}>
                        {(c.tendoitac || 'K').charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#111827]">{c.tendoitac}</p>
                        <p className="text-xs text-[#6B7280]">{c.sodienthoai}</p>
                        {c.email && <p className="text-[10px] text-gray-400">{c.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: tc.bg, color: tc.color }}>
                      {tc.emoji} {tier}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center text-sm font-semibold text-[#4B5563]">
                    ⭐ {c.diemtichluy || 0}
                  </td>
                  <td className="px-5 py-4 text-right text-sm font-bold text-emerald-600">
                    {fmt(Number(c.total_spent) || 0)}
                  </td>
                  <td className="px-5 py-4 text-center text-sm text-[#6B7280] font-semibold">
                    {c.total_orders || 0}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${c.trangthai === 0 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {c.trangthai === 0 ? 'Khóa' : 'Hoạt động'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex justify-center gap-1.5">
                      <button
                        onClick={() => openDrawer(c)}
                        className="p-1 rounded hover:bg-blue-50 text-[#3B82F6]"
                        title="Xem chi tiết"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="p-1 rounded hover:bg-orange-50 text-[#F97316]"
                        title="Sửa thông tin"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(c)}
                        className={`p-1 rounded hover:bg-gray-100 ${c.trangthai === 0 ? 'text-emerald-600' : 'text-rose-600'}`}
                        title={c.trangthai === 0 ? 'Mở khóa khách hàng' : 'Khóa khách hàng'}
                      >
                        {c.trangthai === 0 ? <Unlock size={15} /> : <Lock size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-sm text-[#9CA3AF]">
                  Không tìm thấy khách hàng nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Drawer detailed view */}
      {drawerOpen && selected && (
        <>
          <div className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} onClick={() => setDrawerOpen(false)} />
          <div className="fixed right-0 top-0 h-full z-50 flex flex-col bg-white overflow-hidden" style={{ width: 480, boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }}>
            <div className="p-6 border-b border-[#E5E7EB] bg-[#FAF9F6]">
              <div className="flex items-start justify-between mb-4">
                <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-lg hover:bg-gray-200/50 text-[#6B7280]">
                  <X size={18} />
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0" style={{ backgroundColor: '#F97316' }}>
                  {(selected.tendoitac || 'K').charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl text-[#111827]" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800 }}>{selected.tendoitac}</h2>
                  <p className="text-xs text-[#6B7280]">{selected.sodienthoai}</p>
                </div>
              </div>
            </div>

            <div className="flex border-b border-[#E5E7EB]">
              {(['info', 'pets'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setDrawerTab(tab)}
                  className="flex-1 py-3 text-sm capitalize font-bold"
                  style={{
                    fontFamily: 'Nunito, sans-serif',
                    color: drawerTab === tab ? '#F97316' : '#6B7280',
                    borderBottom: drawerTab === tab ? '2.5px solid #F97316' : '2.5px solid transparent',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  {tab === 'info' ? 'Hồ sơ liên hệ' : 'Thú cưng đăng ký'}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-6">
              {drawerTab === 'info' && (
                <div className="space-y-4">
                  <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-orange-800 font-bold uppercase tracking-wider">Hạng thẻ</p>
                      <h4 className="text-lg font-bold text-[#111827] mt-0.5">{selected.loaikhachhang || 'Thường'}</h4>
                    </div>
                    <Award size={36} className="text-orange-500" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 font-bold uppercase">Điểm tích lũy</p>
                      <p className="text-sm font-bold text-gray-800 mt-1">⭐ {selected.diemtichluy || 0}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 font-bold uppercase">Số đơn hàng</p>
                      <p className="text-sm font-bold text-gray-800 mt-1">📦 {selected.total_orders || 0}</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3">
                    <div className="flex items-center gap-3">
                      <Phone size={16} className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Số điện thoại</p>
                        <p className="text-sm font-semibold text-gray-800">{selected.sodienthoai}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail size={16} className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Địa chỉ Email</p>
                        <p className="text-sm font-semibold text-gray-800">{selected.email || 'Chưa cập nhật'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin size={16} className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Địa chỉ thường trú</p>
                        <p className="text-sm font-semibold text-gray-800">{selected.diachi || 'Chưa cập nhật'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {drawerTab === 'pets' && (
                <div className="space-y-3">
                  {pets.length === 0 ? (
                    <div className="text-center p-8 text-[#9CA3AF]">
                      <Award className="mx-auto mb-2 text-gray-300" size={30} />
                      <p className="text-sm">Khách hàng chưa đăng ký thú cưng</p>
                    </div>
                  ) : (
                    pets.map((pet: any, i: number) => (
                      <div key={pet.mahoso || i} className="p-4 rounded-xl border border-[#E5E7EB] hover:border-orange-200 hover:bg-orange-50/10 transition-colors">
                        <p className="text-sm font-bold text-[#111827]">{pet.tenthucung}</p>
                        <p className="text-xs text-[#6B7280] mt-1">{pet.loaithucung} · Giới tính: {pet.gioitinh}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Add Customer Modal */}
      {showAdd && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-6" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.14)' }}>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#F3F4F6]">
              <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 18, color: '#111827' }}>
                Thêm khách hàng mới
              </h3>
              <button onClick={() => setShowAdd(false)} className="p-2 rounded-lg hover:bg-gray-100 text-[#6B7280]">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Họ tên khách hàng *</label>
                <input
                  value={addForm.name}
                  onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Nguyễn Văn A..."
                  className="w-full px-3 py-2 text-sm text-[#111827]"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Số điện thoại *</label>
                <input
                  value={addForm.phone}
                  onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="0901234567..."
                  className="w-full px-3 py-2 text-sm text-[#111827]"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Địa chỉ Email</label>
                <input
                  value={addForm.email}
                  onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="khachhang@email.com..."
                  className="w-full px-3 py-2 text-sm text-[#111827]"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Địa chỉ thường trú</label>
                <input
                  value={addForm.address}
                  onChange={e => setAddForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Số nhà, Tên đường..."
                  className="w-full px-3 py-2 text-sm text-[#111827]"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 py-2.5 text-sm font-semibold border border-[#E5E7EB] rounded-xl hover:bg-gray-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleAdd}
                disabled={saving}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-orange-500 rounded-xl hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Đang tạo...' : 'Xác nhận tạo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEdit && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-6" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.14)' }}>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#F3F4F6]">
              <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 18, color: '#111827' }}>
                Cập nhật thông tin Khách hàng
              </h3>
              <button onClick={() => setShowEdit(false)} className="p-2 rounded-lg hover:bg-gray-100 text-[#6B7280]">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Họ tên khách hàng *</label>
                <input
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm text-[#111827]"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Số điện thoại *</label>
                <input
                  value={editForm.phone}
                  onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3 py-2 text-sm text-[#111827]"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Địa chỉ Email</label>
                <input
                  value={editForm.email}
                  onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 text-sm text-[#111827]"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Địa chỉ thường trú</label>
                <input
                  value={editForm.address}
                  onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full px-3 py-2 text-sm text-[#111827]"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Điểm tích lũy</label>
                  <input
                    type="number"
                    value={editForm.points}
                    onChange={e => setEditForm(f => ({ ...f, points: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-sm text-[#111827]"
                    style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Hạng thành viên</label>
                  <select
                    value={editForm.tier}
                    onChange={e => setEditForm(f => ({ ...f, tier: e.target.value }))}
                    className="w-full px-3 py-2 text-sm text-[#111827]"
                    style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                  >
                    <option value="Đồng">Đồng</option>
                    <option value="Bạc">Bạc</option>
                    <option value="Vàng">Vàng</option>
                    <option value="Bạch kim">Bạch kim</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEdit(false)}
                className="flex-1 py-2.5 text-sm font-semibold border border-[#E5E7EB] rounded-xl hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdate}
                disabled={saving}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:opacity-90 disabled:opacity-50"
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
