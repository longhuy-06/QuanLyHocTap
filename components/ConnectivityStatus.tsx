
import React, { useState, useEffect } from 'react';
import { useDataStore } from '../lib/store/dataStore';

export const ConnectivityStatus: React.FC = () => {
    const { isOnline, setOnlineStatus, lastSynced } = useDataStore();
    const [isVisible, setIsVisible] = useState(false);
    const [showSyncSuccess, setShowSyncSuccess] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setOnlineStatus(true);
            setIsVisible(true);
            setShowSyncSuccess(true);
            setTimeout(() => {
                setIsVisible(false);
                setShowSyncSuccess(false);
            }, 3000);
        };

        const handleOffline = () => {
            setOnlineStatus(false);
            setIsVisible(true);
            setShowSyncSuccess(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        if (!navigator.onLine) {
            setIsVisible(true);
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [setOnlineStatus]);

    if (!isVisible && isOnline) return null;

    return (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 transform ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0'}`}>
            <div className={`px-4 py-2 rounded-full shadow-lg flex items-center gap-2 backdrop-blur-md border ${isOnline ? 'bg-emerald-500/90 text-white border-emerald-400' : 'bg-amber-500/90 text-white border-amber-400'}`}>
                <span className="material-symbols-outlined text-[18px]">
                    {isOnline ? 'cloud_done' : 'cloud_off'}
                </span>
                <span className="text-xs font-black uppercase tracking-widest">
                    {isOnline ? (showSyncSuccess ? 'Đã đồng bộ hóa' : 'Trực tuyến') : 'Đang ngoại tuyến'}
                </span>
                {!isOnline && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                )}
            </div>
        </div>
    );
};
