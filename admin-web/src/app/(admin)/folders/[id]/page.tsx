'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BookOpen, FileText, CheckSquare, Settings2, Trash2, ArrowLeft, X } from 'lucide-react';
import Link from 'next/link';

export default function FolderViewPage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const router = useRouter();
    const [folder, setFolder] = useState<any>(null);
    const [passages, setPassages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Vocab Modal States
    const [isVocabModalOpen, setIsVocabModalOpen] = useState(false);
    const [vocabListName, setVocabListName] = useState('');
    const [minWords, setMinWords] = useState(10);
    const [maxWords, setMaxWords] = useState(30);

    // 강사 커스텀 설정 Options (뜻, 품사는 필수 고정)
    const [options, setOptions] = useState({
        importance: true,     // 지문 내 중요도
        cefr_level: true,     // CEFR 레벨
        phonetics: true,      // 발음기호
        synonyms: true,       // 유의어
        antonyms: false,      // 반의어
        example_original: true, // 예문 1 (원문)
        example_generated: true, // 예문 2 (고3 수준 자체 생성)
        collocations: false,  // 연어
        verb_forms: false,    // 3단 변화
        student_reps: false   // 학생 회독수 체크박스
    });

    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        async function fetchFolderInfo() {
            setLoading(true);

            // 1. Fetch folder metadata
            console.log("Fetching folder with ID:", params.id);
            const { data: folderData, error: folderError } = await supabase
                .from('folders')
                .select('*')
                .eq('id', params.id)
                .single();

            if (folderError || !folderData) {
                console.error("Folder fetch error:", folderError, "Data:", folderData);
                alert('폴더를 찾을 수 없습니다.');
                router.push('/passages');
                return;
            }
            setFolder(folderData);

            // 2. Fetch linked passages
            const { data: linkData, error: linkError } = await supabase
                .from('folder_passages')
                .select('passage_id')
                .eq('folder_id', params.id);

            if (linkData && linkData.length > 0) {
                const passageIds = linkData.map(l => l.passage_id);
                const { data: passageData } = await supabase
                    .from('passages')
                    .select('*')
                    .in('id', passageIds);

                if (passageData) setPassages(passageData);
            }

            setLoading(false);
        }
        fetchFolderInfo();
    }, [params.id, router]);

    const handleOptionToggle = (key: keyof typeof options) => {
        setOptions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleGenerateVocab = async () => {
        if (!vocabListName.trim()) {
            alert('단어장 이름을 입력해주세요.');
            return;
        }

        setIsGenerating(true);

        const settingsJson = {
            extract_range: [minWords, maxWords],
            ...options
        };

        // Create a new Vocab_List record
        const { data: listData, error: listError } = await supabase
            .from('vocab_lists')
            .insert([{
                folder_id: folder.id,
                name: vocabListName.trim(),
                settings: settingsJson
            }])
            .select()
            .single();

        if (listError || !listData) {
            alert('단어장 생성 초기화 오류: ' + listError?.message);
            setIsGenerating(false);
            return;
        }

        // Redirect to Vocab Worker split-screen UI
        router.push(`/folders/${folder.id}/vocab-worker/${listData.id}`);
    };

    if (loading) return <div className="p-20 text-center text-gray-400">데이터를 불러오는 중입니다...</div>;
    if (!folder) return null;

    return (
        <div className="max-w-6xl mx-auto space-y-8 text-gray-200">
            <div className="flex gap-8 items-start">

                {/* Left Side: Folder Header & Actions */}
                <div className="w-[450px] shrink-0 bg-[#0a0a2a] border border-[#2a266b] rounded-2xl p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden sticky top-6">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

                    <div>
                        <Link href="/passages" className="text-gray-500 hover:text-white flex items-center gap-1 text-sm mb-4 w-fit">
                            <ArrowLeft size={16} /> 목록으로 돌아가기
                        </Link>
                        <div className="flex items-center flex-wrap gap-2">
                            <h1 className="text-3xl font-black text-white">{folder.name}</h1>
                            {folder.is_temporary && (
                                <span className="bg-[#ff3366]/20 text-[#ff3366] text-xs px-2 py-1 rounded font-bold border border-[#ff3366]/30">임시 폴더</span>
                            )}
                        </div>
                        <p className="text-gray-400 mt-4 bg-[#13113c] p-3 border border-[#2a266b] rounded-lg">총 <span className="text-blue-400 font-bold">{passages.length}</span>개의 지문이 포함되어 있습니다.</p>
                    </div>

                    {/* Primary Actions */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => setIsVocabModalOpen(true)}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-900/40 transition-all group"
                        >
                            <BookOpen className="group-hover:scale-110 transition-transform" />
                            단어장 생성 (AI)
                        </button>
                        <button className="w-full bg-[#13113c] border border-[#2a266b] text-gray-400 font-bold py-4 rounded-xl flex items-center justify-center gap-2 opacity-50 cursor-not-allowed">
                            <FileText /> 변형문제 생성 (준비 중)
                        </button>
                        <button className="w-full bg-[#13113c] border border-[#2a266b] text-gray-400 font-bold py-4 rounded-xl flex items-center justify-center gap-2 opacity-50 cursor-not-allowed">
                            <CheckSquare /> 워크북 생성 (준비 중)
                        </button>
                    </div>
                </div>

                {/* Right Side: Passages List in Folder */}
                <div className="flex-1 space-y-4">
                    <h3 className="font-bold border-b border-[#2a266b] pb-3 text-lg text-white ml-2">포함된 모음집 지문</h3>
                    <div className="grid gap-3">
                        {passages.map((p, index) => (
                            <div key={p.id} className="bg-[#0a0a2a] border border-[#2a266b] p-5 rounded-xl flex items-center justify-between hover:border-blue-500/50 transition-colors shadow-lg">
                                <div className="flex gap-4 items-start w-full pr-4">
                                    <div className="text-blue-400/50 font-black text-xl w-8 text-center pt-1">{index + 1}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-white mb-2 text-lg truncate flex items-center gap-2">
                                            {p.title_ko}
                                            <span className="text-[10px] px-2 py-0.5 bg-[#2a266b] text-gray-300 rounded-full font-normal">
                                                {p.category}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-400 line-clamp-2 leading-relaxed h-10 overflow-hidden text-clip font-serif w-full max-w-[800px]">
                                            {p.content}
                                        </div>
                                    </div>
                                </div>
                                <button className="text-gray-600 hover:text-red-400 transition-colors p-2 bg-[#13113c] shrink-0 rounded-lg border border-[#2a266b] hover:border-red-500/50">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Vocab Setup Modal */}
            {isVocabModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center backdrop-blur-sm p-4">
                    <div className="bg-[#13113c] border border-[#2a266b] rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col font-sans overflow-hidden">

                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-[#2a266b] bg-[#0a0a2a]">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Settings2 className="text-blue-400" />
                                단어장 생성 설정 (AI 설정)
                            </h2>
                            <button onClick={() => setIsVocabModalOpen(false)} className="text-gray-500 hover:text-white p-1">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">

                            {/* Vocab Name */}
                            <div className="space-y-2">
                                <label className="font-bold text-white text-sm">단어장 이름 (DB 저장용)</label>
                                <input
                                    type="text"
                                    value={vocabListName}
                                    onChange={(e) => setVocabListName(e.target.value)}
                                    placeholder="예: 25년 3월 고3 모의고사 필수어휘"
                                    className="w-full bg-[#0a0a2a] border border-[#2a266b] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                />
                                <p className="text-xs text-gray-500">생성된 단어장은 나중에 다른 폴더에 체계적으로 그룹화할 수 있습니다.</p>
                            </div>

                            {/* Word Count Range */}
                            <div className="space-y-3 bg-[#0a0a2a] p-4 rounded-xl border border-[#2a266b]">
                                <label className="font-bold text-white text-sm">
                                    지문 당 추출 단어 수 범위 (AI 자율 결정)
                                </label>
                                <p className="text-xs text-gray-500 mb-2">지문의 난이도 및 길이에 따라 AI가 범위 내에서 적절한 개수의 어휘를 유동적으로 추출합니다.</p>

                                <div className="flex items-center gap-4">
                                    <div className="flex-1 space-y-1">
                                        <div className="text-xs text-gray-400">최소 추출 (Min)</div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="range" min="5" max="25" step="1"
                                                value={minWords} onChange={(e) => setMinWords(Math.min(parseInt(e.target.value), maxWords))}
                                                className="w-full accent-blue-500 h-1.5 bg-[#13113c] rounded-lg appearance-none cursor-pointer"
                                            />
                                            <span className="text-blue-400 font-bold bg-blue-500/10 px-2 py-1 rounded text-sm w-12 text-center border border-blue-500/20">{minWords}</span>
                                        </div>
                                    </div>
                                    <div className="text-gray-600 font-bold">~</div>
                                    <div className="flex-1 space-y-1">
                                        <div className="text-xs text-gray-400">최대 추출 (Max)</div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="range" min="10" max="50" step="1"
                                                value={maxWords} onChange={(e) => setMaxWords(Math.max(parseInt(e.target.value), minWords))}
                                                className="w-full accent-purple-500 h-1.5 bg-[#13113c] rounded-lg appearance-none cursor-pointer"
                                            />
                                            <span className="text-purple-400 font-bold bg-purple-500/10 px-2 py-1 rounded text-sm w-12 text-center border border-purple-500/20">{maxWords}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Options Grid */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-white border-b border-[#2a266b] pb-2">표기할 항목 정보 선택</h3>

                                <div className="grid grid-cols-2 gap-3">
                                    {/* Fixed Items */}
                                    <label className="flex items-center gap-3 p-3 bg-gray-900/50 border border-gray-800 rounded-xl opacity-60 cursor-not-allowed">
                                        <input type="checkbox" checked readOnly className="w-4 h-4 text-blue-500 rounded border-gray-600" />
                                        <div>
                                            <div className="text-sm font-bold text-white line-through decoration-gray-500">한글 뜻 (상황별 3개+품사)</div>
                                            <div className="text-xs text-gray-500">필수 고정 항목</div>
                                        </div>
                                    </label>

                                    {/* Toggles */}
                                    <label className="flex items-center gap-3 p-3 border border-[#2a266b] rounded-xl hover:bg-[#2a266b]/30 cursor-pointer transition-colors">
                                        <input type="checkbox" checked={options.importance} onChange={() => handleOptionToggle('importance')} className="w-4 h-4 text-blue-500 bg-gray-800 border-gray-600 rounded focus:ring-blue-600" />
                                        <div><div className="text-sm font-bold text-white">지문 내 중요도 (★ 별점)</div><div className="text-xs text-gray-400">어휘문제 출제 가능성 심사</div></div>
                                    </label>

                                    <label className="flex items-center gap-3 p-3 border border-[#2a266b] rounded-xl hover:bg-[#2a266b]/30 cursor-pointer transition-colors">
                                        <input type="checkbox" checked={options.cefr_level} onChange={() => handleOptionToggle('cefr_level')} className="w-4 h-4 text-blue-500 bg-gray-800 border-gray-600 rounded focus:ring-blue-600" />
                                        <div><div className="text-sm font-bold text-white">CEFR 레벨 표기</div><div className="text-xs text-gray-400">A1 ~ C2 객관적 지표</div></div>
                                    </label>

                                    <label className="flex items-center gap-3 p-3 border border-[#2a266b] rounded-xl hover:bg-[#2a266b]/30 cursor-pointer transition-colors">
                                        <input type="checkbox" checked={options.phonetics} onChange={() => handleOptionToggle('phonetics')} className="w-4 h-4 text-blue-500 bg-gray-800 border-gray-600 rounded focus:ring-blue-600" />
                                        <div><div className="text-sm font-bold text-white">발음 기호</div><div className="text-xs text-gray-400">국제 음성 기호 (IPA)</div></div>
                                    </label>

                                    <label className="flex items-center gap-3 p-3 border border-[#2a266b] rounded-xl hover:bg-[#2a266b]/30 cursor-pointer transition-colors">
                                        <input type="checkbox" checked={options.synonyms} onChange={() => handleOptionToggle('synonyms')} className="w-4 h-4 text-blue-500 bg-gray-800 border-gray-600 rounded focus:ring-blue-600" />
                                        <div><div className="text-sm font-bold text-white">유의어 (Top 3)</div><div className="text-xs text-gray-400">지문 맥락에 맞는 동의어</div></div>
                                    </label>

                                    <label className="flex items-center gap-3 p-3 border border-[#2a266b] rounded-xl hover:bg-[#2a266b]/30 cursor-pointer transition-colors">
                                        <input type="checkbox" checked={options.antonyms} onChange={() => handleOptionToggle('antonyms')} className="w-4 h-4 text-blue-500 bg-gray-800 border-gray-600 rounded focus:ring-blue-600" />
                                        <div><div className="text-sm font-bold text-white">반의어 (Top 3)</div><div className="text-xs text-gray-400">어휘 낚시 문제 대비용</div></div>
                                    </label>

                                    <label className="flex items-center gap-3 p-3 border border-[#2a266b] rounded-xl hover:bg-[#2a266b]/30 cursor-pointer transition-colors">
                                        <input type="checkbox" checked={options.example_original} onChange={() => handleOptionToggle('example_original')} className="w-4 h-4 text-blue-500 bg-gray-800 border-gray-600 rounded focus:ring-blue-600" />
                                        <div><div className="text-sm font-bold text-white">예문 1 (원문)</div><div className="text-xs text-gray-400">해당 단어가 쓰인 원본 문장+해석</div></div>
                                    </label>

                                    <label className="flex items-center gap-3 p-3 border border-[#2a266b] rounded-xl hover:bg-[#2a266b]/30 cursor-pointer transition-colors">
                                        <input type="checkbox" checked={options.example_generated} onChange={() => handleOptionToggle('example_generated')} className="w-4 h-4 text-blue-500 bg-gray-800 border-gray-600 rounded focus:ring-blue-600" />
                                        <div><div className="text-sm font-bold text-white">예문 2 (자체 생성)</div><div className="text-xs text-purple-400">고3 수준 Paraphrasing 대비용</div></div>
                                    </label>

                                    <label className="flex items-center gap-3 p-3 border border-[#2a266b] rounded-xl hover:bg-[#2a266b]/30 cursor-pointer transition-colors">
                                        <input type="checkbox" checked={options.collocations} onChange={() => handleOptionToggle('collocations')} className="w-4 h-4 text-blue-500 bg-gray-800 border-gray-600 rounded focus:ring-blue-600" />
                                        <div><div className="text-sm font-bold text-white">연어 (Collocations)</div><div className="text-xs text-gray-400">함께 쓰이는 주요 단어(최대 3개)</div></div>
                                    </label>

                                    <label className="flex items-center gap-3 p-3 border border-[#2a266b] rounded-xl hover:bg-[#2a266b]/30 cursor-pointer transition-colors">
                                        <input type="checkbox" checked={options.verb_forms} onChange={() => handleOptionToggle('verb_forms')} className="w-4 h-4 text-blue-500 bg-gray-800 border-gray-600 rounded focus:ring-blue-600" />
                                        <div><div className="text-sm font-bold text-white">3단 변화</div><div className="text-xs text-gray-400">동사 원형/과거/과거분사 표시</div></div>
                                    </label>

                                    <label className="flex items-center gap-3 p-3 border border-orange-500/30 bg-orange-500/5 rounded-xl hover:bg-orange-500/10 cursor-pointer transition-colors col-span-2">
                                        <input type="checkbox" checked={options.student_reps} onChange={() => handleOptionToggle('student_reps')} className="w-4 h-4 text-orange-500 bg-gray-800 border-gray-600 rounded focus:ring-orange-600" />
                                        <div><div className="text-sm font-bold text-white">학생 회독수 기록 체크박스 포함</div><div className="text-xs text-orange-400">출력 시 학생이 3회독 여부를 스스로 체크할 수 있는 빈 칸 박스 생성</div></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Footer (Start Gen) */}
                        <div className="flex justify-between items-center bg-[#0a0a2a] border-t border-[#2a266b] p-6">
                            <div className="text-xs text-gray-500">생성 과정은 보유한 지문 개수에 따라 10초~1분 정도 소요될 수 있습니다.</div>
                            <div className="flex gap-3">
                                <button onClick={() => setIsVocabModalOpen(false)} className="px-6 py-2 rounded-xl font-bold text-gray-400 hover:text-white bg-[#13113c] border border-[#2a266b]">
                                    닫기
                                </button>
                                <button
                                    onClick={handleGenerateVocab}
                                    disabled={isGenerating}
                                    className="px-6 py-2 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg flex items-center gap-2"
                                >
                                    {isGenerating ? (
                                        <>AI 분석 중...</>
                                    ) : (
                                        <>단어 추출 및 AI 검수 화면으로 이동 ▶</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
