"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    Calendar,
    PlayCircle,
    ShieldCheck,
    ClipboardList,
    ChevronRight,
    Lock,
    Search,
    ExternalLink,
    ArrowRight,
    Trophy,
    GraduationCap,
    X,
    Phone,
    MessageCircle,
    Youtube
} from 'lucide-react';
import Image from 'next/image';
import AdminPanel from './AdminPanel';
import { useReportStore } from '@/store/reportStore';

const COLORS = {
    bg: '#050510',
    card: '#0f1120',
    primary: '#8b5cf6',
    secondary: '#2563eb',
    accent: '#06b6d4',
    text: '#f8fafc',
    muted: '#94a3b8'
};

const Typewriter = ({ text, delay = 0, loop = false, textClass = "" }: { text: string, delay?: number, loop?: boolean, textClass?: string }) => {
    const [displayed, setDisplayed] = useState('');
    const [started, setStarted] = useState(false);

    useEffect(() => {
        const startTimer = setTimeout(() => setStarted(true), delay);
        return () => clearTimeout(startTimer);
    }, [delay]);

    useEffect(() => {
        if (!started) return;
        if (displayed.length >= text.length) {
            if (loop) {
                const resetTimer = setTimeout(() => setDisplayed(''), 4000);
                return () => clearTimeout(resetTimer);
            }
            return;
        }
        const timer = setTimeout(() => {
            setDisplayed(text.slice(0, displayed.length + 1));
        }, 150);
        return () => clearTimeout(timer);
    }, [started, displayed, text, loop]);

    return (
        <span className="inline-flex items-center">
            <span className={textClass}>{displayed}</span>
            <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className={`inline-block w-[2px] h-[0.9em] bg-blue-400 ml-[4px] ${(displayed.length === text.length && !loop) ? 'opacity-0' : ''}`}
            />
        </span>
    );
};

