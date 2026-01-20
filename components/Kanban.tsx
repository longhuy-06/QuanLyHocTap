
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { TaskStatus, Priority, Task, Subject } from '../types';
import { useDataStore } from '../lib/store/dataStore';
import { useForm } from 'react-hook-form';
import { CalendarPicker } from './CalendarPicker';

export const Kanban: React.FC = () => {
  const { subjects, tasks, updateTaskStatus, updateTaskProgress, updateTask, deleteTask, clearAllTasks } = useDataStore();
  const [activeSubject, setActiveSubject] = useState<string>('all');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const filteredTasks = useMemo(() => {
    if (activeSubject === 'all') return tasks;
    return tasks.filter(t => t.subjectId === activeSubject);
  }, [activeSubject, tasks]);

  const parseDate = (dateStr: string): Date | null => {
      if (!dateStr) return null;
      const [datePart, timePart] = dateStr.split(' ');
      const parts = datePart.split('/');
      if (parts.length === 3) {
          let hour = 23, minute = 59, second = 59;
          if (timePart) {
              const [h, m] = timePart.split(':');
              hour = parseInt(h);
              minute = parseInt(m);
              second = 0;
          }
          return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]), hour, minute, second);
      }
      return null;
  };

  const overdueCount = useMemo(() => {
      return tasks.filter(t => {
          if (t.status === TaskStatus.DONE) return false;
          const deadline = parseDate(t.dueDate);
          return deadline ? deadline < currentTime : false;
      }).length;
  }, [tasks, currentTime]);

  const getSubjectInfo = (id: string) => {
    return subjects.find(s => s.id === id) || { name: 'Khác', color: '#9ca3af' };
  };

  const handleOpenAddTask = () => {
      setEditingTask(null);
      setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: Task) => {
      setEditingTask(task);
      setIsTaskModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col w-full pb-20 pt-4 bg-background-light dark:bg-background-dark relative">
      <header className="flex flex-col px-5 py-4 shrink-0 gap-3">
         <div className="flex items-center justify-between w-full">
            <h1 className="text-gray-900 dark:text-white text-xl font-bold">Nhắc nhở</h1>
            <div className="flex gap-3">
                {tasks.length > 0 && (
                    <button 
                        onClick={() => setIsResetConfirmOpen(true)}
                        className="flex size-10 items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 transition-colors"
                    >
                        <span className="material-symbols-outlined">delete_sweep</span>
                    </button>
                )}
                <button 
                    onClick={() => setIsAddSubjectModalOpen(true)}
                    className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                    <span className="material-symbols-outlined">library_add</span>
                </button>
            </div>
         </div>

         {overdueCount > 0 && (
             <div className="w-full bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl p-3 flex items-center gap-3 animate-pulse-slow">
                 <div className="size-8 rounded-full bg-red-100 dark:bg-red-800/30 flex items-center justify-center shrink-0">
                     <span className="material-symbols-outlined text-red-500 text-[18px]">warning</span>
                 </div>
                 <div className="flex-1">
                     <p className="text-sm font-bold text-red-600 dark:text-red-400">Bạn có {overdueCount} nhiệm vụ quá hạn!</p>
                     <p className="text-xs text-red-500/80 dark:text-red-400/70">Hãy kiểm tra và hoàn thành sớm nhé.</p>
                 </div>
             </div>
         )}
      </header>
      
      <div className="w-full shrink-0 z-10 mb-2">
        <div className="flex gap-3 px-5 pb-4 overflow-x-auto hide-scrollbar">
            <Chip 
                active={activeSubject === 'all'} 
                label="Tất cả" 
                onClick={() => setActiveSubject('all')}
            />
            {subjects.map(subject => (
                <Chip 
                    key={subject.id}
                    active={activeSubject === subject.id}
                    label={subject.name}
                    color={subject.color}
                    onClick={() => setActiveSubject(subject.id)}
                />
            ))}
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden snap-x snap-mandatory flex gap-4 px-5 pb-6 hide-scrollbar items-start h-full">
        <Column 
            title="Cần làm" 
            count={filteredTasks.filter(t => t.status === TaskStatus.TODO).length} 
            colorClass="bg-gray-500"
            onAddClick={handleOpenAddTask}
        >
           {filteredTasks.filter(t => t.status === TaskStatus.TODO).map(t => (
             <Card 
                key={t.id} 
                task={t}
                subjectInfo={getSubjectInfo(t.subjectId)} 
                currentTime={currentTime}
                onStatusChange={updateTaskStatus}
                onProgressChange={updateTaskProgress}
                onEdit={() => handleOpenEditTask(t)}
                onDelete={deleteTask}
             />
           ))}
        </Column>
        
        <Column title="Đang làm" count={filteredTasks.filter(t => t.status === TaskStatus.DOING).length} colorClass="bg-primary" highlight>
           {filteredTasks.filter(t => t.status === TaskStatus.DOING).map(t => (
             <Card 
                key={t.id} 
                task={t}
                subjectInfo={getSubjectInfo(t.subjectId)} 
                currentTime={currentTime}
                showProgress 
                onStatusChange={updateTaskStatus}
                onProgressChange={updateTaskProgress}
                onEdit={() => handleOpenEditTask(t)}
                onDelete={deleteTask}
             />
           ))}
        </Column>
        
        <Column title="Hoàn thành" count={filteredTasks.filter(t => t.status === TaskStatus.DONE).length} colorClass="bg-emerald-500">
           {filteredTasks.filter(t => t.status === TaskStatus.DONE).map(t => (
             <Card 
                key={t.id} 
                task={t}
                subjectInfo={getSubjectInfo(t.subjectId)} 
                currentTime={currentTime}
                isDone 
                onStatusChange={updateTaskStatus}
                onProgressChange={updateTaskProgress}
                onEdit={() => handleOpenEditTask(t)}
                onDelete={deleteTask}
             />
           ))}
        </Column>
      </div>

      {isTaskModalOpen && (
        <TaskModal 
            task={editingTask}
            onClose={() => setIsTaskModalOpen(false)} 
            defaultSubject={activeSubject !== 'all' ? activeSubject : undefined}
        />
      )}

      {isAddSubjectModalOpen && (
          <AddSubjectModal onClose={() => setIsAddSubjectModalOpen(false)} />
      )}

      {isResetConfirmOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in-up px-4">
              <div 
                  className="bg-white dark:bg-surface-dark w-full max-w-sm p-6 rounded-3xl shadow-2xl space-y-4"
                  onClick={(e) => e.stopPropagation()}
              >
                  <div className="flex flex-col items-center text-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-500 mb-1">
                          <span className="material-symbols-outlined text-[32px]">warning</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Xóa tất cả nhiệm vụ?</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                          Hành động này sẽ xóa vĩnh viễn toàn bộ nhiệm vụ.
                      </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                      <button 
                          onClick={() => setIsResetConfirmOpen(false)}
                          className="w-full py-3 rounded-xl font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800"
                      >
                          Hủy bỏ
                      </button>
                      <button 
                          onClick={() => { clearAllTasks(); setIsResetConfirmOpen(false); }}
                          className="w-full py-3 rounded-xl font-bold text-white bg-red-500 shadow-lg shadow-red-500/30"
                      >
                          Xóa tất cả
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

const AddSubjectModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { addSubject } = useDataStore();
    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<{ name: string; color: string }>({
        defaultValues: {
            name: '',
            color: '#3b82f6'
        }
    });
    
    const selectedColor = watch('color');
    const colors = ['#3b82f6', '#ec4899', '#10b981', '#8b5cf6', '#6366f1', '#ef4444', '#f97316', '#06b6d4'];

    const onSubmit = (data: { name: string; color: string }) => {
        addSubject({ id: Date.now().toString(), name: data.name, color: data.color });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-white dark:bg-surface-dark w-full sm:max-w-md p-6 rounded-t-3xl sm:rounded-3xl shadow-2xl space-y-5" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Thêm môn học mới</h2>
                    <button onClick={onClose} className="p-2 text-gray-400"><span className="material-symbols-outlined">close</span></button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Tên môn học</label>
                        <input {...register('name', { required: true })} autoFocus className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-4" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Màu sắc</label>
                        <div className="flex gap-3 flex-wrap">
                            {colors.map(color => (
                                <button key={color} type="button" onClick={() => setValue('color', color)} className={`w-10 h-10 rounded-full border-2 ${selectedColor === color ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'}`} style={{ backgroundColor: color }} />
                            ))}
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg">Tạo môn học</button>
                </form>
            </div>
        </div>
    );
};

const TaskModal: React.FC<{ onClose: () => void; task?: Task | null; defaultSubject?: string }> = ({ onClose, task, defaultSubject }) => {
    const { subjects, addTask, updateTask } = useDataStore();
    const isEdit = !!task;

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<Partial<Task>>({
        defaultValues: task ? {
            title: task.title,
            subjectId: task.subjectId,
            priority: task.priority,
            dueDate: task.dueDate,
        } : {
            title: '',
            subjectId: defaultSubject || subjects[0]?.id,
            priority: Priority.MEDIUM,
            dueDate: '',
        }
    });
    
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const selectedSubjectId = watch('subjectId');
    const dueDate = watch('dueDate');

    const onSubmit = (data: Partial<Task>) => {
        if (isEdit && task) {
            updateTask(task.id, data);
        } else {
            addTask({
                id: Date.now().toString(),
                title: data.title!,
                subjectId: data.subjectId!,
                priority: data.priority as Priority,
                dueDate: data.dueDate || '',
                status: TaskStatus.TODO,
                completed: false,
                progress: 0
            });
        }
        onClose();
    };

    return (
        <>
            <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in-up">
                <div className="bg-white dark:bg-surface-dark w-full sm:max-w-md p-6 rounded-t-3xl sm:rounded-3xl shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-bold">{isEdit ? 'Chỉnh sửa nhiệm vụ' : 'Thêm nhiệm vụ mới'}</h2>
                        <button onClick={onClose} className="p-2 text-gray-400"><span className="material-symbols-outlined">close</span></button>
                    </div>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Nội dung công việc</label>
                            <input {...register('title', { required: true })} autoFocus className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-4" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Môn học</label>
                            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                                {subjects.map(sub => (
                                    <button
                                        key={sub.id}
                                        type="button"
                                        onClick={() => setValue('subjectId', sub.id)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border whitespace-nowrap transition-all ${selectedSubjectId === sub.id ? 'bg-primary/10 border-primary text-primary font-bold' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}
                                    >
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sub.color }}></div>
                                        <span className="text-sm">{sub.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Độ ưu tiên</label>
                                <select {...register('priority')} className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-3 text-sm">
                                    <option value={Priority.HIGH}>Cao</option>
                                    <option value={Priority.MEDIUM}>Trung bình</option>
                                    <option value={Priority.LOW}>Thấp</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Hạn chót</label>
                                <div onClick={() => setIsCalendarOpen(true)} className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-3 text-sm flex items-center justify-between cursor-pointer">
                                    <span className={dueDate ? "" : "text-gray-400"}>{dueDate || "Chọn ngày..."}</span>
                                    <span className="material-symbols-outlined text-gray-400 text-[20px]">calendar_month</span>
                                </div>
                                <input type="hidden" {...register('dueDate')} />
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined">{isEdit ? 'save' : 'add_task'}</span>
                            {isEdit ? 'Lưu thay đổi' : 'Tạo nhiệm vụ'}
                        </button>
                    </form>
                </div>
            </div>
            {isCalendarOpen && (
                <CalendarPicker initialDate={dueDate} onSelect={(date) => { setValue('dueDate', date); setIsCalendarOpen(false); }} onClose={() => setIsCalendarOpen(false)} />
            )}
        </>
    );
};

const Chip: React.FC<{ label: string; active?: boolean; color?: string; onClick: () => void }> = ({ label, active, color, onClick }) => (
  <button onClick={onClick} className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-xl px-4 shadow-sm border transition-all ${active ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent ring-2 ring-gray-900 dark:ring-white' : 'bg-white dark:bg-surface-dark border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}>
    {color && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />}
    <p className="text-sm font-semibold">{label}</p>
  </button>
);

const Column: React.FC<{ title: string; count: number; colorClass: string; children: React.ReactNode; highlight?: boolean; onAddClick?: () => void }> = ({ title, count, colorClass, children, highlight, onAddClick }) => (
  <div className={`snap-center min-w-[85vw] md:min-w-[340px] h-full flex flex-col rounded-2xl p-2 border transition-colors ${highlight ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100/50 dark:border-indigo-800/30' : 'bg-gray-100/50 dark:bg-gray-800/30 border-transparent'}`}>
    <div className="flex items-center justify-between px-3 py-3">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${colorClass}`}></div>
        <h3 className="text-gray-800 dark:text-gray-100 text-base font-bold">{title}</h3>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white dark:bg-gray-700 px-1.5 text-xs font-bold shadow-sm">{count}</span>
      </div>
    </div>
    <div className="flex-1 overflow-y-auto pr-1 hide-scrollbar space-y-3 p-1">
      {children}
      {!highlight && title === 'Cần làm' && (
        <button onClick={onAddClick} className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-3 text-sm font-medium text-gray-400 hover:text-primary hover:border-primary/50 transition-all">
          <span className="material-symbols-outlined text-[18px]">add</span> Thêm nhiệm vụ
        </button>
      )}
    </div>
  </div>
);

interface CardProps {
    task: Task;
    subjectInfo: any;
    currentTime: Date;
    showProgress?: boolean;
    isDone?: boolean;
    onStatusChange: (id: string, status: TaskStatus) => void;
    onProgressChange: (id: string, progress: number) => void;
    onEdit: () => void;
    onDelete: (id: string) => void;
}

const Card: React.FC<CardProps> = ({ task, subjectInfo, currentTime, showProgress, isDone, onStatusChange, onProgressChange, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const isOverdue = useMemo(() => {
      if (isDone || !task.dueDate) return false;
      const [datePart, timePart] = task.dueDate.split(' ');
      const parts = datePart.split('/');
      if (parts.length === 3) {
          let hour = 23, minute = 59, second = 59;
          if (timePart) {
              const [h, m] = timePart.split(':');
              hour = parseInt(h);
              minute = parseInt(m);
              second = 0;
          }
          const deadline = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]), hour, minute, second);
          return deadline < currentTime;
      }
      return false;
  }, [isDone, task.dueDate, currentTime]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) setShowMenu(false);
    };
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleProgressInteraction = (e: React.MouseEvent | React.TouchEvent) => {
      if (!progressBarRef.current) return;
      const rect = progressBarRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      if (e.type === 'mousemove' && (e as React.MouseEvent).buttons !== 1) return;
      const newProgress = Math.max(0, Math.min(100, Math.round(((clientX - rect.left) / rect.width) * 100)));
      onProgressChange(task.id, newProgress);
  };

  return (
    <div className={`group relative flex flex-col gap-3 rounded-xl bg-white dark:bg-surface-dark p-4 shadow-soft border transition-all ${isDone ? 'opacity-70' : isOverdue ? 'border-red-200 dark:border-red-900/50' : 'border-transparent'}`}>
        <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full" style={{ backgroundColor: subjectInfo.color }} />
        
        <div className="absolute top-2 right-2 z-20" ref={menuRef}>
            <button onClick={() => setShowMenu(!showMenu)} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"><span className="material-symbols-outlined text-[20px]">more_vert</span></button>
            {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-30 animate-fade-in-up">
                    <button onClick={onEdit} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">edit</span> Chỉnh sửa</button>
                    {task.status !== TaskStatus.TODO && <button onClick={() => onStatusChange(task.id, TaskStatus.TODO)} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">radio_button_unchecked</span> Về Cần làm</button>}
                    {task.status !== TaskStatus.DOING && <button onClick={() => onStatusChange(task.id, TaskStatus.DOING)} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-primary"><span className="material-symbols-outlined text-[18px]">play_circle</span> Sang Đang làm</button>}
                    {task.status !== TaskStatus.DONE && <button onClick={() => onStatusChange(task.id, TaskStatus.DONE)} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-emerald-500"><span className="material-symbols-outlined text-[18px]">check_circle</span> Hoàn thành</button>}
                    <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                    <button onClick={() => onDelete(task.id)} className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 font-medium"><span className="material-symbols-outlined text-[18px]">delete</span> Xóa nhiệm vụ</button>
                </div>
            )}
        </div>

        <div className="pl-3 pr-4" onClick={onEdit}>
            <div className="flex flex-col gap-1">
                {!isDone && (
                    <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${task.priority === Priority.HIGH ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{task.priority}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: subjectInfo.color }}>{subjectInfo.name}</span>
                    </div>
                )}
                <h4 className={`text-gray-900 dark:text-white font-bold text-[15px] leading-snug mt-2 ${isDone ? 'line-through text-gray-400' : ''}`}>{task.title}</h4>
            </div>
        </div>
        
        {showProgress && (
            <div className="pl-3 mt-1 w-full pr-4 select-none touch-none">
                <div className="flex justify-between text-[10px] text-gray-500 mb-1"><span>Tiến độ</span><span>{task.progress || 0}%</span></div>
                <div ref={progressBarRef} className="h-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full cursor-pointer relative" onMouseDown={handleProgressInteraction} onMouseMove={handleProgressInteraction} onTouchStart={handleProgressInteraction} onTouchMove={handleProgressInteraction}>
                    <div className="h-full bg-primary rounded-full transition-all duration-75" style={{ width: `${task.progress || 0}%` }} />
                </div>
            </div>
        )}

        <div className={`pl-3 mt-1 flex items-center justify-between border-t pt-3 ${isOverdue ? 'border-red-100' : 'border-gray-50 dark:border-gray-700'}`}>
            <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-500 animate-pulse' : 'text-gray-500'}`}>
                <span className="material-symbols-outlined text-[16px]">{isDone ? 'event_available' : isOverdue ? 'warning' : 'schedule'}</span>
                <span className={`text-xs font-medium ${isOverdue ? 'font-bold' : ''}`}>{isDone ? 'Đã xong' : isOverdue ? `${task.dueDate} (Quá hạn)` : task.dueDate || 'Chưa đặt lịch'}</span>
            </div>
        </div>
    </div>
  );
};
