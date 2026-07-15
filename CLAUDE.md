# Venos — Claude Code 작업 가이드

자작 프로그래밍 언어 Venos의 저장소. 사용자(중학생)와 Claude가 claude.ai 대화로 v0.1부터 여기까지 만들었고, 이후 작업은 Claude Code로 진행.

## 대화 규칙
- **한국어로 대화한다.** 간결하고 직설적으로 — 장황한 설명, 과한 칭찬, 불필요한 확인 질문 금지.
- GitHub 공개 문서(README, 프로젝트 설명)는 **영어**로 쓰고, 한국어 번역본(`README.ko.md`)을 별도로 둔다.
- 코드 주석과 에러 메시지는 한국어 (언어 자체가 한국어 사용자 대상).

## 프로젝트 개요
- **단일 파일 `venos.cpp` (~3,400줄)** 안에 전부 들어 있음: 렉서 → 재귀 하강 파서 → AST → ①트리워킹 인터프리터 ②C++ 트랜스파일러(`build` 명령, g++ 호출) ③CLI 셸 ④REPL ⑤WASM 진입점.
- 언어 스펙: `VENOS_SPEC.md`(한국어) / `VENOS_SPEC.en.md`(영어) — **기능 추가 시 두 문서 모두 갱신**.
- 검증 프로젝트: `examples/rpg.my` (222줄 텍스트 RPG).
- 웹 플레이그라운드: `docs/` (index.html + venos.js + venos.wasm) → GitHub Pages.
- VSCode 확장: `vscode-venos/` — 새 키워드/내장함수 추가 시 tmLanguage도 갱신.

## 빌드/테스트 명령
```bash
# 네이티브 (필수 통과: C++17과 C++20 둘 다)
g++ -std=c++17 -O2 -Wall -o venos venos.cpp
g++ -std=c++20 -O2 -fsyntax-only venos.cpp

# 실행
./venos 파일.my              # 인터프리터
./venos build 파일.my run    # 트랜스파일 → g++ → 실행

# WASM (플레이그라운드 갱신 시)
emcc -O2 -std=c++17 -fexceptions -DVENOS_WASM venos.cpp -o docs/venos.js \
  -s EXPORTED_FUNCTIONS=_venos_run,_malloc,_free -s EXPORTED_RUNTIME_METHODS=ccall \
  -s DISABLE_EXCEPTION_CATCHING=0 -s ALLOW_MEMORY_GROWTH=1 \
  -s TOTAL_STACK=33554432 -s INITIAL_MEMORY=67108864 \
  -s MODULARIZE=1 -s EXPORT_NAME=createVenos -s ENVIRONMENT=web
```

## 철칙: 듀얼 백엔드 동시 구현 + diff 검증
언어 기능을 추가/수정하면 **반드시 인터프리터와 트랜스파일러(RUNTIME 문자열 + CodeGen) 양쪽에 구현**하고, 같은 프로그램을 두 방식으로 실행해 출력을 diff로 비교한다 (differential testing — 지금까지 코드젠 버그를 여러 개 잡아준 핵심 검증법).

**자동화됨**: `tests/run_tests.sh` 가 `tests/cases/*.my` 전체를 양쪽으로 실행해 비교하고, CI(`.github/workflows/ci.yml`)가 푸시마다 돌린다. 허용 차이(인터프리터 전용 `=== ===` 배너, catch 메시지의 `[줄 N]` 접두사)는 러너가 정규화로 흡수.
```bash
tests/run_tests.sh   # 전체 스위트 (C++17 빌드 → 케이스별 인터프리터 vs 빌드본 diff)
```
- **기능 추가 시 테스트 케이스도 추가할 것.** 에러 케이스는 try/catch 로 잡아 출력으로 만들어 비교 (에러 문구도 양쪽 동일해야 함 — v1.5에서 산술 연산 문구 통일함).
- 케이스에 random()/time() 사용 금지 (비결정적이라 diff 불가).

