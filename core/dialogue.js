// 대화 표시(2026-11-09 선생님): 사람 말은 화면 아래 한지 대화창, 해설은 아래 자막(mode-cap), 안내는 할 일 상자 아래 칩(mode-chip),
// 해설·안내가 묻는 고르기와 퀴즈는 가운데 밝은 질문 + 어두운 보기 띠(mode-quiz). 한 글자씩 나타나는 대사, 다시 고르기, 퀴즈.
import { portraitURL } from './faces.js';

const NARR = { name: '해설', mark: '', color: '#5a5248' }; // 史 글자는 뺐다(2026-11-09 선생님)
const CLICK_GUARD_MS = 250; // 선택지가 열린 직후의 탭은 앞 대사를 넘기려던 탭이므로 무시

// onSay(line): 대사가 나올 때마다 부른다, onClose(): 대화창이 닫힐 때
export function createDialogue(root, speakers, { typeMs = 26, reduceMotion = false, onSay = null, onClose = null } = {}) {
  const all = { narr: NARR, ...speakers };
  const el = document.createElement('div');
  el.className = 'dlg';
  el.hidden = true;
  el.innerHTML = '<div class="dlg-portrait"></div><div class="dlg-name"></div><div class="dlg-tag" hidden></div><div class="dlg-head"><div class="dlg-meta" hidden><span class="dlg-count" hidden></span><span class="dlg-year" hidden></span></div><div class="dlg-text"></div></div><div class="dlg-next">눌러서 계속 ▸</div><div class="dlg-choices" hidden></div><div class="dlg-why" hidden><span class="txt"></span><span class="dlg-year" hidden></span><span class="nx">눌러서 계속 ▸</span></div>';
  root.appendChild(el);
  const $ = s => el.querySelector(s);
  const textEl = $('.dlg-text'), nextEl = $('.dlg-next'), choicesEl = $('.dlg-choices'), whyEl = $('.dlg-why'), metaEl = $('.dlg-meta');
  const MODES = ['mode-cap', 'mode-chip', 'mode-quiz'];
  // 표시 모양: 사람(look)은 한지 대화창, 안내는 칩, 그 밖의 글(해설)은 자막. quiz는 고르기에서 따로 켠다
  function setMode(mode) { MODES.forEach(m => el.classList.toggle(m, m === mode)); if (mode === 'mode-chip') { const hud = root.querySelector('.hud'); el.style.top = hud && !hud.hidden ? `${Math.round(hud.getBoundingClientRect().bottom) + 8}px` : ''; } else el.style.top = ''; }
  function setMeta(count, year) { // 질문 위 '문제 2/3'·연도 칩(없으면 숨김)
    const c = metaEl.querySelector('.dlg-count'), y = metaEl.querySelector('.dlg-year');
    c.hidden = !count; c.textContent = count || ''; y.hidden = !year; y.textContent = year ? `${year}년` : '';
    metaEl.hidden = !count && !year;
  }

  let advanceFn = null, pickFn = null, timer = null, openedAt = 0, autoT = null; // autoT: 안내 칩이 읽을 시간 뒤에 저절로 넘어가는 시계
  const GUIDE_MS = n => Math.min(6000, 1400 + 45 * n); // 안내를 읽을 시간(글자 수에 따라 1.4~6초)

  // 실제 기록에 남은 말(대사에 quote: true)에만 '기록에 남은 말' 표시를 단다. 보통 대사에는 아무 표시도 없다
  function show(who, line = null) {
    const s = all[who] || NARR;
    clearTimeout(autoT); autoT = null;
    setMode(s.look ? null : who === 'guide' ? 'mode-chip' : 'mode-cap');
    setMeta(null, line?.year);
    whyEl.hidden = true;
    $('.dlg-name').textContent = s.name;
    const tag = $('.dlg-tag');
    tag.hidden = !(s.look && line && line.quote);
    tag.textContent = '기록에 남은 말';
    const pic = $('.dlg-portrait');
    if (s.look) {            // 사람: 만화풍 얼굴 그림
      pic.textContent = '';
      pic.style.backgroundColor = '';
      pic.style.backgroundImage = `url(${portraitURL(s.look, line?.expr || 'neutral')})`; // 대사에 expr(놀람·걱정 등, core/facebuild.js)이 있으면 그 표정으로
    } else {                 // 해설·안내: 글자 표시
      pic.style.backgroundImage = '';
      pic.textContent = s.mark;
      pic.style.backgroundColor = s.color;
    }
    el.hidden = false;
  }

  function say(line) {
    return new Promise(resolve => {
      const feedback = !!line.mood && el.classList.contains('mode-quiz') && !choicesEl.hidden; // 퀴즈 답 뒤 해설: 질문·보기 띠는 그대로 두고 아래 자막에 쓴다
      if (feedback) { const y = whyEl.querySelector('.dlg-year'); y.hidden = !line.year; y.textContent = line.year ? `${line.year}년` : ''; whyEl.hidden = false; el.hidden = false; }
      else show(line.who, line);
      const out = feedback ? whyEl.querySelector('.txt') : textEl;
      el.classList.toggle('dlg-right', line.mood === 'right'); // 퀴즈 맞음(색은 보통 대화창 그대로, 2026-10-30)
      el.classList.toggle('dlg-wrong', line.mood === 'wrong'); // 퀴즈 틀림: 분홍 바탕
      if (onSay) onSay(line);
      if (!feedback) { choicesEl.hidden = true; nextEl.hidden = false; } else nextEl.hidden = true;
      const chars = [...line.text];
      clearInterval(timer); timer = null;
      if (reduceMotion || typeMs <= 0) out.textContent = line.text;
      else {
        let i = 0; out.textContent = '';
        timer = setInterval(() => {
          i += 1; out.textContent = chars.slice(0, i).join('');
          if (i >= chars.length) { clearInterval(timer); timer = null; }
        }, typeMs);
      }
      advanceFn = () => {
        if (timer) { clearInterval(timer); timer = null; out.textContent = line.text; return; }
        advanceFn = null; clearTimeout(autoT); autoT = null; resolve();
      };
      // 안내 칩은 걸음을 멈추지 않는다(2026-11-09 선생님): 글이 다 나온 뒤 읽을 시간이 지나면 저절로 사라지고 넘어간다(눌러도 넘어간다)
      if (el.classList.contains('mode-chip') && !feedback) {
        const me = advanceFn, typing = (reduceMotion || typeMs <= 0) ? 0 : chars.length * typeMs;
        autoT = setTimeout(() => { autoT = null; if (advanceFn !== me) return; advanceFn = null; el.hidden = true; if (onClose) onClose(); resolve(); }, typing + GUIDE_MS(chars.length));
      }
    });
  }

  // off: 고를 수 없게 흐리게 막아 둘 선택지 번호(퀴즈에서 이미 틀린 답)
  // meta: { count: '문제 2/3', year } 질문 위에 붙는 칩(퀴즈)
  function choose(prompt, options, { off = [], meta = null } = {}) {
    return new Promise(resolve => {
      clearInterval(timer); timer = null; advanceFn = null;
      show(prompt.who);
      if (!(all[prompt.who] || NARR).look) setMode('mode-quiz'); // 해설·안내가 묻는 것은 가운데 질문 + 보기 띠
      setMeta(meta?.count, meta?.year);
      el.classList.remove('dlg-right', 'dlg-wrong');
      textEl.textContent = prompt.text;
      nextEl.hidden = true; choicesEl.hidden = false; choicesEl.innerHTML = '';
      openedAt = performance.now();
      options.forEach((text, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.innerHTML = '<span class="num"></span><span class="txt"></span>';
        b.querySelector('.num').textContent = String(i + 1);
        b.querySelector('.txt').textContent = text;
        if (off.includes(i)) { b.disabled = true; b.classList.add('off'); }
        let downAt = -1;
        b.addEventListener('pointerdown', () => { downAt = performance.now(); });
        b.addEventListener('click', e => {
          e.stopPropagation();
          // 손가락(마우스)으로 누른 클릭은 선택지가 뜬 뒤에 눌리기 시작한 것만 받는다.
          // 키보드 엔터처럼 포인터 없는 클릭(detail 0)은 열린 직후만 막는다.
          const pointerTap = e.detail > 0;
          if (pointerTap ? downAt < openedAt : performance.now() - openedAt < CLICK_GUARD_MS) return;
          dialogue.pick(i);
        });
        choicesEl.appendChild(b);
      });
      pickFn = i => { pickFn = null; [...choicesEl.children].forEach(b => { b.disabled = true; }); if (!el.classList.contains('mode-quiz')) choicesEl.hidden = true; resolve(i); }; // 띠 모양에서는 보기를 남겨 두고 ○×를 칠한다
    });
  }

  async function ask(choice) {
    let firstTry = true;
    for (;;) {
      const i = await choose(choice.prompt, choice.options.map(o => o.text));
      const opt = choice.options[i];
      choice.onPick?.(opt.correct); // 고른 순간 알림(고려 1장 기세 막대)
      if (opt.correct) {
        if (opt.reply) await say(opt.reply);
        return { firstTry };
      }
      firstTry = false;
      await dialogue.say({ who: choice.hintWho || 'narr', text: opt.hint || '다시 골라 보세요.' }); // hintWho: 힌트를 말하는 사람(없으면 해설)
    }
  }

  // 퀴즈: 틀리면 해설을 들려준 뒤, 틀린 답을 흐리게 막아 둔 채 같은 문제를 다시 내어 맞는 답을 고르게 한다.
  // correct는 처음에 맞혔는지(점수에 들어간다), tries는 고른 횟수.
  // meta: { index, total } 몇 번째 문제인지(질문 위 '문제 2/3')
  async function quiz(q, meta = null) {
    const off = [], count = meta?.total ? `문제 ${meta.index}/${meta.total}` : null;
    for (;;) {
      const text = off.length ? `해설을 떠올리며 다시 골라 봐요. ${q.question}` : q.question;
      const i = await choose({ who: 'narr', text }, q.options, { off, meta: { count, year: q.year } });
      mark(i, i === q.answer);
      if (i === q.answer) {
        await say({ who: 'narr', text: off.length ? `○ 맞았어요! 정답은 "${q.options[q.answer]}"이에요.` : `○ 맞았어요! ${q.explain}`, mood: 'right', year: q.year });
        return { correct: off.length === 0, tries: off.length + 1 };
      }
      off.push(i);
      await say({ who: 'narr', text: `× 아쉬워요. "${q.options[i]}"은(는) 답이 아니에요. ${q.explain}`, mood: 'wrong', year: q.year });
    }
  }

  // 고른 띠에 ○(초록)·×(빨강)를 칠한다. 맞으면 나머지는 흐리게(틀리면 다시 고르므로 정답은 알려 주지 않는다)
  function mark(i, right) {
    [...choicesEl.children].forEach((b, k) => { if (k === i) { b.classList.add(right ? 'right' : 'wrong'); b.querySelector('.num').textContent = right ? '○' : '×'; } else if (right) b.classList.add('dim'); });
  }

  const onKey = e => {
    if (!pickFn || !/^Digit[1-9]$/.test(e.code)) return;
    const i = Number(e.code.slice(5)) - 1;
    if (i < choicesEl.children.length) dialogue.pick(i);
  };
  window.addEventListener('keydown', onKey);
  el.addEventListener('click', () => { if (advanceFn) advanceFn(); });

  const dialogue = {
    say, choose, ask, quiz,
    advance() { if (advanceFn) advanceFn(); },
    pick(i) { if (pickFn && !choicesEl.children[i]?.disabled) pickFn(i); }, // 막아 둔(이미 틀린) 답은 고를 수 없다
    isOpen() { return !el.hidden && !el.classList.contains('mode-chip'); },
    isShowing() { return !el.hidden; }, // 안내 칩까지 포함해 무엇이든 보이는지(테스트·봇이 넘길 때) // 안내 칩은 '열린 대화'로 치지 않는다(걷기·말 걸기를 막지 않게)
    isChoosing() { return !!pickFn; },
    close() { clearInterval(timer); timer = null; clearTimeout(autoT); autoT = null; advanceFn = pickFn = null; el.hidden = true; if (onClose) onClose(); },
    dispose() { dialogue.close(); window.removeEventListener('keydown', onKey); el.remove(); },
  };
  return dialogue;
}
