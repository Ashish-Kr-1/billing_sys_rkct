import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '../context/CompanyContext';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config/api';
import { Building2, Factory, Globe, ChevronRight, LogOut } from 'lucide-react';

const COMPANY_ICONS = {
    1: Factory,
    2: Building2,
    3: Globe
};

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
            const res = await fetch(`${API_BASE}/companies`);
            if (!res.ok) throw new Error('Failed to fetch companies');

            const data = await res.json();
            setCompanies(data.companies || []);
        } catch (err) {
            setError(err.message);
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
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
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
                    const Icon = COMPANY_ICONS[company.id] || Building2;
                    const colors = COMPANY_COLORS[company.id] || COMPANY_COLORS[1];

                    return (
                        <button
                            key={company.id}
                            onClick={() => handleSelectCompany(company)}
                            className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
                        >
                            {/* Gradient Header */}
                            <div className={`h-32 bg-gradient-to-br ${colors.bg} ${colors.hover} transition-all duration-300 flex items-center justify-center`}>
                                <Icon className="w-16 h-16 text-white opacity-90" />
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-4">
                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {company.name}
                                </h3>

                                <div className="flex items-center justify-between text-sm text-gray-600">
                                    <span className="font-medium">{company.shortName}</span>
                                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>

                            {/* Hover Effect */}
                            <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                        </button>
                    );
                })}
            </div>

            {/* Info Section */}
            <div className="max-w-6xl mx-auto mt-12 text-center">
                <div className="bg-white rounded-xl shadow-md p-6">
                    <p className="text-gray-600">
                        Select a company to access its invoicing, analytics, and financial data.
                    </p>
                </div>
            </div>
        </div>
    );
}
