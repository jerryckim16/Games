# Suneung Simulator (수능 시뮬레이터)

A life-sim about the Korean college entrance exam, 대학수학능력시험 (수능). You're born at random into one of Korea's five household-income fifths. You start elementary school at 6 and grow up through middle school and high school, deciding each turn how to spend your time: which subjects to study, whether your family pays for cram school, when to read, rest, play or see friends. Life happens along the way. At the end of grade 10 you choose humanities or sciences. In grade 12 you play month by month and sit the real 수능 in November. With your score you apply to universities, then take an offer or retake the exam the next year (재수, 삼수, N수) as many times as you like.

Open `index.html` in a browser. There's no build step and no dependencies. Progress autosaves in the browser. It's also published as a single-file claude.ai artifact: https://claude.ai/artifact/H8zzP1PqsHVdvEQEARTuFE

**Play it in English or Korean.** The switch in the top corner changes every word on the page, including the life log of a game in progress, and the choice is remembered. The first visit follows the browser's language.

This version ends when you enroll at a university. College life and what comes after are planned for later versions.

## How to play

1. **Be born.** Type a name. Your family and your talents are dealt at random; you can't pick or re-roll them.
   - The birth screen shows your family's household income, which fifth of Korean households it's in, and what your parents can spend on your education each month.
   - Stars show aptitude, which is how fast you learn each subject.
2. **Grow up.** Each turn you assign blocks of free time:

   | Stage | One turn is | Blocks |
   |---|---|---|
   | Elementary school (grades 1–6, age 6–11) | a school year | 4 |
   | Middle school (grades 7–9) | a semester | 4 |
   | High school (grades 10–11) | a season: spring term, summer break, fall term, winter break | 4, or 5 in the breaks |
   | Grade 12 | a month (March to November) | 4, 6 in July–August, 2 in 수능 month |
   | Retake years | a month | 6 (반수: 2 until June) |

   Pick a study method too; it applies to every study block that turn.
3. **Handle events.** Most turns bring one: a sports day, a math olympiad, the smartphone debate, a move to Daechi-dong, class elections, 중2, a PC방 invitation, a crush, a slump, a star lecturer's new course. Some only need an OK; others ask you to choose. Some lives also run into bullying (학교폭력), which hangs over every turn until it's dealt with.
4. **Watch your standing.**
   - The elementary-school teacher leaves a note each year.
   - Middle school shows your class rank each semester.
   - Grades 10 and 11 sit mock exams (학력평가) in June and November.
5. **Choose a track** at the end of grade 10: humanities (확률과 통계 + two social-studies subjects) or sciences (미적분 + two science subjects; the only track that can apply to medical school). Your social-studies ability carries into the humanities subjects, your science ability into the science ones.
6. **Sit the exams.**
   - Grade 12 has mock exams in March, June and September, with full score reports.
   - In November you make two last choices: how you spend the night before, and what's in your 수능 lunch box. Then you sit the 수능 period by period.
   - The score report comes in December.
7. **Apply and decide.** Apply to up to three universities (정시, one per 가·나·다 group). Then:
   - enroll;
   - enroll but secretly retake (반수);
   - retake at a 재수종합학원 or by self-study (독학재수);
   - or stop.

The **Hall of fame** keeps your 10 best lives on this device, ranked by 국수탐 standard-score total.

## Features

