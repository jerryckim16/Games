# Korea in numbers: health, ageing and the end of life

Scope: official Korean statistics on lifespan, mortality, disease, health behaviour, healthcare use and costs, later life and adult accidents, for an adult-life extension of the Suneung Simulator. It extends `data/korea-stats.md` section 11 (child traffic accidents, cancer incidence by age 40–59) and does not repeat those rows. Format and status tags follow `data/README.md`. Work and pension income belong in a separate file; only health-side later-life figures are here.

Sources read: attachments on mods.go.kr (국가데이터처) boards were downloaded and read in full: `2024년 생명표 보도자료 (2).hwpx` (bid 208, list 439533), `2025년_사망원인통계 결과.pdf` (bid 218, list 447102), `2026 고령자 통계.hwpx` (bid 10820, list 447294), `2025 한국의 사회지표.hwpx` (bid 10820, list 443371) and `2024년 사회조사 결과 보도자료.pdf` (bid 219, list 433638). KDCA's 2025 KNHANES release page was read, along with its attachment `[별첨] 2025년 국민건강영양조사 주요결과.pdf`. MOHW press-release pages were read as page text, and the OECD release's `.hwpx` attachment was also read. The MOEL attachment `2025년 산업재해현황(홈페이지).hwp` was read. The KoROAD TAAS page was read as page text.

---

## 1. Lifespan and survival
Retrieved: 2026-11-10

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| Life expectancy at birth | 83.7 (men 80.8, women 86.6) | 2024 | Years, period life table | 국가데이터처 (Statistics Korea), 생명표 | https://mods.go.kr/board.es?mid=a10301010000&bid=208&act=view&list_no=439533 | official; attachment `2024년 생명표 보도자료 (2).hwpx` [표 2]. Up 0.2 from 2023 (83.5). Record high. The 2025 life table is due in December 2026 |
| Life expectancy trend | 62.3 (1970), 76.0 (2000), 83.6 (2021), 82.7 (2022), 83.5 (2023), 83.7 (2024) | 1970–2024 | Years at birth | 국가데이터처 | same | official; attachment infographic and [표 1]. The 2022 drop is COVID-19 |
| Remaining life expectancy at 40 | men 41.9, women 47.4 | 2024 | Years | 국가데이터처 | same | official; [표 2] |
| Remaining life expectancy at 60 | men 23.7, women 28.4 | 2024 | Years | 국가데이터처 | same | official; [표 2] |
| Remaining life expectancy at 65 | men 19.5, women 23.7 (both 21.7) | 2024 | Years | 국가데이터처 | same | official; [표 9]. Both-sex 21.7 from 2026 고령자 통계 |
| Remaining life expectancy at 80 / 90 / 100+ | 80: men 8.5, women 10.9; 90: men 4.0, women 5.1; 100+: men 1.9, women 2.3 | 2024 | Years | 국가데이터처 | same | official; [표 2] |
| Korea vs OECD life expectancy | Korea men 80.8 vs OECD 78.5; women 86.6 vs 83.7 | 2024 (OECD latest) | Years | 국가데이터처 citing OECD.Stat | same | official; Korea is 2.3 years (men) and 2.9 years (women) above the OECD average |
| Healthy life expectancy (excluding years with illness) | 65.5 (men 64.6, women 66.4) | 2024 | Years, 유병기간 제외 기대수명 | 국가데이터처 | same | official; [표 10]. Years lived with illness: men 16.2, women 20.2. Healthy share of life: men 79.9%, women 76.7% |
| Healthy years left at 40 / 60 / 80 | 40: 28.3 of 44.7; 60: 12.2 of 26.1; 80: 3.2 of 9.9 | 2024 | Years, both sexes | 국가데이터처 | same | official; [표 10]. Healthy share falls from 63.5% at 40 to 32.0% at 80 |
| Self-rated healthy life expectancy | 73.8 (men 73.2, women 74.5) | 2024 | Years rated healthy by oneself | 국가데이터처 | same | official; [표 11]. Built on the 2024 사회조사 |
| Probability a newborn survives to 65 | men 88.9%, women 94.8% | 2024 | % of birth cohort | 국가데이터처 | same | official; [표 3]. 1970: men 47.7%, women 66.0% |
| Probability a newborn survives to 80 | men 64.4%, women 82.2% | 2024 | % | 국가데이터처 | same | official; [표 3] |
| Probability a newborn survives to 90 | men 24.0%, women 45.2%, both 34.6% | 2024 | % | 국가데이터처 | same | calc: l90 / l0 from the complete life table (appendix 3 of the attachment): men 24,025, women 45,202, both 34,614 per 100,000 |
| Probability a newborn survives to 100 | men 1.2%, women 4.8% | 2024 | % | 국가데이터처 | same | official; [표 3] |
| Probability a 65-year-old survives to 80 | men 72.4%, women 86.8% | 2024 | % | 국가데이터처 | same | official; [표 4] |
| Probability a 65-year-old survives to 90 | men 27.0%, women 47.7% | 2024 | % | 국가데이터처 | same | calc: l90 / l65 = 24,025 / 88,874 (men), 45,202 / 94,755 (women) |
| Lifetime probability of dying of cancer / heart disease / pneumonia (newborn) | cancer: men 24.5%, women 15.2%; heart: men 8.9%, women 10.8%; pneumonia: men 10.8%, women 10.0% | 2024 | % of newborns who will die of the cause | 국가데이터처 | same | official; [표 6]. Alzheimer's: men 3.0%, women 6.3%; suicide: men 3.2%, women 1.4%; transport accidents: men 0.9%, women 0.4% |
| Life-expectancy gain if cancer were eliminated | men +4.1, women +2.5 | 2024 | Years at birth | 국가데이터처 | same | official; heart disease: +1.2 / +1.0; pneumonia: +1.1 / +0.9 |

