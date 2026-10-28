# Schools in Korea

How many schools of each kind Korea has, and named lists of the special schools the Suneung Simulator models (영재학교, 과학고, 외고, 국제고, 자사고, 국제중, 마이스터고, medical schools). Same format and status tags as `korea-stats.md` (see `data/README.md`).

**What this file is not (yet): the full national list.** The complete official list of every kindergarten, elementary, middle and high school (about 20,000 schools) is published as the 전국초중등학교위치표준데이터 dataset on data.go.kr (provider: 한국교육시설안전원; fields include school ID, name, level, founding date, address, office of education, latitude and longitude; CSV, updated monthly) and through the NEIS open API. Universities are listed on 대학알리미 (academyinfo.go.kr). On 2026-10-28 none of these hosts (data.go.kr, open.neis.go.kr, schoolinfo.go.kr, academyinfo.go.kr, kess.kedi.re.kr, moe.go.kr) were reachable from the build environment (network policy), and no mirror of the dataset was found. Everything below comes from web search excerpts of official pages and education news, so the named lists are partial. When data.go.kr is reachable, import the CSV into `data/schools/` and replace the partial lists.

---

## 1. Counts by level
Retrieved: 2026-10-28

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| Kindergartens, elementary, middle and high schools | 20,480 (−125 from 20,605) | 2024-04-01 | Schools | MOE / KEDI (2024 교육기본통계) | https://eiec.kdi.re.kr/policy/materialView.do?num=256623 | official (excerpt) |
| Kindergartens, change | −147 | 2023→2024 | Schools | MOE / KEDI (2024 교육기본통계), via news | https://biz.newdaily.co.kr/site/data/html/2024/08/29/2024082900279.html | unverified (news) |
| Higher-education institutions | 422 (−2) | 2024-04-01 | Institutions (all types) | MOE / KEDI (2024 교육기본통계) | https://eiec.kdi.re.kr/policy/materialView.do?num=256623 | official (excerpt) |
| Kindergartens, elementary, middle and high schools | about 20,374 | 2025-04-01 | Schools | MOE / KEDI (2025 교육기본통계), via news | https://www.hangyo.com/mobile/article.html?no=105223 | calc: 20,480 (2024) − 106 (reported 2025 decline) |
| Kindergartens, elementary, middle and high schools | 20,233 (−140) | 2026-04-01 | Schools | MOE / KEDI (2026 교육기본통계) | https://eiec.kdi.re.kr/policy/materialView.do?num=285801 | official (excerpt) |
| Students, kindergarten to high school | 5,362,281 (−189,007, −3.4%) | 2026-04-01 | Students | MOE / KEDI (2026 교육기본통계) | https://eiec.kdi.re.kr/policy/materialView.do?num=285801 | official (excerpt) |
| Class size | kindergarten 15.6; elementary 18.6; middle 24.5; high 23.1 | 2026-04-01 | Students per class | MOE / KEDI, via news | https://hangyo.com/mobile/article.html?no=109001 | unverified (news) |
| 4-year universities and universities of education in the disclosure analysis | 193 | 2025-04 disclosure | Institutions (excl. cyber, polytechnic, graduate-only) | 한국대학교육협의회 (KCUE) / 대학알리미 analysis, via news | https://www.hangyo.com/news/article.html?no=104290 | unverified (news) |
| Junior colleges in the disclosure analysis | 129 | 2025-04 disclosure | Institutions | KCUE / 대학알리미 analysis, via news | https://www.hangyo.com/news/article.html?no=104290 | unverified (news) |
| 4-year universities and universities of education; junior colleges | 192; 125 (317 in all) | 2026-08 disclosure | Institutions in the analysis | KCUE | https://www.kcue.or.kr/_upload/news/2026/08/27/application_0638689fbb6c4a66776835c71c28b547.pdf | official (excerpt) |

Not found: counts by level (elementary / middle / high separately), by province, and kindergartens in total. These are in the 교육기본통계 tables on kess.kedi.re.kr.

