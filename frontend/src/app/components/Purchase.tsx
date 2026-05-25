import { useState, useEffect } from 'react';
import { Plus, Search, Eye, X, Calendar, ShoppingBag, DollarSign, User, FileText, CheckCircle2, XCircle, ChevronRight, Edit3, Trash2, ShieldAlert, Lock, Unlock, Phone, Mail, MapPin, Warehouse } from 'lucide-react';
import { inventoryApi } from '../api';

const cardStyle = {
  boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
  borderRadius: 12
};

export function Purchase() {
  const [activeTab, setActiveTab] = useState<'imports' | 'suppliers'>('imports');
  const [imports, setImports] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [suppliersDetailed, setSuppliersDetailed] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedImport, setSelectedImport] = useState<any>(null);
  const [importDetails, setImportDetails] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Supplier Modals state
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showEditSupplierModal, setShowEditSupplierModal] = useState(false);
  const [selectedSupplierObj, setSelectedSupplierObj] = useState<any>(null);

  // Form state for creating import
  const [selectedSupplier, setSelectedSupplier] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('Tiền mặt');
  const [note, setNote] = useState('');
  const [importRows, setImportRows] = useState<Array<{ masanpham: number | ''; soluong: number; dongia: number }>>([
    { masanpham: '', soluong: 1, dongia: 0 }
  ]);
  const [saving, setSaving] = useState(false);

  // Form state for Supplier
  const [supName, setSupName] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supTaxId, setSupTaxId] = useState('');
  const [supTerm, setSupTerm] = useState('Ngay khi giao hàng');
  const [supNote, setSupNote] = useState('');

  const fetchImports = async () => {
    setLoading(true);
    try {
      const data = await inventoryApi.getImports();
      setImports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliersDetailed = async () => {
    setLoading(true);
    try {
      const data = await inventoryApi.getSuppliersDetailed();
      setSuppliersDetailed(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInitialData = async () => {
    try {
      const [sups, prods] = await Promise.all([
        inventoryApi.getSuppliers(),
        inventoryApi.getAll()
      ]);
      setSuppliers(Array.isArray(sups) ? sups : []);
      setProducts(Array.isArray(prods) ? prods : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'imports') {
      fetchImports();
    } else {
      fetchSuppliersDetailed();
    }
    fetchInitialData();
  }, [activeTab]);

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


  const handleDeleteImport = async (id: number) => {
    if (!confirm('CẢNH BÁO: Xóa hóa đơn này sẽ tự động trừ số lượng tồn kho đã nhập tương ứng. Bạn có chắc chắn muốn xóa?')) return;
    try {
      await inventoryApi.deleteImport(id);
      alert('Đã xóa hóa đơn nhập và hoàn tác tồn kho thành công!');
      fetchImports();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa hóa đơn');
    }
  };

  const handleApproveImport = async (id: number) => {
    if (!confirm('Bạn có đồng ý phê duyệt đơn mua hàng này? Trạng thái sẽ chuyển sang Chờ nhập kho.')) return;
    try {
      await inventoryApi.approveImport(id);
      alert('Phê duyệt đơn mua thành công! Đã chuyển trạng thái sang Chờ nhập kho.');
      fetchImports();
    } catch (err: any) {
      alert(err.message || 'Lỗi phê duyệt hóa đơn');
    }
  };


  const handleReceiveImport = async (id: number) => {
    if (!confirm('Xác nhận đã nhận đủ hàng và tiến hành nhập kho thực tế? Thao tác này sẽ tự động cộng số lượng hàng vào tồn kho.')) return;
    try {
      await inventoryApi.receiveImport(id);
      alert('Nhập kho thực tế và cập nhật tồn kho thành công!');
      fetchImports();
    } catch (err: any) {
      alert(err.message || 'Lỗi xác nhận nhập kho');
    }
  };

  const handlePayImport = async (id: number) => {
    if (!confirm('Xác nhận thanh toán cho hóa đơn nhập hàng này?')) return;
    try {
      await inventoryApi.payImport(id);
      alert('Thanh toán hóa đơn nhập hàng thành công!');
      fetchImports();
    } catch (err: any) {
      alert(err.message || 'Lỗi thanh toán hóa đơn');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Chờ duyệt':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">Chờ duyệt</span>;
      case 'Chờ nhập kho':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">Chờ nhập kho</span>;
      case 'Chờ thanh toán':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">Chờ thanh toán</span>;
      case 'Đã thanh toán':
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Đã thanh toán</span>;
    }
  };

  const handleAddRow = () => {
    setImportRows([...importRows, { masanpham: '', soluong: 1, dongia: 0 }]);
  };

  const handleRemoveRow = (index: number) => {
    if (importRows.length === 1) return;
    setImportRows(importRows.filter((_, idx) => idx !== index));
  };

  const handleRowChange = (index: number, field: string, value: any) => {
    const updated = [...importRows];
    if (field === 'masanpham') {
      const prodId = Number(value);
      updated[index].masanpham = prodId;
      const selectedProd = products.find(p => p.masanpham === prodId);
      if (selectedProd) {
        updated[index].dongia = Math.round(selectedProd.gianiemyet * 0.7);
      }
    } else if (field === 'soluong') {
      updated[index].soluong = Math.max(1, Number(value));
    } else if (field === 'dongia') {
      updated[index].dongia = Math.max(0, Number(value));
    }
    setImportRows(updated);
  };

  const calculateTotal = () => {
    return importRows.reduce((sum, row) => sum + (row.soluong * row.dongia), 0);
  };

  const handleCreateImport = async () => {
    const validRows = importRows.filter(r => r.masanpham !== '');
    if (validRows.length === 0) {
      alert('Vui lòng chọn ít nhất một sản phẩm!');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        madoitac: selectedSupplier !== '' ? Number(selectedSupplier) : null,
        ghichu: note,
        phuongthucthanhtoan: paymentMethod,
        items: validRows
      };

      const res = await inventoryApi.importStock(payload);
      alert(res.message || 'Lập đơn mua hàng thành công!');
      setShowAddModal(false);
      
      setSelectedSupplier('');
      setPaymentMethod('Tiền mặt');
      setNote('');
      setImportRows([{ masanpham: '', soluong: 1, dongia: 0 }]);
      
      fetchImports();
    } catch (err: any) {
      alert(err.message || 'Lỗi lập đơn mua hàng');
    } finally {
      setSaving(false);
    }
  };

  // Supplier handlers
  const handleCreateSupplier = async () => {
    if (!supName || !supTaxId) {
      alert('Tên nhà cung cấp và Mã số thuế là bắt buộc!');
      return;
    }
    setSaving(true);
    try {
      await inventoryApi.createSupplier({
        tendoitac: supName,
        sodienthoai: supPhone,
        diachi: supAddress,
        email: supEmail,
        masothue: supTaxId,
        dieukhoanthanhtoan: supTerm,
        ghichu: supNote
      });
      alert('Thêm nhà cung cấp mới thành công!');
      setShowAddSupplierModal(false);
      
      // Reset form
      setSupName('');
      setSupPhone('');
      setSupAddress('');
      setSupEmail('');
      setSupTaxId('');
      setSupTerm('Ngay khi giao hàng');
      setSupNote('');

      fetchSuppliersDetailed();
    } catch (err: any) {
      alert(err.message || 'Lỗi thêm nhà cung cấp');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEditSupplier = (sup: any) => {
    setSelectedSupplierObj(sup);
    setSupName(sup.tendoitac);
    setSupPhone(sup.sodienthoai || '');
    setSupAddress(sup.diachi || '');
    setSupEmail(sup.email || '');
    setSupTaxId(sup.masothue);
    setSupTerm(sup.dieukhoanthanhtoan || 'Ngay khi giao hàng');
    setSupNote(sup.ghichu || '');
    setShowEditSupplierModal(true);
  };

  const handleUpdateSupplier = async () => {
    if (!selectedSupplierObj) return;
    setSaving(true);
    try {
      await inventoryApi.updateSupplier(selectedSupplierObj.madoitac, {
        tendoitac: supName,
        sodienthoai: supPhone,
        diachi: supAddress,
        email: supEmail,
        masothue: supTaxId,
        dieukhoanthanhtoan: supTerm,
        ghichu: supNote
      });
      alert('Cập nhật thông tin nhà cung cấp thành công!');
      setShowEditSupplierModal(false);
      fetchSuppliersDetailed();
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật nhà cung cấp');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSupplierStatus = async (sup: any) => {
    const nextStatus = sup.trangthai === 1 ? 0 : 1;
    const msg = nextStatus === 0 
      ? 'Bạn có chắc chắn muốn khóa nhà cung cấp này? Họ sẽ không thể được chọn khi tạo đơn hàng mới!'
      : 'Bạn muốn mở khóa hoạt động cho nhà cung cấp này?';
    if (!confirm(msg)) return;
    try {
      const res = await inventoryApi.toggleSupplierStatus(sup.madoitac, nextStatus);
      alert(res.message);
      if (activeTab === 'imports') {
        fetchInitialData();
      } else {
        fetchSuppliersDetailed();
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi thay đổi trạng thái');
    }
  };

  const filteredImports = imports.filter((imp: any) => {
    const term = search.toLowerCase();
    return (
      (imp.mahoadonnhap || '').toString().includes(term) ||
      (imp.tennhacungcap || '').toLowerCase().includes(term) ||
      (imp.tennhanvien || '').toLowerCase().includes(term)
    );
  });

  const filteredSuppliers = suppliersDetailed.filter((sup: any) => {
    const term = search.toLowerCase();
    return (
      (sup.tendoitac || '').toLowerCase().includes(term) ||
      (sup.sodienthoai || '').includes(term) ||
      (sup.masothue || '').toLowerCase().includes(term)
    );
  });

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="space-y-6" style={{ fontFamily: 'Roboto, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] text-[#111827]" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800 }}>
            Phân hệ mua hàng & Đối tác
          </h1>
          <p className="text-sm text-[#6B7280]">Theo dõi hóa đơn nhập, quản lý thông tin nhà cung cấp và điều khoản mua hàng</p>
        </div>
        
        {activeTab === 'imports' ? (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-white text-sm hover:opacity-90 transition-all shadow-md shadow-orange-500/20"
            style={{ backgroundColor: '#F97316', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}
          >
            <Plus size={16} /> Tạo đơn mua hàng
          </button>
        ) : (
          <button
            onClick={() => setShowAddSupplierModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-white text-sm hover:opacity-90 transition-all shadow-md shadow-blue-500/20"
            style={{ backgroundColor: '#2563EB', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}
          >
            <Plus size={16} /> Thêm nhà cung cấp
          </button>
        )}
      </div>

      {/* Tabs selector */}
      <div className="flex gap-2 border-b border-[#E5E7EB] pb-px">
        <button
          onClick={() => { setActiveTab('imports'); setSearch(''); }}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'imports' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <ShoppingBag size={16} /> Hóa đơn nhập hàng
        </button>
        <button
          onClick={() => { setActiveTab('suppliers'); setSearch(''); }}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'suppliers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <User size={16} /> Quản lý Nhà cung cấp
        </button>
      </div>

      {activeTab === 'imports' ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-5 flex items-center gap-4" style={cardStyle}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-50 text-orange-500">
                <ShoppingBag size={24} />
              </div>
              <div>
                <p className="text-xs text-[#9CA3AF] uppercase font-bold tracking-wider">Tổng số đơn mua</p>
                <h3 className="text-xl font-bold text-[#111827] mt-0.5">{imports.length} đơn</h3>
              </div>
            </div>
            <div className="bg-white p-5 flex items-center gap-4" style={cardStyle}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-500">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-xs text-[#9CA3AF] uppercase font-bold tracking-wider">Tổng giá trị nhập</p>
                <h3 className="text-xl font-bold text-emerald-600 mt-0.5">
                  {formatPrice(imports.reduce((sum, i) => sum + (i.tongtien || 0), 0))}
                </h3>
              </div>
            </div>
            <div className="bg-white p-5 flex items-center gap-4" style={cardStyle}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 text-blue-500">
                <User size={24} />
              </div>
              <div>
                <p className="text-xs text-[#9CA3AF] uppercase font-bold tracking-wider">Đối tác nhà cung cấp</p>
                <h3 className="text-xl font-bold text-blue-600 mt-0.5">{suppliers.length} nhà cung cấp</h3>
              </div>
            </div>
          </div>

          {/* Imports Table Card */}
          <div className="bg-white overflow-hidden" style={cardStyle}>
            <div className="p-4 border-b border-[#F3F4F6] flex items-center justify-between gap-4">
              <div className="relative w-80">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Tìm kiếm mã đơn, nhà cung cấp..."
                  className="pl-9 pr-4 py-2 text-sm text-[#111827] w-full"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64 text-[#6B7280]">Loading...</div>
            ) : filteredImports.length === 0 ? (
              <div className="p-12 text-center text-[#9CA3AF]">
                <ShoppingBag className="mx-auto text-gray-300 mb-3" size={40} />
                <p className="text-sm">Không tìm thấy đơn mua hàng nào</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB' }}>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#6B7280] uppercase">Mã đơn</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#6B7280] uppercase">Ngày lập</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#6B7280] uppercase">Nhà cung cấp</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#6B7280] uppercase">Người lập</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-[#6B7280] uppercase">Tổng tiền</th>
                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-[#6B7280] uppercase">Thanh toán</th>
                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-[#6B7280] uppercase">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {filteredImports.map((imp: any) => (
                    <tr key={imp.mahoadonnhap} className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="px-5 py-4 text-sm font-bold text-[#111827]">#{imp.mahoadonnhap}</td>
                      <td className="px-5 py-4 text-sm text-[#6B7280]">
                        {new Date(imp.ngaylap).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-[#111827]">{imp.tennhacungcap || '—'}</td>
                      <td className="px-5 py-4 text-sm text-[#6B7280]">{imp.tennhanvien || '—'}</td>
                      <td className="px-5 py-4 text-sm text-right font-bold text-orange-600">
                        {formatPrice(imp.tongtien || 0)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {getStatusBadge(imp.trangthai_thanhtoan)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex justify-center items-center gap-1">
                          {imp.trangthai_thanhtoan === 'Chờ duyệt' && (
                            <button
                              onClick={() => handleApproveImport(imp.mahoadonnhap)}
                              className="px-2 py-1 text-xs font-bold text-white bg-amber-500 rounded hover:bg-amber-600 transition-all flex items-center gap-1 mr-1"
                              title="Duyệt hóa đơn"
                            >
                              <CheckCircle2 size={12} /> Duyệt
                            </button>
                          )}
                          {imp.trangthai_thanhtoan === 'Chờ nhập kho' && (
                            <button
                              onClick={() => handleReceiveImport(imp.mahoadonnhap)}
                              className="px-2 py-1 text-xs font-bold text-white bg-purple-600 rounded hover:bg-purple-700 transition-all flex items-center gap-1 mr-1"
                              title="Xác nhận nhập kho"
                            >
                              <Warehouse size={12} /> Nhập kho
                            </button>
                          )}
                          {imp.trangthai_thanhtoan === 'Chờ thanh toán' && (
                            <button
                              onClick={() => handlePayImport(imp.mahoadonnhap)}
                              className="px-2 py-1 text-xs font-bold text-white bg-blue-600 rounded hover:bg-blue-700 transition-all flex items-center gap-1 mr-1"
                              title="Thanh toán"
                            >
                              <DollarSign size={12} /> Thanh toán
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenDetail(imp)}
                            className="p-1.5 rounded-lg hover:bg-orange-50 text-[#F97316] transition-all"
                            title="Xem chi tiết"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteImport(imp.mahoadonnhap)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-all"
                            title="Xóa hóa đơn nhập"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        /* Suppliers Detailed tab */
        <div className="bg-white overflow-hidden" style={cardStyle}>
          <div className="p-4 border-b border-[#F3F4F6] flex items-center justify-between gap-4">
            <div className="relative w-80">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm tên, SĐT, mã số thuế..."
                className="pl-9 pr-4 py-2 text-sm text-[#111827] w-full"
                style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64 text-[#6B7280]">Loading...</div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="p-12 text-center text-[#9CA3AF]">
              <User className="mx-auto text-gray-300 mb-3" size={40} />
              <p className="text-sm">Không tìm thấy nhà cung cấp nào</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB' }}>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#6B7280] uppercase">Tên nhà cung cấp</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#6B7280] uppercase">Mã số thuế</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#6B7280] uppercase">Liên hệ</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#6B7280] uppercase">Địa chỉ</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#6B7280] uppercase">Điều khoản</th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-[#6B7280] uppercase">Trạng thái</th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-[#6B7280] uppercase">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {filteredSuppliers.map((sup: any) => (
                  <tr key={sup.madoitac} className="hover:bg-[#FAF9F6] transition-colors">
                    <td className="px-5 py-4 font-bold text-[#111827] text-sm">
                      {sup.tendoitac}
                      {sup.ghichu && <p className="text-[11px] text-gray-400 font-normal">{sup.ghichu}</p>}
                    </td>
                    <td className="px-5 py-4 text-sm text-[#4B5563] font-semibold">{sup.masothue}</td>
                    <td className="px-5 py-4 space-y-1">
                      {sup.sodienthoai && <p className="text-xs text-[#4B5563] flex items-center gap-1"><Phone size={11} className="text-gray-400" /> {sup.sodienthoai}</p>}
                      {sup.email && <p className="text-xs text-[#4B5563] flex items-center gap-1"><Mail size={11} className="text-gray-400" /> {sup.email}</p>}
                    </td>
                    <td className="px-5 py-4 text-xs text-[#6B7280] max-w-[200px] truncate">
                      <span className="flex items-center gap-1"><MapPin size={11} className="text-gray-400 flex-shrink-0" /> {sup.diachi || '—'}</span>
                    </td>
                    <td className="px-5 py-4 text-xs text-[#4B5563] font-semibold">{sup.dieukhoanthanhtoan || 'Ngay khi giao hàng'}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${sup.trangthai === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {sup.trangthai === 1 ? 'Hoạt động' : 'Bị khóa'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditSupplier(sup)}
                          className="p-1 rounded hover:bg-blue-50 text-blue-600"
                          title="Sửa nhà cung cấp"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleToggleSupplierStatus(sup)}
                          className={`p-1 rounded hover:bg-gray-100 ${sup.trangthai === 1 ? 'text-rose-600' : 'text-emerald-600'}`}
                          title={sup.trangthai === 1 ? 'Khóa nhà cung cấp' : 'Mở khóa nhà cung cấp'}
                        >
                          {sup.trangthai === 1 ? <Lock size={15} /> : <Unlock size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add Import Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl w-full max-w-3xl mx-4 p-6" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.14)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F3F4F6]">
              <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 18, color: '#111827' }}>
                Lập đơn mua hàng từ nhà cung cấp
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-gray-100 text-[#6B7280]">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Nhà cung cấp</label>
                <select
                  value={selectedSupplier}
                  onChange={e => setSelectedSupplier(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                >
                  <option value="">Chọn nhà cung cấp...</option>
                  {suppliers.map(s => (
                    <option key={s.madoitac} value={s.madoitac}>
                      {s.tendoitac} {s.masothue ? `(MST: ${s.masothue})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Thanh toán</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-sm"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                >
                  <option value="Tiền mặt">Tiền mặt</option>
                  <option value="Chuyển khoản">Chuyển khoản</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Ghi chú</label>
                <input
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Ghi chú đơn hàng..."
                  className="w-full px-3 py-2 text-sm"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                />
              </div>
            </div>

            {/* Rows list */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Danh sách sản phẩm mua</h4>
                <button
                  onClick={handleAddRow}
                  className="text-xs text-[#F97316] font-bold hover:underline flex items-center gap-1"
                >
                  + Thêm dòng sản phẩm
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {importRows.map((row, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <select
                      value={row.masanpham}
                      onChange={e => handleRowChange(idx, 'masanpham', e.target.value)}
                      className="flex-1 px-3 py-2 text-sm"
                      style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                    >
                      <option value="">Chọn sản phẩm...</option>
                      {products.map(p => (
                        <option key={p.masanpham} value={p.masanpham}>
                          {p.tensanpham} ({p.donvitinh} - Niêm yết: {formatPrice(p.gianiemyet)})
                        </option>
                      ))}
                    </select>

                    <div className="w-24">
                      <input
                        type="number"
                        min="1"
                        value={row.soluong}
                        onChange={e => handleRowChange(idx, 'soluong', e.target.value)}
                        placeholder="SL"
                        className="w-full px-3 py-2 text-sm text-center"
                        style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                      />
                    </div>

                    <div className="w-32">
                      <input
                        type="number"
                        min="0"
                        value={row.dongia}
                        onChange={e => handleRowChange(idx, 'dongia', e.target.value)}
                        placeholder="Giá nhập"
                        className="w-full px-3 py-2 text-sm text-right"
                        style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                      />
                    </div>

                    <div className="w-32 text-right text-sm font-semibold text-gray-700 pr-2">
                      {formatPrice(row.soluong * row.dongia)}
                    </div>

                    <button
                      onClick={() => handleRemoveRow(idx)}
                      disabled={importRows.length === 1}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 disabled:opacity-30"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="border-t border-[#F3F4F6] pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-[#6B7280] font-semibold uppercase">Tổng giá trị đơn hàng</p>
                <h3 className="text-xl font-bold text-orange-600 mt-0.5">{formatPrice(calculateTotal())}</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-sm font-semibold border border-[#E5E7EB] rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleCreateImport}
                  disabled={saving}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-orange-500 rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-orange-500/10"
                >
                  {saving ? 'Đang tạo...' : 'Xác nhận nhập hàng'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Detail Import Modal */}
      {showDetailModal && selectedImport && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 p-6" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.14)' }}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F3F4F6]">
              <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 18, color: '#111827' }}>
                Chi tiết hóa đơn nhập hàng #{selectedImport.mahoadonnhap}
              </h3>
              <button onClick={() => setShowDetailModal(false)} className="p-2 rounded-lg hover:bg-gray-100 text-[#6B7280]">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-[#FAF9F6] p-4 rounded-xl mb-4 border border-[#F3EFE9]">
              <div className="space-y-2">
                <p className="flex items-center gap-2 text-sm text-[#4B5563]">
                  <Calendar size={14} className="text-orange-500" />
                  <strong>Ngày lập:</strong> {new Date(selectedImport.ngaylap).toLocaleDateString('vi-VN')}
                </p>
                <p className="flex items-center gap-2 text-sm text-[#4B5563]">
                  <User size={14} className="text-orange-500" />
                  <strong>Nhà cung cấp:</strong> {selectedImport.tennhacungcap || '—'}
                </p>
              </div>
              <div className="space-y-2">
                <p className="flex items-center gap-2 text-sm text-[#4B5563]">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <strong>Trạng thái:</strong> {selectedImport.trangthai_thanhtoan || 'Đã thanh toán'}
                </p>
                <p className="flex items-center gap-2 text-sm text-[#4B5563]">
                  <FileText size={14} className="text-orange-500" />
                  <strong>Ghi chú:</strong> {selectedImport.ghichu || 'Không có ghi chú'}
                </p>
              </div>
            </div>

            <h4 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">Danh mục hàng đã nhập</h4>
            
            {detailLoading ? (
              <div className="flex items-center justify-center h-32 text-gray-500">Đang tải chi tiết...</div>
            ) : importDetails.length === 0 ? (
              <div className="p-8 text-center text-[#9CA3AF]">Chưa có thông tin mặt hàng nhập</div>
            ) : (
              <div className="overflow-hidden border border-[#F3F4F6] rounded-xl mb-4">
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: '#F9FAFB' }}>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#6B7280]">Sản phẩm</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-[#6B7280] w-20">ĐVT</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-[#6B7280] w-24">Số lượng</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#6B7280] w-28">Đơn giá</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#6B7280] w-32">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6]">
                    {importDetails.map((det: any) => (
                      <tr key={det.machitiet}>
                        <td className="px-4 py-3 text-sm font-semibold text-[#111827]">{det.tensanpham}</td>
                        <td className="px-4 py-3 text-sm text-center text-[#6B7280]">{det.donvitinh}</td>
                        <td className="px-4 py-3 text-sm text-center text-[#111827] font-bold">{det.soluong}</td>
                        <td className="px-4 py-3 text-sm text-right text-[#6B7280]">{formatPrice(det.dongia)}</td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-orange-600">{formatPrice(det.thanhtien)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-[#F3F4F6] pt-4">
              <div>
                <p className="text-xs text-[#6B7280] font-semibold uppercase">Tổng cộng đơn hàng</p>
                <h3 className="text-xl font-bold text-orange-600 mt-0.5">{formatPrice(selectedImport.tongtien || 0)}</h3>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2.5 text-sm font-semibold bg-[#1C1C2E] text-white rounded-xl hover:opacity-90"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 p-6" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.14)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F3F4F6]">
              <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 18, color: '#111827' }} className="text-blue-600">
                Thêm đối tác Nhà cung cấp mới
              </h3>
              <button onClick={() => setShowAddSupplierModal(false)} className="p-2 rounded-lg hover:bg-gray-100 text-[#6B7280]">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Tên nhà cung cấp *</label>
                <input
                  value={supName}
                  onChange={e => setSupName(e.target.value)}
                  placeholder="Công ty TNHH Pet Food Việt Nam..."
                  className="w-full px-3 py-2 text-sm"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Mã số thuế *</label>
                <input
                  value={supTaxId}
                  onChange={e => setSupTaxId(e.target.value)}
                  placeholder="0102345678..."
                  className="w-full px-3 py-2 text-sm"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Số điện thoại</label>
                <input
                  value={supPhone}
                  onChange={e => setSupPhone(e.target.value)}
                  placeholder="0912345678..."
                  className="w-full px-3 py-2 text-sm"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Địa chỉ Email</label>
                <input
                  value={supEmail}
                  onChange={e => setSupEmail(e.target.value)}
                  placeholder="lienhe@nhacungcap.com..."
                  className="w-full px-3 py-2 text-sm"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Địa chỉ văn phòng / kho</label>
                <input
                  value={supAddress}
                  onChange={e => setSupAddress(e.target.value)}
                  placeholder="Số 12, Đường 3/2, Quận 10, TP.HCM..."
                  className="w-full px-3 py-2 text-sm"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Điều khoản thanh toán</label>
                <select
                  value={supTerm}
                  onChange={e => setSupTerm(e.target.value)}
                  className="w-full px-3 py-2 text-sm"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                >
                  <option value="Ngay khi giao hàng">Ngay khi giao hàng</option>
                  <option value="Trả chậm 15 ngày">Trả chậm 15 ngày</option>
                  <option value="Trả chậm 30 ngày">Trả chậm 30 ngày</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Ghi chú đối tác</label>
              <input
                value={supNote}
                onChange={e => setSupNote(e.target.value)}
                placeholder="Nhà cung cấp hạt hữu cơ chính hãng..."
                className="w-full px-3 py-2 text-sm"
                style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
              />
            </div>

            <div className="flex gap-2 justify-end border-t border-[#F3F4F6] pt-4">
              <button
                onClick={() => setShowAddSupplierModal(false)}
                className="px-4 py-2 text-sm font-semibold border border-[#E5E7EB] rounded-xl hover:bg-gray-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleCreateSupplier}
                disabled={saving}
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Đang tạo...' : 'Xác nhận tạo NCC'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Supplier Modal */}
      {showEditSupplierModal && selectedSupplierObj && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 p-6" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.14)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F3F4F6]">
              <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 18, color: '#111827' }} className="text-blue-600">
                Sửa thông tin Nhà cung cấp #{selectedSupplierObj.madoitac}
              </h3>
              <button onClick={() => setShowEditSupplierModal(false)} className="p-2 rounded-lg hover:bg-gray-100 text-[#6B7280]">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Tên nhà cung cấp *</label>
                <input
                  value={supName}
                  onChange={e => setSupName(e.target.value)}
                  className="w-full px-3 py-2 text-sm"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Mã số thuế *</label>
                <input
                  value={supTaxId}
                  onChange={e => setSupTaxId(e.target.value)}
                  className="w-full px-3 py-2 text-sm"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Số điện thoại</label>
                <input
                  value={supPhone}
                  onChange={e => setSupPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Địa chỉ Email</label>
                <input
                  value={supEmail}
                  onChange={e => setSupEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Địa chỉ văn phòng / kho</label>
                <input
                  value={supAddress}
                  onChange={e => setSupAddress(e.target.value)}
                  className="w-full px-3 py-2 text-sm"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Điều khoản thanh toán</label>
                <select
                  value={supTerm}
                  onChange={e => setSupTerm(e.target.value)}
                  className="w-full px-3 py-2 text-sm"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                >
                  <option value="Ngay khi giao hàng">Ngay khi giao hàng</option>
                  <option value="Trả chậm 15 ngày">Trả chậm 15 ngày</option>
                  <option value="Trả chậm 30 ngày">Trả chậm 30 ngày</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Ghi chú đối tác</label>
              <input
                value={supNote}
                onChange={e => setSupNote(e.target.value)}
                className="w-full px-3 py-2 text-sm"
                style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
              />
            </div>

            <div className="flex gap-2 justify-end border-t border-[#F3F4F6] pt-4">
              <button
                onClick={() => setShowEditSupplierModal(false)}
                className="px-4 py-2 text-sm font-semibold border border-[#E5E7EB] rounded-xl hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateSupplier}
                disabled={saving}
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : 'Lưu đối tác'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
