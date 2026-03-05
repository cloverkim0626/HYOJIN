import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface StudentReport {
    dailyLink?: string;
    dailyHtml?: string;
    weeklyLink?: string;
    weeklyHtml?: string;
    monthlyLink?: string;
    monthlyHtml?: string;
}

export interface Student {
    id: string;
    name: string;
    report: StudentReport;
    password?: string;
}

export interface ClassData {
    id: string;
    name: string;
    students: Student[];
}

interface ReportStore {
    classes: ClassData[];
    addClass: (name: string) => void;
    deleteClass: (classId: string) => void;
    addStudent: (classId: string, studentName: string) => void;
    deleteStudent: (classId: string, studentId: string) => void;
    updateStudentReport: (classId: string, studentId: string, report: Partial<StudentReport>) => void;
    seedSampleData: () => void;
}

const initialData: ClassData[] = [
    {
        id: 'c1',
        name: '[WOODOK] 아라고2',
        students: [
            { id: 's1', name: '이동기', password: '2921', report: { dailyHtml: '<h2>이동기 일간 리포트 (임시)</h2><p>오늘 단어 테스트 만점입니다.</p>' } },
            { id: 's2', name: '민채이', password: '9102', report: { dailyHtml: '<h2>민채이 일간 리포트 (임시)</h2><p>과제 제출 완료.</p>' } },
            { id: 's3', name: '임다은', password: '6894', report: { dailyHtml: '<h2>임다은 일간 리포트 (임시)</h2><p>수업 참여도 우수.</p>' } },
        ]
    },
    {
        id: 'c2',
        name: '[WOODOK] 고3 내신&수능 도약반',
        students: [
            { id: 's4', name: '이은서', report: {} },
            { id: 's5', name: '박시연', report: {} },
            { id: 's6', name: '이예윤', report: {} },
            { id: 's7', name: '김가빈', report: {} },
            { id: 's8', name: '장서현', report: {} },
            { id: 's9', name: '김가연', report: {} },
        ]
    },
    {
        id: 'c3',
        name: '[WOODOK] 아라고1',
        students: [
            { id: 's10', name: '한상혁', report: {} },
            { id: 's11', name: '정준', report: {} },
        ]
    },
    {
        id: 'c4',
        name: '[WOODOK] 원당고1',
        students: [
            { id: 's12', name: '송시후', report: {} },
        ]
    }
];

export const useReportStore = create<ReportStore>()(
    persist(
        (set) => ({
            classes: initialData,
            addClass: (name) => set((state) => ({
                classes: [...state.classes, { id: Date.now().toString(), name, students: [] }]
            })),
            deleteClass: (classId) => set((state) => ({
                classes: state.classes.filter(c => c.id !== classId)
            })),
            addStudent: (classId, studentName) => set((state) => ({
                classes: state.classes.map(c =>
                    c.id === classId
                        ? { ...c, students: [...c.students, { id: Date.now().toString(), name: studentName, report: {} }] }
                        : c
                )
            })),
            deleteStudent: (classId, studentId) => set((state) => ({
                classes: state.classes.map(c =>
                    c.id === classId
                        ? { ...c, students: c.students.filter(s => s.id !== studentId) }
                        : c
                )
            })),
            updateStudentReport: (classId, studentId, reportContent) => set((state) => ({
                classes: state.classes.map(c =>
                    c.id === classId
                        ? {
                            ...c,
                            students: c.students.map(s =>
                                s.id === studentId
                                    ? { ...s, report: { ...s.report, ...reportContent } }
                                    : s
                            )
                        }
                        : c
                )
            })),
            seedSampleData: () => set((state) => {
                const sampleClass = {
                    id: 'c-sample',
                    name: '[공개용] 리포트 샘플',
                    students: [{ id: 's-sample', name: '샘플학생', report: { dailyHtml: '<div style="text-align: center; padding: 40px 20px; color: #64748b;"><h2>샘플학생 일간 리포트 (예시)</h2><p style="margin-top: 10px;">관리자 페이지에서 내용을 자유롭게 수정하여 학부모님들께 보여줄 수 있습니다.</p></div>' } }]
                };

                const sampleExists = state.classes.some(c => c.id === 'c-sample');

                if (sampleExists) {
                    return {
                        classes: state.classes.map(c => c.id === 'c-sample' ? sampleClass : c)
                    };
                }

                return {
                    classes: [sampleClass, ...state.classes]
                };
            })
        }),
        {
            name: 'khj-english-report-storage', // unique name
        }
    )
);
