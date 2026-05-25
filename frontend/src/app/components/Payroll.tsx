import { useState, useEffect } from 'react';
import { Calculator, X, DollarSign, Eye, Settings, FileText, CheckCircle2, CreditCard, User, ShieldAlert, Award } from 'lucide-react';
import { payrollApi, hrApi } from '../api';

const card = { boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)', borderRadius: 12 };
const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ₫';

export function Payroll() {
  const [activeTab, setActiveTab] = useState<'records' | 'profiles' | 'config'>('records');
  const [records, setRecords] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [calculating, setCalculating] = useState(false);
  const [detail, setDetail] = useState<any>(null);

  // Global config states
  const [globalParams, setGlobalParams] = useState<any>({
    TY_LE_BHXH: 8,
    TY_LE_BHYT: 1.5,
    TY_LE_BHTN: 1,
    TRAN_LUONG_BH: 36000000
  });
  const [globalBrackets, setGlobalBrackets] = useState<any[]>([
    { bac: 1, nguong_tren: 10000000, thue_suat: 5 },
    { bac: 2, nguong_tren: 30000000, thue_suat: 10 },
    { bac: 3, nguong_tren: 60000000, thue_suat: 20 },
    { bac: 4, nguong_tren: 100000000, thue_suat: 30 },
    { bac: 5, nguong_tren: 999999999999, thue_suat: 35 }
  ]);
  const [loadingConfig, setLoadingConfig] = useState<boolean>(false);
  const [savingConfig, setSavingConfig] = useState<boolean>(false);

  // Profile management state
  const [selectedEmpProfile, setSelectedEmpProfile] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Form profile state
  const [profileSalary, setProfileSalary] = useState<number>(0);
  const [profileDependents, setProfileDependents] = useState<number>(0);
  const [profileSelfReduction, setProfileSelfReduction] = useState<number>(15500000);
  const [profileDependentReduction, setProfileDependentReduction] = useState<number>(4400000);
  const [profileBHTuyChinh, setProfileBHTuyChinh] = useState<number>(-1);
  const [profileThueTuyChinh, setProfileThueTuyChinh] = useState<number>(-1);
  const [autoBH, setAutoBH] = useState<boolean>(true);
  const [autoThue, setAutoThue] = useState<boolean>(true);

  const fetchRecords = () => {
    setLoading(true);
    payrollApi.getRecords(month, year)
      .then(d => setRecords(d.data || d.records || d || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const data = await hrApi.getEmployees();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalConfig = async () => {
    setLoadingConfig(true);
    try {
      const res = await payrollApi.getGlobalConfig();
      if (res.success) {
        setGlobalParams(res.params);
        setGlobalBrackets(res.brackets || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleSaveGlobalConfig = async () => {
    setSavingConfig(true);
    try {
      await payrollApi.updateGlobalConfig({
        params: globalParams,
        brackets: globalBrackets
      });
      alert('Đã cập nhật cấu hình hệ số lương và biểu thuế TNCN toàn hệ thống thành công!');
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật cấu hình');
    } finally {
      setSavingConfig(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'records') {
      fetchRecords();
    } else if (activeTab === 'profiles') {
      fetchEmployees();
    } else if (activeTab === 'config') {
      fetchGlobalConfig();
    }
  }, [activeTab, month, year]);

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      await payrollApi.calculate(month, year);
      fetchRecords();
      alert('Tính toán bảng lương tháng thành công!');
    } catch (e: any) {
      alert(e.message || 'Lỗi tính toán lương');
    } finally {
      setCalculating(false);
    }
  };

  const handleOpenProfile = async (emp: any) => {
    setSelectedEmpProfile(emp);
    setProfileSalary(0);
    setProfileDependents(0);
    setProfileSelfReduction(15500000);
    setProfileDependentReduction(4400000);
    setProfileBHTuyChinh(-1);
    setProfileThueTuyChinh(-1);
    setAutoBH(true);
    setAutoThue(true);
    setShowProfileModal(true);

    try {
      const res = await payrollApi.getSalaryProfile(emp.manhanvien);
      if (res.data) {
        setProfileSalary(res.data.mucluong || 0);
        setProfileDependents(res.data.songuoiphuthuoc || 0);
        setProfileSelfReduction(res.data.giamtrubanthan || 15500000);
        setProfileDependentReduction(res.data.tiengiamnpt || 4400000);
        
        const bhVal = res.data.bhtuychinh !== undefined ? Number(res.data.bhtuychinh) : -1;
        const thueVal = res.data.thuetuychinh !== undefined ? Number(res.data.thuetuychinh) : -1;
        setProfileBHTuyChinh(bhVal);
        setProfileThueTuyChinh(thueVal);
        setAutoBH(bhVal === -1);
        setAutoThue(thueVal === -1);
      } else {
        setProfileSalary(0);
        setProfileDependents(0);
        setProfileSelfReduction(15500000);
        setProfileDependentReduction(4400000);
        setProfileBHTuyChinh(-1);
        setProfileThueTuyChinh(-1);
        setAutoBH(true);
        setAutoThue(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProfile = async () => {
    if (!selectedEmpProfile) return;
    setSavingProfile(true);
    try {
      await payrollApi.upsertSalaryProfile(selectedEmpProfile.manhanvien, {
        mucluong: profileSalary,
        songuoiphuthuoc: profileDependents,
        giamtru_banthan: profileSelfReduction,
        tien_giam_npt: profileDependentReduction,
        bhtuychinh: -1,
        thuetuychinh: -1
      });
      alert('Cập nhật hồ sơ tham số lương nhân viên thành công!');
      setShowProfileModal(false);
      fetchEmployees(); // Refresh data immediately
    } catch (err: any) {
      alert(err.message || 'Lỗi lưu hồ sơ lương');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn duyệt phiếu lương này?')) return;
    try {
      await payrollApi.approve(id);
      alert('Đã phê duyệt phiếu lương!');
      fetchRecords();
    } catch (err: any) {
      alert(err.message || 'Lỗi duyệt lương');
    }
  };

  const handleApproveAll = async () => {
    const pendingCount = records.filter(r => r.trangthai === 'Chờ duyệt').length;
    if (pendingCount === 0) {
      alert('Không có phiếu lương nào ở trạng thái "Chờ duyệt" trong tháng này!');
      return;
    }
    if (!confirm(`Xác nhận phê duyệt toàn bộ ${pendingCount} phiếu lương đang chờ duyệt của Tháng ${month}/${year}?`)) return;
    try {
      await payrollApi.approveAll(month, year);
      alert('Đã phê duyệt toàn bộ bảng lương tháng thành công!');
      fetchRecords();
    } catch (err: any) {
      alert(err.message || 'Lỗi phê duyệt bảng lương');
    }
  };

  const handlePay = async (id: number) => {
    if (!confirm('Xác nhận thanh toán lương thực tế cho nhân viên? Trạng thái sẽ chuyển sang Đã thanh toán.')) return;
    try {
      await payrollApi.pay(id);
      alert('Thanh toán lương thành công!');
      fetchRecords();
    } catch (err: any) {
      alert(err.message || 'Lỗi thanh toán');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Chờ duyệt':
        return 'bg-amber-100 text-amber-800';
      case 'Đã duyệt':
        return 'bg-blue-100 text-blue-800';
      case 'Đã thanh toán':
        return 'bg-emerald-100 text-emerald-800';
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
            Quản lý tiền lương & Thuế
          </h1>
          <p className="text-sm text-[#6B7280]">Tính toán lương tự động dựa trên chấm công, cấu hình BHXH, thuế TNCN và thanh toán lương</p>
        </div>
        {activeTab === 'records' && (
          <button
            onClick={handleCalculate}
            disabled={calculating}
            className="flex items-center gap-2 px-4 py-2.5 text-white text-sm hover:opacity-90 transition-all shadow-md shadow-emerald-500/20"
            style={{ backgroundColor: '#10B981', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}
          >
            <Calculator size={16} /> {calculating ? 'Đang tính toán...' : 'Tính lương tháng này'}
          </button>
        )}
      </div>

      {/* Tabs Selector */}
      <div className="flex gap-2 border-b border-[#E5E7EB] pb-px">
        <button
          onClick={() => setActiveTab('records')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'records' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <DollarSign size={16} /> Bảng lương nhân viên
        </button>
        <button
          onClick={() => setActiveTab('profiles')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'profiles' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <Settings size={16} /> Cấu hình hồ sơ lương
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'config' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <Award size={16} /> ⚙️ Cấu hình hệ số & Thuế
        </button>
      </div>

      {activeTab === 'records' ? (
        <>
          {/* Filters card */}
          <div className="bg-white p-4 flex justify-between items-center" style={card}>
            <div className="flex gap-3 items-center">
              <select
                value={month}
                onChange={e => setMonth(Number(e.target.value))}
                className="px-3 py-2 text-sm"
                style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>Tháng {m}</option>
                ))}
              </select>
              <select
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                className="px-3 py-2 text-sm"
                style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
              >
                {[2024, 2025, 2026].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {records.length > 0 && records.some(r => r.trangthai === 'Chờ duyệt') && (
              <button
                onClick={handleApproveAll}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
              >
                <CheckCircle2 size={16} /> Duyệt toàn bộ bảng lương
              </button>
            )}
          </div>

          {/* Table Card */}
          <div className="bg-white overflow-hidden" style={card}>
            {loading ? (
              <div className="p-12 text-center text-sm text-[#6B7280]">Đang tải bảng lương...</div>
            ) : records.length === 0 ? (
              <div className="p-12 text-center text-[#9CA3AF]">
                <Calculator className="mx-auto text-gray-300 mb-3" size={40} />
                <p className="text-sm">Chưa có dữ liệu bảng lương tháng {month}/{year}</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB' }}>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#6B7280] uppercase">Nhân viên</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-[#6B7280] uppercase">Lương gộp (Gross)</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-[#6B7280] uppercase">BH nhân viên (8.5%)</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-[#6B7280] uppercase">Thuế TNCN</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-[#6B7280] uppercase">Thực lĩnh (Net)</th>
                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-[#6B7280] uppercase">Trạng thái</th>
                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-[#6B7280] uppercase">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {records.map((r: any, idx: number) => (
                    <tr key={r.maphieu || idx} className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: '#F97316' }}>
                            {(r.hoten || 'N').charAt(0)}
                          </div>
                          <span className="text-sm font-semibold text-[#111827]">{r.hoten}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right text-sm text-[#4B5563] font-semibold">
                        {fmt(Number(r.luong) || 0)}
                      </td>
                      <td className="px-5 py-4 text-right text-sm text-rose-600 font-semibold">
                        -{fmt(Number(r.tongbaohiemnv) || 0)}
                      </td>
                      <td className="px-5 py-4 text-right text-sm text-rose-600 font-semibold">
                        -{fmt(Number(r.tongthuetncn) || 0)}
                      </td>
                      <td className="px-5 py-4 text-right text-sm font-bold text-emerald-600">
                        {fmt(Number(r.thuclinh) || 0)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(r.trangthai)}`}>
                          {r.trangthai}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() => setDetail(r)}
                            className="p-1 rounded hover:bg-blue-50 text-blue-600"
                            title="Xem chi tiết"
                          >
                            <Eye size={15} />
                          </button>

                          {r.trangthai === 'Đã duyệt' && (
                            <button
                              onClick={() => handlePay(r.maphieu)}
                              className="p-1 rounded hover:bg-emerald-50 text-emerald-600"
                              title="Thanh toán lương"
                            >
                              <CreditCard size={15} />
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
        </>
      ) : activeTab === 'profiles' ? (
        /* Profiles configurations tab */
        <div className="bg-white overflow-hidden" style={card}>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB' }}>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#6B7280] uppercase">Nhân viên</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#6B7280] uppercase">Phòng ban / Chức vụ</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-[#6B7280] uppercase">Lương cơ bản (Gross)</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-[#6B7280] uppercase">Trạng thái</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-[#6B7280] uppercase">Cấu hình lương</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {employees.filter((emp: any) => emp.trangthai === 'Đang làm việc').map((emp: any) => (
                <tr key={emp.manhanvien} className="hover:bg-[#FAF9F6] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: '#3B82F6' }}>
                        {(emp.hoten || 'N').charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#111827]">{emp.hoten}</p>
                        <p className="text-xs text-[#6B7280]">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-[#4B5563] font-semibold">{emp.phongban || 'Spa & Clinic'}</p>
                    <p className="text-xs text-[#9CA3AF]">{emp.vaitro || 'Kỹ thuật viên'}</p>
                  </td>
                  <td className="px-5 py-4 text-right text-sm text-[#111827] font-bold">
                    {fmt(Number(emp.mucluong) || 0)}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${emp.trangthai === 'Đang làm việc' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {emp.trangthai}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => handleOpenProfile(emp)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                      title="Chỉnh sửa tham số lương"
                    >
                      <Settings size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Slip Details Modal */}
      {detail && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-6" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.14)' }}>
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-[#F3F4F6]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                  <DollarSign size={24} />
                </div>
                <div>
                  <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 18, color: '#111827' }}>
                    Phiếu lương chi tiết
                  </h3>
                  <p className="text-xs text-[#6B7280]">{detail.hoten} · Tháng {month}/{year}</p>
                </div>
              </div>
              <button onClick={() => setDetail(null)} className="p-2 rounded-lg hover:bg-gray-100 text-[#6B7280]">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Lương gộp (Gross Base & Overtime)', value: fmt(Number(detail.luong) || 0) },
                { label: 'Bảo hiểm NV (8% BHXH, 1.5% BHYT, 1% BHTN)', value: `-${fmt(Number(detail.tongbaohiemnv) || 0)}`, color: '#EF4444' },
                { label: 'Thuế TNCN lũy tiến', value: `-${fmt(Number(detail.tongthuetncn) || 0)}`, color: '#EF4444' },
              ].map((r, i) => (
                <div key={i} className="flex justify-between py-2.5 border-b border-[#F3F4F6]">
                  <span className="text-sm text-[#6B7280]">{r.label}</span>
                  <span className="text-sm font-bold" style={{ color: r.color || '#111827' }}>{r.value}</span>
                </div>
              ))}
              <div className="flex justify-between pt-4">
                <span className="text-base font-bold text-[#111827]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  THỰC LĨNH CHUYỂN KHOẢN (Net)
                </span>
                <span className="text-xl font-extrabold text-[#F97316]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {fmt(Number(detail.thuclinh) || 0)}
                </span>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setDetail(null)}
                className="px-6 py-2.5 text-sm font-semibold bg-[#1C1C2E] text-white rounded-xl hover:opacity-90"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Salary Profile settings Modal */}
      {showProfileModal && selectedEmpProfile && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 p-6" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.14)' }}>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#F3F4F6]">
              <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 18, color: '#111827' }} className="text-blue-600 flex items-center gap-2">
                <Award size={20} className="text-blue-500" /> Cấu hình hồ sơ lương: {selectedEmpProfile.hoten}
              </h3>
              <button onClick={() => setShowProfileModal(false)} className="p-2 rounded-lg hover:bg-gray-100 text-[#6B7280]">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Mức lương cơ bản (Gross Base) *</label>
                <input
                  type="number"
                  value={profileSalary}
                  onChange={e => setProfileSalary(Number(e.target.value))}
                  placeholder="Ví dụ: 15000000"
                  className="w-full px-3 py-2 text-sm text-[#111827]"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                />
              </div>



              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Số người phụ thuộc</label>
                  <input
                    type="number"
                    value={profileDependents}
                    onChange={e => setProfileDependents(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm text-[#111827]"
                    style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Giảm trừ người phụ thuộc / người</label>
                  <input
                    type="number"
                    value={profileDependentReduction}
                    onChange={e => setProfileDependentReduction(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm text-[#111827]"
                    style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Giảm trừ gia cảnh bản thân</label>
                <input
                  type="number"
                  value={profileSelfReduction}
                  onChange={e => setProfileSelfReduction(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm text-[#111827]"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end border-t border-[#F3F4F6] pt-4">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 text-sm font-semibold border border-[#E5E7EB] rounded-xl hover:bg-gray-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:opacity-90 disabled:opacity-50"
              >
                {savingProfile ? 'Đang lưu...' : 'Lưu hồ sơ lương'}
              </button>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cột trái: Tham số lương & bảo hiểm */}
          <div className="bg-white p-6 space-y-6" style={card}>
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2 border-b pb-2 flex items-center gap-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                <Award size={20} className="text-emerald-500" /> Hệ số Bảo hiểm bắt buộc
              </h3>
              <p className="text-xs text-gray-500 mb-4">Cấu hình các tỷ lệ trích đóng bảo hiểm xã hội bắt buộc đối với người lao động</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Tỷ lệ đóng BHXH của NLĐ (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={globalParams.TY_LE_BHXH}
                  onChange={e => setGlobalParams({ ...globalParams, TY_LE_BHXH: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm text-[#111827]"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Tỷ lệ đóng BHYT của NLĐ (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={globalParams.TY_LE_BHYT}
                  onChange={e => setGlobalParams({ ...globalParams, TY_LE_BHYT: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm text-[#111827]"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Tỷ lệ đóng BHTN của NLĐ (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={globalParams.TY_LE_BHTN}
                  onChange={e => setGlobalParams({ ...globalParams, TY_LE_BHTN: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm text-[#111827]"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                />
              </div>

              <div className="pt-2 border-t border-gray-100">
                <div className="flex justify-between items-center bg-[#FAF9F6] p-3 rounded-xl border border-gray-200">
                  <span className="text-xs font-bold text-gray-600">Tổng tỷ lệ khấu trừ lương:</span>
                  <span className="text-sm font-extrabold text-red-600">
                    {(Number(globalParams.TY_LE_BHXH || 0) + Number(globalParams.TY_LE_BHYT || 0) + Number(globalParams.TY_LE_BHTN || 0)).toFixed(2)} %
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Mức trần lương đóng bảo hiểm (VND)</label>
                <input
                  type="number"
                  value={globalParams.TRAN_LUONG_BH}
                  onChange={e => setGlobalParams({ ...globalParams, TRAN_LUONG_BH: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm text-[#111827] font-bold"
                  style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none' }}
                />
                <p className="text-[10px] text-gray-400 mt-1">Giới hạn trần đóng bảo hiểm xã hội bắt buộc theo quy định nhà nước</p>
              </div>
            </div>
          </div>

          {/* Cột phải: Biểu thuế lũy tiến TNCN */}
          <div className="bg-white p-6 space-y-6 flex flex-col justify-between" style={card}>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2 border-b pb-2 flex items-center gap-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  <ShieldAlert size={20} className="text-blue-500" /> Biểu thuế lũy tiến TNCN
                </h3>
                <p className="text-xs text-gray-500">Cấu hình các ngưỡng thu nhập tính thuế và thuế suất lũy tiến từng phần</p>
              </div>

              {loadingConfig ? (
                <div className="py-12 text-center text-sm text-gray-400">Đang tải biểu thuế...</div>
              ) : (
                <div className="space-y-3">
                  {globalBrackets.map((b, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-extrabold flex items-center justify-center text-xs flex-shrink-0">
                        {b.bac}
                      </div>
                      
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Ngưỡng trên (VND)</label>
                          {b.nguong_tren >= 999999999999 ? (
                            <input
                              type="text"
                              disabled
                              value="Vô cực"
                              className="w-full px-2.5 py-1.5 text-xs text-gray-400 bg-gray-100 border border-gray-200 rounded-md font-semibold"
                            />
                          ) : (
                            <input
                              type="number"
                              value={b.nguong_tren}
                              onChange={e => {
                                const newB = [...globalBrackets];
                                newB[idx].nguong_tren = Number(e.target.value);
                                setGlobalBrackets(newB);
                              }}
                              className="w-full px-2.5 py-1.5 text-xs text-gray-800 border border-gray-300 rounded-md font-bold"
                            />
                          )}
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Thuế suất (%)</label>
                          <input
                            type="number"
                            value={b.thue_suat}
                            onChange={e => {
                              const newB = [...globalBrackets];
                              newB[idx].thue_suat = Number(e.target.value);
                              setGlobalBrackets(newB);
                            }}
                            className="w-full px-2.5 py-1.5 text-xs text-gray-800 border border-gray-300 rounded-md font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <button
                onClick={handleSaveGlobalConfig}
                disabled={savingConfig}
                className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:opacity-90 transition-all flex items-center gap-2 shadow-md shadow-blue-500/20"
                style={{ border: 'none', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}
              >
                <CheckCircle2 size={16} />
                {savingConfig ? 'Đang lưu cấu hình...' : 'Lưu cấu hình hệ thống'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
