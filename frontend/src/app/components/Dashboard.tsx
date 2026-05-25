import { useEffect, useState } from 'react';
import { TrendingUp, ShoppingBag, Users, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardApi } from '../api';

const card = { boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)', borderRadius: 12 };
const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ₫';

export function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartFilter, setChartFilter] = useState<'date' | 'month' | 'year'>('month');
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    if (data === null) {
      setLoading(true);
      dashboardApi.getStats(chartFilter)
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setChartLoading(true);
      dashboardApi.getStats(chartFilter)
        .then(res => {
          setData((prev: any) => ({
            ...prev,
            chartData: res.chartData
          }));
        })
        .catch(console.error)
        .finally(() => setChartLoading(false));
    }
  }, [chartFilter]);

  if (loading) return <div className="flex items-center justify-center h-64 text-[#6B7280]">Đang tải dữ liệu tổng quan...</div>;
  if (!data) return <div className="flex items-center justify-center h-64 text-[#EF4444]">Lỗi tải dữ liệu tổng quan hệ thống</div>;

  const kpi = data.kpi || {};
  const kpiCards = [
    { title: "Tổng doanh thu", value: fmt(Number(kpi.tong_doanh_thu) || 0), trend: `${kpi.tong_don_hang || 0} đơn hàng`, trendPositive: true, icon: TrendingUp, iconBg: '#D1FAE5', iconColor: '#10B981', accent: '#F97316' },
    { title: "Tổng đơn hàng", value: `${kpi.tong_don_hang || 0} đơn`, trend: "Toàn bộ", trendPositive: true, icon: ShoppingBag, iconBg: '#DBEAFE', iconColor: '#3B82F6', accent: '#3B82F6' },
    { title: "Tổng khách hàng", value: `${kpi.tong_khach_hang || 0} KH`, trend: "Đã đăng ký", trendPositive: true, icon: Users, iconBg: '#EDE9FE', iconColor: '#7C3AED', accent: '#7C3AED' },
    { title: "Cảnh báo tồn kho", value: `${(data.notifications || []).length} SP`, trend: "Sắp hết hàng", trendPositive: false, icon: AlertTriangle, iconBg: '#FEF3C7', iconColor: '#F59E0B', accent: '#F59E0B' },
  ];

  const chartData = data.chartData || [];
  const topProducts = data.topProducts || [];
  const notifications = data.notifications || [];
  const recentOrders = data.recentOrders || [];

  return (
    <div className="space-y-5">
      {/* KPI Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-white p-5" style={{ ...card, borderLeft: `4px solid ${c.accent}` }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-[#6B7280] mb-1">{c.title}</p>
                  <p className="text-xl text-[#111827]" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>{c.value}</p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: c.iconBg }}>
                  <Icon size={20} style={{ color: c.iconColor }} />
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs">
                {c.trendPositive ? <ArrowUpRight size={13} style={{ color: '#10B981' }} /> : <AlertTriangle size={12} style={{ color: '#F59E0B' }} />}
                <span style={{ color: c.trendPositive ? '#10B981' : '#F59E0B' }}>{c.trend}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="bg-white p-5 relative overflow-hidden" style={card}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-[#111827]" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 16 }}>
            {chartFilter === 'date' ? 'Doanh thu 7 ngày gần nhất' : chartFilter === 'year' ? 'Doanh thu 5 năm gần nhất' : 'Doanh thu 6 tháng gần nhất'}
          </h3>
          
          {/* Bộ lọc Ngày / Tháng / Năm xịn sò */}
          <div className="flex bg-[#F3F4F6] p-1 rounded-lg self-start">
            {[
              { key: 'date', label: 'Ngày' },
              { key: 'month', label: 'Tháng' },
              { key: 'year', label: 'Năm' }
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setChartFilter(item.key as any)}
                className="px-3 py-1 text-xs font-bold rounded-md transition-all duration-200"
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: chartFilter === item.key ? 'white' : 'transparent',
                  color: chartFilter === item.key ? '#F97316' : '#6B7280',
                  boxShadow: chartFilter === item.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          {chartLoading && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 backdrop-blur-[1px] animate-fadeIn">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#F97316] bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
                Đang cập nhật biểu đồ...
              </div>
            </div>
          )}

          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} barSize={34}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${(v / 1e3).toFixed(0)}K`} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => [`${v.toLocaleString('vi-VN')} ₫`, 'Doanh thu']} contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                <Bar dataKey="revenue" fill="#F97316" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-[#9CA3AF]">
              Không có dữ liệu doanh thu trong khoảng thời gian này
            </div>
          )}
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Top Products */}
        <div className="bg-white overflow-hidden" style={card}>
          <div className="px-5 py-4 border-b border-[#E5E7EB]">
            <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 16, color: '#111827' }}>Top sản phẩm bán chạy</h3>
          </div>
          <table className="w-full">
            <thead><tr style={{ backgroundColor: '#F9FAFB' }}>
              <th className="text-left px-5 py-2 text-xs font-medium text-[#6B7280]">#</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-[#6B7280]">Sản phẩm</th>
              <th className="text-right px-3 py-2 text-xs font-medium text-[#6B7280]">SL bán</th>
              <th className="text-right px-5 py-2 text-xs font-medium text-[#6B7280]">Doanh thu</th>
            </tr></thead>
            <tbody>
              {topProducts.map((p: any, i: number) => (
                <tr key={i} className="border-t border-[#F3F4F6]" onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FFF0E6')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}>
                  <td className="px-5 py-3"><span className="w-6 h-6 inline-flex items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: i < 3 ? '#FFF0E6' : '#F3F4F6', color: i < 3 ? '#F97316' : '#6B7280' }}>{i + 1}</span></td>
                  <td className="px-3 py-3 text-sm text-[#111827]">{p.tensanpham}</td>
                  <td className="px-3 py-3 text-right text-sm text-[#6B7280]">{p.tong_ban}</td>
                  <td className="px-5 py-3 text-right text-sm font-semibold" style={{ color: '#F97316' }}>{fmt(Number(p.doanh_thu_sp) || 0)}</td>
                </tr>
              ))}
              {topProducts.length === 0 && <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-[#9CA3AF]">Chưa có dữ liệu bán hàng</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Low Stock + Recent Orders */}
        <div className="space-y-4">
          {/* Low Stock */}
          <div className="bg-white overflow-hidden" style={card}>
            {notifications.length > 0 && (
              <div className="px-5 py-2.5 flex items-center gap-2" style={{ backgroundColor: '#FEF3C7' }}>
                <AlertTriangle size={15} style={{ color: '#92400E' }} />
                <p className="text-sm font-medium" style={{ color: '#92400E' }}>{notifications.length} sản phẩm cần nhập thêm</p>
              </div>
            )}
            <div className="px-5 py-4 border-b border-[#E5E7EB]">
              <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 16, color: '#111827' }}>Cảnh báo tồn kho</h3>
            </div>
            <table className="w-full">
              <thead><tr style={{ backgroundColor: '#F9FAFB' }}>
                <th className="text-left px-5 py-2 text-xs font-medium text-[#6B7280]">Sản phẩm</th>
                <th className="text-center px-3 py-2 text-xs font-medium text-[#6B7280]">Tồn kho</th>
              </tr></thead>
              <tbody>
                {notifications.map((p: any, i: number) => (
                  <tr key={i} className="border-t border-[#FEE2E2]" style={{ backgroundColor: '#FEF2F2' }}>
                    <td className="px-5 py-3 text-sm text-[#111827]">{p.tensanpham}</td>
                    <td className="px-3 py-3 text-center"><span className="text-sm font-bold" style={{ color: '#EF4444' }}>⚠️ {p.soluongton}</span></td>
                  </tr>
                ))}
                {notifications.length === 0 && <tr><td colSpan={2} className="px-5 py-6 text-center text-sm text-[#10B981]">✅ Tất cả SP đều đủ hàng</td></tr>}
              </tbody>
            </table>
          </div>

          {/* Recent Orders */}
          <div className="bg-white overflow-hidden" style={card}>
            <div className="px-5 py-4 border-b border-[#E5E7EB]">
              <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 16, color: '#111827' }}>Đơn hàng gần nhất</h3>
            </div>
            <table className="w-full">
              <thead><tr style={{ backgroundColor: '#F9FAFB' }}>
                <th className="text-left px-5 py-2 text-xs font-medium text-[#6B7280]">Mã HĐ</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-[#6B7280]">Khách hàng</th>
                <th className="text-right px-5 py-2 text-xs font-medium text-[#6B7280]">Tổng tiền</th>
              </tr></thead>
              <tbody>
                {recentOrders.map((o: any, i: number) => (
                  <tr key={i} className="border-t border-[#F3F4F6]">
                    <td className="px-5 py-3 text-sm font-medium" style={{ color: '#F97316' }}>#{o.mahoadon}</td>
                    <td className="px-3 py-3 text-sm text-[#374151]">{o.ten_khach_hang || 'Khách vãng lai'}</td>
                    <td className="px-5 py-3 text-right text-sm font-semibold text-[#111827]">{fmt(Number(o.tongtien) || 0)}</td>
                  </tr>
                ))}
                {recentOrders.length === 0 && <tr><td colSpan={3} className="px-5 py-6 text-center text-sm text-[#9CA3AF]">Chưa có đơn hàng</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
