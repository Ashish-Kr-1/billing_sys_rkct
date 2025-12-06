import React from 'react'

function invoice_header() {
  return (
    <div>
        {/* Invoice Header Section */}
<div className="border-b pb-4 mb-6">
  <div className="flex justify-between items-start">

    {/* Left side: GSTIN */}
    <h2 className="text-xl font-bold">GSTIN : 20DAMPK8203A1ZB</h2>

    {/* Right side: Original Copy */}
    <p className="italic text-sm">(Original Copy)</p>
  </div>

  {/* Logo + Company Info */}
  <div className="flex items-center gap-6 mt-4">

    {/* Logo */}
    <img 
      src="/src/assets/react.svg"
      alt="Company Logo"
      className="w-40 h-auto"
    />

    {/* Company Details */}
    <div className="leading-tight">
      <h1 className="text-2xl font-bold underline text-center">
        Tax Invoice
      </h1>

      <h2 className="text-2xl font-bold mt-1">
        M/S R.K Casting & Engineering Works
      </h2>

      <p className="text-sm">
        Plot No. 125, Khata No.19, Rakuwa No. 05,<br />
        Mouza-Gopinathdih, Dist.: Dhanbad, Jharkhand, PIN : 828129
      </p>

      <p className="font-semibold text-sm mt-1">
        Mobile No : +91 6204583192
      </p>
      <p className="font-semibold text-sm">
        Email Id : rkcastingmoonidih@gmail.com
      </p>
      <p className="font-semibold text-sm">
        T. License No. - SEA2135400243601
      </p>
    </div>

  </div>
</div>
    </div>
  )
}

export default invoice_header