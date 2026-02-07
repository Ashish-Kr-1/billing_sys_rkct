import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '../context/CompanyContext';
import { useAuth } from '../context/AuthContext';
import { api, handleApiResponse } from '../config/apiClient';
import { ChevronRight, LogOut, CheckCircle, XCircle, AlertCircle, Users } from 'lucide-react';
import DefaultLogo from '../assets/logo.png';
import GlobalBharatLogo from '../assets/logo-global-bharat.png';



const COMPANY_COLORS = {
    1: { bg: 'from-orange-500 to-red-500', hover: 'hover:from-orange-600 hover:to-red-600' },
    2: { bg: 'from-teal-500 to-cyan-500', hover: 'hover:from-teal-600 hover:to-cyan-600' },
    3: { bg: 'from-blue-500 to-indigo-500', hover: 'hover:from-blue-600 hover:to-indigo-600' }
};

export default function CompanySelection() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const { selectCompany } = useCompany();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const data = await handleApiResponse(api.get('/companies'));
            const allCompanies = data.companies || [];

            // Fetch user's company access
            const accessData = await handleApiResponse(api.get(`/users/${user.user_id}/company-access`));
            const accessibleCompanyIds = accessData.company_ids || [];

            // Filter companies based on access
            const filteredCompanies = allCompanies.filter(company =>
                accessibleCompanyIds.includes(company.id)
            );
            setCompanies(filteredCompanies);
        } catch (err) {
            setError(err.message);
            if (err.message.includes('401') || err.message.includes('Unauthorized')) {
                logout();
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSelectCompany = (company) => {
        selectCompany(company);
        navigate('/select-section');
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleUserManagement = () => {
        navigate('/users');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading companies...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-12 px-4">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">Select Your Company</h1>
                        <p className="text-gray-600">Welcome back, <span className="font-semibold">{user?.full_name || user?.username}</span></p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="max-w-6xl mx-auto mb-6">
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                </div>
            )}

            {/* Company Cards Grid */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {companies.map((company) => {
                    const colors = COMPANY_COLORS[company.id] || COMPANY_COLORS[1];
                    const isConnected = company.connectionStatus === 'connected';
                    const hasError = company.connectionStatus === 'error';

                    // Connection status icon and color
                    const StatusIcon = isConnected ? CheckCircle : hasError ? XCircle : AlertCircle;
                    const statusColor = isConnected ? 'text-green-500' : hasError ? 'text-red-500' : 'text-yellow-500';
                    const statusBg = isConnected ? 'bg-green-50' : hasError ? 'bg-red-50' : 'bg-yellow-50';
                    const statusText = isConnected ? 'Connected' : hasError ? 'Error' : 'Disconnected';

                    return (
                        <button
                            key={company.id}
                            onClick={() => isConnected && handleSelectCompany(company)}
                            disabled={!isConnected}
                            className={`group relative bg-white rounded-2xl shadow-lg transition-all duration-300 overflow-hidden ${isConnected
                                ? 'hover:shadow-2xl transform hover:scale-105 cursor-pointer'
                                : 'opacity-60 cursor-not-allowed'
                                }`}
                        >
                            {/* Gradient Header */}
                            <div className={`h-40 bg-gradient-to-br ${colors.bg} ${isConnected ? colors.hover : ''} transition-all duration-300 flex items-center justify-center relative`}>
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md p-3">
                                    <img
                                        src={company.id === 3 ? GlobalBharatLogo : DefaultLogo}
                                        alt={company.name}
                                        className="w-full h-full object-contain"
                                    />
                                </div>

                                {/* Connection Status Badge */}
                                <div className={`absolute top-3 right-3 ${statusBg} rounded-full px-3 py-1 flex items-center gap-1.5`}>
                                    <StatusIcon className={`w-4 h-4 ${statusColor}`} />
                                    <span className={`text-xs font-semibold ${statusColor}`}>{statusText}</span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-4">
                                <h3 className={`text-xl font-bold transition-colors ${isConnected ? 'text-gray-900 group-hover:text-blue-600' : 'text-gray-500'
                                    }`}>
                                    {company.name}
                                </h3>

                                <div className="flex items-center justify-between text-sm text-gray-600">
                                    <span className="font-medium">{company.shortName}</span>
                                    {isConnected && (
                                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                                    )}
                                </div>

                                {/* Error Message */}
                                {hasError && company.errorMessage && (
                                    <div className="mt-2 text-xs text-red-600 bg-red-50 rounded-lg p-2">
                                        {company.errorMessage}
                                    </div>
                                )}
                            </div>

                            {/* Hover Effect (only for connected) */}
                            {isConnected && (
                                <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                            )}
                        </button>
                    );
                })}

                {/* User Management Card - Admin Only */}
                {user?.role === 'admin' && (
                    <button
                        onClick={handleUserManagement}
                        className="group relative bg-white rounded-2xl shadow-lg transition-all duration-300 overflow-hidden hover:shadow-2xl transform hover:scale-105 cursor-pointer"
                    >
                        <div className="h-40 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center relative">
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg p-3">
                                <Users className="w-10 h-10 text-white" />
                            </div>
                        </div>

                        <div className="p-6 space-y-2">
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                User Management
                            </h3>
                            <div className="flex items-center justify-between text-sm text-gray-600">
                                <span className="font-medium">Manage Users & Access</span>
                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                            </div>
                        </div>

                        {/* Hover Effect */}
                        <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    </button>
                )}
            </div>

            {/* Info Section */}
            <div className="max-w-6xl mx-auto mt-12 space-y-4">
                <div className="bg-white rounded-xl shadow-md p-6">
                    <p className="text-gray-600 text-center">
                        Select a company to access its invoicing, analytics, and financial data.
                    </p>
                </div>

                {/* Connection Status Summary */}
                {companies.some(c => c.connectionStatus !== 'connected') && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-amber-900 mb-3 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            Database Connection Issues Detected
                        </h3>
                        <div className="space-y-2 text-sm text-amber-800">
                            <p>
                                <strong>Problem:</strong> Some company databases are not accessible from your current IP address.
                            </p>
                            <p>
                                <strong>Solution:</strong> To access all companies, you need to whitelist your IP address in Hostinger:
                            </p>
                            <ol className="list-decimal list-inside ml-4 space-y-1">
                                <li>Log in to <a href="https://hpanel.hostinger.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">hpanel.hostinger.com</a></li>
                                <li>Go to <strong>Databases → Remote MySQL</strong></li>
                                <li>Add your current IP address: <code className="bg-amber-100 px-2 py-0.5 rounded font-mono text-xs">Check error message above</code></li>
                                <li>Click "Create" and refresh this page</li>
                            </ol>
                            <p className="mt-3 text-xs text-amber-700">
                                💡 Tip: You can still use Company 1 (RK Casting) which is currently connected.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
