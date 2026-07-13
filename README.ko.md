# MyLang

[![CI](https://github.com/Vpdrla/MyLang/actions/workflows/ci.yml/badge.svg)](https://github.com/Vpdrla/MyLang/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

*[English](README.md) | 한국어*

**▶ [브라우저에서 바로 써보기 — 설치 불필요](https://vpdrla.github.io/MyLang/)**

프로그래밍을 모르는 사람도 읽을 수 있게 설계한 의사코드(pseudocode) 스타일 프로그래밍 언어.
단일 C++ 파일(~3,400줄)에 **듀얼 백엔드 — 트리워킹 인터프리터 + C++ 트랜스파일러**(독립 실행 파일 생성)를 전부 구현했습니다.

```
func fib(n) {
    if n <= 2 then { return 1 }
    return fib(n - 1) + fib(n - 2)
}

for i = 1 to 10 {
    print "fib(" + i + ") =", fib(i)
}

try {
    let n = num(input "숫자 입력: ")
    print "10 /", n, "=", 10 / n
} catch 오류 {
    print "문제 발생:", 오류
}
```

식별자는 어떤 언어로든 쓸 수 있어서(완전한 UTF-8 지원) 클래스, 함수, 변수를
한국어로 자연스럽게 만들 수 있습니다:

```
class 사람 {
    func init(이름) { self.이름 = 이름 }
    func 인사() { print "안녕, 나는 " + self.이름 }
}
사람("성윤").인사()
```

## 특징

- **읽히는 문법** — `if x > 5 then { }`, `for i = 1 to 10`, `while x > 0 do { }`; 생략 가능한 채움 키워드(`then`, `do`) 덕분에 코드가 의사코드처럼 읽힘
- **두 가지 실행 방식** — 즉시 피드백용 인터프리터 + 트랜스파일러(`.my` → C++ → g++로 네이티브 실행 파일). 두 백엔드는 같은 프로그램에 같은 출력을 내도록 differential testing으로 검증
- **완전한 언어** — 함수(재귀, 호이스팅), 클래스(생성자, 메서드, `self`), 리스트/딕셔너리(참조 방식, `copy()` 깊은 복사), UTF-8 글자 단위 문자열, `try/catch`, `import`, 파일 입출력, 내장 함수 30개+
- **친절한 에러** — 줄 번호가 붙는 에러 메시지, `import` 사용 시 원본 파일 좌표 표시(`[utils.my 줄 3]`). 미정의 변수·잘못된 인자 개수는 빌드 시점에 잡아줌
- **내장 개발 환경** — 파일 관리, 에디터(방향키 스크롤 뷰어, 붙여넣기 모드), 원커맨드 실행/빌드가 되는 CLI 셸

## 플레이그라운드

[웹 플레이그라운드](https://vpdrla.github.io/MyLang/)는 WebAssembly로 인터프리터 전체를 브라우저에서 실행합니다 —
클래스, try/catch, 예제 RPG까지 전부 (input은 다이얼로그로 표시; `import`는 데스크톱 전용,
파일 입출력은 메모리에만 저장되어 새로고침 시 사라짐).

## 빌드

```bash
g++ -std=c++17 -O2 -o mylang mylang.cpp        # Linux / WSL
g++ -std=c++17 -O2 -o mylang.exe mylang.cpp    # Windows (MinGW)
```

의존성 없음. C++17 필요 (C++20 호환).

## 사용법

```bash
mylang                      # 대화형 셸 (create / code / run / build ...)
mylang 파일.my              # 파일 바로 실행 (인터프리터)
mylang build 파일.my        # 네이티브 실행 파일로 컴파일 (g++ 필요)
mylang build 파일.my run    # 컴파일 후 즉시 실행
```

셸에서 `repl` 을 입력하면 한 줄씩 실행하는 REPL이 시작됩니다 (식을 입력하면 값을 바로 표시).

전체 언어 명세: **[MYLANG_SPEC.md](MYLANG_SPEC.md)** (한국어) / **[MYLANG_SPEC.en.md](MYLANG_SPEC.en.md)** (English).
명세는 AI에게 그대로 건네주면 올바른 MyLang 코드를 짜줄 수 있게 작성되어 있습니다 (AI 바이브 코딩을 염두에 둔 설계).

## 에디터 지원

`vscode-mylang/` 폴더에 `.my` 파일 문법 강조를 지원하는 VS Code 확장이 들어 있습니다 —
폴더를 `~/.vscode/extensions/` 에 복사하면 됩니다 (폴더 안 README 참고).

## 예제

`examples/rpg.my` — 클래스, 딕셔너리, 파일 입출력 세이브/로드를 모두 활용하는 텍스트 RPG:

```bash
mylang examples/rpg.my
```

## 아키텍처

```
소스 → 렉서 (토큰) → 재귀 하강 파서 (AST) ─┬→ 트리워킹 인터프리터
                                          └→ C++ 코드 생성 → g++ → 네이티브 실행 파일
```

렉서, 파서, AST, 인터프리터, 트랜스파일러, 런타임 라이브러리, CLI 셸 — 전부 단일 파일 `mylang.cpp` 안에 있습니다.

## 만든 이유

프로그래밍 언어가 실제로 어떻게 동작하는지 이해하고 싶어서 바닥부터 만들었습니다.
변수와 `print`만 되는 v0.1 인터프리터에서 시작해, 실제 프로그램을 짜보고 부족한 걸
찾아 추가하는 방식으로 v1.5까지 왔습니다 — `examples/`의 텍스트 RPG가 `exists()`,
`try/catch`, `import` 같은 기능을 이끌어낸 검증 프로젝트입니다.

## 테스트

모든 언어 기능은 **differential testing**으로 검증합니다: `tests/cases/`의 각 프로그램을
두 백엔드(인터프리터와 트랜스파일된 네이티브 바이너리)로 실행해 출력이 일치해야 합니다.
CI가 푸시마다 자동 실행:

```bash
tests/run_tests.sh
```

## 라이선스

[MIT](LICENSE)
