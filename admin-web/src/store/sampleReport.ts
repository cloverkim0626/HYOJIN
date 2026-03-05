export const sampleDailyReportHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css" />
<style>
:root { --c1:#0f172a; --c2:#1e40af; --c3:#dc2626; --g1:#6b7280; --bg:#f8fafc; }
*{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased}
body{background:#fff;font-family:'Pretendard',-apple-system,sans-serif;color:var(--c1);padding:40px 24px;display:flex;justify-content:center}
.w{width:100%;max-width:400px}
.hd{border-bottom:5px solid var(--c1);padding-bottom:24px;margin-bottom:48px}
.hd-tag{font-size:10px;font-weight:900;color:var(--c2);letter-spacing:.15em;margin-bottom:8px}
.hd-name{font-size:30px;font-weight:800;line-height:1.2;letter-spacing:-.04em;margin-bottom:12px}
.hd-meta{display:flex;justify-content:space-between;font-size:12px;font-weight:600;color:var(--g1)}
.sec{margin-bottom:60px}
.sec-lab{font-size:12px;font-weight:900;text-align:center;display:block;color:#000;letter-spacing:.2em;text-transform:uppercase;margin-bottom:32px;position:relative}
.sec-lab::before{content:'';display:block;width:24px;height:2px;background:var(--c2);margin:0 auto 10px}
.ch{font-size:20px;font-weight:800;margin-bottom:12px;letter-spacing:-.02em;text-align:center}
.cp{font-size:15px;line-height:1.9;color:#374151;font-weight:400;text-align:center}
.sw{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.badge{font-size:10px;font-weight:800;padding:3px 8px;border-radius:3px}
.b-r{background:#fef2f2;color:var(--c3);border:1px solid #fecaca}
.b-b{background:#eff6ff;color:var(--c2);border:1px solid #bfdbfe}
.b-g{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
.plan{font-size:13px;color:var(--c3);font-weight:600;line-height:1.6;margin-top:10px}
.hw-item{margin-bottom:18px;padding:16px;background:var(--bg);border-radius:8px;border-left:4px solid var(--c2)}
.hw-item.warn{border-left-color:var(--c3)}
.ti{margin-bottom:32px}
.tf{display:flex;justify-content:space-between;align-items:flex-end}
.tt{font-size:16px;font-weight:800;color:var(--c1)}
.td{font-size:12px;color:var(--g1);margin-top:4px}
.sb{font-size:40px;font-weight:900;line-height:.8;color:var(--c2);letter-spacing:-.03em}
.ss{font-size:14px;color:#d1d5db;font-weight:600;margin-left:2px}
.cb{height:4px;background:#f3f4f6;position:relative;margin:20px 0 12px}
.cr{height:100%;background:var(--c2);transition:width .8s}
.ad{position:absolute;top:-4px;width:12px;height:12px;background:#fff;border:3px solid var(--c1);border-radius:50%}
.ci{display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:var(--g1)}
.cc{background:var(--bg);padding:24px;border-radius:6px;border-left:4px solid var(--c2)}
.ct{font-size:19px;font-weight:800;margin-bottom:16px;display:block;color:var(--c2)}
.cm{font-size:15px;line-height:1.95;color:#1f2937;white-space:pre-wrap}
.cm b{color:var(--c2);font-weight:800}
.ft{margin-top:56px;border-top:1px solid #f3f4f6;padding-top:32px;text-align:center}
.btn{display:block;background:var(--c1);color:#fff;text-decoration:none;padding:20px;font-size:14px;font-weight:800;letter-spacing:.04em;margin-bottom:24px;transition:.2s}
.btn:hover{opacity:.9}
.cp2{font-size:10px;font-weight:700;color:#d1d5db;letter-spacing:.15em}
</style>
</head>
<body>
<div class="w">
<header class="hd">
<p class="hd-tag">DAILY LEARNING REPORT</p>
<h1 class="hd-name">샘플학생 학생<br>일간 학습 보고서</h1>
<div class="hd-meta"><span>아라고 2학년반</span><span>2026.03.05 수요일</span></div>
</header>

<section class="sec">
<span class="sec-lab">01 / 출결 및 오늘 학습 내용</span>
<div class="ch" style="color:var(--c2)">● 정상 등원 완료</div>
<div class="cp">2026 고2 3월 모의고사 기출문제 해설 (18번, 29번, 33번 집중 분석)
— 빈칸추론 핵심 논리 구조 파악 훈련
— 글의 순서 문항 접근법 + 실전 적용</div>
</section>

<section class="sec">
<span class="sec-lab">02 / 과제 완료 현황</span>
<div class="hw-item">
<div class="sw"><span class="ch" style="font-size:14px">워크북 1과 (p.17~63)</span><span class="badge b-b">완료</span></div>
</div>
<div class="hw-item warn">
<div class="sw"><span class="ch" style="font-size:14px">단어 암기 (교과 1과 54~123번)</span><span class="badge b-r">미완료</span></div>
<p class="plan">→ 금요일까지 오답 단어 3회 반복 암기 후 재시험</p>
</div>
<div class="hw-item">
<div class="sw"><span class="ch" style="font-size:14px">주요문장 암기 (1과 핵심 10문장)</span><span class="badge b-g">완료</span></div>
</div>
<div class="hw-item warn">
<div class="sw"><span class="ch" style="font-size:14px">오답노트 작성 (모의고사 18,29,33번)</span><span class="badge b-r">미완료</span></div>
<p class="plan">→ 다음 수업 전까지 틀린 문항별 원인 분석 + 올바른 풀이과정 정리</p>
</div>
</section>

<section class="sec">
<span class="sec-lab">03 / 테스트 성취도 분석</span>
<div class="ti">
<div class="tf">
<div><p class="tt">단어 테스트</p><p class="td">교과 1과 [54~123번]</p></div>
<div style="text-align:right"><span class="sb">51</span><span class="ss">/70</span></div>
</div>
<div class="cb"><div class="cr" style="width:72.9%"></div><div class="ad" style="left:70%"></div></div>
<div class="ci"><span>달성률: 72.9%</span><span>반 평균: 49점</span></div>
</div>
<div class="ti">
<div class="tf">
<div><p class="tt" style="color:var(--c3)">문법 적용 테스트</p><p class="td">관계대명사 · 분사구문 혼합</p></div>
<div style="text-align:right"><span class="sb" style="color:var(--c3)">6</span><span class="ss">/10</span></div>
</div>
<div class="cb"><div class="cr" style="width:60%;background:var(--c3)"></div><div class="ad" style="left:75%"></div></div>
<div class="ci"><span style="color:var(--c3)">평균 대비 보완 필요</span><span>반 평균: 7.5점</span></div>
</div>
</section>

<section class="sec">
<span class="sec-lab">04 / 다음 차시 안내</span>
<div class="ch">3월 7일 금요일</div>
<div class="cp" style="font-weight:500;white-space:pre-wrap">• 교과 1과 단어 재시험 (미통과 범위)
• 모의고사 오답노트 검사
• 2과 본문 독해 시작 예정</div>
</section>

<section class="sec">
<span class="sec-lab">05 / 선생님 코멘트</span>
<div class="cc">
<span class="ct">To. 샘플학생 학부모님</span>
<p class="cm">안녕하세요, 우독학원 영어 효진T 입니다.

오늘 <b>3월 모의고사 고난도 3문항</b>을 집중 해설했습니다. 빈칸추론(18번)에서 논리 구조를 잡는 연습이 많이 필요한 상태이지만, 글의 순서(33번)는 접근법을 잘 이해하고 있어 앞으로 점수 향상이 기대됩니다.

단어 시험은 <b>51/70점</b>으로 반 평균(49점) 대비 소폭 상회했으나, 반복 암기가 부족한 부분이 보여 <b>금요일 재시험</b>을 계획하고 있습니다.

문법 테스트에서 관계대명사와 분사구문 혼합 문제에 어려움을 느끼고 있어, 다음 주에 보충 프린트를 추가로 제공할 예정입니다.

궁금하신 사항은 편하게 문의주세요. 감사합니다. :)</p>
</div>
</section>

<footer class="ft">
<a href="https://open.kakao.com/o/sY6xBxji" class="btn">선생님과 직접 상담하기</a>
<p class="cp2">KIM HYOJIN ENGLISH — DAILY REPORT</p>
</footer>
</div>
</body>
</html>`;
