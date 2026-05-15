import React, { useState, useEffect } from 'react';
import WalletService from '../../services/WalletService';
import { useAuth } from '../../context/AuthContext';
import CustomerLayout from '../../components/layout/Customer/CustomerLayout';
import { 
    Wallet, 
    ArrowUpCircle, 
    ArrowDownCircle, 
    History, 
    Clock, 
    Info, 
    TrendingUp, 
    CreditCard
} from 'lucide-react';

const WalletPage = () => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 });

    const fetchTransactions = async (page = 1) => {
        setLoading(true);
        try {
            const response = await WalletService.getTransactions(page);
            if (response && response.data) {
                setTransactions(response.data);
                setPagination(response.meta || { current_page: 1, last_page: 1 });
            }
        } catch (error) {
            console.error('Error fetching wallet transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const getTransactionIcon = (type) => {
        return type === 'deposit' 
            ? <ArrowUpCircle className="text-emerald-500" /> 
            : <ArrowDownCircle className="text-rose-500" />;
    };

    const getReferenceLabel = (type) => {
        switch(type) {
            case 'order': return 'Thanh toán đơn hàng';
            case 'order_return': return 'Hoàn tiền trả hàng';
            case 'manual': return 'Nạp tiền thủ công';
            default: return 'Khác';
        }
    };

    return (
        <CustomerLayout>
            <div className="bg-slate-50 min-h-screen pt-32 pb-24">
                <div className="max-w-6xl mx-auto px-4">
                    {/* Wallet Card */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-8 mb-8 shadow-2xl text-white">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Wallet size={160} />
                        </div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2 opacity-80">
                                <Wallet size={20} />
                                <span className="text-sm font-medium uppercase tracking-wider">Số dư hiện tại</span>
                            </div>
                            <h1 className="text-5xl font-bold mb-8">
                                {formatCurrency(user?.wallet_balance || 0)}
                            </h1>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                    <div className="flex items-center gap-2 mb-1 opacity-70">
                                        <TrendingUp size={16} />
                                        <span className="text-xs">Tài khoản</span>
                                    </div>
                                    <div className="font-semibold">{user?.name}</div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                    <div className="flex items-center gap-2 mb-1 opacity-70">
                                        <CreditCard size={16} />
                                        <span className="text-xs">Loại ví</span>
                                    </div>
                                    <div className="font-semibold">Ví mua sắm nội bộ</div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                    <div className="flex items-center gap-2 mb-1 opacity-70">
                                        <Clock size={16} />
                                        <span className="text-xs">Cập nhật cuối</span>
                                    </div>
                                    <div className="font-semibold">Vừa xong</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* History Section */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <History size={20} />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800">Lịch sử giao dịch</h2>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <Info size={14} />
                                <span>Chỉ hiển thị các giao dịch trong 12 tháng gần nhất</span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 text-left font-semibold">Giao dịch</th>
                                        <th className="px-6 py-4 text-left font-semibold">Nội dung</th>
                                        <th className="px-6 py-4 text-left font-semibold">Số tiền</th>
                                        <th className="px-6 py-4 text-left font-semibold">Số dư sau</th>
                                        <th className="px-6 py-4 text-left font-semibold">Thời gian</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        Array(5).fill(0).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td className="px-6 py-4"><div className="h-10 w-10 bg-slate-100 rounded-full"></div></td>
                                                <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-100 rounded"></div></td>
                                                <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-100 rounded"></div></td>
                                                <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-100 rounded"></div></td>
                                                <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-100 rounded"></div></td>
                                            </tr>
                                        ))
                                    ) : transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                                <div className="flex flex-col items-center gap-2">
                                                    <History size={48} className="opacity-20" />
                                                    <p>Chưa có giao dịch nào được thực hiện</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        transactions.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-full ${tx.type === 'deposit' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                                                            {getTransactionIcon(tx.type)}
                                                        </div>
                                                        <div className="text-sm font-medium text-slate-700">
                                                            {tx.type === 'deposit' ? 'Cộng tiền' : 'Trừ tiền'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-slate-600 font-medium">{tx.description}</div>
                                                    <div className="text-xs text-slate-400">{getReferenceLabel(tx.reference_type)}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-sm font-bold ${tx.type === 'deposit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {tx.type === 'deposit' ? '+' : ''}{formatCurrency(tx.amount)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-slate-500 font-medium">{formatCurrency(tx.balance_after)}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-slate-500">
                                                        {new Date(tx.created_at).toLocaleString('vi-VN', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination?.last_page > 1 && (
                            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center gap-2">
                                {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => fetchTransactions(page)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                            pagination.current_page === page
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
};

export default WalletPage;
