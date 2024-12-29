"use client"

import { toast } from 'react-toastify';

interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'loading' | 'promise';
    position: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
    duration?: number;
    promise?: Promise<any>;
    promiseData?: { loading: any; success: any; error: any; };
}

export const showToast = ({ message, type, position, duration = 4000, promise, promiseData }: ToastProps) => {
    const event = new CustomEvent('show-toast', { detail: { message, type, position, duration, promise, promiseData } });
    window.dispatchEvent(event);
};

window.addEventListener('show-toast', (event) => {
    const customEvent = event as CustomEvent;
    const { message, type, position, duration, promise, promiseData } = customEvent.detail;
    switch (type) {
        case 'success':
            toast.success(message, { position, autoClose: duration });
            break;
        case 'error':
            toast.error(message, { position, autoClose: duration });
            break;
        case 'loading':
            toast.loading(message, { position, autoClose: duration });
            break;
        case 'promise':
            if (promise && promiseData) {
                toast.promise(promise, promiseData);
            } else {
                throw new Error('promise and promiseData are required for promise type');
            }
            break;
        default:
            toast(message, { position, autoClose: duration });
            break;
    }
});