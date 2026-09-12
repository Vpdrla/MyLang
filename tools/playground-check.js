#!/usr/bin/env node
// 플레이그라운드(docs/)를 진짜 브라우저로 열어 확인하는 스크립트.
//
//   node tools/playground-check.js          # 지금 브라우저 그대로
//   node tools/playground-check.js --future # "미래 Chrome" 흉내 (아래 설명)
//
// 왜 흉내가 필요한가:
//   emscripten 은 16바이트가 넘는 문자열만 TextDecoder.decode(HEAPU8.subarray(...)) 로 푼다.
//   최신 Chrome 은 성장 가능한 wasm 힙을 resizable ArrayBuffer 로 주는데 TextDecoder 는 그런
//   버퍼를 거부한다 → 긴 input 프롬프트에서 다음 에러로 죽는다:
//     TypeError: Failed to execute 'decode' on 'TextDecoder':
//               The provided ArrayBuffer value must not be resizable
//   이 조건은 브라우저 버전에 달려 있어서 손으로 만들 수 없다. --future 는 wasm 힙(64MB 이상
//   버퍼) 위의 뷰가 들어오면 같은 TypeError 를 던지도록 TextDecoder 를 감싸 그 상황을 재현한다.
//   EM_JS 에서 힙 문자열을 만질 때는 이걸 꼭 통과시킬 것.
//
// CI 에는 넣지 않았다 (러너에 Playwright 가 없다). 플레이그라운드나 WASM 을 건드렸으면 손으로 돌린다.

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');
const FUTURE = process.argv.includes('--future');
const PORT = 8731;

function loadPlaywright() {
  for (const c of ['playwright', '/opt/node22/lib/node_modules/playwright']) {
    try { return require(c); } catch (e) { /* 다음 후보 */ }
  }
  console.error('playwright 를 찾을 수 없습니다.  npm i -g playwright  후 다시 실행하세요.');
  process.exit(2);
}

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.wasm': 'application/wasm', '.gif': 'image/gif',
};
function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const rel = decodeURIComponent(req.url.split('?')[0]);
      const file = path.join(DOCS, rel === '/' ? 'index.html' : rel);
      if (!file.startsWith(DOCS) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404); res.end('not found'); return;
      }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    srv.listen(PORT, '127.0.0.1', () => resolve(srv));
  });
}

// 실제로 학생이 밟는 경로들. 프롬프트 길이가 16바이트를 넘는 것들이 위험 구간이다.
const LESSONS = require(path.join(DOCS, 'lessons.js'));
const lesson = (id, lang) => {
  const c = LESSONS.find(l => l.id === id).code;
  return c[lang || 'ko'] || c.ko;
};

const CHECKS = [
  { name: '짧은 프롬프트 (16바이트 이하)', code: 'let x = input "> "\nprint "got", x\n',
    answer: '미르', expect: 'got 미르' },
  { name: '긴 프롬프트 (영문 28바이트)', code: 'let x = input "What is your hero\'s name? > "\nprint "got", x\n',
    answer: 'Mir', expect: 'got Mir' },
  { name: '긴 프롬프트 (한글 21바이트)', code: 'let x = input "이름이 뭐예요? "\nprint "got", x\n',
    answer: '미르', expect: 'got 미르' },
  { name: '레슨 3 (input)', code: lesson('input'), answer: '미르', expect: '미르님' },
  { name: '긴 출력 · 보간', code: 'let a = "열여섯 바이트를 훌쩍 넘는 아주 긴 한글 문자열입니다"\nprint "값: {a}"\n',
    expect: '값: 열여섯' },
  { name: '레슨 10 (classes) 실행', code: lesson('classes'), expect: '멍멍' },
];

