
import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../lib/store/dataStore';
import { StudyDocument, Subject, DocumentGroup } from '../types';

interface UploadModalData {
    file: File;
    preview: string;
    title: string;
    subjectId: string;
    groupId: string;
}

export const StudyDocuments: React.FC = () => {
  const navigate = useNavigate();
  const { documents, subjects, documentGroups, addDocument, deleteDocument, addDocumentGroup, deleteDocumentGroup } = useDataStore();
  
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadData, setUploadData] = useState<UploadModalData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Ref to track which group is being targeted for the next upload
  const targetGroupIdRef = useRef<string>('');

  // Lấy môn học hiện tại
  const currentSubjectId = useMemo(() => {
      if (activeTab === 'all') return subjects[0]?.id || 'chinese';
      return activeTab;
  }, [activeTab, subjects]);

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === 'all' || doc.subjectId === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [documents, searchQuery, activeTab]);

  const triggerUpload = (groupId: string = '') => {
      targetGroupIdRef.current = groupId;
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadData({
          file: file,
          preview: reader.result as string,
          title: file.name.split('.')[0],
          subjectId: currentSubjectId,
          groupId: targetGroupIdRef.current // Use the cached target group ID
      });
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmUpload = () => {
      if (!uploadData) return;
      
      setIsUploading(true);
      const newDoc: StudyDocument = {
        id: Date.now().toString(),
        title: uploadData.title,
        fileName: uploadData.file.name,
        fileType: uploadData.file.type,
        fileSize: uploadData.file.size,
        fileData: uploadData.preview,
        subjectId: uploadData.subjectId,
        groupId: uploadData.groupId || undefined,
        uploadDate: new Date().toLocaleDateString('vi-VN'),
      };
      
      setTimeout(() => {
          addDocument(newDoc);
          setIsUploading(false);
          setUploadData(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
          targetGroupIdRef.current = '';
      }, 500);
  };

  const handleAddGroup = () => {
      if (!newGroupName.trim()) return;
      const newGroup: DocumentGroup = {
          id: Date.now().toString(),
          name: newGroupName,
          subjectId: currentSubjectId
      };
      addDocumentGroup(newGroup);
      setNewGroupName('');
      setIsAddingGroup(false);
  };

  return (
    <div className="pb-32 pt-4 px-4 min-h-screen bg-background-light dark:bg-background-dark">
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />

      <header className="flex items-center justify-between mb-6 animate-fade-in-up">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <div className="flex flex-col items-center flex-1">
            <h1 className="text-xl font-black text-gray-900 dark:text-white">Kho tài liệu</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hệ thống lưu trữ</p>
        </div>
        <div className="w-10"></div> {/* Spacer to keep title centered */}
      </header>

      {/* Search Bar */}
      <div className="relative mb-8 animate-fade-in-up">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
        <input 
          type="text" 
          placeholder="Tìm tên tài liệu..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-surface-dark border-none rounded-2xl shadow-soft text-sm focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Tab Filter */}
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

      {/* Content Rendering */}
      <div className="space-y-10 animate-fade-in-up">
        {subjects.filter(s => activeTab === 'all' || s.id === activeTab).map(subject => {
            const subjectGroups = documentGroups.filter(g => g.subjectId === subject.id);
            const subjectDocs = filteredDocs.filter(d => d.subjectId === subject.id);
            
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

                    {/* Groups (Folders) */}
                    <div className="space-y-4">
                        {subjectGroups.map(group => {
                            const groupDocs = subjectDocs.filter(d => d.groupId === group.id);
                            return (
                                <FolderView 
                                    key={group.id} 
                                    group={group} 
                                    docs={groupDocs} 
                                    onDeleteGroup={() => deleteDocumentGroup(group.id)}
                                    onDeleteDoc={deleteDocument}
                                    onAddDoc={() => triggerUpload(group.id)}
                                />
                            );
                        })}

                        {/* General / Ungrouped Documents */}
                        {subjectDocs.filter(d => !d.groupId).length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        <span className="material-symbols-outlined text-[14px]">category</span>
                                        Chưa phân nhóm
                                    </div>
                                    <button 
                                        onClick={() => triggerUpload('')}
                                        className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center hover:text-primary transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">add</span>
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {subjectDocs.filter(d => !d.groupId).map(doc => (
                                        <DocumentCard key={doc.id} doc={doc} subject={subject} onDelete={deleteDocument} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {subjectDocs.length === 0 && (
                            <div className="p-10 text-center bg-gray-50/50 dark:bg-gray-800/30 rounded-[32px] border border-dashed border-gray-200 dark:border-gray-700">
                                <span className="material-symbols-outlined text-4xl text-gray-100 mb-2">folder_off</span>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Chưa có tài liệu</p>
                                <button 
                                    onClick={() => triggerUpload('')}
                                    className="mt-4 px-4 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20"
                                >
                                    Thêm tài liệu đầu tiên
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            );
        })}
      </div>

      {/* Modal: Thêm nhóm mới */}
      {isAddingGroup && (
           <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in-up">
                <div className="bg-white dark:bg-surface-dark w-full max-w-xs p-6 rounded-[32px] shadow-2xl space-y-4">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white text-center">Tên nhóm tài liệu mới</h3>
                    <input 
                        type="text"
                        autoFocus
                        value={newGroupName}
                        onChange={e => setNewGroupName(e.target.value)}
                        placeholder="VD: Tài liệu đọc, Nghe..."
                        className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-3.5 text-sm font-bold focus:ring-2 focus:ring-primary/50"
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setIsAddingGroup(false)} className="py-3 rounded-xl font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 uppercase text-[10px] tracking-widest">Hủy</button>
                        <button onClick={handleAddGroup} className="py-3 rounded-xl font-bold text-white bg-primary shadow-lg shadow-primary/30 uppercase text-[10px] tracking-widest">Tạo ngay</button>
                    </div>
                </div>
           </div>
      )}

      {/* Modal: Upload & Chỉnh sửa */}
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
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tệp gốc</p>
                              <p className="text-sm font-black text-gray-900 dark:text-white truncate">{uploadData.file.name}</p>
                          </div>
                      </div>

                      <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tên mục hiển thị</label>
                          <input 
                              type="text"
                              value={uploadData.title}
                              onChange={e => setUploadData({...uploadData, title: e.target.value})}
                              className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 text-sm font-black text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50"
                              placeholder="Nhập tên tài liệu..."
                          />
                      </div>

                      <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Chọn Môn học</label>
                          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                              {subjects.map(s => (
                                  <button
                                      key={s.id}
                                      onClick={() => setUploadData({...uploadData, subjectId: s.id, groupId: ''})}
                                      className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${uploadData.subjectId === s.id ? 'bg-primary border-primary text-white shadow-md' : 'bg-gray-50 dark:bg-gray-800 border-transparent text-gray-400'}`}
                                  >
                                      {s.name}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Chọn Nhóm phân loại</label>
                          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                              <button
                                  onClick={() => setUploadData({...uploadData, groupId: ''})}
                                  className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${uploadData.groupId === '' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent' : 'bg-gray-50 dark:bg-gray-800 border-transparent text-gray-400'}`}
                              >
                                  Chung
                              </button>
                              {documentGroups.filter(g => g.subjectId === uploadData.subjectId).map(g => (
                                  <button
                                      key={g.id}
                                      onClick={() => setUploadData({...uploadData, groupId: g.id})}
                                      className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${uploadData.groupId === g.id ? 'bg-primary border-primary text-white shadow-md' : 'bg-gray-50 dark:bg-gray-800 border-transparent text-gray-400'}`}
                                  >
                                      {g.name}
                                  </button>
                              ))}
                          </div>
                      </div>
                  </div>

                  <div className="pt-2">
                    <button 
                        onClick={handleConfirmUpload}
                        disabled={isUploading || !uploadData.title}
                        className="w-full h-14 bg-primary text-white rounded-[24px] font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        {isUploading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : "Lưu vào kho tài liệu"}
                    </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

const FolderView: React.FC<{ group: DocumentGroup, docs: StudyDocument[], onDeleteGroup: () => void, onDeleteDoc: (id: string) => void, onAddDoc: () => void }> = ({ group, docs, onDeleteGroup, onDeleteDoc, onAddDoc }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className={`rounded-[32px] overflow-hidden transition-all duration-300 ${isOpen ? 'bg-white dark:bg-surface-dark shadow-soft ring-1 ring-gray-100 dark:ring-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/20'}`}>
            <div 
                className="p-4 flex items-center justify-between cursor-pointer group"
                onClick={() => setIsOpen(!isOpen)}
            >
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
                    <button 
                        onClick={(e) => { e.stopPropagation(); onAddDoc(); }} 
                        className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all mr-1"
                        title="Thêm tài liệu vào nhóm này"
                    >
                        <span className="material-symbols-outlined text-[18px] font-bold">add</span>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDeleteGroup(); }} className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
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
                        <div className="py-6 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest opacity-50 flex flex-col items-center gap-2">
                            Thư mục trống
                            <button 
                                onClick={(e) => { e.stopPropagation(); onAddDoc(); }}
                                className="text-primary hover:underline text-[9px]"
                            >
                                THÊM NGAY
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const DocumentCard: React.FC<{ doc: StudyDocument; subject?: Subject; onDelete: (id: string) => void }> = ({ doc, subject, onDelete }) => {
    const getFileIcon = (type: string) => {
        if (type.includes('pdf')) return 'description';
        if (type.includes('image')) return 'image';
        if (type.includes('word') || type.includes('text')) return 'article';
        return 'insert_drive_file';
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, 1024)).toFixed(1)) + ' MB'; // Simpler MB focus
    };

    return (
        <div className="bg-white dark:bg-surface-dark p-3.5 rounded-2xl border border-gray-50 dark:border-gray-800 hover:border-primary/20 transition-all flex items-center justify-between group">
            <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[22px]">{getFileIcon(doc.fileType)}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white truncate">{doc.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">{doc.uploadDate}</span>
                        <div className="w-0.5 h-0.5 rounded-full bg-gray-200"></div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">{doc.fileName.split('.').pop()?.toUpperCase()}</span>
                    </div>
                </div>
            </div>

            <div className="flex gap-1">
                <a href={doc.fileData} download={doc.fileName} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[18px]">download</span>
                </a>
                <button onClick={() => onDelete(doc.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
            </div>
        </div>
    );
};
