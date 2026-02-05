
import { useState, useEffect } from "react";
import Button from './Button.jsx';
import { useNavigate } from "react-router-dom"; // Add useNavigate
import { api, handleApiResponse } from "../config/apiClient.js";
import { useCompany } from "../context/CompanyContext.jsx";
import DefaultLogo from '../assets/logo.png';
import GlobalBharatLogo from '../assets/logo-global-bharat.png';

export default function QuotationForm({ initialData, onSuccess, onCancel }) {
    const { selectedCompany } = useCompany();
    const navigate = useNavigate(); // Hook for navigation

    const [quotation, setQuotation] = useState(
        initialData || {
            clientName: "",
            clientAddress: "",
            gstin: "",
            clientName2: "",
            clientAddress2: "",
            gstin2: "",
            terms: "",
            items: [{ description: "", hsn_code: "", quantity: '', price: "" }],
            party_id: ""
        });

    const [parties, setParties] = useState([]);
    const [itemsList, setItemsList] = useState([]);
    const [selectedPartyId, setSelectedPartyId] = useState("");
    const [companyConfig, setCompanyConfig] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        handleApiResponse(api.get('/parties'))
            .then(data => setParties(data))
            .catch(err => console.error('Error fetching parties:', err));

        handleApiResponse(api.get('/itemNames'))
            .then(data => setItemsList(data))
            .catch(err => console.error('Error fetching items:', err));
    }, [selectedCompany]);

    useEffect(() => {
        if (selectedCompany) {
            handleApiResponse(api.get(`/companies/${selectedCompany.id}/config`))
                .then(data => {
                    setCompanyConfig(data.config);
                    setQuotation(prev => ({
                        ...prev,
                        // Reset relevant fields
                    }));
                })
                .catch(err => console.error('Error fetching company config:', err));
        }
    }, [selectedCompany]);

    const getCompanyLogo = () => {
        if (selectedCompany?.id === 3) return GlobalBharatLogo;
        if (companyConfig?.logo_url?.includes('global-bharat')) return GlobalBharatLogo;
        return DefaultLogo;
    };

    function handlePartySelect(partyId) {
        setSelectedPartyId(partyId);
        const party = parties.find(p => p.party_id === Number(partyId));
        if (!party) return;

        handleApiResponse(api.get(`/parties/${partyId}`))
            .then(data => {
                const p = data.party;
                setQuotation(prev => ({
                    ...prev,
                    party_id: partyId,
                    clientName: p.party_name,
                    clientName2: p.party_name,
                    clientAddress: p.billing_address,
                    clientAddress2: p.shipping_address,
                    gstin: p.gstin_no,
                    gstin2: p.gstin_no,
                }));
            })
            .catch(err => console.error('Error fetching party details:', err));
    }

    function handleItemSelect(index, itemId) {
        handleApiResponse(api.get(`/item_id/${itemId}`))
            .then(data => {
                const item = data.item;
                if (!item) return;
                const updatedItems = [...quotation.items];
                updatedItems[index] = {
                    ...updatedItems[index],
                    item_id: item.item_id,
                    description: item.item_name,
                    hsn_code: item.hsn_code,
                    price: item.rate || 0
                };
                setQuotation(prev => ({ ...prev, items: updatedItems }));
            })
            .catch(err => console.error('Error fetching item details:', err));
    }

    function handleChange(e) {
        setQuotation({ ...quotation, [e.target.name]: e.target.value });
    }

    function handleItemChange(index, field, value) {
        const updatedItems = [...quotation.items];
        updatedItems[index][field] = value;
        setQuotation({ ...quotation, items: updatedItems });
    }

    function addItem() {
        setQuotation({
            ...quotation,
            items: [...quotation.items, { description: "", quantity: 1, price: 0 }],
        });
    }

    function removeItem(index) {
        const updatedItems = quotation.items.filter((_, i) => i !== index);
        setQuotation({ ...quotation, items: updatedItems });
    }

    const subtotalAmount = quotation.items.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0),
        0
    );

    const [sgst, setSgst] = useState(0);
    const [cgst, setCgst] = useState(0);
    const totalAmount = subtotalAmount + (subtotalAmount * sgst) / 100 + (subtotalAmount * cgst) / 100;

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const payload = {
                ...quotation,
                subtotal: subtotalAmount,
                sgst,
                cgst,
                total_amount: totalAmount
            };
            await handleApiResponse(api.post('/quotations', payload));
            alert('Quotation Created Successfully!');
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Error creating quotation:", error);
            alert('Failed to create quotation');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center">
            <div className="max-w-6xl w-full p-6 bg-white rounded-xl shadow-md">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">New Quotation</h1>
                    <Button onClick={onCancel} text="Cancel" color="red" />
                </div>

                {/* Header */}
                <div className="border-b-3 pb-4 mb-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mt-4">
                        <img src={getCompanyLogo()} alt="Logo" className="w-28 flex sm:w-40 h-auto" />
                        <div>
                            <h2 className="text-xl font-bold">{companyConfig?.company_name}</h2>
                            <p className="text-sm">{companyConfig?.company_address}</p>
                            <p className="text-sm">Mobile: {companyConfig?.mobile_no}</p>
                            <p className="text-sm">Email: {companyConfig?.email}</p>
                        </div>
                    </div>
                </div>

                {/* Inputs */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block font-bold mb-1">Select Party</label>
                        <select
                            className="border p-2 rounded w-full"
                            onChange={(e) => handlePartySelect(e.target.value)}
                            value={selectedPartyId}
                        >
                            <option value="">-- Select Party --</option>
                            {parties.map(p => (
                                <option key={p.party_id} value={p.party_id}>{p.party_name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block font-bold mb-1">Quotation No</label>
                        <input disabled value="Auto-generated" className="border p-2 rounded w-full bg-gray-100" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <input name="clientName" placeholder="Client Name" className="border p-2 rounded" value={quotation.clientName} onChange={handleChange} />
                    <input name="gstin" placeholder="GSTIN" className="border p-2 rounded" value={quotation.gstin} onChange={handleChange} />
                </div>
                <input name="clientAddress" placeholder="Billing Address" className="border p-2 rounded w-full mb-6" value={quotation.clientAddress} onChange={handleChange} />

                {/* Items */}
                <h2 className="text-xl font-bold mb-2">Items</h2>
                {quotation.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-5 gap-4 mb-3">
                        <select className="border p-2 rounded" value={item.item_id || ""} onChange={(e) => handleItemSelect(index, e.target.value)}>
                            <option value="">-- Select Item --</option>
                            {itemsList.map(it => <option key={it.item_id} value={it.item_id}>{it.item_name}</option>)}
                        </select>
                        <input placeholder="HSN" className="border p-2 rounded" value={item.hsn_code} onChange={(e) => handleItemChange(index, "hsn_code", e.target.value)} />
                        <input type="number" placeholder="Qty" className="border p-2 rounded" value={item.quantity} onChange={(e) => handleItemChange(index, "quantity", e.target.value)} />
                        <input type="number" placeholder="Price" className="border p-2 rounded" value={item.price} onChange={(e) => handleItemChange(index, "price", e.target.value)} />
                        <Button color="red" text="Remove" onClick={() => removeItem(index)} />
                    </div>
                ))}
                <Button onClick={addItem} text="+ Add Item" className="mb-6 bg-blue-500 text-white" />

                {/* Totals */}
                <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                        <span className="font-bold">SGST %</span>
                        <input type="number" className="border p-1 rounded w-20" value={sgst} onChange={(e) => setSgst(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold">CGST %</span>
                        <input type="number" className="border p-1 rounded w-20" value={cgst} onChange={(e) => setCgst(e.target.value)} />
                    </div>
                    <div className="text-xl font-bold">Total: ₹ {totalAmount.toFixed(2)}</div>
                </div>

                {/* Terms */}
                <div className="mt-4">
                    <label className="font-bold">Terms & Conditions</label>
                    <textarea name="terms" rows={3} className="border p-2 w-full rounded" value={quotation.terms} onChange={handleChange}></textarea>
                </div>

                <div className="mt-8 flex justify-center gap-4">
                    <button disabled={loading} onClick={handleSubmit} className="px-6 py-2 bg-emerald-600 text-white font-bold rounded hover:bg-emerald-700">
                        {loading ? "Saving..." : "Save Quotation"}
                    </button>
                    {/* 
                Navigate to Preview by passing state info
             */}
                    <button disabled={loading} onClick={() => navigate("/Preview", { state: { invoice: { ...quotation, InvoiceNo: "DRAFT" }, subtotalAmount, totalAmount, sgst, cgst } })} className="px-6 py-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-600">
                        Preview
                    </button>
                </div>

            </div>
        </div>
    );
}
