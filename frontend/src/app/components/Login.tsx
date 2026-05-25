import { useState } from 'react';
import { useNavigate } from 'react-router';
import { User, Lock, Eye, EyeOff, PawPrint, Loader2 } from 'lucide-react';
import { authApi } from '../api';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { setError('Vui lòng nhập username và mật khẩu'); return; }
    setError(''); setLoading(true);
    try {
      const data = await authApi.login(username, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Sai tên đăng nhập hoặc mật khẩu');
    } finally { setLoading(false); }
  };

  const inputStyle = (hasError: boolean) => ({
    border: `1.5px solid ${hasError ? '#EF4444' : '#E5E7EB'}`,
    borderRadius: 8, outline: 'none', backgroundColor: '#F9FAFB', transition: 'border-color 0.15s',
  });

  return (
    <div className="flex h-screen w-full" style={{ fontFamily: 'Roboto, sans-serif' }}>
      {/* Left – Brand panel */}
      <div className="hidden md:flex w-1/2 flex-col items-center justify-center relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #F97316 0%, #EA6C0A 100%)' }}>
        {[
          { top: '8%', left: '10%', size: 32, rotate: 20 }, { top: '18%', left: '72%', size: 20, rotate: -30 },
          { top: '38%', left: '85%', size: 28, rotate: 15 }, { top: '60%', left: '8%', size: 22, rotate: 45 },
          { top: '75%', left: '65%', size: 36, rotate: -20 }, { top: '85%', left: '30%', size: 18, rotate: 60 },
          { top: '5%', left: '48%', size: 24, rotate: -10 }, { top: '50%', left: '50%', size: 16, rotate: 80 },
        ].map((p, i) => (
          <div key={i} className="absolute opacity-20" style={{ top: p.top, left: p.left, transform: `rotate(${p.rotate}deg)` }}>
            <PawPrint size={p.size} color="white" />
          </div>
        ))}
        <div className="relative z-10 text-center px-12">
          <div className="flex justify-center mb-8">
            <div className="w-32 h-32 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <PawPrint size={72} color="white" />
            </div>
          </div>
          <h1 className="text-white text-5xl mb-4" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800 }}>PetERP</h1>
          <p className="text-white/90 text-xl mb-3" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>
            Quản lý Pet Shop & Spa thông minh hơn
          </p>
          <p className="text-white/70 text-sm max-w-sm mx-auto">
            Một nền tảng quản lý toàn diện bán hàng, kho, đối tác, khách hàng, thú cưng, nhân sự và bảng lương.
          </p>
        </div>
      </div>

      {/* Right – Form panel */}
      <div className="flex w-full md:w-1/2 items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F97316' }}>
              <PawPrint size={22} color="white" />
            </div>
            <span className="text-2xl" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, color: '#F97316' }}>PetERP</span>
          </div>

          <h2 className="text-[28px] text-[#111827] mb-1" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
            Chào mừng trở lại 👋
          </h2>
          <p className="text-[#6B7280] text-sm mb-8">Đăng nhập để tiếp tục quản trị hệ thống</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">Tên đăng nhập</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"><User size={17} /></div>
                <input type="text" value={username}
                  onChange={e => { setUsername(e.target.value); setError(''); }}
                  placeholder="Nhập tên đăng nhập của bạn" className="w-full pl-10 pr-4 py-3 text-sm text-[#111827]"
                  style={inputStyle(!!error)}
                  onFocus={e => (e.target.style.borderColor = error ? '#EF4444' : '#F97316')}
                  onBlur={e => (e.target.style.borderColor = error ? '#EF4444' : '#E5E7EB')} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">Mật khẩu</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"><Lock size={17} /></div>
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="Nhập mật khẩu của bạn" className="w-full pl-10 pr-12 py-3 text-sm text-[#111827]"
                  style={inputStyle(!!error)}
                  onFocus={e => (e.target.style.borderColor = error ? '#EF4444' : '#F97316')}
                  onBlur={e => (e.target.style.borderColor = error ? '#EF4444' : '#E5E7EB')} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]">
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm flex items-center gap-1.5" style={{ color: '#EF4444' }}><span>⚠️</span> {error}</p>}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="w-4 h-4 rounded" style={{ accentColor: '#F97316' }} />
                <span className="text-sm text-[#374151]">Ghi nhớ đăng nhập</span>
              </label>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 text-white transition-all duration-150"
              style={{ backgroundColor: loading ? '#FDBA74' : '#F97316', borderRadius: 8, height: 48, fontFamily: 'Nunito, sans-serif', fontWeight: 600, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', border: 'none' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#EA6C0A'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#F97316'; }}>
              {loading ? (<><Loader2 size={18} className="animate-spin" />Đang đăng nhập...</>) : 'ĐĂNG NHẬP'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
