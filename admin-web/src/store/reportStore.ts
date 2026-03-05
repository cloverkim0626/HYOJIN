import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface StudentReport {
    dailyLink?: string | null;
    dailyHtml?: string | null;
    weeklyLink?: string | null;
    weeklyHtml?: string | null;
    monthlyLink?: string | null;
    monthlyHtml?: string | null;
}

export interface Student {
    id: string;
    name: string;
    password?: string | null;
    report: StudentReport;
}

export interface ClassData {
    id: string;
    name: string;
    students: Student[];
}

interface ReportStore {
    classes: ClassData[];
    isLoading: boolean;
    fetchData: () => Promise<void>;
    addClass: (name: string) => Promise<void>;
    deleteClass: (classId: string) => Promise<void>;
    addStudent: (classId: string, studentName: string) => Promise<void>;
    deleteStudent: (classId: string, studentId: string) => Promise<void>;
    updateStudentReport: (classId: string, studentId: string, report: Partial<StudentReport>) => Promise<void>;
    seedSampleData: () => void;
}

export const useReportStore = create<ReportStore>((set, get) => ({
    classes: [],
    isLoading: false,

    fetchData: async () => {
        set({ isLoading: true });

        try {
            // Fetch classes
            const { data: classesData, error: classesError } = await supabase
                .from('report_classes')
                .select('*')
                .order('created_at', { ascending: true });

            if (classesError) throw classesError;

            // Fetch students
            const { data: studentsData, error: studentsError } = await supabase
                .from('report_students')
                .select('*')
                .order('created_at', { ascending: true });

            if (studentsError) throw studentsError;

            // Map data
            const formattedClasses: ClassData[] = (classesData || []).map((cls: any) => ({
                id: cls.id,
                name: cls.name,
                students: (studentsData || [])
                    .filter((stu: any) => stu.class_id === cls.id)
                    .map((stu: any) => ({
                        id: stu.id,
                        name: stu.name,
                        password: stu.password,
                        report: {
                            dailyHtml: stu.daily_html,
                            dailyLink: stu.daily_link,
                            weeklyHtml: stu.weekly_html,
                            weeklyLink: stu.weekly_link,
                            monthlyHtml: stu.monthly_html,
                            monthlyLink: stu.monthly_link
                        }
                    }))
            }));

            // Add sample data to the front
            const sampleClass = {
                id: 'c-sample',
                name: '[공개용] 리포트 샘플',
                students: [{ id: 's-sample', name: '샘플학생', report: { dailyHtml: '<div style="text-align: center; padding: 40px 20px; color: #64748b;"><h2>샘플학생 일간 리포트 (예시)</h2><p style="margin-top: 10px;">관리자 페이지에서 내용을 자유롭게 수정하여 학부모님들께 보여줄 수 있습니다.</p></div>' }, password: '1234' }]
            };

            set({ classes: [sampleClass, ...formattedClasses], isLoading: false });

        } catch (error) {
            console.error('Error fetching data from Supabase:', error);
            set({ isLoading: false });
        }
    },

    addClass: async (name) => {
        try {
            const { data, error } = await supabase
                .from('report_classes')
                .insert([{ name }])
                .select()
                .single();

            if (error) throw error;
            await get().fetchData();
        } catch (error) {
            console.error('Error adding class:', error);
        }
    },

    deleteClass: async (classId) => {
        if (classId === 'c-sample') return;
        try {
            const { error } = await supabase
                .from('report_classes')
                .delete()
                .eq('id', classId);

            if (error) throw error;
            await get().fetchData();
        } catch (error) {
            console.error('Error deleting class:', error);
        }
    },

    addStudent: async (classId, studentName) => {
        if (classId === 'c-sample') return;
        try {
            const { data, error } = await supabase
                .from('report_students')
                .insert([{ class_id: classId, name: studentName }])
                .select()
                .single();

            if (error) throw error;
            await get().fetchData();
        } catch (error) {
            console.error('Error adding student:', error);
        }
    },

    deleteStudent: async (classId, studentId) => {
        if (classId === 'c-sample') return;
        try {
            const { error } = await supabase
                .from('report_students')
                .delete()
                .eq('id', studentId);

            if (error) throw error;
            await get().fetchData();
        } catch (error) {
            console.error('Error deleting student:', error);
        }
    },

    updateStudentReport: async (classId, studentId, reportContent) => {
        if (classId === 'c-sample') {
            set((state) => ({
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
            }));
            return;
        }

        try {
            const updatePayload: any = {};
            if (reportContent.dailyHtml !== undefined) updatePayload.daily_html = reportContent.dailyHtml;
            if (reportContent.dailyLink !== undefined) updatePayload.daily_link = reportContent.dailyLink;
            if (reportContent.weeklyHtml !== undefined) updatePayload.weekly_html = reportContent.weeklyHtml;
            if (reportContent.weeklyLink !== undefined) updatePayload.weekly_link = reportContent.weeklyLink;
            if (reportContent.monthlyHtml !== undefined) updatePayload.monthly_html = reportContent.monthlyHtml;
            if (reportContent.monthlyLink !== undefined) updatePayload.monthly_link = reportContent.monthlyLink;

            const { error } = await supabase
                .from('report_students')
                .update(updatePayload)
                .eq('id', studentId);

            if (error) throw error;

            // update local state optimistically
            set((state) => ({
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
            }));
        } catch (error) {
            console.error('Error updating student report:', error);
        }
    },

    seedSampleData: () => {
        // Now handled by fetchData inserting the sample class at the beginning
    }
}));
