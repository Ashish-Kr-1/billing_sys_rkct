import React, { createContext, useState, useContext, useEffect } from 'react';

const CompanyContext = createContext();

export function CompanyProvider({ children }) {
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load selected company from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('selectedCompany');
        if (saved) {
            try {
                setSelectedCompany(JSON.parse(saved));
            } catch (error) {
                console.error('Error loading company:', error);
            }
        }
        setLoading(false);
    }, []);

    // Save to localStorage whenever company changes
    useEffect(() => {
        if (selectedCompany) {
            localStorage.setItem('selectedCompany', JSON.stringify(selectedCompany));
        } else {
            localStorage.removeItem('selectedCompany');
        }
    }, [selectedCompany]);

    const selectCompany = (company) => {
        setSelectedCompany(company);
    };

    const clearCompany = () => {
        setSelectedCompany(null);
        localStorage.removeItem('selectedCompany');
    };

    const value = {
        selectedCompany,
        selectCompany,
        clearCompany,
        loading,
        hasSelectedCompany: !!selectedCompany
    };

    return (
        <CompanyContext.Provider value={value}>
            {children}
        </CompanyContext.Provider>
    );
}

export const useCompany = () => {
    const context = useContext(CompanyContext);
    if (!context) {
        throw new Error('useCompany must be used within CompanyProvider');
    }
    return context;
};
