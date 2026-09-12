#!/usr/bin/env node
// docs/lessons.js 하나에서 TUTORIAL.md(영어) / TUTORIAL.ko.md(한국어) 를 만든다.
// 레슨을 고쳤으면 이걸 돌려 문서를 맞춘다:   node tools/gen-tutorial.js
// 의존성 없음 — node 만 있으면 된다.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LESSONS = require(path.join(ROOT, 'docs', 'lessons.js'));
const PLAY = 'https://vpdrla.github.io/Venos/';

const T = {
  ko: {
    file: 'TUTORIAL.ko.md',
    title: '# Venos 배우기',
    langLine: '*[English](TUTORIAL.md) | 한국어*',
    intro:
      '설치 없이 브라우저에서 한 단계씩 따라 하는 Venos 입문서입니다. ' +
      '각 레슨의 **플레이그라운드에서 열기** 링크를 누르면 그 레슨의 코드가 바로 실행 가능한 상태로 열립니다.\n\n' +
      '변수와 함수 이름은 한국어로 지어도 됩니다. 반면 `if` / `for` / `while` / `func` / `class` 같은 키워드는 영어라서, ' +
      '여기서 배운 구조가 나중에 파이썬이나 C 로 그대로 이어집니다.',
    tocTitle: '## 목차',
    openIn: '▶ **[플레이그라운드에서 열기]',
    next: '## 다음은',
    nextBody:
      '- 전체 문법은 [언어 명세](VENOS_SPEC.md)에서 볼 수 있습니다.\n' +
      '- 더 큰 예제: [`examples/rpg.my`](examples/rpg.my) — 지금까지 배운 것만으로 만든 226줄짜리 텍스트 RPG입니다.\n' +
      '- 만든 프로그램은 플레이그라운드의 **🔗 Share** 버튼으로 링크를 만들어 친구나 선생님에게 보낼 수 있습니다.\n' +
      '- **다음 언어로 넘어갈 때**: 플레이그라운드의 **🐍 Python** 버튼(또는 `venos topython 파일.my`)을 누르면 '
      + '지금 짠 프로그램이 파이썬으로 어떻게 생겼는지 그대로 보여줍니다. 변수·함수 이름도 그대로 남습니다.',
    genNote: '<!-- 이 파일은 docs/lessons.js 에서 자동 생성됩니다. 직접 고치지 말고 `node tools/gen-tutorial.js` 를 쓰세요. -->'
  },
  en: {
    file: 'TUTORIAL.md',
    title: '# Learn Venos',
    langLine: '*English | [한국어](TUTORIAL.ko.md)*',
    intro:
      'A step-by-step introduction to Venos that runs in your browser — nothing to install. ' +
      'Each lesson has an **Open in the playground** link that loads that lesson ready to run.\n\n' +
      'Variable and function names may be written in Korean (or any language), while keywords like ' +
      '`if` / `for` / `while` / `func` / `class` stay English — so what you learn here carries straight over to Python or C.',
    tocTitle: '## Contents',
    openIn: '▶ **[Open in the playground]',
    next: '## Where to go next',
    nextBody:
      '- The full syntax lives in the [language spec](VENOS_SPEC.en.md).\n' +
      '- A bigger example: [`examples/rpg.en.my`](examples/rpg.en.my) — a 227-line text RPG built from what you just learned.\n' +
      '- Use the **🔗 Share** button in the playground to turn your program into a link you can send to a friend or teacher.\n' +
      '- **When you are ready for the next language**: the **🐍 Python** button (or `venos topython program.my`) '
      + 'rewrites what you just wrote as Python, keeping your own variable and function names.',
    genNote: '<!-- Generated from docs/lessons.js. Do not edit by hand — run `node tools/gen-tutorial.js`. -->'
  }
};

function build(lang) {
  const t = T[lang];
  const out = [t.genNote, '', t.title, '', t.langLine, '', t.intro, '', t.tocTitle, ''];

  LESSONS.forEach((l, i) => {
    const title = l.title[lang] || l.title.en;
    const anchor = `${i + 1}-${title.toLowerCase().replace(/[^\w가-힣]+/g, '-').replace(/^-|-$/g, '')}`;
    out.push(`${i + 1}. [${title}](#${anchor})`);
  });
  out.push('');

  LESSONS.forEach((l, i) => {
    const title = l.title[lang] || l.title.en;
    out.push('---', '');
    out.push(`## ${i + 1}. ${title}`, '');
    out.push(l.desc[lang] || l.desc.en, '');
    out.push('```', l.code[lang] || l.code.ko, '```', '');
    out.push(`${t.openIn}(${PLAY}#lesson=${l.id})**`, '');
  });

  out.push('---', '', t.next, '', t.nextBody, '');
  return out.join('\n');
}

for (const lang of ['ko', 'en']) {
  const dest = path.join(ROOT, T[lang].file);
  fs.writeFileSync(dest, build(lang));
  console.log(`생성: ${T[lang].file}  (레슨 ${LESSONS.length}개)`);
}
