
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store/authStore';
import { useDataStore } from '../lib/store/dataStore';
import { Subject } from '../types';

export const Settings: React.FC = () => {
  const { user, logout, updateProfile } = useAuthStore();
  const { subjects, notificationSettings, toggleNotification, updateNotificationTime, deleteSubject } = useDataStore();
  const navigate = useNavigate();
  
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editStatus, setEditStatus] = useState(user?.status || 'Sinh viên');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleConfirmDelete = () => {
    if (deletingSubject) {
        deleteSubject(deletingSubject.id);
        setDeletingSubject(null);
    }
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProfile({ avatar_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    updateProfile({ name: editName, status: editStatus });
    setIsEditingProfile(false);
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-lg mx-auto bg-background-light dark:bg-background-dark min-h-screen">
       <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

       <div className="sticky top-0 z-30 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-xl border-b px-2 py-3 flex items-center justify-between mb-6">
          <button className="p-2" onClick={() => navigate(-1)}><span className="material-symbols-outlined">arrow_back_ios_new</span></button>
          <h1 className="text-lg font-bold">Cài đặt</h1>
          <button className="text-primary font-medium text-sm" onClick={() => navigate(-1)}>Xong</button>
       </div>

       <div className="space-y-6">
          <div onClick={() => { setEditName(user?.name || ''); setEditStatus(user?.status || 'Sinh viên'); setIsEditingProfile(true); }} className="bg-surface-light dark:bg-surface-dark rounded-3xl p-5 shadow-soft flex items-center gap-4 group cursor-pointer">
             <div onClick={handleAvatarClick} className="w-20 h-20 rounded-2xl bg-cover bg-center shadow-md relative overflow-hidden shrink-0" style={{backgroundImage: `url('${user?.avatar_url || "https://picsum.photos/200"}')`}}>
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-white text-[20px]">photo_camera</span>
                </div>
             </div>
             <div className="flex flex-col justify-center flex-1 min-w-0">
                <h2 className="text-xl font-extrabold truncate">{user?.name || "Khách"}</h2>
                <p className="text-sm text-gray-500 truncate mb-1">{user?.email || "Chưa đăng nhập"}</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary w-fit">{user?.status || "Sinh viên"}</span>
             </div>
             <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-300 group-hover:text-primary transition-colors">
                <span className="material-symbols-outlined">edit</span>
             </div>
          </div>

          <div className="space-y-3">
             <h3 className="px-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Quản lý môn học</h3>
             <div className="bg-surface-light dark:bg-surface-dark rounded-3xl shadow-soft overflow-hidden">
                {subjects.map(subject => (
                    <div key={subject.id} className="flex items-center justify-between p-4 border-b border-gray-50 dark:border-gray-800 last:border-0">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: subject.color }}>
                                <span className="material-symbols-outlined">book</span>
                            </div>
                            <span className="font-bold">{subject.name}</span>
                        </div>
                        <button onClick={() => setDeletingSubject(subject)} className="p-2 text-gray-300 hover:text-red-500"><span className="material-symbols-outlined">delete</span></button>
                    </div>
                ))}
             </div>
          </div>

          <button onClick={handleLogout} className="w-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-600 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[20px]">logout</span> Đăng xuất
          </button>
       </div>

       {isEditingProfile && (
            <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in-up">
                <div className="bg-white dark:bg-[#1f2937] w-full max-w-md p-6 rounded-[32px] space-y-6">
                    <h3 className="text-xl font-bold">Chỉnh sửa hồ sơ</h3>
                    <div className="space-y-4">
                        <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4" placeholder="Tên..." />
                        <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4">
                            <option value="Sinh viên">Sinh viên</option>
                            <option value="Học sinh lớp 12">Học sinh lớp 12</option>
                            <option value="Khác">Khác</option>
                        </select>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setIsEditingProfile(false)} className="flex-1 py-4 rounded-2xl font-bold bg-gray-100 dark:bg-gray-800">Hủy</button>
                        <button onClick={handleSaveProfile} className="flex-1 py-4 rounded-2xl font-bold text-white bg-primary">Lưu</button>
                    </div>
                </div>
            </div>
       )}
    </div>
  );
};
