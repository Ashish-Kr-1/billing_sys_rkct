import { useNavigate } from 'react-router-dom';
import { useCompany } from '../context/CompanyContext';
import { useAuth } from '../context/AuthContext';
import { BarChart3, FileText, ArrowLeft, LogOut, CreditCard } from 'lucide-react';
import { useEffect } from 'react';

export default function SectionSelection() {
    const { selectedCompany, clearCompany } = useCompany();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!selectedCompany) {
            navigate('/select-company');
        }
    }, [selectedCompany, navigate]);

    const handleSelectSection = (section) => {
        if (section === 'analytics') {
            navigate('/Analytics');
        } else if (section === 'invoice') {
            navigate('/Invoice');
        } else if (section === 'quotation') {
            navigate('/Quotation');
        } else if (section === 'ledger') {
            navigate('/Ledger');
        }
    };

    const handleBack = () => {
        clearCompany();
        navigate('/select-company');
    };

    const handleLogout = () => {
        clearCompany();
        logout();
        navigate('/login');
    };

    if (!selectedCompany) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-indigo-50 py-12 px-4">
            {/* Header */}
            <div className="max-w-5xl mx-auto mb-8">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleBack}
                            className="p-2 hover:bg-white rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6 text-gray-700" />
                        </button>
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">Choose Section</h1>
                            <p className="text-gray-600">
                                <span className="font-semibold text-blue-600">{selectedCompany.name}</span>
                                {' '} - Select what you want to manage
                            </p>
                        </div>
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

            {/* Section Cards */}
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Analytics Section */}
                <button
                    onClick={() => handleSelectSection('analytics')}
                    className="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden p-8"
                >
                    {/* Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity"></div>

                    {/* Icon */}
                    <div className="relative mb-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <BarChart3 className="w-10 h-10 text-white" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="relative text-left">
                        <h2 className="text-3xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                            Analytics
                        </h2>
                        <p className="text-gray-600 mb-4">
                            View comprehensive business insights, KPIs, revenue analytics, and financial reports for {selectedCompany.shortName}.
                        </p>

                        <div className="flex items-center gap-2 text-blue-600 font-semibold">
                            <span>View Analytics</span>
                            <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full -mr-16 -mt-16 opacity-20"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-200 rounded-full -ml-12 -mb-12 opacity-20"></div>
                </button>

                {/* Invoice Section */}
                <button
                    onClick={() => handleSelectSection('invoice')}
                    className="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden p-8"
                >
                    {/* Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-0 group-hover:opacity-10 transition-opacity"></div>

                    {/* Icon */}
                    <div className="relative mb-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <FileText className="w-10 h-10 text-white" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="relative text-left">
                        <h2 className="text-3xl font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors">
                            Invoice Management
                        </h2>
                        <p className="text-gray-600 mb-4">
                            Create, manage, and track invoices, parties, items, payments, and ledger for {selectedCompany.shortName}.
                        </p>

                        <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                            <span>Manage Invoices</span>
                            <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200 rounded-full -mr-16 -mt-16 opacity-20"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-200 rounded-full -ml-12 -mb-12 opacity-20"></div>
                </button>

                {/* Quotation Section */}
                <button
                    onClick={() => handleSelectSection('quotation')}
                    className="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden p-8"
                >
                    {/* Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 opacity-0 group-hover:opacity-10 transition-opacity"></div>

                    {/* Icon */}
                    <div className="relative mb-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <FileText className="w-10 h-10 text-white" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="relative text-left">
                        <h2 className="text-3xl font-bold text-gray-900 mb-3 group-hover:text-amber-600 transition-colors">
                            Quotation Management
                        </h2>
                        <p className="text-gray-600 mb-4">
                            Generate, edit, and print professional quotations for {selectedCompany.shortName}.
                        </p>

                        <div className="flex items-center gap-2 text-amber-600 font-semibold">
                            <span>Manage Quotations</span>
                            <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200 rounded-full -mr-16 -mt-16 opacity-20"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-200 rounded-full -ml-12 -mb-12 opacity-20"></div>
                </button>

                {/* Ledger Section */}
                <button
                    onClick={() => handleSelectSection('ledger')}
                    className="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden p-8"
                >
                    {/* Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600 opacity-0 group-hover:opacity-10 transition-opacity"></div>

                    {/* Icon */}
                    <div className="relative mb-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <CreditCard className="w-10 h-10 text-white" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="relative text-left">
                        <h2 className="text-3xl font-bold text-gray-900 mb-3 group-hover:text-violet-600 transition-colors">
                            Ledger & Payments
                        </h2>
                        <p className="text-gray-600 mb-4">
                            Track client payments, view transaction history, and manage outstanding balances.
                        </p>

                        <div className="flex items-center gap-2 text-violet-600 font-semibold">
                            <span>View Ledger</span>
                            <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-200 rounded-full -mr-16 -mt-16 opacity-20"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-200 rounded-full -ml-12 -mb-12 opacity-20"></div>
                </button>
            </div>

            {/* Info Card */}
            <div className="max-w-5xl mx-auto mt-12">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">Current Company</h3>
                            <p className="text-gray-600">
                                You're currently accessing <span className="font-semibold text-blue-600">{selectedCompany.name}</span>.
                                All data shown will be specific to this company.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