## 2. Population ageing
Retrieved: 2026-11-10

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| Population 65+ | 11,125,000 = 21.6% of population | 2026 | Persons, % (projection base) | 국가데이터처, 2026 고령자 통계 | https://mods.go.kr/board.es?mid=a10301010000&bid=10820&act=view&list_no=447294 | official; attachment `2026 고령자 통계.hwpx`. Projected to pass 30% in 2036 and 40% in 2050 |
| Share 65+ by sex | women 23.9%, men 19.2% | 2026 | % of each sex | 국가데이터처 | same | official; 80.3 men per 100 women aged 65+ |
| 65+ by age group | 65–69: 7.6%, 70–74: 5.3%, 75+: 8.6% of total population | 2026 | % | 국가데이터처 | same | official; 75+ outnumber 65–74 from 2038 |
| Oldest regions | 전남 28.6%, 경북 27.6%, 강원 27.1%, 전북 26.7%, 부산 25.9% | 2026 | % 65+ | 국가데이터처 | same | official |
| Super-aged society (≥ 20% aged 65+) | Reached 23 Dec 2024: 10,244,550 of 51,221,286 registered residents (20.00%) | 2024 | 주민등록 (resident registration) | 행정안전부 (MOIS), via news | https://www.newsis.com/view/NISX20241224_0003009655 | unverified; read only in news citing the MOIS release. Aged society (14%) came in 2017, so the step to 20% took 7 years |
| Households headed by someone 65+ | 6,507,000 = 28.8% of households; 38.0% of them one-person | 2026 | Households | 국가데이터처 | https://mods.go.kr/board.es?mid=a10301010000&bid=10820&act=view&list_no=447294 | official; projected 50.6% of all households by 2052 |
| Elderly one-person households | about 2,473,000 | 2026 | Households | 국가데이터처 | same | calc: 6,507,000 × 38.0% |

## 3. Deaths and causes of death
Retrieved: 2026-11-10

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| Deaths per year | 362,968 (men 193,547, women 169,421) | 2025 | Deaths | 국가데이터처, 사망원인통계 | https://mods.go.kr/board.es?mid=a10301010000&bid=218&act=view&list_no=447102 | official; attachment `2025년_사망원인통계 결과.pdf` [표 1]. 994 a day. Crude rate 712.6 per 100,000 |
| Deaths per year, trend | 255,405 (2010), 304,948 (2020), 372,939 (2022), 352,511 (2023), 358,569 (2024), 362,968 (2025) | 2010–2025 | Deaths | 국가데이터처 | same | official; [표 1] |
| Share of deaths at 80+ | 54.7% (men 41.9%, women 69.4%) | 2025 | % of all deaths | 국가데이터처 | same | official; up 13.9 percentage points in 10 years |
| Age-standardised death rate | 285.3 | 2025 | Per 100,000 standard population | 국가데이터처 | same | official; lowest in Seoul (242.7), highest in 경북 (320.8) |
| Top 10 causes (rate per 100,000) | cancer 177.1, heart disease 66.3, pneumonia 60.8, cerebrovascular 48.7, suicide 27.8, Alzheimer's 26.8, diabetes 22.4, sepsis 17.2, hypertensive disease 17.0, liver disease 14.9 | 2025 | Crude rate | 국가데이터처 | same | official; the top 3 cause 42.7% of deaths. Cancer causes 24.9% of deaths |
| Cancer deaths by site | lung 38.9, liver 20.4, colorectal 19.1, pancreas 17.0, stomach 13.7 | 2025 | Per 100,000 | 국가데이터처 | same | official |
| Leading cause by age band | 0: perinatal conditions (49.8% of deaths); 1–9: cancer (20.2%); 10–19, 20–29, 30–39, 40–49: suicide (51.2%, 53.5%, 42.3%, 25.4%); 50–59: cancer (33.7%), then suicide (12.3%); 60–69, 70–79, 80+: cancer (41.3%, 35.9%, 16.2%) | 2025 | Share of deaths in the band | 국가데이터처 | same | official; [그림 4]. At 80+ the next causes are pneumonia (11.9%) and heart disease (10.3%) |
| 2nd–3rd causes by age band | 20s: cancer, transport accident; 30s: cancer, heart disease; 40s: cancer, liver disease; 50s: suicide, heart disease; 60s: heart disease, cerebrovascular; 70s: heart disease, cerebrovascular | 2025 | Rank | 국가데이터처 | same | official; [그림 4] |
| External-cause deaths | 29,088 = 8.0% of deaths; rate 57.1 (men 78.0, women 36.4) | 2025 | Per 100,000 | 국가데이터처 | same | official; [표 10]. Suicide 27.8, transport 6.5, falls 5.2, drowning 0.8, fire 0.6, poisoning 0.5, homicide 0.5 |
| Alcohol-related deaths | 4,841; rate 9.5 (men 16.0, women 3.1) | 2025 | Per 100,000 | 국가데이터처 | same | official; [표 17]. Peak in men aged 60–69 (34.8) and women aged 50–59 (6.6) |
| Dementia deaths | 16,321; rate 32.0 (men 20.7, women 43.2) | 2025 | Per 100,000 | 국가데이터처 | same | official; [표 18]. Up 9.2% on 2024. Alzheimer's 26.8 |
| Lonely deaths (고독사) | 3,924 (7.7 per 100,000; 1.09 per 100 deaths) | 2024 | Deaths meeting the 고독사예방법 definition | 보건복지부 (MOHW), 고독사 실태조사 | https://www.mohw.go.kr/board.es?mid=a10503000000&bid=0027&act=view&list_no=1488039 | official; up from 3,279 in 2020. Men 81.7%. Ages 60–69 32.4%, 50–59 30.5%. Rate per 100,000 peaks at 60–69 (16.6). 13.4% were suicides |

