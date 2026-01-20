
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../lib/store/dataStore';
import { StudyDocument, Subject, DocumentGroup } from '../types';
import { useAuthStore } from '../lib/store/authStore';

interface UploadModalData {
    file: File;
    title: string;
    subjectId: string;
    groupId: string;
}

export const StudyDocuments: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { documents, subjects, documentGroups, addDocument, deleteDocument, addDocumentGroup, deleteDocumentGroup } = useDataStore();
  
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadData, setUploadData] = useState<UploadModalData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetGroupIdRef = useRef<string>('');
  const targetSubjectIdRef = useRef<string>('');

  const currentSubjectId = useMemo(() => {
      if (activeTab === 'all') return subjects[0]?.id || '';
      return activeTab;
  }, [activeTab, subjects]);

  const filteredDocs = useMemo(() => {
    if (!documents) return [];
    return documents.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === 'all' || doc.subject_id === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [documents, searchQuery, activeTab]);

  const triggerUpload = (subjectId: string, groupId: string = '') => {
      targetSubjectIdRef.current = subjectId;
      targetGroupIdRef.current = groupId;
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadData({
        file: file,
        title: file.name.split('.')[0],
        subjectId: targetSubjectIdRef.current || currentSubjectId,
        groupId: targetGroupIdRef.current 
    });
  };

  const handleConfirmUpload = async () => {
      if (!uploadData) return;
      
      setIsUploading(true);
      try {
          const newDoc: StudyDocument = {
            id: Date.now().toString(),
            title: uploadData.title,
            file_name: uploadData.file.name,
            file_type: uploadData.file.type,
            file_size: uploadData.file.size,
            file_data: '',
            subject_id: uploadData.subjectId,
            group_id: uploadData.groupId || undefined,
            upload_date: new Date().toISOString(),
          };
          
          await addDocument(newDoc, uploadData.file);
          setUploadData(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
          targetGroupIdRef.current = '';
          targetSubjectIdRef.current = '';
      } catch (error) {
          console.error(error);
      } finally {
          setIsUploading(false);
      }
  };

  const handleAddGroup = () => {
      if (!newGroupName.trim()) return;
      const newGroup: DocumentGroup = {
          id: Date.now().toString(),
          name: newGroupName,
          subject_id: currentSubjectId
      };
      addDocumentGroup(newGroup);
      setNewGroupName('');
      setIsAddingGroup(false);
  };

  const getTargetGroupName = () => {
      if (!uploadData?.groupId) return "Chưa phân loại";
      return documentGroups.find(g => g.id === uploadData.groupId)?.name || "Chưa phân loại";
  };

  return (
    <div className="pb-32 pt-4 px-4 min-h-screen bg-background-light dark:bg-background-dark">
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />

      <header className="flex items-center justify-between mb-6 animate-fade-in-up">
        <div className="flex items-center gap-4">
             <button 
                onClick={() => navigate('/settings')}
                className="w-12 h-12 rounded-[20px] bg-primary overflow-hidden shadow-md active:scale-90 transition-all border border-white/20"
             >
                <img src={user?.avatar_url || "https://picsum.photos/200"} className="w-full h-full object-cover" alt="Profile" />
             </button>
             <div>
                <h1 className="text-xl font-black text-gray-900 dark:text-white">Tài liệu</h1>
             </div>
        </div>
        <button onClick={() => navigate(-1)} className="p-2 text-gray-400">
          <span className="material-symbols-outlined">close</span>
        </button>
      </header>

      <div className="relative mb-8 animate-fade-in-up">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
        <input 
          type="text" 
          placeholder="Tìm tên tài liệu..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-surface-dark border-none rounded-2xl shadow-soft text-sm focus:ring-2 focus:ring-primary/50 font-bold"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-8 pb-1 animate-fade-in-up">
        <button 
          onClick={() => setActiveTab('all')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap uppercase tracking-widest ${activeTab === 'all' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white dark:bg-surface-dark text-gray-400 border border-gray-100 dark:border-gray-800'}`}
        >
          Tất cả
        </button>
        {subjects.map(sub => (
          <button 
            key={sub.id}
            onClick={() => setActiveTab(sub.id)}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-2 uppercase tracking-widest ${activeTab === sub.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white dark:bg-surface-dark text-gray-400 border border-gray-100 dark:border-gray-800'}`}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeTab === sub.id ? 'white' : sub.color }}></div>
            {sub.name}
          </button>
        ))}
      </div>

      <div className="space-y-10 animate-fade-in-up">
        {subjects.filter(s => activeTab === 'all' || s.id === activeTab).map(subject => {
            const subjectGroups = documentGroups.filter(g => g.subject_id === subject.id);
            const subjectDocs = filteredDocs.filter(d => d.subject_id === subject.id);
            
            if (activeTab === 'all' && subjectDocs.length === 0) return null;

            return (
                <section key={subject.id} className="space-y-6">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: subject.color }}></div>
                            <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-wider">{subject.name}</h2>
                        </div>
                        {activeTab !== 'all' && (
                            <button 
                                onClick={() => setIsAddingGroup(true)}
                                className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-lg flex items-center gap-1.5 uppercase"
                            >
                                <span className="material-symbols-outlined text-sm font-bold">create_new_folder</span>
                                Tạo nhóm
                            </button>
                        )}
                    </div>

                    <div className="space-y-4">
                        {subjectGroups.map(group => {
                            const groupDocs = subjectDocs.filter(d => String(d.group_id) === String(group.id));
                            return (
                                <FolderView 
                                    key={group.id} 
                                    group={group} 
                                    docs={groupDocs} 
                                    searchQuery={searchQuery}
                                    onDeleteGroup={() => deleteDocumentGroup(group.id)}
                                    onDeleteDoc={(id) => {
                                        const doc = documents.find(d => d.id === id);
                                        deleteDocument(id, (doc as any).file_path);
                                    }}
                                    onAddDoc={() => triggerUpload(subject.id, group.id)}
                                />
                            );
                        })}

                        {subjectDocs.filter(d => !d.group_id || d.group_id === "").length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        <span className="material-symbols-outlined text-[14px]">category</span>
                                        Chưa phân nhóm
                                    </div>
                                    <button 
                                        onClick={() => triggerUpload(subject.id, '')}
                                        className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center hover:text-primary transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">add</span>
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {subjectDocs.filter(d => !d.group_id || d.group_id === "").map(doc => (
                                        <DocumentCard 
                                            key={doc.id} 
                                            doc={doc} 
                                            subject={subject} 
                                            onDelete={(id) => {
                                                const doc = documents.find(d => d.id === id);
                                                deleteDocument(id, (doc as any).file_path);
                                            }} 
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {subjectDocs.length === 0 && subjectGroups.length === 0 && (
                            <div className="p-8 text-center bg-gray-50/50 dark:bg-gray-800/20 rounded-[32px] border border-dashed border-gray-100 dark:border-gray-800">
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Chưa có dữ liệu</p>
                                <button onClick={() => triggerUpload(subject.id)} className="mt-3 text-[10px] font-black text-primary uppercase">Tải tệp đầu tiên</button>
                            </div>
                        )}
                    </div>
                </section>
            );
        })}
      </div>

      {isAddingGroup && (
           <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in-up">
                <div className="bg-white dark:bg-surface-dark w-full max-w-xs p-6 rounded-[32px] shadow-2xl space-y-4">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white text-center">Tên nhóm mới</h3>
                    <input 
                        type="text"
                        autoFocus
                        value={newGroupName}
                        onChange={e => setNewGroupName(e.target.value)}
                        placeholder="VD: Tài liệu đọc..."
                        className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-3.5 text-sm font-bold focus:ring-2 focus:ring-primary/50"
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setIsAddingGroup(false)} className="py-3 rounded-xl font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 uppercase text-[10px] tracking-widest">Hủy</button>
                        <button onClick={handleAddGroup} className="py-3 rounded-xl font-bold text-white bg-primary shadow-lg shadow-primary/30 uppercase text-[10px] tracking-widest">Tạo</button>
                    </div>
                </div>
           </div>
      )}

      {uploadData && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in-up">
              <div className="bg-white dark:bg-surface-dark w-full sm:max-w-md p-6 rounded-t-[40px] sm:rounded-[40px] shadow-2xl space-y-6">
                  <div className="flex justify-between items-center">
                      <h3 className="text-xl font-black text-gray-900 dark:text-white">Lưu tài liệu</h3>
                      <button onClick={() => setUploadData(null)} className="p-2 text-gray-400"><span className="material-symbols-outlined">close</span></button>
                  </div>

                  <div className="space-y-5">
                      <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-3xl">
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                             <span className="material-symbols-outlined text-[28px]">description</span>
                          </div>
                          <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Đích đến: <span className="text-primary">{getTargetGroupName()}</span></p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Môn học: <span className="text-indigo-500">{subjects.find(s => s.id === uploadData.subjectId)?.name}</span></p>
                              <p className="text-sm font-black text-gray-900 dark:text-white truncate mt-1">{uploadData.file.name}</p>
                          </div>
                      </div>

                      <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tiêu đề tài liệu</label>
                          <input 
                              type="text"
                              value={uploadData.title}
                              onChange={e => setUploadData({...uploadData, title: e.target.value})}
                              className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 text-sm font-black text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50"
                          />
                      </div>
                  </div>

                  <div className="pt-2">
                    <button 
                        onClick={handleConfirmUpload}
                        disabled={isUploading || !uploadData.title}
                        className="w-full h-14 bg-primary text-white rounded-[24px] font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        {isUploading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : "Xác nhận tải lên"}
                    </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

const FolderView: React.FC<{ group: DocumentGroup, docs: StudyDocument[], searchQuery: string, onDeleteGroup: () => void, onDeleteDoc: (id: string) => void, onAddDoc: () => void }> = ({ group, docs, searchQuery, onDeleteGroup, onDeleteDoc, onAddDoc }) => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (searchQuery.trim() && docs.length > 0) setIsOpen(true);
    }, [searchQuery, docs.length]);

    return (
        <div className={`rounded-[32px] overflow-hidden transition-all duration-300 ${isOpen ? 'bg-white dark:bg-surface-dark shadow-soft ring-1 ring-gray-100 dark:ring-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/20'}`}>
            <div className="p-4 flex items-center justify-between cursor-pointer group" onClick={() => setIsOpen(!isOpen)}>
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isOpen ? 'bg-primary text-white shadow-glow' : 'bg-white dark:bg-surface-dark text-gray-400'}`}>
                        <span className="material-symbols-outlined text-[26px] font-bold">{isOpen ? 'folder_open' : 'folder'}</span>
                    </div>
                    <div>
                        <h4 className="text-[15px] font-black text-gray-800 dark:text-gray-100">{group.name}</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{docs.length} tài liệu</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); onAddDoc(); }} className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all mr-1">
                        <span className="material-symbols-outlined text-[18px] font-bold">add</span>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); if(confirm("Xóa nhóm này?")) onDeleteGroup(); }} className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                    <span className={`material-symbols-outlined text-gray-300 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
                </div>
            </div>
            
            {isOpen && (
                <div className="px-4 pb-4 space-y-3 animate-fade-in-up">
                    {docs.length > 0 ? (
                        docs.map(doc => <DocumentCard key={doc.id} doc={doc} onDelete={onDeleteDoc} />)
                    ) : (
                        <div className="py-6 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest opacity-50">
                            Thư mục trống
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const DocumentCard: React.FC<{ doc: StudyDocument; subject?: Subject; onDelete: (id: string) => void }> = ({ doc, subject, onDelete }) => {
    const getFileIcon = (type: string) => {
        if (!type) return 'insert_drive_file';
        if (type.includes('pdf')) return 'description';
        if (type.includes('image')) return 'image';
        return 'insert_drive_file';
    };

    return (
        <div className="bg-white dark:bg-surface-dark p-3.5 rounded-2xl border border-gray-50 dark:border-gray-800 hover:border-primary/20 transition-all flex items-center justify-between group">
            <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[22px]">{getFileIcon(doc.file_type)}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white truncate">{doc.title}</h3>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">{doc.upload_date ? new Date(doc.upload_date).toLocaleDateString('vi-VN') : 'N/A'}</p>
                </div>
            </div>
            <div className="flex gap-1">
                <a href={doc.file_data} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                </a>
                <button onClick={() => { if(confirm("Xóa tài liệu này?")) onDelete(doc.id); }} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
            </div>
        </div>
    );
};
