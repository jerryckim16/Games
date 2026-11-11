# Korea in numbers: work, income and money across adult life

Scope: official Korean statistics on jobs, pay, careers, retirement, household money, prices, taxes, pensions and poverty from the twenties to old age, for an adult-life extension of the Suneung Simulator. It extends `data/korea-stats.md` sections 2 (household income and wealth), 12 (economy shocks), 13 (after school), 14 (jobs) and 15 (after university) and does not repeat their rows; where a row here updates one there (a newer year, or an official source for a row marked unverified there), the Notes say so. Format and status tags follow `data/README.md`. Currency: 만원 = ₩10,000, 억 = ₩100,000,000.

Sources read: attachments downloaded from mods.go.kr (국가데이터처) boards and read in full: the 2025 annual 고용동향 (`ssec2512.hwpx` and its 통계표 xlsx, bid 210 list 443017), the September and October 2026 고용동향 통계표 xlsx (lists 447479, 447893) and the October PDF, the May 2026 고령층 and 청년층 부가조사 PDFs (lists 446335, 446080), the August 2026 근로형태별 부가조사 PDF (list 447508) and 비임금근로 부가조사 PDF (list 447820), the 2024 임금근로일자리 소득 PDF (bid 11113 list 443648), the 2024 일자리이동통계 PDF (list 445347), the 2025 기업생멸행정통계 PDF (bid 11469 list 447531), the 2025 가계금융복지조사 hwpx and 통계표 xlsx (bid 215 list 439535), the 2025 annual and 2026 Q2 가계동향조사 releases (bid 214 lists 443727, 446633), the 2025 annual and October 2026 소비자물가동향 PDFs (bid 213 lists 442792, 447801), and `2025 통계로 보는 1인가구` hwpx and `2026 고령자 통계` PDF (bid 10820 lists 442130, 447294). From MOEL: the `2025년 6월 고용형태별근로실태조사` PDF (laborstat.moel.go.kr), the `2026년 10월 고용행정 통계로 본 노동시장 동향` PDF and the `2025년 12월 사업체노동력조사` PDF (moel.go.kr). MOHW press-release pages were read as page text. The Minimum Wage Commission's decision table was read as page text. OECD data came from the OECD SDMX API (sdmx.oecd.org) as CSV. Bank of Korea figures (2026-11-11) came from the ECOS open API with its public sample key (ecos.bok.or.kr/api, StatisticSearch and KeyStatisticList). Unreachable from this session: kosis.kr tables, nts.go.kr, law.go.kr, korea.kr (connection resets), nps.or.kr statistics (script-only pages); rows that depend on them are marked.

---

## 1. Employment and labour-force participation by age and sex
Retrieved: 2026-11-11

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| Employment rate by age band | 15–19 6.1; 20–29 60.2; 30–39 80.8; 40–49 79.9; 50–59 77.5; 60+ 46.7 (65+ 39.5; 70+ 31.7); all 15+ 62.9; 15–64 69.8 | 2025 | % of population in the band employed (annual average) | 국가데이터처, 경제활동인구조사 (2025 연간 고용동향, 통계표 sheet 7) | https://mods.go.kr/boardDownload.es?bid=210&list_no=443017&seq=4 | official (xlsx); extends section 12 (2024 totals) |
| Employment rate by age band, trend | 30–39: 75.3 (2021) → 80.8 (2025); 40–49: 77.3 → 79.9; 60+: 42.9 → 46.7; 20–29: 57.4 → 60.2 | 2021–2025 | % | same | same | official (xlsx) |
| Employment rate by age band, latest month | 20–29 59.7; 30–39 81.6; 40–49 80.9; 50–59 79.2; 60+ 47.9; 15–64 70.6 | 2026-09 | % (not seasonally adjusted) | 국가데이터처, 2026년 9월 고용동향 (통계표 sheet 7) | https://mods.go.kr/boardDownload.es?bid=210&list_no=447479&seq=4 | official (xlsx) |
| Employment rate by age band, October 2026 | 15–19 5.8; 20–29 58.5; 30–39 81.7; 40–49 81.0; 50–59 79.1; 60+ 47.8 (65+ 41.5; 70+ 33.9); 15–29 42.9 (−1.7pp); 15–34 55.4; 15–64 70.4 (+0.3pp); all 15+ 63.3 | 2026-10 | % (not seasonally adjusted) | 국가데이터처, 2026년 10월 고용동향 (통계표 sheet 7) | https://mods.go.kr/boardDownload.es?bid=210&list_no=447893&seq=4 | official (xlsx); newer month than the September row above (kept); employed 29,179k (+139k); youth 15–29 employment fell 196k on the year; health and social work +249k, accommodation and food −137k, farming −101k |
| Labour-force participation by age band | 20–29 64.2; 30–39 83.0; 40–49 81.5; 50–59 78.9; 60+ 48.0; all 15+ 64.7 | 2025 | % of population in the labour force | 국가데이터처, 경제활동인구조사 (age sheets 2029…60) | https://mods.go.kr/boardDownload.es?bid=210&list_no=443017&seq=4 | official (xlsx) |
| Employment and participation by sex | men: employment 70.6, participation 72.7, unemployment 2.8; women: 55.3, 56.9, 2.8 | 2025 | % of population 15+ | same (sheets 1.남자, 1.여자) | same | official (xlsx) |
| Employment rate by sex and five-year age | men: 25–29 70.0; 30–34 86.0; 35–39 89.4; 40–44 91.3; 45–49 90.3; 50–54 88.8; 55–59 85.2; 60–64 73.1; 65–69 63.0; 70–74 49.5; 75+ 31.1. women: 25–29 73.6; 30–34 75.1; 35–39 71.0; 40–44 67.2; 45–49 69.9; 50–54 69.3; 55–59 66.4; 60–64 57.0; 65–69 45.2; 70–74 35.1; 75+ 22.2 | 2025 | % of population in the group | OECD, Employment and unemployment by five-year age group and sex (DF_LFS_INDIC), from Korea's LFS | https://sdmx.oecd.org/public/rest/data/OECD.ELS.SAE,DSD_LFS@DF_LFS_INDIC,1.1/all?startPeriod=2024 | official (API CSV); women's dip at 35–44 is the career-break "M curve"; totals match 국가데이터처 (15–64 69.8, 15–29 45.0) |
| Unemployment rate by age band | 15–19 5.3; 20–29 6.1; 30–39 2.7; 40–49 2.0; 50–59 1.8; 60+ 2.8 (65+ 3.0); all 2.8 | 2025 | % of the labour force | 국가데이터처, 경제활동인구조사 (sheet 9) | https://mods.go.kr/boardDownload.es?bid=210&list_no=443017&seq=4 | official (xlsx) |
| Unemployment rate by education | middle school or less 3.6; high school 2.9; university or more 2.6 | 2025 | % | same (sheet 10) | same | official (xlsx) |
| Extended unemployment rate (고용보조지표3) | 8.7 (8.8 in 2024) | 2025 | % including the underemployed and potential labour force | same (sheet 12) | same | official (xlsx) |
| Wage workers by status | 22,318k wage workers: regular (상용) 16,636k (57.8% of all employed), temporary 4,817k (16.7%), daily 865k (3.0%) | 2025 | Thousand persons (annual average) | same (sheet 5) | same | official (xlsx); shares calc ÷ 28,769k; non-wage shares are in korea-stats section 14 |

