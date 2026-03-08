import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReportStore } from '@/store/reportStore';
import { supabase } from '@/lib/supabase';
import { Lock, X, Plus, Trash2, Edit3, Save, LayoutDashboard, Calendar, FileText, CheckCircle2, Upload, Image as ImageIcon, FileSpreadsheet, ChevronLeft, ChevronRight, Users, ClipboardCheck, Download } from 'lucide-react';

// --- Types ---
const HW_STATUSES = ['확인완료', '교재미지참', '전체미완', '일부미완', '미완 후 보충완료', '결석'] as const;
type HwStatus = typeof HW_STATUSES[number];

interface StudentFormData {
    attendance_status: string;
    attendance_time: string;
    attendance_reason: string;
    makeupType: '영상보강' | '직접보강' | '';
    makeupDate: string;
    makeupStatus: '미완료' | '보강완료';
    hw_statuses: { status: HwStatus; plan: string; recheckDate?: string; postponeCount?: number }[];
    test_scores: { score: string; wordTestResult?: 'pass' | 'fail'; failAction?: '해당없음' | '재시험 완료' | '추후 재시'; retestDate?: string; postponeCount?: number }[];
    teacher_comment: string;
}

interface SharedFormData {
    published_date: string;
    lesson_content: string;
    homeworks: { name: string; assignees: string[]; checkDate: string; isWordOrTest: boolean }[];
    newAssignments: { name: string; assignees: string[]; checkDate: string; isWordOrTest: boolean }[];
    tests: { name: string; desc: string; total: string; cutline: string; isWordTest: boolean; assignees: string[] }[];
    test_images: string[];
    next_date_str: string;
    next_content: string;
}

const defaultStudentForm = (hwCount: number, testCount: number): StudentFormData => ({
    attendance_status: '정상 등원 완료',
    attendance_time: '',
    attendance_reason: '',
    makeupType: '',
    makeupDate: '',
    makeupStatus: '미완료',
    hw_statuses: Array.from({ length: hwCount }, () => ({ status: '확인완료' as HwStatus, plan: '' })),
    test_scores: Array.from({ length: testCount }, () => ({ score: '' })),
    teacher_comment: ''
});

