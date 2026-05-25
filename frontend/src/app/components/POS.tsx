import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Phone, Minus, Plus, Trash2, PawPrint, CreditCard, Banknote, Smartphone, X } from 'lucide-react';
import { posApi } from '../api';

interface CartItem { id: number; name: string; price: number; qty: number; image?: string; type?: string; itemtype?: string; }
const DEFAULT_IMG = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=200';
const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ₫';

export function POS() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customer, setCustomer] = useState<any>(null);
  const [pointsUsed, setPointsUsed] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'card'>('cash');
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  // States for Hold/Recall orders
  const [heldOrders, setHeldOrders] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pos_held_orders');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [showHeldList, setShowHeldList] = useState(false);
  const [editingHoldId, setEditingHoldId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('pos_held_orders', JSON.stringify(heldOrders));
  }, [heldOrders]);

  useEffect(() => { posApi.getProducts().then(d => setProducts(Array.isArray(d) ? d : d.products || [])).catch(console.error).finally(() => setLoading(false)); }, []);

  const categories = ['All', ...new Set(products.map((p: any) => p.loaisanpham).filter(Boolean))];
  const filtered = products.filter((p: any) =>
    (category === 'All' || p.loaisanpham === category) &&
    (!search || (p.tensanpham || '').toLowerCase().includes(search.toLowerCase()))
  );

  const addToCart = (p: any) => {
    const isService = p.itemtype === 'dich_vu';
    const stock = Number(p.soluongton) || 0;
    if (!isService && stock === 0) return;
    setCart(prev => {
      const existing = prev.find(i => i.id === p.id);
      if (existing) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, {
        id: p.id,
        name: p.tensanpham,
        price: Number(p.gia),
        qty: 1,
        image: p.hinhanh,
        type: p.loaisanpham,
        itemtype: p.itemtype,
      }];
    });
  };
  const updateQty = (id: number, delta: number) => setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  const removeFromCart = (id: number) => setCart(prev => prev.filter(i => i.id !== id));

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const total = subtotal;

  const handleFindCustomer = async () => {
    if (!customerSearch) return;
    try { const data = await posApi.findCustomer(customerSearch); setCustomer(data); setPointsUsed(0); } catch { setCustomer(null); setPointsUsed(0); }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckingOut(true);
    try {
      const finalAmount = Math.max(total - pointsUsed * 1000, 0);
      await posApi.checkout({
        maDoiTac: customer?.madoitac || null,
        cartItems: cart.map(i => ({
          id: i.id,
          masanpham: i.itemtype !== 'dich_vu' ? i.id : null,
          soluong: i.qty,
          gia: i.price,
          gianiemyet: i.price,
          tensanpham: i.name,
          itemtype: i.itemtype || 'san_pham',
        })),
        tongTien: finalAmount,
        diemSuDung: pointsUsed,
      });

      // Nếu đang thanh toán đơn hàng tạm, xóa khỏi danh sách treo
      if (editingHoldId) {
        setHeldOrders(prev => prev.filter(h => h.id !== editingHoldId));
        setEditingHoldId(null);
      }

      setCart([]); setCustomer(null); setCustomerSearch(''); setPointsUsed(0);
      posApi.getProducts().then(d => setProducts(Array.isArray(d) ? d : d.products || [])).catch(console.error);
      alert('Thanh toán thành công!');
    } catch (e: any) { alert(e.message || 'Lỗi thanh toán'); } finally { setCheckingOut(false); }
  };

  const handleHoldOrder = () => {
    if (cart.length === 0) return;
    const defaultNote = editingHoldId ? (heldOrders.find(h => h.id === editingHoldId)?.note || '') : `Đơn tạm #${heldOrders.length + 1}`;
    const note = prompt('Nhập ghi chú cho đơn hàng tạm này (ví dụ: Khách bàn 3, Khách sđt...):', defaultNote);
    if (note === null) return; // Nhấn Cancel

    const newHold = {
      id: editingHoldId || 'hold_' + Date.now(),
      note: note.trim() || `Đơn tạm #${heldOrders.length + 1}`,
      cart: [...cart],
      customer: customer ? { ...customer } : null,
      paymentMethod,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN'),
    };

    setHeldOrders(prev => {
      if (editingHoldId) {
        return prev.map(h => h.id === editingHoldId ? newHold : h);
      } else {
        return [...prev, newHold];
      }
    });

    setCart([]);
    setCustomer(null);
    setCustomerSearch('');
    setEditingHoldId(null);
    setPointsUsed(0);
    alert('Đã treo đơn hàng tạm thành công!');
  };

  const handleRecallOrder = (holdItem: any) => {
    setCart(holdItem.cart);
    setCustomer(holdItem.customer);
    setCustomerSearch(holdItem.customer?.sodienthoai || '');
    setPaymentMethod(holdItem.paymentMethod || 'cash');
    setEditingHoldId(holdItem.id);
    setPointsUsed(0);
    setShowHeldList(false);
  };

  const handleDeleteHold = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc chắn muốn xóa đơn hàng tạm này?')) return;
    setHeldOrders(prev => prev.filter(h => h.id !== id));
    if (editingHoldId === id) {
      setEditingHoldId(null);
      setCart([]);
      setCustomer(null);
      setCustomerSearch('');
      setPointsUsed(0);
    }
  };

  const PAY_METHODS = [
    { key: 'cash', label: 'Tiền mặt', icon: Banknote },
    { key: 'bank', label: 'Chuyển khoản', icon: Smartphone },
    { key: 'card', label: 'Thẻ', icon: CreditCard },
  ] as const;

  return (
    <div className="flex flex-col h-screen" style={{ fontFamily: 'Roboto, sans-serif' }}>
      <header className="flex items-center gap-4 px-6 flex-shrink-0" style={{ height: 64, backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <button onClick={() => window.history.back()} className="flex items-center gap-2 text-[#6B7280] hover:text-[#111827]">
          <ArrowLeft size={20} /><span style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 18, color: '#111827' }}>Bán hàng</span>
        </button>
        <div className="flex-1 relative mx-8">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm sản phẩm..."
            className="w-full pl-10 pr-4 py-2 text-sm text-[#111827]" style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none', backgroundColor: '#F9FAFB' }}
            onFocus={e => (e.target.style.borderColor = '#F97316')} onBlur={e => (e.target.style.borderColor = '#E5E7EB')} />
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setShowHeldList(true)}
            className="px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-sm border"
            style={{
              backgroundColor: heldOrders.length > 0 ? '#FFF0E6' : 'white',
              borderColor: heldOrders.length > 0 ? '#F97316' : '#E5E7EB',
              color: heldOrders.length > 0 ? '#F97316' : '#6B7280',
              cursor: 'pointer'
            }}
          >
            📋 Hóa đơn tạm ({heldOrders.length})
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="flex flex-col flex-1 overflow-hidden" style={{ backgroundColor: '#F9FAFB' }}>
          <div className="flex gap-2 px-5 py-3 border-b border-[#E5E7EB] bg-white overflow-x-auto flex-shrink-0">
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)} className="px-4 py-1.5 rounded-full text-sm flex-shrink-0"
                style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 600, backgroundColor: category === cat ? '#F97316' : '#F3F4F6', color: category === cat ? '#FFFFFF' : '#6B7280', border: 'none', cursor: 'pointer' }}>{cat}</button>
            ))}
          </div>
          <div className="flex-1 overflow-auto p-5">
            {loading ? <div className="text-center py-20 text-[#6B7280]">Đang tải...</div> : (
              <div className="grid grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((p: any) => {
                  const stock = Number(p.soluongton) || 0;
                  const isService = p.itemtype === 'dich_vu';
                  const outOfStock = !isService && stock === 0;
                  return (
                    <div key={`${p.itemtype}-${p.id}`} className="bg-white rounded-xl p-4 flex flex-col" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)', opacity: outOfStock ? 0.5 : 1 }}>
                      <div className="w-full aspect-square rounded-lg overflow-hidden border border-[#E5E7EB] mb-3">
                        {isService ? (
                          <div className="w-full h-full flex items-center justify-center text-4xl" style={{ backgroundColor: '#EDE9FE' }}>✂️</div>
                        ) : (
                          <img src={p.hinhanh || DEFAULT_IMG} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <p className="text-sm text-[#111827] mb-1 line-clamp-2" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>{p.tensanpham}</p>
                      <p className="text-base mb-2" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: '#F97316' }}>{fmt(Number(p.gia))}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full self-start mb-3"
                        style={isService
                          ? { backgroundColor: '#EDE9FE', color: '#5B21B6' }
                          : outOfStock
                            ? { backgroundColor: '#FEE2E2', color: '#991B1B' }
                            : { backgroundColor: '#D1FAE5', color: '#065F46' }}>
                        {isService ? '✨ Dich vu' : outOfStock ? 'Het hang' : `Ton: ${stock}`}
                      </span>
                      <button onClick={() => addToCart(p)} disabled={outOfStock} className="w-full py-2 text-sm mt-auto"
                        style={{ backgroundColor: outOfStock ? '#E5E7EB' : '#F97316', color: outOfStock ? '#9CA3AF' : '#FFFFFF', borderRadius: 8, border: 'none', cursor: outOfStock ? 'not-allowed' : 'pointer', fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>+ Them</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex flex-col flex-shrink-0 border-l border-[#E5E7EB] bg-white" style={{ width: 360 }}>
          {editingHoldId && (
            <div className="bg-orange-50 border-b border-orange-200 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
              <span className="text-xs font-semibold text-orange-800 truncate max-w-[240px]">
                ✍️ Đang sửa đơn tạm: {heldOrders.find(h => h.id === editingHoldId)?.note}
              </span>
              <button
                onClick={() => {
                  setCart([]);
                  setCustomer(null);
                  setCustomerSearch('');
                  setEditingHoldId(null);
                }}
                className="text-xs text-orange-600 hover:text-orange-800 font-bold underline"
                style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
              >
                Hủy sửa
              </button>
            </div>
          )}

          <div className="p-4 border-b border-[#E5E7EB]">
            <p className="text-xs font-medium text-[#6B7280] mb-2 uppercase tracking-wide">Khách hàng</p>
            <div className="relative mb-2">
              <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input value={customerSearch} onChange={e => setCustomerSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleFindCustomer()} placeholder="Tìm theo SĐT..."
                className="w-full pl-9 pr-4 py-2 text-sm text-[#111827]" style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none', backgroundColor: '#F9FAFB' }} />
            </div>
            {customer ? (
              <div className="p-3 rounded-lg border border-[#E5E7EB] flex items-center justify-between animate-fadeIn" style={{ backgroundColor: '#F9FAFB' }}>
                <div>
                  <p className="text-sm font-semibold text-[#111827]">{customer.tendoitac}</p>
                  <p className="text-xs text-[#6B7280]">⭐ {customer.diemtichluy || 0} điểm · {customer.loaikhachhang || 'Thường'}</p>
                </div>
                <button
                  onClick={() => { setCustomer(null); setCustomerSearch(''); setPointsUsed(0); }}
                  className="p-1 rounded text-red-500 hover:bg-red-50 animate-fadeIn"
                  title="Bỏ liên kết khách hàng"
                  style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
                >
                  <X size={15} />
                </button>
              </div>
            ) : <p className="text-xs text-[#9CA3AF]">Nhấn Enter để tìm</p>}

            {/* Input dùng điểm tích lũy */}
            {customer && customer.diemtichluy > 0 && (
              <div className="mt-3 p-3 rounded-lg border border-dashed border-orange-200 bg-orange-50/30 animate-fadeIn">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-orange-800">🎁 Sử dụng điểm thưởng</span>
                  <span className="text-[10px] text-gray-500">(1 điểm = 1.000 ₫)</span>
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min={0}
                    max={Math.min(customer.diemtichluy, Math.ceil(total / 1000))}
                    value={pointsUsed || ''}
                    onChange={e => {
                      const val = Math.max(0, Number(e.target.value) || 0);
                      const maxPoints = Math.min(customer.diemtichluy, Math.ceil(total / 1000));
                      setPointsUsed(Math.min(val, maxPoints));
                    }}
                    placeholder="Nhập điểm"
                    className="w-20 px-2 py-1 text-center text-xs font-bold text-[#111827]"
                    style={{ border: '1.5px solid #F97316', borderRadius: 6, outline: 'none', backgroundColor: 'white' }}
                  />
                  <span className="text-xs text-gray-600">/ {customer.diemtichluy} điểm</span>
                  <button
                    onClick={() => {
                      const maxPoints = Math.min(customer.diemtichluy, Math.floor(total / 1000));
                      setPointsUsed(maxPoints);
                    }}
                    className="ml-auto px-2 py-1 text-[10px] font-bold text-orange-700 bg-orange-100 hover:bg-orange-200 rounded transition-all"
                    style={{ border: 'none', cursor: 'pointer' }}
                  >
                    Dùng tối đa
                  </button>
                </div>
                {pointsUsed > 0 && (
                  <p className="text-[11px] text-emerald-700 font-bold mt-1.5 flex items-center gap-1 animate-fadeIn">
                    ✓ Đã trừ: -{fmt(pointsUsed * 1000)}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto p-4">
            <p className="text-sm font-semibold text-[#111827] mb-3">Giỏ hàng ({cart.reduce((s, i) => s + i.qty, 0)} SP)</p>
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-[#D1D5DB]"><PawPrint size={40} /><p className="text-sm mt-2">Chưa có sản phẩm</p></div>
            ) : (
              <div className="space-y-3 animate-fadeIn">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl hover:shadow-sm transition-all" style={{ backgroundColor: '#F9FAFB', border: '1px solid #F3F4F6' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#111827] truncate font-bold" style={{ fontFamily: 'Nunito, sans-serif' }}>{item.name}</p>
                      <p className="text-xs font-semibold" style={{ color: '#F97316' }}>{fmt(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded flex items-center justify-center text-[#6B7280]" style={{ border: '1px solid #E5E7EB', backgroundColor: 'white', cursor: 'pointer' }}><Minus size={12} /></button>
                      <span className="w-6 text-center text-sm font-semibold text-[#111827]">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded flex items-center justify-center text-white" style={{ backgroundColor: '#F97316', border: 'none', cursor: 'pointer' }}><Plus size={12} /></button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-[#9CA3AF] hover:text-[#EF4444] ml-1" style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-[#E5E7EB]" style={{ backgroundColor: '#FFFBF8' }}>
            <div className="space-y-1.5 mb-3 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Tạm tính</span>
                <span className="font-semibold text-gray-700">{fmt(total)}</span>
              </div>
              {pointsUsed > 0 && (
                <div className="flex justify-between text-emerald-600 animate-fadeIn">
                  <span>Trừ điểm tích lũy</span>
                  <span className="font-bold">-{fmt(pointsUsed * 1000)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1.5 border-t border-dashed border-gray-200">
                <span style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 16, color: '#111827' }}>TỔNG CẦN TRẢ</span>
                <span style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 22, color: '#F97316' }}>{fmt(Math.max(total - pointsUsed * 1000, 0))}</span>
              </div>
            </div>
            <div className="flex gap-2 mb-4">
              {PAY_METHODS.map(m => {
                const Icon = m.icon; const active = paymentMethod === m.key;
                return (
                  <button key={m.key} onClick={() => setPaymentMethod(m.key)} className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-xs"
                    style={{ border: `2px solid ${active ? '#F97316' : '#E5E7EB'}`, backgroundColor: active ? '#FFF0E6' : 'white', color: active ? '#F97316' : '#6B7280', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>
                    <Icon size={16} />{m.label}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleHoldOrder}
                disabled={cart.length === 0}
                className="flex items-center justify-center font-bold text-sm rounded-lg border transition-all"
                style={{
                  width: '35%',
                  height: 52,
                  borderColor: cart.length === 0 ? '#E5E7EB' : '#F97316',
                  color: cart.length === 0 ? '#9CA3AF' : '#F97316',
                  backgroundColor: cart.length === 0 ? '#F9FAFB' : '#FFF0E6',
                  cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                  fontFamily: 'Nunito, sans-serif'
                }}
                title="Treo đơn hàng"
              >
                Treo đơn
              </button>
              <button onClick={handleCheckout} disabled={cart.length === 0 || checkingOut}
                className="flex items-center justify-center text-white"
                style={{
                  width: '65%',
                  backgroundColor: cart.length === 0 ? '#E5E7EB' : '#F97316',
                  color: cart.length === 0 ? '#9CA3AF' : 'white',
                  borderRadius: 8,
                  border: 'none',
                  height: 52,
                  fontFamily: 'Nunito, sans-serif',
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: cart.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                {checkingOut ? 'Đang xử lý...' : `THANH TOÁN`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal danh sách hóa đơn tạm */}
      {showHeldList && (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-fadeIn" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 p-6 shadow-2xl transition-all" style={{ border: '1px solid #E5E7EB' }}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F3F4F6]">
              <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 18, color: '#111827' }} className="flex items-center gap-2">
                📋 Danh sách Hóa đơn tạm đang treo
              </h3>
              <button onClick={() => setShowHeldList(false)} className="p-2 rounded-lg hover:bg-gray-100 text-[#6B7280]" style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
              {heldOrders.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <PawPrint className="mx-auto text-gray-300 mb-2" size={32} />
                  <p className="text-sm">Không có hóa đơn tạm nào đang treo</p>
                </div>
              ) : (
                heldOrders.map((h: any) => (
                  <div
                    key={h.id}
                    onClick={() => handleRecallOrder(h)}
                    className="p-4 rounded-xl border border-gray-100 bg-[#FAF9F6] hover:border-orange-300 hover:bg-orange-50/20 cursor-pointer transition-all flex justify-between items-start gap-4 animate-fadeIn"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-[#111827] truncate">{h.note}</span>
                        <span className="text-[10px] bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-bold">{h.time}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2 truncate">
                        Sản phẩm: {h.cart.map((i: any) => `${i.name} (x${i.qty})`).join(', ')}
                      </p>
                      {h.customer && (
                        <div className="text-[11px] text-[#4B5563] flex items-center gap-1">
                          👤 Khách hàng: <span className="font-semibold text-gray-800">{h.customer.tendoitac}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end justify-between h-full min-h-[60px]">
                      <span className="text-sm font-bold text-orange-600">{fmt(h.cart.reduce((s: number, i: any) => s + i.price * i.qty, 0))}</span>
                      <button
                        onClick={(e) => handleDeleteHold(h.id, e)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors mt-auto"
                        title="Xóa đơn tạm"
                        style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-[#F3F4F6] pt-4 mt-4 flex justify-end">
              <button
                onClick={() => setShowHeldList(false)}
                className="px-4 py-2 text-sm font-semibold border border-[#E5E7EB] rounded-xl hover:bg-gray-50 transition-colors"
                style={{ cursor: 'pointer' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