## 4. Age-specific mortality (for a death roll by age)
Retrieved: 2026-11-10

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| Death rate by age, men | 20–29: 46.9; 30–39: 84.3; 40–49: 174.7; 50–59: 404.7; 60–69: 914.9; 70–79: 2,384.6; 80+: 9,307.3 | 2025 | Per 100,000 of that age | 국가데이터처 | https://mods.go.kr/board.es?mid=a10301010000&bid=218&act=view&list_no=447102 | official; [표 3]. Ages 1–9: 10.7; 10–19: 18.3 |
| Death rate by age, women | 20–29: 30.4; 30–39: 47.1; 40–49: 93.5; 50–59: 170.9; 60–69: 333.2; 70–79: 1,061.8; 80+: 7,356.3 | 2025 | Per 100,000 | 국가데이터처 | same | official; [표 3]. The male/female ratio peaks at 60–69 (2.7×) |
| Annual probability of death (qx), men | age 20: 0.032%; 30: 0.068%; 40: 0.123%; 50: 0.284%; 60: 0.645%; 70: 1.523%; 80: 4.870%; 90: 16.661%; 95: 26.662% | 2024 | Probability of dying before the next birthday | 국가데이터처, complete life table | https://mods.go.kr/board.es?mid=a10301010000&bid=208&act=view&list_no=439533 | official; appendix "3. 완전 생명표, 2024년" in the hwpx (single-year qx and lx for ages 0–100+). Age 0: 0.261% |
| Annual probability of death (qx), women | age 20: 0.027%; 30: 0.041%; 40: 0.078%; 50: 0.136%; 60: 0.230%; 70: 0.599%; 80: 2.558%; 90: 11.613%; 95: 20.529% | 2024 | as above | 국가데이터처 | same | official; age 0: 0.214% |
| Survivors (lx) per 100,000 births | men: 40 = 98,125; 50 = 96,368; 60 = 92,331; 70 = 83,948; 80 = 64,373; 85 = 45,883 / women: 40 = 98,721; 50 = 97,758; 60 = 96,068; 70 = 92,720; 80 = 82,221; 85 = 68,188 | 2024 | Life-table survivors | 국가데이터처 | same | official; complete life table |

## 5. Suicide
Retrieved: 2026-11-10

Korea's suicide-prevention line is 109 (자살예방상담전화, MOHW). The release that confirms it is listed in the table below. KOSTAT asks reporting to follow MOHW's 「자살보도 권고기준 4.0」. A game should show the support number and avoid describing methods.

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| Suicide deaths | 14,144 (men 10,058, women 4,086); 38.8 a day | 2025 | Deaths | 국가데이터처 | https://mods.go.kr/board.es?mid=a10301010000&bid=218&act=view&list_no=447102 | official; [표 12]. 14,872 in 2024, so down 4.9% |
| Suicide rate | 27.8 (men 39.7, women 16.0) | 2025 | Per 100,000 | 국가데이터처 | same | official; 29.1 in 2024, 26.5 in 2015 |
| Suicide rate by age, men | 10–19: 8.0; 20–29: 23.8; 30–39: 36.8; 40–49: 48.9; 50–59: 52.5; 60–69: 44.9; 70–79: 54.7; 80+: 101.8 | 2025 | Per 100,000 | 국가데이터처 | same | official; [표 12] |
| Suicide rate by age, women | 10–19: 9.4; 20–29: 17.7; 30–39: 18.7; 40–49: 19.1; 50–59: 18.4; 60–69: 13.7; 70–79: 14.3; 80+: 25.8 | 2025 | Per 100,000 | 국가데이터처 | same | official; the rate is higher for girls than boys at 10–19 and higher for men from 20 up |
| OECD comparison | Korea 24.9 vs OECD average 10.9 | 2025 (Korea) | Age-standardised per 100,000 (OECD standard population) | 국가데이터처 | same | official; highest in the OECD. Korea's figure was computed by KOSTAT, because the OECD has only published up to 2023 |
| Lifetime suicidal ideation / plan / attempt (adults) | 10.7% / 2.5% / 1.7%; past year 1.3% / 0.5% / 0.1% | 2021 | % of adults 18–79 | 보건복지부, 정신건강실태조사 | https://www.mohw.go.kr/board.es?mid=a10503000000&bid=0027&act=view&list_no=369088 | official; 56.8% of those with ideation had a lifetime mental disorder |
| Support line 109 | Suicide prevention line 109, operating through holidays | 2025 | Phone number | 보건복지부 | https://www.mohw.go.kr/board.es?mid=a10503000000&bid=0027&act=view&list_no=1492053 | official (excerpt); read from the release title "추석연휴에도 자살예방상담은 109" in the MOHW list. Another release (list 1492486) says 109 now connects callers to debt counselling (1375) |