const StarryBackground = () => {
    const [stars, setStars] = useState<{ id: number; top: string; left: string; size: number; duration: number; delay: number }[]>([]);

    useEffect(() => {
        const generatedStars = Array.from({ length: 60 }).map((_, i) => ({
            id: i,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            size: Math.random() * 2 + 0.5,
            duration: Math.random() * 3 + 2,
            delay: Math.random() * 5,
        }));
        setStars(generatedStars);
    }, []);

    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#050512]">
            {/* Subtle nebula gradients */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px]" />
            <div className="absolute top-[30%] right-[-10%] w-[40%] h-[50%] bg-indigo-900/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] left-[10%] w-[50%] h-[40%] bg-cyan-900/10 rounded-full blur-[120px]" />

            {stars.map((star) => (
                <motion.div
                    key={star.id}
                    className="absolute bg-white rounded-full"
                    style={{
                        top: star.top,
                        left: star.left,
                        width: star.size,
                        height: star.size,
                        boxShadow: `0 0 ${star.size * 2}px rgba(255,255,255,0.8)`,
                    }}
                    animate={{
                        opacity: [0.1, 0.9, 0.1],
                        scale: [0.8, 1.2, 0.8],
                    }}
                    transition={{
                        duration: star.duration,
                        repeat: Infinity,
                        delay: star.delay,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </div>
    );
};

const App = () => {
    const [activeTab, setActiveTab] = useState('home');
    const [scrolled, setScrolled] = useState(false);
    const [isAdminOpen, setIsAdminOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen font-sans text-slate-50 selection:bg-blue-500/30 relative flex flex-col">
            <StarryBackground />

            <div className="relative z-10 flex-1 flex flex-col">
                {/* ── Header ── */}
                <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-black/60 backdrop-blur-md border-b border-white/10 py-3' : 'bg-transparent py-5'}`}>
                    <div className="px-6 flex justify-between items-center max-w-5xl mx-auto">
                        <h1 className="text-xl sm:text-2xl font-black tracking-tighter drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]">
                            <Typewriter text="김효진 영어" delay={500} loop={true} textClass="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent" />
                        </h1>
                        <div className="flex items-center gap-3">
                            <a href="https://open.kakao.com/o/sY6xBxji" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-[#FEE500] hover:bg-[#ffe833] text-[#371d1e] flex items-center justify-center text-xs shadow-lg transition-transform hover:scale-110" title="카카오톡 상담">
                                <MessageCircle size={16} fill="currentColor" strokeWidth={0} />
                            </a>
                            <a href="#" className="w-8 h-8 rounded-full bg-[#03C75A] hover:bg-[#04d661] text-white flex items-center justify-center text-xs font-bold shadow-lg transition-transform hover:scale-110" title="네이버 블로그">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                    <path d="M16.273 12.844L9.088 2.502H3.14V21.5h6.046v-10.43l7.26 10.43h5.88V2.502h-5.99v10.342z" />
                                </svg>
                            </a>
                            <a href="#" className="w-8 h-8 rounded-full bg-[#FF0000] hover:bg-[#ff3333] text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110" title="유튜브">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                </svg>
                            </a>
                            <a href="tel:010-7590-6260" className="w-8 h-8 rounded-full bg-slate-100 hover:bg-white text-slate-800 flex items-center justify-center shadow-lg transition-transform hover:scale-110" title="전화 상담">
                                <Phone size={14} fill="currentColor" strokeWidth={0} />
                            </a>
                        </div>
                    </div>
                </header>

                {/* ── Main ── */}
                <main className="pb-24 pt-20 overflow-hidden">
                    <AnimatePresence mode="wait">
                        {activeTab === 'home' && <HomeSection key="home" />}
                        {activeTab === 'timetable' && <TimetableSection key="timetable" />}
                        {activeTab === 'video' && <VideoSection key="video" />}
                        {activeTab === 'management' && <ManagementSection key="management" />}
                        {activeTab === 'report' && <ReportSection key="report" />}
                    </AnimatePresence>
                </main>

                {/* ── Admin Hidden Toggle ── */}
                <button
                    onClick={() => setIsAdminOpen(true)}
                    className="fixed bottom-32 right-6 p-3 bg-black/40 backdrop-blur-md border border-white/5 rounded-full text-slate-800 hover:text-rose-500 hover:bg-black/60 transition-all z-40"
                >
                    <Lock size={16} />
                </button>

                <AnimatePresence>
                    {isAdminOpen && <AdminPanel onClose={() => setIsAdminOpen(false)} />}
                </AnimatePresence>

                {/* ── Bottom Tab Bar ── */}
                <nav className="fixed bottom-0 w-full z-50 px-4 pb-6">
                    <div className="max-w-md mx-auto bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl flex justify-around items-center p-2 shadow-2xl shadow-blue-500/20">
                        <TabButton id="home" icon={<User size={20} />} label="강사소개" activeTab={activeTab} setActiveTab={setActiveTab} />
                        <TabButton id="timetable" icon={<Calendar size={20} />} label="시간표" activeTab={activeTab} setActiveTab={setActiveTab} />
                        <TabButton id="video" icon={<PlayCircle size={20} />} label="수업영상" activeTab={activeTab} setActiveTab={setActiveTab} />
                        <TabButton id="management" icon={<ShieldCheck size={20} />} label="수업 및 관리" activeTab={activeTab} setActiveTab={setActiveTab} />
                        <TabButton id="report" icon={<ClipboardList size={20} />} label="리포트" activeTab={activeTab} setActiveTab={setActiveTab} />
                    </div>
                </nav>
            </div>
        </div>
    );
};

const TabButton = ({ id, icon, label, activeTab, setActiveTab }: any) => {
    const isActive = activeTab === id;
    return (
        <button
            onClick={() => setActiveTab(id)}
            className={`relative flex flex-col items-center p-2 transition-all duration-300 ${isActive ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
            {isActive && (
                <motion.div layoutId="activeTab" className="absolute -top-1 w-1 h-1 bg-blue-400 rounded-full" />
            )}
            {icon}
            <span className="text-[10px] mt-1 font-medium">{label}</span>
        </button>
    );
};

const SectionWrapper = ({ children }: { children: React.ReactNode }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="px-6"
    >
        {children}
    </motion.div>
);

const HomeSection = () => {
    const [reveal, setReveal] = useState(false);
    const [isBioModalOpen, setIsBioModalOpen] = useState(false);
    const [isHofModalOpen, setIsHofModalOpen] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setReveal(true), 400);
        return () => clearTimeout(timer);
    }, []);

    return (
        <SectionWrapper>
            <div className="relative flex flex-col justify-center items-center text-center pt-10 pb-0">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 via-transparent to-transparent pointer-events-none" />

                <div className="relative w-full">
                    <motion.p
                        animate={{ opacity: reveal ? 1 : 0, y: reveal ? 0 : 8 }}
                        transition={{ duration: 0.6 }}
                        className="text-slate-400 text-sm mb-3"
                    >
                        흐릿한 영어에서, 정답이 '보이는' 영어로.
                    </motion.p>

                    <motion.h2
                        initial={{ scale: 0.96, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-3xl font-extrabold leading-tight tracking-tight mb-2"
                    >
                        필연적 정답을 설계하는<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500">
                            고해상도 영어
                        </span>
                    </motion.h2>
                </div>
            </div>

            <div className="space-y-6 mb-6">

                {/* ── 프로필 & 이력 섹션 (Melt into background) ── */}
                <div className="relative flex flex-col items-center mt-0 mb-12">
                    {/* 배경 효과 */}
                    <div className="absolute top-10 right-0 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl -mr-16" />
                    <div className="absolute bottom-10 left-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl -ml-10" />

                    {/* 프로필 사진 컨테이너 */}
                    <div className="relative z-10 w-full flex justify-center mt-4">

                        {/* 명예의 전당 (좌측 독립 트로피) */}
                        <div className="absolute left-4 sm:left-12 top-1/2 -translate-y-1/2 z-20 hidden sm:flex flex-col items-center">
                            <button
                                onClick={() => setIsHofModalOpen(true)}
                                className="group flex flex-col items-center justify-center transition-transform hover:scale-110 duration-300"
                            >
                                <div className="text-[50px] drop-shadow-[0_0_15px_rgba(250,204,21,0.6)] group-hover:drop-shadow-[0_0_25px_rgba(250,204,21,0.9)] transition-all">
                                    🏆
                                </div>
                                <span className="mt-2 text-xs font-black text-yellow-400 drop-shadow-md tracking-wider border-b border-yellow-400/30 pb-0.5">명예의 전당</span>
                            </button>
                        </div>

                        {/* 프로필 사진 */}
                        <div className="w-64 h-72 md:w-80 md:h-96 flex items-end justify-center overflow-visible transition-transform duration-500 hover:scale-105 relative z-10 pt-4">
                            <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[#050510] to-transparent z-20 pointer-events-none" />
                            <Image
                                src="/images/profile3.png"
                                alt="김효진 강사"
                                fill
                                className="object-contain object-bottom drop-shadow-[0_0_30px_rgba(59,130,246,0.3)] z-10"
                                sizes="(max-width: 768px) 256px, 320px"
                                priority
                            />
                        </div>

                        {/* 모바일 뷰 전용 명예의 전당 */}
                        <div className="absolute left-2 top-8 z-20 sm:hidden flex flex-col items-center">
                            <button
                                onClick={() => setIsHofModalOpen(true)}
                                className="group flex flex-col items-center justify-center transition-transform hover:scale-110 duration-300"
                            >
                                <div className="text-[36px] drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]">
                                    🏆
                                </div>
                                <span className="mt-1 text-[9px] font-black text-yellow-400 drop-shadow-md tracking-wider bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm">명예의 전당</span>
                            </button>
                        </div>
                    </div>

                    <div className="w-full text-center space-y-4 relative z-10 px-4 mt-6">
                        <p className="text-blue-300/80 font-medium text-sm tracking-wide">
                            대형강의에 끼워맞추지 않습니다.
                        </p>
                        <h3 className="text-white/90 font-semibold text-xl mb-4 flex items-center justify-center gap-2 drop-shadow-md pt-1 pb-2">
                            정체된 영어 성적, 원인부터 찾습니다.
                        </h3>
                        <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-medium">
                            <span className="text-slate-300">개별 진단</span> <ArrowRight size={14} className="inline text-blue-400/50 mx-1" /> <span className="text-slate-300">맞춤 커리큘럼</span> <ArrowRight size={14} className="inline text-blue-400/50 mx-1" /> <span className="text-yellow-400 font-semibold tracking-wide drop-shadow-md">[낭비 없는 고득점]</span>
                        </p>

                        {/* 이력 보기 버튼 */}
                        <button
                            onClick={() => setIsBioModalOpen(true)}
                            className="mt-8 w-full max-w-sm mx-auto py-3.5 bg-blue-600/20 border border-blue-500/30 text-blue-200 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-600/40 hover:-translate-y-0.5 transition-all shadow-lg backdrop-blur-sm"
                        >
                            <GraduationCap size={18} /> 강사 이력 및 약력 보기
                        </button>
                    </div>
                </div>

                {/* 약력 모달 */}
                <AnimatePresence>
                    {isBioModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                onClick={() => setIsBioModalOpen(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-slate-900 border border-white/10 w-full max-w-md rounded-3xl p-6 relative z-10 shadow-2xl"
                            >
                                <button
                                    onClick={() => setIsBioModalOpen(false)}
                                    className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 transition-colors"
                                >
                                    <X size={20} />
                                </button>

                                <div className="text-center mb-6">
                                    <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-400">
                                        <GraduationCap size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">강사 이력</h3>
                                </div>

                                <div className="space-y-6 text-left">
                                    <div className="flex gap-3 items-start">
                                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                                        <ul className="text-sm text-slate-300 space-y-2.5 leading-relaxed">
                                            <li><strong className="text-white">동국대학교 영어통번역학</strong> 졸업</li>
                                            <li>영화제 통역, 해외사 협업 프로젝트 번역<br /><span className="text-slate-500 text-xs">(도시재생연구원 근무)</span></li>
                                        </ul>
                                    </div>
                                    <div className="flex gap-3 items-start">
                                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                                        <ul className="text-sm text-slate-300 space-y-2.5 leading-relaxed">
                                            <li>목동, 강서, 일산지역 중, 고등부 전임</li>
                                            <li>이화여고, 진명여고, 영일고 등 사립고 내신대비 다수</li>
                                        </ul>
                                    </div>

                                    <div className="bg-slate-950 p-4 rounded-2xl border border-white/5">
                                        <div className="text-xs space-y-2.5 text-slate-400 grid grid-cols-1 gap-x-4">
                                            <p className="flex items-center gap-3"><span className="text-emerald-400 font-bold bg-emerald-400/10 px-2 py-1 rounded">現</span> <span className="text-slate-200">검단 우독학원</span></p>
                                            <p className="flex items-center gap-3"><span className="text-slate-500 bg-slate-800 px-2 py-1 rounded">前</span> 화정 이강학원</p>
                                            <p className="flex items-center gap-3"><span className="text-slate-500 bg-slate-800 px-2 py-1 rounded">前</span> 송도 세정학원</p>
                                            <p className="flex items-center gap-3"><span className="text-slate-500 bg-slate-800 px-2 py-1 rounded">前</span> 검단 명인학원</p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsBioModalOpen(false)}
                                    className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors"
                                >
                                    닫기
                                </button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* 명예의 전당 모달 (Tailwind CSS 기반 디자인 복원) */}
                <AnimatePresence>
                    {isHofModalOpen && (
                        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                                onClick={() => setIsHofModalOpen(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-[#f8f9fc] w-full max-w-lg rounded-3xl p-6 sm:p-8 relative z-10 shadow-2xl max-h-[85vh] overflow-y-auto"
                            >
                                <button
                                    onClick={() => setIsHofModalOpen(false)}
                                    className="absolute top-4 right-4 p-2 bg-slate-200/50 hover:bg-slate-300 rounded-full text-slate-500 transition-colors"
                                >
                                    <X size={20} />
                                </button>

                                {/* Header Image (데이터로 결과로) */}
                                <div className="mb-6 rounded-2xl overflow-hidden border border-slate-200">
                                    <Image
                                        src="/images/hof.png"
                                        alt="명예의 전당 성과 기록"
                                        width={800}
                                        height={600}
                                        className="w-full h-auto object-contain"
                                        priority
                                    />
                                </div>

                                {/* 신규 연동된 기록 (스타일 통일) */}
                                <div className="space-y-4">
                                    <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 relative overflow-hidden text-center mt-6">
                                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-50/50 via-transparent to-yellow-50/50 pointer-events-none" />

                                        <div className="relative z-10">
                                            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                                                <Trophy size={24} className="text-yellow-500" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-800 mb-1 tracking-wide">검단고 1학년 박O은</p>
                                            <p className="text-3xl font-black text-slate-900 mt-2">
                                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-600">1등급 달성</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* ── Text Universe 버튼 ── */}
                <div className="px-2 pb-16 pt-4">
                    <a
                        href="https://genie-text.vercel.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between w-full max-w-sm mx-auto p-4 rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-900/30 to-blue-900/10 hover:border-blue-400/40 transition-all shadow-lg"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-xl border border-blue-500/20">
                                🌌
                            </div>
                            <div className="text-left">
                                <p className="text-base font-bold text-white tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>Text Universe</p>
                                <p className="text-[10px] text-slate-400">학생 복습용 앱 · 구경하기</p>
                            </div>
                        </div>
                        <ExternalLink size={14} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
                    </a>
                </div>
            </div>
        </SectionWrapper>
    );
};

const TimetableSection = () => {
    const schedule = [
        {
            class: '[WOODOK] 아라고2',
            times: [
                { day: '월', time: '20:00 - 22:00', type: '정규' },
                { day: '수', time: '20:00 - 22:00', type: '정규' },
                { day: '금', time: '17:00 - 20:00', type: '클리닉' }
            ]
        },
        {
            class: '[WOODOK] 고3 내신&수능 도약반',
            times: [
                { day: '금', time: '20:30 - 22:30', type: '정규' },
                { day: '토', time: '19:00 - 21:00', type: '정규' }
            ]
        },
        {
            class: '[WOODOK] 아라고1',
            times: [
                { day: '월', time: '18:00 - 20:00', type: '정규' },
                { day: '토', time: '15:00 - 17:00', type: '정규' },
                { day: '금', time: '17:00 - 20:00', type: '클리닉' }
            ]
        },
        {
            class: '[WOODOK] 원당고1',
            times: [
                { day: '월', time: '18:00 - 20:00', type: '정규' },
                { day: '토', time: '15:00 - 17:00', type: '정규' },
                { day: '금', time: '17:00 - 20:00', type: '클리닉' }
            ]
        },
    ];

    return (
        <SectionWrapper>
            <div className="py-8 min-h-[70vh]">
                <h2 className="text-3xl font-extrabold mb-2 tracking-tight">Class Schedule</h2>
                <p className="text-sm text-slate-400 mb-8 border-b border-white/10 pb-4">우독학원 정규반 및 클리닉 시간표</p>
                <div className="space-y-5">
                    {schedule.map((item, idx) => (
                        <div key={idx} className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 relative overflow-hidden group shadow-lg">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors" />

                            <h4 className="text-lg font-bold text-white mb-4 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                    {item.class}
                                </div>
                                <button onClick={() => alert("곧 업로드 예정입니다.")} className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-white/10 transition-colors flex items-center gap-1.5 shadow-sm">
                                    <ClipboardList size={12} /> 강의계획서
                                </button>
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
                                {item.times.map((session, sIdx) => (
                                    <div key={sIdx} className="bg-black/40 border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-sm">
                                                {session.day}
                                            </div>
                                            <span className="text-sm font-medium text-slate-200 tracking-wide">{session.time}</span>
                                        </div>
                                        <span className={`text-[10px] px-2 py-1 rounded-md font-bold tracking-wider ${session.type === '클리닉' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-500 border border-white/10'}`}>
                                            {session.type}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </SectionWrapper>
    );
};

const VideoSection = () => {
    const videos = [
        { title: '[고3] 수능특강 영어', subtitle: '수능특강 지문 로직 분석 및 구조화' },
        { title: '[고2] 내신 영어 지문분석', subtitle: '학교별 기출 기반 변형 포인트 정리' }
    ];
    return (
        <SectionWrapper>
            <div className="py-8 min-h-[70vh]">
                <h2 className="text-3xl font-extrabold mb-8 tracking-tight">강의 영상</h2>
                <div className="space-y-8">
                    {videos.map((v, i) => (
                        <div key={i} className="relative aspect-video bg-slate-800 rounded-3xl overflow-hidden border border-white/10 group cursor-pointer shadow-xl shadow-blue-500/10">
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent z-10" />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-all flex items-center justify-center z-20">
                                <PlayCircle size={64} className="text-white opacity-80 group-hover:scale-110 group-hover:text-blue-400 transition-all drop-shadow-2xl" />
                            </div>
                            <div className="absolute bottom-6 left-6 right-6 z-30">
                                <p className="text-xs text-blue-400 font-bold mb-1 tracking-wider uppercase">SAMPLE 0{i + 1}</p>
                                <h4 className="text-xl font-bold text-white drop-shadow-md">{v.title}</h4>
                                <p className="text-sm text-slate-300 mt-1 drop-shadow-md">{v.subtitle}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </SectionWrapper>
    );
};

const ManagementSection = () => {
    return (
        <SectionWrapper>
            <div className="py-8 min-h-[80vh]">
                <h2 className="text-3xl font-extrabold mb-2 tracking-tight">수업 및 관리</h2>
                <p className="text-sm text-slate-500 mb-8 border-b border-white/10 pb-4">감에 의존하지 않는 정교한 데이터 관리 체계</p>

                <div className="space-y-12">

                    {/* 효진T 전용 교재 시스템 */}
                    <div className="space-y-4">
                        <div className="flex gap-4 sm:gap-6 p-4 sm:p-6 bg-slate-800/50 rounded-3xl border border-white/5 items-start shadow-xl">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-400 mt-1 shrink-0 text-lg">📖</div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>효진T 전용 교재</h3>
                                <p className="text-sm font-bold text-orange-300 mb-2 tracking-wide">
                                    [수업 및 관리 시스템 : 효진T 전용 교재]
                                </p>
                                <div className="space-y-3 mt-4">
                                    <p className="text-xs text-slate-300 leading-relaxed border-l-2 border-orange-900/50 pl-3">
                                        <strong className="text-white block mb-0.5">판서와 100% 동기화된 시스템</strong>
                                        수업 중 판서 구조가 교재에 그대로 이식되어 있습니다.
                                    </p>
                                    <p className="text-xs text-slate-300 leading-relaxed border-l-2 border-orange-900/50 pl-3">
                                        <strong className="text-white block mb-0.5">[지문요약] → [구조화] → [핵심 키워드 각인]</strong>
                                        3단계 필기를 통해, 킬러 문항과 서술형을 선제적으로 공략합니다.
                                    </p>
                                    <p className="text-xs text-slate-300 leading-relaxed border-l-2 border-orange-900/50 pl-3">
                                        <strong className="text-white block mb-0.5">내신 기출 데이터 기반 정밀 설계</strong>
                                        기출 데이터를 분석하여 교재 내에 [빈칸/순서/어법/서술형] 등 학교 시험 출제 확률이 높은 유형만 골라 정밀하게 설계했습니다.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 교재 Image Gallery */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-slate-900/80 border border-white/5 rounded-3xl overflow-hidden p-3 shadow-2xl">
                                <div className="aspect-[3/4] relative rounded-2xl overflow-hidden border border-white/10 group bg-slate-800">
                                    <Image src="/images/book1.jpg" alt="교재 디자인 1" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                                </div>
                            </div>
                            <div className="bg-slate-900/80 border border-white/5 rounded-3xl overflow-hidden p-3 shadow-2xl">
                                <div className="aspect-[3/4] relative rounded-2xl overflow-hidden border border-white/10 group bg-slate-800">
                                    <Image src="/images/book2.jpg" alt="교재 디자인 2" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ClassSync 관리 시스템 */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400"><ClipboardList size={20} /></div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1">ClassSync 시스템</h3>
                                <p className="text-sm font-bold text-blue-300 mb-2">[빈틈없는 성적 방어 시스템]</p>
                                <div className="space-y-3 mt-3">
                                    <p className="text-xs text-slate-300 leading-relaxed border-l-2 border-slate-600 pl-3">
                                        <strong className="text-white block mb-0.5">이월(Carry-over) 로직: "모르면 넘어갈 수 없다."</strong>
                                        미완료 과제는 캘린더에 자동 누적되어 완료 시까지 끝까지 추적합니다.
                                    </p>
                                    <p className="text-xs text-slate-300 leading-relaxed border-l-2 border-slate-600 pl-3">
                                        <strong className="text-white block mb-0.5">100% 동기화 관리</strong>
                                        강사가 직접 설계한 시스템으로 출결부터 보강까지, 학습의 모든 공백을 데이터로 메웁니다.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900/80 border border-white/5 rounded-3xl overflow-hidden p-4 sm:p-6 space-y-4 shadow-2xl">
                            <div className="aspect-[16/10] relative rounded-2xl overflow-hidden border border-white/10 group">
                                <Image src="/images/sync1.jpg" alt="ClassSync Dashboard" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="aspect-video relative rounded-2xl overflow-hidden border border-white/10 group">
                                    <Image src="/images/sync2.jpg" alt="Attendance Detail" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                                </div>
                                <div className="aspect-video relative rounded-2xl overflow-hidden border border-white/10 group">
                                    <Image src="/images/sync3.jpg" alt="Message Setup" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Text Universe 시스템 */}
                    <div className="space-y-4">
                        <div className="flex gap-4 sm:gap-6 mt-8 p-4 sm:p-6 bg-slate-800/50 rounded-3xl border border-white/5 items-start">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400 mt-1 shrink-0">🌌</div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Text Universe</h3>
                                <p className="text-sm font-bold text-blue-300 mb-2 tracking-wide">
                                    "복제 불가능한 효진T 직접 설계 툴, 그 차이가 '압도적 격차'를 만듭니다."
                                </p>
                                <div className="space-y-3 mt-4">
                                    <p className="text-xs text-slate-300 leading-relaxed border-l-2 border-blue-900/50 pl-3">
                                        <strong className="text-white block mb-0.5">All-Pass 아카이빙</strong>
                                        수업에서 다룬 모든 지문의 강의를 유튜브 DB로 구축. 놓친 문장, 흐려진 개념은 클릭 한 번으로 즉시 복구합니다.
                                    </p>
                                    <p className="text-xs text-slate-300 leading-relaxed border-l-2 border-blue-900/50 pl-3">
                                        <strong className="text-white block mb-0.5">Active Output 판서</strong>
                                        단순히 받아적는 판서가 아닙니다. 효진T가 직접 설계한 구조도를 통해, 학생이 스스로 지문의 논리를 인출(Output)하도록 훈련합니다.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Text Universe Image Gallery */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                            <div className="bg-slate-900/80 border border-white/5 rounded-3xl overflow-hidden p-3 shadow-2xl">
                                <div className="aspect-[16/10] relative rounded-2xl overflow-hidden border border-white/10 group">
                                    <Image src="/images/universe.jpg" alt="Text Universe 구조" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                                </div>
                            </div>
                            <div className="bg-slate-900/80 border border-white/5 rounded-3xl overflow-hidden p-3 shadow-2xl">
                                <div className="aspect-[16/10] relative rounded-2xl overflow-hidden border border-white/10 group bg-black/50">
                                    <Image src="/images/tu1.jpg" alt="Text Universe 화면 1" fill className="object-contain group-hover:scale-105 transition-transform duration-700" />
                                </div>
                            </div>
                            <div className="bg-slate-900/80 border border-white/5 rounded-3xl overflow-hidden p-3 shadow-2xl">
                                <div className="aspect-[16/10] relative rounded-2xl overflow-hidden border border-white/10 group bg-black/50">
                                    <Image src="/images/tu2.jpg" alt="Text Universe 화면 2" fill className="object-contain group-hover:scale-105 transition-transform duration-700" />
                                </div>
                            </div>
                            <div className="bg-slate-900/80 border border-white/5 rounded-3xl overflow-hidden p-3 shadow-2xl">
                                <div className="aspect-[16/10] relative rounded-2xl overflow-hidden border border-white/10 group bg-black/50">
                                    <Image src="/images/tu3.jpg" alt="Text Universe 화면 3" fill className="object-contain group-hover:scale-105 transition-transform duration-700" />
                                </div>
                            </div>
                            <div className="bg-slate-900/80 border border-white/5 rounded-3xl overflow-hidden p-3 shadow-2xl sm:col-span-2 lg:col-span-2">
                                <div className="aspect-[21/9] relative rounded-2xl overflow-hidden border border-white/10 group bg-black/50">
                                    <Image src="/images/tu4.jpg" alt="Text Universe 화면 4" fill className="object-contain group-hover:scale-105 transition-transform duration-700" />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </SectionWrapper>
    );
};

const ReportSection = () => {
    const [step, setStep] = useState<'class' | 'student' | 'password' | 'view'>('class');
    const { classes, seedSampleData } = useReportStore();

    useEffect(() => {
        seedSampleData();
    }, [seedSampleData]);

    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);

    // Viewer state
    const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');

    const activeClass = classes.find(c => c.id === selectedClassId);
    const activeStudent = activeClass?.students.find(s => s.id === selectedStudentId);

    const handleLogin = () => {
        if (password === '1234') { // Hardcoded for MVP
            setStep('view');
            setError(false);
        } else {
            setError(true);
            setTimeout(() => setError(false), 1000);
        }
    };

    const currentReportHtml = activeStudent?.report[`${reportType}Html`] || `<div class="text-center text-slate-500 py-10">아직 등록된 리포트가 없습니다.</div>`;

    return (
        <SectionWrapper>
            <div className="py-8 min-h-[60vh]">
                <h2 className="text-2xl font-bold mb-2">Student Report</h2>
                <p className="text-sm text-slate-500 mb-8">내 아이의 학습 분석 리포트</p>

                <AnimatePresence mode="wait">

                    {step === 'class' && (
                        <motion.div key="class" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">

                            {/* 리포트 샘플 바로보기 버튼 */}
                            <div className="mb-8">
                                <button
                                    onClick={() => {
                                        setSelectedClassId('c-sample');
                                        setSelectedStudentId('s-sample');
                                        setStep('view');
                                    }}
                                    className="w-full p-5 bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-500 hover:to-blue-500 rounded-2xl flex items-center justify-between transition-all shadow-lg shadow-blue-500/20 group border border-blue-400/30"
                                >
                                    <div className="flex items-center gap-4 text-left">
                                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur-sm group-hover:scale-110 transition-transform">
                                            <Search size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold text-lg leading-tight">리포트 샘플 보기</h3>
                                            <p className="text-blue-200 text-xs mt-1 font-medium">실제 학부모님용 리포트 예시입니다.</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={24} className="text-white/70 group-hover:text-white transition-colors group-hover:translate-x-1" />
                                </button>
                            </div>

                            <h3 className="text-sm font-bold text-slate-300 mb-4 px-2 tracking-wide border-t border-white/5 pt-6">또는 소속 반을 선택해주세요</h3>
                            <div className="space-y-2">
                                {classes.filter(c => c.id !== 'c-sample').map((c) => (
                                    <button
                                        key={c.id}
                                        onClick={() => { setSelectedClassId(c.id); setStep('student'); }}
                                        className="w-full p-4 bg-slate-900/80 hover:bg-slate-800 border border-white/5 rounded-xl text-left text-sm flex justify-between items-center transition-colors shadow-lg group"
                                    >
                                        <span className="font-semibold text-blue-300 group-hover:text-blue-200 transition-colors">{c.name}</span>
                                        <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                                    </button>
                                ))}
                                {classes.filter(c => c.id !== 'c-sample').length === 0 && <div className="text-center text-sm text-slate-500 py-4">등록된 반이 없습니다.</div>}
                            </div>
                        </motion.div>
                    )}

                    {step === 'student' && activeClass && (
                        <motion.div key="student" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                            <div className="flex items-center gap-2 px-2 mb-4">
                                <button onClick={() => setStep('class')} className="text-slate-500 hover:text-white"><ArrowRight size={16} className="rotate-180" /></button>
                                <h3 className="text-sm font-bold text-slate-300">{activeClass.name} - 2. 학생 선택</h3>
                            </div>
                            <div className="relative mb-4">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input type="text" placeholder="이름 검색" className="w-full bg-slate-900 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
                            </div>
                            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                                {activeClass.students.map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => { setSelectedStudentId(s.id); setStep('password'); }}
                                        className="w-full p-4 bg-slate-900/80 hover:bg-slate-800 border border-white/5 rounded-xl text-left text-sm flex justify-between items-center transition-colors shadow-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                                                {s.name.charAt(0)}
                                            </div>
                                            <span className="font-medium text-white">{s.name}</span>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-600" />
                                    </button>
                                ))}
                                {activeClass.students.length === 0 && <div className="text-center text-sm text-slate-500 py-4">이 반에는 등록된 학생이 없습니다.</div>}
                            </div>
                        </motion.div>
                    )}

                    {step === 'password' && activeStudent && (
                        <motion.div key="password" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="bg-slate-900 p-8 rounded-2xl border border-white/10 text-center shadow-2xl">
                            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/20 text-blue-400">
                                <Lock size={24} />
                            </div>
                            <h3 className="text-lg font-bold mb-1">{activeStudent.name} 학생</h3>
                            <p className="text-xs text-blue-300/60 mb-6">{activeClass?.name}</p>

                            <p className="text-xs text-slate-400 mb-6">부여받은 열람 비밀번호를 입력하세요. <br />(테스트용: 1234)</p>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full bg-black border ${error ? 'border-rose-500' : 'border-white/10'} rounded-xl py-4 text-center text-xl tracking-[1em] focus:outline-none focus:border-blue-500 transition-all mb-4`}
                                placeholder="****"
                                autoFocus
                            />
                            <div className="flex gap-2 mt-6">
                                <button onClick={() => setStep('student')} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-bold transition-colors">이전으로</button>
                                <button onClick={handleLogin} className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-bold shadow-lg shadow-blue-900/40 transition-colors">리포트 확인</button>
                            </div>
                        </motion.div>
                    )}

                    {step === 'view' && activeStudent && (
                        <motion.div key="view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

                            {/* Header */}
                            <div className="flex justify-between items-start bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                                <div>
                                    <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                                        {activeStudent.name} <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-medium">{activeClass?.name}</span>
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1">최신 학습 데이터가 반영되었습니다.</p>
                                </div>
                                <button onClick={() => { setStep('class'); setPassword(''); }} className="text-[10px] text-blue-400 border border-blue-400/30 hover:bg-blue-400/10 px-3 py-1.5 rounded-lg transition-colors">
                                    로그아웃
                                </button>
                            </div>

                            {/* Toggle Buttons */}
                            <div className="flex gap-2 bg-slate-900 border border-white/5 p-1 rounded-xl">
                                {(['daily', 'weekly', 'monthly'] as const).map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setReportType(type)}
                                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${reportType === type ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                    >
                                        {type === 'daily' ? '일간' : type === 'weekly' ? '주간' : '월간'} 리포트
                                    </button>
                                ))}
                            </div>

                            {/* Rendered HTML Content */}
                            <div className="bg-white text-slate-900 min-h-[300px] rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                                {/* This renders the raw HTML stored by the admin */}
                                <div className="prose prose-sm prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: currentReportHtml }} />

                                {/* Fallback button if link exists but HTML rendering has issues (optional) */}
                                {activeStudent.report[`${reportType}Link`] && (
                                    <a
                                        href={activeStudent.report[`${reportType}Link`]}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="absolute bottom-4 right-4 bg-slate-900 text-white text-[10px] px-3 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-slate-800 transition-colors"
                                    >
                                        원본 링크 열기 <ExternalLink size={12} />
                                    </a>
                                )}
                            </div>

                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </SectionWrapper>
    );
};

export default App;
