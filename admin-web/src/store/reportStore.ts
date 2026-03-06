import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { sampleDailyReportHtml } from './sampleReport';

export interface ReportTemplate {
    id: string;
    classId: string;
    reportType: 'daily' | 'weekly' | 'monthly';
    templateHtml: string;
}

export interface StudentReport {
    id: string;
    studentId: string;
    reportType: 'daily' | 'weekly' | 'monthly';
    publishedDate: string; // YYYY-MM-DD
    finalHtml: string;
    rawDataJson: any;
    createdAt: string;
}

export interface Student {
    id: string;
    classId: string;
    name: string;
    password?: string | null;
    reports?: StudentReport[]; // Loaded on demand
}

export interface ClassData {
    id: string;
    name: string;
    students: Student[];
    templates: ReportTemplate[];
}

interface ReportStore {
    classes: ClassData[];
    isLoading: boolean;
    fetchData: () => Promise<void>;
    addClass: (name: string) => Promise<void>;
    deleteClass: (classId: string) => Promise<void>;
    addStudent: (classId: string, studentName: string) => Promise<void>;
    deleteStudent: (classId: string, studentId: string) => Promise<void>;
    saveReportTemplate: (classId: string, reportType: 'daily' | 'weekly' | 'monthly', templateHtml: string) => Promise<void>;
    fetchStudentReports: (studentId: string) => Promise<StudentReport[]>;
    saveStudentReport: (studentId: string, reportType: 'daily' | 'weekly' | 'monthly', publishedDate: string, finalHtml: string, rawDataJson: any) => Promise<boolean>;
    deleteStudentReport: (reportId: string) => Promise<void>;
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

            // Fetch templates
            const { data: templatesData, error: templatesError } = await supabase
                .from('report_templates')
                .select('*');

            if (templatesError) throw templatesError;

            // Fetch students
            const { data: studentsData, error: studentsError } = await supabase
                .from('students_list')
                .select('*')
                .order('created_at', { ascending: true });

            if (studentsError) throw studentsError;

            // Map data
            const formattedClasses: ClassData[] = (classesData || []).map((cls: any) => ({
                id: cls.id,
                name: cls.name,
                templates: (templatesData || [])
                    .filter((t: any) => t.class_id === cls.id)
                    .map((t: any) => ({
                        id: t.id,
                        classId: t.class_id,
                        reportType: t.report_type,
                        templateHtml: t.template_html
                    })),
                students: (studentsData || [])
                    .filter((stu: any) => stu.class_id === cls.id)
                    .map((stu: any) => ({
                        id: stu.id,
                        classId: stu.class_id,
                        name: stu.name,
                        password: stu.password,
                        reports: []
                    }))
            }));

            // Add sample data to the front
            const sampleClass = {
                id: 'c-sample',
                name: '[공개용] 리포트 샘플',
                templates: [],
                students: [{
                    id: 's-sample',
                    name: '샘플학생',
                    classId: 'c-sample',
                    password: '1234',
                    reports: [{
                        id: 'r-sample-1',
                        studentId: 's-sample',
                        reportType: 'daily' as const,
                        publishedDate: '2026-03-05',
                        finalHtml: sampleDailyReportHtml,
                        rawDataJson: null,
                        createdAt: new Date().toISOString()
                    }]
                }]
            };

            set({ classes: [sampleClass, ...formattedClasses], isLoading: false });

        } catch (error) {
            console.error('Error fetching data from Supabase:', error);
            // Even on error, show the sample class so the UI isn't broken
            const sampleClass = {
                id: 'c-sample',
                name: '[공개용] 리포트 샘플',
                templates: [],
                students: [{
                    id: 's-sample',
                    name: '샘플학생',
                    classId: 'c-sample',
                    password: '1234',
                    reports: []
                }]
            };
            set({ classes: [sampleClass], isLoading: false });
        }
    },

    addClass: async (name) => {
        try {
            const { error } = await supabase
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
        try {
            const { error } = await supabase
                .from('students_list')
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
        try {
            const { error } = await supabase
                .from('students_list')
                .delete()
                .eq('id', studentId);

            if (error) throw error;
            await get().fetchData();
        } catch (error) {
            console.error('Error deleting student:', error);
        }
    },

    saveReportTemplate: async (classId, reportType, templateHtml) => {
        try {
            // Upsert template (requires unique constraint on class_id, report_type)
            const { error } = await supabase
                .from('report_templates')
                .upsert(
                    { class_id: classId, report_type: reportType, template_html: templateHtml },
                    { onConflict: 'class_id,report_type' }
                );
            if (error) throw error;
            await get().fetchData();
        } catch (error) {
            console.error('Error saving template:', error);
        }
    },

    fetchStudentReports: async (studentId) => {
        try {
            const { data, error } = await supabase
                .from('student_reports')
                .select('*')
                .eq('student_id', studentId)
                .order('published_date', { ascending: false });

            if (error) throw error;

            return (data || []).map((r: any) => ({
                id: r.id,
                studentId: r.student_id,
                reportType: r.report_type,
                publishedDate: r.published_date,
                finalHtml: r.final_html,
                rawDataJson: r.raw_data_json,
                createdAt: r.created_at
            }));

        } catch (error) {
            console.error('Error fetching student reports:', error);
            return [];
        }
    },

    saveStudentReport: async (studentId, reportType, publishedDate, finalHtml, rawDataJson) => {
        try {
            const { data: existing } = await supabase
                .from('student_reports')
                .select('id')
                .eq('student_id', studentId)
                .eq('report_type', reportType)
                .eq('published_date', publishedDate)
                .maybeSingle();

            if (existing) {
                const { error } = await supabase
                    .from('student_reports')
                    .update({ final_html: finalHtml, raw_data_json: rawDataJson })
                    .eq('id', existing.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('student_reports')
                    .insert([{
                        student_id: studentId,
                        report_type: reportType,
                        published_date: publishedDate,
                        final_html: finalHtml,
                        raw_data_json: rawDataJson
                    }]);
                if (error) throw error;
            }
            return true;
        } catch (error) {
            console.error('Error saving student report:', error);
            return false;
        }
    },

    deleteStudentReport: async (reportId) => {
        try {
            const { error } = await supabase
                .from('student_reports')
                .delete()
                .eq('id', reportId);
            if (error) throw error;
        } catch (error) {
            console.error('Error deleting student report:', error);
        }
    }
}));
