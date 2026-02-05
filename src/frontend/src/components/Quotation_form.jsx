import { useState, useEffect } from "react";
import Button from './Button.jsx';
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config/api.js";
import { api, handleApiResponse } from "../config/apiClient.js";
import { useCompany } from "../context/CompanyContext.jsx";
import DefaultLogo from '../assets/logo.png';
import GlobalBharatLogo from '../assets/logo-global-bharat.png';

export default function QuotationForm({ initialData }) {
    const { selectedCompany } = useCompany();
    const navigate = useNavigate();

    const [quotation, setQuotation] = useState(
        initialData?.quotation || {
            clientName: "",
            clientName2: "",
            clientAddress2: "",
            clientAddress: "",
            GSTIN2: "",
            GSTIN: "",
            GSTIN0: "20DAMPK8203A1ZB",
            QuotationDate: "",
            QuotationNo: "",
            PODate: "",
            TrasnportBy: "",
            PlaceofSupply: "",
            PONo: "",
            VehicleNo: "",
            EwayBillNo: "",
            VendorCode: "",
            ChallanNo: "",
            ChallanDate: "",
            Terms: "",
            AccountName: "",
            CurrentACCno: "",
            IFSCcode: "",
            Branch: "",
            items: [{ description: "", HSNCode: "", quantity: '', price: "" }],
            party_id: ""
        });

    const [parties, setParties] = useState([]);
    const [itemsList, setItemsList] = useState([]);
    const [selectedPartyId, setSelectedPartyId] = useState("");
    const [companyConfig, setCompanyConfig] = useState(null);


    //`${API_BASE}/parties`
    useEffect(() => {
        handleApiResponse(api.get('/parties'))
            .then(data => setParties(data))
            .catch(err => console.error('Error fetching parties:', err));
    }, [selectedCompany]);

    useEffect(() => {
        handleApiResponse(api.get('/itemNames'))
            .then(data => setItemsList(data))
            .catch(err => console.error('Error fetching items:', err));
    }, [selectedCompany]);

    // Fetch company configuration and reset quotation state when company changes
    useEffect(() => {
        if (selectedCompany) {
            console.log('🔄 Company changed to:', selectedCompany);

            handleApiResponse(api.get(`/companies/${selectedCompany.id}/config`))
                .then(data => {
                    console.log('✅ Company config loaded:', data.config);
                    setCompanyConfig(data.config);

                    if (!initialData) {
                        // Reset party selection when company changes
                        setSelectedPartyId("");

                        // Reset and update quotation state with company-specific defaults
                        setQuotation(prev => ({
                            ...prev,
                            GSTIN0: data.config.gstin || '',
                            // Bank Details
                            AccountName: data.config.account_name || prev.AccountName,
                            CurrentACCno: data.config.account_no || prev.CurrentACCno,
                            IFSCcode: data.config.ifsc_code || prev.IFSCcode,
                            Branch: data.config.branch || prev.Branch,

                            // Clear party-related fields when changing company
                            clientName: '',
                            clientName2: '',
                            clientAddress: '',
                            clientAddress2: '',
                            GSTIN: '',
                            GSTIN2: '',
                            party_id: ''
                        }));
                    } else {
                        // Preserve existing data if returning from preview
                        setQuotation(prev => ({
                            ...prev,
                            GSTIN0: data.config.gstin || prev.GSTIN0
                        }));
                    }
                })
                .catch(err => console.error('Error fetching company config:', err));
        }
    }, [selectedCompany, initialData]);


    useEffect(() => {
        if (selectedCompany) {
            handleApiResponse(api.get('/createQuotation/quotationNo'))
                .then(data => {
                    console.log('📄 Quotation number:', data.QuotationNo);
                    setQuotation(prev => ({
                        ...prev,
                        QuotationNo: data.QuotationNo
                    }))
                })
                .catch(err => console.error('Error fetching quotation number:', err));
        }
    }, [selectedCompany]);

    // Helper function to get the correct logo based on company
    const getCompanyLogo = () => {
        // Company 3 is Global Bharat
        if (selectedCompany?.id === 3) {
            return GlobalBharatLogo;
        }
        // Check if config has logo_url with global-bharat
        if (companyConfig?.logo_url?.includes('global-bharat')) {
            return GlobalBharatLogo;
        }
        // Default logo for Company 1 and 2 (RK Casting and RK Engineering)
        return DefaultLogo;
    };


    //HANDLE Select Party from Backend
    function handlePartySelect(partyId) {
        setSelectedPartyId(partyId);

        const party = parties.find(p => p.party_id === Number(partyId));
        if (!party) return;

        // Fetch full details
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
                    GSTIN: p.gstin_no,
                    GSTIN2: p.gstin_no,
                    VendorCode: p.vendore_code || ''
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
                    HSNCode: item.hsn_code,
                    price: item.rate || 0 // if you have rate column
                };

                setQuotation(prev => ({
                    ...prev,
                    items: updatedItems
                }));
            })
            .catch(err => console.error('Error fetching item details:', err));
    }


    // HANDLE BASIC INPUTS
    function handleChange(e) {
        setQuotation({
            ...quotation,
            [e.target.name]: e.target.value,
        });
    }

    // HANDLE LINE ITEMS
    function handleItemChange(index, field, value) {
        const updatedItems = [...quotation.items];
        updatedItems[index][field] = value;
        setQuotation({ ...quotation, items: updatedItems });
    }

    // ADD ITEM
    function addItem() {
        setQuotation({
            ...quotation,
            items: [...quotation.items, { description: "", quantity: 1, price: 0 }],
        });
    }

    // REMOVE ITEM
    function removeItem(index) {
        const updatedItems = quotation.items.filter((_, i) => i !== index);
        setQuotation({ ...quotation, items: updatedItems });
    }

    // SUBTOTAL CALCULATION
    const subtotalAmount = quotation.items.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0
    );

    // TOTAL CALCULATION
    const [sgst, setSgst] = useState(initialData?.sgst || 0);
    const [cgst, setCgst] = useState(initialData?.cgst || 0);


    const totalAmount = subtotalAmount + (subtotalAmount * sgst) / 100 + (subtotalAmount * cgst) / 100;



    return (

        <div className=" flex justify-center items-center">
            <div className="max-w-6xl p-6 bg-white rounded-xl shadow-md">
                {/* Company Indicator */}
                {selectedCompany && (
                    <div className="mb-4 p-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold opacity-90">Currently Managing</p>
                                <p className="text-lg font-bold">{selectedCompany.name}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs opacity-75">Company ID: {selectedCompany.id}</p>
                                <p className="text-xs opacity-75">{selectedCompany.shortName}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div>
                    {/* ================= Quotation Header Section ================= */}
                    <div className="border-b-3 pb-4 mb-6">

                        {/* FIRST ROW */}
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">

                            {/* Left side: GSTIN */}
                            <h2 className="text-lg sm:text-xl font-bold">
                                GSTIN : <input type="text"
                                    name="GSTIN0"
                                    placeholder="GSTIN"
                                    value={quotation.GSTIN0}
                                    onChange={handleChange} />
                            </h2>
                        </div>

                        {/* MAIN ROW */}
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mt-4 ">

                            {/* Dynamic Logo based on company */}
                            <img
                                src={getCompanyLogo()}
                                alt={companyConfig?.company_name || "Company Logo"}
                                className="w-28 flex sm:w-40 h-auto"
                            />

                            {/* Company Details */}
                            <div className="leading-tight text-center sm:text-left">
                                <h1 className="text-xl text-center sm:text-left sm:text-2xl font-bold underline">
                                    Quotation
                                </h1>

                                <h2 className="text-xl sm:text-2xl font-bold mt-1">
                                    {companyConfig?.company_name}
                                </h2>

                                <p className="text-xs text-center sm:text-left sm:text-sm">
                                    {companyConfig?.company_address}
                                </p>

                                <p className="font-semibold text-xs text-center sm:text-left sm:text-sm mt-1">
                                    Mobile No : {companyConfig?.mobile_no}
                                </p>
                                <p className="font-semibold text-center sm:text-left text-xs sm:text-sm">
                                    Email Id : {companyConfig?.email}
                                </p>
                                {companyConfig?.cin_no && (
                                    <p className="font-semibold text-xs text-center sm:text-left sm:text-sm">
                                        CIN No. - {companyConfig.cin_no}
                                    </p>
                                )}
                                {!companyConfig?.cin_no && (
                                    <p className="font-semibold text-xs text-center sm:text-left sm:text-sm">
                                        T. License No. - SEA2135400243601
                                    </p>
                                )}
                            </div>

                        </div>
                    </div>

                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <input
                        type="text"
                        name="QuotationNo"
                        placeholder="Quotation Number "
                        className="border p-2 rounded w-full"
                        value={quotation.QuotationNo}
                        onChange={handleChange}
                        readOnly
                    />
                    <input
                        type="text"
                        name="TrasnportBy"
                        placeholder="Transport By"
                        className="border p-2 rounded w-full"
                        value={quotation.TrasnportBy}
                        onChange={handleChange}
                    />
                    <div className="flex flex-col border rounded p-1">
                        <label className="text-xs font-bold text-gray-500 ml-1">Quotation Date</label>
                        <input
                            type="date"
                            name="QuotationDate"
                            placeholder="Quotation Date"
                            className="w-full rounded px-1 py-1 outline-none"
                            value={quotation.QuotationDate}
                            onChange={handleChange}
                        />
                    </div>

                    <input
                        type="text"
                        name="VehicleNo"
                        placeholder="Vehicle Number"
                        className="border p-2 rounded w-full"
                        value={quotation.VehicleNo}
                        onChange={handleChange}
                    />
                    <input
                        type="text"
                        name="PlaceofSupply"
                        placeholder="Place of Supply"
                        className="border p-2 rounded w-full"
                        value={quotation.PlaceofSupply}
                        onChange={handleChange}
                    />
                    <input
                        type="text"
                        name="EwayBillNo"
                        placeholder="Eway Bill Number"
                        className="border p-2 rounded w-full"
                        value={quotation.EwayBillNo}
                        onChange={handleChange}
                    />
                    <input
                        type="text"
                        name="PONo"
                        placeholder="PO Number"
                        className="border p-2 rounded w-full"
                        value={quotation.PONo}
                        onChange={handleChange}
                    />
                    <input
                        type="text"
                        name="VendorCode"
                        placeholder="Vendor Code"
                        className="border p-2 rounded w-full"
                        value={quotation.VendorCode}
                        onChange={handleChange}
                    />
                    <div className="flex flex-col border rounded p-1">
                        <label className="text-xs font-bold text-gray-500 ml-1">PO Date</label>
                        <input
                            type="date"
                            name="PODate"
                            placeholder="PO Date"
                            className="w-full rounded px-1 py-1 outline-none"
                            value={quotation.PODate}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 sm:col-span-2 lg:col-span-1 border rounded p-1">
                        <input
                            type="text"
                            name="ChallanNo"
                            placeholder="Challan Number"
                            className="flex-1 w-full outline-none p-1"
                            value={quotation.ChallanNo}
                            onChange={handleChange}
                        />
                        <div className="w-px bg-gray-300 hidden sm:block"></div>
                        <input
                            type="date"
                            name="ChallanDate"
                            placeholder="Challan Date"
                            className="flex-1 w-full outline-none p-1"
                            value={quotation.ChallanDate}
                            onChange={handleChange}
                        />
                    </div>

                </div>
                <h1 className="text-2xl mb-3 font-bold ">Bill To Party</h1>
                {/* BASIC INFO */}
                <div className="mb-4">
                    <label className="font-bold block mb-1">Select Party</label>
                    <select
                        value={selectedPartyId}
                        onChange={(e) => handlePartySelect(e.target.value)}
                        className="border p-2 rounded w-full"
                    >
                        <option value="">-- Select Party --</option>
                        {parties.map(party => (
                            <option key={party.party_id} value={party.party_id}>
                                {party.party_name}
                            </option>
                        ))}

                    </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <input
                        name="clientName"
                        placeholder="Client Name"
                        className="border p-2 rounded w-full"
                        value={quotation.clientName}
                        onChange={handleChange}
                    />
                    <input
                        type="text"
                        name="GSTIN"
                        placeholder="GSTIN Number"
                        className="border p-2 rounded w-full"
                        value={quotation.GSTIN}
                        onChange={handleChange}
                    />
                </div>
                <input
                    name="clientAddress"
                    placeholder="Client Address"
                    className="border p-2 rounded w-full"
                    value={quotation.clientAddress}
                    onChange={handleChange}
                />
                <h1 className="text-2xl mt-3 mb-3 font-bold ">Ship To Party</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <input
                        type="text"
                        name="clientName2"
                        placeholder="Client Name"
                        className="border p-2 rounded w-full"
                        value={quotation.clientName2}
                        onChange={handleChange}
                    />
                    <input
                        type="text"
                        name="GSTIN2"
                        placeholder="GSTIN Number"
                        className="border p-2 rounded w-full"
                        value={quotation.GSTIN2}
                        onChange={handleChange}
                    />
                </div>
                <input
                    name="clientAddress2"
                    placeholder="Client Address"
                    className="border p-2 rounded w-full"
                    value={quotation.clientAddress2}
                    onChange={handleChange}
                />


                {/* ITEMS SECTION */}
                <h2 className="text-2xl mt-2 font-semibold mb-2">Items</h2>

                {quotation.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-2 sm:grid-cols-12 gap-3 mb-4 p-3 border rounded-lg sm:border-none sm:p-0 bg-gray-50 sm:bg-transparent">
                        <div className="col-span-2 sm:col-span-4">
                            <label className="block text-xs text-gray-500 sm:hidden mb-1">Item Name</label>
                            <select
                                className="border p-2 rounded w-full"
                                value={item.item_id || ""}
                                onChange={(e) => handleItemSelect(index, e.target.value)}
                            >
                                <option value="">-- Select Item --</option>
                                {itemsList.map(it => (
                                    <option key={it.item_id} value={it.item_id}>
                                        {it.item_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-xs text-gray-500 sm:hidden mb-1">HSN</label>
                            <input
                                placeholder="HSN Code"
                                className="border p-2 rounded w-full"
                                value={item.HSNCode}
                                onChange={(e) =>
                                    handleItemChange(index, "HSNCode", e.target.value)
                                }
                            />
                        </div>

                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-xs text-gray-500 sm:hidden mb-1">Quantity</label>
                            <input
                                type="number"
                                className="border p-2 rounded w-full"
                                placeholder="Qty"
                                value={item.quantity}
                                min={1}
                                onChange={(e) =>
                                    handleItemChange(index, "quantity", Number(e.target.value))
                                }
                            />
                        </div>

                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-xs text-gray-500 sm:hidden mb-1">Price</label>
                            <input
                                type="number"
                                className="border p-2 rounded w-full"
                                placeholder="Price"
                                value={item.price}
                                min={0}
                                onChange={(e) =>
                                    handleItemChange(index, "price", Number(e.target.value))
                                }
                            />
                        </div>

                        <div className="col-span-1 sm:col-span-2 flex items-end">
                            <Button color="red" text='Remove' onClick={() => removeItem(index)} className="w-full sm:w-auto h-[42px]" />
                        </div>
                    </div>
                ))}

                <button
                    onClick={addItem}
                    className="bg-blue-500  text-white font-['Rubik'] px-4 py-2 rounded hover:bg-blue-700 shadow-lg shadow-cyan-500/50"
                >
                    + Add Item
                </button>

                {/* TOTAL */}
                <div className="mt-3">
                    <div className="flex justify-end items-center ">
                        <h2 className="font-bold mr-3.5"> SGST</h2>
                        <input type="number"
                            name="sgst"
                            min={0}
                            onChange={(e) => setSgst(e.target.value)}
                            placeholder="SGST %"
                            className="border p-1 rounded w-24" />
                    </div>
                    <div className="flex justify-end items-center ">
                        <h2 className="font-bold mr-3.5"> CGST</h2>
                        <input type="number"
                            name="cgst"
                            placeholder="CGST %"
                            min={0}
                            onChange={(e) => setCgst(e.target.value)}
                            className="border p-1 rounded w-24" />
                    </div>
                    <div className="flex justify-end mt-6 items-center">
                        <h1 className="text-xl font-bold  mr-3.5">Subtotal</h1>
                        <p className="text-xl font-bold">₹ {subtotalAmount}</p>
                    </div>
                </div>

                <div className=" mt-2 flex justify-end items-center">
                    <h2 className="text-xl font-bold mr-3.5">Total Amount</h2>
                    <p className="text-xl font-bold">₹ {totalAmount.toFixed(2)}</p>
                </div>
                <div className='border-t mt-1.5'>
                    <h1 className="text-center sm:text-lg font-bold mb-2 underline">
                        BANK DETAILS
                    </h1>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className='flex flex-col sm:grid sm:grid-cols-2 items-center gap-2'>
                            <h2 className="sm:text-lg font-bold text-center sm:text-left">Account Name</h2>
                            <input
                                type="text"
                                name="AccountName"
                                placeholder="Account Name "
                                className="border p-2 rounded w-full"
                                value={quotation.AccountName}
                                onChange={handleChange}
                            />
                        </div>
                        <div className='flex flex-col sm:grid sm:grid-cols-2 items-center gap-2'>
                            <h2 className="text-base sm:text-lg font-bold text-center sm:text-left">Current Account No.</h2>
                            <input
                                type="text"
                                name="CurrentACCno"
                                placeholder="Current Account no "
                                className="border p-2 rounded w-full"
                                value={quotation.CurrentACCno}
                                onChange={handleChange}
                            />
                        </div>
                        <div className='flex flex-col sm:grid sm:grid-cols-2 items-center gap-2'>
                            <h2 className="text-base sm:text-lg font-bold text-center sm:text-left">IFSC CODE </h2>
                            <input
                                type="text"
                                name="IFSCcode"
                                placeholder="IFSC code "
                                className="border p-2 rounded w-full"
                                value={quotation.IFSCcode}
                                onChange={handleChange}
                            />
                        </div>
                        <div className='flex flex-col sm:grid sm:grid-cols-2 items-center gap-2'>
                            <h2 className="text-base sm:text-lg font-bold text-center sm:text-left">Branch</h2>
                            <input
                                type="text"
                                name="Branch"
                                placeholder="Branch"
                                className="border p-2 rounded w-full"
                                value={quotation.Branch}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>
                <div className="mt-4 border rounded-md p-3">
                    <h2 className="font-semibold mb-2">
                        Terms &amp; Conditions
                    </h2>
                    <textarea
                        name="Terms"
                        rows={4}
                        className="w-full border rounded-md p-2 text-sm resize-y"
                        placeholder="Enter terms and conditions here..."
                        value={quotation.Terms}
                        onChange={handleChange}
                    />
                </div>

                <div className=" max-w-3xl mx-auto mt-8 p-6 bg-white rounded-xl shadow-md">
                    <button className="w-full md:w-64 block mx-auto rounded-md font-bold cursor-progress py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 transition-colors" onClick={() => navigate("/QuotationPreview", { state: { quotation, subtotalAmount, totalAmount, sgst, cgst, } })}> Preview </button>
                </div>
            </div>
        </div>
    );
}
