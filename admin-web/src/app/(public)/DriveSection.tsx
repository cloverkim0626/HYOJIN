'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, ArrowLeft, PlayCircle, Settings, X, ChevronRight, Check, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AdminModal from './DriveAdminModal';

export default function DriveSection() {
    const [isLocked, setIsLocked] = useState(false); // false = Sample Mode, true = Student Mode
    const [selectedClass, setSelectedClass] = useState<any | null>(null);
    const [selectedWeek, setSelectedWeek] = useState<any | null>(null);
    const [showAdmin, setShowAdmin] = useState(false);
    
    const [classes, setClasses] = useState<any[]>([]);
    const [weeks, setWeeks] = useState<any[]>([]);
    const [videos, setVideos] = useState<any[]>([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [weekPasswordInput, setWeekPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isAuthenticatedWeek, setIsAuthenticatedWeek] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setIsLoading(true);
        const { data: seasonData } = await supabase
            .from('replay_seasons')
            .select('*')
            .eq('is_active', true)
            .single();

        if (seasonData) {
            const { data: classesData } = await supabase
                .from('replay_classes')
                .select('*')
                .eq('season_id', seasonData.id);
            setClasses(classesData || []);
        }

        const { data: sampleVideos } = await supabase
            .from('replay_videos')
            .select('*')
            .eq('is_sample', true)
            .order('created_at', { ascending: false });
        if (!isLocked) {
            setVideos(sampleVideos || []);
        }
        setIsLoading(false);
    };

    const handleClassSelect = async (cls: any) => {
        setSelectedClass(cls);
        const { data: weeksData } = await supabase
            .from('replay_weeks')
            .select('*')
            .eq('class_id', cls.id)
            .order('week_number', { ascending: true });
        setWeeks(weeksData || []);
    };

    const handleWeekSelect = (week: any) => {
        setSelectedWeek(week);
        setWeekPasswordInput('');
        setPasswordError('');
        setIsAuthenticatedWeek(false);
        setShowPasswordModal(true);
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (weekPasswordInput.trim() === selectedWeek.password) {
            setShowPasswordModal(false);
            setIsAuthenticatedWeek(true);
            const { data: weekVideos } = await supabase
                .from('replay_videos')
                .select('*')
                .eq('week_id', selectedWeek.id)
                .order('created_at', { ascending: true });
            setVideos(weekVideos || []);
        } else {
            setPasswordError('비밀번호가 일치하지 않습니다.');
        }
    };

    const renderVideos = () => {
        if (videos.length === 0) {
            return (
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center">
                    <PlayCircle size={32} className="mx-auto text-slate-400 mb-3" />
                    <h3 className="font-bold text-lg">등록된 영상이 없습니다</h3>
                    <p className="text-sm text-slate-500 mt-2">입력하신 조건에 맞는 영상이 아직 업로드되지 않았습니다.</p>
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-4">
                {videos.map(v => (
                    <div key={v.id} className="bg-white border text-left p-4 rounded-xl shadow-sm">
                        <div className="aspect-video bg-black rounded-lg mb-3 relative overflow-hidden group">
                           <iframe 
                               className="w-full h-full border-0 absolute inset-0" 
                               src={v.youtube_url.replace('watch?v=', 'embed/').split('&')[0]} 
                               allowFullScreen 
                           />
                        </div>
                        <p className="text-sm font-bold mt-2">{v.description}</p>
                        {v.quiz_url && (
                            <a href={v.quiz_url} target="_blank" rel="noreferrer" className="mt-3 block w-full bg-blue-50 text-blue-600 text-center py-2 rounded-lg text-sm font-bold border border-blue-200">
                                클래스카드 퀴즈 바로가기
                            </a>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <section className="w-full min-h-screen bg-[#f2f2f2] pb-32">
            <div className="w-full max-w-lg mx-auto px-6 pt-10 relative">
                
                {/* Fixed Top + Button for Upload/Admin */}
                <button 
                    onClick={() => setShowAdmin(true)}
                    className="absolute top-10 right-6 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center shadow-md hover:bg-[#c20000] transition-colors z-[100]"
                >
                    <Plus size={20} />
                </button>

                {/* Main Visual Header */}
                <div className="mb-10 pr-12">
                    <h1 className="text-[3.5rem] sm:text-[4.5rem] font-black leading-[0.85] tracking-tighter uppercase m-0">
                        2026<br />FIRST<br />DRIVE
                    </h1>
                    <div className="mt-6">
                        <h2 className="text-lg font-extrabold tracking-widest text-black">
                            첫 번째 내신 드라이브
                        </h2>
                        <div className="w-12 h-1 bg-[#c20000] mt-3"></div>
                    </div>
                </div>

                {/* Sliding Toggle Switch */}
                <div className="relative w-full max-w-sm mx-auto mb-8 bg-white/60 p-1.5 flex rounded-full shadow-inner border border-gray-200 backdrop-blur-sm">
                    <div 
                        className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-[#c20000] rounded-full transition-transform duration-300 ease-out shadow-sm ${isLocked ? 'translate-x-[100%]' : 'translate-x-0'}`}
                    />
                    <button 
                        onClick={() => { setIsLocked(false); setSelectedClass(null); setSelectedWeek(null); setIsAuthenticatedWeek(false); fetchInitialData(); }}
                        className={`flex-1 relative z-10 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors duration-300 ${!isLocked ? 'text-white' : 'text-slate-500 hover:text-black'}`}
                    >
                        샘플 영상
                    </button>
                    <button 
                        onClick={() => { setIsLocked(true); setSelectedClass(null); setSelectedWeek(null); setIsAuthenticatedWeek(false); fetchInitialData(); }}
                        className={`flex-1 relative z-10 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors duration-300 ${isLocked ? 'text-white' : 'text-slate-500 hover:text-black'}`}
                    >
                        수강생 전용
                    </button>
                </div>

                {/* Content Area */}
                <AnimatePresence mode="wait">
                    {!isLocked ? (
                        <motion.div
                            key="sample-mode"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="w-full flex flex-col gap-4 text-center"
                        >
                            <h3 className="font-bold text-lg mb-2 underline underline-offset-4 decoration-[#c20000] text-left">맛보기 샘플 영상</h3>
                            {renderVideos()}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="student-mode"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="w-full flex flex-col"
                        >
                            {!selectedClass ? (
                                <div className="flex flex-col gap-3">
                                    <h3 className="text-sm font-bold text-[#c20000] mb-2 uppercase tracking-wider">Select your class</h3>
                                    {classes.length === 0 && !isLoading && (
                                        <div className="text-sm text-slate-500 bg-white p-4 rounded-xl text-center border shadow-sm">등록된 반이 없습니다.</div>
                                    )}
                                    {classes.map((cls) => (
                                        <button
                                            key={cls.id}
                                            onClick={() => handleClassSelect(cls)}
                                            className="bg-white text-left p-5 rounded-2xl border border-gray-200 shadow-sm font-extrabold text-xl hover:bg-black hover:text-white transition-colors flex justify-between items-center group"
                                        >
                                            {cls.name}
                                            <ChevronRight className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-6">
                                    {!isAuthenticatedWeek ? (
                                        <>
                                            <button 
                                                onClick={() => setSelectedClass(null)}
                                                className="flex items-center gap-2 text-sm font-bold text-[#c20000] hover:text-black transition-colors w-fit"
                                            >
                                                <ArrowLeft size={16} /> 다른 반 선택하기
                                            </button>
                                            
                                            <div className="p-4 bg-black text-white rounded-xl mb-2 shadow-lg">
                                                <h3 className="font-black text-xl">{selectedClass.name}</h3>
                                                <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Replay Library</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 pb-8">
                                                {weeks.length === 0 && !isLoading && (
                                                    <div className="col-span-2 text-center py-10 bg-white rounded-2xl border shadow-sm text-slate-500 text-sm">등록된 주차가 없습니다.</div>
                                                )}
                                                {weeks.map((week) => (
                                                    <button
                                                        key={week.id}
                                                        onClick={() => handleWeekSelect(week)}
                                                        className="bg-white border border-black p-5 text-center flex flex-col justify-center items-center hover:bg-black hover:text-white transition-colors active:scale-[0.98]"
                                                    >
                                                        <span className="font-black text-[1rem] uppercase tracking-wider">Week {week.week_number}</span>
                                                        <span className="text-[0.65rem] font-medium mt-1 opacity-80">{week.title}</span>
                                                        <span className="text-[0.6rem] font-medium mt-2 text-[#c20000]">{week.date_range}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <button 
                                                onClick={() => setIsAuthenticatedWeek(false)}
                                                className="flex items-center gap-2 text-sm font-bold text-[#c20000] hover:text-black transition-colors w-fit"
                                            >
                                                <ArrowLeft size={16} /> 주차 선택으로 돌아가기
                                            </button>

                                            <div className="w-full flex items-end justify-between border-b-2 border-black pb-3 mb-2">
                                                <div>
                                                    <h3 className="font-black text-2xl uppercase tracking-wider">Week {selectedWeek.week_number}</h3>
                                                    <p className="text-sm font-bold text-gray-600 mt-1">{selectedWeek.title}</p>
                                                </div>
                                                <div className="bg-[#c20000] text-white text-xs font-bold px-3 py-1 rounded-sm">
                                                    {selectedWeek.date_range}
                                                </div>
                                            </div>
                                            {renderVideos()}
                                        </>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            <AnimatePresence>
                {showPasswordModal && selectedWeek && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ y: 20, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.95 }} 
                            className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
                        >
                            <div className="bg-[#c20000] text-white p-4 text-center relative">
                                <Lock size={24} className="mx-auto mb-2" />
                                <h3 className="font-bold text-lg">보안 잠금 해제</h3>
                                <p className="text-xs opacity-90 mt-1">WEEK {selectedWeek.week_number} ({selectedWeek.date_range})</p>
                                <button onClick={() => setShowPasswordModal(false)} className="absolute top-4 right-4 text-white/80 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handlePasswordSubmit} className="p-6">
                                <p className="text-sm text-center font-bold text-gray-700 mb-4">강사님께서 안내해주신<br/>해당 주차의 비밀번호를 입력해주세요.</p>
                                <input 
                                    type="password" autoFocus placeholder="비밀번호 입력..." 
                                    className="w-full text-center text-lg tracking-widest p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5"
                                    value={weekPasswordInput} onChange={(e) => { setWeekPasswordInput(e.target.value); setPasswordError(''); }}
                                />
                                {passwordError && <p className="text-[#c20000] text-xs text-center mt-2 font-bold">{passwordError}</p>}
                                <button type="submit" className="w-full bg-black text-white font-bold py-3 rounded-lg mt-4 flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors">
                                    <Check size={18} /> 확인
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AdminModal isOpen={showAdmin} onClose={() => setShowAdmin(false)} onModified={fetchInitialData} />
        </section>
    );
}
