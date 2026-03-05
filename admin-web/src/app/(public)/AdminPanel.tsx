import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReportStore } from '@/store/reportStore';
import { supabase } from '@/lib/supabase';
import { Lock, X, Plus, Trash2, Edit3, Save, LayoutDashboard, Calendar, FileText, CheckCircle2, Upload, Image as ImageIcon, FileSpreadsheet, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminPanel({ onClose }: { onClose: () => void }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const { classes, fetchData, addClass, deleteClass, addStudent, deleteStudent, saveStudentReport, fetchStudentReports } = useReportStore();
    const [existingReports, setExistingReports] = useState<any[]>([]);
    const [isEditing, setIsEditing] = useState(false);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

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

    const openStudentEditor = async (student: any) => {
        setSelectedStudentId(student.id);
        const today = new Date().toISOString().split('T')[0];
        resetForm(today);
        // Fetch existing reports for this student
        const reports = await fetchStudentReports(student.id);
        setExistingReports(reports);
        // Try to load today's report if it exists
        loadExistingReport(reports, today, reportType);
    };

    const resetForm = (date: string) => {
        setIsEditing(false);
        setFormData({
            published_date: date,
            attendance_status: '정상 등원 완료',
            attendance_time: '',
            attendance_reason: '',
            lesson_content: '',
            homeworks: [{ name: '', status: '미완료', plan: '' }],
            tests: [{ name: '', desc: '', score: '', total: '', avg: '' }],
            test_images: [],
            next_date_str: '',
            next_content: '',
            teacher_comment: ''
        });
    };

    const loadExistingReport = (reports: any[], date: string, type: string) => {
        const existing = reports.find(r => r.publishedDate === date && r.reportType === type);
        if (existing?.rawDataJson) {
            const raw = existing.rawDataJson;
            setIsEditing(true);
            setFormData({
                published_date: date,
                attendance_status: raw.attendance_status || '정상 등원 완료',
                attendance_time: raw.attendance_time || '',
                attendance_reason: raw.attendance_reason || '',
                lesson_content: raw.lesson_content || '',
                homeworks: raw.homeworks?.length > 0 ? raw.homeworks : [{ name: '', status: '미완료', plan: '' }],
                tests: raw.tests?.length > 0 ? raw.tests : [{ name: '', desc: '', score: '', total: '', avg: '' }],
                test_images: raw.test_images || [],
                next_date_str: raw.next_date_str || '',
                next_content: raw.next_content || '',
                teacher_comment: raw.teacher_comment || ''
            });
        } else {
            setIsEditing(false);
        }
    };

    // When date or report type changes, try loading existing report
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value;
        setFormData(prev => ({ ...prev, published_date: newDate }));
        loadExistingReport(existingReports, newDate, reportType);
    };

    const handlePrevDay = () => {
        const current = new Date(formData.published_date);
        current.setDate(current.getDate() - 1);
        const newDate = current.toISOString().split('T')[0];
        setFormData(prev => ({ ...prev, published_date: newDate }));
        loadExistingReport(existingReports, newDate, reportType);
    };

    const handleNextDay = () => {
        const current = new Date(formData.published_date);
        current.setDate(current.getDate() + 1);
        const newDate = current.toISOString().split('T')[0];
        setFormData(prev => ({ ...prev, published_date: newDate }));
        loadExistingReport(existingReports, newDate, reportType);
    };

    const handleReportTypeChange = (type: 'daily' | 'weekly' | 'monthly') => {
        setReportType(type);
        loadExistingReport(existingReports, formData.published_date, type);
    };

    // --- Form State ---
    const [formData, setFormData] = useState({
        published_date: '',
        attendance_status: '정상 등원 완료',
        attendance_time: '',     // 지각/결석 시 시각
        attendance_reason: '',   // 지각/결석 시 사유
        lesson_content: '',
        homeworks: [{ name: '', status: '미완료', plan: '' }],
        tests: [{ name: '', desc: '', score: '', total: '', avg: '' }],
        test_images: [] as string[], // URLs of uploaded test images
        next_date_str: '',
        next_content: '',
        teacher_comment: ''
    });

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- Homework Handlers ---
    const handleHwChange = (index: number, field: string, value: string) => {
        const newHw = [...formData.homeworks];
        newHw[index] = { ...newHw[index], [field]: value };
        setFormData({ ...formData, homeworks: newHw });
    };
    const addHomework = () => {
        setFormData({ ...formData, homeworks: [...formData.homeworks, { name: '', status: '미완료', plan: '' }] });
    };
    const removeHomework = (index: number) => {
        if (formData.homeworks.length <= 1) return;
        setFormData({ ...formData, homeworks: formData.homeworks.filter((_, i) => i !== index) });
    };

    // --- Test Handlers ---
    const handleTestChange = (index: number, field: string, value: string) => {
        const newTests = [...formData.tests];
        newTests[index] = { ...newTests[index], [field]: value };
        setFormData({ ...formData, tests: newTests });
    };
    const addTest = () => {
        setFormData({ ...formData, tests: [...formData.tests, { name: '', desc: '', score: '', total: '', avg: '' }] });
    };
    const removeTest = (index: number) => {
        if (formData.tests.length <= 1) return;
        setFormData({ ...formData, tests: formData.tests.filter((_, i) => i !== index) });
    };

    // --- Image Upload ---
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const newUrls: string[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileExt = file.name.split('.').pop();
            const fileName = `test-papers/${Date.now()}_${i}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('report-images')
                .upload(fileName, file, { cacheControl: '3600', upsert: false });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                // If bucket doesn't exist, show alert
                if (uploadError.message?.includes('not found') || uploadError.message?.includes('Bucket')) {
                    alert('Supabase Storage 버킷 "report-images"가 없습니다. Supabase 대시보드에서 생성해주세요.');
                }
                continue;
            }

            const { data: urlData } = supabase.storage
                .from('report-images')
                .getPublicUrl(fileName);

            if (urlData?.publicUrl) {
                newUrls.push(urlData.publicUrl);
            }
        }

        setFormData(prev => ({ ...prev, test_images: [...prev.test_images, ...newUrls] }));
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeImage = (index: number) => {
        setFormData(prev => ({ ...prev, test_images: prev.test_images.filter((_, i) => i !== index) }));
    };

    // --- Save Report ---
    const handleSaveReport = async () => {
        if (!selectedClassId || !selectedStudentId) return;
        setIsSaving(true);

        const activeClass = classes.find(c => c.id === selectedClassId);
        const activeStudent = activeClass?.students.find(s => s.id === selectedStudentId);
        const template = activeClass?.templates.find(t => t.reportType === reportType);

        if (!activeClass || !activeStudent) { setIsSaving(false); return; }

        let templateHtml = template?.templateHtml || '<div style="text-align:center; padding: 40px;">반 템플릿이 설정되지 않았습니다.</div>';

        // 1. Process Homeworks
        let hwHtml = '';
        formData.homeworks.forEach(hw => {
            if (!hw.name) return;
            let hwBadgeClass = 'badge-gray';
            if (hw.status === '완료') hwBadgeClass = 'badge-blue';
            else if (hw.status === '미완료') hwBadgeClass = 'badge-red';

            hwHtml += `
        <div style="margin-bottom: 12px;">
            <div class="status-wrap">
                <span class="content-h">${hw.name}</span>
                <span class="badge ${hwBadgeClass}">${hw.status}</span>
            </div>
            ${hw.status !== '완료' && hw.plan ? `<p class="plan-box">→ 보완계획: ${hw.plan}</p>` : ''}
        </div>`;
        });

        // 2. Process Tests
        let testsHtml = '';
        formData.tests.forEach(test => {
            if (!test.name) return;
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

        // 3. Test Images
        let testImagesHtml = '';
        if (formData.test_images.length > 0) {
            testImagesHtml = `<div style="margin-top: 20px; padding: 16px; background: var(--bg-soft); border-radius: 8px; border-left: 4px solid var(--brand-color);">
                <p style="font-size: 13px; font-weight: 700; color: var(--brand-color); margin-bottom: 12px;">📄 시험지 첨부파일</p>`;
            formData.test_images.forEach((url, i) => {
                testImagesHtml += `<a href="${url}" target="_blank" rel="noopener noreferrer" style="display: block; margin-bottom: 8px; font-size: 13px; color: var(--brand-color); text-decoration: underline; font-weight: 600;">시험지 이미지 ${i + 1} 확인하기 →</a>`;
            });
            testImagesHtml += `</div>`;
        }

        // 4. Format Date
        const d = new Date(formData.published_date);
        const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
        const formattedDate = !isNaN(d.getTime()) ? `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${days[d.getDay()]}` : formData.published_date;

        // 5. Attendance (with late/absent details)
        let attendanceDisplay = formData.attendance_status;
        if (formData.attendance_status === '지각' && formData.attendance_time) {
            attendanceDisplay += ` (${formData.attendance_time})`;
        }
        if ((formData.attendance_status === '지각' || formData.attendance_status === '결석') && formData.attendance_reason) {
            attendanceDisplay += `\n사유: ${formData.attendance_reason}`;
        }

        // 6. Replace Variables
        const variables: Record<string, string> = {
            '{{student_name}}': activeStudent.name,
            '{{class_name}}': activeClass.name.replace('[WOODOK] ', ''),
            '{{published_date_kr}}': formattedDate,
            '{{attendance_status}}': attendanceDisplay,
            '{{lesson_content}}': formData.lesson_content,
            '{{hw_name}}': formData.homeworks[0]?.name || '',
            '{{hw_status}}': formData.homeworks[0]?.status || '',
            '{{hw_badge_class}}': formData.homeworks[0]?.status === '완료' ? 'badge-blue' : formData.homeworks[0]?.status === '미완료' ? 'badge-red' : 'badge-gray',
            '{{hw_plan_display}}': formData.homeworks[0]?.status === '완료' ? 'none' : 'block',
            '{{hw_plan}}': formData.homeworks[0]?.plan || '',
            '{{homeworks_html}}': hwHtml,
            '{{next_date_str}}': formData.next_date_str,
            '{{next_content}}': formData.next_content,
            '{{teacher_comment}}': formData.teacher_comment,
            '{{tests_html}}': testsHtml + testImagesHtml,
            '{{contact_link}}': 'https://open.kakao.com/o/sY6xBxji'
        };

        for (const [key, value] of Object.entries(variables)) {
            templateHtml = templateHtml.split(key).join(value);
        }

        await saveStudentReport(selectedStudentId, reportType, formData.published_date, templateHtml, formData);
        setIsSaving(false);
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
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                            className={`w-full bg-black border ${error ? 'border-rose-500' : 'border-white/10'} rounded-xl py-4 text-center text-xl tracking-[0.5em] focus:outline-none focus:border-rose-500 transition-all mb-4`}
                            placeholder="PASSWORD" autoFocus />
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
                <div className="flex items-center gap-2">
                    {/* Excel Import placeholder button */}
                    <button disabled className="flex items-center gap-1.5 bg-white/5 text-slate-500 px-3 py-2 rounded-lg text-xs font-medium border border-white/5 cursor-not-allowed opacity-50" title="추후 활성화 예정">
                        <FileSpreadsheet size={14} /> Excel Import
                    </button>
                    <button onClick={onClose} className="p-2 bg-white/5 rounded-lg text-slate-300 hover:bg-white/10 transition-colors">
                        <X size={20} />
                    </button>
                </div>
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
                                        <button onClick={(e) => { e.stopPropagation(); deleteStudent(selectedClassId!, s.id); }} className="text-slate-600 hover:text-rose-400"><Trash2 size={14} /></button>
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
                                        {isEditing && <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30 font-medium">기존 리포트 수정 중</span>}
                                    </h3>
                                    <button onClick={handleSaveReport} disabled={isSaving}
                                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-900/20 border border-emerald-400/20">
                                        <Save size={16} /> {isSaving ? '저장 중...' : isEditing ? '리포트 수정 저장' : '리포트 발행 & 저장'}
                                    </button>
                                </div>
                                <div className="flex gap-2 bg-black p-1 rounded-lg">
                                    {(['daily', 'weekly', 'monthly'] as const).map(type => (
                                        <button key={type} onClick={() => handleReportTypeChange(type)}
                                            className={`flex-1 py-2 text-sm text-center rounded-md font-medium transition-colors ${reportType === type ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>
                                            {type === 'daily' ? '일간' : type === 'weekly' ? '주간' : '월간'} 템플릿
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                                <div className="max-w-2xl mx-auto space-y-8 pb-32">

                                    {/* 1. 발행 일자 */}
                                    <FormSection icon={<Calendar size={16} />} title="발행 일자 설정">
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">리포트 발행일 (날짜를 바꾸면 해당 날짜의 기존 리포트를 자동으로 불러옵니다)</label>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={handlePrevDay}
                                                    className="p-2.5 bg-slate-900 border border-white/10 rounded-xl hover:bg-slate-800 transition-colors text-slate-400"
                                                >
                                                    <ChevronLeft size={20} />
                                                </button>
                                                <input type="date" name="published_date" value={formData.published_date} onChange={handleDateChange} className="input-field flex-1" />
                                                <button
                                                    onClick={handleNextDay}
                                                    className="p-2.5 bg-slate-900 border border-white/10 rounded-xl hover:bg-slate-800 transition-colors text-slate-400"
                                                >
                                                    <ChevronRight size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </FormSection>

                                    {/* 2. 출결 */}
                                    <FormSection icon={<CheckCircle2 size={16} />} title="출결 및 오늘 학습 내용">
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">출결 상태</label>
                                            <select name="attendance_status" value={formData.attendance_status} onChange={handleFormChange} className="input-field">
                                                <option value="정상 등원 완료">● 정상 등원 완료</option>
                                                <option value="지각">▲ 지각</option>
                                                <option value="결석">■ 결석</option>
                                            </select>
                                        </div>

                                        {/* 지각/결석 시 추가 입력 */}
                                        <AnimatePresence>
                                            {(formData.attendance_status === '지각' || formData.attendance_status === '결석') && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                                    className="grid grid-cols-2 gap-4 overflow-hidden">
                                                    {formData.attendance_status === '지각' && (
                                                        <div>
                                                            <label className="block text-xs text-slate-400 mb-1">등원 시각</label>
                                                            <input type="time" name="attendance_time" value={formData.attendance_time} onChange={handleFormChange} className="input-field" />
                                                        </div>
                                                    )}
                                                    <div className={formData.attendance_status === '결석' ? 'col-span-2' : ''}>
                                                        <label className="block text-xs text-slate-400 mb-1">사유</label>
                                                        <input type="text" name="attendance_reason" value={formData.attendance_reason} onChange={handleFormChange}
                                                            placeholder={formData.attendance_status === '지각' ? '지각 사유 입력' : '결석 사유 입력'} className="input-field" />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">학습 내용 요약</label>
                                            <textarea name="lesson_content" value={formData.lesson_content} onChange={handleFormChange} rows={3}
                                                placeholder="교과서 1과 예상문제 풀이 및 주요 어법 포인트 Review..." className="input-field resize-none" />
                                        </div>
                                    </FormSection>

                                    {/* 3. 과제 이행 현황 (Multiple) */}
                                    <FormSection icon={<FileText size={16} />} title="과제 완료 현황"
                                        action={<button onClick={addHomework} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-md text-white transition-colors flex items-center gap-1"><Plus size={12} /> 과제 추가</button>}>
                                        <div className="space-y-4">
                                            {formData.homeworks.map((hw, idx) => (
                                                <div key={idx} className="bg-slate-900 border border-white/5 rounded-xl p-4 relative group">
                                                    {formData.homeworks.length > 1 && (
                                                        <button onClick={() => removeHomework(idx)} className="absolute -top-3 -right-3 bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 p-1.5 rounded-full border border-slate-700 transition-colors opacity-0 group-hover:opacity-100">
                                                            <X size={14} />
                                                        </button>
                                                    )}
                                                    <div className="grid grid-cols-12 gap-3">
                                                        <div className="col-span-12 md:col-span-7">
                                                            <label className="block text-[10px] text-slate-500 mb-1 uppercase">과제명/범위</label>
                                                            <input type="text" value={hw.name} onChange={(e) => handleHwChange(idx, 'name', e.target.value)}
                                                                placeholder="워크북 17~63p" className="w-full bg-black border border-white/5 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500" />
                                                        </div>
                                                        <div className="col-span-12 md:col-span-5">
                                                            <label className="block text-[10px] text-slate-500 mb-1 uppercase">상태</label>
                                                            <select value={hw.status} onChange={(e) => handleHwChange(idx, 'status', e.target.value)}
                                                                className="w-full bg-black border border-white/5 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500">
                                                                <option value="완료">완료</option>
                                                                <option value="미완료">미완료</option>
                                                                <option value="일부 완료">일부 완료</option>
                                                            </select>
                                                        </div>
                                                        {hw.status !== '완료' && (
                                                            <div className="col-span-12">
                                                                <label className="block text-[10px] text-slate-500 mb-1 uppercase">보완 계획</label>
                                                                <input type="text" value={hw.plan} onChange={(e) => handleHwChange(idx, 'plan', e.target.value)}
                                                                    placeholder="금요일까지 풀이 완료하도록 지도" className="w-full bg-black border border-white/5 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </FormSection>

                                    {/* 4. 테스트 분석 */}
                                    <FormSection icon={<LayoutDashboard size={16} />} title="테스트 성취도 분석"
                                        action={<button onClick={addTest} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-md text-white transition-colors flex items-center gap-1"><Plus size={12} /> 테스트 추가</button>}>
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
                                                        <div className="col-span-4">
                                                            <label className="block text-[10px] text-slate-500 mb-1 uppercase">획득 점수</label>
                                                            <input type="number" value={test.score} onChange={(e) => handleTestChange(idx, 'score', e.target.value)} placeholder="51" className="w-full bg-black border border-white/5 rounded-lg px-3 py-2 text-sm text-rose-400 font-bold focus:outline-none focus:border-rose-500 placeholder:font-normal" />
                                                        </div>
                                                        <div className="col-span-4">
                                                            <label className="block text-[10px] text-slate-500 mb-1 uppercase">만점 점수</label>
                                                            <input type="number" value={test.total} onChange={(e) => handleTestChange(idx, 'total', e.target.value)} placeholder="70" className="w-full bg-black border border-white/5 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500" />
                                                        </div>
                                                        <div className="col-span-4">
                                                            <label className="block text-[10px] text-slate-500 mb-1 uppercase">반 평균</label>
                                                            <input type="number" value={test.avg} onChange={(e) => handleTestChange(idx, 'avg', e.target.value)} placeholder="49" className="w-full bg-black border border-white/5 rounded-lg px-3 py-2 text-sm text-emerald-400 font-bold focus:outline-none focus:border-rose-500 placeholder:font-normal" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Image Upload */}
                                        <div className="mt-4">
                                            <label className="block text-xs text-slate-400 mb-2">📸 시험지 사진 첨부</label>
                                            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                                            <button onClick={() => fileInputRef.current?.click()} disabled={isUploading}
                                                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-white/10 px-4 py-3 rounded-xl text-sm transition-colors disabled:opacity-50 w-full justify-center">
                                                {isUploading ? (
                                                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> 업로드 중...</>
                                                ) : (
                                                    <><Upload size={16} /> 시험지 이미지 업로드</>
                                                )}
                                            </button>
                                            {formData.test_images.length > 0 && (
                                                <div className="mt-3 space-y-2">
                                                    {formData.test_images.map((url, i) => (
                                                        <div key={i} className="flex items-center gap-2 bg-slate-900 border border-white/5 rounded-lg px-3 py-2">
                                                            <ImageIcon size={14} className="text-emerald-400 shrink-0" />
                                                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 truncate flex-1 hover:underline">
                                                                시험지 {i + 1}
                                                            </a>
                                                            <button onClick={() => removeImage(i)} className="text-slate-500 hover:text-rose-400"><X size={14} /></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </FormSection>

                                    {/* 5. 다음 차시 안내 */}
                                    <FormSection icon={<Calendar size={16} />} title="다음 차시 안내">
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">다음 수업 날짜 텍스트</label>
                                            <input type="text" name="next_date_str" value={formData.next_date_str} onChange={handleFormChange} placeholder="3월 9일 월요일" className="input-field" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">다음 숙제 리스트</label>
                                            <textarea name="next_content" value={formData.next_content} onChange={handleFormChange} rows={3}
                                                placeholder="• 교과 1과 단어 끝까지 암기&#10;• 워크북 미완 부분 보완" className="input-field resize-none" />
                                        </div>
                                    </FormSection>

                                    {/* 6. 선생님 코멘트 */}
                                    <FormSection icon={<Edit3 size={16} />} title="선생님 개인 코멘트">
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-2">
                                                * 앞선 인사와 끝 인사는 템플릿에 고정. 본론만 작성.
                                            </label>
                                            <textarea name="teacher_comment" value={formData.teacher_comment} onChange={handleFormChange} rows={5}
                                                placeholder="오늘 성취도가 매우 좋습니다..." className="input-field resize-none" />
                                        </div>
                                    </FormSection>

                                </div>
                            </div>
                        </>
                    )}
                </div>

            </div>

            {/* Global Styles for input-field */}
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
                .input-field:focus {
                    border-color: #f43f5e;
                }
                .input-field::placeholder {
                    color: #475569;
                }
            `}</style>
        </motion.div>
    );
}

// Reusable section component
function FormSection({ icon, title, action, children }: { icon: React.ReactNode, title: string, action?: React.ReactNode, children: React.ReactNode }) {
    return (
        <div className="space-y-4">
            <h4 className="flex items-center justify-between gap-2 text-sm font-bold text-rose-400 uppercase tracking-wider border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">{icon} {title}</div>
                {action}
            </h4>
            {children}
        </div>
    );
}
