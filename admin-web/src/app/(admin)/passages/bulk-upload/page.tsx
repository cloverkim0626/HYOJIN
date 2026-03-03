'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import * as xlsx from 'xlsx';

export default function BulkUploadPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [status, setStatus] = useState<'idle' | 'parsing' | 'ready' | 'uploading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setStatus('parsing');
        setErrorMessage('');

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = xlsx.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];

                // 엑셀 데이터를 JSON 배열로 변환 (첫 줄 헤더)
                const data = xlsx.utils.sheet_to_json(ws);

                // 데이터 매핑: 엑셀 컬럼명(한글) -> DB 컬럼명(영어)
                const mappedData = data.map((row: any) => {
                    // '구분' 처리: 모의고사, 교과서, ebs -> DB Enum
                    let dbCategory = 'private'; // default
                    const rawCat = row['구분'] || '';
                    if (rawCat.includes('모의고사')) dbCategory = 'mock_exam';
                    else if (rawCat.includes('교과서')) dbCategory = 'textbook';
                    else if (rawCat.includes('ebs') || rawCat.includes('EBS')) dbCategory = 'ebs';

                    return {
                        category: dbCategory,
                        grade: parseInt(row['학년']) || null,
                        exam_year: parseInt(row['년도']) || null,
                        exam_month: row['월']?.toString() || null,
                        question_number: parseInt(row['번호']) || null,
                        passage_type: row['유형'] || null,
                        revised_year: parseInt(row['개정년도']) || parseInt(row['발행년도']) || null,
                        publisher: row['출판사'] || null,
                        subject_name: row['교과명'] || null,
                        unit: row['단원'] || null,
                        book_name: row['교재명'] || null,
                        chapter: row['챕터'] || row['챕터/강'] || row['강'] || null,
                        page: parseInt(row['페이지']) || row['페이지'] || row['번호/페이지'] || null,
                        vendor: row['출판사/학원명'] || row['학원명'] || null,
                        part: row['회차/단원'] || row['회차'] || null,
                        title_ko: row['제목'] || '제목 없음',
                        content: row['지문'] || '',
                        korean_translation: row['한글 해석'] || null,
                        korean_summary: row['한글 요약'] || null,
                        english_summary: row['영어 요약'] || null,
                        structure_analysis: row['구조 분석'] || null,
                        error_rate: row['오답률']?.toString() || null,
                        author: row['저자'] || null,
                        keywords: row['키워드'] || null,
                        word_count: parseInt(row['단어 수']) || null,
                        sentence_count: parseInt(row['문장 수']) || null
                    };
                }).filter(item => item.content.trim() !== ''); // 지문이 비어있으면 무시

                setParsedData(mappedData);
                setStatus('ready');
            } catch (err: any) {
                console.error(err);
                setStatus('error');
                setErrorMessage('엑셀 파일을 읽는 중 오류가 발생했습니다. 양식을 다시 확인해주세요.');
            }
        };
        reader.readAsBinaryString(selectedFile);
    };

    const handleApply = async () => {
        if (parsedData.length === 0) return;
        setLoading(true);
        setStatus('uploading');

        // Supabase bulk insert
        const { error } = await supabase.from('passages').insert(parsedData);

        if (error) {
            setStatus('error');
            setErrorMessage(error.message);
            setLoading(false);
        } else {
            setStatus('success');
            setLoading(false);
            setTimeout(() => {
                router.push('/passages');
                router.refresh();
            }, 1500);
        }
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-black/60 fixed inset-0 z-50 p-6 backdrop-blur-md pt-20">
            <div className="bg-[#13113c] border border-[#2a266b] w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col overflow-hidden text-gray-200 shadow-purple-900/20">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-[#2a266b] bg-[#0a0a2a]">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600/20 p-2 rounded-lg text-blue-400">
                            <FileSpreadsheet size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">엑셀 대량 업로드 (Excel Import)</h2>
                            <p className="text-xs text-gray-400 mt-1">`.xlsx` 파일의 헤더가 반드시 규격(구분, 학년, 지문 등)과 일치해야 합니다.</p>
                        </div>
                    </div>
                    <Link href="/passages" className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-[#2a266b] rounded-lg">
                        <X size={24} />
                    </Link>
                </div>

                {/* Content */}
                <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">

                    {status === 'idle' || status === 'error' ? (
                        <div className="w-full h-64 border-2 border-dashed border-[#2a266b] rounded-2xl bg-[#0a0a2a]/50 flex flex-col items-center justify-center hover:border-blue-500 hover:bg-[#13113c] transition-all relative">
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <Upload size={48} className="text-[#2a266b] mb-4 group-hover:text-blue-500" />
                            <p className="text-lg font-medium text-gray-300">엑셀 파일을 이곳에 드래그하거나 클릭하여 업로드</p>
                            <p className="text-sm text-gray-500 mt-2">최대 1000행 권장 (.xlsx)</p>

                            {status === 'error' && (
                                <div className="mt-4 flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-2 rounded-lg border border-red-400/20">
                                    <AlertCircle size={16} /> {errorMessage}
                                </div>
                            )}
                        </div>
                    ) : status === 'parsing' ? (
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-blue-400 font-medium">데이터 분석 중...</p>
                        </div>
                    ) : status === 'ready' ? (
                        <div className="w-full bg-[#0a0a2a] border border-[#2a266b] rounded-xl p-6 text-center">
                            <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                                <FileSpreadsheet size={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">분석 완료!</h3>
                            <p className="text-gray-400 mb-6">성공적으로 <span className="text-blue-400 font-bold text-lg">{parsedData.length}</span>개의 지문 데이터를 추출했습니다.</p>

                            <div className="text-left bg-[#13113c] p-4 rounded-lg text-sm text-gray-300 mb-6 h-40 overflow-y-auto border border-[#2a266b] custom-scrollbar">
                                <div className="font-bold text-gray-500 mb-2 font-mono">데이터 미리보기 (상위 3개)</div>
                                {parsedData.slice(0, 3).map((d, i) => (
                                    <div key={i} className="mb-2 pb-2 border-b border-[#2a266b]/50 last:border-0 truncate">
                                        <span className="text-blue-400">[{d.category}]</span> {d.title_ko} - <span className="text-gray-500">{d.content.substring(0, 40)}...</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleApply}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-purple-900/30 transition-all font-lg"
                            >
                                DB에 업로드 실행하기
                            </button>
                        </div>
                    ) : status === 'uploading' ? (
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-purple-400 font-medium">데이터베이스에 기록 중... ({parsedData.length}건)</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-4 border border-green-500/30">
                                <CheckCircle2 size={48} />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">업로드 성공!</h3>
                            <p className="text-gray-400">목록 페이지로 이동합니다...</p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
