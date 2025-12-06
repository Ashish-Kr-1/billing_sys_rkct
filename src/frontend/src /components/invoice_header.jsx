import React from 'react'
import Logo from '../assets/react.svg';

function Invoice_header() {
  return (

    <div>
    {/* ================= Invoice Header Section ================= */}
<div className="border-b pb-4 mb-6">

  {/* FIRST ROW */}
  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">

    {/* Left side: GSTIN */}
    <h2 className="text-lg sm:text-xl font-bold">
      GSTIN : 20DAMPK8203A1ZB
    </h2>

    {/* Right side: Original Copy */}
    <p className="italic text-xs sm:text-sm text-right">
      (Original Copy)
    </p>
  </div>

  {/* MAIN ROW */}
  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mt-4">

    {/* Logo */}
    <img 
      src={Logo}
      alt="Company Logo"
      className="w-28 sm:w-40 h-auto"
    />

    {/* Company Details */}
    <div className="leading-tight text-center sm:text-left">
      <h1 className="text-xl sm:text-2xl font-bold underline">
        Tax Invoice
      </h1>

      <h2 className="text-xl sm:text-2xl font-bold mt-1">
        M/S R.K Casting & Engineering Works
      </h2>

      <p className="text-xs sm:text-sm">
        Plot No. 125, Khata No.19, Rakuwa No. 05,<br />
        Mouza-Gopinathdih, Dist.: Dhanbad, Jharkhand, PIN : 828129
      </p>

      <p className="font-semibold text-xs sm:text-sm mt-1">
        Mobile No : +91 6204583192
      </p>
      <p className="font-semibold text-xs sm:text-sm">
        Email Id : rkcastingmoonidih@gmail.com
      </p>
      <p className="font-semibold text-xs sm:text-sm">
        T. License No. - SEA2135400243601
      </p>
    </div>

  </div>
</div>

</div>




  )
}

export default Invoice_header