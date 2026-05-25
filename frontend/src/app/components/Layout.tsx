import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import {
  LayoutDashboard, ShoppingCart, Package, Users, PawPrint,
  Warehouse, UserCheck, Clock, Calendar, DollarSign,
  ChevronLeft, ChevronRight, Bell, LogOut, ChevronDown, ShoppingBag, Sparkles, AlertTriangle
} from 'lucide-react';
import { inventoryApi, hrApi } from '../api';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { path: '/pos', label: 'Bán hàng (POS)', icon: ShoppingCart },
  { path: '/products', label: 'Sản phẩm', icon: Package },
  { path: '/customers', label: 'Khách hàng', icon: Users },
  { path: '/booking', label: 'Đặt lịch', icon: Sparkles },
  { path: '/inventory', label: 'Kho hàng', icon: Warehouse },
  { path: '/purchase', label: 'Mua hàng', icon: ShoppingBag },
  { path: '/hr', label: 'Nhân sự', icon: UserCheck },
  { path: '/attendance', label: 'Chấm công', icon: Clock },
  { path: '/leave', label: 'Nghỉ phép', icon: Calendar },
  { path: '/payroll', label: 'Bảng lương', icon: DollarSign },
];

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Tổng quan hệ thống',
  '/pos': 'Quản lý bán hàng (POS)',
  '/products': 'Quản lý sản phẩm & dịch vụ',
  '/customers': 'Quản lý khách hàng',
  '/booking': 'Đặt lịch & Spa chăm sóc',
  '/inventory': 'Quản lý kho hàng',
  '/purchase': 'Quản lý mua hàng & đối tác',
  '/hr': 'Quản lý nhân sự',
  '/attendance': 'Bảng chấm công nhân viên',
  '/leave': 'Quản lý nghỉ phép',
  '/payroll': 'Quản lý tiền lương & Thuế',
};

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
  const userName = user.hoTen || 'Người dùng';
  const userInitial = userName.charAt(0).toUpperCase();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = () => {
    const isManager = !user.tenVaiTro || ['Quản lý', 'Quản trị viên', 'Admin', 'staff'].includes(user.tenVaiTro);
    Promise.all([
      inventoryApi.getAll().catch(() => []),
      isManager ? hrApi.getPendingLeaves().catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
    ]).then(([invData, leaveData]) => {
      const invList = Array.isArray(invData) ? invData : (invData as any).inventory || [];
      const leaveList = (leaveData as any).data || [];

      // Lọc các sản phẩm tồn kho < 10
      const lowStockNotifs = invList
        .filter((item: any) => (Number(item.soluongton) || 0) < 10)
        .map((item: any) => ({
          id: `stock-${item.masanpham}`,
          type: 'stock',
          title: 'Cảnh báo tồn kho thấp',
          message: `Sản phẩm "${item.tensanpham}" chỉ còn ${item.soluongton} sản phẩm trong kho!`,
          targetPath: '/inventory',
          state: { tab: 'stock' }
        }));

      // Lọc đơn xin nghỉ phép chờ duyệt
      const leaveNotifs = leaveList.map((item: any) => ({
        id: `leave-${item.madon}`,
        type: 'leave',
        title: 'Đơn xin nghỉ phép mới',
        message: `Nhân viên "${item.hoten_nhanvien}" gửi đơn xin nghỉ phép chờ duyệt.`,
        targetPath: '/leave',
        state: { tab: 'pending' }
      }));

      setNotifications([...lowStockNotifs, ...leaveNotifs]);
    }).catch(err => console.error("Lỗi lấy thông báo:", err));
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNotifClick = (notif: any) => {
    setShowNotifDropdown(false);
    navigate(notif.targetPath, { state: notif.state });
  };

  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); };

  const pageTitle = PAGE_TITLES[location.pathname] || 'PetERP';
  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ backgroundColor: '#F9FAFB', fontFamily: 'Roboto, sans-serif' }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col h-full flex-shrink-0 transition-all duration-300"
        style={{ backgroundColor: '#1C1C2E', width: collapsed ? 64 : 240 }}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-white/10 flex-shrink-0 gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F97316' }}>
            <PawPrint size={18} color="white" />
          </div>
          {!collapsed && (
            <span className="text-white text-lg flex-1" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800 }}>
              PetERP
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-6 h-6 rounded-full text-white transition-colors flex-shrink-0"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
          >
            {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const handleClick = () => {
              if (item.path === '/pos') {
                window.location.href = '/pos';
              } else {
                navigate(item.path);
              }
            };
            return (
              <button
                key={item.path}
                onClick={handleClick}
                title={collapsed ? item.label : undefined}
                className="flex items-center w-full transition-all duration-150"
                style={{
                  padding: '9px 12px',
                  margin: '2px 8px',
                  width: 'calc(100% - 16px)',
                  borderRadius: 8,
                  backgroundColor: isActive ? '#F97316' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#CBD5E1',
                  cursor: 'pointer',
                  border: 'none',
                  textAlign: 'left',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                {!collapsed && (
                  <span className="ml-3 text-sm" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-white/10 p-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0" style={{ backgroundColor: '#F97316', fontWeight: 700 }}>
              {userInitial}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm truncate" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>{userName}</div>
                  <div className="text-xs text-slate-400 truncate">{user.tenDangNhap || 'staff'}</div>
                </div>
                <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors" title="Đăng xuất">
                  <LogOut size={15} />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header
          className="flex items-center justify-between px-6 flex-shrink-0"
          style={{ height: 64, backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <div>
            <h1 className="text-[18px] text-[#111827]" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, lineHeight: 1.3 }}>
              {pageTitle}
            </h1>
            <p className="text-xs text-[#6B7280]">{today}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative p-2 rounded-lg hover:bg-gray-100 text-[#6B7280] transition-colors"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: '#F97316' }}>
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div 
                  className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                  style={{ top: '100%' }}
                >
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between" style={{ backgroundColor: '#F9FAFB' }}>
                    <span className="text-sm font-bold text-[#111827]" style={{ fontFamily: 'Nunito, sans-serif' }}>Thông báo mới ({notifications.length})</span>
                    {notifications.length > 0 && (
                      <button 
                        onClick={fetchNotifications}
                        className="text-xs text-[#F97316] font-semibold hover:underline"
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                      >
                        Làm mới
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => {
                        const isStock = notif.type === 'stock';
                        return (
                          <div 
                            key={notif.id}
                            onClick={() => handleNotifClick(notif)}
                            className="px-4 py-3 border-b border-gray-50 hover:bg-orange-50/40 cursor-pointer transition-colors flex gap-3 text-left"
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              {isStock ? (
                                <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                                  <AlertTriangle size={15} />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                                  <Calendar size={15} />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-[#111827] truncate">{notif.title}</p>
                              <p className="text-xs text-[#6B7280] mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-8 text-center text-slate-400">
                        <Bell size={28} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-xs font-medium">Không có thông báo mới nào</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm" style={{ backgroundColor: '#F97316', fontWeight: 700 }}>{userInitial}</div>
              <span className="text-sm text-[#111827] hidden sm:block" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>{userName}</span>
              <ChevronDown size={14} className="text-[#6B7280]" />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
