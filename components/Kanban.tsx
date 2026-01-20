
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { TaskStatus, Priority, Task, Subject } from '../types';
import { useDataStore } from '../lib/store/dataStore';
import { useForm } from 'react-hook-form';
import { CalendarPicker } from './CalendarPicker';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store/authStore';

export const Kanban: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { subjects, tasks, updateTaskStatus, updateTaskProgress, updateTask, deleteTask, clearAllTasks } = useDataStore();
  const [activeSubject, setActiveSubject] = useState<string>('all');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const filteredTasks = useMemo(() => {
    if (activeSubject === 'all') return tasks;
    return tasks.filter(t => t.subject_id === activeSubject);
  }, [activeSubject, tasks]);

  const parseDate = (dateStr: string): Date | null => {
      if (!dateStr) return null;
      const [datePart, timePart] = dateStr.split(' ');
      const parts = datePart.split('/');
      if (parts.length === 3) {
          let h = 23, m = 59;
          if (timePart) {
              const [hStr, mStr] = timePart.split(':');
              h = parseInt(hStr); m = parseInt(mStr);
          }
          return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]), h, m);
      }
      return null;
  };

  const overdueCount = useMemo(() => {
      return tasks.filter(t => {
          if (t.status === TaskStatus.DONE) return false;
          const deadline = parseDate(t.due_date);
          return deadline ? deadline < currentTime : false;
      }).length;
  }, [tasks, currentTime]);

  return (
    <div className="h-full flex flex-col w-full pb-32 pt-4 bg-background-light dark:bg-background-dark relative overflow-hidden">
      <header className="flex items-center px-5 py-4 shrink-0 gap-4">
         <button 
            onClick={() => navigate('/settings')}
            className="w-12 h-12 rounded-[20px] bg-primary overflow-hidden shadow-md active:scale-90 transition-all shrink-0"
         >
            <img src={user?.avatar_url || "https://picsum.photos/200"} className="w-full h-full object-cover" alt="Profile" />
         </button>
         <div className="flex-1">
            <h1 className="text-gray-900 dark:text-white text-xl font-black tracking-tight">Nhiệm vụ</h1>
         </div>
         <div className="flex gap-2">
            <button onClick={() => setIsAddSubjectModalOpen(true)} className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 transition-all active:scale-90">
                <span className="material-symbols-outlined text-[20px]">library_add</span>
            </button>
         </div>
      </header>
      
      {overdueCount > 0 && (
          <div className="mx-5 mb-4 bg-red-50 dark:bg-red-900/20 rounded-2xl p-3 flex items-center gap-3 border border-red-100 dark:border-red-900/30">
              <span className="material-symbols-outlined text-red-500 fill-1 text-[20px]">warning</span>
              <p className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-wider">Có {overdueCount} việc quá hạn!</p>
          </div>
      )}

      <div className="flex gap-3 px-5 pb-4 overflow-x-auto hide-scrollbar">
          <Chip active={activeSubject === 'all'} label="Tất cả" onClick={() => setActiveSubject('all')} />
          {subjects.map(s => <Chip key={s.id} active={activeSubject === s.id} label={s.name} color={s.color} onClick={() => setActiveSubject(s.id)} />)}
      </div>

      <div className="flex-1 overflow-x-auto snap-x flex gap-4 px-5 pb-6 hide-scrollbar items-start">
        <Column title="Cần làm" count={filteredTasks.filter(t => t.status === TaskStatus.TODO).length} colorClass="bg-gray-400" onAddClick={() => { setEditingTask(null); setIsTaskModalOpen(true); }}>
           {filteredTasks.filter(t => t.status === TaskStatus.TODO).map(t => <Card key={t.id} task={t} subjectInfo={subjects.find(s => s.id === t.subject_id)} currentTime={currentTime} onStatusChange={updateTaskStatus} onEdit={() => { setEditingTask(t); setIsTaskModalOpen(true); }} onDelete={deleteTask} />)}
        </Column>
        <Column title="Đang làm" count={filteredTasks.filter(t => t.status === TaskStatus.DOING).length} colorClass="bg-primary" highlight>
           {filteredTasks.filter(t => t.status === TaskStatus.DOING).map(t => <Card key={t.id} task={t} subjectInfo={subjects.find(s => s.id === t.subject_id)} currentTime={currentTime} showProgress onStatusChange={updateTaskStatus} onProgressChange={updateTaskProgress} onEdit={() => { setEditingTask(t); setIsTaskModalOpen(true); }} onDelete={deleteTask} />)}
        </Column>
        <Column title="Xong" count={filteredTasks.filter(t => t.status === TaskStatus.DONE).length} colorClass="bg-emerald-500">
           {filteredTasks.filter(t => t.status === TaskStatus.DONE).map(t => <Card key={t.id} task={t} subjectInfo={subjects.find(s => s.id === t.subject_id)} currentTime={currentTime} isDone onStatusChange={updateTaskStatus} onEdit={() => { setEditingTask(t); setIsTaskModalOpen(true); }} onDelete={deleteTask} />)}
        </Column>
      </div>

      {isTaskModalOpen && <TaskModal task={editingTask} onClose={() => setIsTaskModalOpen(false)} defaultSubject={activeSubject !== 'all' ? activeSubject : undefined} />}
      {isAddSubjectModalOpen && <AddSubjectModal onClose={() => setIsAddSubjectModalOpen(false)} />}
      
      {isResetConfirmOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md px-4">
              <div className="bg-white dark:bg-surface-dark w-full max-w-sm p-8 rounded-[40px] text-center shadow-2xl border border-white/20">
                  <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <span className="material-symbols-outlined text-[40px]">delete_forever</span>
                  </div>
                  <h3 className="text-xl font-black mb-2">Xóa tất cả?</h3>
                  <p className="text-sm text-gray-500 mb-8">Hành động này sẽ xóa vĩnh viễn mọi nhiệm vụ của bạn khỏi hệ thống.</p>
                  <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => setIsResetConfirmOpen(false)} className="py-4 rounded-2xl bg-gray-100 dark:bg-gray-800 font-bold text-gray-400">Hủy</button>
                      <button onClick={() => { clearAllTasks(); setIsResetConfirmOpen(false); }} className="py-4 rounded-2xl bg-red-500 text-white font-black shadow-lg shadow-red-500/30">Xóa hết</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

const Chip: React.FC<{ label: string; active?: boolean; color?: string; onClick: () => void }> = ({ label, active, color, onClick }) => (
  <button onClick={onClick} className={`flex h-11 shrink-0 items-center px-5 rounded-2xl border transition-all active:scale-95 ${active ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-lg' : 'bg-white dark:bg-surface-dark text-gray-400 border-gray-100 dark:border-gray-800'}`}>
    {color && <div className="w-2 h-2 rounded-full mr-2.5" style={{ backgroundColor: color }} />}
    <p className="text-[13px] font-black uppercase tracking-widest">{label}</p>
  </button>
);

const Column: React.FC<{ title: string; count: number; colorClass: string; children: React.ReactNode; highlight?: boolean; onAddClick?: () => void }> = ({ title, count, colorClass, children, highlight, onAddClick }) => (
  <div className={`snap-center min-w-[85vw] md:min-w-[340px] flex flex-col rounded-[32px] p-3 border transition-colors ${highlight ? 'bg-indigo-50/30 dark:bg-indigo-900/5 border-primary/10' : 'bg-gray-100/30 dark:bg-gray-800/10 border-transparent'}`}>
    <div className="flex items-center justify-between px-3 py-3 font-black">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${colorClass} shadow-sm`}></div>
        <h3 className="text-sm uppercase tracking-widest text-gray-500">{title}</h3>
        <span className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded-lg text-[10px] shadow-sm">{count}</span>
      </div>
    </div>
    <div className="flex-1 space-y-4 p-1 overflow-y-auto hide-scrollbar min-h-[400px]">
      {children}
      {onAddClick && (
          <button onClick={onAddClick} className="w-full py-5 rounded-[24px] border-2 border-dashed border-gray-200 dark:border-gray-800 text-xs text-gray-400 font-black uppercase tracking-widest hover:border-primary/50 hover:text-primary transition-all active:scale-[0.98]">
              + Thêm nhiệm vụ
          </button>
      )}
    </div>
  </div>
);

const Card: React.FC<any> = ({ task, subjectInfo, currentTime, showProgress, isDone, onStatusChange, onProgressChange, onEdit, onDelete }) => {
    const isOverdue = useMemo(() => {
        if (isDone || !task.due_date) return false;
        const [datePart, timePart] = task.due_date.split(' ');
        const parts = datePart.split('/');
        let h=23, m=59;
        if(timePart) { const [hS, mS] = timePart.split(':'); h=parseInt(hS); m=parseInt(mS); }
        const dl = new Date(parseInt(parts[2]), parseInt(parts[1])-1, parseInt(parts[0]), h, m);
        return dl < currentTime;
    }, [isDone, task.due_date, currentTime]);

    return (
        <div className={`relative bg-white dark:bg-surface-dark p-5 rounded-[28px] shadow-soft border group transition-all hover:shadow-glow ${isOverdue ? 'border-red-100 bg-red-50/20' : 'border-transparent'}`} onClick={onEdit}>
            <div className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full" style={{ backgroundColor: subjectInfo?.color || '#eee' }} />
            
            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest px-2 py-1 bg-primary/5 rounded-lg">
                        {subjectInfo?.name}
                    </span>
                    <button 
                        onClick={(e) => { e.stopPropagation(); if(confirm("Xóa nhiệm vụ này?")) onDelete(task.id); }} 
                        className="text-gray-300 hover:text-red-500 transition-all active:scale-90"
                    >
                        <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                </div>

                <h4 className={`font-black text-[16px] leading-tight ${isDone ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                    {task.title}
                </h4>

                {showProgress && (
                    <div className="space-y-1.5" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center text-[9px] font-bold text-primary">
                            <span>TIẾN ĐỘ</span>
                            <span>{task.progress}%</span>
                        </div>
                        <input type="range" value={task.progress} onChange={e => onProgressChange(task.id, parseInt(e.target.value))} className="w-full h-1 bg-gray-100 dark:bg-gray-800 accent-primary rounded-full cursor-pointer" />
                    </div>
                )}

                <div className="flex items-center justify-between mt-1">
                    <div className={`flex items-center gap-1.5 text-[10px] font-bold ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                        <span className="material-symbols-outlined text-sm">{isOverdue ? 'error' : 'schedule'}</span>
                        {task.due_date}
                    </div>
                    
                    <div className="flex bg-gray-50 dark:bg-gray-800 rounded-xl p-0.5 gap-0.5" onClick={e => e.stopPropagation()}>
                        <button 
                            onClick={() => onStatusChange(task.id, TaskStatus.TODO)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${task.status === TaskStatus.TODO ? 'bg-white dark:bg-gray-700 text-gray-900 shadow-sm' : 'text-gray-300 hover:text-gray-500'}`}
                        >
                            <span className="material-symbols-outlined text-base">list</span>
                        </button>
                        <button 
                            onClick={() => onStatusChange(task.id, TaskStatus.DOING)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${task.status === TaskStatus.DOING ? 'bg-primary text-white shadow-lg' : 'text-gray-300 hover:text-primary'}`}
                        >
                            <span className="material-symbols-outlined text-base">play_arrow</span>
                        </button>
                        <button 
                            onClick={() => onStatusChange(task.id, TaskStatus.DONE)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${task.status === TaskStatus.DONE ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-300 hover:text-emerald-500'}`}
                        >
                            <span className="material-symbols-outlined text-base">check</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TaskModal: React.FC<any> = ({ onClose, task, defaultSubject }) => {
    const { subjects, addTask, updateTask } = useDataStore();
    const isEdit = !!task;
    const { register, handleSubmit, setValue, watch } = useForm({
        defaultValues: task ? { title: task.title, subject_id: task.subject_id, priority: task.priority, due_date: task.due_date } 
        : { title: '', subject_id: defaultSubject || subjects[0]?.id, priority: Priority.MEDIUM, due_date: '' }
    });
    const [isCal, setIsCal] = useState(false);
    const dateVal = watch('due_date');

    const onSubmit = (data: any) => {
        if (isEdit) updateTask(task.id, data);
        else addTask({ id: Date.now().toString(), ...data, status: TaskStatus.TODO, completed: false, progress: 0 });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in-up">
            <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-surface-dark w-full max-w-md p-8 rounded-[40px] shadow-2xl space-y-6">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{isEdit ? 'Sửa nhiệm vụ' : 'Nhiệm vụ mới'}</h2>
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tên công việc</label>
                        <input {...register('title', { required: true })} className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-primary/50" placeholder="Học bài, làm BT..." />
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Môn học</label>
                        <select {...register('subject_id')} className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none text-sm font-bold">
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Hạn chót</label>
                        <div onClick={() => setIsCal(true)} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl cursor-pointer text-sm font-bold flex justify-between items-center group">
                            <span className={dateVal ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>{dateVal || 'Chọn thời gian...'}</span>
                            <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">calendar_month</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button type="button" onClick={onClose} className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-400 font-bold rounded-2xl">Hủy</button>
                    <button type="submit" className="flex-2 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 active:scale-[0.98] transition-all">Lưu thay đổi</button>
                </div>
                {isCal && <CalendarPicker initialDate={dateVal} onSelect={d => { setValue('due_date', d); setIsCal(false); }} onClose={() => setIsCal(false)} />}
            </form>
        </div>
    );
};

const AddSubjectModal: React.FC<any> = ({ onClose }) => {
    const { addSubject } = useDataStore();
    const { register, handleSubmit, setValue, watch } = useForm({ defaultValues: { name: '', color: '#3b82f6' } });
    const colors = ['#3b82f6', '#ec4899', '#10b981', '#ef4444', '#f97316', '#8b5cf6', '#f59e0b'];

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in-up">
            <form onSubmit={handleSubmit(d => { addSubject({ id: Date.now().toString(), ...d }); onClose(); })} className="bg-white dark:bg-surface-dark w-full max-w-sm p-8 rounded-[40px] shadow-2xl space-y-6">
                <div className="text-center">
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-[20px] flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-[32px]">bookmark_add</span>
                    </div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white">Thêm môn học</h2>
                </div>
                
                <input {...register('name', { required: true })} className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none font-bold text-center" placeholder="Nhập tên môn..." autoFocus />
                
                <div className="flex gap-2.5 justify-center flex-wrap">
                    {colors.map(c => (
                        <button 
                            key={c} 
                            type="button" 
                            onClick={() => setValue('color', c)} 
                            className={`w-9 h-9 rounded-full transition-all flex items-center justify-center ${watch('color') === c ? 'ring-4 ring-primary/20 scale-110 shadow-lg' : 'opacity-60 hover:opacity-100'}`} 
                            style={{ backgroundColor: c }}
                        >
                            {watch('color') === c && <span className="material-symbols-outlined text-white text-sm font-bold">check</span>}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={onClose} className="py-4 bg-gray-100 dark:bg-gray-800 text-gray-400 font-bold rounded-2xl uppercase text-[10px] tracking-widest">Hủy</button>
                    <button type="submit" className="py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 uppercase text-[10px] tracking-widest">Thêm môn</button>
                </div>
            </form>
        </div>
    );
};
