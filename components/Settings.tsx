
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store/authStore';
import { useDataStore } from '../lib/store/dataStore';
import { Subject } from '../types';

export const Settings: React.FC = () => {
  const { user, logout, updateProfile } = useAuthStore();
  const { subjects, notificationSettings, toggleNotification, updateNotificationTime, deleteSubject } = useDataStore();
  const navigate = useNavigate();
  
  // States
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
        updateProfile({ avatarUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    updateProfile({ name: editName, status: editStatus });
    setIsEditingProfile(false);
  };

  const getSubjectIcon = (subject: Subject) => {
      const id = subject.id.toLowerCase();
      if (id.includes('math')) return 'functions';
      if (id.includes('lit')) return 'menu_book';
      if (id.includes('eng')) return 'language';
      if (id.includes('phy')) return 'science';
      if (id.includes('chem')) return 'biotech';
      if (id.includes('bio')) return 'psychology';
      if (id.includes('code')) return 'terminal';
      if (id.includes('his')) return 'history_edu';
      if (id.includes('geo')) return 'public';
      return 'book';
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-lg mx-auto bg-background-light dark:bg-background-dark min-h-screen">
       {/* Hidden File Input */}
       <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange} 
       />

       <div className="sticky top-0 z-30 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 px-2 py-3 flex items-center justify-between mb-6">
          <button className="p-2" onClick={() => navigate(-1)}><span className="material-symbols-outlined">arrow_back_ios_new</span></button>
          <h1 className="text-lg font-bold">Cài đặt</h1>
          <button className="text-primary font-medium text-sm" onClick={() => navigate(-1)}>Xong</button>
       </div>

       <div className="space-y-6">
          {/* Profile Card */}
          <div 
            onClick={() => {
                setEditName(user?.name || '');
                setEditStatus(user?.status || 'Sinh viên');
                setIsEditingProfile(true);
            }}
            className="bg-surface-light dark:bg-surface-dark rounded-3xl p-5 shadow-soft flex items-center gap-4 relative overflow-hidden group cursor-pointer border border-transparent hover:border-primary/20 transition-all"
          >
             <div 
                onClick={handleAvatarClick}
                className="w-20 h-20 rounded-2xl bg-cover bg-center shadow-md border-2 border-white dark:border-gray-700 relative overflow-hidden group/avatar shrink-0" 
                style={{backgroundImage: `url('${user?.avatarUrl || "https://picsum.photos/200"}')`}}
             >
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-white text-[20px]">photo_camera</span>
                </div>
             </div>
             <div className="flex flex-col justify-center flex-1 min-w-0">
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white truncate">{user?.name || "Khách"}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate mb-1">{user?.email || "Chưa đăng nhập"}</p>
                <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                        {user?.status || "Sinh viên"}
                    </span>
                    {user?.isPremium && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                           Premium
                        </span>
                    )}
                </div>
             </div>
             <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-300 group-hover:text-primary transition-colors">
                <span className="material-symbols-outlined">edit</span>
             </div>
          </div>

          {/* Subjects */}
          <div className="space-y-3">
             <h3 className="px-2 text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em]">Quản lý môn học</h3>
             <div className="bg-surface-light dark:bg-surface-dark rounded-3xl shadow-soft divide-y divide-gray-50 dark:divide-gray-800/50 overflow-hidden border border-gray-100 dark:border-gray-800">
                {subjects.length > 0 ? (
                    subjects.map(subject => (
                        <SubjectRow 
                            key={subject.id}
                            icon={getSubjectIcon(subject)}
                            hexColor={subject.color}
                            title={subject.name}
                            sub={`ID: ${subject.id}`}
                            onDelete={() => setDeletingSubject(subject)}
                        />
                    ))
                ) : (
                    <div className="p-4 text-center text-sm text-gray-400">Chưa có môn học nào</div>
                )}
                
                <button 
                    onClick={() => navigate('/kanban')}
                    className="w-full p-4 flex items-center justify-center gap-2 text-primary font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                   <span className="material-symbols-outlined text-[20px]">add_circle</span> Thêm / Chỉnh sửa môn
                </button>
             </div>
          </div>

          {/* Notifications */}
          <div className="space-y-3">
             <h3 className="px-2 text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em]">Thông báo</h3>
             <div className="bg-surface-light dark:bg-surface-dark rounded-3xl shadow-soft divide-y divide-gray-50 dark:divide-gray-800/50 overflow-hidden border border-gray-100 dark:border-gray-800">
                <ToggleRow 
                    icon="notifications_active" 
                    iconBg="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                    title="Nhắc nhở hằng ngày" 
                    sub="Bật để nhận nhắc nhở làm bài tập"
                    checked={notificationSettings.dailyReminder} 
                    onChange={() => toggleNotification('dailyReminder')}
                    timeValue={notificationSettings.dailyReminderTime}
                    onTimeChange={(time) => updateNotificationTime('dailyReminderTime', time)}
                />
                <ToggleRow 
                    icon="mark_email_unread" 
                    iconBg="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    title="Email tóm tắt tiến độ" 
                    sub="Báo cáo học tập gửi về mail"
                    checked={notificationSettings.emailSummary} 
                    onChange={() => toggleNotification('emailSummary')}
                    timeValue={notificationSettings.emailSummaryTime}
                    onTimeChange={(time) => updateNotificationTime('emailSummaryTime', time)}
                />
             </div>
          </div>

          {/* Hỗ trợ & Liên hệ */}
          <div className="space-y-3">
             <h3 className="px-2 text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em]">Hỗ trợ & Liên hệ</h3>
             <div className="bg-surface-light dark:bg-surface-dark rounded-3xl shadow-soft overflow-hidden border border-gray-100 dark:border-gray-800">
                <a 
                    href="mailto:longlaai825@gmail.com" 
                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                            <span className="material-symbols-outlined text-[20px]">mail</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">Gửi phản hồi</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">longlaai825@gmail.com</span>
                        </div>
                    </div>
                    <span className="material-symbols-outlined text-gray-300">open_in_new</span>
                </a>
             </div>
          </div>

          {/* Logout Button */}
          <div className="pt-4">
            <button 
              onClick={handleLogout}
              className="w-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              Đăng xuất tài khoản
            </button>
            <p className="text-center text-[10px] font-bold text-gray-400 mt-4 uppercase tracking-[0.2em]">Học Tập 1.0.0</p>
          </div>
       </div>

       {/* Edit Profile Modal */}
       {isEditingProfile && (
            <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in-up px-0 sm:px-4">
                <div 
                    className="bg-white dark:bg-[#1f2937] w-full sm:max-w-md p-6 rounded-t-[32px] sm:rounded-[32px] shadow-2xl space-y-6"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Chỉnh sửa hồ sơ</h3>
                        <button onClick={() => setIsEditingProfile(false)} className="p-2 text-gray-400"><span className="material-symbols-outlined">close</span></button>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Họ và tên</label>
                            <input 
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                                placeholder="Nhập tên của bạn..."
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Chức danh / Lớp</label>
                            <select 
                                value={editStatus}
                                onChange={(e) => setEditStatus(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                            >
                                <option value="Sinh viên">Sinh viên</option>
                                <option value="Học sinh lớp 12">Học sinh lớp 12</option>
                                <option value="Học sinh lớp 11">Học sinh lớp 11</option>
                                <option value="Học sinh lớp 10">Học sinh lớp 10</option>
                                <option value="Học sinh THCS">Học sinh THCS</option>
                                <option value="Khác">Khác</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button 
                            onClick={() => setIsEditingProfile(false)}
                            className="flex-1 py-4 rounded-2xl font-bold text-gray-500 bg-gray-100 dark:bg-gray-800"
                        >
                            Hủy
                        </button>
                        <button 
                            onClick={handleSaveProfile}
                            className="flex-1 py-4 rounded-2xl font-bold text-white bg-primary shadow-lg shadow-primary/30"
                        >
                            Lưu thay đổi
                        </button>
                    </div>
                </div>
            </div>
       )}

       {/* Confirm Delete Modal (Subject) */}
       {deletingSubject && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in-up px-4">
                <div 
                    className="bg-white dark:bg-surface-dark w-full max-w-sm p-6 rounded-[32px] shadow-2xl space-y-4"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-500 mb-1">
                            <span className="material-symbols-outlined text-[32px]">delete_forever</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Xóa môn {deletingSubject.name}?</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Hành động này sẽ xóa môn học <span className="font-bold text-gray-800 dark:text-gray-200">{deletingSubject.name}</span> và tất cả nhiệm vụ liên quan.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                        <button onClick={() => setDeletingSubject(null)} className="w-full py-3 rounded-xl font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800">Hủy</button>
                        <button onClick={handleConfirmDelete} className="w-full py-3 rounded-xl font-bold text-white bg-red-500 shadow-lg shadow-red-500/30">Xóa</button>
                    </div>
                </div>
            </div>
       )}
    </div>
  );
};

