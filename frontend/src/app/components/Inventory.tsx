import { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import { Package, ArrowDownCircle, ClipboardCheck, AlertTriangle, Eye, X, Warehouse, Calendar, User, ShoppingBag, Plus, Trash2 } from 'lucide-react';
import { inventoryApi, productApi } from '../api';

const card = { boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)', borderRadius: 12 };
const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ₫';

type Tab = 'stock' | 'import' | 'check';

export function Inventory() {
  const location = useLocation();
  const [tab, setTab] = useState<Tab>('stock');

  useEffect(() => {
    if (location.state && (location.state as any).tab) {
      setTab((location.state as any).tab);
    }
  }, [location.state]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [checks, setChecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States for purchase imports in stock-in
  const [imports, setImports] = useState<any[]>([]);
  const [selectedImport, setSelectedImport] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [importDetails, setImportDetails] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [importForm, setImportForm] = useState({ items: [{ maSanPham: '', soLuong: '', giaNhap: '' }] });
  const [checkForm, setCheckForm] = useState({ items: [{ productId: '', actualQty: '', note: '' }] });
  const [saving, setSaving] = useState(false);

  const fetchImports = async () => {
    try {
      const data = await inventoryApi.getImports();
      setImports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchData = (isFirstLoad = false) => {
    if (isFirstLoad) setLoading(true);
    Promise.all([inventoryApi.getAll(), productApi.getAll(), inventoryApi.getChecks(), fetchImports()])
      .then(([inv, prod, chks]) => {
        setInventory(Array.isArray(inv) ? inv : inv.inventory || []);
        setProducts(Array.isArray(prod) ? prod : prod.products || []);
        setChecks(Array.isArray(chks) ? chks : chks.checks || []);
      })
      .catch(console.error).finally(() => {
        if (isFirstLoad) setLoading(false);
      });
  };
  useEffect(() => { fetchData(true); }, []);

  const handleImport = async () => {
    const valid = importForm.items.filter(i => i.maSanPham && i.soLuong);
    if (valid.length === 0) {
      alert('Vui lòng chọn ít nhất một sản phẩm và nhập số lượng nhập kho!');
      return;
    }
    setSaving(true);
    try {
      await inventoryApi.importStock({ items: valid.map(i => ({ maSanPham: Number(i.maSanPham), soLuong: Number(i.soLuong), giaNhap: Number(i.giaNhap) || 0 })) });
      setImportForm({ items: [{ maSanPham: '', soLuong: '', giaNhap: '' }] });
      fetchData(false);
      alert('Nhập kho thành công!');
    } catch(e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDetail = async (imp: any) => {
    setSelectedImport(imp);
    setShowDetailModal(true);
    setDetailLoading(true);
    try {
      const data = await inventoryApi.getImportDetail(imp.mahoadonnhap);
      setImportDetails(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleReceiveImport = async (id: number) => {
    if (!confirm('Xác nhận đã nhận đủ hàng và tiến hành nhập kho thực tế? Thao tác này sẽ tự động cộng số lượng hàng vào tồn kho.')) return;
    setSaving(true);
    try {
      await inventoryApi.receiveImport(id);
      alert('Nhập kho thực tế và cập nhật tồn kho thành công!');
      fetchData(false);
    } catch (err: any) {
      alert(err.message || 'Lỗi xác nhận nhập kho');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCheckRow = () => {
    setCheckForm({ ...checkForm, items: [...checkForm.items, { productId: '', actualQty: '', note: '' }] });
  };

  const handleRemoveCheckRow = (index: number) => {
    if (checkForm.items.length === 1) return;
    setCheckForm({ ...checkForm, items: checkForm.items.filter((_, idx) => idx !== index) });
  };

  const handleCheckRowChange = (index: number, field: string, value: any) => {
    const updated = [...checkForm.items];
    updated[index] = { ...updated[index], [field]: value };
    setCheckForm({ ...checkForm, items: updated });
  };

  const handleCheck = async () => {
    const invalid = checkForm.items.some(item => !item.productId || item.actualQty === '');
    if (invalid) {
      alert('Vui lòng chọn sản phẩm và nhập số lượng thực tế cho tất cả các dòng!');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        items: checkForm.items.map(item => ({
          maSanPham: Number(item.productId),
          soLuongThucTe: Number(item.actualQty),
          ghiChu: item.note
        }))
      };
      await inventoryApi.check(payload);
      setCheckForm({ items: [{ productId: '', actualQty: '', note: '' }] });
      fetchData(false);
      alert('Kiểm kê thành công!');
    } catch(e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: 'stock', label: 'Tồn kho', icon: Package },
    { key: 'import', label: 'Nhập kho', icon: ArrowDownCircle },
    { key: 'check', label: 'Kiểm kê', icon: ClipboardCheck },
  ] as const;

  if (loading) return <div className="flex items-center justify-center h-64 text-[#6B7280]">Loading...</div>;

  return (
    <div className="space-y-5" style={{ fontFamily: 'Roboto, sans-serif' }}>
      <h1 className="text-[22px] text-[#111827]" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>Kho hàng</h1>

      <div className="flex gap-2">
        {tabs.map(t => {
          const Icon = t.icon; const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} className="flex items-center gap-2 px-4 py-2.5 text-sm"
              style={{ borderRadius: 8, border: `2px solid ${active ? '#F97316' : '#E5E7EB'}`, backgroundColor: active ? '#FFF0E6' : 'white', color: active ? '#F97316' : '#6B7280', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>
              <Icon size={16} />{t.label}
            </button>
          );
        })}
      </div>

      {tab === 'stock' && (
        <div className="bg-white overflow-hidden" style={card}>
          <table className="w-full">
            <thead><tr style={{ backgroundColor: '#F9FAFB' }}>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#6B7280]">Sản phẩm</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-[#6B7280]">Tồn kho</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[#6B7280]">Giá niêm yết</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-[#6B7280]">Trạng thái</th>
            </tr></thead>
            <tbody>
              {inventory.map((item: any, idx: number) => {
                const stock = Number(item.soluongton) || 0;
                const low = stock < 5;
                return (
                  <tr key={item.masanpham || idx} style={{ backgroundColor: idx % 2 === 1 ? '#FAFAFA' : 'white' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FFF0E6')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = idx % 2 === 1 ? '#FAFAFA' : 'white')}>
                    <td className="px-4 py-3 border-t border-[#F3F4F6] text-sm font-medium text-[#111827]">{item.tensanpham}</td>
                    <td className="px-4 py-3 border-t border-[#F3F4F6] text-center">
                      {low ? <span className="flex items-center justify-center gap-1 text-sm font-bold" style={{ color: '#EF4444' }}><AlertTriangle size={13} />{stock}</span>
                        : <span className="text-sm font-medium" style={{ color: '#10B981' }}>{stock}</span>}
                    </td>
                    <td className="px-4 py-3 border-t border-[#F3F4F6] text-right text-sm text-[#111827]">{fmt(Number(item.gianiemyet) || 0)}</td>
                    <td className="px-4 py-3 border-t border-[#F3F4F6] text-center">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={stock === 0 ? { backgroundColor: '#FEE2E2', color: '#991B1B' } : low ? { backgroundColor: '#FEF3C7', color: '#92400E' } : { backgroundColor: '#D1FAE5', color: '#065F46' }}>
                        {stock === 0 ? 'Hết hàng' : low ? 'Sắp hết' : 'Đủ hàng'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {inventory.length === 0 && <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-[#9CA3AF]">Không có dữ liệu</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'import' && (
        <div className="flex flex-col gap-6">
          {/* Đơn hàng mua chờ nhập kho */}
          <div className="bg-white p-6 flex flex-col" style={card}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 16, color: '#111827' }} className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-purple-600" /> Đơn hàng mua chờ nhập kho
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                {imports.filter(i => i.trangthai_thanhtoan === 'Chờ nhập kho').length} đơn chờ
              </span>
            </div>

            <div className="flex-1 overflow-auto max-h-[300px] border border-[#F3F4F6] rounded-xl">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB' }}>
                    <th className="px-4 py-3 text-left text-xs font-bold text-[#6B7280] uppercase">Mã đơn</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-[#6B7280] uppercase">Ngày lập</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-[#6B7280] uppercase">Nhà cung cấp</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-[#6B7280] uppercase">Tổng tiền</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-[#6B7280] uppercase">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {imports
                    .filter((imp: any) => imp.trangthai_thanhtoan === 'Chờ nhập kho')
                    .map((imp: any, idx: number) => (
                      <tr key={imp.mahoadonnhap || idx} className="hover:bg-purple-50/30 transition-colors text-sm">
                        <td className="px-4 py-3 font-bold text-[#111827]">#{imp.mahoadonnhap}</td>
                        <td className="px-4 py-3 text-gray-500">{new Date(imp.ngaylap).toLocaleDateString('vi-VN')}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{imp.tennhacungcap || '—'}</td>
                        <td className="px-4 py-3 text-right font-bold text-purple-700">{fmt(imp.tongtien || 0)}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center items-center gap-1.5">
                            <button
                              onClick={() => handleOpenDetail(imp)}
                              className="p-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all"
                              style={{ border: 'none', cursor: 'pointer' }}
                              title="Xem chi tiết đơn hàng"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => handleReceiveImport(imp.mahoadonnhap)}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded transition-all shadow shadow-purple-500/10"
                              style={{ border: 'none', cursor: 'pointer' }}
                            >
                              <Warehouse size={12} /> Nhập kho
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {imports.filter(i => i.trangthai_thanhtoan === 'Chờ nhập kho').length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-sm text-[#9CA3AF]">
                        <Warehouse className="mx-auto text-gray-300 mb-2" size={36} />
                        Không có đơn mua hàng nào đang chờ nhập kho
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lịch sử nhập kho thành công */}
          <div className="bg-white p-6 flex flex-col" style={card}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 16, color: '#111827' }} className="flex items-center gap-2">
                <ClipboardCheck size={18} className="text-emerald-600" /> Lịch sử nhập kho thành công
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 animate-fadeIn">
                {imports.filter(i => i.trangthai_thanhtoan !== 'Chờ nhập kho').length} đơn đã nhập
              </span>
            </div>

            <div className="flex-1 overflow-auto max-h-[300px] border border-[#F3F4F6] rounded-xl">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB' }}>
                    <th className="px-4 py-3 text-left text-xs font-bold text-[#6B7280] uppercase">Mã đơn</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-[#6B7280] uppercase">Ngày nhập</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-[#6B7280] uppercase">Nhà cung cấp</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-[#6B7280] uppercase">Tổng tiền</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-[#6B7280] uppercase">Trạng thái</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-[#6B7280] uppercase">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {imports
                    .filter((imp: any) => imp.trangthai_thanhtoan !== 'Chờ nhập kho')
                    .map((imp: any, idx: number) => (
                      <tr key={imp.mahoadonnhap || idx} className="hover:bg-emerald-50/20 transition-colors text-sm animate-fadeIn">
                        <td className="px-4 py-3 font-bold text-[#111827]">#{imp.mahoadonnhap}</td>
                        <td className="px-4 py-3 text-gray-500">{new Date(imp.ngaylap).toLocaleDateString('vi-VN')}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{imp.tennhacungcap || 'Nhập lẻ tự do'}</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-700">{fmt(imp.tongtien || 0)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            Đã nhập kho
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleOpenDetail(imp)}
                            className="p-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all inline-flex items-center"
                            style={{ border: 'none', cursor: 'pointer' }}
                            title="Xem chi tiết đơn nhập"
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  {imports.filter(i => i.trangthai_thanhtoan !== 'Chờ nhập kho').length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm text-[#9CA3AF]">
                        <Warehouse className="mx-auto text-gray-300 mb-2" size={36} />
                        Chưa có lịch sử nhập kho nào thành công
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'check' && (
        <div className="space-y-6">
          {/* Phiếu kiểm kê - multi-row */}
          <div className="bg-white p-6" style={card}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 16, color: '#111827' }}>Phiếu kiểm kê</h3>
              <button
                onClick={handleAddCheckRow}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white rounded-lg"
                style={{ backgroundColor: '#F97316', border: 'none', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}
              >
                <Plus size={13} /> Thêm sản phẩm
              </button>
            </div>
            <div className="overflow-auto border border-[#F3F4F6] rounded-lg mb-4">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB' }}>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#6B7280] w-1/2">Sản phẩm *</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#6B7280] w-28">SL thực tế *</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#6B7280]">Ghi chú</th>
                    <th className="px-3 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {checkForm.items.map((item, index) => (
                    <tr key={index} className="border-t border-[#F3F4F6]">
                      <td className="px-3 py-2">
                        <select
                          value={item.productId}
                          onChange={e => handleCheckRowChange(index, 'productId', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm"
                          style={{ border: '1.5px solid #E5E7EB', borderRadius: 6, outline: 'none' }}
                        >
                          <option value="">Chọn SP...</option>
                          {products.map((p: any) => <option key={p.masanpham} value={p.masanpham}>{p.tensanpham}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.actualQty}
                          onChange={e => handleCheckRowChange(index, 'actualQty', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm"
                          style={{ border: '1.5px solid #E5E7EB', borderRadius: 6, outline: 'none' }}
                          min={0}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.note}
                          onChange={e => handleCheckRowChange(index, 'note', e.target.value)}
                          placeholder="Ghi chú..."
                          className="w-full px-2 py-1.5 text-sm"
                          style={{ border: '1.5px solid #E5E7EB', borderRadius: 6, outline: 'none' }}
                        />
                      </td>
                      <td className="px-2 py-2 text-center">
                        {checkForm.items.length > 1 && (
                          <button
                            onClick={() => handleRemoveCheckRow(index)}
                            className="p-1 rounded hover:bg-red-50 text-[#EF4444]"
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={handleCheck}
              disabled={saving}
              className="px-6 py-2.5 text-sm text-white rounded-lg"
              style={{ backgroundColor: '#10B981', border: 'none', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}
            >
              {saving ? 'Đang xử lý...' : `Kiểm kê (${checkForm.items.length} sản phẩm)`}
            </button>
          </div>

          {/* Chi tiết kiểm kê */}
          <div className="bg-white p-6" style={card}>
            <h3 className="mb-4" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 16, color: '#111827' }}>Chi tiết kiểm kê</h3>
            <div className="overflow-auto max-h-[400px] border border-[#F3F4F6] rounded-lg">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB' }}>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#6B7280]">Phiếu #</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#6B7280]">Sản phẩm</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-[#6B7280]">SL hệ thống</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-[#6B7280]">SL thực tế</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-[#6B7280]">Lệch</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#6B7280]">Người kiểm</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#6B7280]">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {checks.map((c: any, i: number) => {
                    const lech = Number(c.sllech) || 0;
                    return (
                      <tr key={`${c.makiemke}-${i}`} className="border-t border-[#F3F4F6] text-xs hover:bg-orange-50/50">
                        <td className="px-3 py-2.5 text-[#9CA3AF] font-medium">
                          <p className="font-semibold text-[#374151]">#{c.makiemke}</p>
                          <p className="text-[10px]">{c.ngaykiemke ? new Date(c.ngaykiemke).toLocaleDateString('vi-VN') : ''}</p>
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-[#111827]">{c.tensanpham}</td>
                        <td className="px-3 py-2.5 text-center text-[#374151]">{c.slhethong ?? '—'}</td>
                        <td className="px-3 py-2.5 text-center text-[#374151]">{c.slthucte ?? '—'}</td>
                        <td className="px-3 py-2.5 text-center font-bold">
                          {lech > 0 ? <span className="text-[#10B981]">{`+${lech}`}</span>
                            : lech < 0 ? <span className="text-[#EF4444]">{lech}</span>
                            : <span className="text-[#6B7280]">0</span>}
                        </td>
                        <td className="px-3 py-2.5 text-[#374151]">{c.tennguoikiemke || 'Hệ thống'}</td>
                        <td className="px-3 py-2.5 text-[#6B7280] italic max-w-[140px] truncate" title={c.lydolech || ''}>{c.lydolech || '—'}</td>
                      </tr>
                    );
                  })}
                  {checks.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-sm text-[#9CA3AF]">
                        Chưa có chi tiết kiểm kê
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal chi tiết đơn hàng mua chờ nhập kho */}
      {showDetailModal && selectedImport && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 p-6 shadow-2xl" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F3F4F6]">
              <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 18, color: '#111827' }}>
                Chi tiết đơn mua hàng #{selectedImport.mahoadonnhap}
              </h3>
              <button onClick={() => setShowDetailModal(false)} className="p-2 rounded-lg hover:bg-gray-100 text-[#6B7280]" style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm bg-gray-50 p-4 rounded-xl">
              <div>
                <p className="text-xs text-[#9CA3AF] uppercase font-bold tracking-wider">Nhà cung cấp</p>
                <p className="font-semibold text-gray-800 mt-0.5">{selectedImport.tennhacungcap || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[#9CA3AF] uppercase font-bold tracking-wider">Người lập đơn</p>
                <p className="font-semibold text-gray-800 mt-0.5">{selectedImport.tennhanvien || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[#9CA3AF] uppercase font-bold tracking-wider">Ngày lập đơn</p>
                <p className="font-semibold text-gray-800 mt-0.5">{new Date(selectedImport.ngaylap).toLocaleDateString('vi-VN')} {new Date(selectedImport.ngaylap).toLocaleTimeString('vi-VN')}</p>
              </div>
              <div>
                <p className="text-xs text-[#9CA3AF] uppercase font-bold tracking-wider">Phương thức thanh toán</p>
                <p className="font-semibold text-gray-800 mt-0.5">{selectedImport.phuongthucthanhtoan}</p>
              </div>
              {selectedImport.ghichu && (
                <div className="col-span-2">
                  <p className="text-xs text-[#9CA3AF] uppercase font-bold tracking-wider">Ghi chú</p>
                  <p className="text-gray-700 mt-0.5">{selectedImport.ghichu}</p>
                </div>
              )}
            </div>

            <h4 className="font-bold text-sm text-[#111827] mb-2 uppercase tracking-wide">Danh sách sản phẩm nhập</h4>
            <div className="overflow-auto max-h-60 border border-gray-100 rounded-xl">
              {detailLoading ? (
                <div className="p-6 text-center text-gray-500">Đang tải chi tiết...</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-2 text-left text-xs font-semibold text-[#6B7280]">Tên sản phẩm</th>
                      <th className="px-4 py-2 text-center text-xs font-semibold text-[#6B7280]">Số lượng</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-[#6B7280]">Đơn giá</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-[#6B7280]">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {importDetails.map((d: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2 font-medium text-gray-800">{d.tensanpham}</td>
                        <td className="px-4 py-2 text-center text-gray-600 font-bold">{d.soluong}</td>
                        <td className="px-4 py-2 text-right text-gray-600">{fmt(d.dongia)}</td>
                        <td className="px-4 py-2 text-right font-bold text-orange-600">{fmt(d.thanhtien)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#F3F4F6] flex items-center justify-between">
              <div>
                <span className="text-xs text-[#9CA3AF] uppercase font-bold">Tổng cộng tiền hàng</span>
                <p className="text-lg font-black text-orange-600">{fmt(selectedImport.tongtien)}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 transition-all"
                  style={{ border: 'none', borderRadius: 8, cursor: 'pointer', background: 'transparent' }}
                >
                  Đóng
                </button>
                {selectedImport.trangthai_thanhtoan === 'Chờ nhập kho' && (
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleReceiveImport(selectedImport.mahoadonnhap);
                    }}
                    className="flex items-center gap-1 px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 transition-all font-bold"
                    style={{ border: 'none', borderRadius: 8, cursor: 'pointer' }}
                  >
                    <Warehouse size={14} /> Xác nhận nhập kho
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
