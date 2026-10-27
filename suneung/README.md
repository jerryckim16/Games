# Suneung Simulator (수능 시뮬레이터)

A life-sim about the Korean college entrance exam, 대학수학능력시험 (수능). You start in March of your last year of high school (고3). Every month you split your free time between subjects, rest and friends. Life happens. You sit mock exams and then the real 수능 in November. With your score you apply to universities, then take an offer or retake the exam the next year (재수, 삼수, N수) as many times as you like.

Open `index.html` in a browser. There's no build step and no dependencies. Progress autosaves in the browser. It's also published as a single-file claude.ai artifact: https://claude.ai/artifact/H8zzP1PqsHVdvEQEARTuFE

This version covers the exam years only. College life and what comes after are planned for later versions.

## How to play

1. **Start a new life.** Pick:
   - a **track**: Humanities (문과: 확률과 통계 + two social-studies subjects) or Sciences (이과: 미적분 + two science subjects; the only track that can apply to medical school);
   - your two **inquiry (탐구) subjects**;
   - your **family**, which sets your monthly education budget.

   Your starting **talent** is rolled. **Re-roll** it until you like it. Stars show aptitude, which is how fast you learn that subject.
2. **Plan each month.** You have a number of time blocks to assign:
   - 고3: 4 blocks, 6 in the July–August vacation, and 2 in 수능 month;
   - retakers: 6 blocks.

   Pick a study method too; it applies to every study block that month.
3. **Handle events.** Most months bring an event: a PC방 invitation, a crush, a cold, a slump, a star lecturer's new course. Some only need an OK; others ask you to choose.
4. **Sit the exams.**
   - Mock exams arrive in March (고3 only), June and September, with full score reports.
   - In November you make two last choices: how you spend the night before, and what's in your 수능 lunch box. Then you sit the 수능 period by period.
   - The score report comes in December.
5. **Apply and decide.** Apply to up to three universities (정시, one per 가·나·다 group). Then:
   - enroll;
   - enroll but secretly retake (반수);
   - retake at a 재수종합학원 or by self-study (독학재수);
   - or stop.

The **Hall of fame** keeps your 10 best lives on this device, ranked by 국수탐 standard-score total.

## Features

- **Six exam sections, scored the way the real 수능 is** (2022–2027 format):
  - 국어 and 수학: raw /100, 표준점수 (mean 100, sd 20), 백분위, and 등급 1–9 by the 4/11/23/40/60/77/89/96% cut-offs;
  - 탐구 ×2: raw /50, 표준점수 (mean 50, sd 10), 백분위, 등급;
  - 영어: absolute grading, 90+ is grade 1 and every 10 points is a grade;
  - 한국사: absolute grading, 40+ is grade 1 and every 5 points is a grade.
  - The score report also shows each section's grade-1 cut.
- **Activities (one block each):**

  | Activity | Effect |
  |---|---|
  | Study a subject (×6) | Raises that subject's ability |
  | Timed practice exams 실전 모의고사 | Builds exam stamina (steadier scores on the day); small gains in every subject; stressful |
  | Rest & sleep 휴식 | −Stress, +Health |
  | Exercise 운동 | +Health, −Stress |
  | Hang out with friends 친구 | Big −Stress, +Motivation; sometimes leads to a PC방 invitation |
  | Games & YouTube 게임 | −Stress, −Motivation |
  | Part-time job 알바 | +₩250,000, +Stress, −Health |

- **Study methods:**

  | Method | Speed | Cost per study block | Depends on motivation |
  |---|---|---|---|
  | Self-study 독학 | ×1.0 | free | fully |
  | Online lectures 인강 | ×1.25 | ₩25,000 | more than self-study |
  | Cram school 학원 | ×1.45 | ₩120,000 | partly (keeps you on task) |
  | Private tutor 과외 | ×1.75 | ₩250,000 | barely |

- **Families:**

  | Family | Monthly budget | Savings | Head start |
  |---|---|---|---|
  | Tight 흙수저 | ₩300,000 | ₩200,000 | −0.15 |
  | Middle 평범 | ₩1,200,000 | ₩1,000,000 | 0 |
  | Wealthy 금수저 | ₩5,000,000 | ₩5,000,000 | +0.25 |

  Head start is in ability units (sd of test takers). From the 4th attempt on, parents pay only half.