## 2. High schools by type (counts)
Retrieved: 2026-10-28

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| Share of high schools by type | ~70% general (일반고), ~20% vocational (특성화고), ~10% autonomous and special-purpose | 2011–2021 | Share of schools | KEDI (월간 교육정책포럼) | http://edpolicy.kedi.re.kr/edpolicy/webzine/42/832 | official (also in korea-stats.md §5) |
| Gifted schools (영재학교) | 8 | 2021 entry onward | Schools | Education news | https://www.localnaeil.com/News/View/642605 | unverified (news) |
| Gifted schools, in-quota places | 789 | 2021 entry | Places | Education news | https://www.localnaeil.com/News/View/642605 | unverified (news) |
| Science high schools (과학고) | 20 | 2016–2026 entries | Schools | Education news | https://www.ajunews.com/view/20150727092807703 | unverified (news) |
| Science high schools | 22 (부천고 and 분당중앙고 added as 경기형 과학고) | 2027 entry | Schools | Education news | https://www.localnaeil.com/News/View/654855 | unverified (news) |
| Foreign language high schools (외고) | 28 | 2026-03-01 | Schools | MOE designation list, via news | https://edujb.com/news/articleView.html?idxno=8139 | unverified (news) |
| International high schools (국제고) | 8 | 2026-03-01 | Schools | MOE designation list, via news | https://edujb.com/news/articleView.html?idxno=8139 | unverified (news) |
| Autonomous private high schools (자사고) | 32 (15 in Seoul) | 2026-03-01 | Schools | MOE designation list, via news | https://edujb.com/news/articleView.html?idxno=8139 | unverified (news) |
| Nationwide-admission 자사고 (전국단위) | 10 | 2023 | Schools | Education news (종로학원 analysis) | https://dhnews.co.kr/news/view/179520660371195 | unverified (news) |
| Meister high schools (마이스터고) operating | 54, in 15 provinces | 2023–2026 | Schools | Education news | https://www.metroseoul.co.kr/article/20230704500290 | unverified (news) |
| Meister high schools after the 2026 designations | 65 (6 new in June 2026, 3 of them conditional) | 2026-06 | Schools designated | MOE announcement, via news | https://www.hangyo.com/news/article.html?no=101428 | unverified (news) |
| International middle schools (국제중) | 5 historically | 2018–2020 | Schools | Education news | https://www.hankyung.com/amp/2020060985421 | unverified (news); current status of 대원·영훈 unclear, see §4 |

Not found: counts of 일반고, 특성화고, 자율형 공립고, 예술고 and 체육고, and any count by province.

## 3. Named lists
Retrieved: 2026-10-28. Each list says how complete it is. The Korean names come from the cited sources; the English names, and the cities where the source didn't give one, are added from general knowledge for convenience and should be checked against the school's own site.

### 3.1 Gifted schools (영재학교): 8 of 8

| School | English | City | Type | Notes |
|---|---|---|---|---|
| 서울과학고 | Seoul Science High School | Seoul | science gifted | unverified (news) |
| 경기과학고 | Gyeonggi Science High School | Suwon | science gifted | unverified (news) |
| 한국과학영재학교 | Korea Science Academy of KAIST | Busan | science gifted | unverified (news) |
| 대전과학고 | Daejeon Science High School | Daejeon | science gifted | unverified (news) |
| 대구과학고 | Daegu Science High School | Daegu | science gifted | unverified (news) |
| 광주과학고 | Gwangju Science High School | Gwangju | science gifted; half of in-quota places for local students (2021) | unverified (news) |
| 세종과학예술영재학교 | Sejong Academy of Science and Arts | Sejong | science and arts gifted | unverified (news) |
| 인천과학예술영재학교 | Incheon Academy of Science and Arts | Incheon | science and arts gifted | unverified (news) |

Source for all rows: https://www.localnaeil.com/News/View/642605 (2021 admissions article naming all eight).

### 3.2 Science high schools (과학고): 18 of 20 confirmed by name

