
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 glass-nav pb-safe">
      <div className="flex items-center justify-around px-1 py-3 max-w-lg mx-auto">
        <NavButton 
          icon="home" 
          label="Trang chủ" 
          active={isActive('/dashboard')} 
          onClick={() => navigate('/dashboard')} 
        />
        <NavButton 
          icon="task_alt" 
          label="Nhiệm vụ" 
          active={isActive('/kanban')} 
          onClick={() => navigate('/kanban')} 
        />
        
        {/* Floating AI Button */}
        <button 
          onClick={() => navigate('/ai-tutor')}
          className="flex flex-col items-center justify-center -mt-10"
        >
          <div className={`
            bg-gradient-to-tr from-primary to-indigo-500 text-white rounded-[22px] h-16 w-16 flex items-center justify-center shadow-xl shadow-primary/30 transition-all relative
            ${isActive('/ai-tutor') ? 'scale-110 ring-4 ring-primary/20' : 'hover:scale-110 active:scale-95'}
          `}>
            <span className="material-symbols-outlined text-[32px] font-bold">menu_book</span>
            <div className="absolute top-2 right-2">
                <span className="material-symbols-outlined text-[14px] font-bold">auto_awesome</span>
            </div>
          </div>
          <span className={`text-[10px] font-black mt-1 uppercase tracking-tighter ${isActive('/ai-tutor') ? 'text-primary' : 'text-gray-400'}`}>Huy Long</span>
        </button>

        <NavButton 
          icon="calendar_today" 
          label="Lịch học" 
          active={isActive('/calendar')} 
          onClick={() => navigate('/calendar')} 
        />
        
        <NavButton 
          icon="folder" 
          label="Tài liệu" 
          active={isActive('/documents')} 
          onClick={() => navigate('/documents')} 
        />
      </div>
    </nav>
  );
};

const NavButton: React.FC<{ icon: string; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all gap-1 group min-w-[60px] ${active ? 'text-primary' : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
  >
    <span className={`material-symbols-outlined text-[26px] transition-transform ${active ? 'fill-1 font-bold' : 'group-active:scale-90'}`}>{icon}</span>
    <span className={`text-[10px] font-bold ${active ? '' : 'opacity-70'}`}>{label}</span>
  </button>
);