## 2. Youth, NEET and "just resting" (쉬었음)
Retrieved: 2026-11-11

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| "Just resting" (쉬었음) by age | 15–29 428k (20–29 408k); 30–39 309k; 40–49 270k; 50–59 404k; 60+ 1,144k (70+ 213k); total 2,555k | 2025 | Thousand people outside the labour force who were "just resting" | 국가데이터처, 2025 연간 고용동향 (hwpx, 연령계층별 쉬었음) | https://mods.go.kr/boardDownload.es?bid=210&list_no=443017&seq=2 | official (hwpx); total = 15.8% of the economically inactive; makes the 30s figure in section 15 official |
| "Just resting", trend | 2,351k (2023) → 2,467k (2024) → 2,555k (2025); 20–29: 371k → 389k → 408k | 2023–2025 | Thousand | same | same | official (hwpx) |
| "Just resting" by age, October 2026 | total 2,511k (−69k, −2.7%; 15.4% of the inactive); 15–19 18k; 20–29 353k (−49k, −12.1%); 30–39 315k; 40–49 247k; 50–59 362k; 60+ 1,217k (70+ 279k, +28.1%); 15–29 371k; 15–34 548k | 2026-10 | Thousand | 국가데이터처, 2026년 10월 고용동향 (본문 4-다, pdf) | https://mods.go.kr/boardDownload.es?bid=210&list_no=447893&seq=1 | official (pdf); latest month; job-exam / job-search preparers 619k (+21k); discouraged job-seekers 340k (−27k) |
| Job-exam / job-search preparers (취업준비자) | 632k (3.9% of the inactive) | 2025 | Thousand | same | same | official (hwpx) |
| Youth (15–29) labour market | participation 47.2%; employment 43.8% (−2.4pp); unemployment 7.2% | 2026-05 | % | 국가데이터처, 2026년 5월 청년층 부가조사 | https://mods.go.kr/boardDownload.es?bid=210&list_no=446080&seq=3 | official (pdf) |
| Time to first wage job; its tenure | 11.2 months (−0.1); first job lasted 1 year 6.8 months on average | 2026-05 | Mean, youth whose first job after leaving school was a wage job | same | same | official (pdf); supersedes the unverified 2025 rows in section 15 (11.3 months, 1y6.4m) |
| Why youth left their first job | poor working conditions 44.4%; temporary/seasonal job ended 18.0%; personal/family 14.5% | 2026-05 | % of those who left | same | same | official (pdf) |
| What not-employed school leavers do | job training or exam preparation 39.3%; "just spending time" 25.3% | 2026-05 | % of youth not employed after leaving school | same | same | official (pdf) |
| Time to graduate from university | 4 years 5.7 months (men 5y 2.1m, women 3y 11.6m); leave of absence averaged 1y 9.9m | 2026-05 | Mean, graduates incl. 3-year colleges | same | same | official (pdf); makes the section 15 row official |

## 3. Retirement and work after 55
Retrieved: 2026-11-10

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| Age when people left their longest-held job | 53.0 (men 55.3, women 51.1); wage workers 52.1, non-wage 56.2; clerks 45.4 (women clerks 38.9) | 2026-05 | Mean age at leaving, people 55–79 who have left it (69.5% have) | 국가데이터처, 2026년 5월 고령층 부가조사 | https://mods.go.kr/boardDownload.es?bid=210&list_no=446335&seq=3 | official (pdf) |
| Tenure in the longest-held job | 17 years 7.1 months | 2026-05 | Mean, people 55–79 who have worked | same | same | official (pdf); 30.5% are still in it, average age 62.6 |
| Why they left the longest-held job | business slump / closure 24.9%; poor health 22.1%; caring for family 15.2% | 2026-05 | % of leavers | same | same | official (pdf) |
| Employment rate 55–64 and 65–79 | 71.5% and 47.8% (55–79: 59.5%) | 2026-05 | % | same | same | official (pdf) |
| Want to keep working | 69.2% of people 55–79 (men 76.5, women 62.4); to the age of 73.6 on average; reason: living costs 53.4%, enjoyment 36.7% | 2026-05 | % / years | same | same | official (pdf) |
| Household heads' retirement age | expected 68.6 (not yet retired, 83.0% of households); actual 62.7 (retired) | 2025-03 | Mean age | 국가데이터처·한국은행·금융감독원, 2025 가계금융복지조사 | https://mods.go.kr/boardDownload.es?bid=215&list_no=439535&seq=6 | official (hwpx) |
| Retirement readiness | prepared "well" 9.6%, "not well" 51.9% (not-yet-retired); retired households whose living costs are "short" 55.6%, "comfortable" 11.5% | 2025-03 | % of households | same | same | official (hwpx); retirees fund living costs from public transfers 34.4%, public pensions 30.3%, family/children 21.2% |
| Monthly living cost needed after retirement | minimum 245만; adequate 341만 | 2025-03 | 만원/month for head and spouse (households not yet retired) | same | same | official (hwpx) |
| Employment rate 65+ trend | 30.4 (2015) → 34.1 (2020) → 38.2 (2024) → 39.5 (2025); unemployment 3.0 | 2015–2025 | % | 국가데이터처, 2026 고령자 통계 (from 경제활동인구조사) | https://mods.go.kr/boardDownload.es?bid=10820&list_no=447294&seq=4 | official (pdf) |

