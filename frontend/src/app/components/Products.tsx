import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, AlertTriangle, X, Upload } from 'lucide-react';
import { productApi } from '../api';

const CATS = ['Hàng hóa', 'Dịch vụ'];
const CAT_COLORS: Record<string, { bg: string; color: string }> = {
  'Hàng hóa': { bg: '#DBEAFE', color: '#1E40AF' },
  'Dịch vụ': { bg: '#EDE9FE', color: '#5B21B6' },
};
const DEFAULT_IMG = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=200';
const PAGE_SIZE = 8;
const card = { boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)', borderRadius: 12 };
const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ₫';

export function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'services'>('products');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [form, setForm] = useState({ name: '', type: 'Hàng hóa', unit: '', price: '', thue: '0', coTheBan: '1' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  const [selected, setSelected] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchProducts = () => {
    setLoading(true);
    Promise.all([
      productApi.getAll().catch(() => []),
      productApi.getAllServices().catch(() => []),
    ]).then(([prods, servs]) => {
      setProducts(Array.isArray(prods) ? prods : (prods as any).products || []);
      setServices(Array.isArray(servs) ? servs : []);
    }).catch(console.error).finally(() => setLoading(false));
  };
  
  useEffect(fetchProducts, []);

  // Lọc dữ liệu theo tab hoạt động
  const filteredProducts = products.filter((p: any) =>
    (!search || (p.tensanpham || '').toLowerCase().includes(search.toLowerCase())) &&
    (!catFilter || p.loaisanpham === catFilter) &&
    (!statusFilter || (statusFilter === 'instock' && Number(p.soluongton) > 0) || (statusFilter === 'out' && Number(p.soluongton) === 0))
  );

  const filteredServices = services.filter((s: any) =>
    (!search || (s.tendichvu || '').toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || (statusFilter === 'instock' && Number(s.cotheban) === 1) || (statusFilter === 'out' && Number(s.cotheban) === 0))
  );

  const activeFiltered = activeTab === 'products' ? filteredProducts : filteredServices;
  const totalPages = Math.ceil(activeFiltered.length / PAGE_SIZE);
  const paged = activeFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openAdd = () => {
    setForm({ name: '', type: activeTab === 'services' ? 'Dịch vụ' : 'Hàng hóa', unit: '', price: '', thue: '0', coTheBan: '1' });
    setImageFile(null);
    setImagePreview('');
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (p: any) => {
    if (activeTab === 'services') {
      setForm({
        name: p.tendichvu,
        type: 'Dịch vụ',
        unit: '',
        price: String(p.gia || ''),
        thue: '0',
        coTheBan: String(p.cotheban !== undefined ? p.cotheban : '1')
      });
      setImageFile(null);
      setImagePreview('');
      setEditingId(p.madichvu);
    } else {
      setForm({
        name: p.tensanpham,
        type: p.loaisanpham || 'Hàng hóa',
        unit: p.donvitinh || '',
        price: String(p.gianiemyet || ''),
        thue: String(p.thue || '0'),
        coTheBan: String(p.cotheban !== undefined ? p.cotheban : '1')
      });
      setImageFile(null);
      setImagePreview(p.hinhanh || '');
      setEditingId(p.masanpham);
    }
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(activeTab === 'services' ? 'Xóa dịch vụ này?' : 'Ngừng kinh doanh sản phẩm này?')) return;
    try {
      if (activeTab === 'services') {
        await productApi.deleteService(id);
      } else {
        await productApi.deactivate(id);
      }
      fetchProducts();
    } catch(e) {
      console.error(e);
      alert('Có lỗi xảy ra, vui lòng thử lại!');
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.price) return;
    setSaving(true);
    try {
      if (activeTab === 'services') {
        const payload = {
          tenDichVu: form.name,
          gia: Number(form.price),
          coTheBan: Number(form.coTheBan)
        };
        if (editingId) {
          await productApi.updateService(editingId, payload);
        } else {
          await productApi.createService(payload);
        }
      } else {
        const fd = new FormData();
        fd.append('tenSanPham', form.name);
        fd.append('loaiSanPham', form.type);
        fd.append('donViTinh', form.unit);
        fd.append('giaNiemYet', form.price);
        fd.append('thue', form.thue);
        fd.append('coTheMua', '1');
        fd.append('coTheBan', form.coTheBan);
        fd.append('pos', '1');

        if (imageFile) {
          fd.append('hinhAnh', imageFile);
        }

        if (editingId) {
          await productApi.update(editingId, fd);
        } else {
          await productApi.create(fd);
        }
      }
      setShowModal(false);
      fetchProducts();
    } catch(e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const toggleSelect = (id: number) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setSelected(selected.length === paged.length ? [] : paged.map((p: any) => activeTab === 'services' ? p.madichvu : p.masanpham));

  if (loading) return <div className="flex items-center justify-center h-64 text-[#6B7280]">Loading products...</div>;

  return (
    <div className="space-y-5" style={{ fontFamily: 'Roboto, sans-serif' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] text-[#111827]" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>Sản phẩm & Dịch vụ</h1>
          <p className="text-sm text-[#6B7280]">Quản lý sản phẩm & dịch vụ trong hệ thống PetERP</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 text-white text-sm animate-pulse-subtle"
          style={{ backgroundColor: '#F97316', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#EA6C0A')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#F97316')}>
          <Plus size={16} /> {activeTab === 'services' ? 'Thêm dịch vụ' : 'Thêm SP'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button onClick={() => { setActiveTab('products'); setPage(1); setSelected([]); }} className="px-5 py-3 text-sm font-bold border-b-2 transition-all duration-200" style={{ borderColor: activeTab === 'products' ? '#F97316' : 'transparent', color: activeTab === 'products' ? '#F97316' : '#6B7280', cursor: 'pointer', backgroundColor: 'transparent' }}>
          📦 Sản phẩm (Hàng hóa)
        </button>
        <button onClick={() => { setActiveTab('services'); setPage(1); setSelected([]); }} className="px-5 py-3 text-sm font-bold border-b-2 transition-all duration-200" style={{ borderColor: activeTab === 'services' ? '#F97316' : 'transparent', color: activeTab === 'services' ? '#F97316' : '#6B7280', cursor: 'pointer', backgroundColor: 'transparent' }}>
          ✨ Dịch vụ chăm sóc
        </button>
      </div>

      <div className="bg-white p-4 flex flex-wrap gap-3 items-center" style={card}>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder={activeTab === 'services' ? "Tìm tên dịch vụ..." : "Tìm tên SP..."}
            className="pl-9 pr-4 py-2 text-sm text-[#111827]" style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none', width: 280 }}
            onFocus={e => (e.target.style.borderColor = '#F97316')} onBlur={e => (e.target.style.borderColor = '#E5E7EB')} />
        </div>
        {activeTab === 'products' && (
          <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }} className="px-3 py-2 text-sm text-[#374151]" style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}>
            <option value="">Loại SP</option>{CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 text-sm text-[#374151]" style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}>
          <option value="">Trạng thái</option>
          <option value="instock">{activeTab === 'services' ? 'Đang hoạt động' : 'Còn hàng'}</option>
          <option value="out">{activeTab === 'services' ? 'Ngừng hoạt động' : 'Hết hàng'}</option>
        </select>
        {(search || catFilter || statusFilter) && (
          <button onClick={() => { setSearch(''); setCatFilter(''); setStatusFilter(''); }} className="px-3 py-2 text-sm text-[#EF4444] flex items-center gap-1"
            style={{ border: '1px solid #FCA5A5', borderRadius: 8, backgroundColor: '#FEF2F2', cursor: 'pointer' }}><X size={14} /> Xóa bộ lọc</button>
        )}
      </div>

      <div className="bg-white overflow-hidden" style={card}>
        <div className="overflow-x-auto">
          {activeTab === 'products' ? (
            <table className="w-full">
              <thead><tr style={{ backgroundColor: '#F9FAFB' }}>
                <th className="px-4 py-3 text-left w-10"><input type="checkbox" checked={selected.length === paged.length && paged.length > 0} onChange={toggleAll} style={{ accentColor: '#F97316' }} /></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] w-16 uppercase tracking-wider">Ảnh</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Tên sản phẩm</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Loại</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Giá niêm yết</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Tồn kho</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Bán</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Hành động</th>
              </tr></thead>
              <tbody>
                {paged.map((p: any, idx: number) => {
                  const stock = Number(p.soluongton) || 0;
                  const cc = CAT_COLORS[p.loaisanpham] || { bg: '#F3F4F6', color: '#374151' };
                  const isSel = selected.includes(p.masanpham);
                  return (
                    <tr key={p.masanpham} style={{ backgroundColor: isSel ? '#FFF0E6' : idx % 2 === 1 ? '#FAFAFA' : 'white' }}
                      onMouseEnter={e => { if (!isSel) e.currentTarget.style.backgroundColor = '#FFF0E6'; }}
                      onMouseLeave={e => { if (!isSel) e.currentTarget.style.backgroundColor = idx % 2 === 1 ? '#FAFAFA' : 'white'; }}>
                      <td className="px-4 py-3 border-t border-[#F3F4F6]"><input type="checkbox" checked={isSel} onChange={() => toggleSelect(p.masanpham)} style={{ accentColor: '#F97316' }} /></td>
                      <td className="px-4 py-3 border-t border-[#F3F4F6] cursor-pointer" onClick={() => openEdit(p)}>
                        <img src={p.hinhanh || DEFAULT_IMG} alt="" className="w-12 h-12 rounded-xl object-cover border border-[#E5E7EB]" />
                      </td>
                      <td className="px-4 py-3 border-t border-[#F3F4F6] cursor-pointer hover:text-[#F97316]" onClick={() => openEdit(p)}>
                        <p className="text-sm font-semibold text-[#111827]">{p.tensanpham}</p>
                      </td>
                      <td className="px-4 py-3 border-t border-[#F3F4F6]"><span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: cc.bg, color: cc.color }}>{p.loaisanpham || 'Hàng hóa'}</span></td>
                      <td className="px-4 py-3 border-t border-[#F3F4F6] text-right text-sm font-semibold text-[#111827]">{fmt(Number(p.gianiemyet) || 0)}</td>
                      <td className="px-4 py-3 border-t border-[#F3F4F6] text-center">
                        {stock === 0 ? <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>Hết hàng</span>
                          : stock < 5 ? <span className="text-sm font-bold flex items-center justify-center gap-1" style={{ color: '#EF4444' }}><AlertTriangle size={13} />{stock}</span>
                          : <span className="text-sm font-semibold text-[#10B981]">{stock}</span>}
                      </td>
                      <td className="px-4 py-3 border-t border-[#F3F4F6] text-center">
                        {Number(p.cotheban) === 1 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', border: '1px solid #C8E6C9', fontFamily: 'Nunito, sans-serif' }}>
                            Được bán
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: '#F5F5F5', color: '#757575', border: '1px solid #E0E0E0', fontFamily: 'Nunito, sans-serif' }}>
                            Ngừng bán
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 border-t border-[#F3F4F6] text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-blue-50 text-[#3B82F6] transition-all"><Edit2 size={15} /></button>
                          <button onClick={() => handleDelete(p.masanpham)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#EF4444] transition-all"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paged.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-sm text-[#9CA3AF]">Không tìm thấy sản phẩm nào</td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full">
              <thead><tr style={{ backgroundColor: '#F9FAFB' }}>
                <th className="px-4 py-3 text-left w-10"><input type="checkbox" checked={selected.length === paged.length && paged.length > 0} onChange={toggleAll} style={{ accentColor: '#F97316' }} /></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Tên dịch vụ</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Giá dịch vụ</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Trạng thái</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Hành động</th>
              </tr></thead>
              <tbody>
                {paged.map((s: any, idx: number) => {
                  const isSel = selected.includes(s.madichvu);
                  return (
                    <tr key={s.madichvu} style={{ backgroundColor: isSel ? '#FFF0E6' : idx % 2 === 1 ? '#FAFAFA' : 'white' }}
                      onMouseEnter={e => { if (!isSel) e.currentTarget.style.backgroundColor = '#FFF0E6'; }}
                      onMouseLeave={e => { if (!isSel) e.currentTarget.style.backgroundColor = idx % 2 === 1 ? '#FAFAFA' : 'white'; }}>
                      <td className="px-4 py-3 border-t border-[#F3F4F6]"><input type="checkbox" checked={isSel} onChange={() => toggleSelect(s.madichvu)} style={{ accentColor: '#F97316' }} /></td>
                      <td className="px-4 py-3 border-t border-[#F3F4F6] cursor-pointer hover:text-[#F97316]" onClick={() => openEdit(s)}>
                        <p className="text-sm font-semibold text-[#111827]">{s.tendichvu}</p>
                      </td>
                      <td className="px-4 py-3 border-t border-[#F3F4F6] text-right text-sm font-semibold text-[#111827]">{fmt(Number(s.gia) || 0)}</td>
                      <td className="px-4 py-3 border-t border-[#F3F4F6] text-center">
                        {Number(s.cotheban) === 1 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', border: '1px solid #C8E6C9', fontFamily: 'Nunito, sans-serif' }}>
                            Được bán
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: '#F5F5F5', color: '#757575', border: '1px solid #E0E0E0', fontFamily: 'Nunito, sans-serif' }}>
                            Ngừng bán
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 border-t border-[#F3F4F6] text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-blue-50 text-[#3B82F6] transition-all"><Edit2 size={15} /></button>
                          <button onClick={() => handleDelete(s.madichvu)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#EF4444] transition-all"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paged.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-[#9CA3AF]">Không tìm thấy dịch vụ nào</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        {totalPages > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#E5E7EB]">
            <span className="text-sm text-[#6B7280]">Hiển thị {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, activeFiltered.length)} / {activeFiltered.length}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm rounded-lg" style={{ border: '1px solid #E5E7EB', cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#D1D5DB' : '#374151' }}>Trước</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)} className="w-8 h-8 text-sm rounded-lg"
                  style={{ backgroundColor: page === n ? '#F97316' : 'transparent', color: page === n ? 'white' : '#374151', border: `1px solid ${page === n ? '#F97316' : '#E5E7EB'}`, cursor: 'pointer' }}>{n}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm rounded-lg" style={{ border: '1px solid #E5E7EB', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: page === totalPages ? '#D1D5DB' : '#374151' }}>Sau</button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 overflow-hidden" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.14)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
              <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 18, color: '#111827' }}>
                {editingId 
                  ? (activeTab === 'services' ? 'Chỉnh sửa dịch vụ' : 'Chỉnh sửa sản phẩm') 
                  : (activeTab === 'services' ? 'Thêm dịch vụ mới' : 'Thêm sản phẩm mới')}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 text-[#6B7280]"><X size={18} /></button>
            </div>
            
            <div className="p-6 space-y-5">
              {activeTab === 'services' ? (
                /* FORM DỊCH VỤ */
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#374151] mb-1">Tên dịch vụ *</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="VD: Tắm sấy & cắt tỉa lông mèo"
                      className="w-full px-3 py-2.5 text-sm text-[#111827]" style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                      onFocus={e => (e.target.style.borderColor = '#F97316')} onBlur={e => (e.target.style.borderColor = '#E5E7EB')} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#374151] mb-1">Giá dịch vụ *</label>
                      <input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="VD: 150000" type="number"
                        className="w-full px-3 py-2.5 text-sm text-[#111827]" style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                        onFocus={e => (e.target.style.borderColor = '#F97316')} onBlur={e => (e.target.style.borderColor = '#E5E7EB')} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#374151] mb-1">Trạng thái bán</label>
                      <select value={form.coTheBan} onChange={e => setForm(f => ({ ...f, coTheBan: e.target.value }))} className="w-full px-3 py-2.5 text-sm text-[#374151]" style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}>
                        <option value="1">Đang kinh doanh</option>
                        <option value="0">Ngừng kinh doanh</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                /* FORM SẢN PHẨM */
                <div className="space-y-5">
                  {/* Thêm hình ảnh sản phẩm */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[#374151]">Hình ảnh sản phẩm</label>
                    <div className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-[#D1D5DB] bg-gray-50">
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#E5E7EB] bg-white flex items-center justify-center">
                        <img src={imagePreview || DEFAULT_IMG} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="inline-flex items-center gap-2 px-3 py-2 border border-[#E5E7EB] rounded-lg bg-white text-xs font-semibold text-[#374151] cursor-pointer hover:bg-gray-50 transition-all">
                          <Upload size={14} className="text-[#F97316]" />
                          Tải ảnh lên
                          <input type="file" accept="image/*" onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setImageFile(file);
                              setImagePreview(URL.createObjectURL(file));
                            }
                          }} className="hidden" />
                        </label>
                        <p className="text-[11px] text-[#6B7280]">Chấp nhận PNG, JPG, GIF. Nếu để trống sẽ sử dụng ảnh mặc định.</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-1">Tên sản phẩm *</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="VD: Thức ăn chó cao cấp"
                      className="w-full px-3 py-2.5 text-sm text-[#111827]" style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                      onFocus={e => (e.target.style.borderColor = '#F97316')} onBlur={e => (e.target.style.borderColor = '#E5E7EB')} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#374151] mb-1">Loại</label>
                      <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2.5 text-sm text-[#374151]" style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}>
                        {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#374151] mb-1">Đơn vị tính</label>
                      <input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="kg, hộp, con..."
                        className="w-full px-3 py-2.5 text-sm text-[#111827]" style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#374151] mb-1">Giá niêm yết *</label>
                      <input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="150000" type="number"
                        className="w-full px-3 py-2.5 text-sm text-[#111827]" style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#374151] mb-1">Thuế (%)</label>
                      <input value={form.thue} onChange={e => setForm(f => ({ ...f, thue: e.target.value }))} placeholder="0" type="number"
                        className="w-full px-3 py-2.5 text-sm text-[#111827]" style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#374151] mb-1">Trạng thái bán hàng</label>
                      <select value={form.coTheBan} onChange={e => setForm(f => ({ ...f, coTheBan: e.target.value }))} className="w-full px-3 py-2.5 text-sm text-[#374151]" style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}>
                        <option value="1">Cho phép bán</option>
                        <option value="0">Ngừng bán</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 px-6 py-4 border-t border-[#E5E7EB]">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 text-sm text-[#374151] rounded-lg" style={{ border: '1.5px solid #E5E7EB', cursor: 'pointer', backgroundColor: 'white' }}>Hủy</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 text-sm text-white rounded-lg"
                style={{ backgroundColor: '#F97316', border: 'none', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
