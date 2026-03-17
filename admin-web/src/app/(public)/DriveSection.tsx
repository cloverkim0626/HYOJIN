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
                <div className="bg-[#111118]/60 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-sm text-center">
                    <PlayCircle size={32} className="mx-auto text-slate-500 mb-3" />
                    <h3 className="font-bold text-lg text-white">등록된 영상이 없습니다</h3>
                    <p className="text-sm text-slate-400 mt-2">입력하신 조건에 맞는 영상이 아직 업로드되지 않았습니다.</p>
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-4">
                {videos.map(v => (
                    <div key={v.id} className="bg-[#0a0a0f]/80 backdrop-blur-md border border-white/10 text-left p-4 rounded-xl shadow-sm">
                        <div className="aspect-video bg-black rounded-lg mb-3 relative overflow-hidden group border border-white/5">
                           <iframe 
                               className="w-full h-full border-0 absolute inset-0" 
                               src={v.youtube_url.replace('watch?v=', 'embed/').split('&')[0]} 
                               allowFullScreen 
                           />
                        </div>
                        <p className="text-sm font-bold mt-2 text-white">{v.description}</p>
                        {v.quiz_url && (
                            <a href={v.quiz_url} target="_blank" rel="noreferrer" className="mt-3 block w-full bg-[#c20000]/10 text-[#ff6666] text-center py-2 rounded-lg text-sm font-bold border border-[#c20000]/30 hover:bg-[#c20000]/20 transition-colors">
                                클래스카드 퀴즈 바로가기
                            </a>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <section className="w-full min-h-screen bg-transparent pb-32">
            <div className="w-full max-w-lg mx-auto px-6 pt-10 relative">
                
                {/* Fixed Top + Button for Upload/Admin */}
                <button 
                    onClick={() => setShowAdmin(true)}
                    className="absolute top-10 right-6 w-10 h-10 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-full flex items-center justify-center shadow-md hover:bg-[#c20000] hover:border-[#c20000] transition-all z-[100]"
                >
                    <Plus size={20} />
                </button>

                {/* Main Visual Header */}
                <div className="mb-10 pr-12">
                    <h1 className="text-[3.5rem] sm:text-[4.5rem] font-black leading-[0.85] tracking-tighter uppercase m-0 text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-300 to-slate-500 drop-shadow-sm">
                        2026<br />FIRST<br />DRIVE
                    </h1>
                    <div className="mt-6">
                        <h2 className="text-lg font-extrabold tracking-widest text-[#c20000] drop-shadow-[0_0_10px_rgba(194,0,0,0.5)]">
                            첫 번째 내신 드라이브
                        </h2>
                        <div className="w-12 h-1 bg-[#c20000] mt-3 shadow-[0_0_10px_rgba(194,0,0,0.8)]"></div>
                    </div>
                </div>

                {/* Sliding Toggle Switch */}
                <div className="relative w-full max-w-sm mx-auto mb-8 bg-[#111118]/60 p-1.5 flex rounded-full shadow-inner border border-white/10 backdrop-blur-md">
                    <div 
                        className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-[#c20000] rounded-full transition-transform duration-300 ease-out shadow-[0_0_15px_rgba(194,0,0,0.4)] ${isLocked ? 'translate-x-[100%]' : 'translate-x-0'}`}
                    />
                    <button 
                        onClick={() => { setIsLocked(false); setSelectedClass(null); setSelectedWeek(null); setIsAuthenticatedWeek(false); fetchInitialData(); }}
                        className={`flex-1 relative z-10 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors duration-300 ${!isLocked ? 'text-white' : 'text-slate-500 hover:text-white'}`}
                    >
                        공개 영상
                    </button>
                    <button 
                        onClick={() => { setIsLocked(true); setSelectedClass(null); setSelectedWeek(null); setIsAuthenticatedWeek(false); fetchInitialData(); }}
                        className={`flex-1 relative z-10 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors duration-300 ${isLocked ? 'text-white' : 'text-slate-500 hover:text-white'}`}
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
                            <h3 className="font-bold text-lg mb-2 underline underline-offset-4 decoration-[#c20000] text-left text-white">전체 공개 영상</h3>
                            {renderVideos()}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="student-mode"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="w-full flex flex-col"
                        >
                            {!selectedClass ? (
                                <div className="flex flex-col">
                                    <div className="mb-6 flex items-center gap-3 ml-1">
                                        <div className="w-1.5 h-5 bg-[#c20000] rounded-full shadow-[0_0_10px_rgba(194,0,0,0.8)]"></div>
                                        <h3 className="text-xl font-bold text-white tracking-tight">수강하는 반 선택</h3>
                                    </div>
                                    {classes.length === 0 && !isLoading && (
                                        <div className="text-sm text-slate-400 py-10 text-center bg-[#111118]/60 backdrop-blur-md border border-white/10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.2)]">등록된 반이 없습니다.</div>
                                    )}
                                    {classes.map((cls) => (
                                        <button
                                            key={cls.id}
                                            onClick={() => handleClassSelect(cls)}
                                            className="w-full relative overflow-hidden text-left py-6 px-7 mb-4 bg-[#0a0a0f]/80 backdrop-blur-md border border-white/10 rounded-3xl hover:border-white/30 shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-[0_15px_40px_rgba(194,0,0,0.15)] hover:-translate-y-1 transition-all duration-500 flex justify-between items-center group"
                                        >
                                            <div className="flex flex-col z-10">
                                                <span className="text-[0.6rem] font-bold text-[#c20000] mb-2 tracking-[0.2em] uppercase origin-left transition-transform duration-500 focus:scale-105 drop-shadow-[0_0_5px_rgba(194,0,0,0.5)]">수강하는 반 선택</span>
                                                <span className="font-semibold text-2xl tracking-tight text-slate-300 group-hover:text-white transition-colors">{cls.name}</span>
                                            </div>
                                            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center bg-white/5 group-hover:bg-[#c20000] group-hover:border-[#c20000] group-hover:text-white transition-all duration-500 z-10 shrink-0 shadow-sm text-slate-400">
                                                <ChevronRight size={20} strokeWidth={1.5} className="group-hover:translate-x-0.5 transition-transform duration-300" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-6">
                                    {!isAuthenticatedWeek ? (
                                        <>
                                            <button 
                                                onClick={() => setSelectedClass(null)}
                                                className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-white transition-colors w-fit group"
                                            >
                                                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 다른 반 선택하기
                                            </button>
                                            
                                            <div className="px-7 py-8 bg-[#0a0a0f]/80 backdrop-blur-md border border-white/10 rounded-3xl mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex flex-col justify-center">
                                                <p className="text-[0.65rem] text-[#c20000] uppercase tracking-[0.25em] font-bold mb-3 drop-shadow-[0_0_5px_rgba(194,0,0,0.5)]">학습 라이브러리</p>
                                                <h3 className="font-bold text-3xl tracking-tight text-white">{selectedClass.name}</h3>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 pb-12">
                                                {weeks.length === 0 && !isLoading && (
                                                    <div className="col-span-2 text-center py-10 bg-[#0a0a0f]/80 backdrop-blur-md border border-white/10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.2)] text-slate-400 text-sm">등록된 주차가 없습니다.</div>
                                                )}
                                                {weeks.map((week) => (
                                                    <button
                                                        key={week.id}
                                                        onClick={() => handleWeekSelect(week)}
                                                        className="group bg-[#0a0a0f]/80 backdrop-blur-md border border-white/10 rounded-3xl p-6 text-center shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-[0_15px_40px_rgba(194,0,0,0.15)] hover:-translate-y-1 transition-all duration-500 flex flex-col items-center justify-center hover:border-white/30"
                                                    >
                                                        <span className="font-bold text-xl tracking-tight text-slate-300 group-hover:text-white transition-colors">Week {week.week_number}</span>
                                                        <div className="w-8 h-[2px] bg-white/10 my-4 group-hover:bg-[#c20000] group-hover:w-12 group-hover:shadow-[0_0_10px_rgba(194,0,0,0.8)] transition-all duration-500" />
                                                        <span className="text-[0.7rem] font-medium text-slate-500 group-hover:text-[#ff6666] transition-colors tracking-widest">{week.date_range}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <button 
                                                onClick={() => setIsAuthenticatedWeek(false)}
                                                className="flex items-center gap-2 text-sm font-bold text-[#c20000] hover:text-[#ff6666] transition-colors w-fit drop-shadow-sm"
                                            >
                                                <ArrowLeft size={16} /> 주차 선택으로 돌아가기
                                            </button>

                                            <div className="w-full flex items-end justify-between border-b-2 border-white/20 pb-3 mb-2">
                                                <div>
                                                    <h3 className="font-black text-2xl uppercase tracking-wider text-white">Week {selectedWeek.week_number}</h3>
                                                    <p className="text-sm font-bold text-[#c20000] mt-1 drop-shadow-sm">{selectedWeek.date_range}</p>
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
                            className="bg-[#111118] border border-white/20 rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_15px_50px_rgba(0,0,0,0.5)]"
                        >
                            <div className="bg-[#c20000] text-white p-4 text-center relative border-b border-[#c20000]/50 shadow-[0_4px_20px_rgba(194,0,0,0.4)]">
                                <Lock size={24} className="mx-auto mb-2 drop-shadow-md" />
                                <h3 className="font-bold text-lg drop-shadow-md">보안 잠금 해제</h3>
                                <p className="text-xs opacity-90 mt-1 font-bold tracking-widest">WEEK {selectedWeek.week_number} ({selectedWeek.date_range})</p>
                                <button onClick={() => setShowPasswordModal(false)} className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handlePasswordSubmit} className="p-6">
                                <p className="text-sm text-center font-bold text-slate-300 mb-4 tracking-wide leading-relaxed">강사님께서 안내해주신<br/>해당 주차의 비밀번호를 입력해주세요.</p>
                                <input 
                                    type="password" autoFocus placeholder="비밀번호 입력..." 
                                    className="w-full text-center text-xl tracking-[0.3em] font-bold p-3 bg-white/5 border border-white/20 text-white placeholder-slate-500 rounded-lg focus:outline-none focus:border-[#c20000] focus:ring-2 focus:ring-[#c20000]/30 transition-all"
                                    value={weekPasswordInput} onChange={(e) => { setWeekPasswordInput(e.target.value); setPasswordError(''); }}
                                />
                                {passwordError && <p className="text-[#ff6666] text-xs text-center mt-3 font-bold">{passwordError}</p>}
                                <button type="submit" className="w-full bg-white text-black font-extrabold py-3.5 rounded-lg mt-5 flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors shadow-md">
                                    <Check size={18} strokeWidth={3} /> 접속하기
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