## 4. Wages: level, age, sex, education, firm size and contract type
Retrieved: 2026-11-10

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| Mean monthly pay by age (age–earnings curve) | under 20 95; 20s 271; 30s 397; 40s 469; 50s 445; 60s 293; 70+ 165 (all 375, median 288) | 2024 (December jobs) | 만원/month before tax, per wage job | 국가데이터처, 2024년 임금근로일자리 소득(보수) 결과 | https://mods.go.kr/boardDownload.es?bid=11113&list_no=443648&seq=1 | official (pdf); makes the age row in section 15 official |
| Mean monthly pay by sex and age | men: 20s 286, 30s 428, 40s 544, 50s 548, 60s 362, 70+ 234 (all 442); women: 20s 255, 30s 354, 40s 363, 50s 306, 60s 200, 70+ 95 (all 289) | 2024 | 만원/month per wage job | same | same | official (pdf); gap largest in the 50s (243만) |
| Women's pay as a share of men's, by age | 20s 89%; 30s 83%; 40s 67%; 50s 56%; all 65% | 2024 | Ratio of mean monthly pay | same | same | calc: women ÷ men from the row above (e.g. 306 ÷ 548) |
| Mean monthly pay by tenure | under 1 year 214; 1–2 y 316; 2–3 y 352; 3–5 y 369; 5–10 y 430; 10–20 y 608; 20 y+ 848 | 2024 | 만원/month | same | same | official (pdf) |
| Pay distribution by age | share earning ₩10M+/month: 20s 0.2%, 30s 2.6%, 40s 7.0%, 50s 7.8%; under ₩850k: 20s 13.0%, 60s 16.2%, 70+ 48.6% | 2024 | % of wage jobs in the age group | same | same | official (pdf) |
| Hourly pay by age | 20s ₩18,857; 30s 26,548; 40s 30,682 (peak); 50s 28,808; 60+ 20,871 (all 25,839) | 2025-06 | Won/hour, total pay ÷ hours, firms with 1+ workers | MOEL, 고용형태별근로실태조사 | https://laborstat.moel.go.kr/cmm/fms/FileDown.do?atchFileId=FILE_000000000058037&fileSn=1 | official (pdf) |
| Gender pay gap (hourly) | women 72.0% of men (regular 74.8%, non-regular 75.1%); men ₩29,411, women ₩21,164 | 2025-06 | Hourly total pay | same | same | official (pdf) |
| Gender wage gap, OECD measure | Korea 29.0% (2022 31.2, 2023 29.3); OECD 10.1%, Japan 20.7%, US 17.3% | 2024 | Gap in median earnings of full-time employees, % of men's | OECD, Gender wage gap | https://sdmx.oecd.org/public/rest/data/OECD.ELS.SAE,DSD_EARNINGS@GENDER_WAGE_GAP,1.1/all?startPeriod=2022 | official (API CSV); Korea is the widest in the OECD |
| Hourly pay by education | middle school or less ₩16,081; high school 20,056; junior college 24,268; university 30,631; graduate school 46,779 | 2025-06 | Won/hour (regular workers: 18,881 / 22,017 / 25,694 / 32,303 / 48,354) | MOEL, 고용형태별근로실태조사 | https://laborstat.moel.go.kr/cmm/fms/FileDown.do?atchFileId=FILE_000000000058037&fileSn=1 | official (pdf); high-school pay = 65.5% of university pay |
| Hourly pay by firm size | 300+ employees ₩40,300; under 300 ₩23,098 (57.3%); regular at 300+ ₩43,008, non-regular at under 300 ₩17,853 (41.5%) | 2025-06 | Won/hour | same | same | official (pdf) |
| Regular vs non-regular hourly pay | regular ₩28,599; non-regular ₩18,635 (65.2%); fixed-term 20,097; part-time 16,256; dispatched 17,477 | 2025-06 | Won/hour | same | same | official (pdf) |
| Pay quintiles (full-time regular workers) | mean monthly pay Q1 ₩2,048k; Q2 2,780k; Q3 3,549k; Q4 4,846k; Q5 8,979k; top ÷ bottom 4.39 | 2025-06 | Thousand won/month | same | same | official (pdf); low-paid (< 2/3 of median ₩3,519k) 15.8% |
| Benefits coverage | union members 10.2% (regular 13.7, non-regular 1.2); retirement pension plan 52.8% (61.7 / 29.8); bonus 53.7% (64.5 / 25.5) | 2025-06 | % of workers | same | same | official (pdf) |
| Non-regular (비정규직) share | 38.5% of wage workers (8,671k of 22,526k); fixed-term/temporary 26.8%, part-time 19.5%, atypical 7.9% | 2026-08 | % | 국가데이터처, 2026년 8월 근로형태별 부가조사 | https://mods.go.kr/boardDownload.es?bid=210&list_no=447508&seq=14 | official (pdf); 60+ are 36.7% of non-regular workers; women 57.2% (calc 4,963k ÷ 8,671k) |
| Monthly pay, regular vs non-regular | all wage workers 330.5만; regular 405.2만; non-regular 211.2만 (excluding part-time 309.8만; part-time 114.6만) | 2026 June–Aug | 만원/month, main job | same | same | official (pdf) |
| Social insurance coverage of non-regular workers | national pension 36.5%; health insurance 53.0%; employment insurance 54.0% (all wage workers: 68.5 / 79.3 / 77.0) | 2026-08 | % enrolled through work | same | same | official (pdf) |
| Mean monthly pay growth | ₩3,271k (2021) → 3,526k (2022) → 3,640k (2023) → 3,737k (2024) → 3,834k (2025) | 2021–2025 (June) | Won/month, all workers | MOEL, 고용형태별근로실태조사 | https://laborstat.moel.go.kr/cmm/fms/FileDown.do?atchFileId=FILE_000000000058037&fileSn=1 | official (pdf) |

## 5. Minimum wage
Retrieved: 2026-11-10

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| Minimum wage 2024 | ₩9,860/hour; ₩2,060,740/month (+2.5%) | 2024 | Hourly; monthly at 209 hours | 최저임금위원회 (Minimum Wage Commission), 연도별 최저임금 결정현황 | https://www.minimumwage.go.kr/minWage/policy/decisionMain.do | official (page text) |
| Minimum wage 2025 | ₩10,030/hour; ₩2,096,270/month (+1.7%) | 2025 | same | same | same | official (page text) |
| Minimum wage 2026 | ₩10,320/hour; ₩2,156,880/month (+2.9%) | 2026 | same | same | same | official (page text) |
| Minimum wage 2027 | ₩10,700/hour; ₩85,600/day; ₩2,236,300/month (+3.7%); decided 2026-07-14, notified 2026-08-05 | 2027 | same | same | same | official (page text) |
| Minimum wage history | 2017 ₩6,470 → 2018 7,530 (+16.4%) → 2019 8,350 (+10.9%) → 2020 8,590 → 2021 8,720 → 2022 9,160 → 2023 9,620 | 2017–2023 | Won/hour | same | same | official (page text) |

