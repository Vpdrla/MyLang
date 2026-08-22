<!-- Generated from docs/lessons.js. Do not edit by hand — run `node tools/gen-tutorial.js`. -->

# Learn Venos

*English | [한국어](TUTORIAL.ko.md)*

A step-by-step introduction to Venos that runs in your browser — nothing to install. Each lesson has an **Open in the playground** link that loads that lesson ready to run.

Variable and function names may be written in Korean (or any language), while keywords like `if` / `for` / `while` / `func` / `class` stay English — so what you learn here carries straight over to Python or C.

## Contents

1. [Printing](#1-printing)
2. [Variables](#2-variables)
3. [Input and string interpolation](#3-input-and-string-interpolation)
4. [Conditions](#4-conditions)
5. [Repeating with for](#5-repeating-with-for)
6. [Repeating with while](#6-repeating-with-while)
7. [Lists](#7-lists)
8. [Dictionaries](#8-dictionaries)
9. [Functions](#9-functions)
10. [Classes](#10-classes)
11. [Handling errors](#11-handling-errors)
12. [Mini project: number guessing](#12-mini-project-number-guessing)

---

## 1. Printing

`print` shows a value on screen. Separate several values with commas to put them on one line. Anything after `#` is a comment and is not run.

Press ▶ Run, then change the text inside the quotes and run it again.

```
# first Venos program
print "Hello!"
print "Hi :)"

# print multiple values with commas
print "1 + 2 =", 1 + 2
```

▶ **[Open in the playground](https://vpdrla.github.io/Venos/#lesson=print)**

---

## 2. Variables

Create a variable with `let`. **Names can be written in Korean** (or any language).

Once created, assign to it without `let`, and use `+=` to add to it.

Try changing `나이` (age) and running it again.
이름 means 'name', and 미르 is a name.

```
let 이름 = "미르"
let 나이 = 15

print 이름
print 나이

나이 += 1          # age + 1
print "내년 나이:", 나이
```

▶ **[Open in the playground](https://vpdrla.github.io/Venos/#lesson=variables)**

---

## 3. Input and string interpolation

`input` asks the user for a value — in the playground a small dialog appears.

Inside a string, `{ }` inserts the value in it. That is **string interpolation**, and it reads better than joining with `+`.

Run it and type any name into the dialog.

```
let name = input "What is your name? "
let age = 15

print "Hello, {name}!"
print "{name} becomes {age + 1} next year."
```

▶ **[Open in the playground](https://vpdrla.github.io/Venos/#lesson=input)**

---

## 4. Conditions

`if` runs the block only when the condition is true; otherwise it falls through to `else if`, then `else`.

`then` is optional — it is there only to make the line read like a sentence.

Change `score` and see how the grade changes.

```
let score = 85

if score >= 90 then {
    print "grade A"
} else if 점수 >= 80 {
    print "grade B"
} else {
    print "Better Next Time!"
}

print "The score is {score}"
```

▶ **[Open in the playground](https://vpdrla.github.io/Venos/#lesson=if)**

---

## 5. Repeating with for

`for i = 1 to 5` repeats from 1 to 5, **including both ends**.

Use `step` to skip, and a negative step to count down.

Change the numbers to print a different multiplication table.

```
# 3 times table
for i = 1 to 9 {
    print "3 x {i} = {3 * i}"
}

print ""
# backwards
for i = 5 to 1 step -1 {
    print i
}
print "end!"
```

▶ **[Open in the playground](https://vpdrla.github.io/Venos/#lesson=for)**

---

## 6. Repeating with while

`while` keeps repeating **as long as** the condition is true — use it when you do not know the count in advance.

`break` leaves the loop immediately. Make sure the condition eventually becomes false, or the loop never ends.

Change `money left` and see how many you can buy.

```
let moneyleft = 50
let price = 15
let count = 0

while moneyleft >= price do {
    moneyleft -= price
    count += 1
}

print "I bought {count} and I got {price} dollars left."
```

▶ **[Open in the playground](https://vpdrla.github.io/Venos/#lesson=while)**

---

## 7. Lists

A list holds values in order. **Indices start at 1**, not 0!

`push` appends, `len` counts, and `for ... in` walks through the items.

Try adding more fruit to the list.

```
let fruit = ["사과", "바나나", "포도"]

print "첫 번째:", 과일[1]      # 1번부터!
print "개수:", len(과일)

push(과일, "딸기")

for 하나 in 과일 {
    print "-", 하나
}
```

▶ **[Open in the playground](https://vpdrla.github.io/Venos/#lesson=lists)**

---

## 8. Dictionaries

A dictionary looks values up by a **key**, and keys are always strings.

Reading a missing key is an error, so get into the habit of checking with `has` first.

Try adding more subjects and scores.

```
let 성적 = {"수학": 90, "영어": 85}

성적["과학"] = 95        # 새 키는 넣으면 생김
성적["수학"] += 5

for 과목 in 성적 {
    print "{과목} → {성적[과목]}점"
}

if has(성적, "체육") {
    print "체육:", 성적["체육"]
} else {
    print "체육 점수는 아직 없어요."
}
```

▶ **[Open in the playground](https://vpdrla.github.io/Venos/#lesson=dicts)**

---

## 9. Functions

Give a piece of behavior a name with `func` and reuse it as often as you like; `return` hands a result back.

A function can even **call itself** (recursion) — `팩토리얼` (factorial) below does exactly that.

Try adding one more `인사("...")` line.

```
func 인사(이름) {
    print "안녕하세요, {이름}님!"
}

func 팩토리얼(n) {
    if n <= 1 then { return 1 }
    return n * 팩토리얼(n - 1)
}

인사("미르")
인사("하늘")
print "5! =", 팩토리얼(5)
```

▶ **[Open in the playground](https://vpdrla.github.io/Venos/#lesson=functions)**

---

## 10. Classes

A class bundles **data and behavior** together. `init` is the constructor, called automatically when you create one.

`self` means "this object" — use `self.이름` to read and write its own fields.

Try creating one more dog.

```
class 강아지 {
    func init(이름) {
        self.이름 = 이름
        self.나이 = 0
    }
    func 짖기() { print "{self.이름}: 멍멍!" }
    func 생일() {
        self.나이 += 1
        print "{self.이름}(은)는 이제 {self.나이}살"
    }
}

let 뭉치 = 강아지("뭉치")
뭉치.짖기()
뭉치.생일()
```

▶ **[Open in the playground](https://vpdrla.github.io/Venos/#lesson=classes)**

---

## 11. Handling errors

An error stops the program. Inside `try`, an error jumps to `catch` instead of stopping everything.

The message lands in the variable you name after `catch`, as a string. You can raise your own with `error(...)`.

Try changing the divisor to something other than 0.

```
let 나누는수 = 0

try {
    print 10 / 나누는수
    print "이 줄은 실행되지 않아요"
} catch 오류 {
    print "문제가 생겼어요:", 오류
}

print "그래도 프로그램은 계속됩니다."
```

▶ **[Open in the playground](https://vpdrla.github.io/Venos/#lesson=errors)**

---

## 12. Mini project: number guessing

This uses everything so far — variables, `while`, `if`, `input`, functions, and interpolation.

`random(1, 50)` picks any number from 1 to 50.

Widen the range, add a limit on tries, or make the hints friendlier. When it works, send it to a friend with the **Share** button!

```
let 정답 = random(1, 50)
let 시도 = 0

print "1부터 50 사이 숫자를 맞혀보세요!"

while true {
    let 답 = input "숫자: "
    시도 += 1

    if 답 == 정답 {
        print "정답! {시도}번 만에 맞혔어요 🎉"
        break
    } else if 답 < 정답 { print "더 큰 수예요 ↑" }
    else { print "더 작은 수예요 ↓" }
}
```

▶ **[Open in the playground](https://vpdrla.github.io/Venos/#lesson=project)**

---

## Where to go next

- The full syntax lives in the [language spec](VENOS_SPEC.en.md).
- A bigger example: [`examples/rpg.en.my`](examples/rpg.en.my) — a 227-line text RPG built from what you just learned.
- Use the **🔗 Share** button in the playground to turn your program into a link you can send to a friend or teacher.
