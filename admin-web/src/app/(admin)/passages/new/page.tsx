'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { X, Save } from 'lucide-react';
import Link from 'next/link';

export default function NewPassageExcelStylePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // 하위 카테고리 (교과서/EBS/사설 등) State
    const [revisedYear, setRevisedYear] = useState('');    // 개정년도
    const [publisher, setPublisher] = useState('');        // 출판사
    const [subjectName, setSubjectName] = useState('');    // 교과명 (영어1, 영어2 등)
    const [unit, setUnit] = useState('');                  // 단원
    const [bookName, setBookName] = useState('');          // 교재명
    const [chapter, setChapter] = useState('');            // 챕터/강
    const [page, setPage] = useState('');                  // 페이지
    const [vendor, setVendor] = useState('');              // 출판사/학원명 (사설)
    const [part, setPart] = useState('');                  // 회차/단원 (사설)

    // 엑셀 컬럼과 1:1 매칭되는 State
    const [category, setCategory] = useState('mock_exam'); // 구분 (모의고사 등)
    const [grade, setGrade] = useState('3');               // 학년
    const [examYear, setExamYear] = useState('2025');      // 년도
    const [examMonth, setExamMonth] = useState('3');       // 월 (숫자 3, 혹은 '대수능')
    const [questionNumber, setQuestionNumber] = useState('38'); // 번호
    const [passageType, setPassageType] = useState('어법');  // 유형
    const [titleKo, setTitleKo] = useState('문학의 이중적 역할: 성찰과 행동 사이'); // 제목
    const [content, setContent] = useState('');            // 지문
    const [koreanTranslation, setKoreanTranslation] = useState(''); // 한글 해석
    const [koreanSummary, setKoreanSummary] = useState(''); // 한글 요약
    const [englishSummary, setEnglishSummary] = useState(''); // 영어 요약
    const [structureAnalysis, setStructureAnalysis] = useState(''); // 구조 분석
    const [errorRate, setErrorRate] = useState('');        // 오답률
    const [author, setAuthor] = useState('');              // 저자 (현재 엑셀엔 없음)
    const [keywords, setKeywords] = useState('Reflection, Detachment, Inaction'); // 키워드
    const [wordCount, setWordCount] = useState('173');     // 단어 수
    const [sentenceCount, setSentenceCount] = useState('7'); // 문장 수

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            category,
            grade: parseInt(grade) || null,
            exam_year: parseInt(examYear) || null,
            exam_month: examMonth,
            question_number: parseInt(questionNumber) || null,
            passage_type: passageType,
            revised_year: parseInt(revisedYear) || null,
            publisher,
            subject_name: subjectName,
            unit,
            book_name: bookName,
            chapter,
            page: parseInt(page) || null,
            vendor,
            part,
            title_ko: titleKo,
            content,
            korean_translation: koreanTranslation,
            korean_summary: koreanSummary,
            english_summary: englishSummary,
            structure_analysis: structureAnalysis,
            error_rate: errorRate,
            author,
            keywords,
            word_count: parseInt(wordCount) || null,
            sentence_count: parseInt(sentenceCount) || null
        };

        const { error } = await supabase.from('passages').insert([payload]);

        if (error) {
            alert('Error saving data: ' + error.message);
            setLoading(false);
        } else {
            router.push('/passages');
            router.refresh();
        }
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-black/50 fixed inset-0 z-50 p-6 backdrop-blur-sm pt-20">
            <div className="bg-[#13113c] border border-[#2a266b] w-full max-w-6xl h-full max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-gray-200">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-[#2a266b] bg-[#0a0a2a]">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-white flex gap-2 items-center">
                            <span className="text-2xl">📝</span> 새 지문 (Excel Data Layout)
                        </h2>
                    </div>
                    <Link href="/passages" className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-[#2a266b] rounded-lg">
                        <X size={24} />
                    </Link>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <form className="space-y-8" onSubmit={handleSubmit}>

                        {/* Row 1: 다이나믹 카테고리 필드 */}
                        <div className="bg-[#0a0a2a] p-5 rounded-xl border border-[#2a266b] space-y-4">
                            <div className="flex gap-4 items-end">
                                <div className="w-1/4">
                                    <label className="block text-xs text-blue-400 font-bold mb-1">구분 (카테고리)</label>
                                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-[#13113c] border border-blue-500 rounded px-2 py-2 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-bold text-white shadow-lg shadow-blue-500/20">
                                        <option value="mock_exam">모의고사</option>
                                        <option value="textbook">교과서</option>
                                        <option value="ebs">EBS</option>
                                        <option value="private">기타(사설)</option>
                                    </select>
                                </div>

                                {/* 모의고사 필드 */}
                                {category === 'mock_exam' && (
                                    <div className="flex-1 grid grid-cols-5 gap-3 bg-[#13113c]/30 p-2 rounded-lg border border-[#2a266b]/50">
                                        <div>
                                            <label className="block text-xs text-blue-300 mb-1">학년</label>
                                            <input type="text" value={grade} onChange={e => setGrade(e.target.value)} placeholder="예: 3" className="w-full bg-[#13113c] border border-[#2a266b] rounded px-2 py-2 focus:border-blue-500 outline-none text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-blue-300 mb-1">년도</label>
                                            <input type="text" value={examYear} onChange={e => setExamYear(e.target.value)} placeholder="예: 2025" className="w-full bg-[#13113c] border border-[#2a266b] rounded px-2 py-2 focus:border-blue-500 outline-none text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-blue-300 mb-1">월</label>
                                            <input type="text" value={examMonth} onChange={e => setExamMonth(e.target.value)} placeholder="예: 대수능 또는 3" className="w-full bg-[#13113c] border border-[#2a266b] rounded px-2 py-2 focus:border-blue-500 outline-none text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-blue-300 mb-1">번호</label>
                                            <input type="text" value={questionNumber} onChange={e => setQuestionNumber(e.target.value)} placeholder="예: 38" className="w-full bg-[#13113c] border border-[#2a266b] rounded px-2 py-2 focus:border-blue-500 outline-none text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-blue-300 mb-1">유형</label>
                                            <input type="text" value={passageType} onChange={e => setPassageType(e.target.value)} placeholder="예: 어법" className="w-full bg-[#13113c] border border-[#2a266b] rounded px-2 py-2 focus:border-blue-500 outline-none text-sm" />
                                        </div>
                                    </div>
                                )}

                                {/* 교과서 필드 */}
                                {category === 'textbook' && (
                                    <div className="flex-1 grid grid-cols-4 gap-3 bg-[#2a0e3a]/30 p-2 rounded-lg border border-purple-500/30">
                                        <div>
                                            <label className="block text-xs text-purple-400 mb-1">개정년도</label>
                                            <input type="text" value={revisedYear} onChange={e => setRevisedYear(e.target.value)} placeholder="예: 2015" className="w-full bg-[#13113c] border border-[#2a266b] rounded px-2 py-2 focus:border-purple-500 outline-none text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-purple-400 mb-1">출판사</label>
                                            <input type="text" value={publisher} onChange={e => setPublisher(e.target.value)} placeholder="예: 천재(이)" className="w-full bg-[#13113c] border border-[#2a266b] rounded px-2 py-2 focus:border-purple-500 outline-none text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-purple-400 mb-1">교과명</label>
                                            <input type="text" value={subjectName} onChange={e => setSubjectName(e.target.value)} placeholder="예: 영어1" className="w-full bg-[#13113c] border border-[#2a266b] rounded px-2 py-2 focus:border-purple-500 outline-none text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-purple-400 mb-1">단원</label>
                                            <input type="text" value={unit} onChange={e => setUnit(e.target.value)} placeholder="예: Lesson 1" className="w-full bg-[#13113c] border border-[#2a266b] rounded px-2 py-2 focus:border-purple-500 outline-none text-sm" />
                                        </div>
                                    </div>
                                )}

                                {/* EBS 필드 */}
                                {category === 'ebs' && (
                                    <div className="flex-1 grid grid-cols-4 gap-3 bg-[#0e3a2e]/30 p-2 rounded-lg border border-teal-500/30">
                                        <div>
                                            <label className="block text-xs text-teal-400 mb-1">발행년도</label>
                                            <input type="text" value={revisedYear} onChange={e => setRevisedYear(e.target.value)} placeholder="예: 2025" className="w-full bg-[#13113c] border border-[#2a266b] rounded px-2 py-2 focus:border-teal-500 outline-none text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-teal-400 mb-1">교재명</label>
                                            <input type="text" value={bookName} onChange={e => setBookName(e.target.value)} placeholder="예: 수능특강 영어" className="w-full bg-[#13113c] border border-[#2a266b] rounded px-2 py-2 focus:border-teal-500 outline-none text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-teal-400 mb-1">챕터/강</label>
                                            <input type="text" value={chapter} onChange={e => setChapter(e.target.value)} placeholder="예: 3강" className="w-full bg-[#13113c] border border-[#2a266b] rounded px-2 py-2 focus:border-teal-500 outline-none text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-teal-400 mb-1">번호/페이지</label>
                                            <input type="text" value={page} onChange={e => setPage(e.target.value)} placeholder="예: 1번" className="w-full bg-[#13113c] border border-[#2a266b] rounded px-2 py-2 focus:border-teal-500 outline-none text-sm" />
                                        </div>
                                    </div>
                                )}

                                {/* 사설/기타 필드 */}
                                {category === 'private' && (
                                    <div className="flex-1 grid grid-cols-4 gap-3 bg-[#3a2e0e]/30 p-2 rounded-lg border border-yellow-500/30">
                                        <div>
                                            <label className="block text-xs text-yellow-500 mb-1">출판사/학원명</label>
                                            <input type="text" value={vendor} onChange={e => setVendor(e.target.value)} placeholder="예: 대성, 이투스" className="w-full bg-[#13113c] border border-[#2a266b] rounded px-2 py-2 focus:border-yellow-500 outline-none text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-yellow-500 mb-1">교재명</label>
                                            <input type="text" value={bookName} onChange={e => setBookName(e.target.value)} placeholder="예: 더프리미엄 모의고사" className="w-full bg-[#13113c] border border-[#2a266b] rounded px-2 py-2 focus:border-yellow-500 outline-none text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-yellow-500 mb-1">회차/단원</label>
                                            <input type="text" value={part} onChange={e => setPart(e.target.value)} placeholder="예: 1회차" className="w-full bg-[#13113c] border border-[#2a266b] rounded px-2 py-2 focus:border-yellow-500 outline-none text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-yellow-500 mb-1">번호</label>
                                            <input type="text" value={questionNumber} onChange={e => setQuestionNumber(e.target.value)} placeholder="예: 31" className="w-full bg-[#13113c] border border-[#2a266b] rounded px-2 py-2 focus:border-yellow-500 outline-none text-sm" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Row 2: 제목 및 키워드/카운트 */}
                        <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-2">
                                <label className="block text-xs text-blue-400 font-bold mb-1">제목</label>
                                <input type="text" value={titleKo} onChange={e => setTitleKo(e.target.value)} className="w-full bg-[#0a0a2a] border border-[#2a266b] rounded px-3 py-2 focus:border-blue-500 outline-none font-bold" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">키워드</label>
                                <input type="text" value={keywords} onChange={e => setKeywords(e.target.value)} className="w-full bg-[#0a0a2a] border border-[#2a266b] rounded px-3 py-2 focus:border-blue-500 outline-none text-sm" />
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-400 mb-1">단어 수</label>
                                    <input type="text" value={wordCount} onChange={e => setWordCount(e.target.value)} className="w-full bg-[#0a0a2a] border border-[#2a266b] rounded px-3 py-2 focus:border-blue-500 outline-none text-sm" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-400 mb-1">문장 수</label>
                                    <input type="text" value={sentenceCount} onChange={e => setSentenceCount(e.target.value)} className="w-full bg-[#0a0a2a] border border-[#2a266b] rounded px-3 py-2 focus:border-blue-500 outline-none text-sm" />
                                </div>
                            </div>
                        </div>

                        {/* Row 3: 원문 & 해석 */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs text-blue-400 font-bold mb-2">지문 원문</label>
                                <textarea
                                    rows={8}
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                    className="w-full bg-[#0a0a2a] border border-[#2a266b] rounded-xl p-4 text-gray-300 focus:border-blue-500 focus:outline-none leading-relaxed font-serif"
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-xs text-purple-400 font-bold mb-2">한글 해석</label>
                                <textarea
                                    rows={8}
                                    value={koreanTranslation}
                                    onChange={e => setKoreanTranslation(e.target.value)}
                                    className="w-full bg-[#0a0a2a] border border-[#2a266b] rounded-xl p-4 text-gray-300 focus:border-purple-500 focus:outline-none leading-relaxed"
                                ></textarea>
                            </div>
                        </div>

                        {/* Row 4: 요약 및 분석 */}
                        <div className="grid grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs text-gray-400 mb-2">한글 요약</label>
                                <textarea
                                    rows={4}
                                    value={koreanSummary}
                                    onChange={e => setKoreanSummary(e.target.value)}
                                    className="w-full bg-[#0a0a2a] border border-[#2a266b] rounded-xl p-3 text-sm text-gray-300 focus:border-blue-500 focus:outline-none"
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-2">영어 요약</label>
                                <textarea
                                    rows={4}
                                    value={englishSummary}
                                    onChange={e => setEnglishSummary(e.target.value)}
                                    className="w-full bg-[#0a0a2a] border border-[#2a266b] rounded-xl p-3 text-sm text-gray-300 focus:border-blue-500 focus:outline-none"
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-2">구조 분석</label>
                                <textarea
                                    rows={4}
                                    value={structureAnalysis}
                                    onChange={e => setStructureAnalysis(e.target.value)}
                                    className="w-full bg-[#0a0a2a] border border-[#2a266b] rounded-xl p-3 text-sm text-gray-300 focus:border-blue-500 focus:outline-none"
                                ></textarea>
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer actions */}
                <div className="flex justify-end p-6 border-t border-[#2a266b] bg-[#0a0a2a]">
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-2 rounded-lg font-bold shadow-lg transition-all disabled:opacity-50"
                    >
                        <Save size={18} /> {loading ? '저장 중...' : '데이터베이스에 저장'}
                    </button>
                </div>

            </div>
        </div>
    );
}