## 6. Job mobility, tenure, separations and unemployment
Retrieved: 2026-11-11

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| Average tenure in current job | all wage workers 6 years 8 months; regular 9 years 0 months; non-regular 3 years 0 months | 2026-08 | Mean | 국가데이터처, 근로형태별 부가조사 | https://mods.go.kr/boardDownload.es?bid=210&list_no=447508&seq=14 | official (pdf); 27.2% of wage workers have under 1 year |
| Changed employer in a year | 14.7% moved firms; 72.1% stayed; 13.3% newly entered | 2023→2024 | % of 26.25M registered workers | 국가데이터처, 2024년 일자리이동통계 | https://mods.go.kr/boardDownload.es?bid=11113&list_no=445347&seq=1 | official (pdf) |
| Job-change rate by age | 29 and under 21.4%; 30s 15.7%; 60+ 13.5%; stay rate highest in 40s (78.9%) and 50s (78.4%) | 2023→2024 | % | same | same | official (pdf) |
| Job change over five years | 31.4% had moved firm within 5 years; only 40.9% were still in the same firm | 2019→2024 | % | same | same | official (pdf) |
| Pay change on moving | 57.8% moved to higher pay, 41.3% lower; under 30: 63.1% higher; 30s 61.4%; 40s 57.8% | 2023→2024 | % of movers (regular wage workers) | same | same | official (pdf) |
| Moves between firm sizes | from a large firm: 37.0% to another large firm, 56.6% to an SME; from an SME: 11.8% to a large firm, 81.4% to an SME | 2023→2024 | % of movers | same | same | official (pdf) |
| Separations, voluntary vs involuntary | 969k separations in the month: voluntary 272k; involuntary 631k (contract end, restructuring, dismissal); other 67k | 2025-12 | Persons in the month | MOEL, 2025년 12월 사업체노동력조사 | https://www.moel.go.kr/common/downloadFile.do?file_seq=20260101827&bbs_seq=18906&bbs_id=12&file_ext=pdf | official (pdf); one month only; involuntary is mostly temporary and daily jobs ending |
| How long unemployment lasts | 1–2 months 58.5%; 3–5 months 29.8%; 6–11 months 10.7%; a year or more 1.0% | 2025 | % of unemployed by duration so far | OECD, Incidence of unemployment by duration (DF_DUR_I), from Korea's LFS | https://sdmx.oecd.org/public/rest/data/OECD.ELS.SAE,DSD_DUR@DF_DUR_I,1.0/all?startPeriod=2023 | official (API CSV); the four bands sum to 100, so Korea reports no band under 1 month; OECD-wide average duration 6.3 months (Korea not given) |
| Unemployment rate by age, October 2026 | all 2.0% (−0.2pp; 602k unemployed); 15–19 3.7; 20–29 5.2; 30–39 2.3; 40–49 1.6; 50–59 1.2; 60+ 1.5; 15–29 5.2 (25–29 5.5); extended (고용보조지표3) 7.3% | 2026-10 | % (not seasonally adjusted) | 국가데이터처, 2026년 10월 고용동향 (통계표 sheets 9 and 12) | https://mods.go.kr/boardDownload.es?bid=210&list_no=447893&seq=4 | official (xlsx); youth 15–29 unemployment was 7.4% in Q1 2026 and 6.8% in July (seasonal: graduates enter in winter); extended rate 7.8% a year earlier |
| Unemployment benefit (구직급여) recipients and pay | 629k recipients a month on average; ₩1,626k per recipient per month; ₩1.02 trillion a month | 2025 | Monthly averages | MOEL, 2026년 10월 고용행정 통계로 본 노동시장 동향 (table 3-1) | https://www.moel.go.kr/common/downloadFile.do?file_seq=20261100432&bbs_seq=20216&bbs_id=12&file_ext=pdf | official (pdf); October 2026: 571k recipients, ₩1,754k each |
| Unemployment benefit rules | 60% of average daily wage; daily cap ₩68,100 from 2026-01-01 (was ₩66,000 since 2019); floor 80% of minimum wage (₩66,048 for an 8-hour day in 2026) | 2026 | Won/day | MOEL (고용보험법 시행령 제68조) via news | https://biz.sbs.co.kr/amp/article/20000263717 | unverified (news and search summaries); the law page could not be reached; floor calc = 10,320 × 8 × 0.8 |

