import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReportStore } from '@/store/reportStore';
import { Lock, X, Plus, Trash2, Edit3, Save, ChevronRight, LayoutDashboard } from 'lucide-react';

export default function AdminPanel({ onClose }: { onClose: () => void }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);

    const { classes, addClass, deleteClass, addStudent, deleteStudent, updateStudentReport } = useReportStore();

    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

    // New Item states
    const [newClassName, setNewClassName] = useState('');
    const [newStudentName, setNewStudentName] = useState('');

    // Report Edit states
    const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [editHtml, setEditHtml] = useState('');
    const [editLink, setEditLink] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'admin123') { // Hardcoded for MVP
            setIsAuthenticated(true);
            setError(false);
        } else {
            setError(true);
            setTimeout(() => setError(false), 1000);
        }
    };

    const handleAddClass = () => {
        if (newClassName.trim()) {
            addClass(newClassName.trim());
            setNewClassName('');
        }
    };

    const handleAddStudent = () => {
        if (selectedClassId && newStudentName.trim()) {
            addStudent(selectedClassId, newStudentName.trim());
            setNewStudentName('');
        }
    };

    const openStudentEditor = (student: any) => {
        setSelectedStudentId(student.id);
        loadReportContent(student, 'daily');
    };

    const loadReportContent = (student: any, type: 'daily' | 'weekly' | 'monthly') => {
        setReportType(type);
        setEditHtml(student.report[`${type}Html`] || '');
        setEditLink(student.report[`${type}Link`] || '');
    };

    const handleSaveReport = () => {
        if (selectedClassId && selectedStudentId) {
            updateStudentReport(selectedClassId, selectedStudentId, {
                [`${reportType}Html`]: editHtml,
                [`${reportType}Link`]: editLink,
            });
            alert('저장되었습니다.');
        }
    };

    if (!isAuthenticated) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 p-8 rounded-2xl border border-rose-500/30 text-center w-full max-w-sm relative shadow-2xl shadow-rose-900/20">
                    <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20} /></button>
                    <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/20 text-rose-400">
                        <Lock size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">관리자 로그인</h3>
                    <p className="text-xs text-slate-400 mb-6">마스터 비밀번호를 입력해주세요.</p>
                    <form onSubmit={handleLogin}>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`w-full bg-black border ${error ? 'border-rose-500' : 'border-white/10'} rounded-xl py-4 text-center text-xl tracking-[0.5em] focus:outline-none focus:border-rose-500 transition-all mb-4`}
                            placeholder="PASSWORD"
                            autoFocus
                        />
                        <button type="submit" className="w-full py-4 bg-rose-600 hover:bg-rose-500 transition-colors rounded-xl text-sm font-bold shadow-lg shadow-rose-900/40">
                            패널 열기
                        </button>
                    </form>
                </div>
            </motion.div>
        );
    }

    const activeClass = classes.find(c => c.id === selectedClassId);
    const activeStudent = activeClass?.students.find(s => s.id === selectedStudentId);

    return (
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed inset-0 z-[100] bg-[#050510] flex flex-col overflow-hidden">
            {/* Admin Header */}
            <header className="bg-slate-900 border-b border-white/10 p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-rose-500/20 rounded-lg flex items-center justify-center text-rose-400">
                        <LayoutDashboard size={20} />
                    </div>
                    <div>
                        <h2 className="font-bold text-white leading-tight">관리자 통합 패널</h2>
                        <p className="text-[10px] text-slate-400">학생 데이터 및 HTML 리포트 관리</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 bg-white/5 rounded-lg text-slate-300 hover:bg-white/10 transition-colors">
                    <X size={20} />
                </button>
            </header>

            {/* Admin Content */}
            <div className="flex-1 flex overflow-hidden">

                {/* Left Column: Classes */}
                <div className="w-64 border-r border-white/10 bg-slate-900/50 flex flex-col">
                    <div className="p-4 border-b border-white/10">
                        <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">클래스 목록</h3>
                        <div className="flex gap-2">
                            <input value={newClassName} onChange={e => setNewClassName(e.target.value)} placeholder="새로운 반 이름" className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-rose-500" />
                            <button onClick={handleAddClass} className="bg-rose-600 p-2 rounded-lg"><Plus size={16} /></button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {classes.map(c => (
                            <div key={c.id} className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${selectedClassId === c.id ? 'bg-rose-500/20 border border-rose-500/30' : 'hover:bg-white/5 border border-transparent'}`} onClick={() => { setSelectedClassId(c.id); setSelectedStudentId(null); }}>
                                <span className="text-sm font-medium truncate pr-2">{c.name}</span>
                                <button onClick={(e) => { e.stopPropagation(); deleteClass(c.id); }} className="text-slate-600 hover:text-rose-400"><Trash2 size={14} /></button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Middle Column: Students */}
                <div className="w-64 border-r border-white/10 bg-slate-900/30 flex flex-col">
                    {!selectedClassId ? (
                        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">반을 선택해주세요.</div>
                    ) : (
                        <>
                            <div className="p-4 border-b border-white/10">
                                <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">학생 목록</h3>
                                <div className="flex gap-2">
                                    <input value={newStudentName} onChange={e => setNewStudentName(e.target.value)} placeholder="추가할 학생 이름" className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-rose-500" />
                                    <button onClick={handleAddStudent} className="bg-rose-600 p-2 rounded-lg"><Plus size={16} /></button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                {activeClass?.students.map(s => (
                                    <div key={s.id} className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${selectedStudentId === s.id ? 'bg-rose-500/20 border border-rose-500/30' : 'hover:bg-white/5 border border-transparent'}`} onClick={() => openStudentEditor(s)}>
                                        <span className="text-sm font-medium truncate pr-2">{s.name}</span>
                                        <button onClick={(e) => { e.stopPropagation(); deleteStudent(selectedClassId, s.id); }} className="text-slate-600 hover:text-rose-400"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                                {activeClass?.students.length === 0 && <div className="text-center text-xs text-slate-500 py-4">등록된 학생이 없습니다.</div>}
                            </div>
                        </>
                    )}
                </div>

                {/* Right Column: HTML Editor */}
                <div className="flex-1 flex flex-col bg-black">
                    {!activeStudent ? (
                        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">학생을 선택하여 리포트를 입력하세요.</div>
                    ) : (
                        <>
                            <div className="p-4 border-b border-white/10 bg-slate-900">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Edit3 size={18} className="text-rose-400" />
                                        {activeStudent.name} 리포트 편집
                                    </h3>
                                    <button onClick={handleSaveReport} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                                        <Save size={16} /> 저장하기
                                    </button>
                                </div>
                                <div className="flex gap-2 bg-black p-1 rounded-lg">
                                    {(['daily', 'weekly', 'monthly'] as const).map(type => (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                handleSaveReport(); // Save current before switching
                                                loadReportContent(activeStudent, type);
                                            }}
                                            className={`flex-1 py-2 text-sm text-center rounded-md font-medium transition-colors ${reportType === type ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}
                                        >
                                            {type === 'daily' ? '일간' : type === 'weekly' ? '주간' : '월간'} 리포트
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">

                                {/* Link Input */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">외부 링크 (선택사항)</label>
                                    <input
                                        type="text"
                                        value={editLink}
                                        onChange={e => setEditLink(e.target.value)}
                                        placeholder="https://... (입력 시 HTML보다 우선 연결될 수 있게 처리 가능)"
                                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500"
                                    />
                                </div>

                                {/* HTML Input */}
                                <div className="flex-1 flex flex-col">
                                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">HTML 코드 입력 (화면에 직접 렌더링됨)</label>
                                    <textarea
                                        value={editHtml}
                                        onChange={e => setEditHtml(e.target.value)}
                                        placeholder="<div><h1>안녕하세요</h1></div>"
                                        className="flex-1 w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-sm font-mono text-emerald-400 focus:outline-none focus:border-rose-500 resize-none"
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>

            </div>
        </motion.div>
    );
}
