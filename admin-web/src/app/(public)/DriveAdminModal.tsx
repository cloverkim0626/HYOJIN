'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Check, Plus, Trash2, Youtube, Link as LinkIcon, Edit2, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    onModified: () => void;
}

export default function AdminModal({ isOpen, onClose, onModified }: AdminModalProps) {
    const [authInput, setAuthInput] = useState('');
    const [isAuth, setIsAuth] = useState(false);
    const [authError, setAuthError] = useState('');

    const [activeTab, setActiveTab] = useState<'student' | 'sample' | 'week_pass'>('student');
    
    // Data states
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [weeks, setWeeks] = useState<any[]>([]);
    const [selectedWeek, setSelectedWeek] = useState('');

    const [videos, setVideos] = useState<any[]>([]);
    
    // New Video Form
    const [newYoutube, setNewYoutube] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newQuizUrl, setNewQuizUrl] = useState('');

    useEffect(() => {
        if (isOpen && isAuth) {
            fetchInitialAdminData();
        }
    }, [isOpen, isAuth]);

    const fetchInitialAdminData = async () => {
        const { data: seasonData } = await supabase.from('replay_seasons').select('*').eq('is_active', true).single();
        if (seasonData) {
            const { data: classData } = await supabase.from('replay_classes').select('*').eq('season_id', seasonData.id);
            setClasses(classData || []);
        }
    };

    const fetchWeeks = async (classId: string) => {
        const { data } = await supabase.from('replay_weeks').select('*').eq('class_id', classId).order('week_number', { ascending: true });
        setWeeks(data || []);
    };

    const fetchVideos = async (weekId: string) => {
        const { data } = await supabase.from('replay_videos').select('*').eq('week_id', weekId).order('created_at', { ascending: false });
        setVideos(data || []);
    };

    const fetchSampleVideos = async () => {
        const { data } = await supabase.from('replay_videos').select('*').eq('is_sample', true).order('created_at', { ascending: false });
        setVideos(data || []);
    };

    useEffect(() => {
        if (selectedClass) {
            fetchWeeks(selectedClass);
        } else {
            setWeeks([]);
            setSelectedWeek('');
        }
    }, [selectedClass]);

    useEffect(() => {
        if (activeTab === 'student' && selectedWeek) {
            fetchVideos(selectedWeek);
        } else if (activeTab === 'sample') {
            fetchSampleVideos();
        } else {
            setVideos([]);
        }
    }, [activeTab, selectedWeek]);

    const handleAuth = (e: React.FormEvent) => {
        e.preventDefault();
        // hardcoded admin pass for now
        if (authInput === 'hyojinadmin') {
            setIsAuth(true);
            setAuthError('');
        } else {
            setAuthError('관리자 비밀번호가 틀렸습니다.');
        }
    };

    const handleAddVideo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newYoutube || !newDescription) return alert('유튜브 링크와 설명을 입력해주세요.');
        
        const isSample = activeTab === 'sample';
        const { error } = await supabase.from('replay_videos').insert({
            week_id: isSample ? null : selectedWeek,
            is_sample: isSample,
            youtube_url: newYoutube,
            description: newDescription,
            quiz_url: newQuizUrl || null
        });

        if (error) {
            alert('영상 추가에 실패했습니다.');
            console.error(error);
            return;
        }

        setNewYoutube('');
        setNewDescription('');
        setNewQuizUrl('');
        if (isSample) fetchSampleVideos();
        else fetchVideos(selectedWeek);
        onModified();
    };

    const handleDeleteVideo = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        const { error } = await supabase.from('replay_videos').delete().eq('id', id);
        if (!error) {
            if (activeTab === 'sample') fetchSampleVideos();
            else fetchVideos(selectedWeek);
            onModified();
        }
    };

    const handleUpdateWeekPassword = async (weekId: string, currentPass: string) => {
        const newPass = prompt(`새로운 비밀번호를 입력해주세요. (현재: ${currentPass})`, currentPass);
        if (newPass && newPass !== currentPass) {
            const { error } = await supabase.from('replay_weeks').update({ password: newPass }).eq('id', weekId);
            if (!error) {
                alert('비밀번호가 변경되었습니다.');
                fetchWeeks(selectedClass);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex flex-col pt-10 px-4 bg-black/60 backdrop-blur-sm overflow-y-auto pb-10">
                <motion.div 
                    initial={{ opacity: 0, y: 50 }} 
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="bg-white w-full max-w-lg mx-auto rounded-3xl shadow-2xl overflow-hidden flex flex-col relative"
                >
                    <div className="p-4 bg-black text-white flex justify-between items-center shrink-0">
                        <h2 className="font-bold flex items-center gap-2"><Settings size={18} /> 관리자 패널</h2>
                        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X size={20} /></button>
                    </div>

                    {!isAuth ? (
                        <div className="p-8 pb-12">
                            <form onSubmit={handleAuth}>
                                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-gray-100 shadow-sm">
                                    <Lock size={32} className="text-white" />
                                </div>
                                <h3 className="text-center font-bold text-xl mb-6">관리자 인증</h3>
                                <input 
                                    type="password" autoFocus placeholder="관리자 비밀번호 입력"
                                    className="w-full text-center tracking-widest p-4 bg-gray-50 border border-gray-200 rounded-xl mb-2 focus:ring-2 focus:ring-black outline-none"
                                    value={authInput} onChange={(e) => { setAuthInput(e.target.value); setAuthError(''); }}
                                />
                                {authError && <p className="text-[#c20000] text-xs text-center font-bold mb-4">{authError}</p>}
                                <button type="submit" className="w-full bg-[#c20000] text-white font-bold p-4 rounded-xl mt-2 flex items-center justify-center gap-2 hover:bg-red-800 transition-colors">
                                    <Check size={20} /> 접속하기
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col">
                            {/* Tabs */}
                            <div className="grid grid-cols-3 border-b shrink-0">
                                <button onClick={() => setActiveTab('student')} className={`p-3 text-sm font-bold transition-colors ${activeTab === 'student' ? 'border-b-2 border-black text-black' : 'text-slate-400 hover:text-black'}`}>수강생 영상</button>
                                <button onClick={() => setActiveTab('sample')} className={`p-3 text-sm font-bold transition-colors ${activeTab === 'sample' ? 'border-b-2 border-black text-black' : 'text-slate-400 hover:text-black'}`}>샘플 영상</button>
                                <button onClick={() => setActiveTab('week_pass')} className={`p-3 text-sm font-bold transition-colors ${activeTab === 'week_pass' ? 'border-b-2 border-black text-black' : 'text-slate-400 hover:text-black'}`}>비밀번호 관리</button>
                            </div>

                            <div className="p-5 flex-1 overflow-y-auto">
                                {/* TAB 1 & 2: Video Management */}
                                {(activeTab === 'student' || activeTab === 'sample') && (
                                    <div className="space-y-6">
                                        {activeTab === 'student' && (
                                            <div className="flex gap-2">
                                                <select className="flex-1 border p-2 rounded-lg text-sm bg-gray-50 font-bold outline-none cursor-pointer" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                                                    <option value="">-- 반 선택 --</option>
                                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                                <select className="flex-1 border p-2 rounded-lg text-sm bg-gray-50 font-bold outline-none cursor-pointer" disabled={!selectedClass} value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)}>
                                                    <option value="">-- 주차 선택 --</option>
                                                    {weeks.map(w => <option key={w.id} value={w.id}>Week {w.week_number} ({w.title})</option>)}
                                                </select>
                                            </div>
                                        )}

                                        {((activeTab === 'student' && selectedWeek) || activeTab === 'sample') && (
                                            <>
                                                <form onSubmit={handleAddVideo} className="bg-gray-50 p-4 border border-gray-200 rounded-xl space-y-3 shadow-inner">
                                                    <h4 className="font-bold text-sm text-[#c20000] flex items-center gap-1 mb-2"><Plus size={16} /> 신규 영상 추가</h4>
                                                    <input type="url" required placeholder="유튜브 링크 (예: https://youtube.com/watch?v=...)" className="w-full text-sm p-3 border rounded-lg outline-none focus:border-black" value={newYoutube} onChange={e => setNewYoutube(e.target.value)} />
                                                    <input type="text" required placeholder="영상 설명 (진도, 파트 등)" className="w-full text-sm p-3 border rounded-lg outline-none focus:border-black" value={newDescription} onChange={e => setNewDescription(e.target.value)} />
                                                    <input type="url" placeholder="클래스카드 단어 퀴즈 링크 (선택)" className="w-full text-sm p-3 border rounded-lg outline-none focus:border-black" value={newQuizUrl} onChange={e => setNewQuizUrl(e.target.value)} />
                                                    <button type="submit" className="w-full bg-black text-white font-bold p-3 rounded-lg flex justify-center items-center gap-2 hover:bg-gray-800 transition-colors">
                                                        <Plus size={16} /> 추가하기
                                                    </button>
                                                </form>

                                                <div className="mt-6 flex flex-col gap-3">
                                                    <h4 className="font-bold text-sm">등록된 영상 목록 ({videos.length}개)</h4>
                                                    {videos.length === 0 ? (
                                                        <p className="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded-xl border border-dashed">영상이 없습니다.</p>
                                                    ) : videos.map(v => (
                                                        <div key={v.id} className="border p-3 rounded-xl flex items-center justify-between bg-white shadow-sm gap-3">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-bold text-sm truncate">{v.description}</p>
                                                                <div className="flex gap-2 mt-1">
                                                                    <a href={v.youtube_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 flex items-center gap-1 truncate max-w-[150px]"><Youtube size={12}/> {v.youtube_url}</a>
                                                                    {v.quiz_url && <span className="text-xs text-green-600 flex items-center gap-1"><LinkIcon size={12}/> 퀴즈O</span>}
                                                                </div>
                                                            </div>
                                                            <button type="button" onClick={() => handleDeleteVideo(v.id)} className="p-2 text-slate-400 hover:text-red-600 bg-gray-50 rounded-lg hover:bg-red-50 border border-transparent transition-colors">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* TAB 3: Week Password Management */}
                                {activeTab === 'week_pass' && (
                                    <div className="space-y-4">
                                        <select className="w-full border p-3 rounded-lg text-sm bg-gray-50 font-bold outline-none cursor-pointer" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                                            <option value="">-- 반 선택 --</option>
                                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>

                                        {selectedClass && weeks.length > 0 && (
                                            <div className="grid grid-cols-1 gap-3">
                                                {weeks.map(week => (
                                                    <div key={week.id} className="border p-4 bg-white rounded-xl shadow-sm flex items-center justify-between">
                                                        <div>
                                                            <div className="font-bold">Week {week.week_number}</div>
                                                            <div className="text-xs text-gray-500 mt-1">비밀번호: <span className="font-mono bg-gray-100 px-1 rounded text-[#c20000]">{week.password}</span></div>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleUpdateWeekPassword(week.id, week.password)} 
                                                            className="text-xs font-bold px-3 py-2 bg-black text-white rounded-lg flex items-center gap-1 hover:bg-gray-800"
                                                        >
                                                            <Edit2 size={12} /> 변경
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {selectedClass && weeks.length === 0 && <p className="text-xs text-gray-400 text-center py-4">해당 반에 등록된 주차가 없습니다.</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