## 7. Self-employment and business survival
Retrieved: 2026-11-11

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| Active, new and closed firms | 7,748k active firms (2025); 908k new (birth rate 11.7%); 769k closed in 2024 (death rate 10.1%) | 2025 (closures 2024) | Firms with sales or regular employees | 국가데이터처, 2025년 기업생멸행정통계(잠정) | https://mods.go.kr/boardDownload.es?bid=11469&list_no=447531&seq=1 | official (pdf); preliminary |
| Survival of new firms | 1 year 63.9%; 2 y 53.5%; 3 y 46.5%; 4 y 40.2%; 5 y 36.5%; 6 y 32.8%; 7 y 28.5% | 2024 (firms born 2017–2023) | % still active | same (table 19) | same | official (pdf) |
| Five-year survival by industry | restaurants & bars 27.8%; retail & wholesale 32.2%; arts & leisure 30.1%; finance 24.8%; IT 39.4%; construction 42.0%; manufacturing 44.9%; health & welfare 64.0% | firms born 2019, alive 2024 | % | same (table 21) | same | official (pdf) |
| Birth and death rates by industry | births highest in farming 17.4%, IT 17.2%, education 16.4%; deaths highest in restaurants & bars 14.1%, retail 12.7% | 2025 / 2024 | % of active firms | same | same | official (pdf) |
| Firm owners by age | owners in their 50s 2,273k, 60s 1,877k, 40s 1,666k firms | 2025 | Active firms by representative's age | same | same | official (pdf) |
| Self-employed households' finances | assets 7억 194만 (regular-employee households 6억 1,918만); financial debt to savings 92.1% (all households 68.2%) | 2025-03 | Per household, head self-employed | 국가데이터처, 2025 가계금융복지조사 | https://mods.go.kr/boardDownload.es?bid=215&list_no=439535&seq=8 | official (xlsx/hwpx); their income (8,000만/yr) is in korea-stats section 14 |
| Non-wage workers (self-employed and unpaid family) | 6,625k (+71k), 22.7% of the employed: employers 1,481k (22.4%), own-account 4,303k (64.9%), unpaid family 841k (12.7%); men 62.9%, women 37.1% (women are 83.5% of unpaid family workers) | 2026-08 | Thousand | 국가데이터처, 2026년 8월 비임금근로 부가조사 | https://mods.go.kr/boardDownload.es?bid=210&list_no=447820&seq=2 | official (pdf); newer than the 2025 annual shares in korea-stats §14 (self-employed 19.5%, non-wage 22.4%) |
| Non-wage workers by age and education | 15–29 205k; 30s 759k (+55k); 40s 1,214k (−35k); 50s 1,728k; 60+ 2,719k (41.0%; 70+ 965k); college graduates 41.6%, high school 41.2%, middle school or less 17.2% | 2026-08 | Thousand / % | same (1-나, 1-다) | same | official (pdf) |
| How long businesses have run; plans | average 15 years 2 months (employers 12y 9m; own-account 15y 1m; 12y 2m outside farming); 86.6% plan to carry on, 2.5% to expand within a year, 5.0% to quit (reasons: personal 41.4%, poor prospects or slow trade 35.8%) | 2026-08 | Mean; % of non-wage workers (quit reasons: % of self-employed planning to quit) | same (2-가, 2-마) | same | official (pdf); 29.6% have run 20+ years, 5.1% under a year |
| Starting a business: new self-employed | 305k started within the year (employers 17.8%); why: to run their own business 70.8%, could not find a wage job 21.7%; prepared 1–3 months 47.0%, under a year 86.5%; start-up money under ₩5M 35.2% (incl. none needed 18.5%), ₩5–20M 19.8%, ₩50–100M 17.3%; funded by own or family money 70.3%, banks 18.9%; hardest part: know-how 28.4%, raising money 24.1%, finding customers 23.6% | 2026-08 | % of those who started in the last 12 months | same (2-아) | same | official (pdf); the self-employed's national-pension coverage (incl. pensioners) is 83.3%, employers' industrial-accident insurance 65.5% |

## 8. Household finances by age of head (가계금융복지조사)
Retrieved: 2026-11-11

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| Household income by head's age | under 30: 4,509만; 30s 7,386만; 40s 9,333만; 50s 9,416만; 60+ 5,767만 (65+ 4,728만); all 7,427만 | 2024 income | Mean annual gross income per household | 국가데이터처·한국은행·금융감독원, 2025 가계금융복지조사 (통계표 1~10) | https://mods.go.kr/boardDownload.es?bid=215&list_no=439535&seq=8 | official (xlsx) |
| Median household income by head's age | under 30: 3,873만; 30s 6,219만; 40s 7,801만; 50s 7,805만; 60+ 3,978만; all 5,800만 | 2024 income | Median annual income | same | same | official (xlsx) |
| Disposable income by head's age | under 30: 3,838만; 30s 5,976만; 40s 7,311만; 50s 7,476만; 60+ 4,891만; all 6,032만 | 2024 income | Mean, income minus taxes, social insurance, interest and transfers out | same | same | official (xlsx) |
| Assets by head's age | under 30: 1억 5,500만; 30s 3억 5,958만; 40s 6억 2,714만; 50s 6억 6,205만; 60+ 6억 96만 | 2025-03-31 | Mean per household | same | same | official (xlsx) |
| Debt by head's age | under 30: 4,703만; 30s 1억 899만; 40s 1억 4,325만; 50s 1억 1,044만; 60+ 6,504만 (65+ 4,993만) | 2025-03-31 | Mean per household (financial debt plus deposits held for tenants) | same | same | official (xlsx) |
| Net worth by head's age | under 30: 1억 796만 (median 5,000만); 30s 2억 5,060만 (1억 5,585만); 40s 4억 8,389만 (2억 8,384만); 50s 5억 5,161만 (3억 1,685만); 60+ 5억 3,591만 (2억 5,000만) | 2025-03-31 | Mean (median) per household | same | same | official (xlsx) |
| Debt service | principal and interest repaid 1,328만/yr on average; under 30: 902만; 30s 1,646만; 40s 2,134만; 50s 1,584만; 60+ 747만 | 2024 | Mean per household per year | same | same | official (xlsx) |
| Financial debt to disposable income | 112.6% (financial debt 6,795만 ÷ disposable income 6,032만) | 2025-03 / 2024 income | Ratio, all households | same (hwpx table 3-16) | https://mods.go.kr/boardDownload.es?bid=215&list_no=439535&seq=6 | calc: 6,795 ÷ 6,032 |
| Debt-service ratio | 22.0% of disposable income | 2024 | Repayments ÷ disposable income | same | same | calc: 1,328 ÷ 6,032 |
| Debt to assets; financial debt to savings | 16.8%; 68.2% (under 40: 30.3% and 131.1%) | 2025-03-31 | Ratios | same | same | official (hwpx) |
| Household credit (가계신용), national | ₩2,019.8 trillion (2026 Q2), of which household loans ₩1,891.3 trillion; ₩1,979.1 trillion at end-2025 (+3.0% on 2024); ₩1,342.5 trillion at end-2016 | 2016–2026 Q2 | ₩ trillion outstanding, loans plus card and instalment credit | Bank of Korea, ECOS 151Y001 (가계신용) | https://ecos.bok.or.kr/api/StatisticSearch/sample/json/kr/1/10/151Y001/Q/2024Q3/2026Q2/1000000 | official (ECOS API); first figure above ₩2,000 trillion; the household-loan delinquency rate was 0.45% in 2026-08 (ECOS key statistics) |
| Household credit to household disposable income | 131.2% (2025); 132.5% (2024); 151.3% (2021); 132.2% (2016) | 2016–2025 | Year-end 가계신용 ÷ 가계총처분가능소득 (national accounts) | — | https://ecos.bok.or.kr/api/StatisticSearch/sample/json/kr/1/10/200Y101/A/2016/2025/101051 | calc: 1,979.1 ÷ 1,508.0 trillion (2025); 1,922.4 ÷ 1,450.6 (2024); 1,861.3 ÷ 1,230.1 (2021); 1,342.5 ÷ 1,015.4 (2016); not the BOK's own flow-of-funds ratio; household disposable income per person ₩29.18M (2025, ECOS 200Y101) |
| Mean net worth by net-worth quintile | Q1 1,132만; Q2 1억 462만; Q3 2억 4,105만; Q4 4억 7,853만; Q5 15억 2,085만 | 2025-03-31 | Mean per household | same (xlsx, 순자산 5분위) | https://mods.go.kr/boardDownload.es?bid=215&list_no=439535&seq=8 | official (xlsx) |
| Mean income by income quintile | Q1 1,552만; Q2 3,586만; Q3 5,805만; Q4 8,847만; Q5 1억 7,338만 | 2024 income | Mean annual household income | same (xlsx, 소득 5분위) | same | official (xlsx); Q1 and Q5 are in korea-stats section 2 |
| Single-person households | income 3,423만/yr (46.1% of all households); assets 2억 2,302만; debt 4,019만 | 2024 income; 2025-03 assets | Per household | 국가데이터처, 2025 통계로 보는 1인가구 | https://mods.go.kr/boardDownload.es?bid=10820&list_no=442130&seq=8 | official (hwpx); 1-person households are 36.1% of households (2024) |