- **Retake paths:**
  - **재종반 (retake academy):** 6 blocks a month at cram-school speed for every subject, and a higher motivation baseline. The ₩2.9M monthly fee is paid by middle-class and wealthy parents; a tight-budget family can only go on a scholarship (admission score 85+).
  - **독학재수 (self-study retake):** 6 blocks a month, with any study method.
  - **반수 (half-retake):** you start at a university you got into, with only 2 blocks a month until June. That school stays an option at next year's decision.
- **Condition:**
  - **Health** below 40 slows study.
  - **Stress** above 75 slows study, and 85+ risks burnout (−2 blocks next month).
  - **Motivation** multiplies study gains. It drifts back toward a baseline that sags with every extra year.
  - Stress and health also drift toward a resting level each month, so a steady workload settles instead of spiralling.
  - High stress or low health on exam day lowers your scores.
- **About 20 random events** with conditions (some only for retakers, 반수 students, or stressed students). After an event fires it can't recur for 4 months. D-100 always fires in August.
- **Ability chart** across all attempts, a **life log**, and an **exam history** table with every 수능 and this year's mocks.
- **Deterministic:** the seed fixes the talent roll, every paper, and the cohort you're graded against. Your choices only change your own answers.
- Light and dark themes; works at phone width.

## How the exam is simulated

- **Ability:** each subject has a latent ability θ on the scale of that year's test takers (mean 0, sd 1). The bars show it as 0–100, where 50 + 16.7·θ, so 50 is average and 100 is θ = 3.
- **Questions** follow the real layouts: 국어 and 영어 have 45 questions, 수학 has 30 (some short-answer), 한국사 and each 탐구 have 20, with 2-, 3- and 4-point items.
  - Each question has an item-response curve: P(correct) = c + (1 − c) / (1 + e^(−1.7·a·(θ − b))).
  - Guessing c is 0.2 for multiple choice and 0 for short answer.
  - Each paper places a few "killer" questions among the high-point items.
- **Year-to-year difficulty:** each paper gets a random shift, which makes 불수능 and 물수능 years. The score report's headline names an unusually hard or easy section.
- **The cohort:** each sitting simulates 3,000 test takers per subject. Your standard score, percentile and grade come from your place among them. Inquiry pools differ in strength (Physics I takers are stronger than Earth Science I takers), so the subject choice matters.
- **Exam day:** your ability on the day is θ plus:
  - a stress penalty (above 65) and a health penalty (below 45), each at most −0.25;
  - first-수능 nerves, which practice reduces;
  - the night-before and lunch-box choices;
  - random day form, whose spread shrinks with exam stamina.
- **Learning:**
  - each block on a subject adds 0.24 × subject rate × aptitude × method speed × condition × headroom(θ);
  - headroom(θ) = e^(−0.62·max(0, θ + 0.8)) gives diminishing returns: going from average to top 4% is far quicker than from top 4% to a perfect score;
  - a second block on the same subject in one month counts ×0.77, a third ×0.63, and so on;
  - subjects you skip for a month fade slightly;
  - subject rates are 국어 0.8, 수학 1.0, 영어 0.95, 한국사 1.6, 탐구 1.3.

### University admission (rough)

- **Admission score** = average 백분위 of 국어, 수학 and the two 탐구 (counted as one), minus:
  - an English deduction by grade: 0, 0, 0.8, 2, 3.5, 5.5, 8, 11, 14 for grades 1–9;
  - 0.5 for History grade 4, or 2 for grade 5 and worse.
- **Each school has a cut** where an application is a coin flip. The chance of admission follows a logistic curve with a 0.7-point slope.
- **Labels:** 안정 (safe, 85%+), 적정 (match, 55%+), 소신 (reach, 25%+), 상향 (long shot).

The cuts are ballpark figures from recent 정시 years, simplified to one per school. They are not an admissions predictor.

| School | Cut | School | Cut |
|---|---|---|---|
| 의대 (Medical school, 이과 only) | 99.3 | 중앙대 | 94.2 |
| 서울대 | 98.7 | 서울시립대 | 93.8 |
| 연세대 | 97.6 | 경희대 | 93.6 |
| 고려대 | 97.4 | 한국외대 | 93.3 |
| 성균관대 | 96.1 | 건국대 | 91.0 |
| 서강대 | 95.8 | 동국대 | 90.6 |
| 한양대 | 95.6 | 홍익대 | 90.0 |
| 부산대 | 88.5 | 경북대 | 87.5 |
| 국민대 | 86.8 | 숭실대 | 86.5 |
| 아주대 | 85.8 | 인하대 | 85.0 |
| 가천대 | 80.0 | 지방 사립대 | 60.0 |
| 전문대 | 25.0 | | |