(async () => {
  const { chromium } = loadPlaywright();
  const srv = await serve();
  const exe = process.env.PLAYWRIGHT_CHROMIUM
           || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const browser = await chromium.launch(fs.existsSync(exe) ? { executablePath: exe } : {});
  const page = await browser.newPage();

  if (FUTURE) {
    await page.addInitScript(() => {
      const orig = TextDecoder.prototype.decode;
      TextDecoder.prototype.decode = function (input, opts) {
        if (input && input.buffer && input.buffer.byteLength >= 64 * 1024 * 1024) {
          throw new TypeError("Failed to execute 'decode' on 'TextDecoder': " +
                              'The provided ArrayBuffer value must not be resizable');
        }
        return orig.call(this, input, opts);
      };
    });
  }

  const jsErrors = [];
  page.on('pageerror', e => jsErrors.push(String(e.message)));
  page.on('console', m => { if (m.type() === 'error') jsErrors.push(m.text()); });

  let pending = null;
  page.on('dialog', async d => { await d.accept(pending ?? ''); });

  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#runBtn:not([disabled])', { timeout: 60000 });

  console.log(`플레이그라운드 확인${FUTURE ? '  [--future: 미래 Chrome 흉내]' : ''}\n`);
  let bad = 0;

  const runAndRead = async (sel) => {
    await page.click(sel);
    await page.waitForFunction(() => {
      const t = document.querySelector('#output').textContent;
      return t.includes('=== done ===') || t.includes('!!') || t.includes('print(');
    }, { timeout: 30000 }).catch(() => {});
    return (await page.$eval('#output', e => e.textContent)).trim();
  };

  for (const c of CHECKS) {
    pending = c.answer ?? '';
    await page.fill('#editor', c.code);
    const out = await runAndRead('#runBtn');
    const ok = out.includes(c.expect) && !out.includes('!!');
    if (!ok) { bad++; console.log(`✗ ${c.name}`); console.log('   ' + out.split('\n').join('\n   ')); }
    else console.log(`✓ ${c.name}`);
  }

  // 🐍 Python 버튼도 같은 조건에서 도는지
  await page.fill('#editor', 'let 이름 = "미르"\nprint "안녕, {이름}! 반가워요 정말로"\n');
  const py = await runAndRead('#pyBtn');
  if (py.includes('print(f"') && !py.includes('!!')) console.log('✓ 🐍 Python 버튼');
  else { bad++; console.log('✗ 🐍 Python 버튼'); console.log('   ' + py.split('\n').join('\n   ')); }

  // 앞 실행이 죽어도 다음 실행 첫 줄이 깨끗한가 (개행 없는 프롬프트 찌꺼기)
  await page.fill('#editor', 'let x = input "이름이 뭐예요? "\nprint x\n');
  await runAndRead('#runBtn');
  await page.fill('#editor', 'print "첫 줄"\n');
  const after = await runAndRead('#runBtn');
  if (after.split('\n')[0].trim() === '첫 줄') console.log('✓ 이전 실행 찌꺼기 없음');
  else { bad++; console.log('✗ 이전 실행 찌꺼기가 첫 줄에 붙음'); console.log('   ' + after.split('\n')[0]); }

  // 레슨 언어 토글이 코드까지 바꾸는가 (손대지 않은 시작 코드일 때만)
  const lists = LESSONS.find(l => l.id === 'lists').code;
  // 해시만 바꾸면 문서가 다시 로드되지 않아 boot() 가 안 돈다 → 쿼리를 붙여 새로 연다
  await page.goto(`http://127.0.0.1:${PORT}/?lessoncheck=1#lesson=lists`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelector('#editor').value.includes('push('), { timeout: 20000 });
  const before = await page.$eval('#editor', e => e.value);
  await page.click('#lessonLang');
  await page.waitForTimeout(300);
  const afterCode = await page.$eval('#editor', e => e.value);
  const pair = [lists.ko.trim(), lists.en.trim()];
  if (before.trim() !== afterCode.trim()
      && pair.includes(before.trim()) && pair.includes(afterCode.trim())) {
    console.log('✓ 레슨 언어 토글이 코드까지 바꿈');
  } else {
    bad++;
    console.log('✗ 레슨 언어 토글이 코드를 안 바꿈');
    console.log('   before: ' + before.split('\n')[0]);
    console.log('   after : ' + afterCode.split('\n')[0]);
  }

  if (jsErrors.length) { bad++; console.log('\n✗ JS 에러:\n   ' + jsErrors.join('\n   ')); }
  else console.log('✓ JS 에러 없음');

  await browser.close();
  srv.close();
  console.log(bad ? `\n실패 ${bad}건` : '\n전부 통과');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('하네스 자체가 실패:', e); process.exit(2); });