## 6. Disease: cancer, chronic disease, dementia
Retrieved: 2026-11-10

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| New cancer cases | 288,613 (men 151,126, women 137,487) | 2023 | Cases | 보건복지부 / 국립암센터 (국가암등록통계) | https://www.mohw.go.kr/board.es?mid=a10503000000&bid=0027&act=view&list_no=1488742 | official; age-standardised 522.9 per 100,000 (men 587.0, women 488.9). 50.4% of new cases are 65+. Updates the 2022 row in korea-stats.md |
| Lifetime risk of cancer | men 44.6%, women 38.2% | 2023 | Probability of developing cancer over a lifetime at current rates | 보건복지부 / 국립암센터 | same | official |
| 5-year relative cancer survival | 73.7% (men 68.2%, women 79.4%) | 2019–23 diagnoses | Relative survival | 보건복지부 / 국립암센터 | same | official; localised 92.7%, distant 27.8%. Thyroid 100.2%, prostate 96.9%, breast 94.7%, lung 42.5%, liver 40.4%, pancreas 17.0% |
| Most common cancers | all: thyroid, lung, colorectal, breast, stomach, prostate, liver; men: prostate (first time at #1), lung, stomach; women: breast, thyroid, colorectal | 2023 | Rank | 보건복지부 / 국립암센터 | same | official; by age: thyroid at 10–39, breast at 50–59, lung at 60+ |
| People living with cancer | 2,732,906 = 5.3% of population (1 in 19) | 1 Jan 2024 | Persons diagnosed 1999–2023 and alive | 보건복지부 / 국립암센터 | same | official; 62.1% are more than 5 years past diagnosis |
| Hypertension prevalence by age | 19–29: 2.4%; 30–39: 10.8%; 40–49: 22.8%; 50–59: 37.4%; 60–69: 48.0%; 70+: 68.3% (men 28.2%, women 17.8% overall) | 2025 | % of adults 19+, ≥140/90 mmHg or on medication | 질병관리청 (KDCA), 국민건강영양조사 | https://www.kdca.go.kr/bbs/kdca/42/312791/artclView.do | official; attachment `[별첨] 2025년 국민건강영양조사 주요결과.pdf`, table 11. Overall rates are age-standardised; age rows are crude. The 2025 figures are provisional |
| Diabetes prevalence by age | 19–29: 0.7%; 30–39: 2.7%; 40–49: 10.4%; 50–59: 17.3%; 60–69: 24.8%; 70+: 31.2% (men 13.1%, women 7.6%) | 2025 | % of adults 19+ (fasting glucose ≥126, diagnosis, medication or HbA1c ≥6.5%) | KDCA | same | official; attachment, table 12. Men 50–59: 24.3% |
| Obesity (BMI ≥ 25) by age and sex | men 49.1% (30–39: 59.0%, 40–49: 53.3%, 50–59: 54.0%, 70+: 32.4%); women 28.7% (19–29: 21.3%, 40–49: 31.6%, 70+: 38.6%); all 39.5% | 2025 | % of adults 19+ | KDCA | same | official; attachment, table 10. Up from 34.8% in 2016. Underweight: women 19–29 19.9% |
| High cholesterol, COPD, osteoporosis | cholesterol: men 26.1%, women 22.4%; COPD (40+): men 16.1%, women 5.0%; osteoporosis (50+): men 3.6%, women 21.4% | 2025 | % | KDCA | same | official; release page text |
| Dementia prevalence 65+ | 9.25% (mild cognitive impairment 28.42%) | 2023 | % of people 65+ | 보건복지부, 치매역학조사 (중앙치매센터) | https://www.mohw.go.kr/board.es?mid=a10503000000&bid=0027&act=view&list_no=1484959 | official; 9.50% in 2016. Estimated 970,000 patients in 2025, over 1 million from 2026, over 2 million by 2044. Higher with age, for women, in rural areas and for people living alone |
| Dementia cost per patient | 17.339 million won (living in the community), 31.382 million won (in a facility or hospital) | 2023 | Won per year | 보건복지부 | same | official; care costs exceed medical costs. Families care for 27.3 months on average before admission to a facility |
| Chronic diseases per older person | 2.2 | 2023 | Average count per person 65+ | 보건복지부, 노인실태조사 | https://www.mohw.go.kr/board.es?mid=a10503000000&bid=0027&act=view&list_no=1483352 | official; survey of 10,078 people. Depressive symptoms 11.3%, a fall in the past year 5.6% |

## 7. Mental health
Retrieved: 2026-11-10

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| Stress perception by age | 19–29: 20.0%; 30–39: 24.8%; 40–49: 21.3%; 50–59: 16.4%; 60–69: 10.0%; 70+: 8.7% (men 16.2%, women 22.2%) | 2025 | % feeling "very much / much" stress, adults 19+ | KDCA, 국민건강영양조사 | https://www.kdca.go.kr/bbs/kdca/42/312791/artclView.do | official; attachment, section 4. Women 30–39: 29.2% |
| Depressed mood (2+ weeks) by age | 19–29: 7.7%; 30–39: 9.4%; 40–49: 6.8%; 50–59: 6.4%; 60–69: 5.5%; 70+: 6.5% (men 4.7%, women 10.3%) | 2025 | % with 2+ weeks of sadness that disrupted daily life in the past year | KDCA | same | official; attachment, section 4. Measured every other year |
| Loneliness | 6.4% (men 5.3%, women 7.5%; women 30–39: 9.7%) | 2025 | % feeling lonely "always / often", adults 19+ | KDCA | same | official; new item in 2025. Social support 94.5% (20–29: 98.6%, 70+: 87.8%) |
| Life satisfaction | 6.9 out of 10 (men 7.0, women 6.9) | 2025 | Mean score, adults 19+ | KDCA | same | official; a score of 4 or below is 10%+ among people in their 20s, 30s and 70+ |
| Mental disorder prevalence | 1-year 8.5%; lifetime 27.8% (men 32.7%, women 22.9%) | 2021 | % of adults 18–79 (alcohol, nicotine, depressive, anxiety disorders) | 보건복지부, 정신건강실태조사 | https://www.mohw.go.kr/board.es?mid=a10503000000&bid=0027&act=view&list_no=369088 | official; 1-year rates: depressive disorder 1.7% (men 1.1%, women 2.4%), anxiety 3.1%, alcohol use disorder 2.6%. Newest adult survey found; see Gaps |
| Mental health service use | 12.1% lifetime, 7.2% past year among people with a disorder; depression 28.2% | 2021 | % of those diagnosed | 보건복지부 | same | official; vs USA 43.1% (2015) |

## 8. Lifestyle
Retrieved: 2026-11-10

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| Cigarette smoking by age, men | 19–29: 25.2%; 30–39: 28.2%; 40–49: 31.4%; 50–59: 34.4%; 60–69: 25.6%; 70+: 16.6% (all men 28.0%) | 2025 | % current smokers (100+ cigarettes in life and smoking now), 19+ | KDCA, 국민건강영양조사 | https://www.kdca.go.kr/bbs/kdca/42/312791/artclView.do | official; attachment table 1. 40.7% in 2016 |
| Cigarette smoking by age, women | 19–29: 6.9%; 30–39: 7.7%; 40–49: 5.0%; 50–59: 4.3%; 60–69: 2.9%; 70+: 1.4% (all women 5.5%) | 2025 | as above | KDCA | same | official; any tobacco product (incl. e-cigarettes): men 36.3%, women 8.6% |
| High-risk drinking by age, men | 19–29: 9.7%; 30–39: 16.9%; 40–49: 23.3%; 50–59: 25.6%; 60–69: 19.1%; 70+: 8.8% (all men 17.6%) | 2025 | % drinking 7+ drinks (men) / 5+ (women) per occasion, 2+ times a week | KDCA | same | official; attachment table 2 |
| High-risk drinking by age, women | 19–29: 8.9%; 30–39: 11.3%; 40–49: 8.9%; 50–59: 5.1%; 60–69: 1.7%; 70+: 0.4% (all women 7.6%; all adults 12.6%) | 2025 | as above | KDCA | same | official; monthly binge drinking 35.1% of adults |
| Aerobic physical activity by age | 19–29: 60.6%; 30–39: 54.2%; 40–49: 47.9%; 50–59: 43.8%; 60–69: 40.0%; 70+: 29.0% (all 49.5%) | 2025 | % meeting 150 min moderate / 75 min vigorous a week | KDCA | same | official; strength training 26.4%, walking 41.7% |
| Older people's exercise | walking 49.0%, aerobic 32.7%, strength 24.6% | 2024 | % of people 65+ | 국가데이터처, 2026 고령자 통계 (from KDCA) | https://mods.go.kr/board.es?mid=a10301010000&bid=10820&act=view&list_no=447294 | official |
| Healthy habits of older people | breakfast 91.6%, adequate sleep (6–8 h) 82.4%, regular exercise 52.0% | 2024 | % of people 65+ who practise | 국가데이터처, 사회조사 | same | official; exercise is up 9.3 percentage points in 10 years. This is the only sleep figure found |
| Self-rated health | 53.8% "good" (men 57.2%, women 50.5%); age 10–19: 83.8%, 60+: 34.1% | 2024 | % of people 13+ | 국가데이터처, 2024 사회조사 | https://mods.go.kr/board.es?mid=a10301010000&bid=219&act=view&list_no=433638 | official; attachment `2024년 사회조사 결과 보도자료.pdf` |
| Stress in daily life | 38.4% (women 40.1%); work stress 62.1%, school 35.7%, home 34.7% | 2024 | % of people 13+ | 국가데이터처, 2024 사회조사 | same | official; down 6.5 percentage points from 2022 |
| Health check-up participation, adults | 75.6% (17.517 million of 23.182 million eligible); cancer screening 60.2% | 2024 | % of those eligible for the NHIS general check-up | 국민건강보험공단 (NHIS), 건강검진통계연보, via news | https://www.heraldk.com/article/2025123017000062652 | unverified; nhis.or.kr was unreachable. News outlets disagree on the year-on-year change |
| Health check-up participation, 65+ | 68.9% (65–69: 79.0%, 70–79: 73.8%, 80+: 43.8%) | 2024 | % of people 65+ | 국가데이터처, 2026 고령자 통계 (from NHIS) | https://mods.go.kr/board.es?mid=a10301010000&bid=10820&act=view&list_no=447294 | official |

## 9. Healthcare use and costs
Retrieved: 2026-11-10

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| Doctor visits per person | 18.0 (OECD average 6.5; Japan 12.1) | 2023 | Outpatient doctor consultations per person per year | 보건복지부, OECD Health Statistics 2025 | https://www.mohw.go.kr/board.es?mid=a10503000000&bid=0027&act=view&list_no=1487082 | official; attachment `.hwpx`. Highest in the OECD (HIRA data) |
| Average length of hospital stay | 17.5 days (acute care 7.2; OECD 8.1 / 6.5) | 2023 | Days per inpatient | 보건복지부, OECD Health Statistics 2025 | same | official; second-longest after Japan (26.3) |
| Hospital beds | 12.6 (OECD 4.2) | 2023 | Per 1,000 people | 보건복지부 | same | official; most in the OECD. Practising doctors 2.7 per 1,000 (OECD 3.9) |
| Current health spending | 8.5% of GDP (OECD 9.1%) | 2023 | % of GDP | 보건복지부 | same | official |
| Household out-of-pocket share | 31.2% of current health spending (38.3% in 2013) | 2023 | % | 보건복지부 | same | official; government and compulsory schemes 60.4% |
| Medical spending per person, all ages | 2.26 million won; out-of-pocket 557,000 won (24.7%) | 2024 | Won per insured person per year (NHIS-covered care only) | 국가데이터처, 2026 고령자 통계 (from NHIS/HIRA 건강보험통계) | https://mods.go.kr/board.es?mid=a10301010000&bid=10820&act=view&list_no=447294 | official; excludes non-covered (비급여) care |
| Medical spending per person, 65+ | 5.376 million won (65–74: 4.357 million; 75+: 6.888 million); out-of-pocket 1.256 million (65–74: 1.038 million; 75+: 1.581 million) | 2024 | Won per insured person per year | 국가데이터처 (from NHIS/HIRA) | same | official; 65+ spend 2.4× the all-age average (calc: 5,376 / 2,260); 75+ spend 3.0× (calc: 6,888 / 2,260) |
| Health insurance premium rate | 7.19% of wage (2026); 7.09% (2024 and 2025, frozen) | 2026 | % of pay, employee and employer split it half and half | 보건복지부 | https://www.mohw.go.kr/board.es?mid=a10503000000&bid=0027&act=view&list_no=1487279 | official for 2026; the 2025 rate is calc: 7.19% − 0.1 percentage point per the release (MOHW list 1483034 says "2년 연속 동결"). Average monthly employee share: 158,464 won (2025) → 160,699 won (2026); self-employed household 90,242 won (2026) |
| Long-term care insurance premium | 13.14% of the health premium = 0.9448% of income (2026); 0.9182% (2025) | 2026 | % | 보건복지부 | https://www.mohw.go.kr/board.es?mid=a10503000000&bid=0027&act=view&list_no=1487817 | official; average 18,362 won per household a month (2026) |

## 10. Later life: care, living alone, wellbeing
Retrieved: 2026-11-10

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| Long-term care (장기요양) certified, 65+ | 10.9% (men 7.0%, women 14.0%); 65–69: 1.9%, 70–79: 6.5%, 80+: 32.9% (men 21.3%, women 39.2%) | 2025 | % of people 65+ certified grade 1–5 or cognitive-support grade | 국가데이터처, 2026 고령자 통계 (from NHIS 노인장기요양보험통계) | https://mods.go.kr/board.es?mid=a10301010000&bid=10820&act=view&list_no=447294 | official; 7.6% in 2017 |
| Long-term care recipients | 1.019 million (2022), 1.098 million (2023), 1.165 million (2024) | 2024 | Persons | 보건복지부 | https://www.mohw.go.kr/board.es?mid=a10503000000&bid=0027&act=view&list_no=1487817 | official; home care, grade 1: up to 44 three-hour home visits a month in 2026 |
| LTC users vs OECD | home 9.0%, institution 2.7% of 65+ (OECD 11.2% / 3.5%) | 2023 | % of 65+ | 보건복지부, OECD Health Statistics 2025 | https://www.mohw.go.kr/board.es?mid=a10503000000&bid=0027&act=view&list_no=1487082 | official |
| Nursing homes | 4,758 노인요양시설 + 1,453 group homes = 6,211 residential care facilities; 19,146 home-care agencies | 2025 | Facilities | 국가데이터처, 2026 고령자 통계 (from MOHW 노인복지시설현황) | https://mods.go.kr/board.es?mid=a10301010000&bid=10820&act=view&list_no=447294 | official; 69,687 경로당 (senior centres) |
| Older people living alone | 32.8% of people 65+ live alone (up 13.0 percentage points from 2020); living with children 10.3% | 2023 | % of people 65+ | 보건복지부, 노인실태조사 | https://www.mohw.go.kr/board.es?mid=a10503000000&bid=0027&act=view&list_no=1483352 | official; people living alone vs couples: "healthy" 34.2% vs 48.6%, depressive symptoms 16.1% vs 7.8% |
| Loneliness 65+ | 43.4% feel lonely (5.1 percentage points above all ages) | 2025 | % "often / sometimes" | 국가데이터처, 사회조사 in 2026 고령자 통계 | https://mods.go.kr/board.es?mid=a10301010000&bid=10820&act=view&list_no=447294 | official; someone to help when sick 72.5%, when depressed 71.3% |
| Life satisfaction 65+ | 33.7% satisfied (all ages 45.3%) | 2025 | % "very / somewhat satisfied" | 국가데이터처, 사회조사 | same | official; 65–69: 36.0%, falling with age |
| Self-rated health 65+ | 29.7% "good" (20.9% in 2014); 29.8% "bad" | 2024 | % | 국가데이터처, 사회조사 | same | official; men are 11.3 percentage points higher than women |
| Elderly employment rate | 39.5% | 2025 | % of 65+ employed | 국가데이터처, 2026 고령자 통계 | same | official; 58.7% of people aged 65–79 want to keep working (2026). Detail belongs in the work/pension file |
| Elderly relative poverty | 37.7% | 2024 | % of people 66+ below 50% of median disposable income | 국가데이터처 / 한국은행 / 금융감독원, 가계금융복지조사 | same | official; among the highest in the OECD. Cited briefly; see the work/pension file |
| Abuse of older people | 75.8 | 2025 | Victims per 100,000 people 65+ | 국가데이터처, 2026 고령자 통계 | same | official |

## 11. Accidents and safety in adulthood
Retrieved: 2026-11-10

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| Road traffic deaths | 2,549 (193,889 accidents, 271,751 injured) | 2025 | Police-reported, death within 30 days | 한국도로교통공단 (KoROAD), TAAS | https://taas.koroad.or.kr/sta/acs/gus/selectTfcacdOccrrncSttusAnnual.do?menuId=WEB_KMP_OVT_MVT_TAC_TOA | official; 2,916 (2021), 2,735, 2,551, 2,521 (2024): the first rise in 12 years. Rate 4.9 per 100,000 in 2024 (2025 한국의 사회지표) |
| Traffic deaths of people 65+ | 1,378 (41,537 accidents, 46,021 injured) | 2025 | 노인 교통사고 deaths | KoROAD | same | official; = 54.1% of all traffic deaths (calc: 1,378 / 2,549). 1,299 in 2024 |
| Pedestrian / motorcycle / drunk-driving deaths | pedestrians 926; motorcycles 388; drunk driving 121; bicycles 85 | 2025 | Deaths | KoROAD | same | official; drunk-driving deaths fell from 206 in 2021 |
| Older drivers | 23.7% of accidents and 33.1% of deaths involve a driver 65+ | 2025 | % | 국가데이터처, 2026 고령자 통계 (from KoROAD) | https://mods.go.kr/board.es?mid=a10301010000&bid=10820&act=view&list_no=447294 | official; elderly pedestrian deaths 5.9 per 100,000 (3.3× the all-age rate) |
| Transport accident death rate by sex | men 9.6, women 3.3 (all 6.5) | 2025 | Per 100,000 | 국가데이터처, 사망원인통계 | https://mods.go.kr/board.es?mid=a10301010000&bid=218&act=view&list_no=447102 | official; at 80+, transport deaths are 29.5 per 100,000 and falls 40.8 |
| Work-related deaths (산재) | 2,248 (accidents 872, occupational disease 1,376) | 2025 | Deaths approved for workers' compensation in the year | 고용노동부 (MOEL), 산업재해현황 | https://moel.go.kr/policy/policydata/view.do?bbs_seq=20260301471 | official; attachment `2025년 산업재해현황(홈페이지).hwp`. Fatality rate 0.99 per 10,000 workers (accidents 0.38) |
| Work accident deaths by industry and type | construction 361 (41.4%); firms with under 5 workers 354 (40.6%); workers aged 60+ 450 (51.6%). Types: falls 280, traffic 125, struck by 81 | 2025 | Deaths | MOEL | same | official; for employees only: construction 352, manufacturing 162, other (services) 139, transport/storage/communications 47 |
| Occupational disease deaths by type | pneumoconiosis 458, cerebro-cardiovascular (뇌심질환) 408, occupational cancer 294 | 2025 | Deaths | MOEL | same | official; the 뇌심질환 category is the compensation route for overwork deaths (과로사). There is no separate official 과로사 count |
| Work injuries | 147,130 injured (accidents 113,305, disease 33,825); rate 0.65% | 2025 | Persons | MOEL | same | official; most common accident type: slips and trips (28,606) |
| Fatal accidents in the year they happened | 605 deaths (573 cases), up from 589 | 2025 | 재해조사 대상 deaths in the year they occurred | MOEL, via news | https://www.heraldk.com/article/2026033019000041446 | unverified; the official 872 counts by approval date, not date of the accident |
| Recorded crime rate | 3,343 (criminal code 2,118, special acts 1,225) | 2024 | Crimes per 100,000 people | 국가데이터처, 2025 한국의 사회지표 (from 대검찰청 범죄분석) | https://mods.go.kr/board.es?mid=a10301010000&bid=10820&act=view&list_no=443371 | official; 3,121 in 2023, 3,811 in 2014. Highest in 제주 (4,540) |
| Crime victimisation (survey) | 6,439 per 100,000 (property 5,397, violent 1,041) | 2022 | Self-reported victimisation, 국가범죄피해조사 | 한국형사·법무정책연구원 via 국가데이터처 「국민 삶의 질 2024」, via news | https://mobile.newsis.com/view/NISX20250224_0003075943 | unverified; index.go.kr was unreachable. Up 69% from 2020 (3,806), driven by fraud and voice phishing |
| Biggest perceived safety risk | crime 17.9%, economic risk 16.5%, national security next | 2024 | % of people 13+ naming it the biggest risk | 국가데이터처, 2024 사회조사 | https://mods.go.kr/board.es?mid=a10301010000&bid=219&act=view&list_no=433638 | official; women most often name crime (22.4%), men national security (18.3%) |

---

## Game ideas

- **Death roll by age:** each year, roll death with qx from section 4 (men and women separately, from the 2024 complete life table). Then tilt it with modifiers instead of inventing a new table. With this, about 89% of men and 95% of women reach 65, and 24% of men and 45% of women reach 90, which matches the life table.
- **What kills you:** choose the cause from the age-band ranking. Suicide and transport accidents dominate at 20–49, cancer from 50, and pneumonia, heart disease and Alzheimer's at 80+. The lifetime cause shares (cancer 24.5% for men, 15.2% for women) can check the sim's end-of-life distribution.
- **Illness odds by lifestyle:** keep smoking, drinking, exercise and weight flags. Their base rates by age and sex come from KNHANES. Hypertension and diabetes onset should follow the age curves: hypertension rises from 2% in the 20s to 68% at 70+, diabetes from 1% to 31%. Cancer onset over a lifetime should total about 45% for men and 38% for women. Survival is 74% on average, but 93% if found early and 28% if found late, so check-ups (75.6% take part) should buy early detection.
- **Healthy years vs years lived:** about 18 of 84 years are spent ill, and a 60-year-old has only about 12 healthy years left. A "frailty" stat could rise from the 60s, gate activities, and trigger long-term care. 33% of people aged 80+ are certified for long-term care, and 9% of people 65+ have dementia.
- **Money:** a 75+ character's medical bills run about 6.9 million won a year, with 1.6 million out of pocket. Premiums are 7.19% of salary (half paid by the employer) plus 13.14% of that for long-term care. Dementia care costs 17–31 million won a year, so a parent's illness can become a family-finance event.
- **Ageing society backdrop:** 21.6% of people are 65+ in 2026, and the share passes 30% in 2036. Rural provinces (전남, 경북) age fastest. This can drive events like clinic closures, older neighbours, and caring for parents.
- **Mental health:** stress peaks for people in their 30s (women 29%), depressed mood for women in their 30s (13%). Only about 7% of people with a mental disorder get help in a year. An event chain can let the player seek help. Always show **109**. Suicide should never be a choice the game presents; at most it is an off-screen cause of death for NPCs, handled as section 5 describes.
- **Lonely old age:** 33% of people 65+ live alone, and living alone doubles depressive symptoms. 고독사 hits men in their 50s–60s hardest (16.6 per 100,000 at 60–69). Social ties can be a protective stat.
- **Work risks:** construction and very small firms carry the risk of fatal accidents. Workers 60+ are half of accident deaths. Overwork (cerebro-cardiovascular disease) caused 408 compensated deaths in 2025, so long-hours jobs could raise the heart-disease risk.
- **Driving:** traffic deaths for people 65+ (54% of all) make "give up the licence" a meaningful late-life choice.

## Gaps

- **2025 life table:** due December 2026. The 2024 table is used here.
- **Adult mental health survey after 2021:** only the 2021 정신건강실태조사 was found. The 2022 child and adolescent survey exists, but was seen only in news.
- **Private health insurance:** no official figure found for the share of people with 실손보험 (indemnity) or other private health insurance. Sources to check: FSS or 보험연구원, then a Statistics Korea or NHIS survey.
- **Sleep:** no national adult sleep-duration figure was found. The only sleep figure is the 65+ "adequate sleep" practice rate. Source to check: KDCA 지역사회건강조사.
- **Lifetime medical spending by age:** the NHIS lifetime-medical-cost analysis (share of lifetime spending after 65) was not reached. nhis.or.kr and hira.or.kr were unreachable.
- **Long-term care grade distribution:** the split of grades 1–5 and the cognitive-support grade, from NHIS 노인장기요양보험통계, was not reached.
- **Chronic disease count by age band:** only the 65+ average (2.2) was found.
- **2027 health insurance premium rate:** not found in the MOHW press list as of retrieval (checked again 2026-11-11: the latest rate releases are for 2026, 7.19% and long-term care 0.9448%).
- **NHIS check-up participation (75.6%) and crime victimisation (6,439 per 100,000):** both seen only in news. The primary sources, nhis.or.kr and index.go.kr / KICJ, were unreachable.
- **Super-aged society date:** the MOIS release was not read directly.
- **Official 과로사 count:** none exists. The occupational 뇌심질환 deaths row is a proxy.
- **Suicide by occupation or income:** not in the 2025 사망원인통계 release.
