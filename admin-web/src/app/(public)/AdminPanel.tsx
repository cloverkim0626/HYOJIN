import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReportStore } from '@/store/reportStore';
import { Lock, X, Plus, Trash2, Edit3, Save, LayoutDashboard, Calendar, FileText, CheckCircle2 } from 'lucide-react';

export default function AdminPanel({ onClose }: { onClose: () => void }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);

    const { classes, addClass, deleteClass, addStudent, deleteStudent, saveStudentReport } = useReportStore();

    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

    // New Item states
    const [newClassName, setNewClassName] = useState('');
    const [newStudentName, setNewStudentName] = useState('');

    // Active report states
    const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'admin123') {
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
        // Default to today
        const today = new Date().toISOString().split('T')[0];
        setFormData(prev => ({ ...prev, published_date: today }));
    };

    // --- Form State ---
    const [formData, setFormData] = useState({
        published_date: '',
        attendance_status: '정상 등원 완료',
        lesson_content: '',
        hw_name: '',
        hw_status: '미완료', // 완료, 미완료, 보류 등
        hw_plan: '',
        next_date_str: '',
        next_content: '',
        teacher_comment: '',
        tests: [{ name: '', desc: '', score: '', total: '', avg: '' }]
    });

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleTestChange = (index: number, field: string, value: string) => {
        const newTests = [...formData.tests];
        newTests[index] = { ...newTests[index], [field]: value };
        setFormData({ ...formData, tests: newTests });
    };

    const addTest = () => {
        setFormData({ ...formData, tests: [...formData.tests, { name: '', desc: '', score: '', total: '', avg: '' }] });
    };

    const removeTest = (index: number) => {
        const newTests = formData.tests.filter((_, i) => i !== index);
        setFormData({ ...formData, tests: newTests });
    };

    const handleSaveReport = async () => {
        if (!selectedClassId || !selectedStudentId) return;

        const activeClass = classes.find(c => c.id === selectedClassId);
        const activeStudent = activeClass?.students.find(s => s.id === selectedStudentId);
        const template = activeClass?.templates.find(t => t.reportType === reportType);

        if (!activeClass || !activeStudent) return;

        let templateHtml = template?.templateHtml || '<div style="text-align:center; padding: 40px;">반 템플릿이 설정되지 않았습니다.</div>';

        // 1. Process Tests
        let testsHtml = '';
        if (formData.tests.length > 0 && formData.tests[0].name !== '') {
            formData.tests.forEach(test => {
                const scoreNowNum = parseFloat(test.score) || 0;
                const scoreTotalNum = parseFloat(test.total) || 100;
                const avgScoreNum = parseFloat(test.avg) || 0;

                const scorePercent = scoreTotalNum > 0 ? (scoreNowNum / scoreTotalNum) * 100 : 0;
                const avgPercent = scoreTotalNum > 0 ? (avgScoreNum / scoreTotalNum) * 100 : 0;

                const isBelowAvg = scoreNowNum < avgScoreNum;

                testsHtml += `
        <div class="test-item">
            <div class="test-flex">
                <div>
                    <p class="test-title" style="${isBelowAvg ? 'color:var(--point-red)' : ''}">${test.name}</p>
                    <p class="test-desc">${test.desc}</p>
                </div>
                <div class="score-group">
                    <span class="score-big" style="${isBelowAvg ? 'color:var(--point-red)' : ''}">${test.score}</span><span class="score-small">/${test.total}</span>
                </div>
            </div>
            <div class="chart-bg">
                <div class="chart-bar" style="width: ${scorePercent}%; ${isBelowAvg ? 'background:var(--point-red);' : ''}"></div>
                <div class="avg-dot" style="left: ${avgPercent}%;"></div>
            </div>
            <div class="chart-info">
                <span style="${isBelowAvg ? 'color:var(--point-red)' : ''}">${isBelowAvg ? '평균 대비 보완 필요' : '달성률: ' + scorePercent.toFixed(1) + '%'}</span>
                <span>반 평균: ${test.avg}점</span>
            </div>
        </div>`;
            });
        }

        // 2. Format Date (e.g. 2026.03.04 수요일)
        const d = new Date(formData.published_date);
        const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
        const formattedDate = !isNaN(d.getTime()) ? `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${days[d.getDay()]}` : formData.published_date;

        // 3. Status Badges
        let hwBadgeClass = 'badge-gray';
        if (formData.hw_status === '완료') hwBadgeClass = 'badge-blue';
        else if (formData.hw_status === '미완료') hwBadgeClass = 'badge-red';

        const hwPlanDisplay = formData.hw_status === '완료' ? 'none' : 'block';

        // 4. Replace Variables
        const variables: Record<string, string> = {
            '{{student_name}}': activeStudent.name,
            '{{class_name}}': activeClass.name.replace('[WOODOK] ', ''), // Remove prefix if wanted
            '{{published_date_kr}}': formattedDate,
            '{{attendance_status}}': formData.attendance_status,
            '{{lesson_content}}': formData.lesson_content,
            '{{hw_name}}': formData.hw_name,
            '{{hw_status}}': formData.hw_status,
            '{{hw_badge_class}}': hwBadgeClass,
            '{{hw_plan_display}}': hwPlanDisplay,
            '{{hw_plan}}': formData.hw_plan,
            '{{next_date_str}}': formData.next_date_str,
            '{{next_content}}': formData.next_content,
            '{{teacher_comment}}': formData.teacher_comment,
            '{{tests_html}}': testsHtml,
            '{{contact_link}}': 'https://open.kakao.com/o/sY6xBxji' // Hardcoded for now
        };

        for (const [key, value] of Object.entries(variables)) {
            templateHtml = templateHtml.split(key).join(value);
        }

        await saveStudentReport(selectedStudentId, reportType, formData.published_date, templateHtml, formData);
        alert('리포트가 성공적으로 저장되었습니다!');
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
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed inset-0 z-[100] bg-[#050510] flex flex-col overflow-hidden text-slate-200">
            {/* Admin Header */}
            <header className="bg-slate-900 border-b border-white/10 p-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-rose-500/20 rounded-lg flex items-center justify-center text-rose-400">
                        <LayoutDashboard size={20} />
                    </div>
                    <div>
                        <h2 className="font-bold text-white leading-tight">스마트 리포트 생성기</h2>
                        <p className="text-[10px] text-slate-400">폼에 맞춰 입력하면 템플릿에 맞게 자동 완성됩니다.</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 bg-white/5 rounded-lg text-slate-300 hover:bg-white/10 transition-colors">
                    <X size={20} />
                </button>
            </header>

            {/* Admin Content */}
            <div className="flex-1 flex overflow-hidden">

                {/* Left Column: Classes */}
                <div className="w-64 border-r border-white/10 bg-slate-900/50 flex flex-col shrink-0">
                    <div className="p-4 border-b border-white/10">
                        <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">클래스 목록</h3>
                        <div className="flex gap-2">
                            <input value={newClassName} onChange={e => setNewClassName(e.target.value)} placeholder="새로운 반 이름" className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-rose-500" />
                            <button onClick={handleAddClass} className="bg-rose-600 p-2 rounded-lg hover:bg-rose-500 transition-colors"><Plus size={16} /></button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {classes.map(c => (
                            <div key={c.id} className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${selectedClassId === c.id ? 'bg-rose-500/20 border border-rose-500/30 text-white' : 'hover:bg-white/5 border border-transparent'}`} onClick={() => { setSelectedClassId(c.id); setSelectedStudentId(null); }}>
                                <span className="text-sm font-medium truncate pr-2">{c.name}</span>
                                <button onClick={(e) => { e.stopPropagation(); deleteClass(c.id); }} className="text-slate-600 hover:text-rose-400"><Trash2 size={14} /></button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Middle Column: Students */}
                <div className="w-64 border-r border-white/10 bg-slate-900/30 flex flex-col shrink-0">
                    {!selectedClassId ? (
                        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">반을 선택해주세요.</div>
                    ) : (
                        <>
                            <div className="p-4 border-b border-white/10">
                                <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">학생 목록</h3>
                                <div className="flex gap-2">
                                    <input value={newStudentName} onChange={e => setNewStudentName(e.target.value)} placeholder="학생 이름 추가" className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-rose-500" />
                                    <button onClick={handleAddStudent} className="bg-rose-600 p-2 rounded-lg hover:bg-rose-500 transition-colors"><Plus size={16} /></button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                {activeClass?.students.map(s => (
                                    <div key={s.id} className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${selectedStudentId === s.id ? 'bg-rose-500/20 border border-rose-500/30 text-white' : 'hover:bg-white/5 border border-transparent'}`} onClick={() => openStudentEditor(s)}>
                                        <span className="text-sm font-medium truncate pr-2">{s.name}</span>
                                        <button onClick={(e) => { e.stopPropagation(); deleteStudent(selectedClassId, s.id); }} className="text-slate-600 hover:text-rose-400"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                                {activeClass?.students.length === 0 && <div className="text-center text-xs text-slate-500 py-4">등록된 학생이 없습니다.</div>}
                            </div>
                        </>
                    )}
                </div>

                {/* Right Column: Form Editor */}
                <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
                    {!activeStudent ? (
                        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">리포트를 작성할 학생을 선택하세요.</div>
                    ) : (
                        <>
                            <div className="p-4 border-b border-white/10 bg-slate-900 shrink-0">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Edit3 size={18} className="text-rose-400" />
                                        {activeStudent.name} 학생 데이터 입력
                                    </h3>
                                    <button onClick={handleSaveReport} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-900/20 border border-emerald-400/20">
                                        <Save size={16} /> 리포트 발생 & 저장
                                    </button>
                                </div>
                                <div className="flex gap-2 bg-black p-1 rounded-lg">
                                    {(['daily', 'weekly', 'monthly'] as const).map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setReportType(type)}
                                            className={`flex-1 py-2 text-sm text-center rounded-md font-medium transition-colors ${reportType === type ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}
                                        >
                                            {type === 'daily' ? '일간' : type === 'weekly' ? '주간' : '월간'} 템플릿
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                                <div className="max-w-2xl mx-auto space-y-8 pb-32">

                                    {/* 1. 기본 정보 */}
                                    <div className="space-y-4">
                                        <h4 className="flex items-center gap-2 text-sm font-bold text-rose-400 uppercase tracking-wider border-b border-white/10 pb-2">
                                            <Calendar size={16} /> 발행 일자 설정
                                        </h4>
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">리포트 발행일</label>
                                            <input type="date" name="published_date" value={formData.published_date} onChange={handleFormChange} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500" />
                                        </div>
                                    </div>

                                    {/* 2. 출결 및 학습 내용 */}
                                    <div className="space-y-4">
                                        <h4 className="flex items-center gap-2 text-sm font-bold text-rose-400 uppercase tracking-wider border-b border-white/10 pb-2">
                                            <CheckCircle2 size={16} /> 출결 및 오늘 학습 내용
                                        </h4>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div>
                                                <label className="block text-xs text-slate-400 mb-1">출결 상태</label>
                                                <select name="attendance_status" value={formData.attendance_status} onChange={handleFormChange} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500">
                                                    <option value="정상 등원 완료">● 정상 등원 완료</option>
                                                    <option value="지각">▲ 지각</option>
                                                    <option value="결석">■ 결석</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-400 mb-1">학습 내용 요약 (엔터 치면 줄바꿈 됩니다)</label>
                                                <textarea name="lesson_content" value={formData.lesson_content} onChange={handleFormChange} rows={3} placeholder="교과서 1과 예상문제 풀이 및 주요 어법 포인트 Review..." className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500 resize-none"></textarea>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. 과제 이행 현황 */}
                                    <div className="space-y-4">
                                        <h4 className="flex items-center gap-2 text-sm font-bold text-rose-400 uppercase tracking-wider border-b border-white/10 pb-2">
                                            <FileText size={16} /> 과제 완료 현황
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2 md:col-span-1">
                                                <label className="block text-xs text-slate-400 mb-1">과제명 및 범위</label>
                                                <input type="text" name="hw_name" value={formData.hw_name} onChange={handleFormChange} placeholder="워크북 17~63p" className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500" />
                                            </div>
                                            <div className="col-span-2 md:col-span-1">
                                                <label className="block text-xs text-slate-400 mb-1">상태</label>
                                                <select name="hw_status" value={formData.hw_status} onChange={handleFormChange} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500">
                                                    <option value="완료">완료</option>
                                                    <option value="미완료">미완료</option>
                                                    <option value="일부 완료">일부 완료</option>
                                                </select>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs text-slate-400 mb-1">보완 계획 (미완료 시 입력란)</label>
                                                <input type="text" name="hw_plan" value={formData.hw_plan} onChange={handleFormChange} placeholder="금요일까지 풀이 완료하도록 지도하였습니다." className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 4. 테스트 분석 */}
                                    <div className="space-y-4">
                                        <h4 className="flex items-center justify-between gap-2 text-sm font-bold text-rose-400 uppercase tracking-wider border-b border-white/10 pb-2">
                                            <div className="flex items-center gap-2"><LayoutDashboard size={16} /> 테스트 성취도 분석</div>
                                            <button onClick={addTest} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-md text-white transition-colors flex items-center gap-1"><Plus size={12} /> 테스트 추가</button>
                                        </h4>

                                        <div className="space-y-4">
                                            {formData.tests.map((test, idx) => (
                                                <div key={idx} className="bg-slate-900 border border-white/5 rounded-xl p-4 relative group">
                                                    {formData.tests.length > 1 && (
                                                        <button onClick={() => removeTest(idx)} className="absolute -top-3 -right-3 bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 p-1.5 rounded-full border border-slate-700 transition-colors opacity-0 group-hover:opacity-100">
                                                            <X size={14} />
                                                        </button>
                                                    )}
                                                    <div className="grid grid-cols-12 gap-3">
                                                        <div className="col-span-12 md:col-span-6">
                                                            <label className="block text-[10px] text-slate-500 mb-1 uppercase">시험명</label>
                                                            <input type="text" value={test.name} onChange={(e) => handleTestChange(idx, 'name', e.target.value)} placeholder="단어 테스트" className="w-full bg-black border border-white/5 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500" />
                                                        </div>
                                                        <div className="col-span-12 md:col-span-6">
                                                            <label className="block text-[10px] text-slate-500 mb-1 uppercase">시험 부연 설명</label>
                                                            <input type="text" value={test.desc} onChange={(e) => handleTestChange(idx, 'desc', e.target.value)} placeholder="교과 1과 [54~123번]" className="w-full bg-black border border-white/5 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500" />
                                                        </div>
                                                        <div className="col-span-4 md:col-span-4">
                                                            <label className="block text-[10px] text-slate-500 mb-1 uppercase">획득 점수</label>
                                                            <input type="number" value={test.score} onChange={(e) => handleTestChange(idx, 'score', e.target.value)} placeholder="51" className="w-full bg-black border border-white/5 rounded-lg px-3 py-2 text-sm text-rose-400 font-bold focus:outline-none focus:border-rose-500 placeholder:font-normal" />
                                                        </div>
                                                        <div className="col-span-4 md:col-span-4">
                                                            <label className="block text-[10px] text-slate-500 mb-1 uppercase">만점 점수</label>
                                                            <input type="number" value={test.total} onChange={(e) => handleTestChange(idx, 'total', e.target.value)} placeholder="70" className="w-full bg-black border border-white/5 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500" />
                                                        </div>
                                                        <div className="col-span-4 md:col-span-4">
                                                            <label className="block text-[10px] text-slate-500 mb-1 uppercase">반 평균</label>
                                                            <input type="number" value={test.avg} onChange={(e) => handleTestChange(idx, 'avg', e.target.value)} placeholder="49" className="w-full bg-black border border-white/5 rounded-lg px-3 py-2 text-sm text-emerald-400 font-bold focus:outline-none focus:border-rose-500 placeholder:font-normal" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 5. 다음 차시 안내 */}
                                    <div className="space-y-4">
                                        <h4 className="flex items-center gap-2 text-sm font-bold text-rose-400 uppercase tracking-wider border-b border-white/10 pb-2">
                                            <Calendar size={16} /> 다음 차시 안내
                                        </h4>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div>
                                                <label className="block text-xs text-slate-400 mb-1">다음 수업 날짜 텍스트</label>
                                                <input type="text" name="next_date_str" value={formData.next_date_str} onChange={handleFormChange} placeholder="3월 9일 월요일" className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500" />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-400 mb-1">다음 숙제 리스트 (엔터로 구분)</label>
                                                <textarea name="next_content" value={formData.next_content} onChange={handleFormChange} rows={3} placeholder="• 교과 1과 단어 끝까지 암기&#10;• 워크북 미완 부분 보완" className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500 resize-none"></textarea>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 6. 선생님 코멘트 */}
                                    <div className="space-y-4">
                                        <h4 className="flex items-center gap-2 text-sm font-bold text-rose-400 uppercase tracking-wider border-b border-white/10 pb-2">
                                            <Edit3 size={16} /> 선생님 개인 코멘트
                                        </h4>
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-2">
                                                * 앞선 인사(안녕하세요...)와 끝 인사(감사합니다...)는 템플릿에 고정되어 있으니 본론만 적어주세요.
                                                <br />* 엔터를 치면 단락이 나뉩니다.
                                            </label>
                                            <textarea name="teacher_comment" value={formData.teacher_comment} onChange={handleFormChange} rows={5} placeholder="오늘 성취도가 매우 좋습니다..." className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500 resize-none"></textarea>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </>
                    )}
                </div>

            </div>
        </motion.div>
    );
}
