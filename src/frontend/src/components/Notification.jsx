import React from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Centralized notification function
export const notify = (message, type = 'info') => {
    const options = {
        position: "top-center",
        autoClose: 11000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
    };

    switch (type) {
        case 'success':
            toast.success(message, options);
            break;
        case 'error':
            toast.error(message, options);
            break;
        case 'warn':
        case 'warning':
            toast.warn(message, options);
            break;
        case 'info':
        default:
            toast.info(message, options);
    }
};

// Global container to be placed in App.jsx
export const NotificationContainer = () => {
    return (
        <ToastContainer
            position="top-center"
            autoClose={11000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
        />
    );
};
