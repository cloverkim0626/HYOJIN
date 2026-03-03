'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Sparkles, Trash2, Printer, Check, X, ArrowLeft, RefreshCw, Save, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function VocabWorkerPage(props: { params: Promise<{ id: string, listId: string }> }) {
    const params = use(props.params);
    const router = useRouter();
    const [listData, setListData] = useState<any>(null);
    const [passages, setPassages] = useState<any[]>([]);
    const [words, setWords] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        async function fetchWorkspace() {
            setLoading(true);

            // 1. Fetch the vocab list settings
            const { data: vocabList } = await supabase
                .from('vocab_lists')
                .select('*')
                .eq('id', params.listId)
                .single();
            setListData(vocabList);

            // 2. Fetch the folder passages
            const { data: linkData } = await supabase
                .from('folder_passages')
                .select('passage_id')
                .eq('folder_id', params.id);

            let fetchedPassages: any[] = [];
            if (linkData && linkData.length > 0) {
                const passageIds = linkData.map(l => l.passage_id);
                const { data: passageData } = await supabase
                    .from('passages')
                    .select('*')
                    .in('id', passageIds);
                if (passageData) {
                    fetchedPassages = passageData;
                    setPassages(passageData);
                }
            }

            // 3. Check if words exist already for this list
            const { data: wordsData } = await supabase
                .from('vocab_words')
                .select('*')
                .eq('list_id', params.listId);

            if (wordsData && wordsData.length > 0) {
                setWords(wordsData);
            } else {
                // Mock Generation if nothing exists (Real API Call Goes Here Later)
                runAIGeneration(vocabList, fetchedPassages);
            }

            setLoading(false);
        }
        fetchWorkspace();
    }, [params.id, params.listId]);

    // Authentic AI Generation - Call Gemini API route
    const runAIGeneration = async (vocabList: any, passageList: any[]) => {
        setIsGenerating(true);
        const settings = vocabList.settings;

        try {
            const response = await fetch('/api/generate/vocab', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passages: passageList, settings })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate vocabulary');
            }

            const data = await response.json();

            // Insert generated items with mandatory IDs 
            const generatedWords = data.words.map((w: any) => ({
                id: crypto.randomUUID(),
                list_id: vocabList.id,
                ...w,
                created_at: new Date().toISOString()
            }));

            setWords(generatedWords);

            // Save generated data to DB immediately so it persists
            const insertPayload = generatedWords.map(({ id, ...rest }: any) => rest);
            if (insertPayload.length > 0) {
                const { error } = await supabase.from('vocab_words').insert(insertPayload);
                if (error) console.error("Error saving vocab to DB:", error);
            }
        } catch (error: any) {
            console.error('Generation Error:', error);
            alert('AI 단어장 생성 중 오류가 발생했습니다: ' + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const removePassage = (passageId: string) => {
        setPassages(prev => prev.filter(p => p.id !== passageId));
        setWords(prev => prev.filter(w => w.passage_id !== passageId));
    };

    const removeWord = (wordId: string) => {
        setWords(prev => prev.filter(w => w.id !== wordId));
    };

    const handleWordChange = (wordId: string, field: string, value: any) => {
        setWords(prev => prev.map(w => w.id === wordId ? { ...w, [field]: value } : w));
    };

    const handleSaveAndPrint = async () => {
        setIsSaving(true);
        // In a real app, we would perform an upsert here to save the manual edits.
        // For now, we simulate success and show a print alert.
        await new Promise(resolve => setTimeout(resolve, 800));
        alert('저장이 완료되었습니다. 인쇄 화면(미리보기)으로 넘어갑니다.');
        setIsSaving(false);
        // router.push(`/folders/${params.id}/print-vocab/${params.listId}`);
    };

    if (loading) return <div className="p-20 text-center text-gray-400">워크스페이스를 여는 중...</div>;
    if (isGenerating) return (
        <div className="p-32 flex flex-col items-center justify-center text-center gap-6">
            <Sparkles className="w-16 h-16 text-blue-500 animate-pulse" />
            <h2 className="text-2xl font-bold text-white">AI 단어 추출 진행 중입니다...</h2>
            <p className="text-gray-400">선택된 지문의 개수와 설정된 복잡도에 따라 시간이 소요될 수 있습니다.<br />화면을 닫지 말고 잠시만 기다려주세요.</p>
        </div>
    );

    const settings = listData?.settings || {};

    return (
        <div className="h-[calc(100vh-80px)] flex flex-col overflow-hidden text-gray-200">
            {/* Top Bar */}
            <div className="bg-[#0a0a2a] border-b border-[#2a266b] px-6 py-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <Link href={`/folders/${params.id}`} className="text-gray-500 hover:text-white bg-[#13113c] p-2 rounded-lg border border-[#2a266b]">
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <Sparkles className="text-purple-400" size={18} />
                            {listData?.name || '새 단어장'} <span className="text-gray-500 font-normal text-sm ml-2">- AI 휴먼 검수</span>
                        </h1>
                        <div className="text-xs text-gray-400 mt-1">
                            추출 옵션: {settings.extract_range ? `${settings.extract_range[0]}~${settings.extract_range[1]}` : '10'}개 (자동) | CEFR표기: {settings.cefr_level ? 'O' : 'X'} | 유/반의어: {settings.synonyms ? 'O' : 'X'}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button className="px-4 py-2 rounded-lg font-bold text-gray-300 hover:text-white bg-[#13113c] border border-[#2a266b] flex items-center gap-2 transition-colors">
                        <RefreshCw size={16} /> 전체 재추출
                    </button>
                    <button
                        onClick={handleSaveAndPrint}
                        disabled={isSaving}
                        className="px-6 py-2 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/40 flex items-center gap-2"
                    >
                        {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Printer size={16} />}
                        검수 완료 및 인쇄 저장
                    </button>
                </div>
            </div>

            {/* Split Screen Workspace */}
            <div className="flex-1 flex overflow-hidden">

                {/* Left Panel: Passages */}
                <div className="w-5/12 border-r border-[#2a266b] bg-[#050515] overflow-y-auto custom-scrollbar p-6">
                    <h2 className="text-lg font-bold text-white mb-6 border-b border-[#2a266b] pb-2 flex justify-between items-center">
                        선택된 원본 지문 <span className="text-blue-400 text-sm">총 {passages.length}개</span>
                    </h2>

                    <div className="space-y-6">
                        {passages.map((p, idx) => (
                            <div key={p.id} className="bg-[#13113c] border border-[#2a266b] rounded-xl overflow-hidden group">
                                <div className="bg-[#1a1744] px-4 py-2 flex justify-between items-center border-b border-[#2a266b]">
                                    <div className="font-bold text-sm text-blue-200">#{idx + 1}. {p.title_ko}</div>
                                    <button
                                        onClick={() => removePassage(p.id)}
                                        className="text-gray-500 hover:text-red-400 flex items-center gap-1 text-xs px-2 py-1 rounded bg-[#0a0a2a] opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="지문 제외하기 (우측 단어도 함께 삭제됩니다)"
                                    >
                                        <X size={14} /> 지문 삭제
                                    </button>
                                </div>
                                <div className="p-4 text-sm text-gray-400 font-serif leading-relaxed h-48 overflow-y-auto custom-scrollbar bg-[#0a0a2a]/50">
                                    {p.content}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel: Extracted Vocabs */}
                <div className="w-7/12 bg-[#13113c] overflow-y-auto custom-scrollbar p-6 relative">
                    <h2 className="text-lg font-bold text-white mb-6 border-b border-[#2a266b] pb-2">
                        추출된 커스텀 단어 리스트 <span className="text-purple-400 text-sm">총 {words.length}개</span>
                    </h2>

                    {passages.map((p, idx) => {
                        const pWords = words.filter(w => w.passage_id === p.id);
                        if (pWords.length === 0) return null;

                        return (
                            <div key={p.id} className="mb-10">
                                <h3 className="text-blue-400 font-bold mb-4 flex items-center gap-2">
                                    <span className="bg-blue-900/50 px-2 py-0.5 rounded border border-blue-500/30 text-xs">지문 #{idx + 1}</span>
                                    {p.title_ko || '제목 없음'}
                                </h3>

                                <div className="space-y-4 pl-4 border-l-2 border-[#2a266b]">
                                    {pWords.map(word => (
                                        <div key={word.id} className="bg-[#0a0a2a] border border-[#2a266b] rounded-xl p-5 relative group hover:border-purple-500/50 transition-colors">

                                            {/* Word Delete Button */}
                                            <button
                                                onClick={() => removeWord(word.id)}
                                                className="absolute top-4 right-4 text-gray-600 hover:text-red-500 p-1.5 bg-[#13113c] rounded-md border border-[#2a266b] opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                            >
                                                <Trash2 size={16} />
                                            </button>

                                            <div className="grid grid-cols-12 gap-6">
                                                {/* Left Column: Word & Essential Props */}
                                                <div className="col-span-4 space-y-4">
                                                    <div>
                                                        <label className="text-[10px] text-gray-500 font-medium tracking-widest uppercase mb-1 block">WORD (원형)</label>
                                                        <input
                                                            type="text"
                                                            value={word.word}
                                                            onChange={(e) => handleWordChange(word.id, 'word', e.target.value)}
                                                            className="w-full bg-transparent text-xl font-black text-white hover:bg-[#13113c] focus:bg-[#13113c] outline-none rounded px-1 transition-colors border-b border-transparent focus:border-purple-500"
                                                        />
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <div className="flex-1">
                                                            <label className="text-[10px] text-gray-500 font-medium tracking-widest uppercase mb-1 block">품사</label>
                                                            <input
                                                                type="text"
                                                                value={word.pos}
                                                                onChange={(e) => handleWordChange(word.id, 'pos', e.target.value)}
                                                                className="w-full bg-[#13113c] text-blue-400 text-sm border border-[#2a266b] rounded px-2 py-1 outline-none focus:border-blue-500"
                                                            />
                                                        </div>
                                                        {settings.importance && (
                                                            <div className="w-16">
                                                                <label className="text-[10px] text-gray-500 font-medium tracking-widest uppercase mb-1 block">중요도</label>
                                                                <input
                                                                    type="number" min="1" max="5"
                                                                    value={word.importance || 1}
                                                                    onChange={(e) => handleWordChange(word.id, 'importance', parseInt(e.target.value))}
                                                                    className="w-full bg-[#13113c] text-yellow-500 text-sm border border-[#2a266b] rounded px-2 py-1 outline-none focus:border-yellow-500 text-center font-bold"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {settings.phonetics && (
                                                        <div>
                                                            <label className="text-[10px] text-gray-500 font-medium tracking-widest uppercase mb-1 block">발음 기호</label>
                                                            <input
                                                                type="text"
                                                                value={word.phonetics || ''}
                                                                onChange={(e) => handleWordChange(word.id, 'phonetics', e.target.value)}
                                                                className="w-full bg-[#13113c] text-gray-300 text-sm border border-[#2a266b] rounded px-2 py-1.5 outline-none focus:border-purple-500"
                                                            />
                                                        </div>
                                                    )}

                                                    {settings.cefr_level && (
                                                        <div>
                                                            <label className="text-[10px] text-gray-500 font-medium tracking-widest uppercase mb-1 block">CEFR Level</label>
                                                            <input
                                                                type="text"
                                                                value={word.cefr_level || ''}
                                                                onChange={(e) => handleWordChange(word.id, 'cefr_level', e.target.value)}
                                                                className="w-20 bg-[#13113c] text-pink-400 text-sm border border-[#2a266b] rounded px-2 py-1 outline-none focus:border-pink-500 text-center font-bold"
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Middle Column: Meanings & Relations */}
                                                <div className="col-span-8 space-y-4">
                                                    <div>
                                                        <label className="text-[10px] text-gray-500 font-medium tracking-widest uppercase mb-1 block">한글 뜻 (최대 3개, 1순위: 지문 의미)</label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {word.meanings?.map((m: string, i: number) => (
                                                                <input key={i} type="text" value={m}
                                                                    onChange={(e) => {
                                                                        const newMeanings = [...word.meanings];
                                                                        newMeanings[i] = e.target.value;
                                                                        handleWordChange(word.id, 'meanings', newMeanings);
                                                                    }}
                                                                    className={`bg-[#13113c] text-sm border ${i === 0 ? 'border-blue-500/50 text-white font-bold' : 'border-[#2a266b] text-gray-300'} rounded px-3 py-1.5 outline-none focus:border-blue-500 max-w-[150px]`}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {(settings.synonyms || settings.antonyms || settings.collocations) && (
                                                        <div className="grid grid-cols-2 gap-4 bg-[#13113c] p-3 rounded-lg border border-[#2a266b]/50">
                                                            {settings.synonyms && (
                                                                <div>
                                                                    <label className="text-[10px] text-blue-400/70 font-medium tracking-widest uppercase mb-1 block">유의어 (Synonyms)</label>
                                                                    <input type="text" value={word.synonyms?.join(', ') || ''}
                                                                        onChange={(e) => handleWordChange(word.id, 'synonyms', e.target.value.split(',').map(s => s.trim()))}
                                                                        className="w-full bg-[#0a0a2a] text-blue-200 text-xs border border-[#2a266b] rounded px-2 py-1.5 outline-none focus:border-blue-500"
                                                                    />
                                                                </div>
                                                            )}
                                                            {settings.antonyms && (
                                                                <div>
                                                                    <label className="text-[10px] text-red-400/70 font-medium tracking-widest uppercase mb-1 block">반의어 (Antonyms)</label>
                                                                    <input type="text" value={word.antonyms?.join(', ') || ''}
                                                                        onChange={(e) => handleWordChange(word.id, 'antonyms', e.target.value.split(',').map(s => s.trim()))}
                                                                        className="w-full bg-[#0a0a2a] text-red-200 text-xs border border-[#2a266b] rounded px-2 py-1.5 outline-none focus:border-red-500"
                                                                    />
                                                                </div>
                                                            )}
                                                            {settings.collocations && (
                                                                <div className="col-span-2">
                                                                    <label className="text-[10px] text-green-400/70 font-medium tracking-widest uppercase mb-1 block">주요 연어 (Collocations)</label>
                                                                    <input type="text" value={word.collocations?.join(', ') || ''}
                                                                        onChange={(e) => handleWordChange(word.id, 'collocations', e.target.value.split(',').map(s => s.trim()))}
                                                                        className="w-full bg-[#0a0a2a] text-green-200 text-xs border border-[#2a266b] rounded px-2 py-1.5 outline-none focus:border-green-500"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Sentences */}
                                                    {(settings.example_original || settings.example_generated) && (
                                                        <div className="space-y-3 mt-2 border-t border-[#2a266b] pt-4">
                                                            {settings.example_original && (
                                                                <div>
                                                                    <label className="text-[10px] text-gray-500 font-medium tracking-widest uppercase mb-1 block flex items-center gap-1">
                                                                        <BookOpen size={10} /> 원본 예문 (Original)
                                                                    </label>
                                                                    <textarea value={word.example_original || ''}
                                                                        onChange={(e) => handleWordChange(word.id, 'example_original', e.target.value)}
                                                                        className="w-full bg-[#13113c] text-sm text-gray-300 border border-[#2a266b] rounded-lg px-3 py-2 outline-none focus:border-purple-500 custom-scrollbar h-16 resize-none"
                                                                    />
                                                                    <input type="text" value={word.example_ko || ''} placeholder="한글 해석"
                                                                        onChange={(e) => handleWordChange(word.id, 'example_ko', e.target.value)}
                                                                        className="w-full mt-1 bg-transparent text-xs text-gray-500 border-b border-[#2a266b] px-1 py-1 outline-none focus:border-purple-500"
                                                                    />
                                                                </div>
                                                            )}

                                                            {settings.example_generated && (
                                                                <div>
                                                                    <label className="text-[10px] text-purple-400 font-medium tracking-widest uppercase mb-1 block flex items-center gap-1">
                                                                        <Sparkles size={10} /> AI 생성 예문 (고3 Paraphrasing 대상)
                                                                    </label>
                                                                    <textarea value={word.example_generated || ''}
                                                                        onChange={(e) => handleWordChange(word.id, 'example_generated', e.target.value)}
                                                                        className="w-full bg-[#20103a]/20 text-sm text-purple-100 border border-purple-500/30 rounded-lg px-3 py-2 outline-none focus:border-purple-500 custom-scrollbar h-16 resize-none"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
