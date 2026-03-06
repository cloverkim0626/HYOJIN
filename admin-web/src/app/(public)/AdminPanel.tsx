import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReportStore } from '@/store/reportStore';
import { supabase } from '@/lib/supabase';
import { Lock, X, Plus, Trash2, Edit3, Save, LayoutDashboard, Calendar, FileText, CheckCircle2, Upload, Image as ImageIcon, FileSpreadsheet, ChevronLeft, ChevronRight, Users, ClipboardCheck } from 'lucide-react';

// --- Types ---
const HW_STATUSES = ['확인완료', '교재미지참', '전체미완', '일부미완', '미완 후 보충완료'] as const;
type HwStatus = typeof HW_STATUSES[number];

interface StudentFormData {
    attendance_status: string;
    attendance_time: string;
    attendance_reason: string;
    hw_statuses: { status: HwStatus; plan: string }[];
    test_scores: { score: string; wordTestResult?: 'pass' | 'fail'; failAction?: '재시험 완료' | '추후 재시'; retestDate?: string }[];
    teacher_comment: string;
}

interface SharedFormData {
    published_date: string;
    lesson_content: string;
    homeworks: { name: string }[];
    tests: { name: string; desc: string; total: string; cutline: string; isWordTest: boolean }[];
    test_images: string[];
    next_date_str: string;
    next_content: string;
}

const defaultStudentForm = (hwCount: number, testCount: number): StudentFormData => ({
    attendance_status: '정상 등원 완료',
    attendance_time: '',
    attendance_reason: '',
    hw_statuses: Array.from({ length: hwCount }, () => ({ status: '확인완료' as HwStatus, plan: '' })),
    test_scores: Array.from({ length: testCount }, () => ({ score: '' })),
    teacher_comment: ''
});

