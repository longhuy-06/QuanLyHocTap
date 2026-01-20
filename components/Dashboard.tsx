
import React, { useEffect, useMemo, useState } from 'react';
import { Pomodoro } from './Pomodoro';
import { ResponsiveContainer, Cell, PieChart, Pie, BarChart, Bar, Tooltip, XAxis } from 'recharts';
import { useAuthStore } from '../lib/store/authStore';
import { useDataStore } from '../lib/store/dataStore';
import { TaskStatus } from '../types';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, checkStreakValidity } = useAuthStore();
  const { tasks, subjects, updateTaskStatus } = useDataStore();
  
  const [timeFilter, setTimeFilter] = useState<'week' | 'month'>('week');
  const [activePerformanceDate, setActivePerformanceDate] = useState(new Date());

  useEffect(() => {
      // Truyền tasks vào để kiểm tra tính hợp lệ của streak
      checkStreakValidity(tasks);
  }, [checkStreakValidity, tasks]);

  const stats = useMemo(() => {
      const selectedDay = activePerformanceDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const dailyTasks = tasks.filter(t => t.dueDate?.startsWith(selectedDay));
      
      const totalTasks = dailyTasks.length;
      const completedTasks = dailyTasks.filter(t => t.status === TaskStatus.DONE).length;
      
      const dateISO = activePerformanceDate.toISOString().split('T')[0];
      const totalMinutes = user?.studySessions?.[dateISO] || 0;

      return { totalTasks, completedTasks, totalMinutes };
  }, [tasks, activePerformanceDate, user]);

  const todayTasks = useMemo(() => {
      const today = new Date();
      const todayStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
      
      return tasks.filter(t => {
          if (!t.dueDate) return false;
          return t.dueDate.startsWith(todayStr) && t.status !== TaskStatus.DONE;
      }).sort((a, b) => {
          const timeA = a.dueDate.split(' ')[1] || '23:59';
          const timeB = b.dueDate.split(' ')[1] || '23:59';
          return timeA.localeCompare(timeB);
      });
  }, [tasks]);

  const intensityData = useMemo(() => {
      const data = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const minutes = user?.studySessions?.[dateStr] || 0;
          data.push({
              name: d.toLocaleDateString('vi-VN', { weekday: 'short' }),
              minutes: minutes
          });
      }
      return data;
  }, [user]);

  const pieData = [
    { name: 'Xong', value: stats.completedTasks || (stats.totalTasks === 0 ? 0 : 0.0001), color: '#5048e5' },
    { name: 'Còn lại', value: (stats.totalTasks - stats.completedTasks) || (stats.totalTasks === 0 ? 1 : 0), color: '#f3f4f6' }
  ];

  const handleDayShift = (days: number) => {
      const newDate = new Date(activePerformanceDate);
      newDate.setDate(newDate.getDate() + days);
      setActivePerformanceDate(newDate);
  };

  return (
    <div className="pb-32 pt-6 px-5 max-w-lg mx-auto bg-background-light dark:bg-background-dark min-h-screen">
       <header className="flex flex-col gap-2 mb-8 animate-fade-in-up">
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-glow">
                      <span className="material-symbols-outlined text-[28px] font-bold">menu_book</span>
                  </div>
                  <div>
                      <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Học Tập</h1>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Chào {user?.name.split(' ')[0]}!</p>
                  </div>
              </div>
              <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 px-4 py-2 rounded-2xl border border-orange-100 dark:border-orange-800/30">
                  <span className="material-symbols-outlined text-orange-500 fill-1">local_fire_department</span>
                  <span className="font-black text-orange-600 dark:text-orange-400">{user?.streak || 0} ngày</span>
              </div>
          </div>
       </header>

       <Pomodoro />

       <div className="grid grid-cols-2 gap-4 mt-6 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          <button 
            onClick={() => navigate('/documents')}
            className="bg-white dark:bg-surface-dark p-4 rounded-3xl shadow-soft dark:shadow-none dark:border dark:border-gray-800 flex items-center gap-3 transition-all active:scale-95 hover:border-primary/30 border border-transparent"
          >
             <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-primary dark:bg-indigo-900/20 flex items-center justify-center">
                <span className="material-symbols-outlined">folder_open</span>
             </div>
             <div className="text-left">
                <p className="text-sm font-black text-gray-900 dark:text-white">Tài liệu</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Kho lưu trữ</p>
             </div>
          </button>
          
          <button 
            onClick={() => navigate('/ai-tutor')}
            className="bg-white dark:bg-surface-dark p-4 rounded-3xl shadow-soft dark:shadow-none dark:border dark:border-gray-800 flex items-center gap-3 transition-all active:scale-95 hover:border-purple-500/30 border border-transparent"
          >
             <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-900/20 flex items-center justify-center">
                <span className="material-symbols-outlined">auto_awesome</span>
             </div>
             <div className="text-left">
                <p className="text-sm font-black text-gray-900 dark:text-white">Huy Long</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Hỏi đáp 24/7</p>
             </div>
          </button>
       </div>

       <div className="mt-8 space-y-6">
          <section className="bg-white dark:bg-surface-dark rounded-[32px] p-6 shadow-soft dark:shadow-none dark:border dark:border-gray-800 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
             <div className="flex flex-col gap-4 mb-6">
                 <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-gray-900 dark:text-white">Hiệu suất học tập</h3>
                    <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-xl p-1">
                        <button onClick={() => handleDayShift(-1)} className="p-1.5 text-gray-400 hover:text-primary transition-colors"><span className="material-symbols-outlined text-[18px]">chevron_left</span></button>
                        <span className="text-[10px] font-black px-2 w-24 text-center uppercase tracking-tighter">{activePerformanceDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) === new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) ? "Hôm nay" : activePerformanceDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</span>
                        <button onClick={() => handleDayShift(1)} className="p-1.5 text-gray-400 hover:text-primary transition-colors"><span className="material-symbols-outlined text-[18px]">chevron_right</span></button>
                    </div>
                 </div>
             </div>

             <div className="flex items-center gap-8">
                <div className="w-32 h-32 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie 
                                data={pieData} 
                                innerRadius={45} 
                                outerRadius={58} 
                                paddingAngle={8} 
                                dataKey="value" 
                                stroke="none"
                                cornerRadius={10}
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalTasks > 0 ? Math.round((stats.completedTasks/stats.totalTasks)*100) : 0}%</span>
                        <span className="text-[8px] font-black text-gray-400 tracking-widest">TIẾN ĐỘ</span>
                    </div>
                </div>
                <div className="flex-1 grid grid-cols-1 gap-3">
                    <div className="flex items-center gap-3 p-3 bg-indigo-50/40 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100/20">
                        <span className="material-symbols-outlined text-primary text-[20px]">assignment_turned_in</span>
                        <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Bài tập</p>
                            <p className="text-base font-black text-indigo-700 dark:text-indigo-400">{stats.completedTasks}/{stats.totalTasks}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-emerald-50/40 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100/20">
                        <span className="material-symbols-outlined text-emerald-500 text-[20px]">schedule</span>
                        <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Thời gian học</p>
                            <p className="text-base font-black text-emerald-700 dark:text-emerald-400">{Math.floor(stats.totalMinutes/60)}h{stats.totalMinutes%60}m</p>
                        </div>
                    </div>
                </div>
             </div>
          </section>

          <section className="bg-white dark:bg-surface-dark rounded-[32px] p-6 shadow-soft dark:shadow-none dark:border dark:border-gray-800 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-black text-gray-900 dark:text-white">Cường độ 7 ngày qua</h3>
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              </div>
              <div className="h-44 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={intensityData}>
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            // Fix: fontWeights is not a valid property for SVGTextElement in React, should be fontWeight.
                            tick={{fontSize: 10, fill: '#9ca3af', fontWeight: 800}} 
                        />
                        <Tooltip 
                            contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '12px'}}
                            itemStyle={{fontSize: '12px', fontWeight: 'bold'}}
                            cursor={{fill: 'rgba(79, 70, 229, 0.05)'}}
                            labelStyle={{fontWeight: 'bold', marginBottom: '4px'}}
                        />
                        <Bar 
                            dataKey="minutes" 
                            fill="#5048e5" 
                            radius={[8, 8, 8, 8]} 
                            barSize={18}
                        />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
          </section>

          <section className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center justify-between px-2">
                  <h3 className="text-base font-black text-gray-900 dark:text-white">Nhiệm vụ hôm nay</h3>
                  <button onClick={() => navigate('/kanban')} className="text-xs font-black text-primary hover:underline">TẤT CẢ</button>
              </div>
              <div className="space-y-3">
                  {todayTasks.length > 0 ? (
                      todayTasks.map(task => (
                          <div key={task.id} className="bg-white dark:bg-surface-dark p-4 rounded-3xl shadow-soft border border-transparent hover:border-primary/20 transition-all flex items-center justify-between group">
                              <div className="flex items-center gap-4">
                                  <div className="w-1.5 h-10 rounded-full" style={{backgroundColor: subjects.find(s => s.id === task.subjectId)?.color || '#9ca3af'}}></div>
                                  <div>
                                      <h4 className="text-[15px] font-black text-gray-800 dark:text-white line-clamp-1">{task.title}</h4>
                                      <div className="flex items-center gap-2 mt-0.5">
                                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{subjects.find(s => s.id === task.subjectId)?.name || 'Khác'}</p>
                                          <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                                          <span className="text-[10px] font-bold text-primary">{task.dueDate.split(' ')[1] || 'Cả ngày'}</span>
                                      </div>
                                  </div>
                              </div>
                              <button 
                                onClick={() => updateTaskStatus(task.id, TaskStatus.DONE)}
                                className="w-10 h-10 rounded-full border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-300 hover:text-emerald-500 hover:border-emerald-500 transition-all hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                              >
                                <span className="material-symbols-outlined text-[22px]">check_circle</span>
                              </button>
                          </div>
                      ))
                  ) : (
                      <div className="p-10 text-center bg-gray-50/50 dark:bg-gray-800/30 rounded-[32px] border border-dashed border-gray-200 dark:border-gray-700">
                          <span className="material-symbols-outlined text-4xl text-gray-200 mb-3">task_alt</span>
                          <p className="text-sm text-gray-400 font-bold">Thật tuyệt! Bạn đã xong hết bài tập hôm nay.</p>
                      </div>
                  )}
              </div>
          </section>
       </div>
    </div>
  );
};
