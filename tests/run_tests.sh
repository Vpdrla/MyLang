#!/usr/bin/env bash
# Venos differential 테스트 러너
# 각 tests/cases/*.my 를 ①인터프리터 ②트랜스파일 빌드본 으로 실행해 출력이 일치하는지 비교한다.
# 알려진 허용 차이는 정규화로 흡수:
#   - 인터프리터 전용 배너 ("=== 실행: ... ===", "=== 정상 종료 ===")
#   - catch 변수 에러 메시지의 "[줄 N]" / "[파일 줄 N]" 접두사 (인터프리터만 포함)
set -u
cd "$(dirname "$0")/.."   # 저장소 루트에서 실행

VENOS=./venos
TMP=$(mktemp -d)
cleanup() { rm -rf "$TMP" tests/.tmp_* ; }
trap cleanup EXIT

if [ ! -x "$VENOS" ] || [ venos.cpp -nt "$VENOS" ]; then
    echo "venos 빌드 중..."
    g++ -std=c++17 -O2 -o venos venos.cpp || { echo "빌드 실패"; exit 1; }
fi

normalize() {
    grep -v '^=== ' "$1" | sed 's/\[[^]]*줄 [0-9]\{1,\}\] //g'
}

pass=0; fail=0
for case_file in tests/cases/*.my; do
    name=$(basename "$case_file" .my)
    input="tests/cases/$name.input"
    [ -f "$input" ] || input=/dev/null

    rm -f tests/.tmp_*
    "$VENOS" "$case_file" < "$input" > "$TMP/interp.txt" 2>&1

    if ! "$VENOS" build "$case_file" > "$TMP/build.txt" 2>&1; then
        echo "FAIL  $name  (빌드 명령 실패)"; cat "$TMP/build.txt"
        fail=$((fail+1)); continue
    fi
    bin="tests/cases/$name"
    if [ ! -x "$bin" ]; then
        echo "FAIL  $name  (실행 파일이 생성되지 않음)"; cat "$TMP/build.txt"
        fail=$((fail+1)); continue
    fi
    rm -f tests/.tmp_*
    "./$bin" < "$input" > "$TMP/compiled.txt" 2>&1
    rm -f "$bin" "tests/cases/$name.cpp"

    if diff <(normalize "$TMP/interp.txt") <(normalize "$TMP/compiled.txt") > "$TMP/diff.txt" 2>&1; then
        echo "PASS  $name"
        pass=$((pass+1))
    else
        echo "FAIL  $name  (인터프리터/빌드본 출력 불일치)"
        cat "$TMP/diff.txt"
        fail=$((fail+1))
    fi
done

echo
echo "결과: 통과 $pass / 실패 $fail"
[ "$fail" -eq 0 ]