Confirmed in search excerpts of admission and competition-ratio articles (https://dhnews.co.kr/news/view/179519684264158, https://dhnews.co.kr/news/view/179521747669496, https://www.ajunews.com/view/20150727092807703): 한성과학고 (Seoul), 세종과학고 (Seoul), 인천과학고, 인천진산과학고 (Incheon), 경기북과학고 (Uijeongbu, Gyeonggi), 강원과학고 (Gangwon), 충북과학고, 충남과학고, 대전동신과학고 (Daejeon), 대구일과학고 (Daegu), 경북과학고 (Gyeongbuk), 부산과학고, 부산일과학고 (Busan), 울산과학고 (Ulsan), 경남과학고, 창원과학고 (Gyeongnam), 전남과학고 (Jeonnam), 제주과학고 (Jeju). All unverified (news).

Not confirmed: the remaining 2 (likely in Jeonbuk and Gyeongbuk, but no excerpt named them). From the 2027 entry, 부천고 and 분당중앙고 in Gyeonggi also admit as science high schools (https://www.localnaeil.com/News/View/654855).

### 3.3 Foreign language high schools (외고): 6 of 28 confirmed by name

대원외고 (Seoul, founded 1984, foreign language school from 1992), 대일외고 (Seongbuk-gu, Seoul; calls itself Korea's first 외고), 한영외고, 명덕외고, 이화외고 (Seoul), 부일외고 (Busan). Sources: https://www.hankyung.com/amp/2012020789181, https://www.localnaeil.com/News/View/644057/1, https://hangyo.com/mobile/article.html?no=30329. All unverified (news).

Not confirmed: the other 22. The national count has fallen over time: 29 (2006), 31 (2008), 33 including 14 public (2009), 28 (2026).

### 3.4 International high schools (국제고): 3 of 8 confirmed by name

서울국제고 (Myeongnyun-dong, Jongno-gu; Seoul's first international boarding school, most classes in English), 부산국제고 (founded 1998), 인천국제고 (in the free economic zone). Sources: https://mediahub.seoul.go.kr/archives/143784 (Seoul city, official), https://hangyo.com/news/article.html?no=24313, https://hangyo.com/news/article.html?no=22023 (news).

Not confirmed: the other 5.

### 3.5 Autonomous private high schools (자사고): 10 nationwide-admission schools, plus 4 Seoul schools of 32

Nationwide admission (전국단위), 10 of 10 (https://dhnews.co.kr/news/view/179520660371195; unverified, news):

| School | English | Region | Notes |
|---|---|---|---|
| 민족사관고 | Korean Minjok Leadership Academy | Hoengseong, Gangwon | 100% nationwide admission (2012) |
| 상산고 | Sangsan High School | Jeonju | 75% nationwide (2012) |
| 하나고 | Hana Academy Seoul | Seoul | |
| 용인외대부고 | HUFS Foreign Language High School (Yongin) | Yongin, Gyeonggi | 70% nationwide (2012) |
| 현대청운고 | Hyundai Chungun High School | Ulsan | 100% nationwide (2012) |
| 북일고 | Bugil Academy | Cheonan | |
| 김천고 | Gimcheon High School | Gimcheon | |
| 광양제철고 | Gwangyang Jecheol High School | Gwangyang | |
| 포항제철고 | Pohang Jecheol High School | Pohang | |
| 인천하늘고 | Incheon Haneul High School | Incheon | |

The 7 outside the capital region filled 21.7% of 1,816 places with local students (2023, 종로학원 analysis).

Seoul (regional admission), 15 schools in 2026; none confirmed by name for 2026. In the first designation round (2009), 경희고 was among 18 Seoul schools designated, and 중동고, 휘문고 and 대광고 were among the applicants (https://hangyo.com/news/article.html?no=29014, unverified, news).

### 3.6 International middle schools (국제중): 5 historically

| School | City | Type | Opened | Notes |
|---|---|---|---|---|
| 부산국제중 | Busan | public | 1999 | unverified (news) |
| 청심국제중 | Gapyeong, Gyeonggi | private | 2005 | unverified (news) |
| 대원국제중 | Seoul | private | 2008 | unverified (news); 2020 re-designation dispute, current status unclear |
| 영훈국제중 | Seoul | private | 2008 | unverified (news); 2020 re-designation dispute, current status unclear |
| 선인국제중 | Jinju, Gyeongnam | private | 2018 | unverified (news) |

Source: https://www.hankyung.com/amp/2020060985421. A 2025 article reports record competition for 국제중 entry (https://www.etnews.com/20251107000132).

### 3.7 Meister high schools (마이스터고): 3 of 54–65 named

Converting from 2027 (designated 2025): 대구전자공고, 예산전자공고, 경북소프트웨어고 (https://www.hangyo.com/news/article.html?no=101428; unverified, news). The rest are not yet listed.

### 3.8 Medical schools (의대): count and total quota only

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| Medical schools | 40 | 2024–2026 | Universities with a medical school | MOE, via news | https://kbmaeil.com/article/202403040386490 | unverified (news); all 40 applied for increases in 2024 |
| Medical school places | 3,058 | 2026 entry | Total admissions (back to the 2024 level) | MOE | https://m.korea.kr/news/policyNewsView.do?newsId=148941980 | official (excerpt) |
| Medical school increase | +1,489 to +1,509 (total about 4,547–4,567) | 2025 entry | Places | MOE decision, via news | https://magazine.hankyung.com/business/article/202405022426b | unverified (news) |
| 정시 수능-track places at medical schools | 1,010 (from 1,492 in 2025); Seoul 384, Busan 78, Gangwon 77 | 2026 entry | Places | Admissions analysis, seen in search excerpts | https://riroschool.kr/kceenews/detail/213 or https://www.dhnews.co.kr/news/view/1065586981556064 | unverified (the excerpt didn't say which of these two pages it came from) |

Not found: the named list of the 40 medical schools and each one's quota (in the MOE allocation table and on 대입정보포털 어디가, adiga.kr).

### 3.9 Universities

Not listed yet. 대학알리미 (academyinfo.go.kr) has the official list of about 190 four-year universities with founding type and region; it was unreachable.

## 4. Notes and open questions

- 국제중: in 2020 Seoul moved to end 대원 and 영훈's designation; one later article says the two now run as specialized curricula under their original school names. Their current status needs a primary source.
- 자사고: a 2019–2021 policy planned to turn every 자사고 into a general school in 2025; the 2026 count of 32 suggests that was reversed, but the legal history was not checked.
- Counts in news articles depend on the date (designated vs operating, entry year vs school year). Each row gives the year the number describes.