export default function AdminPanel({ onClose }: { onClose: () => void }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { classes, fetchData, addClass, deleteClass, addStudent, deleteStudent, saveStudentReport, fetchStudentReports, deleteStudentReport } = useReportStore();

    React.useEffect(() => { fetchData(); }, [fetchData]);

    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [newClassName, setNewClassName] = useState('');
    const [newStudentName, setNewStudentName] = useState('');
    const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');

    // Report history modal
    const [showReportHistory, setShowReportHistory] = useState<string | null>(null);
    const [studentReportsList, setStudentReportsList] = useState<any[]>([]);

    // Homework status modal
    const [hwModalIdx, setHwModalIdx] = useState<number | null>(null);

    // --- Shared form data ---
    const [sharedForm, setSharedForm] = useState<SharedFormData>({
        published_date: new Date().toISOString().split('T')[0],
        lesson_content: '',
        homeworks: [{ name: '' }],
        tests: [{ name: '', desc: '', total: '', cutline: '', isWordTest: false }],
        test_images: [],
        next_date_str: '',
        next_content: ''
    });

    // --- Per-student form data ---
    const [studentForms, setStudentForms] = useState<Record<string, StudentFormData>>({});

    const activeClass = classes.find(c => c.id === selectedClassId);

    const initStudentForms = (students: any[]) => {
        const forms: Record<string, StudentFormData> = {};
        students.forEach(s => {
            forms[s.id] = defaultStudentForm(sharedForm.homeworks.length, sharedForm.tests.length);
        });
        setStudentForms(forms);
    };

    const handleSelectClass = async (classId: string) => {
        setSelectedClassId(classId);
        const cls = classes.find(c => c.id === classId);
        if (cls) initStudentForms(cls.students);
    };

    // --- Sync hw/test counts ---
    const syncStudentFormsToShared = (newHomeworks: { name: string }[], newTests: SharedFormData['tests']) => {
        setStudentForms(prev => {
            const updated = { ...prev };
            for (const sid of Object.keys(updated)) {
                const existing = updated[sid];
                const newHwStatuses = newHomeworks.map((_, i) => existing.hw_statuses[i] || { status: '확인완료' as HwStatus, plan: '' });
                const newTestScores = newTests.map((_, i) => existing.test_scores[i] || { score: '' });
                updated[sid] = { ...existing, hw_statuses: newHwStatuses, test_scores: newTestScores };
            }
            return updated;
        });
    };

    // --- Shared form handlers ---
    const handleSharedChange = (field: keyof SharedFormData, value: any) => {
        setSharedForm(prev => ({ ...prev, [field]: value }));
    };

    const addHomework = () => {
        const newHw = [...sharedForm.homeworks, { name: '' }];
        setSharedForm(prev => ({ ...prev, homeworks: newHw }));
        syncStudentFormsToShared(newHw, sharedForm.tests);
    };
    const removeHomework = (idx: number) => {
        if (sharedForm.homeworks.length <= 1) return;
        const newHw = sharedForm.homeworks.filter((_, i) => i !== idx);
        setSharedForm(prev => ({ ...prev, homeworks: newHw }));
        setStudentForms(prev => {
            const updated = { ...prev };
            for (const sid of Object.keys(updated)) {
                updated[sid] = { ...updated[sid], hw_statuses: updated[sid].hw_statuses.filter((_, i) => i !== idx) };
            }
            return updated;
        });
    };
    const handleHwNameChange = (idx: number, value: string) => {
        const newHw = [...sharedForm.homeworks];
        newHw[idx] = { ...newHw[idx], name: value };
        setSharedForm(prev => ({ ...prev, homeworks: newHw }));
    };

    const addTest = () => {
        const newTests = [...sharedForm.tests, { name: '', desc: '', total: '', cutline: '', isWordTest: false }];
        setSharedForm(prev => ({ ...prev, tests: newTests }));
        syncStudentFormsToShared(sharedForm.homeworks, newTests);
    };
    const removeTest = (idx: number) => {
        if (sharedForm.tests.length <= 1) return;
        const newTests = sharedForm.tests.filter((_, i) => i !== idx);
        setSharedForm(prev => ({ ...prev, tests: newTests }));
        setStudentForms(prev => {
            const updated = { ...prev };
            for (const sid of Object.keys(updated)) {
                updated[sid] = { ...updated[sid], test_scores: updated[sid].test_scores.filter((_, i) => i !== idx) };
            }
            return updated;
        });
    };
    const handleTestSharedChange = (idx: number, field: string, value: any) => {
        const newTests = [...sharedForm.tests];
        newTests[idx] = { ...newTests[idx], [field]: value };
        setSharedForm(prev => ({ ...prev, tests: newTests }));
    };

    // --- Student form handlers ---
    const updateStudentForm = (studentId: string, updater: (prev: StudentFormData) => StudentFormData) => {
        setStudentForms(prev => ({
            ...prev,
            [studentId]: updater(prev[studentId] || defaultStudentForm(sharedForm.homeworks.length, sharedForm.tests.length))
        }));
    };

    // --- Auto-calculate average for a test (excluding blank scores) ---
    const calcAvg = (testIdx: number): number => {
        if (!activeClass) return 0;
        const scores = activeClass.students
            .map(s => studentForms[s.id]?.test_scores[testIdx]?.score)
            .filter(s => s !== undefined && s !== '')
            .map(s => parseFloat(s!));
        if (scores.length === 0) return 0;
        return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10;
    };

    // --- Date navigation ---
    const handlePrevDay = () => {
        const current = new Date(sharedForm.published_date);
        current.setDate(current.getDate() - 1);
        handleSharedChange('published_date', current.toISOString().split('T')[0]);
    };
    const handleNextDay = () => {
        const current = new Date(sharedForm.published_date);
        current.setDate(current.getDate() + 1);
        handleSharedChange('published_date', current.toISOString().split('T')[0]);
    };

    // --- Image upload ---
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setIsUploading(true);
        const urls: string[] = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileName = `test_images/${Date.now()}_${file.name}`;
            const { data, error } = await supabase.storage.from('report-assets').upload(fileName, file);
            if (error) { console.error('Upload error:', error); continue; }
            const { data: urlData } = supabase.storage.from('report-assets').getPublicUrl(data.path);
            urls.push(urlData.publicUrl);
        }
        setSharedForm(prev => ({ ...prev, test_images: [...prev.test_images, ...urls] }));
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };
    const removeImage = (idx: number) => {
        setSharedForm(prev => ({ ...prev, test_images: prev.test_images.filter((_, i) => i !== idx) }));
    };

    // --- Report History & Deletion ---
    const openReportHistory = async (studentId: string) => {
        const reports = await fetchStudentReports(studentId);
        setStudentReportsList(reports);
        setShowReportHistory(studentId);
    };
    const handleDeleteReport = async (reportId: string) => {
        if (!confirm('이 리포트를 삭제하시겠습니까?')) return;
        await deleteStudentReport(reportId);
        // Refresh the list
        if (showReportHistory) {
            const reports = await fetchStudentReports(showReportHistory);
            setStudentReportsList(reports);
        }
    };

    // --- Save All Reports (batch) ---
    const handleSaveAllReports = async () => {
        if (!activeClass) return;
        setIsSaving(true);
        let successCount = 0;
        const failedStudents: string[] = [];

        const d = new Date(sharedForm.published_date);
        const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
        const formattedDate = !isNaN(d.getTime()) ? `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${days[d.getDay()]}` : sharedForm.published_date;

        const template = activeClass.templates.find(t => t.reportType === reportType);
        const baseTemplate = template?.templateHtml || '<div style="text-align:center; padding: 40px;">반 템플릿이 설정되지 않았습니다.</div>';

        for (const student of activeClass.students) {
            const sf = studentForms[student.id];
            if (!sf) continue;

            let templateHtml = baseTemplate;

            // Build homework HTML
            let hwHtml = '';
            sharedForm.homeworks.forEach((hw, idx) => {
                if (!hw.name) return;
                const sts = sf.hw_statuses[idx];
                if (!sts) return;
                const badgeClass = (sts.status === '확인완료' || sts.status === '미완 후 보충완료') ? 'badge-blue' : 'badge-red';
                hwHtml += `
        <div style="margin-bottom: 12px;">
            <div class="status-wrap">
                <span class="content-h">${hw.name}</span>
                <span class="badge ${badgeClass}">${sts.status}</span>
            </div>
            ${(sts.status !== '확인완료' && sts.status !== '미완 후 보충완료') && sts.plan ? `<p class="plan-box">→ 보완계획: ${sts.plan}</p>` : ''}
        </div>`;
            });

            // Build tests HTML
            let testsHtml = '';
            sharedForm.tests.forEach((test, idx) => {
                if (!test.name) return;
                const ts = sf.test_scores[idx];
                if (!ts) return;
                const scoreNowNum = parseFloat(ts.score) || 0;
                const scoreTotalNum = parseFloat(test.total) || 100;
                const avgScore = calcAvg(idx);
                const scorePercent = scoreTotalNum > 0 ? (scoreNowNum / scoreTotalNum) * 100 : 0;
                const avgPercent = scoreTotalNum > 0 ? (avgScore / scoreTotalNum) * 100 : 0;
                const isBelowAvg = scoreNowNum < avgScore;

                // Auto-determine pass/fail for word tests
                let wordTestResult = ts.wordTestResult;
                if (test.isWordTest && test.cutline) {
                    const cutlineNum = parseFloat(test.cutline) || 0;
                    if (ts.score !== '') {
                        wordTestResult = scoreNowNum >= cutlineNum ? 'pass' : 'fail';
                    }
                }

                let wordTestInfo = '';
                if (test.isWordTest && wordTestResult === 'fail') {
                    if (ts.failAction === '재시험 완료') {
                        wordTestInfo = `<p style="font-size:12px;color:var(--point-red);font-weight:600;margin-top:8px;">※ Fail → 재시험 완료</p>`;
                    } else if (ts.failAction === '추후 재시') {
                        wordTestInfo = `<p style="font-size:12px;color:var(--point-red);font-weight:600;margin-top:8px;">※ Fail → 추후 재시험 예정${ts.retestDate ? ` (${ts.retestDate})` : ''}</p>`;
                    } else {
                        wordTestInfo = `<p style="font-size:12px;color:var(--point-red);font-weight:600;margin-top:8px;">※ Fail</p>`;
                    }
                }

                testsHtml += `
        <div class="test-item">
            <div class="test-flex">
                <div>
                    <p class="test-title" style="${isBelowAvg ? 'color:var(--point-red)' : ''}">${test.name}</p>
                    <p class="test-desc">${test.desc}</p>
                </div>
                <div class="score-group">
                    <span class="score-big" style="${isBelowAvg ? 'color:var(--point-red)' : ''}">${ts.score}</span><span class="score-small">/${test.total}</span>
                </div>
            </div>
            <div class="chart-bg">
                <div class="chart-bar" style="width: ${scorePercent}%; ${isBelowAvg ? 'background:var(--point-red);' : ''}"></div>
                <div class="avg-dot" style="left: ${avgPercent}%;"></div>
            </div>
            <div class="chart-info">
                <span style="${isBelowAvg ? 'color:var(--point-red)' : ''}">${isBelowAvg ? '평균 대비 보완 필요' : '달성률: ' + scorePercent.toFixed(1) + '%'}</span>
                <span>반 평균: ${avgScore}점</span>
            </div>
            ${wordTestInfo}
        </div>`;
            });

            // Test images
            let testImagesHtml = '';
            if (sharedForm.test_images.length > 0) {
                testImagesHtml = `<div style="margin-top: 20px; padding: 16px; background: var(--bg-soft); border-radius: 8px; border-left: 4px solid var(--brand-color);">
                <p style="font-size: 13px; font-weight: 700; color: var(--brand-color); margin-bottom: 12px;">📄 시험지 첨부파일</p>`;
                sharedForm.test_images.forEach((url, i) => {
                    testImagesHtml += `<a href="${url}" target="_blank" rel="noopener noreferrer" style="display: block; margin-bottom: 8px; font-size: 13px; color: var(--brand-color); text-decoration: underline; font-weight: 600;">시험지 이미지 ${i + 1} 확인하기 →</a>`;
                });
                testImagesHtml += `</div>`;
            }

            // Attendance
            let attendanceDisplay = sf.attendance_status;
            if (sf.attendance_status === '지각' && sf.attendance_time) attendanceDisplay += ` (${sf.attendance_time})`;
            if ((sf.attendance_status === '지각' || sf.attendance_status === '결석') && sf.attendance_reason) attendanceDisplay += `\n사유: ${sf.attendance_reason}`;

            // Replace template variables
            const avgScore0 = calcAvg(0);
            const variables: Record<string, string> = {
                '{{student_name}}': student.name,
                '{{class_name}}': activeClass.name.replace('[WOODOK] ', ''),
                '{{published_date_kr}}': formattedDate,
                '{{attendance_status}}': attendanceDisplay,
                '{{lesson_content}}': sharedForm.lesson_content,
                '{{hw_name}}': sharedForm.homeworks[0]?.name || '',
                '{{hw_status}}': sf.hw_statuses[0]?.status || '',
                '{{hw_badge_class}}': sf.hw_statuses[0]?.status === '확인완료' ? 'badge-blue' : 'badge-red',
                '{{hw_plan_display}}': sf.hw_statuses[0]?.status === '확인완료' ? 'none' : 'block',
                '{{hw_plan}}': sf.hw_statuses[0]?.plan || '',
                '{{homeworks_html}}': hwHtml,
                '{{next_date_str}}': sharedForm.next_date_str,
                '{{next_content}}': sharedForm.next_content,
                '{{teacher_comment}}': sf.teacher_comment,
                '{{tests_html}}': testsHtml + testImagesHtml,
                '{{contact_link}}': 'https://open.kakao.com/o/sY6xBxji'
            };

            for (const [key, value] of Object.entries(variables)) {
                templateHtml = templateHtml.split(key).join(value);
            }

            const rawData = {
                ...sharedForm,
                ...sf,
                assignment_tracking: sharedForm.homeworks.map((hw, idx) => ({
                    name: hw.name,
                    status: sf.hw_statuses[idx]?.status || '확인완료',
                    plan: sf.hw_statuses[idx]?.plan || ''
                }))
            };

            const result = await saveStudentReport(student.id, reportType, sharedForm.published_date, templateHtml, rawData);
            if (!result) {
                failedStudents.push(student.name);
            } else {
                successCount++;
            }
        }

        setIsSaving(false);
        if (failedStudents.length > 0) {
            alert(`⚠️ ${failedStudents.join(', ')} 학생의 리포트 저장에 실패했습니다. 콘솔을 확인하세요.`);
        } else {
            alert(`✅ ${successCount}명의 리포트가 성공적으로 저장되었습니다!`);
        }
    };

    // --- Login ---
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'admin123') { setIsAuthenticated(true); setError(false); }
        else { setError(true); setTimeout(() => setError(false), 1000); }
    };

    if (!isAuthenticated) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 p-8 rounded-2xl border border-rose-500/30 text-center w-full max-w-sm relative shadow-2xl shadow-rose-900/20">
                    <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20} /></button>
                    <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/20 text-rose-400"><Lock size={24} /></div>
                    <h3 className="text-xl font-bold mb-2">관리자 로그인</h3>
                    <p className="text-xs text-slate-400 mb-6">마스터 비밀번호를 입력해주세요.</p>
                    <form onSubmit={handleLogin}>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                            className={`w-full bg-black border ${error ? 'border-rose-500' : 'border-white/10'} rounded-xl py-4 text-center text-xl tracking-[0.5em] focus:outline-none focus:border-rose-500 transition-all mb-4`}
                            placeholder="PASSWORD" autoFocus />
                        <button type="submit" className="w-full py-4 bg-rose-600 hover:bg-rose-500 transition-colors rounded-xl text-sm font-bold shadow-lg shadow-rose-900/40">패널 열기</button>
                    </form>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed inset-0 z-[100] bg-[#050510] flex flex-col overflow-hidden text-slate-200">
            {/* Header */}
            <header className="bg-slate-900 border-b border-white/10 p-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-rose-500/20 rounded-lg flex items-center justify-center text-rose-400"><LayoutDashboard size={20} /></div>
                    <div>
                        <h2 className="font-bold text-white leading-tight">스마트 리포트 생성기</h2>
                        <p className="text-[10px] text-slate-400">반 단위 일괄 입력 시스템</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button disabled className="flex items-center gap-1.5 bg-white/5 text-slate-500 px-3 py-2 rounded-lg text-xs font-medium border border-white/5 cursor-not-allowed opacity-50"><FileSpreadsheet size={14} /> Excel Import</button>
                    <button onClick={onClose} className="p-2 bg-white/5 rounded-lg text-slate-300 hover:bg-white/10 transition-colors"><X size={20} /></button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Classes + Students */}
                <div className="w-64 border-r border-white/10 bg-slate-900/50 flex flex-col shrink-0">
                    <div className="p-4 border-b border-white/10">
                        <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">클래스 목록</h3>
                        <div className="flex gap-2">
                            <input value={newClassName} onChange={e => setNewClassName(e.target.value)} placeholder="새로운 반 이름" className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-rose-500" />
                            <button onClick={() => { if (newClassName.trim()) { addClass(newClassName.trim()); setNewClassName(''); } }} className="bg-rose-600 p-2 rounded-lg hover:bg-rose-500 transition-colors"><Plus size={16} /></button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {classes.map(c => (
                            <div key={c.id} className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${selectedClassId === c.id ? 'bg-rose-500/20 border border-rose-500/30 text-white' : 'hover:bg-white/5 border border-transparent'}`} onClick={() => handleSelectClass(c.id)}>
                                <span className="text-sm font-medium truncate pr-2">{c.name} <span className="text-[10px] text-slate-500">({c.students.length}명)</span></span>
                                <button onClick={(e) => { e.stopPropagation(); deleteClass(c.id); }} className="text-slate-600 hover:text-rose-400"><Trash2 size={14} /></button>
                            </div>
                        ))}
                    </div>
                    {activeClass && (
                        <div className="border-t border-white/10 p-4">
                            <h3 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">학생 관리</h3>
                            <div className="flex gap-2 mb-2">
                                <input value={newStudentName} onChange={e => setNewStudentName(e.target.value)} placeholder="학생 추가" className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-rose-500" />
                                <button onClick={() => { if (selectedClassId && newStudentName.trim()) { addStudent(selectedClassId, newStudentName.trim()); setNewStudentName(''); } }} className="bg-rose-600 p-2 rounded-lg hover:bg-rose-500 transition-colors"><Plus size={16} /></button>
                            </div>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                {activeClass.students.map(s => (
                                    <div key={s.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-md hover:bg-white/5 group">
                                        <span>{s.name}</span>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                            <button onClick={() => openReportHistory(s.id)} className="text-blue-400 hover:text-blue-300 text-[10px]">기록</button>
                                            <button onClick={() => deleteStudent(selectedClassId!, s.id)} className="text-slate-600 hover:text-rose-400"><Trash2 size={12} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Batch Form */}
                <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
                    {!activeClass ? (
                        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">반을 선택해주세요.</div>
                    ) : (
                        <>
                            <div className="p-4 border-b border-white/10 bg-slate-900 shrink-0">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Users size={18} className="text-rose-400" />
                                        {activeClass.name} — 일괄 입력
                                    </h3>
                                    <button onClick={handleSaveAllReports} disabled={isSaving}
                                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-900/20 border border-emerald-400/20">
                                        <Save size={16} /> {isSaving ? '저장 중...' : `전체 발행 (${activeClass.students.length}명)`}
                                    </button>
                                </div>
                                <div className="flex gap-2 bg-black p-1 rounded-lg">
                                    {(['daily', 'weekly', 'monthly'] as const).map(type => (
                                        <button key={type} onClick={() => setReportType(type)}
                                            className={`flex-1 py-2 text-sm text-center rounded-md font-medium transition-colors ${reportType === type ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>
                                            {type === 'daily' ? '일간' : type === 'weekly' ? '주간' : '월간'} 템플릿
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                                <div className="max-w-4xl mx-auto space-y-8 pb-32">

                                    {/* === PER-STUDENT: Attendance + Comment (2-column grid) === */}
                                    <h4 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                                        <Users size={16} /> 출결 / 코멘트 ({activeClass.students.length}명)
                                    </h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {activeClass.students.map(student => {
                                            const sf = studentForms[student.id] || defaultStudentForm(sharedForm.homeworks.length, sharedForm.tests.length);
                                            return (
                                                <div key={student.id} className="bg-slate-900/30 border border-white/10 rounded-xl p-3 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <h5 className="text-xs font-bold text-white">{student.name}</h5>
                                                        <div className="flex items-center gap-2">
                                                            <select value={sf.attendance_status} onChange={e => updateStudentForm(student.id, prev => ({ ...prev, attendance_status: e.target.value }))}
                                                                className="bg-black border border-white/5 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:border-rose-500">
                                                                <option value="정상 등원 완료">●정상</option>
                                                                <option value="지각">▲지각</option>
                                                                <option value="결석">■결석</option>
                                                            </select>
                                                            <button onClick={() => openReportHistory(student.id)} className="text-[9px] text-blue-400 hover:text-blue-300 border border-blue-500/20 px-1.5 py-0.5 rounded">기록</button>
                                                        </div>
                                                    </div>
                                                    {sf.attendance_status === '지각' && (
                                                        <div className="flex gap-2">
                                                            <input type="time" value={sf.attendance_time} onChange={e => updateStudentForm(student.id, prev => ({ ...prev, attendance_time: e.target.value }))}
                                                                className="flex-1 bg-black border border-white/5 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:border-rose-500" />
                                                            <input type="text" value={sf.attendance_reason} onChange={e => updateStudentForm(student.id, prev => ({ ...prev, attendance_reason: e.target.value }))}
                                                                placeholder="사유" className="flex-1 bg-black border border-white/5 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:border-rose-500" />
                                                        </div>
                                                    )}
                                                    {sf.attendance_status === '결석' && (
                                                        <input type="text" value={sf.attendance_reason} onChange={e => updateStudentForm(student.id, prev => ({ ...prev, attendance_reason: e.target.value }))}
                                                            placeholder="결석 사유" className="w-full bg-black border border-white/5 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:border-rose-500" />
                                                    )}
                                                    <textarea value={sf.teacher_comment} onChange={e => updateStudentForm(student.id, prev => ({ ...prev, teacher_comment: e.target.value }))}
                                                        rows={3} placeholder="개별 코멘트..." className="w-full bg-black border border-white/5 rounded-lg px-2 py-1.5 text-[10px] focus:outline-none focus:border-rose-500 resize-none" />
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* === SHARED SECTION === */}
                                    <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 space-y-6">
                                        <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                                            <CheckCircle2 size={16} /> 공통 입력 (반 전체 동일)
                                        </h4>

                                        {/* Date */}
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">수업 일자</label>
                                            <div className="flex items-center gap-2">
                                                <button onClick={handlePrevDay} className="p-2.5 bg-slate-900 border border-white/10 rounded-xl hover:bg-slate-800 transition-colors text-slate-400"><ChevronLeft size={20} /></button>
                                                <input type="date" value={sharedForm.published_date} onChange={e => handleSharedChange('published_date', e.target.value)} className="input-field flex-1" />
                                                <button onClick={handleNextDay} className="p-2.5 bg-slate-900 border border-white/10 rounded-xl hover:bg-slate-800 transition-colors text-slate-400"><ChevronRight size={20} /></button>
                                            </div>
                                        </div>

                                        {/* Lesson content */}
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">학습 내용 요약</label>
                                            <textarea value={sharedForm.lesson_content} onChange={e => handleSharedChange('lesson_content', e.target.value)} rows={3}
                                                placeholder="교과서 1과 예상문제 풀이 및 주요 어법 포인트 Review..." className="input-field resize-none" />
                                        </div>

                                        {/* Homework names + status check button */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-xs text-slate-400">과제 목록</label>
                                                <button onClick={addHomework} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-md text-white transition-colors flex items-center gap-1"><Plus size={12} /> 추가</button>
                                            </div>
                                            <div className="space-y-2">
                                                {sharedForm.homeworks.map((hw, idx) => (
                                                    <div key={idx} className="flex gap-2 items-center">
                                                        <input value={hw.name} onChange={e => handleHwNameChange(idx, e.target.value)} placeholder={`과제 ${idx + 1} (예: 워크북 17~63p)`}
                                                            className="flex-1 bg-black border border-white/5 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500" />
                                                        {hw.name && (
                                                            <button onClick={() => setHwModalIdx(idx)}
                                                                className="flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 px-2.5 py-2 rounded-lg text-[10px] font-bold border border-amber-500/20 transition-colors whitespace-nowrap">
                                                                <ClipboardCheck size={14} /> 체크
                                                            </button>
                                                        )}
                                                        {sharedForm.homeworks.length > 1 && (
                                                            <button onClick={() => removeHomework(idx)} className="text-slate-600 hover:text-rose-400 p-1"><X size={16} /></button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Tests with inline student scores */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-xs text-slate-400">테스트 설정 + 학생별 점수</label>
                                                <button onClick={addTest} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-md text-white transition-colors flex items-center gap-1"><Plus size={12} /> 추가</button>
                                            </div>
                                            <div className="space-y-4">
                                                {sharedForm.tests.map((test, idx) => {
                                                    const avg = calcAvg(idx);
                                                    return (
                                                        <div key={idx} className="bg-black border border-white/5 rounded-xl p-4 relative group space-y-3">
                                                            {sharedForm.tests.length > 1 && (
                                                                <button onClick={() => removeTest(idx)} className="absolute -top-2 -right-2 bg-slate-800 text-slate-400 hover:text-rose-400 p-1 rounded-full border border-slate-700 opacity-0 group-hover:opacity-100"><X size={12} /></button>
                                                            )}
                                                            {/* Test config row */}
                                                            <div className="grid grid-cols-12 gap-2">
                                                                <div className="col-span-4">
                                                                    <input value={test.name} onChange={e => handleTestSharedChange(idx, 'name', e.target.value)} placeholder="시험명" className="w-full bg-slate-900 border border-white/5 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-rose-500" />
                                                                </div>
                                                                <div className="col-span-3">
                                                                    <input value={test.desc} onChange={e => handleTestSharedChange(idx, 'desc', e.target.value)} placeholder="범위" className="w-full bg-slate-900 border border-white/5 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-rose-500" />
                                                                </div>
                                                                <div className="col-span-2">
                                                                    <input value={test.total} onChange={e => handleTestSharedChange(idx, 'total', e.target.value)} placeholder="만점" className="w-full bg-slate-900 border border-white/5 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-rose-500" />
                                                                </div>
                                                                <div className="col-span-3">
                                                                    <input value={test.cutline} onChange={e => handleTestSharedChange(idx, 'cutline', e.target.value)} placeholder="커트라인" className="w-full bg-slate-900 border border-amber-500/20 rounded-lg px-2 py-1.5 text-xs text-amber-400 focus:outline-none focus:border-amber-500" />
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <label className="flex items-center gap-2 text-[10px] text-slate-500 cursor-pointer">
                                                                    <input type="checkbox" checked={test.isWordTest} onChange={e => handleTestSharedChange(idx, 'isWordTest', e.target.checked)} className="rounded" />
                                                                    단어 테스트 (커트라인 미달 시 자동 FAIL)
                                                                </label>
                                                                {test.name && <span className="text-[10px] text-emerald-400 font-bold">평균: {avg}점</span>}
                                                            </div>

                                                            {/* Inline student scores */}
                                                            {test.name && activeClass && (
                                                                <div className="border-t border-white/5 pt-2 space-y-1">
                                                                    {activeClass.students.map(student => {
                                                                        const sf = studentForms[student.id];
                                                                        const ts = sf?.test_scores[idx] || { score: '' };
                                                                        const scoreNum = parseFloat(ts.score) || 0;
                                                                        const cutlineNum = parseFloat(test.cutline) || 0;
                                                                        const isFail = test.isWordTest && test.cutline && ts.score !== '' && scoreNum < cutlineNum;
                                                                        return (
                                                                            <div key={student.id} className="flex items-center gap-2">
                                                                                <span className="text-[10px] text-slate-500 w-16 truncate">{student.name}</span>
                                                                                <input type="number" value={ts.score} onChange={e => updateStudentForm(student.id, prev => {
                                                                                    const newScores = [...prev.test_scores];
                                                                                    newScores[idx] = { ...newScores[idx], score: e.target.value };
                                                                                    return { ...prev, test_scores: newScores };
                                                                                })} placeholder="—" className={`w-14 bg-slate-900 border rounded px-2 py-1 text-xs font-bold focus:outline-none ${isFail ? 'border-rose-500/40 text-rose-400' : 'border-white/5 text-emerald-400'} focus:border-rose-500`} />
                                                                                {isFail && <span className="text-[9px] text-rose-400 font-bold">FAIL</span>}
                                                                                {test.isWordTest && ts.score !== '' && !isFail && <span className="text-[9px] text-emerald-400 font-bold">PASS</span>}
                                                                                {/* Fail actions for word test */}
                                                                                {isFail && (
                                                                                    <div className="flex items-center gap-1 ml-1">
                                                                                        {(['재시험 완료', '추후 재시'] as const).map(action => (
                                                                                            <button key={action} onClick={() => updateStudentForm(student.id, prev => {
                                                                                                const newScores = [...prev.test_scores];
                                                                                                newScores[idx] = { ...newScores[idx], failAction: action };
                                                                                                return { ...prev, test_scores: newScores };
                                                                                            })} className={`px-1.5 py-0.5 rounded text-[9px] border ${ts.failAction === action ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' : 'bg-slate-800 border-white/5 text-slate-500'}`}>
                                                                                                {action}
                                                                                            </button>
                                                                                        ))}
                                                                                        {ts.failAction === '추후 재시' && (
                                                                                            <input value={ts.retestDate || ''} onChange={e => updateStudentForm(student.id, prev => {
                                                                                                const newScores = [...prev.test_scores];
                                                                                                newScores[idx] = { ...newScores[idx], retestDate: e.target.value };
                                                                                                return { ...prev, test_scores: newScores };
                                                                                            })} placeholder="재시험일" className="w-16 bg-slate-900 border border-white/5 rounded px-1 py-0.5 text-[9px] focus:outline-none focus:border-rose-500" />
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Image upload */}
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-2">📸 시험지 사진 첨부</label>
                                            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                                            <button onClick={() => fileInputRef.current?.click()} disabled={isUploading}
                                                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-white/10 px-4 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 w-full justify-center">
                                                {isUploading ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> 업로드 중...</>) : (<><Upload size={16} /> 시험지 이미지 업로드</>)}
                                            </button>
                                            {sharedForm.test_images.length > 0 && (
                                                <div className="mt-2 space-y-1">
                                                    {sharedForm.test_images.map((url, i) => (
                                                        <div key={i} className="flex items-center gap-2 bg-slate-900 border border-white/5 rounded-lg px-3 py-1.5">
                                                            <ImageIcon size={12} className="text-emerald-400 shrink-0" />
                                                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 truncate flex-1 hover:underline">시험지 {i + 1}</a>
                                                            <button onClick={() => removeImage(i)} className="text-slate-500 hover:text-rose-400"><X size={12} /></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Next session */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs text-slate-400 mb-1">다음 수업 날짜</label>
                                                <input type="text" value={sharedForm.next_date_str} onChange={e => handleSharedChange('next_date_str', e.target.value)} placeholder="3월 9일 월요일" className="input-field" />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-400 mb-1">다음 숙제/내용</label>
                                                <textarea value={sharedForm.next_content} onChange={e => handleSharedChange('next_content', e.target.value)} rows={2} placeholder="• 교과 1과 단어 암기" className="input-field resize-none" />
                                            </div>
                                        </div>
                                    </div>


                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Homework Status Modal */}
            <AnimatePresence>
                {hwModalIdx !== null && activeClass && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setHwModalIdx(null)}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}
                            className="bg-slate-900 rounded-2xl border border-white/10 w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-white text-sm">과제 상태 체크</h3>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{sharedForm.homeworks[hwModalIdx]?.name}</p>
                                </div>
                                <button onClick={() => setHwModalIdx(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {activeClass.students.map(student => {
                                    const sf = studentForms[student.id];
                                    const hs = sf?.hw_statuses[hwModalIdx!] || { status: '확인완료' as HwStatus, plan: '' };
                                    const needsPlan = hs.status === '교재미지참' || hs.status === '전체미완' || hs.status === '일부미완';
                                    return (
                                        <div key={student.id} className="bg-black/30 border border-white/5 rounded-xl px-4 py-3 space-y-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-sm font-medium text-white">{student.name}</span>
                                                <select value={hs.status} onChange={e => updateStudentForm(student.id, prev => {
                                                    const newHw = [...prev.hw_statuses];
                                                    newHw[hwModalIdx!] = { ...newHw[hwModalIdx!], status: e.target.value as HwStatus };
                                                    return { ...prev, hw_statuses: newHw };
                                                })} className={`bg-slate-900 border rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none ${hs.status === '확인완료' || hs.status === '미완 후 보충완료' ? 'border-emerald-500/30 text-emerald-400' : 'border-rose-500/30 text-rose-400'
                                                    }`}>
                                                    {HW_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                            {needsPlan && (
                                                <input value={hs.plan} onChange={e => updateStudentForm(student.id, prev => {
                                                    const newHw = [...prev.hw_statuses];
                                                    newHw[hwModalIdx!] = { ...newHw[hwModalIdx!], plan: e.target.value };
                                                    return { ...prev, hw_statuses: newHw };
                                                })} placeholder="보완계획 입력" className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-rose-500" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="p-3 border-t border-white/10">
                                <button onClick={() => setHwModalIdx(null)} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-bold transition-colors">완료</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Report History Modal */}
            <AnimatePresence>
                {showReportHistory && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowReportHistory(null)}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}
                            className="bg-slate-900 rounded-2xl border border-white/10 w-full max-w-md max-h-[70vh] overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                <h3 className="font-bold text-white">리포트 기록</h3>
                                <button onClick={() => setShowReportHistory(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {studentReportsList.length === 0 ? (
                                    <p className="text-center text-slate-500 text-sm py-8">저장된 리포트가 없습니다.</p>
                                ) : (
                                    studentReportsList.map(report => (
                                        <div key={report.id} className="flex items-center justify-between bg-black/30 border border-white/5 rounded-xl px-4 py-3">
                                            <div>
                                                <span className="text-sm font-medium text-white">{report.publishedDate}</span>
                                                <span className="ml-2 text-[10px] text-slate-500 uppercase">{report.reportType}</span>
                                            </div>
                                            <button onClick={() => handleDeleteReport(report.id)}
                                                className="text-slate-600 hover:text-rose-400 transition-colors flex items-center gap-1 text-xs">
                                                <Trash2 size={14} /> 삭제
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .input-field {
                    width: 100%;
                    background: rgb(15 23 42);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 0.75rem;
                    padding: 0.75rem 1rem;
                    font-size: 0.875rem;
                    color: #e2e8f0;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .input-field:focus { border-color: #f43f5e; }
                .input-field::placeholder { color: #475569; }
            `}</style>
        </motion.div>
    );
}