## Calibration and balance

`node suneung/sim.js` runs two checks:

- **Calibration** compares the simulated cohort with real 수능 numbers.
- **Balance** plays whole careers with simple bots and reports the results.

Run it after any change to the exam or learning model. The tables below come from `node suneung/sim.js --seeds 80`.

### Calibration

Means over 40 sittings.

| Section | Mean raw | Grade-1 cut | Top 표준점수 | Grade-1 share | Real target |
|---|---|---|---|---|---|
| 국어 | 59.2 | 90.0 | 141.3 | | cut 84–92, top 135–150 |
| 수학 | 45.8 | 88.2 | 147.1 | | cut 84–88, top 135–148 |
| 영어 | 57.7 | | | 8.9% | 4–10% grade 1 |
| 한국사 | 32.1 | | | 33.2% | 15–35% grade 1 |
| 탐구 | 31.1 | 47.2 | 67.6 | | cut 44–50, top 63–77 |

### Strategy bots

80 seeds each, middle-class family unless noted.

- The bots always pick the first option at events.
- "smart" looks after stress and health, adds a timed practice exam in October, and studies the subject with the most room to grow. It skips English past about the 90-point level and History once it is safe.
- The bots apply to one reach, one match and one safe school.

| Strategy | First 수능 국·수·영 grades | First total | Last total | Tries | SKY+ | 의대 | In-Seoul+ |
|---|---|---|---|---|---|---|---|
| balanced, self-study, 1 try | 3.5 · 3.4 · 3.2 | 334 | 334 | 1.00 | 0% | 0% | 9% |
| slacker (half games & friends), 1 try | 3.8 · 3.5 · 5.1 | 327 | 327 | 1.00 | 0% | 0% | 5% |
| grinder (no rest), self-study, 1 try | 3.9 · 3.3 · 4.7 | 348 | 348 | 1.00 | 0% | 0% | 14% |
| smart, online lectures, 1 try | 3.6 · 3.4 · 3.6 | 346 | 346 | 1.00 | 0% | 0% | 19% |
| smart, cram school, wealthy, 1 try | 2.6 · 2.8 · 2.8 | 364 | 364 | 1.00 | 3% | 0% | 34% |
| smart, tutor, wealthy, 1 try | 2.7 · 2.4 · 2.4 | 372 | 372 | 1.00 | 5% | 0% | 54% |
| smart, online, retake academy, up to 3 tries | 3.6 · 3.4 · 3.6 | 346 | 405 | 2.90 | 40% | 0% | 98% |
| smart, online, self-study retakes, up to 3 tries | 3.6 · 3.4 · 3.6 | 346 | 398 | 2.98 | 19% | 0% | 94% |
| smart, tutor, wealthy, 이과, chasing 의대, up to 5 tries | 2.7 · 2.4 · 2.4 | 371 | 418 | 4.60 | 83% | 49% | 96% |

What the table shows:

- **First try:** studying helps, but one year from an average start rarely reaches SKY.
- **Retakes:** each retake adds about 30 points of 국수탐 standard total.
- **Academy vs self-study:** a retake academy beats self-study retakes.
- **Medical school** takes money, talent and years.

## Files

- `engine.js`: the game, with no DOM, so it runs in Node.
  - `Game` holds the state and the screen queue: `advance(plan, method)`, `choose(i)`, `dismiss()`, `apply(ids)`, `decide(d)`.
  - It also holds the exam simulation (`gradeSubject`), events, universities and constants.
- `app.js`: UI only. It renders the state and whatever screen is first in `game.queue`.
- `sim.js`: the headless calibration and strategy-bot script.

## Changelog

- **v1.1:** "Start a new life" asks for confirmation in the page's own dialog, because embedded viewers block browser `confirm()`. Side gutters respect phone safe areas. Published as a claude.ai artifact.
- **v1:** first version. One-year 고3 run with monthly plans, study methods, condition, about 20 events, March/June/September mocks, the 수능 with a full score report, 정시 applications, and retakes (재종반, 독학재수, 반수) for as many years as you like. Also adds autosave, the hall of fame, and the calibration and bot script.
