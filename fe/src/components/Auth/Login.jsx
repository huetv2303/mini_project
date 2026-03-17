import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [needsVerification, setNeedsVerification] = useState(false);
    const { login, resendVerification } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMessage('');
        setNeedsVerification(false);
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            const msg = err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
            setError(msg);
            if (err.response?.status === 403 && msg.includes('xác nhận email')) {
                setNeedsVerification(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            await resendVerification(email);
            setSuccessMessage('Đã gửi lại email xác nhận. Vui lòng kiểm tra hộp thư.');
            setNeedsVerification(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể gửi lại email xác nhận.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
            <div className="w-full max-w-md">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
                    <div className="p-8">
                        <div className="text-center mb-10">
                            <h1 className="text-4xl font-bold text-white mb-2">Chào mừng trở lại</h1>
                            <p className="text-slate-400">Đăng nhập để tiếp tục trải nghiệm</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm flex flex-col items-start gap-2">
                                <span>{error}</span>
                                {needsVerification && (
                                    <button 
                                        onClick={handleResend}
                                        disabled={loading}
                                        className="text-white bg-red-600/50 hover:bg-red-600/80 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                                    >
                                        {loading ? 'Đang gửi...' : 'Gửi lại email xác nhận'}
                                    </button>
                                )}
                            </div>
                        )}

                        {successMessage && (
                            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-200 text-sm">
                                {successMessage}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300 ml-1">Email</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-purple-400 transition-colors">
                                        <Mail size={20} />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-sm font-medium text-slate-300">Mật khẩu</label>
                                    <a href="#" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">Quên mật khẩu?</a>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-purple-400 transition-colors">
                                        <Lock size={20} />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="block w-full pl-11 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        <span>Đang xử lý...</span>
                                    </>
                                ) : (
                                    <span>Đăng nhập</span>
                                )}
                            </button>
                        </form>
                    </div>
                    
                    <div className="p-8 bg-white/5 border-t border-white/10 text-center">
                        <p className="text-slate-400">
                            Chưa có tài khoản?{' '}
                            <Link to="/register" className="text-purple-400 font-semibold hover:text-purple-300 transition-colors">
                                Đăng ký ngay
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