## 아키텍처 요점
- `Value`: NUM/STR/LIST/MAP/OBJ. 리스트/딕셔너리/객체는 shared_ptr 참조 방식, `copy()`가 깊은 복사(순환 감지). 문자열 불변, UTF-8 글자 단위 인덱싱. **리스트 인덱스는 1부터.**
- 제어 흐름 = C++ 예외 (BreakSignal/ContinueSignal/ReturnSignal/ExitSignal) — try/catch(LangError)를 **통과**해야 함.
- 에러 메시지는 `lineTag(line)` 사용 (직접 "[줄 N]" 문자열 만들지 말 것) — import 병합 시 원본 파일 좌표(`[utils.my 줄 3]`)로 자동 변환됨 (`g_lineMap`). 에러 밑에 해당 코드 줄 표시는 `printError()` + `g_srcLines`.
- 실행은 `runOnBigStack`(128MB 전용 스택 스레드) 경유 — 재귀 한도(2000) 전에 세그폴트 방지. WASM에선 스레드 없이 직접 실행(링크 시 TOTAL_STACK 32MB).
- 트랜스파일러: 메서드는 클래스별 정적 함수 `m_클래스_메서드` + (이름,인자수)별 디스패처(수제 vtable). 식별자 맹글링 u_/f_ + non-ASCII hex. 대입 좌변은 접근자 체인(idx_mid/idx_put/fld_mid/fld_put).
- `import`는 파싱 전 텍스트 병합 (`expandImports`, 중복 자동 스킵).

## 지뢰밭 (이미 밟고 고친 것들 — 재발 금지)
- windows.h가 `IN`/`OUT`을 빈 매크로로 정의 → enum은 `Tok::INKW`, include 뒤 `#undef IN/OUT` + `#ifndef NOMINMAX` 가드 유지 (본체와 RUNTIME 문자열 양쪽).
- Windows 콘솔 한글: 셸은 ReadConsoleW, **생성 exe의 RUNTIME에도 동일 로직(rt_readline) 이식돼 있음** — input 관련 수정 시 양쪽 유지.
- Emscripten은 기본으로 C++ 예외 catch 비활성 → WASM 빌드에 `-fexceptions -s DISABLE_EXCEPTION_CATCHING=0` 필수 (없으면 return/break가 전부 죽음).
- 화면 클리어는 `\033[2J\033[3J\033[H` (3J = 스크롤백까지).
- u8string은 C++17/20 타입이 달라서 바이트 복사로 처리 중.

## 현재 상태 & 남은 작업
언어 v1.6 완성 (변수/함수/클래스/리스트/딕셔너리/try-catch/import/copy/파일IO/REPL/CLI/에러 줄표시/문자열 보간/리스트 ==·+). 저장소: github.com/Vpdrla/Venos

- [x] `docs/` 3개 파일 업로드 — **Pages 설정은 사용자가 직접**: Settings→Pages→main `/docs` → https://vpdrla.github.io/Venos/ 확인
- [x] LICENSE 추가 (MIT)
- [x] 테스트 스위트 + CI (tests/run_tests.sh + GitHub Actions)
- [x] VENOS_SPEC.en.md, README.ko.md, examples/rpg.my, vscode-venos/ 추가 (README 깨진 링크 해소)
- [x] README 데모 (GIF — RPG 플레이 → build 26초, docs/demo.gif, 한글 2칸 폭 렌더러로 제작)
- [ ] 개발기 블로그 초안 (소재: IN 매크로 사건, 세그폴트→128MB 스택, diff 테스팅, WASM -fexceptions)
- [ ] 커뮤니티 공유: r/ProgrammingLanguages → Show HN → 국내 (플레이그라운드 완성 후)
- [x] 문자열 보간 `"이름: {x}"`, 리스트 `==`(깊은 비교)/`+`(연결) — v1.6
- [ ] 다음 언어 기능 후보 (사용자와 상의 후): 일급 함수, 상속, 음수 인덱스/슬라이스
- [x] 리네임: MyLang → **Venos** (문서/배너/바이너리/확장 일괄 치환 완료. 저장소 rename(Settings→Rename→Venos)은 사용자가 직접 — 하기 전까지 README 링크·Pages URL은 새 주소 기준이라 404)
