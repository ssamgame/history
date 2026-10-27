// 화면 아래 한지 대화창: 한 글자씩 나타나는 대사, 선택지, 다시 고르기, 퀴즈.
import { portraitURL } from './faces.js';

const NARR = { name: '해설', mark: '史', color: '#5a5248' };
const CLICK_GUARD_MS = 250; // 선택지가 열린 직후의 탭은 앞 대사를 넘기려던 탭이므로 무시

// onSay(line): 대사가 나올 때마다 부른다
export function createDialogue(root, speakers, { typeMs = 26, reduceMotion = false, onSay = null } = {}) {
  const all = { narr: NARR, ...speakers };
  const el = document.createElement('div');
  el.className = 'dlg';
  el.hidden = true;
  el.innerHTML = '<div class="dlg-portrait"></div><div class="dlg-name"></div><div class="dlg-tag" hidden></div><div class="dlg-text"></div><div class="dlg-next">눌러서 계속 ▸</div><div class="dlg-choices" hidden></div>';
  root.appendChild(el);
  const $ = s => el.querySelector(s);
  const textEl = $('.dlg-text'), nextEl = $('.dlg-next'), choicesEl = $('.dlg-choices');

  let advanceFn = null, pickFn = null, timer = null, openedAt = 0;

  // 실제 기록에 남은 말(대사에 quote: true)에만 '기록에 남은 말' 표시를 단다. 보통 대사에는 아무 표시도 없다
  function show(who, line = null) {
    const s = all[who] || NARR;
    $('.dlg-name').textContent = s.name;
    const tag = $('.dlg-tag');
    tag.hidden = !(s.look && line && line.quote);
    tag.textContent = '기록에 남은 말';
    const pic = $('.dlg-portrait');
    if (s.look) {            // 사람: 만화풍 얼굴 그림
      pic.textContent = '';
      pic.style.backgroundColor = '';
      pic.style.backgroundImage = `url(${portraitURL(s.look)})`;
    } else {                 // 해설·안내: 글자 표시
      pic.style.backgroundImage = '';
      pic.textContent = s.mark;
      pic.style.backgroundColor = s.color;
    }
    el.hidden = false;
  }

  function say(line) {
    return new Promise(resolve => {
      show(line.who, line);
      if (onSay) onSay(line);
      choicesEl.hidden = true; nextEl.hidden = false;
      const chars = [...line.text];
      clearInterval(timer); timer = null;
      if (reduceMotion || typeMs <= 0) textEl.textContent = line.text;
      else {
        let i = 0; textEl.textContent = '';
        timer = setInterval(() => {
          i += 1; textEl.textContent = chars.slice(0, i).join('');
          if (i >= chars.length) { clearInterval(timer); timer = null; }
        }, typeMs);
      }
      advanceFn = () => {
        if (timer) { clearInterval(timer); timer = null; textEl.textContent = line.text; return; }
        advanceFn = null; resolve();
      };
    });
  }

  // off: 고를 수 없게 흐리게 막아 둘 선택지 번호(퀴즈에서 이미 틀린 답)
  function choose(prompt, options, { off = [] } = {}) {
    return new Promise(resolve => {
      clearInterval(timer); timer = null; advanceFn = null;
      show(prompt.who);
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
      pickFn = i => { pickFn = null; choicesEl.hidden = true; resolve(i); };
    });
  }

  async function ask(choice) {
    let firstTry = true;
    for (;;) {
      const i = await choose(choice.prompt, choice.options.map(o => o.text));
      const opt = choice.options[i];
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
  async function quiz(q) {
    const off = [];
    for (;;) {
      const text = off.length ? `해설을 떠올리며 다시 골라 봐요. ${q.question}` : q.question;
      const i = await choose({ who: 'narr', text }, q.options, { off });
      if (i === q.answer) {
        await say({ who: 'narr', text: off.length ? `○ 맞았어요! 정답은 "${q.options[q.answer]}"이에요.` : `○ 맞았어요! ${q.explain}` });
        return { correct: off.length === 0, tries: off.length + 1 };
      }
      off.push(i);
      await say({ who: 'narr', text: `× 아쉬워요. "${q.options[i]}"은(는) 답이 아니에요. ${q.explain}` });
    }
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
    isOpen() { return !el.hidden; },
    isChoosing() { return !!pickFn; },
    close() { clearInterval(timer); timer = null; advanceFn = pickFn = null; el.hidden = true; },
    dispose() { dialogue.close(); window.removeEventListener('keydown', onKey); el.remove(); },
  };
  return dialogue;
}
