import React, { useState, useEffect } from 'react';
import { api, handleApiResponse } from '../config/apiClient';
import { X, Edit, Trash2 } from 'lucide-react';
import { notify } from './Notification';

export default function ItemListModal({ isOpen, onClose, onEdit }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    //demo changes

    useEffect(() => {
        if (isOpen) {
            fetchItems();
        }
    }, [isOpen]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const data = await handleApiResponse(api.get('/items'));
            // Helper handles error. data is { rows: [] }
            setItems(data.rows || []);
        } catch (error) {
            notify('Failed to load items', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (itemId) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;

        try {
            await handleApiResponse(api.delete(`/items/${itemId}`));
            notify('Item deleted', 'success');
            fetchItems();
        } catch (error) {
            notify('Failed to delete item', 'error');
        }
    };

    const handleEditClick = async (itemId) => {
        try {
            const data = await handleApiResponse(api.get(`/items/${itemId}`));
            onEdit(data.item || data);
            onClose();
        } catch (error) {
            notify('Failed to fetch item details', 'error');
        }
    };

    if (!isOpen) return null;

    const filteredItems = items.filter(i =>
        i.item_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">

                {/* Header */}
                <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-teal-600 to-green-600 text-white rounded-t-xl">
                    <h2 className="text-xl font-bold">Manage Items</h2>
                    <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b bg-gray-50">
                    <input
                        type="text"
                        placeholder="Search items..."
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {loading ? (
                        <div className="text-center py-10 text-gray-500">Loading...</div>
                    ) : filteredItems.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">No items found.</div>
                    ) : (
                        filteredItems.map((item) => (
                            <div key={item.item_id} className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-md transition-shadow">
                                <span className="font-medium text-gray-700">{item.item_name}</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEditClick(item.item_id)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                        title="Edit"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.item_id)}
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