- **A whole childhood.** Ability is on the 수능 scale from the start (50 is the average test taker), so a 6-year-old begins far below it and climbs. Ability never decays: a subject you don't study stops growing but keeps what you learned. Early habits decide how far you climb.
- **Families from real income data:**
  - You're born into one of the five national household-income fifths, each with a 20% chance.
  - The family sets your education budget. Money the parents don't spend on you that turn stays with them.
  - Your own savings (New Year's money from relatives, gifts, a part-time job from grade 10) cover anything over the budget.

  | Family | Household income (a month) | Education budget (a month) | Head start at age 6 | Pays for a retake academy |
  |---|---|---|---|---|
  | Low income (bottom fifth) | about ₩1.25M | ₩150,000 | −0.10 | no (scholarship only) |
  | Lower-middle income | about ₩3.0M | ₩250,000 | −0.05 | no (scholarship only) |
  | Middle income | about ₩4.9M | ₩420,000 | 0 | yes |
  | Upper-middle income | about ₩7.7M | ₩580,000 | +0.05 | yes |
  | High income (top fifth) | about ₩13.8M | ₩900,000 | +0.10 | yes |

  - **Incomes:** from the 2024 household finance survey (가계금융복지조사). The top fifth averages ₩166M a year and all households ₩71.85M; the middle fifths are interpolated.
  - **Budgets:** follow the 2024 private-education survey (초중고 사교육비조사), which found ₩205,000 a month per student in households under ₩3M and ₩676,000 in households at ₩8M and above. The top fifth's figure is extrapolated above that bracket.
  - **Head start** is in ability units (sd of 수능 takers): books at home and parents' schooling.
  - From the 4th attempt on, parents pay only half.
- **Six exam sections, scored the way the real 수능 is** (2022–2027 format):
  - 국어 and 수학: raw /100, 표준점수 (mean 100, sd 20), 백분위, and 등급 1–9 by the 4/11/23/40/60/77/89/96% cut-offs;
  - 탐구 ×2: raw /50, 표준점수 (mean 50, sd 10), 백분위, 등급;
  - 영어: absolute grading, 90+ is grade 1 and every 10 points is a grade;
  - 한국사: absolute grading, 40+ is grade 1 and every 5 points is a grade.
  - The score report also shows each section's grade-1 cut.
  - Before the track choice, the two inquiry slots are social studies and science.
- **Activities (one block each):**

  | Activity | When | Effect |
  |---|---|---|
  | Study a subject (×6) | always | Raises that subject's ability |
  | Read books 독서 | grades 1–11 | Free. Builds Korean, with a little social studies and history |
  | Piano, taekwondo & co. 예체능 | grades 1–9 | ₩150,000 a month. +Health, −Stress, +Motivation |
  | Timed practice exams 실전 모의고사 | grade 10 on | Builds exam stamina (steadier scores on the day); small gains in every subject; stressful |
  | Rest & sleep 휴식 | always | −Stress, +Health |
  | Exercise 운동 | always | +Health, −Stress |
  | Hang out with friends 친구 | always | Big −Stress, +Motivation; sometimes leads to a PC방 invitation (from grade 5) |
  | Games & YouTube 게임 | always | −Stress, −Motivation |
  | Part-time job 알바 | grade 10 on | +₩250,000 a month, +Stress, −Health |

- **Study methods** (costs are per study block per month, so a year-long elementary turn costs 12 months of it):

  | Method | Speed | Cost per study block a month | Depends on motivation |
  |---|---|---|---|
  | Self-study 독학 | ×1.0 | free | fully |
  | Online lectures 인강 | ×1.25 | ₩25,000 | more than self-study |
  | Cram school 학원 | ×1.45 | ₩120,000 | partly (keeps you on task) |
  | Private tutor 과외 | ×1.75 | ₩250,000 | barely |

- **Retake paths:**
  - **재종반 (retake academy):** 6 blocks a month at cram-school speed for every subject, and a higher motivation baseline. The ₩2.9M monthly fee is paid by middle-income families and above; lower-income families can only go on a scholarship (admission score 85+).
  - **독학재수 (self-study retake):** 6 blocks a month, with any study method.
  - **반수 (half-retake):** you start at a university you got into, with only 2 blocks a month until June. That school stays an option at next year's decision.
- **Condition:**
  - **Health** below 40 slows study.
  - **Stress** above 75 slows study, and 85+ risks burnout (−2 blocks next turn).
  - **Motivation** multiplies study gains. It drifts back toward a baseline that sags with every extra year.
  - **Being bullied** cuts study efficiency by 10–30% and wears down stress, motivation and health every turn until it's resolved (see above).
  - Stress and health also drift toward a resting level each turn, so a steady workload settles instead of spiralling.
  - High stress or low health on exam day lowers your scores.
- **About 30 random events** with conditions (by school grade, family, phone ownership, stress, retakers, 반수 students). After an event fires it can't recur for 4 months. Fixed milestones always fire: the free-semester career week (grade 7), 중2 (grade 8) and D-100 (August of each 수능 year).
- **Bullying (학교폭력)**, a storyline that lasts until it's resolved:
  - **When:** it can start in grades 3–11, most often in middle school. It's twice as likely for a year after you move (Daechi-dong) or change schools, and 1.4× as likely when your last plan had no time with friends. Each earlier episode halves the chance, and a new episode can't start within a year of the last one ending. About 3 in 10 lives meet it.
  - **Severity:** mild, serious or severe. It starts mild, or serious (more often in middle school).
  - **What it costs, every turn it lasts:** study efficiency drops 10% per severity level, so −10%, −20% or −30%. If someone is supporting you (parents who know, the Wee class counselor, friends you've made time for), it drops 30% less. It also adds stress (+4 per level), drains motivation (−3 per level) and health (−2 per level, or −1 with support). Severe bullying costs a block a turn (days you can't face school).
  - **The first choice:** tell your homeroom teacher, tell your parents (support, but the call can backfire), fight back, or keep quiet.
  - **Every turn after that:** a follow-up asks what you do now:
    - report it to the school violence committee (학폭위): stressful, but the likeliest to end it;
    - talk to the Wee class counselor: gives support and often eases it;
    - stick close to your friends: works much better if you've been making time for them;
    - fight back: a gamble that often makes it worse;
    - endure it in silence: it usually gets worse.
  - **When it turns severe,** the options are reporting it with your parents (it stops at once 60–70% of the time), changing schools (almost always ends it, at the cost of stress, motivation and a block), the counselor, or enduring.
  - **How it ends:** a choice that works, the March class reshuffle (60%, 40% or 20% by severity), starting a new school (70%), or leaving high school.
  - **On screen:** the Condition panel shows a red line with the severity and its cost while it lasts. Every step is in the life log.
  - **Cost by grade 12:** in a paired test (the same 200 lives cloned at the start of grade 7 with serious bullying), reporting it costs about 1 point of average ability entering grade 12 and enduring it about 4.
- **Ability chart** across every stage and attempt, a **life log**, and an **exam history** table with every 수능 and the current year's mocks.
- **Deterministic:** the seed fixes the family, the talent roll, every paper, and the cohort you're graded against. Your choices only change your own answers.
- **Two complete languages, English and Korean**, never mixed. Switching mid-game re-renders everything, including past log entries.
- **Ages are international (만 나이):** grade 1 starts at 6 and grade 12 at 17; the Korean version writes "만 17세".
- Light and dark themes; works at phone width.

## How the exam is simulated

- **Ability:** each subject has a latent ability θ on the scale of the 수능 test takers (mean 0, sd 1). The bars show it as 0–100, where 50 + 16.7·θ, so 50 is average and 100 is θ = 3. At age 6, θ is your talent minus 2.4, so a child of average talent starts around 10.
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
  - each block on a subject adds 0.24 × subject rate × aptitude × method speed × condition × headroom(θ) × √(months in the turn), times 0.5 during the school years (grades 1–11);
  - condition = the motivation, health and stress factors, times the bullying factor (1, or 0.9–0.7) while you're being bullied;
  - headroom(θ) = e^(−0.62·max(0, θ + 0.8)) gives diminishing returns: going from average to top 4% is far quicker than from top 4% to a perfect score;
  - a second block on the same subject in one turn counts ×0.77, a third ×0.63, and so on;
  - **no decay:** ability only goes up. A subject you don't study stays where it is;
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
- **Balance** plays whole lives, from birth, with simple bots and reports the results.

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

80 lives each, with families dealt from the real quintiles.

- The bots always pick the first option at events (for bullying, that means telling a teacher and then reporting it).
- "Best affordable" means the most expensive study method the family's budget covers that turn.
- "smart" looks after stress and health, reads in elementary school, adds a timed practice exam in October of grade 12, and studies the subject with the most room to grow. It skips English past about the 90-point level and History once it is safe.
- The bots apply to one reach, one match and one safe school.
- "Start" is the average ability (0–100) entering grade 12.

| Strategy | Start | First 수능 국·수·영 grades | First total | Last total | Tries | SKY+ | 의대 | In-Seoul+ |
|---|---|---|---|---|---|---|---|---|
| balanced, self-study, 1 try | 42 | 3.0 · 2.3 · 2.2 | 326 | 326 | 1.00 | 0% | 0% | 1% |
| slacker (half games & friends), 1 try | 29 | 3.4 · 2.7 · 8.2 | 304 | 304 | 1.00 | 0% | 0% | 0% |
| grinder (no rest), self-study, 1 try | 57 | 3.2 · 2.4 · 2.0 | 369 | 369 | 1.00 | 0% | 0% | 43% |
| smart, online lectures, 1 try | 62 | 2.5 · 2.2 · 2.2 | 375 | 375 | 1.00 | 3% | 0% | 60% |
| smart, best affordable method, 1 try | 67 | 2.0 · 1.7 · 1.8 | 388 | 388 | 1.00 | 15% | 0% | 76% |
| smart, best affordable, retakes up to 3 tries | 67 | 2.0 · 1.7 · 1.8 | 388 | 411 | 2.41 | 74% | 6% | 99% |
| smart, best affordable, 이과, chasing 의대, up to 5 tries | 67 | 2.1 · 1.7 · 1.8 | 387 | 418 | 4.09 | 90% | 65% | 99% |

The smart bot with the best affordable method, first try only, by family:

| Family | Lives | Start | First total | SKY+ | In-Seoul+ |
|---|---|---|---|---|---|
| Low income | 12 | 60 | 372 | 0% | 58% |
| Lower-middle income | 11 | 59 | 369 | 0% | 45% |
| Middle income | 21 | 70 | 395 | 0% | 86% |
| Upper-middle income | 18 | 70 | 394 | 22% | 89% |
| High income | 18 | 73 | 397 | 44% | 83% |

What the tables show:

- **Childhood habits decide where you start grade 12:** the same random talents end up anywhere from 29 to 67 on average.
- **Family income matters, but it isn't destiny:** with the same smart play, the top two fifths reach SKY on the first try 22–44% of the time and the bottom two never did. Retakes close much of the gap.
- **Retakes** add about 10–20 points of 국수탐 standard total each.
- **Medical school** takes talent, a sciences track and usually several years.

## Files

- `engine.js`: the game, with no DOM, so it runs in Node. It holds no display text: log entries, events and outcomes are message keys with values.
  - `Game` holds the state and the screen queue: `advance(plan, method)`, `choose(i)`, `dismiss()`, `chooseTrack(track, inq)`, `apply(ids)`, `decide(d)`.
  - It also holds the life stages, families, the exam simulation (`gradeSubject`), events, universities and constants.
- `strings.js`: every piece of text, as an English and a Korean dictionary with the same keys. `make(lang, ctx)` returns the translator, including Korean money (만/억) and particle (이/가) handling.
- `app.js`: UI only. It renders the state and whatever screen is first in `game.queue`.
- `sim.js`: the headless calibration and strategy-bot script.

## Changelog

- **v2.3:** bullying (학교폭력) is now a storyline instead of a one-off event. It can start in grades 3–11 and lasts until it's resolved, with a follow-up choice every turn: report it to the school violence committee, see the Wee class counselor, stick with friends, fight back, endure it, or change schools when it turns severe. While it lasts, study efficiency drops 10–30% and stress, motivation and health suffer; severe bullying costs a block a turn. The Condition panel shows it. Saves from v2.2 still load. Balance tables regenerated.
- **v2.2:** ages use the international count (만 나이): you start grade 1 at 6, so a grade-12 student is 17. The Korean version writes ages as "만 6세". Gameplay and balance numbers are unchanged.
- **v2.1:** ability no longer decays. Subjects you don't study stay where they are instead of slipping (no more peer drift in the school years, and no monthly fade in grade 12 or retake years). Ability is now on the 수능 scale from age 7 (50 is the average test taker), so children start around 10 and climb; the starting level and school-year study speed were retuned so top players reach about the same level as before. Balance tables regenerated.
- **v2:** lives start in elementary school. Turns are a year in elementary school, a semester in middle school and a season in grades 10–11, then monthly from grade 12. Ability is now relative to your year group, with peer drift during the school years. New childhood activities (reading, arts & sports) and about ten new events (sports day, olympiad, smartphone, Daechi-dong, bullying, class elections, career week, 중2). Middle-school class ranks and grade 10–11 mock exams track your standing. The track and inquiry subjects are chosen at the end of grade 10 instead of at the start. Families are no longer chosen: you're born into one of the five household-income fifths at random, with budgets based on the 2024 private-education survey, and there's no talent re-roll. Unspent education budget no longer piles up; your own savings come from New Year's money, gifts and part-time work. Earlier saves don't carry over.
- **v1.2:** full English and Korean versions with a language switch, instead of mixed English and Korean text. The engine now emits message keys; all text lives in `strings.js`. Saves from earlier versions don't carry over (the save format changed). Game behavior and balance numbers are unchanged.
- **v1.1:** "Start a new life" asks for confirmation in the page's own dialog, because embedded viewers block browser `confirm()`. Side gutters respect phone safe areas. Published as a claude.ai artifact.
- **v1:** first version. One-year 고3 run with monthly plans, study methods, condition, about 20 events, March/June/September mocks, the 수능 with a full score report, 정시 applications, and retakes (재종반, 독학재수, 반수) for as many years as you like. Also adds autosave, the hall of fame, and the calibration and bot script.
