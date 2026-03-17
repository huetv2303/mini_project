import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '../../api/axios';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
    const [message, setMessage] = useState('Đang xác nhận email của bạn...');

    useEffect(() => {
        const url = searchParams.get('url');

        if (!url) {
            setStatus('error');
            setMessage('Đường dẫn xác nhận không hợp lệ.');
            return;
        }

        const verifyAccount = async () => {
            try {
                // Tách lấy chính xác phần sau /api/v1 (ví dụ: /email/verify/1/hash?...)
                const relativeUrl = url.includes('/api/v1') 
                    ? url.split('/api/v1')[1] 
                    : url;
                
                // Gọi API với đúng phần link tương đối
                const response = await api.get(relativeUrl);
                setStatus('success');
                setMessage(response.data.message || 'Xác nhận email thành công!');
                
                setTimeout(() => {
                    navigate('/login', { state: { message: 'Xác nhận email thành công! Vui lòng đăng nhập.' } });
                }, 3000);
            } catch (error) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Xác nhận email thất bại. Vui lòng thử lại.');
            }
        };

        verifyAccount();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
            <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden p-8 text-center">
                
                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="animate-spin text-blue-400 mb-4" size={48} />
                        <h2 className="text-2xl font-bold text-white mb-2">Đang xác nhận...</h2>
                        <p className="text-slate-300">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <CheckCircle className="text-green-400 mb-4" size={48} />
                        <h2 className="text-2xl font-bold text-white mb-2">Thành công!</h2>
                        <p className="text-slate-300 mb-6">{message}</p>
                        <p className="text-sm text-slate-400">Đang chuyển hướng đến trang đăng nhập...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <XCircle className="text-red-400 mb-4" size={48} />
                        <h2 className="text-2xl font-bold text-white mb-2">Lỗi xác nhận</h2>
                        <p className="text-slate-300 mb-6">{message}</p>
                        <button 
                            onClick={() => navigate('/login')}
                            className="py-2 px-6 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors"
                        >
                            Quay lại đăng nhập
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