export default function AdminPanel({ onClose }: { onClose: () => void }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingReports, setIsLoadingReports] = useState(false);
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

    // Missing Assignment Tracker
    const [showTrackerModal, setShowTrackerModal] = useState(false);
    const [trackerData, setTrackerData] = useState<any[]>([]);
    const [isTrackerLoading, setIsTrackerLoading] = useState(false);
    const [postponeStateId, setPostponeStateId] = useState<string | null>(null);
    const [postponeDate, setPostponeDate] = useState<string>('');

    // Homework status modal
    const [hwModalIdx, setHwModalIdx] = useState<number | null>(null);

    // Assignment modals
    const [hwAssignIdx, setHwAssignIdx] = useState<number | null>(null);
    const [testAssignIdx, setTestAssignIdx] = useState<number | null>(null);

    // --- Shared form data ---
    const [sharedForm, setSharedForm] = useState<SharedFormData>({
        published_date: new Date().toISOString().split('T')[0],
        lesson_content: '',
        homeworks: [{ name: '', assignees: [], checkDate: '', isWordOrTest: false }],
        newAssignments: [{ name: '', assignees: [], checkDate: '', isWordOrTest: false }],
        tests: [{ name: '', desc: '', total: '', cutline: '', isWordTest: false, assignees: [] }],
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
        const newHw = [...sharedForm.homeworks, { name: '', assignees: activeClass ? activeClass.students.map(s => s.id) : [], checkDate: sharedForm.published_date, isWordOrTest: false }];
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
    const handleHwSharedChange = (idx: number, field: keyof SharedFormData['homeworks'][number], value: any) => {
        const newHw = [...sharedForm.homeworks];
        newHw[idx] = { ...newHw[idx], [field]: value };
        setSharedForm(prev => ({ ...prev, homeworks: newHw }));
    };

    const addNewAssignment = () => {
        const checkD = sharedForm.next_date_str ? sharedForm.next_date_str : sharedForm.published_date;
        const newArr = [...sharedForm.newAssignments, { name: '', assignees: activeClass ? activeClass.students.map(s => s.id) : [], checkDate: checkD, isWordOrTest: false }];
        setSharedForm(prev => ({ ...prev, newAssignments: newArr }));
    };
    const removeNewAssignment = (idx: number) => {
        if (sharedForm.newAssignments.length <= 1) return;
        const newArr = sharedForm.newAssignments.filter((_, i) => i !== idx);
        setSharedForm(prev => ({ ...prev, newAssignments: newArr }));
    };
    const handleNewAssignChange = (idx: number, field: keyof SharedFormData['newAssignments'][number], value: any) => {
        const newArr = [...sharedForm.newAssignments];
        newArr[idx] = { ...newArr[idx], [field]: value };
        setSharedForm(prev => ({ ...prev, newAssignments: newArr }));
    };

    const addTest = () => {
        const newTests = [...sharedForm.tests, { name: '', desc: '', total: '', cutline: '', isWordTest: false, assignees: activeClass ? activeClass.students.map(s => s.id) : [] }];
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

    // --- Auto-generate next homework text ---
    const generateNextHomeworkText = (homeworks: SharedFormData['homeworks']) => {
        if (!activeClass) return '';

        const allStudentIds = activeClass.students.map(s => s.id);
        const globalHws: string[] = [];
        const individualHws: Record<string, string[]> = {}; // Map of student name -> homework names

        homeworks.forEach(hw => {
            if (!hw.name) return; // Skip empty homeworks

            const isGlobal = hw.assignees.length === allStudentIds.length && allStudentIds.every(id => hw.assignees.includes(id));
            if (isGlobal || hw.assignees.length === 0) { // Assume empty assignees = global during creation if not explicitly set initially
                globalHws.push(hw.name);
            } else {
                hw.assignees.forEach(studentId => {
                    const student = activeClass?.students.find(s => s.id === studentId);
                    if (student) {
                        if (!individualHws[student.name]) individualHws[student.name] = [];
                        individualHws[student.name].push(hw.name);
                    }
                });
            }
        });

        let text = '';
        if (globalHws.length > 0) {
            text += '<전체>\n' + globalHws.map(name => `• ${name}`).join('\n') + '\n';
        }

        Object.keys(individualHws).forEach(studentName => {
            text += `\n<${studentName} 개별과제>\n` + individualHws[studentName].map(name => `• ${name}`).join('\n') + '\n';
        });

        return text.trim();
    };

    // Update next_content when newAssignments change or are saved
    React.useEffect(() => {
        if (activeClass) {
            handleSharedChange('next_content', generateNextHomeworkText(sharedForm.newAssignments));
        }
    }, [sharedForm.newAssignments, activeClass]);

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

    // --- Load existing reports for current date + Load past assignments based on checkDate ---
    const handleLoadReports = async () => {
        if (!activeClass) return;
        setIsLoadingReports(true);

        try {
            let sharedLoaded = false;
            const newStudentForms: Record<string, StudentFormData> = {};
            let fetchedPastAssignments: SharedFormData['homeworks'] = [];

            // 1. Fetch current date reports to load existing data for today
            for (const student of activeClass.students) {
                const reports = await fetchStudentReports(student.id);

                // Find report for today
                const matchingReport = reports.find(
                    r => r.reportType === reportType && r.publishedDate === sharedForm.published_date
                );

                if (matchingReport?.rawDataJson) {
                    const raw = matchingReport.rawDataJson;

                    // Load shared form from the first student's data
                    if (!sharedLoaded) {
                        setSharedForm(prev => ({
                            ...prev,
                            lesson_content: raw.lesson_content || '',
                            homeworks: (raw.homeworks && raw.homeworks.length > 0) ? raw.homeworks : [{ name: '', assignees: [], checkDate: '', isWordOrTest: false }],
                            newAssignments: (raw.newAssignments && raw.newAssignments.length > 0) ? raw.newAssignments : [{ name: '', assignees: [], checkDate: '', isWordOrTest: false }],
                            tests: (raw.tests && raw.tests.length > 0)
                                ? raw.tests.map((t: any) => ({ name: t.name || '', desc: t.desc || '', total: t.total || '', cutline: t.cutline || t.avg || '', isWordTest: t.isWordTest || false, assignees: t.assignees || [] }))
                                : [{ name: '', desc: '', total: '', cutline: '', isWordTest: false, assignees: [] }],
                            test_images: raw.test_images || [],
                            next_date_str: raw.next_date_str || '',
                            next_content: raw.next_content || ''
                        }));
                        sharedLoaded = true;
                    }

                    // Load per-student data
                    const hwCount = (raw.homeworks?.length) || sharedForm.homeworks.length;
                    const testCount = (raw.tests?.length) || sharedForm.tests.length;
                    newStudentForms[student.id] = {
                        attendance_status: raw.attendance_status || '정상 등원 완료',
                        attendance_time: raw.attendance_time || '',
                        attendance_reason: raw.attendance_reason || '',
                        makeupType: raw.makeupType || '',
                        makeupDate: raw.makeupDate || '',
                        makeupStatus: raw.makeupStatus || '미완료',
                        hw_statuses: raw.hw_statuses ||
                            Array.from({ length: hwCount }, (_, i) => ({
                                status: raw.assignment_tracking?.[i]?.status || '확인완료',
                                plan: raw.assignment_tracking?.[i]?.plan || ''
                            })),
                        test_scores: raw.test_scores ||
                            Array.from({ length: testCount }, () => ({ score: '' })),
                        teacher_comment: raw.teacher_comment || ''
                    };
                } else {
                    // No report for this student on this date — use defaults
                    newStudentForms[student.id] = defaultStudentForm(sharedForm.homeworks.length, sharedForm.tests.length);
                }

                // 2. While we are fetching reports for this student, let's also look for PAST assignments where checkDate === TODAY
                // and it is NOT a word/test assignment.
                const pastReportsWithIncomingAssignments = reports.filter(
                    r => r.reportType === reportType && r.publishedDate !== sharedForm.published_date && r.rawDataJson?.newAssignments
                );

                pastReportsWithIncomingAssignments.forEach(pr => {
                    const hws = pr.rawDataJson.newAssignments as SharedFormData['newAssignments'];
                    hws.forEach(hw => {
                        if (hw.name && hw.checkDate === sharedForm.published_date && !hw.isWordOrTest) {
                            // Only add if it's assigned to this student (or everyone) and we haven't added it yet
                            const isAssignedToThisStudent = hw.assignees.length === 0 || hw.assignees.includes(student.id);
                            const alreadyAdded = fetchedPastAssignments.some(existing => existing.name === hw.name && existing.checkDate === hw.checkDate);

                            if (isAssignedToThisStudent && !alreadyAdded) {
                                fetchedPastAssignments.push(hw);
                            }
                        }
                    });
                });
            }

            // 3. Merge fetched past assignments into the shared form
            if (fetchedPastAssignments.length > 0) {
                setSharedForm(prev => {
                    const currentHomeworks = prev.homeworks.filter(hw => hw.name.trim() !== '');

                    // Filter out any fetched assignments that are *already* in the current homework list (by name) to avoid duplicates if re-loading
                    const newUniqueAssignments = fetchedPastAssignments.filter(fetched =>
                        !currentHomeworks.some(existing => existing.name === fetched.name)
                    );

                    const mergedHomeworks = [...currentHomeworks, ...newUniqueAssignments];

                    if (mergedHomeworks.length === 0) {
                        mergedHomeworks.push({ name: '', assignees: [], checkDate: '', isWordOrTest: false });
                    }

                    // Sync student forms to accommodate expanding homework array
                    setTimeout(() => syncStudentFormsToShared(mergedHomeworks, prev.tests), 0);

                    return {
                        ...prev,
                        homeworks: mergedHomeworks
                    };
                });
                alert(`✅ ${sharedForm.published_date} 리포트 데이터 및 점검일이 오늘인 이전 과제 ${fetchedPastAssignments.length}개를 불러왔습니다.`);
            } else {
                setStudentForms(newStudentForms);
                alert(`✅ ${sharedForm.published_date} 리포트 데이터를 불러왔습니다.`);
            }

        } catch (err) {
            console.error('Load error:', err);
            alert('⚠️ 데이터 불러오기에 실패했습니다.');
        }
        setIsLoadingReports(false);
    };

    // --- Load Past Assignments Only ---
    const handleLoadPastAssignments = async () => {
        if (!activeClass) return;
        setIsLoadingReports(true);
        try {
            let fetchedPastAssignments: SharedFormData['newAssignments'] = [];
            for (const student of activeClass.students) {
                const reports = await fetchStudentReports(student.id);
                const pastReportsWithIncomingAssignments = reports.filter(
                    r => r.reportType === reportType && r.publishedDate !== sharedForm.published_date && r.rawDataJson?.newAssignments
                );
                pastReportsWithIncomingAssignments.forEach(pr => {
                    const hws = pr.rawDataJson.newAssignments as SharedFormData['newAssignments'];
                    hws.forEach(hw => {
                        if (hw.name && hw.checkDate === sharedForm.published_date && !hw.isWordOrTest) {
                            const isAssignedToThisStudent = hw.assignees.length === 0 || hw.assignees.includes(student.id);
                            const alreadyAdded = fetchedPastAssignments.some(existing => existing.name === hw.name && existing.checkDate === hw.checkDate);
                            if (isAssignedToThisStudent && !alreadyAdded) {
                                fetchedPastAssignments.push(hw);
                            }
                        }
                    });
                });
            }

            if (fetchedPastAssignments.length > 0) {
                setSharedForm(prev => {
                    const currentHomeworks = prev.homeworks.filter(hw => hw.name.trim() !== '');
                    const newUniqueAssignments = fetchedPastAssignments.filter(fetched =>
                        !currentHomeworks.some(existing => existing.name === fetched.name)
                    );
                    const mergedHomeworks = [...currentHomeworks, ...newUniqueAssignments];
                    if (mergedHomeworks.length === 0) {
                        mergedHomeworks.push({ name: '', assignees: [], checkDate: '', isWordOrTest: false });
                    }
                    setTimeout(() => syncStudentFormsToShared(mergedHomeworks, prev.tests), 0);
                    return { ...prev, homeworks: mergedHomeworks };
                });
                alert(`✅ 점검일이 오늘(${sharedForm.published_date})인 지난 과제 ${fetchedPastAssignments.length}개를 불러왔습니다.`);
            } else {
                alert(`ℹ️ 점검일이 오늘인 지난 과제가 없습니다.`);
            }
        } catch (err) {
            console.error('Load past hw error:', err);
            alert('⚠️ 과제 불러오기에 실패했습니다.');
        }
        setIsLoadingReports(false);
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

        // Find template: first check current class, then fallback to any class with this template type
        let template = activeClass.templates.find(t => t.reportType === reportType);
        if (!template) {
            for (const cls of classes) {
                const fallback = cls.templates.find(t => t.reportType === reportType);
                if (fallback) { template = fallback; break; }
            }
        }
        const baseTemplate = template?.templateHtml || '<div style="text-align:center; padding: 40px;">반 템플릿이 설정되지 않았습니다.</div>';

        for (const student of activeClass.students) {
            const sf = studentForms[student.id];
            if (!sf) continue;

            let templateHtml = baseTemplate;

            // Build homework HTML (Filter out word/test assignments)
            let hwHtml = '';
            sharedForm.homeworks.forEach((hw, idx) => {
                if (!hw.name || hw.isWordOrTest) return; // Skip word/test assignments
                const sts = sf.hw_statuses[idx];
                if (!sts) return;

                // Only include if assigned to this student (or everyone)
                if (hw.assignees.length > 0 && !hw.assignees.includes(student.id)) return;

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

                // Only include if assigned to this student (or everyone)
                if (test.assignees.length > 0 && !test.assignees.includes(student.id)) return;

                const ts = sf.test_scores[idx];
                if (!ts) return;
                const scoreNowNum = parseFloat(ts.score) || 0;
                const scoreTotalNum = parseFloat(test.total) || 100;
                const avgScore = calcAvg(idx);
                const scorePercent = scoreTotalNum > 0 ? (scoreNowNum / scoreTotalNum) * 100 : 0;
                const avgPercent = scoreTotalNum > 0 ? (scoreTotalNum > 0 ? (avgScore / scoreTotalNum) * 100 : 0) : 0;
                const isBelowAvg = scoreNowNum < avgScore;

                // Auto-determine pass/fail for word tests
                let wordTestResult = ts.wordTestResult;
                if (test.isWordTest && test.cutline) {
                    const cutlineNum = parseFloat(test.cutline) || 0;
                    if (ts.score !== '') {
                        wordTestResult = isFinite(scoreNowNum) && scoreNowNum >= cutlineNum ? 'pass' : 'fail';
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

            // Evaluate student-specific "Next Homework" content
            let studentNextContent = '';
            // If the user manually edited the box, prioritize that? No, we need it dynamic.
            // If there's 0 custom generic text, reconstruct dynamically:
            const allIds = activeClass.students.map(s => s.id);
            const gHws: string[] = [];
            const isHws: string[] = [];

            sharedForm.newAssignments.forEach(hw => {
                if (!hw.name) return;
                const isGlobal = hw.assignees.length === allIds.length || hw.assignees.length === 0;
                if (isGlobal || hw.assignees.length === 0) {
                    gHws.push(hw.name);
                } else if (hw.assignees.includes(student.id)) {
                    isHws.push(hw.name);
                }
            });

            if (gHws.length > 0) {
                studentNextContent += '<전체>\n' + gHws.map(name => `• ${name}`).join('\n') + '\n';
            }
            if (isHws.length > 0) {
                studentNextContent += `\n<${student.name} 개별과제>\n` + isHws.map(name => `• ${name}`).join('\n') + '\n';
            }
            if (studentNextContent.trim() === '' && sharedForm.next_content.trim() !== '') {
                // strict fallback string if newAssignments is empty but they typed something directly
                studentNextContent = sharedForm.next_content;
            }

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
                '{{next_content}}': studentNextContent.trim(),
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

    // --- Tracker Logic ---
    const loadMissingTrackerData = async () => {
        setIsTrackerLoading(true);
        try {
            const incompleteItems: any[] = [];

            // Loop through all classes and students
            for (const cls of classes) {
                for (const student of cls.students) {
                    const reports = await fetchStudentReports(student.id);

                    reports.forEach(report => {
                        const raw = report.rawDataJson;
                        if (!raw) return;

                        // 1. Check Missing Homeworks
                        if (raw.homeworks && raw.hw_statuses) {
                            raw.homeworks.forEach((hw: any, idx: number) => {
                                const isAssigned = !hw.assignees || hw.assignees.length === 0 || hw.assignees.includes(student.id);
                                if (isAssigned && hw.name) {
                                    const status = raw.hw_statuses[idx]?.status;
                                    const plan = raw.hw_statuses[idx]?.plan;
                                    const recheckDate = raw.hw_statuses[idx]?.recheckDate || '';
                                    const postponeCount = raw.hw_statuses[idx]?.postponeCount || 0;

                                    if (status !== '확인완료' && status !== '미완 후 보충완료') {
                                        incompleteItems.push({
                                            id: `${report.id}-hw-${idx}`,
                                            reportId: report.id,
                                            studentId: student.id,
                                            studentName: student.name,
                                            className: cls.name,
                                            date: report.publishedDate,
                                            targetDate: recheckDate || report.publishedDate,
                                            type: 'homework',
                                            name: hw.name,
                                            status: status,
                                            plan: plan,
                                            postponeCount: postponeCount,
                                            isWordOrTest: hw.isWordOrTest,
                                            rawIndex: idx
                                        });
                                    }
                                }
                            });
                        }

                        // 2. Check Failed/Postponed Tests
                        if (raw.tests && raw.test_scores) {
                            raw.tests.forEach((test: any, idx: number) => {
                                const isAssigned = !test.assignees || test.assignees.length === 0 || test.assignees.includes(student.id);
                                if (isAssigned && test.name) {
                                    const ts = raw.test_scores[idx];
                                    const postponeCount = ts?.postponeCount || 0;
                                    const isFail = test.isWordTest && ts?.failAction === '추후 재시';
                                    const isMissed = ts?.score === '미응시(결석)' || ts?.score === '연기';

                                    if ((isFail || isMissed) && ts?.failAction !== '재시험 완료' && ts?.failAction !== '해당없음') {
                                        const displayStatus = isFail ? '추후 재시' : ts.score;
                                        incompleteItems.push({
                                            id: `${report.id}-test-${idx}`,
                                            reportId: report.id,
                                            studentId: student.id,
                                            studentName: student.name,
                                            className: cls.name,
                                            date: report.publishedDate,
                                            targetDate: ts?.retestDate || report.publishedDate,
                                            type: 'test',
                                            name: test.name,
                                            status: displayStatus,
                                            plan: `재시험일: ${ts?.retestDate || '미정'}`,
                                            score: ts?.score,
                                            postponeCount: postponeCount,
                                            rawIndex: idx
                                        });
                                    }
                                }
                            });
                        }

                        // 3. Check Unresolved Absences
                        if (raw.attendance_status === '결석' && raw.makeupStatus !== '보강완료') {
                            incompleteItems.push({
                                id: `${report.id}-absence`,
                                reportId: report.id,
                                studentId: student.id,
                                studentName: student.name,
                                className: cls.name,
                                date: report.publishedDate,
                                targetDate: raw.makeupDate || report.publishedDate,
                                type: 'absence',
                                name: `[결석 보강] ${raw.lesson_content ? raw.lesson_content.substring(0, 15) + '...' : '수업결손'}`,
                                status: '미완료',
                                plan: `보강유형: ${raw.makeupType || '미정'}`,
                                postponeCount: raw.postponeCount || 0,
                                rawIndex: -1
                            });
                        }
                    });
                }
            }

            // Sort by targetDate ascending (most urgent first)
            incompleteItems.sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());
            setTrackerData(incompleteItems);
        } catch (error) {
            console.error('Failed to load tracker data', error);
        }
        setIsTrackerLoading(false);
    };

    const handleTrackerUpdate = async (item: any, actionType: 'COMPLETE' | 'POSTPONE', payload: string) => {
        try {
            const { data: reportData, error } = await supabase.from('student_reports').select('*').eq('id', item.reportId).single();
            if (error || !reportData) throw new Error('Cannot find report');

            const rawJson = reportData.raw_data_json || {};

            if (item.type === 'homework') {
                if (rawJson.hw_statuses && rawJson.hw_statuses[item.rawIndex]) {
                    if (actionType === 'COMPLETE') {
                        rawJson.hw_statuses[item.rawIndex].status = '미완 후 보충완료';
                        rawJson.hw_statuses[item.rawIndex].plan = '보충완료';
                    } else if (actionType === 'POSTPONE') {
                        rawJson.hw_statuses[item.rawIndex].postponeCount = (rawJson.hw_statuses[item.rawIndex].postponeCount || 0) + 1;
                        rawJson.hw_statuses[item.rawIndex].recheckDate = payload;
                    }
                }
            } else if (item.type === 'test') {
                if (rawJson.test_scores && rawJson.test_scores[item.rawIndex]) {
                    if (actionType === 'COMPLETE') {
                        rawJson.test_scores[item.rawIndex].failAction = '재시험 완료';
                    } else if (actionType === 'POSTPONE') {
                        rawJson.test_scores[item.rawIndex].postponeCount = (rawJson.test_scores[item.rawIndex].postponeCount || 0) + 1;
                        rawJson.test_scores[item.rawIndex].retestDate = payload;
                        if (rawJson.test_scores[item.rawIndex].score === '미응시(결석)' || rawJson.test_scores[item.rawIndex].score === '연기') { } else {
                            rawJson.test_scores[item.rawIndex].failAction = '추후 재시';
                        }
                    }
                }
            } else if (item.type === 'absence') {
                if (actionType === 'COMPLETE') {
                    rawJson.makeupStatus = '보강완료';
                } else if (actionType === 'POSTPONE') {
                    rawJson.postponeCount = (rawJson.postponeCount || 0) + 1;
                    rawJson.makeupDate = payload;
                }
            }

            const { error: updateError } = await supabase.from('student_reports').update({ raw_data_json: rawJson }).eq('id', item.reportId);
            if (updateError) throw updateError;

            if (actionType === 'COMPLETE') {
                setTrackerData(prev => prev.filter(i => i.id !== item.id));
            } else {
                alert('연기 처리 되었습니다.');
                loadMissingTrackerData();
                setPostponeStateId(null);
            }

        } catch (error) {
            console.error('Failed to update tracker item', error);
            alert('업데이트 실패했습니다.');
        }
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
                    <button onClick={() => { setShowTrackerModal(true); loadMissingTrackerData(); }} className="flex items-center gap-1.5 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 px-3 py-2 rounded-lg text-xs font-bold border border-rose-500/30 transition-colors">
                        <FileText size={14} /> 미완과제 추적기
                    </button>
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
                                    <div className="flex items-center gap-2">
                                        <button onClick={handleLoadReports} disabled={isLoadingReports}
                                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-900/20 border border-blue-400/20">
                                            <Download size={16} /> {isLoadingReports ? '불러오는 중...' : '불러오기'}
                                        </button>
                                        <button onClick={handleSaveAllReports} disabled={isSaving}
                                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-900/20 border border-emerald-400/20">
                                            <Save size={16} /> {isSaving ? '저장 중...' : `전체 발행 (${activeClass.students.length}명)`}
                                        </button>
                                    </div>
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

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                                                        <div className="space-y-1">
                                                            <input type="text" value={sf.attendance_reason} onChange={e => updateStudentForm(student.id, prev => ({ ...prev, attendance_reason: e.target.value }))}
                                                                placeholder="결석 사유" className="w-full bg-black border border-white/5 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:border-rose-500" />
                                                            <div className="flex gap-1 mt-1">
                                                                <select value={sf.makeupType} onChange={e => updateStudentForm(student.id, prev => ({ ...prev, makeupType: e.target.value as any }))}
                                                                    className="flex-1 bg-black border border-white/5 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:border-rose-500">
                                                                    <option value="">보강유형 선택</option>
                                                                    <option value="영상보강">영상보강</option>
                                                                    <option value="직접보강">직접보강</option>
                                                                </select>
                                                                {sf.makeupType && (
                                                                    <div className="flex flex-1 items-center gap-1">
                                                                        <input type="date" value={sf.makeupDate} onChange={e => updateStudentForm(student.id, prev => ({ ...prev, makeupDate: e.target.value }))}
                                                                            title={sf.makeupType === '영상보강' ? '영상배부일' : '보강예정일'}
                                                                            className="w-full bg-black border border-white/5 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:border-amber-500 text-amber-200" />
                                                                        <button onClick={() => {
                                                                            const currentStr = sf.makeupDate || new Date().toISOString().split('T')[0];
                                                                            const d = new Date(currentStr);
                                                                            d.setDate(d.getDate() + 1);
                                                                            updateStudentForm(student.id, prev => ({ ...prev, makeupDate: d.toISOString().split('T')[0] }));
                                                                        }} className="px-1.5 py-1 bg-slate-800 text-slate-400 rounded-lg hover:bg-slate-700 text-[10px]">&gt;</button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
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

                                        {/* Date & Lesson content */}
                                        <div className="flex flex-col md:flex-row gap-4">
                                            <div className="w-full md:w-1/3">
                                                <label className="block text-xs text-slate-400 mb-1">수업 일자</label>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={handlePrevDay} className="p-2.5 bg-slate-900 border border-white/10 rounded-xl hover:bg-slate-800 transition-colors text-slate-400"><ChevronLeft size={20} /></button>
                                                    <input type="date" value={sharedForm.published_date} onChange={e => handleSharedChange('published_date', e.target.value)} className="input-field flex-1 text-sm px-2 cursor-pointer" />
                                                    <button onClick={handleNextDay} className="p-2.5 bg-slate-900 border border-white/10 rounded-xl hover:bg-slate-800 transition-colors text-slate-400"><ChevronRight size={20} /></button>
                                                </div>
                                            </div>
                                            <div className="w-full md:w-2/3">
                                                <label className="block text-xs text-slate-400 mb-1">학습 내용 요약</label>
                                                <textarea value={sharedForm.lesson_content} onChange={e => handleSharedChange('lesson_content', e.target.value)} rows={2}
                                                    placeholder="교과서 1과 예상문제 풀이 및 주요 어법 포인트 Review..." className="input-field resize-none h-auto md:h-[46px]" />
                                            </div>
                                        </div>

                                        {/* Homework names + status check button */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-xs text-slate-400">금일 과제 목록 (검사)</label>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={handleLoadPastAssignments} className="text-xs bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 px-3 py-1 rounded-md transition-colors flex items-center gap-1 font-bold border border-indigo-500/20"><Download size={12} /> 지난 과제 불러오기</button>
                                                    <button onClick={addHomework} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-md text-white transition-colors flex items-center gap-1"><Plus size={12} /> 추가</button>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                {sharedForm.homeworks.map((hw, idx) => (
                                                    <div key={idx} className="flex gap-2 items-center">
                                                        <input value={hw.name} onChange={e => handleHwSharedChange(idx, 'name', e.target.value)} placeholder={`결과 체크용 과제 ${idx + 1}`}
                                                            className="flex-1 bg-black border border-white/5 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500" />
                                                        {hw.name && (
                                                            <div className="flex items-center gap-1">
                                                                <button onClick={() => setHwModalIdx(idx)}
                                                                    className="flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 px-2.5 py-2 rounded-lg text-[10px] font-bold border border-amber-500/20 transition-colors whitespace-nowrap">
                                                                    <ClipboardCheck size={14} /> 상태체크
                                                                </button>
                                                            </div>
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
                                                        <div key={idx} className="bg-black border border-white/5 rounded-xl p-4 relative group">
                                                            <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                                                                <button onClick={() => setTestAssignIdx(idx)} className="text-[10px] flex items-center gap-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 px-2 py-1 rounded border border-indigo-500/20 transition-colors">
                                                                    <Users size={12} /> 응시자 지정
                                                                </button>
                                                                {sharedForm.tests.length > 1 && (
                                                                    <button onClick={() => removeTest(idx)} className="text-slate-500 hover:text-rose-400 p-1"><X size={14} /></button>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col lg:flex-row gap-6">
                                                                {/* Left: Test Config */}
                                                                <div className="lg:w-1/3 space-y-3">
                                                                    <div>
                                                                        <label className="block text-[10px] text-slate-500 mb-1">시험명</label>
                                                                        <input value={test.name} onChange={e => handleTestSharedChange(idx, 'name', e.target.value)} placeholder="단어 1~2일차" className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500" />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[10px] text-slate-500 mb-1">범위/설명</label>
                                                                        <input value={test.desc} onChange={e => handleTestSharedChange(idx, 'desc', e.target.value)} placeholder="능률보카" className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500" />
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <div className="flex-1">
                                                                            <label className="block text-[10px] text-slate-500 mb-1">만점</label>
                                                                            <input value={test.total} onChange={e => handleTestSharedChange(idx, 'total', e.target.value)} placeholder="100" className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500" />
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <label className="block text-[10px] text-amber-500/70 mb-1">커트라인</label>
                                                                            <input value={test.cutline} onChange={e => handleTestSharedChange(idx, 'cutline', e.target.value)} placeholder="80" className="w-full bg-slate-900 border border-amber-500/30 rounded-lg px-3 py-2 text-sm text-amber-400 focus:outline-none focus:border-amber-500" />
                                                                        </div>
                                                                    </div>
                                                                    <div className="pt-2 border-t border-white/5">
                                                                        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                                                                            <input type="checkbox" checked={test.isWordTest} onChange={e => handleTestSharedChange(idx, 'isWordTest', e.target.checked)} className="rounded" />
                                                                            단어 테스트 (커트라인 미달시 FAIL)
                                                                        </label>
                                                                    </div>
                                                                    {test.name && <div className="text-xs text-emerald-400 font-bold bg-emerald-500/10 inline-block px-2 py-1 rounded">평균: {avg}점</div>}
                                                                </div>

                                                                {/* Right: Inline Student Scores */}
                                                                <div className="lg:w-2/3 lg:border-l lg:border-white/5 lg:pl-6">
                                                                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">학생 점수 입력</h5>
                                                                    {!test.name ? (
                                                                        <div className="text-xs text-slate-600 italic">시험명을 입력하면 활성화됩니다.</div>
                                                                    ) : (
                                                                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2">
                                                                            {activeClass?.students.filter(student => test.assignees.includes(student.id) || test.assignees.length === 0).map(student => {
                                                                                const sf = studentForms[student.id];
                                                                                const ts = sf?.test_scores[idx] || { score: '' };
                                                                                const scoreNum = parseFloat(ts.score) || 0;
                                                                                const cutlineNum = parseFloat(test.cutline) || 0;
                                                                                const isFail = test.isWordTest && test.cutline && ts.score !== '' && isFinite(scoreNum) && scoreNum < cutlineNum;
                                                                                return (
                                                                                    <div key={student.id} className="flex items-center flex-wrap gap-2 bg-slate-900/50 p-2 rounded-lg border border-white/5">
                                                                                        <span className="text-xs font-bold text-slate-300 w-16 truncate">{student.name}</span>
                                                                                        <div className="flex items-center gap-2">
                                                                                            <input type="text" value={ts.score} onChange={e => updateStudentForm(student.id, prev => {
                                                                                                const newScores = [...prev.test_scores];
                                                                                                newScores[idx] = { ...newScores[idx], score: e.target.value };
                                                                                                return { ...prev, test_scores: newScores };
                                                                                            })} placeholder="점수" className={`w-16 bg-black border rounded px-2 py-1 text-sm font-bold focus:outline-none text-center ${isFail ? 'border-rose-500/50 text-rose-400' : 'border-white/10 text-emerald-400'} focus:border-rose-500`} />

                                                                                            <select value={ts.score} onChange={e => updateStudentForm(student.id, prev => {
                                                                                                const newScores = [...prev.test_scores];
                                                                                                newScores[idx] = { ...newScores[idx], score: e.target.value };
                                                                                                return { ...prev, test_scores: newScores };
                                                                                            })} className="bg-black border border-white/10 rounded px-2 py-1.5 text-[10px] text-slate-400 focus:outline-none">
                                                                                                <option value="">(직접입력)</option>
                                                                                                <option value="해당없음">해당없음</option>
                                                                                                <option value="미응시(결석)">미응시(결석)</option>
                                                                                                <option value="연기">연기</option>
                                                                                            </select>
                                                                                        </div>

                                                                                        <div className="flex items-center gap-2 ml-auto">
                                                                                            {isFail && <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-bold">FAIL</span>}
                                                                                            {test.isWordTest && ts.score !== '' && !isFail && !isNaN(scoreNum) && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">PASS</span>}
                                                                                            {/* Fail actions for word test */}
                                                                                            {isFail && (
                                                                                                <div className="flex items-center gap-1">
                                                                                                    {(['재시험 완료', '추후 재시'] as const).map(action => (
                                                                                                        <button key={action} onClick={() => updateStudentForm(student.id, prev => {
                                                                                                            const newScores = [...prev.test_scores];
                                                                                                            newScores[idx] = { ...newScores[idx], failAction: action };
                                                                                                            return { ...prev, test_scores: newScores };
                                                                                                        })} className={`px-2 py-1 rounded text-[10px] font-medium border transition-colors ${ts.failAction === action ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-black border-white/10 text-slate-500 hover:bg-white/5'}`}>
                                                                                                            {action}
                                                                                                        </button>
                                                                                                    ))}
                                                                                                    {ts.failAction === '추후 재시' && (
                                                                                                        <input type="date" value={ts.retestDate || ''} onChange={e => updateStudentForm(student.id, prev => {
                                                                                                            const newScores = [...prev.test_scores];
                                                                                                            newScores[idx] = { ...newScores[idx], retestDate: e.target.value };
                                                                                                            return { ...prev, test_scores: newScores };
                                                                                                        })} className="w-28 bg-black border border-white/10 rounded px-2 py-1 text-[10px] focus:outline-none focus:border-amber-500 text-amber-200" />
                                                                                                    )}
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
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
                                                <label className="block text-xs text-slate-400 mb-1">다음 숙제/내용 (자동 생성됨)</label>
                                                <textarea value={sharedForm.next_content} onChange={e => handleSharedChange('next_content', e.target.value)} rows={2} placeholder="아래 과제 할당시 자동입력" className="input-field resize-none text-[10px]" />
                                            </div>
                                        </div>

                                        {/* New Assignments (Next Homework) */}
                                        <div className="bg-slate-900/30 border border-white/5 rounded-xl p-4 mt-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <label className="text-xs text-indigo-300 font-bold flex items-center gap-1"><Users size={14} /> 다음 수업 과제 할당</label>
                                                <button onClick={addNewAssignment} className="text-xs bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 px-3 py-1 rounded-md transition-colors flex items-center gap-1"><Plus size={12} /> 새 과제 추가</button>
                                            </div>
                                            <div className="space-y-3">
                                                {sharedForm.newAssignments.map((hw, idx) => (
                                                    <div key={idx} className="flex gap-2 items-center">
                                                        <input value={hw.name} onChange={e => handleNewAssignChange(idx, 'name', e.target.value)} placeholder={`다음 과제 ${idx + 1}`}
                                                            className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-indigo-100" />
                                                        {hw.name && (
                                                            <div className="flex items-center gap-1">
                                                                <button onClick={() => setHwAssignIdx(idx)}
                                                                    className="flex items-center gap-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 px-3 py-2 rounded-lg text-xs font-bold border border-indigo-500/20 transition-colors whitespace-nowrap">
                                                                    <Users size={14} /> 개별/전체 할당
                                                                </button>
                                                            </div>
                                                        )}
                                                        {sharedForm.newAssignments.length > 1 && (
                                                            <button onClick={() => removeNewAssignment(idx)} className="text-slate-600 hover:text-rose-400 p-1"><X size={16} /></button>
                                                        )}
                                                    </div>
                                                ))}
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
                                {activeClass.students.filter(s => sharedForm.homeworks[hwModalIdx!].assignees.includes(s.id) || sharedForm.homeworks[hwModalIdx!].assignees.length === 0).map(student => {
                                    const sf = studentForms[student.id];
                                    const hs = sf?.hw_statuses[hwModalIdx!] || { status: '확인완료' as HwStatus, plan: '' };
                                    const needsPlan = hs.status === '교재미지참' || hs.status === '전체미완' || hs.status === '일부미완' || hs.status === '결석';
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
                                                <div className="space-y-1">
                                                    <input value={hs.plan} onChange={e => updateStudentForm(student.id, prev => {
                                                        const newHw = [...prev.hw_statuses];
                                                        newHw[hwModalIdx!] = { ...newHw[hwModalIdx!], plan: e.target.value };
                                                        return { ...prev, hw_statuses: newHw };
                                                    })} placeholder="보완계획 입력" className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-rose-500 text-white" />
                                                    <div className="flex gap-1 items-center">
                                                        <input type="date" value={hs.recheckDate || ''} title="재검사일" onChange={e => updateStudentForm(student.id, prev => {
                                                            const newHw = [...prev.hw_statuses];
                                                            newHw[hwModalIdx!] = { ...newHw[hwModalIdx!], recheckDate: e.target.value };
                                                            return { ...prev, hw_statuses: newHw };
                                                        })} className="flex-1 bg-slate-900 border border-white/5 rounded-lg px-3 py-1.5 text-[10px] focus:outline-none focus:border-amber-500 text-amber-200" />
                                                        <button onClick={() => {
                                                            const currentStr = hs.recheckDate || sharedForm.published_date || new Date().toISOString().split('T')[0];
                                                            const d = new Date(currentStr);
                                                            d.setDate(d.getDate() + 1);
                                                            updateStudentForm(student.id, prev => {
                                                                const newHw = [...prev.hw_statuses];
                                                                newHw[hwModalIdx!] = { ...newHw[hwModalIdx!], recheckDate: d.toISOString().split('T')[0] };
                                                                return { ...prev, hw_statuses: newHw };
                                                            });
                                                        }} className="px-2 py-1.5 bg-slate-800 text-slate-400 rounded-lg hover:bg-slate-700 text-[10px]">&gt;</button>
                                                    </div>
                                                </div>
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

            {/* Homework Assignment Modal */}
            <AnimatePresence>
                {hwAssignIdx !== null && activeClass && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setHwAssignIdx(null)}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}
                            className="bg-slate-900 rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-white text-sm">과제 할당 및 설정</h3>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{sharedForm.newAssignments[hwAssignIdx]?.name}</p>
                                </div>
                                <button onClick={() => setHwAssignIdx(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
                            </div>

                            <div className="p-4 border-b border-white/5 space-y-4">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">과제 점검일 (기본: 다음 수업 날짜)</label>
                                    <input type="date" value={sharedForm.newAssignments[hwAssignIdx].checkDate} onChange={e => handleNewAssignChange(hwAssignIdx, 'checkDate', e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                                        <input type="checkbox" checked={sharedForm.newAssignments[hwAssignIdx].isWordOrTest} onChange={e => handleNewAssignChange(hwAssignIdx, 'isWordOrTest', e.target.checked)} className="rounded bg-black border-white/20" />
                                        단어 암기 또는 테스트 여부
                                    </label>
                                    <span className="text-[10px] text-slate-500">(체크 시 다음 수업의 '지난 과제 불러오기' 목록에는 뜨지 않습니다. 하지만 리포트의 '다음 숙제'란에는 정상 출력됩니다.)</span>
                                </div>
                            </div>

                            <div className="p-4 border-b border-white/5 bg-slate-950 flex justify-between items-center">
                                <h4 className="text-xs font-bold text-slate-300">학생 할당</h4>
                                <button onClick={() => {
                                    const allIds = activeClass!.students.map(s => s.id);
                                    const isAllAssigned = sharedForm.newAssignments[hwAssignIdx].assignees.length === allIds.length;
                                    handleNewAssignChange(hwAssignIdx, 'assignees', isAllAssigned ? [] : allIds);
                                }} className="text-[10px] font-bold bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded transition-colors">
                                    {sharedForm.newAssignments[hwAssignIdx].assignees.length === activeClass.students.length ? '전체 해제' : '전체 선택'}
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-2">
                                {activeClass.students.map(student => {
                                    const isAssigned = sharedForm.newAssignments[hwAssignIdx].assignees.includes(student.id);
                                    return (
                                        <button key={student.id} onClick={() => {
                                            const newAssignees = isAssigned
                                                ? sharedForm.newAssignments[hwAssignIdx].assignees.filter(id => id !== student.id)
                                                : [...sharedForm.newAssignments[hwAssignIdx].assignees, student.id];
                                            handleNewAssignChange(hwAssignIdx, 'assignees', newAssignees);
                                        }} className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-colors ${isAssigned ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-100' : 'bg-black/40 border-white/5 text-slate-500 hover:border-white/10'}`}>
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isAssigned ? 'border-indigo-400 bg-indigo-500' : 'border-slate-600'}`}>
                                                {isAssigned && <CheckCircle2 size={10} className="text-white" />}
                                            </div>
                                            <span className="text-sm font-medium">{student.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="p-3 border-t border-white/10">
                                <button onClick={() => setHwAssignIdx(null)} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold transition-colors">저장 후 닫기</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Test Assignment Modal */}
            <AnimatePresence>
                {testAssignIdx !== null && activeClass && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setTestAssignIdx(null)}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}
                            className="bg-slate-900 rounded-2xl border border-white/10 w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-white text-sm">테스트 응시자 할당</h3>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{sharedForm.tests[testAssignIdx]?.name}</p>
                                </div>
                                <button onClick={() => setTestAssignIdx(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
                            </div>

                            <div className="p-4 border-b border-white/5 bg-slate-950 flex justify-between items-center">
                                <h4 className="text-xs font-bold text-slate-300">학생 할당</h4>
                                <button onClick={() => {
                                    const allIds = activeClass!.students.map(s => s.id);
                                    const isAllAssigned = sharedForm.tests[testAssignIdx].assignees.length === allIds.length;
                                    handleTestSharedChange(testAssignIdx, 'assignees', isAllAssigned ? [] : allIds);
                                }} className="text-[10px] font-bold bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded transition-colors">
                                    {sharedForm.tests[testAssignIdx].assignees.length === activeClass.students.length ? '전체 해제' : '전체 선택'}
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-2">
                                {activeClass.students.map(student => {
                                    const isAssigned = sharedForm.tests[testAssignIdx].assignees.includes(student.id);
                                    return (
                                        <button key={student.id} onClick={() => {
                                            const newAssignees = isAssigned
                                                ? sharedForm.tests[testAssignIdx].assignees.filter(id => id !== student.id)
                                                : [...sharedForm.tests[testAssignIdx].assignees, student.id];
                                            handleTestSharedChange(testAssignIdx, 'assignees', newAssignees);
                                        }} className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-colors ${isAssigned ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-100' : 'bg-black/40 border-white/5 text-slate-500 hover:border-white/10'}`}>
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isAssigned ? 'border-emerald-400 bg-emerald-500' : 'border-slate-600'}`}>
                                                {isAssigned && <CheckCircle2 size={10} className="text-white" />}
                                            </div>
                                            <span className="text-sm font-medium">{student.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="p-3 border-t border-white/10">
                                <button onClick={() => setTestAssignIdx(null)} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-bold transition-colors">저장 후 닫기</button>
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
            {/* Missing Assignment Tracker Modal */}
            <AnimatePresence>
                {showTrackerModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-slate-900 rounded-2xl border border-white/10 w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
                            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-950 shrink-0">
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <FileText className="text-rose-400" size={20} />
                                        미완과제 & 재시험 추적기
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-1">해결되지 않은 과제와 재시험 예정인 항목들을 관리합니다.</p>
                                </div>
                                <button onClick={() => setShowTrackerModal(false)} className="p-2 bg-white/5 rounded-lg text-slate-300 hover:bg-white/10 transition-colors"><X size={20} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 bg-slate-900/50">
                                {isTrackerLoading ? (
                                    <div className="flex flex-col flex-1 items-center justify-center text-slate-400 py-20">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mb-4"></div>
                                        데이터를 불러오는 중입니다...
                                    </div>
                                ) : trackerData.length === 0 ? (
                                    <div className="flex flex-col flex-1 items-center justify-center text-slate-500 py-20">
                                        <CheckCircle2 size={48} className="text-emerald-500/40 mb-4" />
                                        <p>모든 학생이 과제와 시험을 완료했습니다!</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {trackerData.map((item) => (
                                            <div key={item.id} className="bg-black/50 border border-white/10 rounded-xl p-4 flex flex-col space-y-3 relative group">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-white">{item.studentName}</span>
                                                        <span className="text-[10px] text-slate-400">{item.className}</span>
                                                        {item.postponeCount > 0 && <span className="text-[10px] font-bold text-rose-400 bg-rose-500/20 px-1.5 py-0.5 rounded">[{item.postponeCount + 1}차 연기]</span>}
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded ml-auto flex flex-col mb-1 border border-slate-700">발행: {item.date}</span>
                                                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-1.5 py-0.5 rounded ml-auto flex flex-col border border-indigo-500/30">목표: {item.targetDate}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-2">
                                                    <div className={`mt-0.5 w-1.5 h-1.5 rounded-full ${item.type === 'homework' ? 'bg-amber-400' : 'bg-rose-400'}`}></div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-200 line-clamp-2">{item.name}</p>
                                                        {item.type === 'test' && <p className="text-xs text-rose-400 font-bold mt-0.5">SCORE: {item.score}</p>}
                                                    </div>
                                                </div>

                                                <div className="bg-slate-900 rounded-lg p-2 text-[10px] text-slate-400">
                                                    <span className={`font-bold ${item.type === 'homework' ? 'text-amber-400' : 'text-rose-400'}`}>상태: </span>
                                                    {item.status}
                                                    {item.plan && <p className="mt-1 text-slate-300">계획: {item.plan}</p>}
                                                </div>

                                                <div className="mt-auto pt-2 grid grid-cols-2 gap-2 border-t border-white/5">
                                                    <button onClick={() => {
                                                        if (window.confirm('완료된 항목을 목록에서 삭제하시겠습니까?')) {
                                                            handleTrackerUpdate(item, 'COMPLETE', '');
                                                        }
                                                    }} className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs py-1.5 rounded-md font-bold transition-colors">
                                                        {item.type === 'homework' ? '검사완료' : item.type === 'test' ? '통과' : '보강완료'}
                                                    </button>

                                                    {postponeStateId === item.id ? (
                                                        <div className="flex gap-1 items-center bg-black rounded p-1 border border-amber-500/30">
                                                            <input type="date" value={postponeDate} onChange={e => setPostponeDate(e.target.value)} className="flex-1 bg-transparent border-none text-[10px] text-amber-200 outline-none w-full" />
                                                            <button onClick={() => {
                                                                if (postponeDate) handleTrackerUpdate(item, 'POSTPONE', postponeDate);
                                                            }} className="bg-amber-500 text-black px-2 py-0.5 rounded font-bold text-[10px] shrink-0 hover:bg-amber-400">확인</button>
                                                            <button onClick={() => setPostponeStateId(null)} className="text-slate-500 hover:text-white px-1 shrink-0"><X size={12} /></button>
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => {
                                                            if (window.confirm('해당 미완과제를 재연기하시겠습니까?')) {
                                                                setPostponeStateId(item.id);

                                                                // Calculate tomorrow
                                                                const d = new Date(item.targetDate || new Date().toISOString());
                                                                d.setDate(d.getDate() + 1);
                                                                setPostponeDate(d.toISOString().split('T')[0]);
                                                            }
                                                        }} className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs py-1.5 rounded-md font-bold transition-colors">
                                                            추가연기
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </motion.div>
    );
}
