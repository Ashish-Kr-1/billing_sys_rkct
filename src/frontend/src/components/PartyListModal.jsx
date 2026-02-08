import React, { useState, useEffect } from 'react';
import { api, handleApiResponse } from '../config/apiClient';
import { X, Edit, Trash2 } from 'lucide-react';
import { notify } from './Notification';

export default function PartyListModal({ isOpen, onClose, onEdit }) {
    const [parties, setParties] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchParties();
        }
    }, [isOpen]);

    const fetchParties = async () => {
        setLoading(true);
        try {
            // This endpoint should filter out deleted parties as per backend update
            const data = await handleApiResponse(api.get('/parties')); // Assuming this returns { party_id, party_name } or full list?
            // Wait, GET /parties returns [{party_id, party_name}]. 
            // I need full details? 
            // No, user said "name of all existing parties show up... then there is a edit button... when click edit... details filled".
            // So list only needs names. Then fetch details? Or pass ID?
            // I'll fetch full details when Edit is clicked. GET /parties returns ID and Name.
            // Wait, I need to fetch full party details on Edit.
            // I'll assume I have to fetch individual party details.
            setParties(data);
        } catch (error) {
            notify('Failed to load parties', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (partyId) => {
        if (!window.confirm('Are you sure you want to delete this party?')) return;

        try {
            await handleApiResponse(api.delete(`/parties/${partyId}`));
            notify('Party deleted', 'success');
            fetchParties();
        } catch (error) {
            notify('Failed to delete party', 'error');
        }
    };

    const handleEditClick = async (partyId) => {
        try {
            // Fetch full details
            const party = await handleApiResponse(api.get(`/parties/${partyId}`));
            onEdit(party.party || party); // Pass full party object to parent, handling nested structure
            onClose();
        } catch (error) {
            notify('Failed to fetch party details', 'error');
        }
    };

    if (!isOpen) return null;

    const filteredParties = parties.filter(p =>
        p.party_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">

                {/* Header */}
                <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl">
                    <h2 className="text-xl font-bold">Manage Parties</h2>
                    <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b bg-gray-50">
                    <input
                        type="text"
                        placeholder="Search parties..."
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {loading ? (
                        <div className="text-center py-10 text-gray-500">Loading...</div>
                    ) : filteredParties.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">No parties found.</div>
                    ) : (
                        filteredParties.map((party) => (
                            <div key={party.party_id} className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-md transition-shadow">
                                <span className="font-medium text-gray-700">{party.party_name}</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEditClick(party.party_id)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                        title="Edit"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(party.party_id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
