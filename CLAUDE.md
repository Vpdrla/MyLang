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
- 웹 플레이그라운드: `docs/` (index.html + venos.js + venos.wasm) → GitHub Pages. 공유 링크(`#code=`), 자동 저장, 레슨 트랙(`#lesson=`) 포함.
- 튜토리얼: **`docs/lessons.js` 가 단일 진실 공급원**. 레슨을 고쳤으면 `node tools/gen-tutorial.js` 로 `TUTORIAL.md`/`TUTORIAL.ko.md` 를 다시 생성할 것 (직접 편집 금지).
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

## 릴리스 내는 법
버전을 올렸으면 태그만 밀면 된다. `.github/workflows/release.yml` 이 세 플랫폼 바이너리를 만들어 GitHub Releases 에 올린다.
```bash
git tag v0.6.0 && git push origin v0.6.0
```
- Linux/Windows 는 ubuntu 러너 한 곳에서 (Windows 는 MinGW 크로스 컴파일), macOS 는 전용 러너에서 유니버설(arm64+x86_64)로 빌드.
- 전부 정적 링크 → 받는 사람은 설치할 게 없음. 릴리스로 나가는 바로 그 바이너리로 differential 스위트를 돌려 검증한다 (Linux·macOS 는 스위트까지, Windows exe 는 아직 빌드만).
- **태그를 못 밀 때는 Actions → Release → Run workflow 에서 `tag` 칸에 `v0.6.0` 을 넣으면** 그 이름으로 태그를 만들고 릴리스까지 낸다. `tag` 를 비우면 빌드·테스트만 하고 릴리스는 안 만든다 (시험 실행).
- `release` 잡은 게시 직전에 **업로드되는 Linux 바이너리를 실제로 한 번 실행**해 본다 (빌드 잡의 스위트는 스테이징 전에 돌기 때문에 아티팩트 왕복 이후는 여기서만 검증된다).
- MinGW 는 메타패키지(`g++-mingw-w64-x86-64`) 말고 **`g++-mingw-w64-x86-64-posix` 하나만** 설치한다 — 메타패키지가 posix/win32 스레딩 변종을 둘 다 끌어와 144MB 를 받기 때문. venos.cpp 는 `_beginthreadex`(Win32 API)만 쓰고 `std::thread` 는 안 써서 변종은 무관하다. 빌드도 `x86_64-w64-mingw32-g++-posix` 로 이름을 명시해 부른다.
- **버전 문자열은 여러 곳에 하드코딩돼 있다** — 태그 전에 같이 고칠 것: `venos.cpp` 헤더 주석과 셸 배너, `VENOS_SPEC.md`/`.en.md` 제목, `vscode-venos/package.json`, README 2종.
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
현재 v0.6.0 (변수/함수/클래스/리스트/딕셔너리/try-catch/import/copy/파일IO/REPL/CLI/에러 줄표시/문자열 보간/리스트 ==·+). 저장소: github.com/Vpdrla/Venos

**버전 정책 — 임의로 올리지 말 것.** 0.x 는 "아직 안정화 전"이라는 뜻이고, **정식으로 완성됐다고 판단될 때 1.0.0** 을 붙인다 (사용자가 직접 결정). 그 전까지 기능을 추가해도 버전은 그대로 두고, 급한 버그 수정이 필요할 때만 자리수(0.6.1)를 올린다.

- [x] `docs/` 3개 파일 업로드 — **Pages 설정은 사용자가 직접**: Settings→Pages→main `/docs` → https://vpdrla.github.io/Venos/ 확인
- [x] LICENSE 추가 (MIT)
- [x] 테스트 스위트 + CI (tests/run_tests.sh + GitHub Actions)
- [x] VENOS_SPEC.en.md, README.ko.md, examples/rpg.my, vscode-venos/ 추가 (README 깨진 링크 해소)
- [x] README 데모 (GIF — RPG 플레이 → build 26초, docs/demo.gif, 한글 2칸 폭 렌더러로 제작)
- [x] 교육용 1라운드: 플레이그라운드 공유 링크·자동 저장·WASM 로드 실패 처리 + 12단계 레슨 트랙 + TUTORIAL 자동 생성
- [ ] 개발기 블로그 초안 (소재: IN 매크로 사건, 세그폴트→128MB 스택, diff 테스팅, WASM -fexceptions)
- [ ] 커뮤니티 공유: r/ProgrammingLanguages → Show HN → 국내 (플레이그라운드 완성 후)
- [x] 릴리스 자동화 (`.github/workflows/release.yml`) — Linux/Windows/macOS 정적 바이너리 → GitHub Releases. **첫 릴리스 v0.6.0 게시됨** (https://github.com/Vpdrla/Venos/releases/tag/v0.6.0, 태그는 `1ca77d3`, 자산 4개, 전체 런 69초)
- [ ] `input` 의 `window.prompt()` 모달 제거 (RPG가 수십 번 띄움 — Asyncify 또는 Worker 필요)
- [ ] 에러 메시지에 오타 제안 ("정의되지 않은 변수: 이릅" → "혹시 '이름'?")
- [ ] `docs/venos.js`·`venos.wasm` 을 CI에서 빌드 (현재 커밋된 수동 빌드본이라 소스와 어긋날 수 있음)
- [ ] Windows 네이티브 CI 잡 — macOS 는 release.yml 에서 유니버설 빌드 + 스위트까지 돌지만, Windows exe 는 크로스 컴파일로 **빌드만** 되고 한 번도 실행되지 않는다 (ReadConsoleW·`IN`/`OUT` 매크로 회피·`_beginthreadex` 가 런타임 미검증). `windows-latest` 에서 스위트를 돌리려면 Git Bash·CRLF·콘솔 한글 인코딩부터 확인해야 함
- [x] 문자열 보간 `"이름: {x}"`, 리스트 `==`(깊은 비교)/`+`(연결) — v0.6.0
- [ ] 다음 언어 기능 후보 (사용자와 상의 후): 일급 함수, 상속, 음수 인덱스/슬라이스
- [x] 리네임: MyLang → **Venos** (문서/배너/바이너리/확장 일괄 치환 완료. 저장소 rename(Settings→Rename→Venos)은 사용자가 직접 — 하기 전까지 README 링크·Pages URL은 새 주소 기준이라 404)
