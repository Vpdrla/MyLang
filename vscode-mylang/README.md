# MyLang for VS Code

`.my` 파일 문법 강조 (Syntax highlighting for MyLang).

## 설치 (Install)

마켓플레이스 없이 폴더 복사만으로 설치됩니다:

```bash
# Linux / macOS
cp -r vscode-mylang ~/.vscode/extensions/mylang-1.6.0

# Windows (PowerShell)
Copy-Item -Recurse vscode-mylang $env:USERPROFILE\.vscode\extensions\mylang-1.6.0
```

VS Code를 재시작하면 `.my` 파일에 자동 적용됩니다.

## 지원 (What you get)

- 키워드 강조: `let` `func` `class` `if` `else` `while` `for` `try` `catch` 등 23개
- 내장 함수 32개 (`random`, `push`, `split`, `readfile`, ...)
- 문자열(이스케이프 포함)·숫자·주석(`#`)·연산자
- `#` 줄 주석 토글(Ctrl+/), 괄호·따옴표 자동 닫기
