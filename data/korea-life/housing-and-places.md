# Korea in numbers: housing, places and moving

Scope: official Korean statistics on where adults live, what homes cost, who owns them, how households are formed, and how and why people move between regions, for an adult-life extension of the Suneung Simulator. It extends `data/korea-stats.md` section 1 (population by province, household size and types) and section 12 (jeonse fraud), and does not repeat those rows.

Sources read: these attachments were downloaded and read in full: `2025년 인구주택총조사 결과(등록센서스 방식) 보도자료.pdf` (mods.go.kr bid 203, list 446219, seq 11), `2025년 연간 국내인구이동 보도자료.pdf` (bid 205, list 443278, seq 1), `「최근 20년간 수도권 인구이동」 보도자료.pdf` (bid 205, list 438645, seq 5), `장래가구추계 전국편(2022-2052) 보도자료.pdf` (bid 207, list 432696, seq 13), `2024년 지역소득(잠정) 보도자료.pdf` (bid 243, list 442567, seq 1), `2025년 초중고사교육비조사 결과.pdf` (bid 245, list 443953, seq 1), `2024년 주택소유통계 보도자료.pdf` and `'24년 청년의 삶 실태조사 보도자료.pdf` (korea.kr attachments), the Korea Real Estate Board's `'26.9월 전국주택가격동향조사 통계표.xlsx` (attached to e-나라지표 indicator 1240), and `주택공급에 관한 규칙` [별표 1] (law.go.kr PDF). MOLIT's own site (molit.go.kr, stat.molit.go.kr), r-one.co.kr, myhome.go.kr and kbland.kr refused connections from this session, so the 2024 주거실태조사 figures come from e-나라지표 (official) where it carries them and from news otherwise (unverified).

Currency: 만원 = ₩10,000, 억 = ₩100,000,000. REB prices are in 천원 in the source and are converted to 억/만원 here. "Apartment" = 아파트; "row house" = 연립·다세대 (villa). Regions: 수도권 = Seoul + Incheon + Gyeonggi; 광역시 = the metropolitan cities; 도 = provinces.

---

## 1. Tenure and home ownership
Retrieved: 2026-11-10

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| Households living in a home they own (자가점유율) | 58.4% (57.4% in 2023; 55.6% in 2006; 53.6% in 2014) | 2024 | Share of households (주거실태조사, 61,000-household sample) | MOLIT via 국가데이터처 국민 삶의 질 지표 | https://www.index.go.kr/unify/idx-info.do?idxCd=8092 | official (indicator page text) |
| Owner-occupancy by region | 수도권 52.7%; 광역시 60.0%; 도 66.5% | 2024 | Share of households | same | same | official |
| Tenure split | own 58.4%; rent (전세 + 월세) 38.0%; rent-free 3.6% | 2024 | Share of households | MOLIT 2024년도 주거실태조사 (press release 2025-11-16) | https://www.newsis.com/view/NISX20251116_0003404516 | unverified (news citing the MOLIT release; molit.go.kr unreachable) |
| Households owning any home (자가보유율) | 61.4% (60.7% in 2023) | 2024 | Share of households, own a home whether or not they live in it | same | same | unverified |
| Years from becoming household head to first home | 7.9 years (7.7 in 2023) | 2024 | Mean years | same | same | unverified |
| PIR, owner households | national 6.3; 수도권 8.7 (8.5 in 2023); 광역시 6.3; 도 4.0 (3.7) | 2024 | Home price ÷ annual household income (median), owners | same | same | unverified |
| Rent-to-income ratio (RIR), renters | 15.8% (18.7% in 2006, 20.3% peak in 2014) | 2024 | Median monthly rent ÷ median monthly income | MOLIT via 국민 삶의 질 지표 | https://www.index.go.kr/unify/idx-info.do?idxCd=8093 | official; 20%+ is called a heavy burden |
| RIR by region | 수도권 18.4%; 광역시 15.2%; 도 12.7% | 2024 | as above | MOLIT 주거실태조사 | https://www.newsis.com/view/NISX20251116_0003404516 | unverified |
| Youth, newlywed and elderly households | owner-occupancy: youth heads 12.2% (−2.4pp), newlyweds 43.9% (−2.5pp), elderly 75.9%; PIR youth 6.0, elderly 9.1; RIR youth 16.0%, elderly 25.4% | 2024 | Share of households in each group | same | same | unverified |
| Years in current home | 8.4 on average; owners 11.5, renters 3.6; 30.3% moved in within 2 years | 2024 | Years | same | same | unverified |
| Households owning a home (register-based) | 56.9% (12.684M of 22.294M); 9.61M households own none (43.1%) | 2024-11-01 | Share of general households, legal title | 국가데이터처, 2024년 주택소유통계 | https://www.korea.kr/common/download.do?fileId=198257529&tblKey=GMN | official (attached pdf); release page https://www.korea.kr/briefing/pressReleaseView.do?newsId=156728361 |
| Ownership by age of household head | <30: 9.4%; 30s: 36.0%; 40s: 60.3%; 50s: 65.1%; 60s: 67.9%; 70s: 71.0%; 80+: 64.3% | 2024-11-01 | Share of households in each age band | same (표4) | same | official; under-30 and 30s fell vs 2023 (10.3%, 36.6%) |
| Ownership by region | Seoul 48.1% (lowest); Daejeon 53.1%; Jeju 56.6%; Incheon 56.7%; Gyeonggi 57.2%; Busan 58.0%; Daegu 59.3%; Gyeongbuk 62.4%; Gyeongnam 63.3%; Jeonnam 63.4%; Ulsan 64.0% (highest) | 2024-11-01 | Share of general households | same (표3) | same | official |
| Ownership by household type | one-person 32.0%; 2-person 66.8%; 5+ persons 76.5%; male head 61.4%, female head 48.5% | 2024-11-01 | Share of households | same (표5) | same | official |
| Owning households: count and value | 74.0% own one home, 26.0% own 2+; mean 1.34 homes, mean value 3.33억 (assessed price), mean home 86.4㎡, head's mean age 57.8 | 2024-11-01 | Owning households | same | same | official; values use 2025-01-01 공시가격, below market |
| Housing wealth top vs bottom tenth | top 10%: mean 13.4억, 2.3 homes; bottom 10%: 3,000만, 0.97 homes | 2024-11-01 | Owning households by decile of home value | same | same | official |
| Becoming an owner in a year | 2.4% of 2023 non-owners (818,000) owned a home by 2024; 2.4% of owners (365,000) became non-owners | 2023→2024 | Individuals | same | same | official |
| Young adults' tenure (19–34) | own (incl. parents' home) 49.6%; 전세 23.8%; 월세 with deposit 23.8%; 수도권 own 45.5%, 전세 28.9% | 2024 | Share of young adults | 국무조정실, 2024 청년의 삶 실태조사 (15,000 households) | https://www.korea.kr/common/download.do?fileId=198080617&tblKey=GMN | official (attached pdf) |
| Young adults' housing costs | own home mean 4.5억; 전세 deposit mean 2.3억; 월세 deposit mean 2,900만 and rent 41만 a month | 2024 | Means | same | same | official |

## 2. Prices, rents and 전세
Retrieved: 2026-11-10

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| Average apartment sale price | national 5.23억; 수도권 8.10억; Seoul 13.70억; Gyeonggi 5.99억; Incheon 3.87억; Busan 3.70억; Daegu 3.22억; Daejeon 3.36억; Sejong 5.29억; Gangwon 1.88억; Chungbuk 2.14억; Chungnam 1.99억; Jeju 2.86억 | 2026-09 | Mean of sample prices | Korea Real Estate Board (전국주택가격동향조사), via e-나라지표 | https://www.index.go.kr/unity/potal/FileDown.do?seq=17768&id=1240&div=1 | official (attached xlsx, sheet 가격) |
| Median apartment sale price | national 3.29억; 수도권 5.75억; Seoul 10.86억; Gyeonggi 4.78억; Incheon 3.38억; Busan 2.83억; Daegu 2.52억; Daejeon 3.00억; Gangwon 1.59억; Chungnam 1.76억 | 2026-09 | Median | same | same | official |
| Gangnam 3 districts, apartment sale | Gangnam-gu mean 27.82억 (median 25.85억); Seocho-gu 27.82억 (26.10억); Songpa-gu 23.57억 (21.95억); Seoul 동남권 median 20.86억 | 2026-09 | Mean (median) | same | same | official; Nowon-gu, for contrast: mean 7.10억, median 6.61억 |
| Metro cities and provinces, apartment sale | 5대광역시 mean 3.29억 (median 2.63억); 8개도 mean 1.98억 (median 1.61억) | 2025-12 | Mean (median) | same | same | official; these groupings stop after 2026-06 in the file (see Gaps) |
| Median apartment 전세 deposit | national 2.37억; 수도권 3.60억; Seoul 5.65억; Gangnam-gu 9.88억; Gyeonggi 3.20억; Busan 1.99억; Gangwon 1.25억 | 2026-09 | Median deposit | same | same | official |
| Median apartment 월세 | national 82만 a month on a 3,000만 deposit; 수도권 115만 / 5,000만; Seoul 140만 / 1.2억; Busan 65만 / 3,000만; Gangwon 58만 / 1,000만; Gangnam-gu 248만 / 3억 | 2026-09 | Median monthly rent and median deposit | same | same | official |
| Median row-house (villa) prices and rents | national: sale 1.36억, 전세 9,350만, 월세 42만 on 1,500만; Seoul: sale 3.14억, 전세 2.06억, 월세 60만 on 4,300만; Busan: 월세 32만 on 1,100만 | 2026-09 | Medians, 연립·다세대 | same | same | official; the closest official series to a small flat or one-room rent (see Gaps) |
| 전세 as a share of sale price (전세가율), apartments | national 69.3%; 수도권 62.7%; Seoul 51.3%; Seoul 동남권 45.4%; Gyeonggi 66.9%; Busan 70.0%; Daegu 71.2%; Gangwon 77.2% | 2026-09 | Median 전세 ÷ median sale price | same (sheet 가격비, 중위가격비1) | same | official; Seoul was 72.1% in 2015-12 |
| 전세가율, row houses | national 68.5%; Seoul 67.0%; Incheon 72.0% | 2026-09 | as above | same | same | official; the high villa ratio is the 깡통전세 risk behind the jeonse-fraud rows in korea-stats §12 |
| Apartment sale price index change since 2015 | national +12.8%; 수도권 +33.5%; Seoul +46.6%; Seoul 동남권 +70.8%; Gyeonggi +30.0%; Incheon +18.7%; Sejong +11.9%; Busan +1.3%; Daegu −14.9% | 2015-12 → 2026-09 | Change in the REB sale index | same (sheet 지역별지수) | same | calc: index(2026-09) ÷ index(2015-12) − 1 |
| The 2021–23 boom and bust | national index peaked 2022-01, then fell 12.8% to 2023-06; 수도권 −15.3%; Gyeonggi −17.0%; Incheon −17.6%; Busan −18.1% (2022-05→2025-09); Daegu −27.3% (2021-10→2026-08); Sejong −29.3% (2021-05→2025-03) | 2021–2026 | Peak-to-trough change in the sale index | same | same | calc from monthly index values; Seoul's sale index set a new high in 2026-09 |
| 전세 index swings | national 전세 −16.7% from 2022-01 to 2023-07; Seoul −19.4% (2022-01→2023-05); 수도권 −21.6% | 2021–2023 | Peak-to-trough change in the 전세 index | same | same | calc |
| Yearly national sale-price change, long run | 2015 +3.5%; 2016 +0.7%; 2017 +1.5%; 2018 +1.1%; 2019 −0.4%; 2020 +5.4%; 2021 +9.9% (수도권 +12.8%); 2022 −4.7% | 2015–2022 | Year-end change, all housing | Korea Real Estate Board via e-나라지표 (주택매매가격 동향) | https://www.index.go.kr/unity/potal/main/EachDtlPageDetail.do?idx_cd=1240 | official (indicator page text) |
| Seoul median apartment price in years of income | 18.7 years (national median apartment: 5.7 years; Gangnam-gu: 44.6 years) | 2026-09 / 2024 income | Median apartment price ÷ median household income ₩58.0M (korea-stats §14) | — | — | calc: 10.86억 ÷ 0.58억; 3.29억 ÷ 0.58억; 25.85억 ÷ 0.58억; not the official PIR, which uses owners' own homes and incomes |
| Seoul median apartment 전세 in years of income | 9.7 years | 2026-09 / 2024 income | Median 전세 ÷ median household income | — | — | calc: 5.65억 ÷ 0.58억 |

## 3. 청약 (subscription) and public rental housing
Retrieved: 2026-11-10

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| 청약 points (가점제), maximum 84 | homeless years: 2 points under 1 year, +2 a year, 32 at 15+ years; dependants: 5 for none, +5 each, 35 at 6+; account years: 1 under 6 months, 2 at 6–12 months, +1 a year, 17 at 15+ years | current (rule amended 2024-12-18) | Points | MOLIT, 주택공급에 관한 규칙 [별표 1] | https://www.law.go.kr/LSW/flDownload.do?gubun=&flSeq=164922725&bylClsCd=110201 | official (attached pdf) |
| When homeless years start | from age 30, or from the marriage date if married before 30; reset when the household last sold a home | current | Rule | same | same | official; a spouse's account adds up to 3 points, capped at 17 |
| Points vs lottery share of 1st-rank private units | ≤60㎡: 40% by points in speculation-overheated districts and capital-region public housing districts (≤40% elsewhere, set locally); 60–85㎡: 70% by points (≤40% elsewhere); >85㎡: 80% by points in speculation-overheated districts, 50% in overheated-subscription areas, the rest by lottery | current (rule in force 2026-06-15) | Share of general supply | MOLIT, 주택공급에 관한 규칙 제28조 | https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%A3%BC%ED%83%9D%EA%B3%B5%EA%B8%89%EC%97%90%EA%B4%80%ED%95%9C%EA%B7%9C%EC%B9%99 | official (law text) |
| Who can't use points | anyone in a household that owns a home, or that won by points in the last 2 years: lottery share only | current | Rule | same (별표 1 비고 1) | https://www.law.go.kr/LSW/flDownload.do?gubun=&flSeq=164922725&bylClsCd=110201 | official |
| 1st-rank applications | 709,736 nationally (−46.6% from 1,523,456 in 2024) | 2025 | Applications | Korea Real Estate Board (청약홈), via news | https://www.mt.co.kr/estate/2026/01/20/2026012015275532794 | unverified |
| 1st-rank competition rates | Seoul 136.0 to 1 (Jan–Oct 2025 average) and 156.0 to 1 in Dec 2025; national 6.9 to 1 (12-month moving average, Dec 2025) | 2025 | Applicants per unit | private analysts (리얼투데이, 리얼하우스) from 청약홈 data | https://www.mt.co.kr/estate/2026/01/20/2026012015275532794 | unverified; outside Seoul rates were the lowest in about 12 years |
| Long-term public rental stock | 1.931 million homes, 8.42% of all homes (OECD average 7.1%; UK 16.4%, Netherlands 34.1%) | 2024-12-31 | Homes let for 10+ years (영구, 50년, 국민, 행복, 장기전세, 10년 공공임대) | MOLIT via e-나라지표 (임대주택 재고) | https://www.index.go.kr/unity/potal/main/EachDtlPageDetail.do?idx_cd=1232 | official (indicator page text) |
| Young adults and public rental | 7.0% have lived in public rental; 71.7% would like to; top policy wish: home-purchase loans 31.3%, 전세 loans 25.0%, rent support 20.7%, more public rental 14.9% | 2024 | Share of 19–34s | 국무조정실, 청년의 삶 실태조사 | https://www.korea.kr/common/download.do?fileId=198080617&tblKey=GMN | official |

## 4. Housing stock and types
Retrieved: 2026-11-10

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| Homes | 20.18 million (+1.6%); 46.8% in the capital region | 2025-11-01 | Housing units (다가구 counted as one) | 국가데이터처, 2025 인구주택총조사 | https://mods.go.kr/boardDownload.es?bid=203&list_no=446219&seq=11 | official (attached pdf); counting each 다가구 flat separately gives 23.24 million |
| Apartment share of homes | 65.8% (13.29M); 62.9% in 2020; detached 19.0%; multi-unit 다세대 11.4%; row houses 2.7% | 2025-11-01 | Share of homes | same (표33) | same | official |
| Apartment share by province | Sejong 87.6%; Gwangju 82.0%; Daejeon 77.0%; Seoul 60.7%; Jeju 31.7% (lowest; detached 38.2%) | 2025-11-01 | Share of homes | same | same | official; Seoul is calc 1,952k ÷ 3,216k |
| Households living in apartments | 54.5% (48.1% in 2015); living outside regular housing (officetel, 고시원, lodging, etc.) 6.1%, 1.373M households | 2025-11-01 | Share of general households | same | same | official |
| Old homes | 56.0% of homes are 20+ years old, 30.6% are 30+; 30+ share highest in Jeonnam 45.6%, Jeonbuk 40.5%, Gyeongbuk 40.4% | 2025-11-01 | Share of homes | same | same | official |
| Empty homes | 1.722M (8.5%, +7.7% in a year); 1.511M (8.2%) in 2020 | 2025-11-01 | Homes nobody lived in on census day, incl. new and between-sale homes | same (표44) | same | official |
| Floor area per person | 36.0㎡ (26.2 in 2006); per household 68.1㎡; US 67.4, UK 44.4, Japan 41.9 | 2024 | ㎡ per person | MOLIT 주거실태조사 via 국민 삶의 질 지표 | https://www.index.go.kr/unify/idx-info.do?idxCd=8013 | official (indicator text); per-household figure is from news (unverified) |
| Below minimum housing standard | 3.8% of households (16.6% in 2006); 수도권 4.4%; 광역시 2.8%; 도 3.4% | 2024 | Fails area, rooms or facilities (one person: one 14㎡ room, kitchen, own toilet and bath) | MOLIT via 국민 삶의 질 지표 | https://www.index.go.kr/unify/idx-info.do?idxCd=8014 | official |
| Basement and half-basement homes | 327,000 households (1.6%); about 96% in the capital region | 2020-11-01 | Households | Statistics Korea, 2020 census (20% sample), via news | https://www.newsis.com/view/NISX20220812_0001977556 | unverified; the 2025 sample results are due end-Nov 2026 |
| Young single people's homes | of one-person households in their 20s or younger: 다가구 (multi-household detached, typical one-room) 30.3%; apartments 19.9%; non-housing (officetel, 고시원, dorm) 20.9%; 30s: apartments 36.1%, non-housing 19.2% | 2025-11-01 | Share of one-person households by age | 국가데이터처, 2025 census (표54) | https://mods.go.kr/boardDownload.es?bid=203&list_no=446219&seq=11 | official |
| Cars registered | 26.298M (+1.3%): passenger 21.77M; hybrid 2.02M; electric 0.68M | 2024-12-31 | Vehicles, excl. motorcycles | MOLIT via e-나라지표 (자동차 등록 현황) | https://www.index.go.kr/unity/potal/main/EachDtlPageDetail.do?idx_cd=1257 | official |
| People per car | 1.94 | 2024 | Registered population ÷ registered vehicles | — | — | calc: 51,088,284 (korea-stats §1) ÷ 26,298,000 |

## 5. Households and living arrangements
Retrieved: 2026-11-10

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| One-person households | 8.24M (36.6%; 31.7% in 2020) | 2025-11-01 | Share of general households | 국가데이터처, 2025 census | https://mods.go.kr/boardDownload.es?bid=203&list_no=446219&seq=11 | official; average household size (2.16) is already in korea-stats §1 |
| One-person share by province | highest Seoul 40.5%; lowest Gyeonggi 32.2% | 2025-11-01 | Share of general households | same | same | official |
| One-person households by age | 20s and under 16.9%; 30s 17.5%; 40s 12.1%; 50s 15.0%; 60s 17.7%; 70+ 20.7%; men mostly 30s (21.8%), women mostly 60s (18.6%) | 2025-11-01 | Share of one-person households | same (표52) | same | official |
| Young singles by province | 20s and under as a share of one-person households: Daejeon 27.2%; Sejong 26.1%; Seoul 24.3%; Jeonnam 9.2%; median age of one-person households: Sejong 39.9, Seoul 41.2, Jeonnam 62.1 | 2025-11-01 | Share; years | same | same | official |
| Young adults living with parents | 54.4% (57.5% in 2022); 45.6% live independently; 38.0% of those at home have a concrete plan to leave | 2024 | Share of 19–34s | 국무조정실, 청년의 삶 실태조사 | https://www.korea.kr/common/download.do?fileId=198080617&tblKey=GMN | official |
| Why young adults pick a home | commute or school 39.2%; low rent or deposit 29.7%; interior 8.3% | 2024 | Share of independent 19–34s | same | same | official |
| Household projections | 21.66M (2022) → peak 24.37M (2041) → 23.28M (2052); average size 2.26 → 1.81 | 2022–2052 | Households | 국가데이터처, 장래가구추계 2022–2052 | https://mods.go.kr/boardDownload.es?bid=207&list_no=432696&seq=13 | official (attached pdf) |
| One-person households, projected | 34.1% (7.39M) in 2022 → 41.3% (9.62M) in 2052; 70+ will be 42.2% of them | 2022–2052 | Share of households | same | same | official |
| Elderly-headed households, projected | 24.1% (5.23M) → 50.6% (11.79M) | 2022–2052 | Head aged 65+ | same | same | official |
| What unmarried households want at marriage | 41.7% picture a 전세 apartment; most-wanted help: purchase loans 55.3%, 전세 loans 30.2%, public rental 10.8% | 2024 | Share of unmarried households | MOLIT 주거실태조사 | https://www.newsis.com/view/NISX20251116_0003404516 | unverified; newlyweds live in apartments 73.4% vs 53.1% of all households |

## 6. Moving between homes and regions
Retrieved: 2026-11-10

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| People who moved | 6.118M (−2.6%), lowest since 1974; rate 12.0 per 100 (15.2 in 2015, 22.1 in 1990) | 2025 | Moves across 읍면동 boundaries (registration) | 국가데이터처, 2025년 국내인구이동통계 | https://mods.go.kr/boardDownload.es?bid=205&list_no=443278&seq=1 | official (attached pdf); release page https://mods.go.kr/board.es?mid=a10301020300&bid=205&act=view&list_no=443278 |
| Within vs between provinces | within a province 64.3% (rate 7.7); between provinces 35.7% (rate 4.3) | 2025 | Share of movers | same | same | official |
| Moving rate by age | under 10: 12.9; teens 9.9; 20–24: 22.4; 25–29: 25.9; 30–34: 23.4; 35–39: 17.0; 40s 11.1; 50s 8.8; 60s 7.0; 70s 5.0; 80+ 5.5 | 2025 | Movers per 100 people of that age | same (표2) | same | official; men 12.4, women 11.6 |
| Why people move | housing 33.7%; family 25.9%; job 21.4%; education 6.0%; living environment 5.3%; nature 1.1% | 2025 | Share of movers (stated reason on the 전입신고) | same (표6) | same | official; within-province moves: housing 42.5%; between provinces: job 32.5% |
| Net migration by province | Gyeonggi +33,000; Incheon +32,000; Chungbuk +11,000; Chungnam +8,000; Seoul −27,000; Gwangju −14,000; Busan −12,000 | 2025 | Net movers | same (표3) | same | official; rates: Incheon +1.1%, Gwangju −1.0%, Jeju −0.6% |
| Who leaves and enters Seoul | 59.5% of people leaving Seoul go to Gyeonggi; Seoul gains 20s (+35,900) and teens (+9,000) but loses every other age, net −26,800; job (+45,700) and education (+33,800) in, housing (−61,800) and family (−50,500) out (2024) | 2025 (reasons 2024) | Net movers | same (표4, 표5, 표7) | same | official |
| 20-somethings leaving the provinces | net migration rate of 20s: Seoul +2.8%, Incheon +1.5%, Daejeon +1.2%; Gyeongbuk −3.9%, Jeju −3.2%, Jeonnam −3.1%, Jeonbuk −3.1%, Gyeongnam −3.1%, Gwangju −3.0% | 2025 | Net movers ÷ population of that age | same (표4) | same | official |
| Capital region net inflow | +38,000 (2025); +45,000 (2024); net outflow 2011 and 2013–16; inflow every year since 2017 | 2004–2025 | Net movers into Seoul, Incheon, Gyeonggi | same; 「최근 20년간 수도권 인구이동」 (2025-09-17) | https://mods.go.kr/boardDownload.es?bid=205&list_no=438645&seq=5 | official (attached pdf) |
| Young adults into the capital region | 19–34s: net +61,000 (2024), +94,000 (2020), +34,000 (2015), every year since 2004; 40–64s net out every year since 2007 (−18,000 in 2024) | 2004–2024 | Net movers | 국가데이터처, 최근 20년간 수도권 인구이동 (표2) | same | official; net rate of 20–24s into the region 2.2% (2024) |
| Why young adults move to the capital | single movers aged 19–34 come for jobs and education; single movers' net inflow for jobs +56,000 (2024), family −16,000 | 2013–2024 | Net single movers | same (표7) | same | official; top sending cities for young adults in 2024: Jeonju, Changwon, Daegu Dalseo-gu |
| Districts gaining and losing most | highest net inflow rate: Sinan-gun (Jeonnam) 10.8%, Goesan-gun (Chungbuk) 6.7%; highest outflow: Gwacheon (Gyeonggi), Ulleung-gun, Mokpo; 96 of 228 districts gained | 2025 | Net migration rate | 국가데이터처, 2025년 국내인구이동통계 | https://mods.go.kr/boardDownload.es?bid=205&list_no=443278&seq=1 | official |
| Why households moved into their current home | better facilities 47.2%; near work 30.6%; transport 25.5%; forced moves: lease ended 18.1%, too expensive 8.3%, redevelopment 3.7% | 2024 | Share of households (multiple answers) | MOLIT 주거실태조사 | https://www.newsis.com/view/NISX20251116_0003404516 | unverified |
| Capital region population share, projected | 50.2% (2020) → 51.6% (2030) → 53.4% (2052) | 2020–2052 | Share of national population | 국가데이터처, 2022-based provincial projections, quoted in 「최근 20년간 수도권 인구이동」 | https://mods.go.kr/boardDownload.es?bid=205&list_no=438645&seq=5 | official |

## 7. Regions: decline, income, services and commuting
Retrieved: 2026-11-10

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| Population-decline areas (인구감소지역) | 92 시군구 (89 in 2021) plus 18 "of concern"; new: Busan Geumjeong-gu, Dongducheon, Tongyeong; areas that improved are kept on support for 5 years as 인구활력+ | 2026-10-07 designation | Districts | Ministry of the Interior and Safety | https://www.korea.kr/news/policyNewsView.do?newsId=148973138 | official; 9 indicators incl. youth net migration, ageing, birth rate, fiscal independence, jobs, "living population"; 1조 a year 지방소멸대응기금 |
| Disposable income per person by province | national 2,782만; Seoul 3,222만; Ulsan 3,112만; Daejeon 2,875만; Gyeonggi 2,791만; Busan 2,616만; Gyeongbuk 2,486만; Jeju 2,461만 (lowest) | 2024 | 만원 per person per year, household gross disposable income | 국가데이터처, 2024년 지역소득(잠정) | https://mods.go.kr/boardDownload.es?bid=243&list_no=442567&seq=1 | official (attached pdf) |
| GRDP per person by province | national 4,948만; Ulsan 8,519만; Chungnam 6,776만; Seoul 6,122만; Daegu 3,137만 (lowest); Busan 3,708만 | 2024 | 만원 per person, nominal | same | same | official; regional income (GNI-style) per person: Seoul 6,903만, Daegu 3,618만 |
| Doctors per 1,000 people | national 2.71 (1.82 in 2006); Seoul 4.67; Sejong 2.17; Gyeongbuk 2.26 | 2024 | Licensed doctors ÷ population | MOHW via 국민 삶의 질 지표 | https://www.index.go.kr/unify/idx-info.do?idxCd=5069 | official (indicator page text) |
| Doctors working in medical institutions per 1,000, by province | national 3.2; Seoul 4.7; Gwangju 3.8; Daegu, Busan, Daejeon 3.6; Gyeonggi, Incheon, Jeju 2.7; Chungnam, Chungbuk 2.4; Gyeongbuk 2.3; Sejong 2.2 | 2024 | Doctors, oriental doctors and dentists ÷ registered population | HIRA and MOIS via KOSIS e-지방지표 | https://kosis.kr/visual/eRegionJipyo/themaJipyo/eRegionJipyoThemaJipyoView.do?themaId=A_01_03&menuThemaId=A_01_03_03&jipyoId=5457_6791 | unverified (values seen in a search summary; the KOSIS page loads them by script and could not be read here) |
| Private education spending by province | national 45.8만; Seoul 66.3만; Gyeonggi 49.9만; Sejong 45.8만; Busan 45.6만; Daegu 44.7만; Jeonnam 30.9만 (lowest); participation Seoul 82.6%, Jeonbuk 66.4% | 2025 | Won per month per student (all students) | 국가데이터처 & MOE, 2025년 초중고사교육비조사 (표16) | https://mods.go.kr/boardDownload.es?bid=245&list_no=443953&seq=1 | official (attached pdf); Seoul high schoolers 76.7만 |
| Commuting time | 30.8 minutes on average (28.4 in 2000, 31.2 in 2015); 15.3% commute an hour or more | 2020 | Minutes one way, commuters 12+ | Statistics Korea (2020 census) via 국민 삶의 질 지표 | https://www.index.go.kr/unify/idx-info.do?idxCd=8094 | official; longest in the OECD; 2025 census figures due end-Nov 2026 |
| Road share of domestic passenger trips | 86.6% (car, bus, taxi); rail and subway back to 94% of pre-COVID volume | 2023 | Share of passenger transport | MOLIT via e-나라지표 (수송량 및 수송분담률) | https://www.index.go.kr/unity/potal/main/EachDtlPageDetail.do?idx_cd=1245 | official |
| Capital region's overcrowding zone | 17.0% of the capital region's land holds 72.2% of its people (82.7% in 2002) | 2021 | Share in 과밀억제권역 | MOLIT via e-나라지표 (수도권과 지방현황) | https://www.index.go.kr/unity/potal/main/EachDtlPageDetail.do?idx_cd=2729 | official |

## Game ideas

- **Leaving home:** at 19–34 roll "lives with parents" from 54.4%, rising in Seoul where rents are 140만; 38% of those at home plan to leave in the next step. Pick the first flat from the 20s split: 다가구 one-room 30%, officetel or 고시원 21%, apartment 20%.
- **Rent vs 전세 vs buy:** price homes from the REB medians by region. A Seoul apartment 전세 is 5.65억 (about 9.7 years of median household income), a Seoul villa 월세 is 60만 on a 4,300만 deposit. Saving for a 전세 deposit is the classic mid-20s to mid-30s goal; 전세 gives back the deposit but carries a jeonse-fraud risk event, highest where villa 전세가율 is near 70% (korea-stats §12).
- **청약 lottery:** keep an account from age 19 (or earlier); points run on the real 84-point table (homeless years from 30 or marriage, dependants, account years). Seoul draws are a long shot at roughly 136 to 1; outside Seoul, single-digit odds. Owning any home locks you out of the points pool.
- **Time to first home:** 7.9 years after becoming a household head, 36% own by their 30s and 60% by their 40s; ownership in Seoul is only 48%. Under-30 heads own 9.4%.
- **Market cycles:** a boom-bust event deck from 2015–26: +9.9% in 2021, then −13% nationally (−27% in Daegu, −29% in Sejong) to 2023, with Seoul and Gangnam recovering to new highs by 2026. Owning in Gangnam vs a provincial city should feel very different over 10 years (+71% vs −15%).
- **Moving to Seoul:** a 20-something in the provinces faces a pull of about 3% a year (net 20s outflow in Gyeongbuk, Jeonnam, Jeonbuk). Moves for jobs and school go into Seoul; moves for housing and family go out to Gyeonggi and Incheon.
- **Where to raise kids:** region cards show disposable income (Seoul 3,222만 vs Jeju 2,461만), doctors per 1,000 (Seoul 4.7 vs Sejong 2.2), private-education norms (Seoul 66만 vs Jeonnam 31만 a month) and whether the district is one of 92 population-decline areas (perks, but fewer services).
- **Later life:** one-person households in Jeonnam have a median age of 62; elderly-headed households reach half of all homes by 2052. Downsizing, an empty-home inheritance (8.5% of homes stand empty) or moving back to the hometown at 50–60 (40–64s leave the capital region every year) can close a life.

## Gaps

- MOLIT 2024 주거실태조사 primary release and tables (molit.go.kr, stat.molit.go.kr and myhome.go.kr refused connections): 자가보유율 by region, PIR, RIR by region, first-home years, youth and newlywed rows are news-only (unverified). Owner-occupancy, floor area, RIR and minimum-standard rows are confirmed on e-나라지표.
- Seoul-only PIR (news cites 13.9 for 2024 without saying whose figure it is) and KB 부동산 PIR, rents and 전세가율: kbland.kr was unreachable, so no KB rows were added.
- Average age at first home purchase: no official figure found (only the 7.9 years after becoming a household head).
- Monthly rent for one-rooms and officetels specifically: REB's 오피스텔 가격동향 and 원룸 series are on r-one.co.kr (unreachable); the villa row is the closest stand-in.
- Official 청약 competition rates by year and region (청약홈 publishes them per complex; no official yearly aggregate found), and the number of 청약 accounts.
- LH 행복주택 and other public-rental eligibility (income caps, stay limits by group, rent as a share of market rent): only secondary guides were found; the rules are in 공공주택 특별법 시행규칙 and each 모집공고 (myhome.go.kr unreachable).
- 반지하, 옥탑방 and 고시원 counts from the 2025 census 20% sample (due end-Nov 2026); the 2020 basement figure is news-only. Commuting time by province is in the same sample release.
- Doctors per 1,000 by province (e-지방지표 values are script-loaded on KOSIS); confirm the 2024 province list from the KOSIS table.
- Public transit mode share and car ownership by province; a 2020+ national household travel survey (KOTI) figure.
- The REB file shows a new "전남광주" region from mid-2026 and drops the 5대광역시 and 8개도 groupings after 2026-06 (it now reports 4대광역시 and 7개도), and the MOIS page calls Yeonggwang "전남광주 영광군". This looks like a Gwangju–Jeonnam merger in 2026; confirm before modelling Gwangju and Jeonnam as separate regions.
- OECD housing comparisons (oecd.org returned 403).
