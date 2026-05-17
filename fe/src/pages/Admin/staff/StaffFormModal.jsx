import React, { useState, useEffect } from "react";
import { X, User, Mail, Lock, Shield, Loader2 } from "lucide-react";
import { createUserRequest, updateUserRequest } from "../../../services/UserService";
import toast from "react-hot-toast";

const StaffFormModal = ({ isOpen, onClose, onSuccess, staff, roles }) => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role_id: ""
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (staff) {
            setFormData({
                name: staff.name || "",
                email: staff.email || "",
                password: "", // Không hiển thị mật khẩu cũ
                role_id: staff.role_id || ""
            });
        } else {
            setFormData({
                name: "",
                email: "",
                password: "",
                role_id: roles[0]?.id || ""
            });
        }
        setErrors({});
    }, [staff, roles, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            if (staff) {
                // Update
                const payload = { ...formData };
                if (!payload.password) delete payload.password; // Không đổi mật khẩu nếu để trống
                await updateUserRequest(staff.id, payload);
                toast.success("Cập nhật nhân viên thành công!");
            } else {
                // Create
                await createUserRequest(formData);
                toast.success("Thêm nhân viên mới thành công!");
            }
            onSuccess();
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                toast.error(error.response?.data?.message || "Có lỗi xảy ra!");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
            
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            {staff ? "Sửa thông tin nhân viên" : "Thêm nhân viên mới"}
                        </h2>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                            Vui lòng điền đầy đủ các thông tin bên dưới.
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Name */}
                    <div className="space-y-2">
                        <label className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <User size={14} className="text-blue-500" /> Họ và tên
                        </label>
                        <input
                            type="text"
                            required
                            className={`w-full h-12 bg-slate-50/50 border border-slate-200 rounded-xl px-4 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-semibold text-slate-800 ${errors.name ? 'ring-2 ring-red-100' : ''}`}
                            placeholder="Nhập họ tên nhân viên..."
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                        {errors.name && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.name[0]}</p>}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Mail size={14} className="text-blue-500" /> Địa chỉ Email
                        </label>
                        <input
                            type="email"
                            required
                            className={`w-full h-12 bg-slate-50/50 border border-slate-200 rounded-xl px-4 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-semibold text-slate-800 ${errors.email ? 'ring-2 ring-red-100' : ''}`}
                            placeholder="email@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                        {errors.email && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.email[0]}</p>}
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <label className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Lock size={14} className="text-blue-500" /> Mật khẩu
                        </label>
                        <input
                            type="password"
                            required={!staff}
                            className={`w-full h-12 bg-slate-50/50 border border-slate-200 rounded-xl px-4 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-semibold text-slate-800 ${errors.password ? 'ring-2 ring-red-100' : ''}`}
                            placeholder={staff ? "Để trống nếu không muốn đổi" : "Nhập mật khẩu ít nhất 8 ký tự..."}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                        {errors.password && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.password[0]}</p>}
                    </div>

                    {/* Role */}
                    <div className="space-y-2">
                        <label className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Shield size={14} className="text-blue-500" /> Vai trò
                        </label>
                        <select
                            required
                            className="w-full h-12 bg-slate-50/50 border border-slate-200 rounded-xl px-4 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-semibold text-slate-800"
                            value={formData.role_id}
                            onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                        >
                            <option value="">Chọn vai trò</option>
                            {roles.map((role) => (
                                <option key={role.id} value={role.id}>
                                    {role.name}
                                </option>
                            ))}
                        </select>
                        {errors.role_id && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.role_id[0]}</p>}
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            {staff ? "Cập nhật nhân viên" : "Tạo tài khoản ngay"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StaffFormModal;
