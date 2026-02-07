import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from './config/apiClient';
import { Users, Plus, Trash2, Key, Edit2, ArrowLeft, Shield, User as UserIcon, Building2, Layers } from 'lucide-react';
import Footer from './components/Footer';
import { notify } from './components/Notification';
import ConfirmModal from './components/ConfirmModal';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [showCompanyAccessModal, setShowCompanyAccessModal] = useState(false);
    const [companyAccess, setCompanyAccess] = useState([]);
    const [showSectionAccessModal, setShowSectionAccessModal] = useState(false);
    const [sectionAccess, setSectionAccess] = useState([]);

    const navigate = useNavigate();

    const companies = [
        { id: 1, name: 'RK Casting and Engineering Works' },
        { id: 2, name: 'RKCASTING ENGINEERING PVT. LTD.' },
        { id: 3, name: 'Global Bharat' }
    ];

    const sections = [
        { id: 'invoice', name: 'Invoice Management', description: 'Create and manage invoices' },
        { id: 'analytics', name: 'Analytics Dashboard', description: 'View business analytics and reports' },
        { id: 'ledger', name: 'Ledger', description: 'View and manage ledger entries' },
        { id: 'quotation', name: 'Quotation', description: 'Create and manage quotations' },
        { id: 'quotation_ledger', name: 'Quotation Ledger', description: 'View quotation history and ledger' },
        { id: 'party', name: 'Party Management', description: 'Create and manage parties' }
    ];

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        full_name: '',
        role: 'user'
    });

    const [resetPassword, setResetPassword] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            const data = await response.json();
            setUsers(data.users || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            if (error.message.includes('403')) {
                notify('Access denied. Admin privileges required.', 'error');
                navigate('/select-section');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();

        if (formData.password.length < 8) {
            notify('Password must be at least 8 characters', 'warning');
            return;
        }

        try {
            const response = await api.post('/users', formData);
            const data = await response.json();

            if (response.ok) {
                notify('User created successfully!', 'success');
                setShowCreateModal(false);
                setFormData({ username: '', email: '', password: '', full_name: '', role: 'user' });
                fetchUsers();
            } else {
                notify(data.error || 'Failed to create user', 'error');
            }
        } catch (error) {
            console.error('Error creating user:', error);
            notify('Failed to create user', 'error');
        }
    };

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;

        try {
            const response = await api.delete(`/users/${userToDelete.id}`);
            const data = await response.json();

            if (response.ok) {
                notify('User deleted successfully', 'success');
                fetchUsers();
            } else {
                notify(data.error || 'Failed to delete user', 'error');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            notify('Failed to delete user', 'error');
        } finally {
            setShowDeleteModal(false);
            setUserToDelete(null);
        }
    };

    const handleDeleteUserCheck = (userId, username) => {
        setUserToDelete({ id: userId, username });
        setShowDeleteModal(true);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (resetPassword.length < 8) {
            notify('Password must be at least 8 characters', 'warning');
            return;
        }

        try {
            const response = await api.post(`/users/${selectedUser.user_id}/reset-password`, {
                new_password: resetPassword
            });
            const data = await response.json();

            if (response.ok) {
                notify('Password reset successfully!', 'success');
                setShowResetModal(false);
                setResetPassword('');
                setSelectedUser(null);
            } else {
                notify(data.error || 'Failed to reset password', 'error');
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            notify('Failed to reset password', 'error');
        }
    };

    const handleToggleActive = async (userId, currentStatus) => {
        try {
            const response = await api.put(`/users/${userId}`, {
                is_active: !currentStatus
            });
            const data = await response.json();

            if (response.ok) {
                notify(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`, 'success');
                fetchUsers();
            } else {
                notify(data.error || 'Failed to update user status', 'error');
            }
        } catch (error) {
            console.error('Error toggling user status:', error);
            notify('Failed to update user status', 'error');
        }
    };

    const handleOpenCompanyAccess = async (user) => {
        setSelectedUser(user);
        try {
            const response = await api.get(`/users/${user.user_id}/company-access`);
            const data = await response.json();
            setCompanyAccess(data.company_ids || []);
            setShowCompanyAccessModal(true);
        } catch (error) {
            console.error('Error fetching company access:', error);
            notify('Failed to load company access', 'error');
        }
    };

    const handleToggleCompanyAccess = (companyId) => {
        setCompanyAccess(prev =>
            prev.includes(companyId)
                ? prev.filter(id => id !== companyId)
                : [...prev, companyId]
        );
    };

    const handleSaveCompanyAccess = async () => {
        try {
            const response = await api.put(`/users/${selectedUser.user_id}/company-access`, {
                company_ids: companyAccess
            });
            const data = await response.json();

            if (response.ok) {
                notify('Company access updated successfully!', 'success');
                setShowCompanyAccessModal(false);
                setSelectedUser(null);
            } else {
                notify(data.error || 'Failed to update company access', 'error');
            }
        } catch (error) {
            console.error('Error updating company access:', error);
            notify('Failed to update company access', 'error');
        }
    };

    const handleOpenSectionAccess = async (user) => {
        setSelectedUser(user);
        try {
            const response = await api.get(`/users/${user.user_id}/section-access`);
            const data = await response.json();
            setSectionAccess(data.sections || []);
            setShowSectionAccessModal(true);
        } catch (error) {
            console.error('Error fetching section access:', error);
            notify('Failed to load section access', 'error');
        }
    };

    const handleToggleSectionAccess = (sectionId) => {
        setSectionAccess(prev =>
            prev.includes(sectionId)
                ? prev.filter(id => id !== sectionId)
                : [...prev, sectionId]
        );
    };

    const handleSaveSectionAccess = async () => {
        try {
            const response = await api.put(`/users/${selectedUser.user_id}/section-access`, {
                sections: sectionAccess
            });
            const data = await response.json();

            if (response.ok) {
                notify('Section access updated successfully!', 'success');
                setShowSectionAccessModal(false);
                setSelectedUser(null);
            } else {
                notify(data.error || 'Failed to update section access', 'error');
            }
        } catch (error) {
            console.error('Error updating section access:', error);
            notify('Failed to update section access', 'error');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-[#004f43] text-white p-4 shadow-md">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/select-section')} className="hover:bg-[#003d34] p-2 rounded-full transition">
                            <ArrowLeft size={24} />
                        </button>
                        <div className="flex items-center gap-3">
                            <Users size={28} />
                            <h1 className="text-2xl font-bold font-serif">User Management</h1>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-white text-[#004f43] px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-gray-100 transition shadow-sm"
                    >
                        <Plus size={20} /> Create User
                    </button>
                </div>
            </div>

            <div className="flex-grow max-w-7xl mx-auto w-full p-6">
                {loading ? (
                    <div className="text-center py-20 text-gray-500">Loading users...</div>
                ) : users.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                        <Users size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg">No users found.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm uppercase tracking-wider">
                                        <th className="p-4 font-semibold">User</th>
                                        <th className="p-4 font-semibold">Email</th>
                                        <th className="p-4 font-semibold">Role</th>
                                        <th className="p-4 font-semibold">Status</th>
                                        <th className="p-4 font-semibold">Last Login</th>
                                        <th className="p-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {users.map((user) => (
                                        <tr key={user.user_id} className="hover:bg-gray-50 transition">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.role === 'admin' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                                                        {user.role === 'admin' ? (
                                                            <Shield className="text-purple-600" size={20} />
                                                        ) : (
                                                            <UserIcon className="text-blue-600" size={20} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{user.full_name || user.username}</div>
                                                        <div className="text-sm text-gray-500">@{user.username}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-gray-600">{user.email}</td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => handleToggleActive(user.user_id, user.is_active)}
                                                    className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition ${user.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                                                >
                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                            <td className="p-4 text-gray-600 text-sm">
                                                {user.last_login ? new Date(user.last_login).toLocaleDateString('en-IN') : 'Never'}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleOpenCompanyAccess(user)}
                                                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition"
                                                        title="Manage Company Access"
                                                    >
                                                        <Building2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenSectionAccess(user)}
                                                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition"
                                                        title="Manage Section Access"
                                                    >
                                                        <Layers size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setShowResetModal(true);
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                                                        title="Reset Password"
                                                    >
                                                        <Key size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUserCheck(user.user_id, user.username)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New User</h2>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004f43] focus:border-transparent outline-none"
                                    placeholder="john_doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004f43] focus:border-transparent outline-none"
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004f43] focus:border-transparent outline-none"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password * (min 8 characters)</label>
                                <input
                                    type="password"
                                    required
                                    minLength={8}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004f43] focus:border-transparent outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004f43] focus:border-transparent outline-none"
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setFormData({ username: '', email: '', password: '', full_name: '', role: 'user' });
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-[#004f43] text-white rounded-lg hover:bg-[#003d34] transition font-medium"
                                >
                                    Create User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {showResetModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h2>
                        <p className="text-gray-600 mb-6">Reset password for <strong>{selectedUser.username}</strong></p>
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Password * (min 8 characters)</label>
                                <input
                                    type="password"
                                    required
                                    minLength={8}
                                    value={resetPassword}
                                    onChange={(e) => setResetPassword(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004f43] focus:border-transparent outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowResetModal(false);
                                        setResetPassword('');
                                        setSelectedUser(null);
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-[#004f43] text-white rounded-lg hover:bg-[#003d34] transition font-medium"
                                >
                                    Reset Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Company Access Modal */}
            {showCompanyAccessModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Manage Company Access</h2>
                        <p className="text-gray-600 mb-6">Select companies for <strong>{selectedUser.username}</strong></p>

                        <div className="space-y-3 mb-6">
                            {companies.map(company => (
                                <label
                                    key={company.id}
                                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                                >
                                    <input
                                        type="checkbox"
                                        checked={companyAccess.includes(company.id)}
                                        onChange={() => handleToggleCompanyAccess(company.id)}
                                        className="w-5 h-5 text-[#004f43] rounded focus:ring-2 focus:ring-[#004f43] cursor-pointer"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">{company.name}</div>
                                        <div className="text-xs text-gray-500">Company ID: {company.id}</div>
                                    </div>
                                </label>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCompanyAccessModal(false);
                                    setSelectedUser(null);
                                    setCompanyAccess([]);
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveCompanyAccess}
                                className="flex-1 px-4 py-2 bg-[#004f43] text-white rounded-lg hover:bg-[#003d34] transition font-medium"
                            >
                                Save Access
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Section Access Modal */}
            {showSectionAccessModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Manage Section Access</h2>
                        <p className="text-gray-600 mb-6">Select sections for <strong>{selectedUser.username}</strong></p>

                        <div className="space-y-3 mb-6">
                            {sections.map(section => (
                                <label
                                    key={section.id}
                                    className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                                >
                                    <input
                                        type="checkbox"
                                        checked={sectionAccess.includes(section.id)}
                                        onChange={() => handleToggleSectionAccess(section.id)}
                                        className="w-5 h-5 text-[#004f43] rounded focus:ring-2 focus:ring-[#004f43] cursor-pointer mt-0.5"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">{section.name}</div>
                                        <div className="text-xs text-gray-500">{section.description}</div>
                                    </div>
                                </label>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowSectionAccessModal(false);
                                    setSelectedUser(null);
                                    setSectionAccess([]);
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveSectionAccess}
                                className="flex-1 px-4 py-2 bg-[#004f43] text-white rounded-lg hover:bg-[#003d34] transition font-medium"
                            >
                                Save Access
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDeleteUser}
                title="Delete User"
                message={`Are you sure you want to delete user "${userToDelete?.username}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
            />

            <Footer />
        </div>
    );
}