## 9. Wealth distribution
Retrieved: 2026-11-10

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| Households by net worth band | negative 3.0%; 0–1억 26.4%; 1–2억 15.4%; 2–3억 12.1%; 3–4억 8.9%; 4–5억 6.2%; 5–6억 4.6%; 6–7억 3.5%; 7–8억 3.3%; 8–9억 2.4%; 9–10억 2.3%; 10억+ 11.8% | 2025-03-31 | % of households | 국가데이터처·한국은행·금융감독원, 2025 가계금융복지조사 (table 1-2) | https://mods.go.kr/boardDownload.es?bid=215&list_no=439535&seq=6 | official (hwpx); 57.0% below 3억 |
| Median net worth | 2억 3,860만 (mean ÷ median 1.98) | 2025-03-31 | Per household | same | same | official (hwpx) |
| Net worth shares by decile | top 10% hold 46.1% (+1.6pp); 9th decile 18.5%; bottom 50% hold 9.1% | 2025-03-31 | % of all net worth | same (table 1-3) | same | official (hwpx); bottom 50% calc: −0.2+0.6+1.6+2.8+4.3 |
| Net worth Gini | 0.625 (0.612 a year earlier) | 2025-03-31 | Gini of household net worth | same | same | official (hwpx) |

## 10. Spending and saving (가계동향조사)
Retrieved: 2026-11-11

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| Monthly consumption per household | 293.9만 (+1.7%; real −0.4%); total household spending incl. taxes and interest 401.5만 | 2025 | Won/month, households of 1+ (average 2.19 people, head 53.4) | 국가데이터처, 2025년 4분기 및 연간(지출) 가계동향조사 | https://mods.go.kr/boardDownload.es?bid=214&list_no=443727&seq=2 | official (hwpx and xlsx) |
| Consumption by category | eating out & lodging 46.5만 (15.8%); food & drink 44.9만 (15.3%); housing & utilities 36.1만 (12.3%); transport 33.7만 (11.5%); other goods & services 25.0만 (8.5%); health 22.8만 (7.7%); education 20.9만 (7.1%); recreation & culture 17.5만 (6.0%); communication 16.7만 (5.7%); clothing 14.1만 (4.8%); household goods 12.0만 (4.1%); alcohol & tobacco 3.8만 (1.3%) | 2025 | Won/month and share of consumption | same | same | official (hwpx) |
| Non-consumption spending | 107.6만/month (taxes, social insurance, interest, transfers) | 2025 | Won/month | same (xlsx 1.1) | https://mods.go.kr/boardDownload.es?bid=214&list_no=443727&seq=4 | official (xlsx) |
| Income, disposable income, saving | income 529.5만/month (+4.5%); disposable 423.5만; consumption 293.2만; surplus ratio (saving) 30.8%; average propensity to consume 69.2% | 2026 Q2 | Won/month per household | 국가데이터처, 2026년 2/4분기 가계동향조사 | https://mods.go.kr/boardDownload.es?bid=214&list_no=446633&seq=1 | official (pdf) |
| Single-person household spending | 168.9만/month (58.4% of all households' 289만); housing & utilities 18.4%, eating out 18.2% | 2024 | Won/month | 국가데이터처, 2025 통계로 보는 1인가구 | https://mods.go.kr/boardDownload.es?bid=10820&list_no=442130&seq=8 | official (hwpx) |
| Household net saving rate (national accounts) | 8.6% (2025); 8.5 (2024); 7.0 (2023); 7.1 (2022); 9.5 (2021); 11.9 (2020, pandemic); 6.2 (2019); 4.8 (2018); 5.0 (2017); 6.5 (2016) | 2016–2025 | % of household net disposable income (가계순저축률) | Bank of Korea, ECOS 200Y101 (국민계정 주요지표) | https://ecos.bok.or.kr/api/StatisticSearch/sample/json/kr/1/10/200Y101/A/2016/2025/8010400 | official (ECOS API); the survey surplus ratio above (30.8% of disposable income left after consumption) is a different, household-survey measure |

## 11. Prices and inflation
Retrieved: 2026-11-11

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| Consumer price inflation | 2020 0.5; 2021 2.5; 2022 5.1; 2023 3.6; 2024 2.3; 2025 2.1 | 2020–2025 | % change on the year before (CPI) | 국가데이터처, 2025년 12월 및 연간 소비자물가동향 | https://mods.go.kr/boardDownload.es?bid=213&list_no=442792&seq=2 | official (pdf) |
| CPI level | 100.00 (2020) → 116.61 (2025) | 2025 | Index, 2020 = 100 | same | same | official (pdf); prices rose 16.6% in five years |
| Food and living-cost prices | food items in the living-cost index 2021 4.7; 2022 6.9; 2023 5.6; 2024 3.6; 2025 3.2; fresh food 2024 +9.8, 2025 −0.6; fresh fruit 2024 +17.1 | 2021–2025 | % a year | same | same | official (pdf) |
| Price rise by category | food & drink +3.2; eating out & lodging +3.1; housing & utilities +1.6; education +2.3; transport +1.3; health +1.1; communication −1.0 | 2025 | % on 2024 | same | same | official (pdf) |
| Latest inflation | 2.8% (core ex food & energy 2.8%; industrial goods 4.4%; fresh food −6.2%); July–Sept: 2.8, 3.1, 2.9 | 2026-10 | % on the same month a year before | 국가데이터처, 2026년 10월 소비자물가동향 | https://mods.go.kr/boardDownload.es?bid=213&list_no=447801&seq=2 | official (pdf) |
| Bank of Korea base rate | 3.00% since 2026-08-27; 2.75% from 2026-07-16; 2.50% before (unchanged from at least 2025-06 to 2026-07-15); 3.00% at the start of 2025 | 2025-01 → 2026-11-08 | % a year | Bank of Korea, ECOS 722Y001 (기준금리, daily) | https://ecos.bok.or.kr/api/StatisticSearch/sample/json/kr/1/10/722Y001/D/20260826/20260831/0101000 | official (ECOS API; dates found by querying single days, so the 2025 cuts' exact dates were not read) |
| Bank lending rates, new loans | household loans 4.96% (2026-09; 4.50% in 2026-01); mortgages 4.88% (4.29% in 2026-01); all loans 4.57%; deposits 3.45% | 2026-01 → 2026-09 | % a year, weighted average, new business at deposit banks | Bank of Korea, ECOS 121Y006 (예금은행 대출금리, 신규취급액) | https://ecos.bok.or.kr/api/StatisticSearch/sample/json/kr/1/10/121Y006/M/202601/202609/BECBLA0302 | official (ECOS API); rates climbed from July with the base-rate rises |

## 12. Taxes and social insurance
Retrieved: 2026-11-10

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| Income tax brackets | up to ₩14M 6%; 14–50M 15%; 50–88M 24%; 88–150M 35%; 150–300M 38%; 300–500M 40%; 500M–1B 42%; over 1B 45% | 2023 income onward (still in force 2026) | Marginal rate on taxable income (과세표준), national tax; local income tax adds 10% of the tax | National Tax Service (소득세법 제55조) | https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7667&mi=2227 | official (search-result text of the NTS page; the page itself was unreachable); the local-tax add-on is general knowledge, not read here |
| National pension contribution rate | 9% until 2025; 9.5% in 2026, +0.5pp a year to 13% in 2033; employees pay half, the employer half | 2026–2033 | % of reported monthly income | Ministry of Health and Welfare (2025-03-20 reform) | https://www.mohw.go.kr/board.es?mid=a10503000000&bid=0027&act=view&list_no=1485039 | official (page text); schedule calc: 2027 10.0, 2028 10.5, 2029 11.0, 2030 11.5, 2031 12.0, 2032 12.5, 2033 13.0 |
| National pension replacement rate | 43% from 2026 (would have fallen to 40% by 2028); 41.5% in 2025 | 2026 | Nominal replacement rate for 40 years of contributions at average income | same | same | official (page text); reform pushes fund depletion from 2056 to 2071 (with higher returns) |
| National pension income ceiling and floor | contributions are charged on ₩410k–₩6.59M a month from 2026-07 (was ₩400k–₩6.37M) | 2026 | 기준소득월액 상·하한 | MOHW, 2026 제1차 국민연금심의위원회 | https://www.mohw.go.kr/board.es?mid=a10503000000&bid=0027&act=view&list_no=1488572 | official (page text) |
| Average insured income (A값) | ₩3,193,511 | 2026 | Monthly, average of all members over 3 years | MOHW (2026-10-01 release) | https://www.mohw.go.kr/board.es?mid=a10503000000&bid=0027&act=view&list_no=1492125 | official (page text) |
| Pension credits | childbirth: from the first child (12 months; second child 15 months from 2027); military service: whole service period from 2027 dischargees (18 months adds ₩38,620/month to the pension) | 2026–2027 | Months added to contribution record | MOHW | https://www.mohw.go.kr/board.es?mid=a10503000000&bid=0027&act=view&list_no=1492125 | official (page text) |
| Health insurance and long-term care rates | health 7.19% of pay; long-term care 0.9448% of pay | 2026 | Contribution rate (employee and employer split) | MOHW (press-release titles 2025-08-28, 2025-11-04) | https://www.mohw.go.kr/board.es?mid=a10503000000&bid=0027 | official (list titles only; the releases were not opened) |
| Employment insurance premium | rise to 2.0% of pay (0.1pp each for worker and employer) proposed by the Employment Insurance Committee | 2026-09 | Unemployment-benefit premium | MOEL via news | https://biz.sbs.co.kr/amp/article/20000332159 | unverified (news); current 1.8% total not read from a primary page |

## 13. Pensions and old-age income
Retrieved: 2026-11-10

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| Any pension, people 65+ | 91.2% receive one; average ₩737k/month (men 957k, women 546k; 65–69 858k, 80+ 577k) | 2024 | Monthly, all 11 public and private pension types | 국가데이터처, 연금통계 (in 2026 고령자 통계) | https://mods.go.kr/boardDownload.es?bid=10820&list_no=447294&seq=4 | official (pdf); median ₩497k is from news, not read |
| Pension income trend, 65+ | ₩478k (2018) → 562k (2020) → 650k (2022) → 737k (2024) | 2018–2024 | Monthly average | same | same | official (pdf) |
| Pension received, people 55–79 | 52.7% receive one; average ₩880k/month (men 113만, women 61만); 37.7% get 25–50만 | 2026-05 | Monthly | 국가데이터처, 2026년 5월 고령층 부가조사 | https://mods.go.kr/boardDownload.es?bid=210&list_no=446335&seq=3 | official (pdf) |
| National pension recipients | about 7.52 million; benefits rose 2.1% in January 2026 (last year's CPI) | 2025-09 | Persons receiving national pension | MOHW | https://www.mohw.go.kr/board.es?mid=a10503000000&bid=0027&act=view&list_no=1488572 | official (page text) |
| Average national old-age pension | ₩700,427/month; ₩1,166,697 for 20+ years of contributions; 1.10M people get ₩1M+ | 2026-01 | Monthly | National Pension Service, 공표통계 (via news) | https://www.heraldk.com/article/2026050222592657376 | unverified (news citing NPS); NPS statistics pages are script-only here |
| Basic pension (기초연금) amount | ₩349,700/month single; ₩559,520 a couple (2025: 342,510 / 548,000) | 2026 | Maximum monthly 기준연금액 | MOHW | https://www.mohw.go.kr/board.es?mid=a10503000000&bid=0027&act=view&list_no=1488572 | official (page text); about 7.79 million recipients |
| Basic pension eligibility | 65+ with recognised income ≤ ₩2.47M/month single or ₩3.952M couple (2025: 2.28M / 3.648M); aimed at the poorest 70% of over-65s | 2026 | 선정기준액 | MOHW | https://www.mohw.go.kr/board.es?mid=a10503000000&bid=0027&act=view&list_no=1488478 | official (page text); 86% of recipients have recognised income under ₩1.5M; from 2027 needs 5 years' residence after age 19 |

## 14. Poverty and inequality
Retrieved: 2026-11-10

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| Relative poverty rate | 15.3% (+0.4pp); men 13.6%, women 17.1%; poverty line ₩19.66M/yr | 2024 income | % below 50% of median equivalised disposable income | 국가데이터처·한국은행·금융감독원, 2025 가계금융복지조사 (table 6-4) | https://mods.go.kr/boardDownload.es?bid=215&list_no=439535&seq=6 | official (hwpx); updates the 2023 figure (14.9%) in section 2 |
| Poverty by age group | working age (18–65) 10.3%; retirement age (66+) 37.7% (men 31.3, women 42.7) | 2024 income | % | same (table 6-5) and 2026 고령자 통계 | same | official (hwpx); before taxes and transfers 66+ poverty is 57.3% |
| Elderly poverty trend | 66+: 43.8 (2017) → 40.5 (2020) → 39.8 (2023) → 37.7 (2024) | 2017–2024 | % | 국가데이터처, 2026 고령자 통계 | https://mods.go.kr/boardDownload.es?bid=10820&list_no=447294&seq=4 | official (pdf) |
| Elderly poverty, OECD comparison | 66+: Korea 39.8; US 22.9; Switzerland 17.8; UK 15.0; Germany 14.5; France 6.2; Norway 3.2 | 2023 | % | OECD Social and Welfare Statistics (table in 2026 고령자 통계) | same | official (pdf, citing OECD 2026-09-01); Korea is among the highest |
| Gini and income quintile ratio | Gini 0.325; S80/S20 5.78; working age Gini 0.303 (S80/S20 5.01); 66+ Gini 0.377 (6.90) | 2024 income | Equivalised disposable income | 2025 가계금융복지조사 | https://mods.go.kr/boardDownload.es?bid=215&list_no=439535&seq=6 | official (hwpx); the overall Gini row is in section 2 |

---

## Game ideas

- **Age–earnings curve**: drive yearly pay from the 2024 wage-job table (section 4): men peak around 45–55 at about 545만/month, women peak around 40–44 at about 363만 and fall afterwards. Multiply by an education factor (high school 0.65, junior college 0.79, university 1.0, graduate 1.53 of university pay) and a firm factor (SME about 0.57 of a 300+ firm), then add tenure steps (214만 under a year → 848만 after 20 years).
- **Career break for women**: the employment rate dip from 75% (30–34) to 67% (40–44) gives a probability of leaving work after a child; pair with family-and-relationships.md for leave rules.
- **Contract type**: roll a non-regular job with about 38% probability (higher for the young, the old and women); non-regular pays about 52% a month (211만 vs 405만), has a 3-year average tenure, and only 36% are in the national pension (so smaller pension later).
- **Job changes**: about 15% of workers change employer each year (21% under 30); 58% of moves raise pay. Moving from an SME to a large firm is rare (12% of SME movers), which can make the first job's firm size sticky.
- **Retirement event**: the main career job ends at about 53 (men 55, women 51), mostly because of business closure, health or caring. After that, offer bridge jobs: 70% of 55–79-year-olds want to work, to about 74, mostly for money.
- **Starting a business**: about 36.5% of new firms survive 5 years (restaurants 28%, health and welfare 64%); use the year-by-year survival table (64% → 54% → 47% → 40% → 37%) as an annual hazard.
- **Pension at 65**: build the national pension from contribution years (9.5% rising to 13% by 2033, 43% replacement for 40 years at the A값 ₩3.19M); add the basic pension (₩349,700) if monthly income is under ₩2.47M; the average over-65 gets ₩737k from all pensions, men about 1.75× women.
- **Household balance sheet by age**: start adult life near the under-30 figures (net worth median 5,000만, debt 4,703만), grow toward the 50s peak (mean 5.5억); about 12% of households reach 10억+. Debt service around 22% of disposable income is normal; above that, raise stress.
- **Monthly budget screen**: split spending by the 2025 shares (food and eating out about 31%, housing 12%, transport 11.5%, education 7%); a single person spends about 169만/month.
- **Inflation and minimum wage**: prices rose 16.6% from 2020 to 2025 (5.1% in 2022); index nominal amounts by year. Minimum wage ₩10,320 (2026) and ₩10,700 (2027) sets part-time pay.
- **Old-age poverty risk**: after 66, about 38% are below the poverty line (women 43%); make low pension + no home a high-risk path.
- **Unemployment spell**: most unemployment ends within 2 months; benefits pay 60% of the old wage, capped at ₩68,100 a day, averaging ₩1.63M a month.

## Gaps

- Pensionable-age schedule (63 now, 65 from the 1969 birth cohort) and the national pension benefit formula (A and B values): not read from a primary page (law.go.kr and nps.or.kr unreachable).
- National pension average old-age pension: only news citing NPS 공표통계.
- Income-tax table read only through search-result text of the NTS page; earned-income deduction and tax credits not collected, so no "take-home pay" table yet.
- Employment-insurance rules (benefit rate, cap, duration by age and insured period) are unverified; the duration table (120–270 days) is missing.
- The Bank of Korea's own household-debt-to-disposable-income ratio (flow-of-funds basis); section 8 has a calc from 가계신용 and national-accounts income instead.
- Wages by occupation and named jobs over a career (e.g. a teacher's or civil servant's pay scale by step) are not here.
- 2025 연금통계 median pension and pension by household; 2024 소득이동통계 primary release (section 15 is still news-based).
- Wealth quintile cut-off values (only quintile means and within-quintile medians are published in the xlsx read).
- Youth NEET in the OECD definition (15–29 not in employment, education or training): Korea is not in the OECD Education at a Glance transition dataset (DF_LSO_TRANS_ALL, checked 2026-11-11).