// Sub-components

const SubjectRow: React.FC<{ icon: string; hexColor: string; title: string; sub: string; onDelete: () => void }> = ({ icon, hexColor, title, sub, onDelete }) => (
  <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 group transition-colors">
     <div className="flex items-center gap-4">
        <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm text-white"
            style={{ backgroundColor: hexColor }}
        >
            <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{title}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{sub}</p>
        </div>
     </div>
     <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
        <span className="material-symbols-outlined">delete</span>
     </button>
  </div>
);

const ToggleRow: React.FC<{ icon: string; iconBg: string; title: string; sub?: string; checked: boolean; onChange: () => void; timeValue?: string; onTimeChange?: (time: string) => void }> = ({ icon, iconBg, title, sub, checked, onChange, timeValue, onTimeChange }) => (
  <div className="flex flex-col p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
     <div className="flex items-center justify-between cursor-pointer" onClick={onChange}>
        <div className="flex items-center gap-3">
           <div className={`p-2.5 rounded-xl ${iconBg}`}>
               <span className="material-symbols-outlined text-[20px]">{icon}</span>
           </div>
           <div className="flex flex-col">
               <span className="text-sm font-bold text-gray-900 dark:text-white">{title}</span>
               {sub && <span className="text-xs text-gray-500 dark:text-gray-400">{sub}</span>}
           </div>
        </div>
        <div className={`w-11 h-6 rounded-full relative transition-colors duration-300 ease-in-out ${checked ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}>
           <div className={`absolute top-[2px] left-[2px] bg-white w-5 h-5 rounded-full shadow-sm transition-transform duration-300 ease-in-out ${checked ? 'translate-x-full' : ''}`}></div>
        </div>
     </div>
     
     {checked && onTimeChange && (
         <div className="mt-4 pl-12 animate-fade-in-up">
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Thời gian:</span>
                <input 
                    type="time" 
                    value={timeValue}
                    onChange={(e) => onTimeChange(e.target.value)}
                    className="bg-transparent border-none p-0 text-sm font-black text-primary focus:ring-0 cursor-pointer"
                />
                <span className="material-symbols-outlined text-sm text-gray-300 ml-auto">schedule</span>
            </div>
         </div>
     )}
  </div>
);
