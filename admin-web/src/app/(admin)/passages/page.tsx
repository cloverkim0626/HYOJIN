'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Search, Filter, FolderPlus, X } from 'lucide-react';

export default function PassagesPage() {
    const router = useRouter();
    const [passages, setPassages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPassages, setSelectedPassages] = useState<any[]>([]);

    // Folder Modal States
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [folderName, setFolderName] = useState('');
    const [isTemporary, setIsTemporary] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        async function fetchPassages() {
            const { data, error } = await supabase
                .from('passages')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching passages:', error);
            } else {
                setPassages(data || []);
            }
            setLoading(false);
        }
        fetchPassages();
    }, []);

    const handleSelectPassage = (passage: any) => {
        setSelectedPassages(prev => {
            const exists = prev.find(p => p.id === passage.id);
            if (exists) {
                return prev.filter(p => p.id !== passage.id);
            } else {
                return [...prev, passage];
            }
        });
    };

    const handleCreateFolder = async () => {
        if (selectedPassages.length === 0) return;
        if (!isTemporary && folderName.trim() === '') {
            alert('폴더 이름을 입력해주세요.');
            return;
        }

        setIsSaving(true);
        const finalFolderName = isTemporary ? '임시 폴더 (Temporary)' : folderName;

        // 1. Create Folder
        const { data: folderData, error: folderError } = await supabase
            .from('folders')
            .insert([{ name: finalFolderName, is_temporary: isTemporary }])
            .select()
            .single();

        if (folderError || !folderData) {
            alert('폴더 생성 실패: ' + folderError?.message);
            setIsSaving(false);
            return;
        }

        // 2. Link Passages to Folder
        const folderPassagesPayload = selectedPassages.map(p => ({
            folder_id: folderData.id,
            passage_id: p.id
        }));

        const { error: linkError } = await supabase
            .from('folder_passages')
            .insert(folderPassagesPayload);

        if (linkError) {
            alert('지문 연결 실패: ' + linkError.message);
            setIsSaving(false);
            return;
        }

        setIsSaving(false);
        setIsFolderModalOpen(false);
        // Redirect to new folder view
        router.push(`/folders/${folderData.id}`);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 text-gray-200 relative">
            {/* Top Header Bar */}
            <div className="bg-[#13113c] p-4 flex items-center justify-between rounded-2xl border border-[#2a266b] shadow-2xl">
                <div className="flex items-center gap-4">
                    <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                        Explorer
                    </div>
                    <div className="h-6 w-px bg-[#2a266b]"></div>
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-[#ff3366]/10 text-[#ff3366] rounded-lg border border-[#ff3366]/30 text-sm hover:bg-[#ff3366]/20 transition-all">
                        <Trash2 size={16} /> 삭제
                    </button>
                    <Link href="/passages/new" className="flex items-center gap-2 px-3 py-1.5 bg-[#4CAF50]/10 text-[#4CAF50] rounded-lg border border-[#4CAF50]/30 text-sm hover:bg-[#4CAF50]/20 transition-all">
                        <Plus size={16} /> 개별 추가
                    </Link>
                    <Link href="/passages/bulk-upload" className="flex items-center gap-2 px-3 py-1.5 bg-[#2196F3]/10 text-[#2196F3] rounded-lg border border-[#2196F3]/30 text-sm hover:bg-[#2196F3]/20 transition-all">
                        📊 EXCEL 대량 업로드
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="데이터 검색 (Keyword)..."
                            className="bg-[#0a0a2a] border border-[#2a266b] rounded-full py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:border-purple-500 w-64 text-gray-200"
                        />
                    </div>
                    <div className="flex bg-[#0a0a2a] rounded-full p-1 border border-[#2a266b]">
                        <button className="px-4 py-1 rounded-full bg-blue-600 text-white text-sm">전체</button>
                        <button className="px-4 py-1 rounded-full text-gray-400 hover:text-white text-sm">교과서</button>
                        <button className="px-4 py-1 rounded-full text-gray-400 hover:text-white text-sm">모의고사</button>
                    </div>
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-[#0a0a2a] rounded-lg border border-[#2a266b] text-sm text-gray-400 hover:text-white">
                        <Filter size={16} /> 최신순
                    </button>
                </div>
            </div>

            <div className="flex gap-6">
                {/* Main List */}
                <div className="flex-1 space-y-3">
                    {loading ? (
                        <div className="p-10 text-center text-gray-500">로딩 중...</div>
                    ) : passages.length === 0 ? (
                        <div className="p-10 text-center border border-[#2a266b] bg-[#13113c] rounded-2xl flex flex-col items-center">
                            <p className="mb-4 text-gray-400">등록된 지문 데이터가 없습니다.</p>
                            <Link href="/passages/new" className="text-purple-400 hover:text-purple-300">첫 지문 추가하기</Link>
                        </div>
                    ) : (
                        passages.map((p) => (
                            <div key={p.id} className="bg-[#13113c] border border-[#2a266b] p-4 rounded-xl flex items-center justify-between hover:border-purple-500 transition-colors group cursor-pointer relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-600 hidden group-hover:block"></div>
                                <div className="flex gap-6 items-center w-full">
                                    <div className="text-xs text-[#2a266b] font-mono break-all w-8 leading-tight">
                                        {p.id.substring(0, 4)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded text-xs border border-blue-700/50">
                                                {p.category === 'mock_exam' ? '모의고사' : p.category === 'textbook' ? '교과서' : p.category === 'ebs' ? 'EBS' : '기타'}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {p.grade ? `고${p.grade}` : ''} {p.exam_year ? `• ${p.exam_year}년` : ''} {p.exam_month ? `${p.exam_month}월` : ''}
                                            </span>
                                        </div>
                                        <div className="font-medium text-lg text-white mb-1">
                                            {p.question_number ? `#${p.question_number} ` : ''}
                                            {p.passage_type ? `[${p.passage_type}] ` : ''}
                                            {p.title_ko || '제목 없음'}
                                        </div>
                                    </div>
                                    <div className="w-1/3 text-sm text-gray-500 truncate mr-8">
                                        {p.content ? `"${p.content.substring(0, 80)}..."` : '지문 내용이 없습니다.'}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={selectedPassages.some(s => s.id === p.id)}
                                        onChange={() => handleSelectPassage(p)}
                                        className="w-5 h-5 rounded border-[#2a266b] bg-[#0a0a2a] text-purple-600 focus:ring-purple-600 ring-offset-[#13113c] cursor-pointer"
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Right Sidebar (Cart/Selected) */}
                <div className="w-[350px] bg-[#13113c] border border-[#2a266b] rounded-2xl p-5 h-fit sticky top-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold flex items-center gap-2 text-gray-200">
                            선택 지문
                        </h3>
                        <span className="bg-[#2a266b] text-blue-400 font-bold px-3 py-1 rounded-full text-sm">
                            {selectedPassages.length}
                        </span>
                    </div>

                    <button
                        onClick={() => setIsFolderModalOpen(true)}
                        disabled={selectedPassages.length === 0}
                        className={`w-full py-3 rounded-xl font-bold flex justify-center items-center gap-2 mb-4 transition-all shadow-lg ${selectedPassages.length > 0
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-purple-900/30'
                                : 'bg-[#2a266b]/50 text-gray-500 opacity-50 cursor-not-allowed'
                            }`}
                    >
                        <FolderPlus size={18} /> 내 폴더에 담기 (선택 {selectedPassages.length})
                    </button>

                    <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                        {selectedPassages.length === 0 ? (
                            <div className="text-sm text-center text-gray-500 py-10 border border-dashed border-[#2a266b] rounded-xl bg-[#0a0a2a]/50">
                                좌측 체크박스를 클릭하여<br />지문을 선택해주세요.
                            </div>
                        ) : (
                            selectedPassages.map(p => (
                                <div key={p.id} className="bg-[#0a0a2a] border border-[#2a266b] p-3 rounded-lg text-xs hover:border-blue-500/50 transition-colors group relative">
                                    <div className="font-bold text-white mb-1 truncate pr-6">{p.title_ko}</div>
                                    <div className="text-gray-500 truncate">{p.content.substring(0, 30)}...</div>
                                    <button onClick={() => handleSelectPassage(p)} className="absolute right-2 top-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <X size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Folder Creation Modal */}
            {isFolderModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-[#13113c] border border-[#2a266b] rounded-2xl p-6 w-[450px] shadow-2xl flex flex-col gap-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <FolderPlus className="text-blue-400" />
                                폴더에 담기
                            </h2>
                            <button onClick={() => setIsFolderModalOpen(false)} className="text-gray-500 hover:text-white p-1">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="bg-[#0a0a2a] border border-purple-500/30 rounded-xl p-4 text-sm text-purple-200">
                            선택된 지문 <span className="font-bold text-white bg-purple-600 px-2 py-0.5 rounded-full mx-1">{selectedPassages.length}</span> 개를 폴더에 담습니다.
                        </div>

                        <div className="space-y-4">
                            <label className="flex items-center gap-3 p-4 border border-[#2a266b] rounded-xl cursor-pointer hover:bg-[#2a266b]/20 transition-colors">
                                <input
                                    type="radio"
                                    checked={!isTemporary}
                                    onChange={() => setIsTemporary(false)}
                                    className="w-4 h-4 text-blue-500 bg-gray-800 border-gray-600 focus:ring-blue-600 focus:ring-2"
                                />
                                <div>
                                    <div className="font-bold text-white">새로운 폴더 생성하기</div>
                                    <div className="text-xs text-gray-400">특정 학교 시험 범위나 주제별로 지문을 저장합니다.</div>
                                </div>
                            </label>

                            {!isTemporary && (
                                <div className="ml-8">
                                    <input
                                        type="text"
                                        value={folderName}
                                        onChange={e => setFolderName(e.target.value)}
                                        placeholder="폴더 이름 (예: 25년 3월 학평 고3 대비)"
                                        className="w-full bg-[#0a0a2a] border border-[#2a266b] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            )}

                            <label className="flex items-center gap-3 p-4 border border-[#2a266b] rounded-xl cursor-pointer hover:bg-[#2a266b]/20 transition-colors">
                                <input
                                    type="radio"
                                    checked={isTemporary}
                                    onChange={() => {
                                        setIsTemporary(true);
                                        setFolderName('');
                                    }}
                                    className="w-4 h-4 text-purple-500 bg-gray-800 border-gray-600 focus:ring-purple-600 focus:ring-2"
                                />
                                <div>
                                    <div className="font-bold text-white">임시 폴더에 담기 (1회성)</div>
                                    <div className="text-xs text-gray-400">임시로 지문을 담아 단어장/학습지를 바로 생성합니다.<br />(폴더 이름 설정 안함)</div>
                                </div>
                            </label>
                        </div>

                        <div className="flex justify-end gap-3 mt-4">
                            <button onClick={() => setIsFolderModalOpen(false)} className="px-5 py-2 rounded-lg text-sm text-gray-400 hover:text-white bg-[#0a0a2a] border border-[#2a266b]">
                                취소
                            </button>
                            <button
                                onClick={handleCreateFolder}
                                disabled={isSaving || (!isTemporary && folderName.trim() === '')}
                                className="px-5 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-lg"
                            >
                                {isSaving ? '생성 중...' : '폴더 만들기 및 이동'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
