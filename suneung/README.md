# Suneung Simulator (수능 시뮬레이터)

A life-sim about the Korean college entrance exam, 대학수학능력시험 (수능). You're born at random into one of Korea's five household-income fifths, with a temperament your parents notice in your first weeks and a head start from what you grab at your first-birthday 돌잡이. You play the baby and kindergarten years, start elementary school at 6 and grow up through middle school and high school, deciding each turn how to spend your time: which subjects to study, whether your family pays for cram school, when to read, rest, play or see friends. Life happens along the way. At the end of High 1 you choose humanities or sciences. In High 3 you play month by month and sit the real 수능 in November. With your score you apply to universities, then take an offer or retake the exam the next year (재수, 삼수, N수) as many times as you like.

Open `index.html` in a browser. There's no build step and no dependencies. Progress autosaves in the browser. It's also published as a single-file claude.ai artifact: https://claude.ai/artifact/H8zzP1PqsHVdvEQEARTuFE

**Play it in English or Korean.** The switch in the top corner changes every word on the page, including the life log of a game in progress, and the choice is remembered. The first visit follows the browser's language.

This version ends when you enroll at a university. College life and what comes after are planned for later versions.

## How to play

School years are counted the Korean way, with each school numbering its own years: Elementary 1–6 (초1–6), Middle 1–3 (중1–3) and High 1–3 (고1–3). High 3 (고3) is the 수능 year.

1. **Be born.** Choose boy or girl and type a name. Your family and your talents are dealt at random; you can't pick or re-roll them.
   - The birth screen shows where you're born, your family's household income, which fifth of Korean households it's in, and what your parents can spend on your education each month.
   - Stars show aptitude, which is how fast you learn each subject. They stay on screen all game (see Aptitude below).
   - Then your first weeks reveal your **temperament**, and at your first birthday the **돌잡이** shows what you grab. Both give you a trait: a permanent bonus (see Traits below).
   - A fortune-teller's reading (사주) tells you how lucky a life you've been dealt. Luck runs through everything from here on (see Luck below).
   - Ages 0–5 are played a year at a time, with play instead of study, and a kindergarten choice at 3.
2. **Pick a school** at 3 (kindergarten) and at the start of elementary, middle and high school. The local public school is always open; private and special schools have fees, lotteries or entry requirements (see Schools below).
3. **Grow up.** Each turn you assign blocks of free time. You can also **move house** to another region (once a year) with the Move house button:

   | Stage | One turn is | Blocks |
   |---|---|---|
   | Early childhood (age 0–5) | a year | 3 |
   | Elementary school (초1–6, Elementary 1–6, age 6–11) | a school year | 4 |
   | Middle school (중1–3, Middle 1–3) | a semester | 4 |
   | High school (고1–2, High 1–2) | a season: spring term, summer break, fall term, winter break | 4, or 5 in the breaks |
   | Final year (고3, High 3) | a month (March to November) | 4, 6 in July–August, 2 in 수능 month |
   | Retake years | a month | 6 (반수: 2 until June) |

   Pick a study method too; it applies to every study block that turn.

   From Middle 1 you can also **leave school** (자퇴) with the Leave school button. Out of school you get two more blocks a turn in Middle 1 to High 2 but lose the school lessons, which otherwise raise every subject a little each turn on their own. See Leaving school below.
4. **Handle events.** Most turns bring one: a sports day, a math olympiad, the smartphone debate, a move to Daechi-dong, class elections, 중2, a PC방 invitation, a crush, a slump, a star lecturer's new course. Some only need an OK; others ask you to choose. Some lives also run into bullying (학교폭력), which hangs over every turn until it's dealt with.
5. **Watch your standing.**
   - The elementary-school teacher leaves a note each year.
   - Middle school shows your class rank each semester.
   - High 1 and 2 sit mock exams (학력평가) in June and November.
6. **Choose a track** at the end of High 1: humanities (확률과 통계 + two social-studies subjects) or sciences (미적분 + two science subjects; the only track that can apply to medical school). Your social-studies ability carries into the humanities subjects, your science ability into the science ones.
7. **Sit the exams.**
   - High 3 has mock exams in March, June and September, with full score reports.
   - In November you make two last choices: how you spend the night before, and what's in your 수능 lunch box. The day itself may deal you some luck, good or bad. Then you sit the 수능 period by period.
   - The score report comes in December.
8. **Apply and decide.** Apply to up to three universities (정시, one per 가·나·다 group). The real cuts only show when the results come out, and a rejection can still turn into a February waitlist call. Then:
   - enroll;
   - enroll but secretly retake (반수);
   - retake at a 재수종합학원 or by self-study (독학재수);
   - or stop.

The **Hall of fame** keeps your 10 best lives on this device, ranked by 국수탐 standard-score total.

## Features

- **A whole childhood, from birth.** Ability is on the 수능 scale from the start (50 is the average test taker), so a baby begins far below it and climbs. Ability never decays: a subject you don't study stops growing but keeps what you learned. Early habits decide how far you climb.
- **Aptitude, always on screen.** Aptitude multiplies every study gain in a subject (and its school lessons), so maxing it out takes 1 / aptitude of the average time. Every ability bar ends in stars (· below 0.88, ★ to 1.05, ★★ to 1.25, ★★★ to 1.45, ★★★★ above, gold from ★★★), and each study card shows the stars and the saving in words, such as "20% less study to max out" or "15% more study to max out". The bar's tooltip gives the exact multiplier. A 돌잡이 subject item adds 0.25, so it often earns an extra star.
- **Luck.** Life is mostly luck, and the game says so:
  - **A fortune-teller's reading (사주) at birth** reveals a hidden fortune, from great to rough. It tilts the odds of every good and bad event (weight × 1 + 0.6 × fortune, for an event tagged good or bad) and adds a little to 수능 day. Lives with a good reading average about 15 points more on their first 수능 than lives with a rough one.
  - **The family's fortunes change** two or three times a life, each time moving it a whole income fifth with its education budget: a promotion or a business taking off, an inheritance or a lottery win (sometimes two fifths), a layoff or a business going under, a jeonse deposit scam, a parent's serious illness. A family that can no longer pay a private school's fees moves you to the public one.
  - **Your own body:** a car accident (−35 health, three blocks lost) or weeks in hospital (two blocks), each in about two lives out of five.
  - **Lucky breaks:** a teacher who makes a subject click (aptitude +0.2), or a sudden passion for one (aptitude +0.3 and a jump in ability).
  - **Middle 2 rewires everyone:** every aptitude shifts, by a shared amount (sd 0.2: late bloomer or early peaker) plus one per subject (sd 0.18), from its own seeded stream.
  - **수능 day:** the whole day goes well or badly together (a shift of sd 0.35 on every subject), each paper fits you better or worse (sd 0.18 a subject, mocks too), and about half the time something happens: a sniffling neighbour, a lucky guess, a killer question you'd just drilled, a calm clear head, or (rarely) answers marked one row off on the OMR card.
  - **Admissions:** each university's real cut moves a little every year without warning (sd 0.45 percentile points: a 펑크 or a 폭발), and a rejection can still turn into a February waitlist call (추가합격) at a quarter of the chance you had.
  - Everything is seeded: the same seed gives the same fortune, family shocks happen on the same stream, and 수능 day and the paper's fit depend only on the seed and the sitting, never on how you played.
- **Families from real income data:**
  - You're born into one of the five national household-income fifths, each with a 20% chance.
  - The family sets your education budget. Money the parents don't spend on you that turn stays with them.
  - Your own savings (New Year's money from relatives, gifts, a part-time job from High 1) cover anything over the budget.

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
  - The score report also shows each section's Elementary 1 cut.
  - Before the track choice, the two inquiry slots are social studies and science.
- **Activities (one block each):**

  | Activity | When | Effect |
  |---|---|---|
  | Study a subject (×6) | always | Raises that subject's ability |
  | Read books 독서 | Elementary 1 to High 2 | Free. Builds Korean, with a little social studies and history |
  | Piano, taekwondo & co. 예체능 | Elementary 1 to Middle 3 | ₩150,000 a month. +Health, −Stress, +Motivation |
  | Timed practice exams 실전 모의고사 | High 1 on | Builds exam stamina (steadier scores on the day); small gains in every subject; stressful |
  | Rest & sleep 휴식 | always | −Stress, +Health |
  | Exercise 운동 | always | +Health, −Stress |
  | Hang out with friends 친구 | always | Big −Stress, +Motivation; sometimes leads to a PC방 invitation (from Elementary 5) |
  | Games & YouTube 게임 | always | −Stress, −Motivation |
  | Part-time job 알바 | High 1 on | +₩250,000 a month, +Stress, −Health |

- **Regions.** You're born in one of seventeen real places, and you can move:

  | Kind | Places | Cram school | Tutors | Prices | Life | Quotas |
  |---|---|---|---|---|---|---|
  | Seoul's cram-school capital | Gangnam (Daechi-dong) | ×1.15 | ×1.10 | ×1.4 | more pressure (+2 stress a turn, higher motivation) | none |
  | Seoul academy district | Nowon (Junggye-dong), Mokdong | ×1.1 | ×1.07 | ×1.25 | more pressure (+1.5 stress a turn, higher motivation) | none |
  | Seoul | Mapo, Gwanak, Gangdong | ×1.05 | ×1.05 | ×1.15 | a little more pressure | none |
  | Capital-region city | Suwon | ×1 | ×1 | ×1 | | none |
  | Big city | Busan, Daegu, Gwangju, Daejeon | ×0.97 | ×0.97 | ×0.95 | | local |
  | Mid-sized city | Pohang, Jeonju, Cheongju, Jeju | ×0.9 | ×0.9 | ×0.85 | calmer | local |
  | Rural county | Pyeongchang, Haenam | ×0.75 | none to hire | ×0.7 | calmer, healthier | local and rural |

  - **Where you're born is random, with the chance of each place equal to its share of Korea's 2024 registered population.** Each place stands for a group of real areas, so the twelve add up to the whole country:

    | Place | Stands for | Chance |
    |---|---|---|
    | Gangnam | Gangnam, Seocho and Songpa districts | 3.2% |
    | Nowon (Junggye-dong) | northeast Seoul: Nowon, Dobong, Gangbuk, Seongbuk, Jungnang, Dongdaemun | 4.4% |
    | Mokdong | southwest Seoul: Yangcheon, Gangseo, Guro | 2.7% |
    | Mapo | northwest and central Seoul: Mapo, Seodaemun, Eunpyeong, Jongno, Jung, Yongsan | 3.1% |
    | Gwanak | south Seoul: Gwanak, Dongjak, Geumcheon, Yeongdeungpo | 2.9% |
    | Gangdong | east Seoul: Gangdong, Gwangjin, Seongdong | 2.0% |
    | Suwon | Gyeonggi and Incheon | 32.6% |
    | Busan | Busan and Ulsan | 8.5% |
    | Daegu | Daegu | 4.6% |
    | Gwangju | Gwangju | 2.7% |
    | Daejeon | Daejeon and Sejong | 3.6% |
    | Pohang | Gyeongsang provincial cities | 8.2% |
    | Jeonju | Jeolla provincial cities | 4.3% |
    | Cheongju | Chungcheong and Gangwon cities | 7.3% |
    | Jeju | Jeju | 1.3% |
    | Pyeongchang | rural counties of Gangwon, Chungcheong and Gyeongsang | 6.1% |
    | Haenam | rural counties of Jeolla | 2.5% |

    Shares are approximate (district and sub-provincial splits and the rural-county total of about 4.4 million are estimates). Moving to Gangnam or Mokdong takes an upper-middle-income family, to Nowon, Mapo or Gangdong a middle-income one, and to Gwanak a lower-middle-income one.
  - **Your family is dealt next, from that place's mix of incomes.** The region-by-income table is balanced (iterative proportional fitting) so every place keeps exactly its population share and every income fifth stays exactly 20% overall, while a child born in Gangnam is in the top fifth half the time (3% in the bottom fifth), and a rural child is in the bottom fifth 36% of the time (8% in the top).
  - **Cram school and tutor** multipliers apply to the method's study speed and price. A retake academy's speed follows its region too.
  - **Quotas** (real 정시 practice, simplified as points off a university's cut; both need middle and high school in the region, so you must arrive by Middle 1):
    - 지역인재 (local quota): 0.6 points at medical school, and at the local national university (Pusan National for Busan, Kyungpook National for Daegu and Pohang), for students outside the capital region;
    - 농어촌 전형 (rural quota): 0.8 points at most universities for rural students.
  - **Moving** is the family's decision: a block of packing next turn, +8 stress, −3 motivation, and the new-kid risk of bullying (moving can also end bullying at the old school, 70%). You can move once every 12 months; Seoul takes a middle-income family or above, Gangnam an upper-middle one.
  - **Region events:** typhoons closing school on Jeju, the Pohang earthquake, beach days on the coast, harvest weekends in the countryside, Gangnam's race to study years ahead, the long bus ride to a rural cram school, news of the medical-school local quota, and capital-region parents moving to Daegu for that quota (의대 지방 유학). The Daechi-dong event now really moves you to Gangnam.
  - The scene outside your window follows the region: city, sea or countryside.
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
- **About 30 random events** with conditions (by school grade, family, phone ownership, stress, retakers, 반수 students). After an event fires it can't recur for 4 months. Fixed milestones always fire: the free-semester career week (Middle 1), 중2 (Middle 2) and D-100 (August of each 수능 year).
- **Bullying (학교폭력)**, a storyline that lasts until it's resolved:
  - **When:** it can start in Elementary 3 to High 2, most often in middle school. It's twice as likely for a year after you move (Daechi-dong) or change schools, and 1.4× as likely when your last plan had no time with friends. Each earlier episode halves the chance, and a new episode can't start within a year of the last one ending. About 3 in 10 lives meet it.
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
  - **Cost by High 3:** in a paired test (the same 200 lives cloned at the start of Middle 1 with serious bullying), reporting it costs about 1 point of average ability entering High 3 and enduring it about 4.
- **Early childhood (age 0–5).** A turn is a year with three blocks; your parents plan your days, and small children learn by playing:

  | Activity | What it does |
  |---|---|
  | Picture books 그림책 | Korean, with some history and social studies |
  | Blocks & puzzles 블록·퍼즐 | Math and a little science |
  | English songs 영어 동요 | English, a little Korean |
  | Worksheets 학습지 (from 4) | Korean and math; ₩40,000 a month and a little stress |
  | Naps, the playground, playdates, cartoons | rest, exercise, friends and games under their early names |

  - At 3 you pick daycare or kindergarten (free under the national 누리과정, with kindergarten lessons), staying home with family (few lessons, less stress, no kindergarten colds), a forest kindergarten (₩150,000, outdoors: less stress, more health) or an English kindergarten (₩900,000, English lessons ×3, big cities only).
  - Events of the early years: first steps, first words, a fall off the slide, a new baby brother or sister, grandma's stories, kindergarten colds and the kindergarten play, whether to start Hangul early, and a gifted-child test at 5.
  - **Balance:** ability at birth is 0.66 below the old age-6 start, and a typical early childhood (the balanced bot at an ordinary kindergarten) closes exactly that gap, so a typical child still starts Elementary 1 where it always did. A child who only plays and watches cartoons starts about 6 points lower; one who reads, builds and sings every year starts about the same as typical or a little ahead.
- **Traits** are passive bonuses for the whole life, dealt by two reveal events. Each is rolled from its own seeded stream, so the seed fixes them the way it fixes your family and talents. The Ability panel lists yours with what they do.
  - **Temperament** (your first weeks), one of:

    | Trait | Effect |
    |---|---|
    | Sturdy 튼튼한 아기 | health settles 8 higher; half as many colds and flu |
    | Easygoing 순한 아기 | stress settles 6 lower |
    | Curious 호기심 많은 아기 | motivation settles 4 higher |
    | Good sleeper 잘 자는 아기 | rest works 50% better; no insomnia |
    | Unflappable 겁 없는 아기 | half the exam-day nerves and stress hit |
    | All smiles 잘 웃는 아기 | friends relieve 30% more stress; bullying 40% less likely |

  - **돌잡이** (your first birthday): a table of objects, and whatever you grab is said to foretell your future. About one baby in twelve grabs two at once and gets both.

    | Item | Effect |
    |---|---|
    | Pencil 연필 | Korean aptitude +0.25; reading works 25% better |
    | Book 책 | History and social studies aptitude +0.15 |
    | Computer mouse 마우스 | Math aptitude +0.25 |
    | Stethoscope 청진기 | Science aptitude +0.25 |
    | Microphone 마이크 | English aptitude +0.25 |
    | Judge's gavel 판사봉 | Korean and social studies aptitude +0.12 |
    | Ball 공 | exercise works 50% better; health settles 3 higher |
    | Thread 실 | health settles 5 higher; fewer colds and flu |
    | Money 돈 | ₩300,000 now; New Year's money ×1.5 |
    | Paintbrush 붓 | arts lessons count double toward an arts-school audition; stress settles 2 lower |

  - "Settles" means the resting level health and stress drift back to each turn; aptitude multiplies every study gain in that subject for life (the stars on the birth screen show it before the 돌잡이).
- **Schools.** At the start of each school stage a screen lists the schools you could go to, with what each does, its fees and your chance of getting in. The public school is the default and is always open. Fees come out of your parents' monthly education budget, so they compete with cram school and tutors, and a school is closed if the budget can't cover them. Missing out on a lottery or selection means the public school.

  | Stage | School | Fee a month | Getting in | What it does |
  |---|---|---|---|---|
  | Elementary | Public (공립초) | – | assigned | standard lessons |
  | | Private (사립초) | ₩800,000 | lottery, 50%; big cities only | lessons ×1.15, English ×1.5, +2 motivation, +1 stress |
  | Middle | Public (공립중) | – | assigned | standard lessons |
  | | Private (사립중) | – | lottery honours your preference 60% | lessons ×1.08, +1 motivation, +1 stress |
  | | International (국제중) | ₩700,000 | screening (grades well ahead of your year), then a 30% lottery | lessons ×1.1, English ×1.6, +3 motivation, +3 stress; boarding |
  | High | Public 일반고 | – | assigned | standard lessons |
  | | Private 일반고 | – | preference honoured 60% | lessons ×1.08, +1 motivation, +1 stress |
  | | Autonomous private (자사고) | ₩550,000 | selection on how far ahead you are, up to 85% | Korean, math, English lessons ×1.25, others ×1.1, +3 motivation, +3 stress |
  | | Science / gifted (과학고·영재학교) | ₩150,000 | math and science far ahead of your year, up to 70% | math and science lessons ×1.6, Korean ×0.9, sciences track only, +3 motivation, +5 stress |
  | | Foreign language / international (외고·국제고) | ₩500,000 | English and Korean well ahead, up to 75% | English ×1.6, Korean ×1.25, social studies ×1.15, math ×0.95, humanities track only |
  | | Arts / sports (예고·체고) | ₩400,000 | audition on years of arts & sports lessons, up to 80% | practice takes a block a turn, academic lessons ×0.7, +3 motivation, −3 stress |
  | | Vocational (특성화고·마이스터고) | – | 95% | workshop hours take a block a turn, academic lessons ×0.4, part-time pay ×1.5, −2 motivation, −3 stress |

  - "How far ahead" is your ability in those subjects against the typical level for your year (the line class ranks use), so selective schools reward studying ahead in childhood; a science school takes a real math-and-science focus.
  - The multipliers apply to school lessons (see Learning), not to your own study.
  - Moving house swaps a day school for the local public school; boarding schools (international middle, 자사고, science and foreign language schools) stay.
  - New events at special schools: dorm nights, the science school's R&E research project, the arts school showcase, paid placements at vocational schools, English week at a private elementary school, and the first-exam shock at an elite high school (for once you're in the bottom half).
  - The status card names your school.
- **Leaving school (자퇴)**, from Middle 1 (middle school) to High 2. The button opens a list of what you gain and what it costs, and it can't be undone.
  - **What you gain:**
    - two more free blocks every turn in Middle 1 to High 2 (6 instead of 4), because the hours that went to classes are yours (High 3 gains nothing, since a 고3's school day is mostly self-study already);
    - no school pressure in the daily stress, no class ranks, and any bullying ends;
    - pass the GED by High 2 and you're offered the 수능 a year early, with your age group's year left as a spare.
  - **What it costs:**
    - **No school lessons:** the passive gain in every subject (see Learning) stops, so only your own study moves you;
    - **The GED (검정고시)** must be passed first. It opens six months after you leave and comes round every four months or more. The pass chance is 60% plus up to 30% from your standing among your age group, plus 15% for each retry; cramming adds 25% but costs a block. From August of High 3 it always passes, so you're never shut out of the 수능.
    - **No local or rural quotas:** 검정고시 holders don't count as having gone to school in the region.
    - **Nobody sets the pace:** the motivation baseline is 8 lower until your first 수능, and a turn with no time for friends adds 3 stress.
    - **Your parents take it hard** (+6 stress, −4 motivation when you leave), and the relatives ask questions at Chuseok.
    - **No school events:** no olympiad, class elections, festivals or career week, and no High 1–2 mock exams (you still get High 3's).
  - **New events:** the GED (cram or go in as you are), the early 수능 offer, a lonely week when old classmates post trip photos, and the Chuseok questions.
  - **On screen:** the status reads "Out of school", the plan panel says lessons have stopped, the Condition panel says what it changes, you study in a hoodie at a study café, and the diary notes it in your age group's terms ("your age group moves up to Middle 3").
  - **In the balance tables:** leaving at High 1 does a little worse than staying, for the balanced bot and for the smart one: the extra blocks don't quite make up for the lessons. Leaving at Middle 1 and sitting a year early costs more, since you sit with a year less of growth, but leaves you a spare year.
- **Ability chart** across every stage and attempt, a **life log**, and an **exam history** table with every 수능 and the current year's mocks.
- **Deterministic:** the seed fixes the family, the talent roll, every paper, and the cohort you're graded against. Your choices only change your own answers.
- **Two complete languages, English and Korean**, never mixed. Switching mid-game re-renders everything, including past log entries.
- **Ages are international (만 나이):** Elementary 1 starts at 6 and High 3 at 17; the Korean version writes "만 17세".
- **An illustrated life.** All the artwork is original inline SVG drawn by `art.js` (no image files), and it follows the light and dark themes (dark mode turns day into dusk):
  - **A scene of where you are**, with you standing in it: an elementary classroom with drawings on the cork board, the middle-school hallway, your desk late at night in high school (with a D-day calendar in High 3), the retake academy's lecture room, a study-café cubicle, the university campus during 반수, the exam hall in November, home on results night, and the university gate (with its name) or an open road at the end. Windows show the season: cherry blossoms in spring, sun in summer, falling maple leaves in fall, snow in winter.
  - **An avatar that grows up:** a child with a yellow backpack, a teenager in school uniform, a retaker in a hoodie, a student in casual clothes. Hair, skin tone and shirt colour come from the seed. The face shows your mood (happy, okay, drained, stressed or sick, from the condition bars), it blinks and breathes, and a thought bubble says what's on your mind.
  - **A picture for every event** (sports day, the olympiad medal, the smartphone, Daechi-dong's neon academies, the bully, class elections, 중2's slammed door, the PC방, a cold, the star lecturer, the crush's note, the D-100 banner, grandma's envelope, insomnia sheep and more), redrawn for how it turned out. Events the art doesn't know yet fall back to a matching picture by id prefix or keyword, then to one for your life stage.
  - Illustrated birth (your family's home, from a rooftop room to a riverside tower), track choice, mock exams, exam day, score report and applications.
- **Cutscenes.** Life's milestones play as short animated films before their screen: a letterboxed stage where the camera pans and zooms while people walk, things drop, ring, grow and get stamped, with a caption per shot, a progress bar, a Skip button, and a tap (or Enter / Space) to cut to the next shot. Each is 6–13 seconds, drawn in code like the rest of the art and personalised with your looks, your family's home, your region's window view, your school's or university's name and your 돌잡이 item:

  | Film | When | Shots |
  |---|---|---|
  | Birth | the birth screen | a lit hospital window at night, the first cry over the bassinet, your parents carrying you home |
  | 돌잡이 | after the first-birthday event | the party (folding screen, rice-cake tower, relatives), you toddling to the table, the item you actually grabbed (or both) held up in confetti |
  | First day of school | first plan screen of Elementary 1 | out of the front door, the walk with classmates, waving at the gate with your school's name |
  | Middle school, high school | first plan screen of Middle 1 and High 1 (not after leaving school) | the new uniform in the mirror, the walk, the new gate |
  | 수능 morning | before each 수능 | a cold dawn walk with a parent, a police motorcycle racing a late student, juniors cheering at the test-site gate, 08:40 and the bell |
  | Results | before each score report | the phone buzzing, the four sections' grades filling in, your face (and your parents') |
  | Admission | when offers arrive (only if there's at least one) | the family at the laptop, the stamp, everyone jumping in confetti |
  | The end | the ending screen | a suitcase on a spring road, through the university gate, the camera pulling back; with no university, a dusk road instead |
  | Moving house | the turn you move (by choice or by an event) | the truck pulling away, the view from the new window |

  - Which films have played is saved with the life (`seenCuts` on the save), so a reload never replays one; a save from before cutscenes starts with whatever it's sitting on marked as seen.
  - The 🎬 button in the header turns cutscenes off or on (remembered in the browser).
  - With reduced motion, each shot is a still frame with its caption, shown a little longer.
- **Choosing how to live:** each turn's free time is a row of slots, and activities are cards with icons. Tap a card (or its +) to give it a block, tap a filled slot to take it back.
- **Feedback that feels like time passing:** a calendar page flips between turns ("A year goes by", the new date and your age), ability bars grow and the gains float up, exam day plays out period by period, score reports reveal row by row and count up, admission results land as 합격/불합격 stamps one at a time, and confetti falls when you get in.
- **The life log is a diary:** newest first, a heading for each school year with your age, and an icon for each kind of entry.
- All motion respects `prefers-reduced-motion`: the pictures stay, the movement stops.
- Light and dark themes; works at phone width.

## How the exam is simulated

- **Ability:** each subject has a latent ability θ on the scale of the 수능 test takers (mean 0, sd 1). The bars show it as 0–100, where 50 + 16.7·θ, so 50 is average and 100 is θ = 3. At age 6, θ is your talent minus 2.4, so a child of average talent starts around 10.
- **Questions** follow the real layouts: 국어 and 영어 have 45 questions, 수학 has 30 (some short-answer), 한국사 and each 탐구 have 20, with 2-, 3- and 4-point items.
  - Each question has an item-response curve: P(correct) = c + (1 − c) / (1 + e^(−1.7·a·(θ − b))).
  - Guessing c is 0.2 for multiple choice and 0 for short answer.
  - Each paper places a few "killer" questions among the high-point items. In the 탐구 papers they are hard enough that only about 0.5–2% of a subject's takers score 50/50, so a perfect inquiry paper is worth a 99–100 percentile, as in real years.
- **Year-to-year difficulty:** each paper gets a random shift, which makes 불수능 and 물수능 years. The score report's headline names an unusually hard or easy section.
- **The cohort:** each sitting simulates 3,000 test takers per subject. Your standard score, percentile and grade come from your place among them. Inquiry pools differ in strength (Physics I takers are stronger than Earth Science I takers), so the subject choice matters.
- **Exam day:** your ability on the day is θ plus:
  - a stress penalty (above 65) and a health penalty (below 45), each at most −0.25;
  - first-수능 nerves, which practice reduces;
  - the night-before and lunch-box choices;
  - random day form, whose spread shrinks with exam stamina;
  - **luck:** a whole-day swing on 수능 day (sd 0.35 θ on every subject, plus 0.06 × your fortune), how well each paper fits you (sd 0.18 θ a subject, mocks too), and the day's event if there is one (−0.1 on every subject for a sniffling neighbour, +0.08 for a clear head, +0.3 or +0.4 on one subject for a lucky guess or a drilled killer question, −0.6 on one subject for an OMR slip).
- **Learning:**
  - each block on a subject adds 0.24 × subject rate × aptitude × method speed × condition × headroom(θ) × √(months in the turn), times 0.32 during the school years (Elementary 1 to High 2);
  - **school lessons** add to every subject each turn on their own, whatever you do with your blocks, from Elementary 1 through High 3 (not after leaving school): 0.4 a year × the months in the turn / 12 × subject rate × aptitude × how far behind the class you are × attention × headroom(θ). "Behind" is 0.5 + 0.5 × (the typical level for your grade − your θ), kept between 0.4 and 1, so lessons help most when you're behind and a little even when you're far ahead. Attention is 0.6 + 0.4 × motivation/100, times the health and bullying factors. The typical level climbs 0.28 a school year from −2.4 at Elementary 1 (the balanced bot's path); class ranks and the GED use the same line. For an average child, lessons add up to about a third of the climb to High 3. The diary shows each turn's lesson total;
  - condition = the motivation, health and stress factors, times the bullying factor (1, or 0.9–0.7) while you're being bullied;
  - headroom(θ) = e^(−0.62·max(0, θ + 0.8)) gives diminishing returns: going from average to top 4% is far quicker than from top 4% to a perfect score;
  - a second block on the same subject in one turn counts ×0.77, a third ×0.63, and so on;
  - **no decay:** ability only goes up. A subject you don't study stays where it is;
  - subject rates are 국어 0.8, 수학 1.0, 영어 0.95, 한국사 1.6, 탐구 1.3;
  - **early childhood:** each block of play adds 0.1 × its share of a subject × aptitude × condition × headroom(θ) (picture books: Korean 0.6, history 0.3, social studies 0.45; blocks: math 0.7, science 0.5; songs: English 0.8, Korean 0.15; worksheets: Korean and math 0.5), and kindergarten lessons add 0.12 a year × subject rate × aptitude × the kindergarten's multiplier × condition × headroom(θ).

### University admission (rough)

- **Admission score** = average 백분위 of 국어, 수학 and the two 탐구 (counted as one), minus:
  - an English deduction by grade: 0, 0, 0.8, 2, 3.5, 5.5, 8, 11, 14 for grades 1–9;
  - 0.5 for History grade 4, or 2 for grade 5 and worse.
- **Quotas** you qualify for (see Regions) take 0.6 (local) or 0.8 (rural) points off the cut; the application list marks them.
- **This year's cut is a surprise:** the chances on the application screen use the expected cut, but the real one moves each year (sd 0.45 points), and a rejection becomes a February waitlist admit (추가합격) at 25% of the real chance.
- **Each school has a cut** where an application is a coin flip. The chance of admission follows a logistic curve with a 0.7-point slope, narrowed near the top to a third of the room left above the cut (0.4 points for 의대), so a perfect exam is a near-certain admit everywhere.
- **The top end:** with every bar at 100 (θ = 3, the top 0.13% of test takers) and a good exam day, you are a likely SNU admit (about 70–80%) and roughly a coin flip for 의대 (about 45–65%, depending on how strong your inquiry subjects' pools are). A flawless exam gets you into 의대 85–90% of the time.
- **Labels:** 안정 (safe, 85%+), 적정 (match, 55%+), 소신 (reach, 25%+), 상향 (long shot).

The cuts are ballpark figures from recent 정시 years, simplified to one per school. They are not an admissions predictor.

| School | Cut | School | Cut |
|---|---|---|---|
| 의대 (Medical school, 이과 only) | 98.8 | 중앙대 | 94.2 |
| 서울대 | 98.0 | 서울시립대 | 93.8 |
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

`node suneung/sim.js` runs three checks:

- **Calibration** compares the simulated cohort with real 수능 numbers.
- **The top end** checks that a perfect 탐구 paper earns a 99–100 percentile and what a player with every bar at 100 can get into.
- **Balance** plays whole lives, from birth, with simple bots and reports the results.

Run it after any change to the exam or learning model. The tables below come from `node suneung/sim.js --seeds 80`.

### Calibration

Means over 40 sittings.

| Section | Mean raw | Elementary 1 cut | Top 표준점수 | Elementary 1 share | Real target |
|---|---|---|---|---|---|
| 국어 | 59.2 | 90.0 | 141.3 | | cut 84–92, top 135–150 |
| 수학 | 45.8 | 88.2 | 147.1 | | cut 84–88, top 135–148 |
| 영어 | 57.7 | | | 8.9% | 4–10% grade 1 |
| 한국사 | 32.1 | | | 33.2% | 15–35% grade 1 |
| 탐구 | 30.7 | 45.8 | 68.7 | | cut 44–50, top 63–77 |

### The top end

A player whose every bar is at 100, and one who gets every answer right, sitting 150 papers on the sciences track with no exam-day noise:

| Player | Percentile of a perfect 탐구 paper | Admission score | SNU | 의대 |
|---|---|---|---|---|
| All bars at 100, Physics I + Chemistry I | 98.7 | 98.55 | 68% | 46% |
| All bars at 100, Life Science I + Earth Science I | 99.5 | 99.05 | 80% | 65% |
| Every answer right, Physics I + Chemistry I | 99.0 | 99.56 | 91% | 85% |
| Every answer right, Life Science I + Earth Science I | 99.6 | 99.78 | 93% | 91% |

Before v2.4 these were 42%/26%, 59%/40%, 62%/42% and 74%/56%: up to 9% of a strong pool tied at 50/50, so a perfect 탐구 paper could be worth as little as the 91st percentile.

### Strategy bots

80 lives each, with families dealt from the real quintiles.

- The bots always pick the first option at events (for bullying, that means telling a teacher and then reporting it).
- "Best affordable" means the most expensive study method the family's budget covers that turn.
- In early childhood the bots play their own way: balanced mixes picture books, blocks, songs, playdates and the playground; the slacker watches cartoons and plays; the grinder and smart bots stick to picture books, blocks and songs. All of them go to an ordinary kindergarten.
- "smart" looks after stress and health, reads in elementary school, adds a timed practice exam in October of High 3, and studies the subject with the most room to grow. It skips English past about the 90-point level and History once it is safe.
- The bots apply to one reach, one match and one safe school.
- "Start" is the average ability (0–100) entering High 3.

| Strategy | Start | First 수능 국·수·영 grades | First total | Last total | Tries | SKY+ | 의대 | In-Seoul+ |
|---|---|---|---|---|---|---|---|---|
| balanced, self-study, 1 try | 61 | 2.7 · 2.2 · 1.9 | 365 | 365 | 1.00 | 0% | 0% | 44% |
| slacker (half games & friends), 1 try | 56 | 3.3 · 2.7 · 5.1 | 349 | 349 | 1.00 | 0% | 0% | 13% |
| grinder (no rest), self-study, 1 try | 66 | 2.9 · 2.5 · 2.2 | 370 | 370 | 1.00 | 1% | 0% | 50% |
| smart, online lectures, 1 try | 66 | 2.3 · 2.0 · 2.0 | 381 | 381 | 1.00 | 3% | 0% | 69% |
| smart, best affordable method, 1 try | 68 | 2.0 · 1.9 · 2.0 | 385 | 385 | 1.00 | 11% | 1% | 75% |
| smart, best affordable, retakes up to 3 tries | 68 | 2.0 · 1.9 · 2.0 | 385 | 411 | 2.49 | 75% | 25% | 100% |
| smart, best affordable, 이과, chasing 의대, up to 5 tries | 68 | 2.1 · 1.9 · 1.9 | 385 | 419 | 3.60 | 91% | 83% | 99% |
| smart, best affordable, tries for selective schools, 1 try | 68 | 2.1 · 1.8 · 1.8 | 385 | 385 | 1.00 | 11% | 3% | 81% |
| smart, best affordable, 이과, tries for a science high school, 의대 up to 5 tries | 68 | 2.1 · 1.9 · 1.9 | 383 | 419 | 3.56 | 93% | 84% | 99% |
| balanced, self-study, vocational high school, 1 try | 59 | 2.9 · 2.4 · 2.1 | 354 | 354 | 1.00 | 0% | 0% | 23% |
| balanced, self-study, leaves school at High 1, 1 try | 61 | 3.0 · 2.6 · 2.3 | 360 | 360 | 1.00 | 0% | 0% | 30% |
| smart, best affordable, leaves school at High 1, 1 try | 68 | 2.0 · 1.9 · 2.1 | 385 | 385 | 1.00 | 9% | 0% | 73% |
| smart, best affordable, leaves at Middle 1, 수능 a year early, 1 try | 63 | 2.3 · 2.0 · 2.3 | 378 | 378 | 1.00 | 3% | 1% | 53% |

How much luck spreads lives that follow the same strategy, before (v4.1) and after the luck changes (v4.2). "Skill r²" is how much of the spread in first totals is explained by ability entering High 3; the rest is luck (the exam day, the paper, an accident in High 3, a family that can suddenly afford tutors, or can't):

| Strategy | Mean first total | Spread (sd) | 10th–90th percentile | p90 − p10 | Skill r² |
|---|---|---|---|---|---|
| balanced, self-study, 1 try | 369 → 365 | 19.3 → 24.2 | 350–392 → 332–395 | 42 → 63 | 0.50 → 0.30 |
| smart, best affordable method, 1 try | 388 → 385 | 17.3 → 20.2 | 366–411 → 360–407 | 45 → 47 | 0.53 → 0.45 |

The smart bot with the best affordable method, first try only, by the family it ended up in (fortunes move families up and down a fifth during a life):

| Family | Lives | Start | First total | SKY+ | In-Seoul+ |
|---|---|---|---|---|---|
| Low income | 16 | 67 | 385 | 13% | 81% |
| Lower-middle income | 23 | 67 | 386 | 9% | 74% |
| Middle income | 12 | 70 | 391 | 17% | 67% |
| Upper-middle income | 20 | 69 | 379 | 5% | 75% |
| High income | 9 | 70 | 389 | 22% | 78% |

By region kind, where the life ended up (the same smart bot, first try; 의대 is the bot chasing it, within five tries). The bots always take an event's first option, so many high-income bot families accept the Daechi-dong move, which is why Gangnam has more lives here than its birth share:

| Region | Lives | Start | First total | SKY+ | In-Seoul+ | 의대 |
|---|---|---|---|---|---|---|
| Gangnam | 10 | 70 | 391 | 20% | 80% | 90% |
| Seoul academy district | 7 | 69 | 387 | 0% | 86% | 86% |
| Seoul | 5 | 71 | 398 | 20% | 80% | 100% |
| Capital-region city | 23 | 67 | 383 | 9% | 78% | 74% |
| Big city | 13 | 70 | 382 | 8% | 77% | 92% |
| Mid-sized city | 13 | 68 | 386 | 8% | 62% | 69% |
| Rural county | 9 | 65 | 377 | 22% | 67% | 89% |

What each trait is worth, in a paired test: the same 80 lives (smart bot, best affordable method, first try) replayed with only that trait, against the same lives with none (in-Seoul+ 73% with none). A trait changes which events happen and when, so differences of a point or two are within the noise:

| Trait | Δ start | Δ first total | In-Seoul+ |
|---|---|---|---|
| Sturdy (튼튼한 아기) | +0.7 | +2.4 | 75% |
| Easygoing (순한 아기) | +0.0 | -0.3 | 69% |
| Curious (호기심 많은 아기) | +0.5 | +1.0 | 70% |
| Good sleeper (잘 자는 아기) | -0.0 | +0.3 | 70% |
| Unflappable (겁 없는 아기) | +0.0 | +0.9 | 71% |
| All smiles (잘 웃는 아기) | -0.1 | +0.2 | 74% |
| Pencil (연필) | +1.8 | +5.4 | 80% |
| Book (책) | +1.0 | +3.1 | 76% |
| Computer mouse (마우스) | +1.2 | +4.0 | 73% |
| Stethoscope (청진기) | +1.0 | +5.0 | 81% |
| Microphone (마이크) | +0.9 | +3.3 | 74% |
| Judge's gavel (판사봉) | +1.1 | +2.5 | 75% |
| Ball (공) | +0.3 | +2.3 | 75% |
| Thread (실) | +0.7 | +1.5 | 76% |
| Money (돈) | +0.2 | +0.9 | 75% |
| Paintbrush (붓) | +0.0 | +2.1 | 81% |

What the tables show:

- **School lifts everyone, habits decide the rest:** lessons carry even the slacker to 56 by High 3, and the same random talents end up anywhere from 56 to 68 on average depending on how you spend your free time, from birth on.
- **Traits are a head start, not a destiny:** a 돌잡이 subject (pencil, microphone, stethoscope) is worth a few points to a bot that spreads its study, and more to a player who leans into that subject; the temperaments mostly make life more comfortable.
- **Luck now decides a lot:** two lives with the same habits and similar ability can end 60 points apart. For the balanced bot, ability entering High 3 explains only about a third of its first total. The smart bot is squeezed by the top of the scale, so its spread widens less, but strong play still wins on average (about 20 points over the balanced bot).
- **Family income matters, but it moves:** families change fifths two or three times a life, so where you're born matters less than it did, and a promotion or a layoff in High school can matter more. Retakes close much of the gap either way.
- **Where you live matters too:** Gangnam's academies give the strongest start, while local and rural quotas help students outside the capital (the region groups above are small, so treat them as a direction, not exact rates).
- **School choice nudges rather than decides:** the bot that tries for selective schools mostly lands in private ones by lottery (a few get into 자사고 or an international middle school) and does slightly better; the smart bot rarely studies far enough ahead in math and science for a science school; a vocational school costs a 수능 candidate about 9 points of total and a block a turn.
- **Leaving school is a trade, not a shortcut:** the extra hours almost make up for the lost lessons, motivation and the GED, but not quite, and you lose the quotas; what you gain is freedom from school (and bullying) and a spare year if you sit early.
- **Retakes** add about 10–20 points of 국수탐 standard total each.
- **Medical school** takes talent, a sciences track and usually several years: the bot chasing it rarely gets in on the first try, but a near-optimal player who keeps retaking usually makes it within five.

## Files

- `engine.js`: the game, with no DOM, so it runs in Node. It holds no display text: log entries, events and outcomes are message keys with values.
  - `Game` holds the state and the screen queue: `advance(plan, method)`, `choose(i)`, `dismiss()`, `chooseTrack(track, inq)`, `apply(ids)`, `decide(d)`.
  - It also holds the life stages, families, the exam simulation (`gradeSubject`), events, universities and constants.
- `strings.js`: every piece of text, as an English and a Korean dictionary with the same keys. `make(lang, ctx)` returns the translator, including Korean money (만/억) and particle (이/가) handling.
- `art.js`: the artwork, as SVG strings built in code (no DOM, no image files; the only words drawn are names app.js passes in, in the current language). `scene(ctx)` draws the life-stage scene with the avatar, `eventArt(ctx)` an event's illustration (data-driven through `EVENT_ART`, with fallbacks for unknown event ids), `screenArt(name, ctx)` the birth, track, mock, exam, report, application, offers and ending pictures, `cutscene(name, ctx)` a cutscene's shots (each an SVG plus its length; the motion is CSS keyframes in `styles.css`), and `moodOf(game)` / `lookFor(seed)` the avatar's mood and looks. Colours are `--a-*` tokens in `styles.css`.
- `app.js`: UI only. It renders the state and whatever screen is first in `game.queue`, and plays a milestone's cutscene first (`pendingCut` / `playCut`).
- `sim.js`: the headless calibration and strategy-bot script.

## Changelog

- **v4.3:** cutscenes. Nine short animated films play at life's milestones (birth, the 돌잡이, the first days of elementary, middle and high school, 수능 morning, results, admission, the ending, and moving house): letterboxed SVG shots with a moving camera, walking characters, captions in both languages, a progress bar, Skip and tap-to-advance. They're personalised (your looks, home, region, school and university, the item you grabbed), play once per life even across reloads, can be turned off with the 🎬 button, and become still frames under reduced motion. Gameplay and balance numbers are unchanged.
- **v4.2:** luck. A fortune-teller's reading (사주) at birth reveals a hidden fortune that tilts good and bad events. Families change income fifths two or three times a life (promotions, inheritances and lottery wins; layoffs, jeonse scams, a parent's illness). Car accidents and hospital stays cost blocks; a great teacher or a sudden passion raises an aptitude; Middle 2 reshuffles every aptitude. 수능 day swings as a whole, each paper fits you better or worse, and about half the time the day deals something (a sniffling neighbour, a lucky guess, a drilled killer question, an OMR slip). Real cuts move each year and rejections can come good off the February waitlist. Lives spread much more for the same play (the balanced bot's 10th–90th percentile range went from 42 to 63 points), while strong play still wins on average. `sim.js` prints a spread table and takes `--no-traits` to skip the slow trait test. Also fixes the beach and countryside event pictures, which threw an error. Balance tables regenerated.
- **v4.1:** aptitude is always visible. Ability bars end in aptitude stars (gold for ★★★ and up), study cards show the stars and how much less (or more) study the subject takes to max out, and a note under the bars explains it. Gameplay and balance numbers are unchanged.

- **v4.0:** life starts at birth. Ages 0–5 are played a year at a time with play instead of study (picture books, blocks, songs, worksheets from 4, naps, the playground, playdates, cartoons), a kindergarten choice at 3 (daycare or kindergarten, home, forest kindergarten, English kindergarten) and ten early-years events. Two random reveal events deal **traits**, permanent passive bonuses: your temperament in your first weeks (sturdy, easygoing, curious, good sleeper, unflappable, all smiles) and the 돌잡이 at your first birthday (pencil, book, mouse, stethoscope, microphone, gavel, ball, thread, money, paintbrush; sometimes two at once). The Ability panel lists them. Ability at birth is set so a typical early childhood arrives at Elementary 1 exactly where the old age-6 start was. `sim.js` plays the early years and adds a paired test of what each trait is worth. Balance tables regenerated. Saves from before still load and carry on from elementary school.

- **v3.2:** schools, and Korean grade names. At the start of elementary, middle and high school you pick a school: public or private at every stage, a private elementary school in big cities, an international middle school, and at high school 자사고, science and gifted schools, foreign language schools, arts and sports schools, and vocational schools. Each has its own fees (out of the education budget), lottery or entry requirement, lesson strengths, pressure and track limits, plus a few events of its own. Picking the public school changes nothing, so the earlier balance numbers are unchanged; three new bots show the school paths. The English version now counts school years the Korean way (Elementary 1–6, Middle 1–3, High 1–3) instead of grades 1–12, everywhere from the plan title to the diary and the chart.

- **v3.1:** school lessons. Being at school now raises every subject a little each turn on its own, whatever you do with your free blocks, from grade 1 to grade 12. Lessons help most when you're behind the class and less when you're far ahead, and they depend on attention (motivation, health, bullying). The plan panel says so, and the diary shows each turn's lesson total. Leaving school stops them. To keep the top end where it was, study during the school years counts a little less (×0.32 instead of ×0.5), and dropouts no longer get extra blocks in grade 12. Average and lazy players now reach grade 12 much stronger (the balanced bot starts at 61 instead of 42), the smart bot's start is unchanged, and staying in school now beats leaving. Balance tables regenerated.

- **v3.0:** leaving school (자퇴). From grade 7 to grade 11 a Leave school button lets you drop out, after a list of what you gain and what it costs. You get two more blocks a turn (grade 12 at a retaker's 6), no school pressure or class ranks, and an end to bullying; you can sit the 수능 a year early once the GED is passed by grade 11. In exchange you must pass the GED (검정고시), lose the local and rural quotas, study with a lower motivation baseline and get lonely without friends, upset your parents, and miss the school events and grade 10–11 mocks. Four new events (the GED, the early 수능 offer, loneliness, Chuseok questions), new art, and two dropout bots in the balance table; the other numbers are unchanged. Saves from before still load (you're still at school).

- **v2.9:** more of Seoul and Jeju. The rest of Seoul (outside the Gangnam districts) is now five areas with their own population shares: Nowon (Junggye-dong) and Mokdong, a new Seoul academy-district kind a step below Daechi-dong, plus Mapo, Gwanak and Gangdong. Jeju gets its own entry (outside the capital, so the medical-school local quota applies) with a typhoon event. Seventeen places in all; balance tables regenerated.
- **v2.8:** your birth region is now drawn purely by population share (2024 registered population, each of the twelve places standing for a group of real areas), and your family is dealt from that place's income mix. A balanced region-by-income table keeps both exact: every place at its population share, every income fifth at 20%. Balance tables regenerated.
- **v2.7:** regions. You're born in one of twelve real places (Gangnam, Nowon, Suwon, Busan, Daegu, Gwangju, Daejeon, Pohang, Jeonju, Cheongju, Pyeongchang, Haenam), weighted by population and linked to family income. Regions change cram-school and tutor strength and prices (no tutors in rural counties), daily pressure, and admission quotas (지역인재 local quota for medical school and local national universities; 농어촌 rural quota), which need middle and high school in the region. A Move house button relocates the family once a year (housing limits for Seoul and Gangnam; a new school, a lost block and new-kid risk). New region events (Pohang earthquake, beach, countryside, studying ahead in Gangnam, the rural commute, quota news, moving for the medical-school quota), the window view follows the region, and the Daechi-dong event now really moves you. Balance tables regenerated, with a new by-region table.
- **v2.6:** choose to be a boy or a girl. It sets how you're drawn (short hair, trousers and a tie, or long hair or a bob, a skirt and a ribbon on the school uniform), the default name (Minjun / Seoyeon), and the birth line; the rules are the same. Fixes: a finished life reopens on its ending instead of the new-life screen (and the hall of fame no longer double-counts it); ability past the top of the scale shows "100+" instead of looking stuck at 100; choosing a full retake after a 반수 year now leaves that school, so it stops being offered (the retake buttons say so); the age shown after enrolling now matches the diary; the mood bubble no longer covers the school's name on the gate. Saves from before the choice keep their old look.
- **v2.5:** an illustrated, animated interface, so it feels like living a life rather than reading a dashboard. A scene for every life stage with an avatar that grows up and shows its mood, a picture for every event and screen, activity cards and time slots for planning, a calendar page between turns, animated ability gains, a period-by-period exam day, stamped admission results, confetti, and a diary-style life log. All art is original inline SVG in the new `art.js`. Gameplay, saves and balance numbers are unchanged. When a turn ends with an event, the event card waits for the calendar page to finish instead of opening underneath it.
- **v2.4:** SNU and medical school are reachable at the top. A perfect 탐구 paper used to be worth only the 91st–98th percentile, because 3–9% of a subject's takers tied at 50/50; with every bar at 100 you had about a 40–60% shot at SNU and 25–40% at 의대, and even a flawless exam was turned down by 의대 almost half the time. The inquiry papers' killer questions are now harder (only 0.5–2% score 50/50, so a perfect paper is worth 99–100), the SNU and 의대 cuts moved to where the top 0.3% and 0.15% of simulated test takers land (98.0 and 98.8), and the admission curve narrows near the ceiling. A player with every bar at 100 is now a likely SNU admit and about a coin flip for 의대. `sim.js` prints a new top-end check. Balance tables regenerated. Also: the PC방 event starts in grade 7 instead of grade 5, the family-money event no longer fires before grade 4, and the Korean grade line uses the right particle ("중2가 되었다").
- **v2.3:** bullying (학교폭력) is now a storyline instead of a one-off event. It can start in grades 3–11 and lasts until it's resolved, with a follow-up choice every turn: report it to the school violence committee, see the Wee class counselor, stick with friends, fight back, endure it, or change schools when it turns severe. While it lasts, study efficiency drops 10–30% and stress, motivation and health suffer; severe bullying costs a block a turn. The Condition panel shows it. Saves from v2.2 still load. Balance tables regenerated.
- **v2.2:** ages use the international count (만 나이): you start grade 1 at 6, so a grade-12 student is 17. The Korean version writes ages as "만 6세". Gameplay and balance numbers are unchanged.
- **v2.1:** ability no longer decays. Subjects you don't study stay where they are instead of slipping (no more peer drift in the school years, and no monthly fade in grade 12 or retake years). Ability is now on the 수능 scale from age 7 (50 is the average test taker), so children start around 10 and climb; the starting level and school-year study speed were retuned so top players reach about the same level as before. Balance tables regenerated.
- **v2:** lives start in elementary school. Turns are a year in elementary school, a semester in middle school and a season in grades 10–11, then monthly from grade 12. Ability is now relative to your year group, with peer drift during the school years. New childhood activities (reading, arts & sports) and about ten new events (sports day, olympiad, smartphone, Daechi-dong, bullying, class elections, career week, 중2). Middle-school class ranks and grade 10–11 mock exams track your standing. The track and inquiry subjects are chosen at the end of grade 10 instead of at the start. Families are no longer chosen: you're born into one of the five household-income fifths at random, with budgets based on the 2024 private-education survey, and there's no talent re-roll. Unspent education budget no longer piles up; your own savings come from New Year's money, gifts and part-time work. Earlier saves don't carry over.
- **v1.2:** full English and Korean versions with a language switch, instead of mixed English and Korean text. The engine now emits message keys; all text lives in `strings.js`. Saves from earlier versions don't carry over (the save format changed). Game behavior and balance numbers are unchanged.
- **v1.1:** "Start a new life" asks for confirmation in the page's own dialog, because embedded viewers block browser `confirm()`. Side gutters respect phone safe areas. Published as a claude.ai artifact.
- **v1:** first version. One-year 고3 run with monthly plans, study methods, condition, about 20 events, March/June/September mocks, the 수능 with a full score report, 정시 applications, and retakes (재종반, 독학재수, 반수) for as many years as you like. Also adds autosave, the hall of fame, and the calibration and bot script.
