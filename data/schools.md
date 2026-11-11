# Schools in Korea

How many schools of each kind Korea has, and named lists of the special schools the Suneung Simulator models (영재학교, 과학고, 외고, 국제고, 자사고, 국제중, 마이스터고, medical schools). Same format and status tags as `korea-stats.md` (see `data/README.md`).

**The full national list is in `data/schools/korea-schools-2026-09.csv`**: all 12,004 operating elementary, middle and high schools (data date 2026-09-20), downloaded from data.go.kr on 2026-10-29; see `data/schools/README.md`. Its counts are in section 0 below. It has no kindergartens and no high-school types; the named special-school lists in section 3 were classified by looking each high school up in NEIS (2026-11-04) and now match the official counts, except 자사고 and meister schools (see 3.5 and 3.7). The medical-school list (3.8) is from MOE's 2027–2031 allocation table.

---

## 0. Counts from the national list
Retrieved: 2026-10-29. calc: counted from `data/schools/korea-schools-2026-09.csv` (official, 한국교육시설안전원, data date 2026-09-20, https://www.data.go.kr/data/15159184/fileData.do).

| Office of education (시도교육청) | Elementary | Middle | High | Total |
|---|---|---|---|---|
| 경기도교육청 | 1380 | 692 | 504 | 2576 |
| 서울특별시교육청 | 606 | 388 | 319 | 1313 |
| 전남광주통합특별시교육청 | 599 | 347 | 211 | 1157 |
| 경상남도교육청 | 523 | 270 | 193 | 986 |
| 경상북도교육청 | 473 | 260 | 183 | 916 |
| 전북특별자치도교육청 | 404 | 207 | 132 | 743 |
| 충청남도교육청 | 416 | 188 | 119 | 723 |
| 강원특별자치도교육청 | 355 | 160 | 116 | 631 |
| 부산광역시교육청 | 302 | 171 | 142 | 615 |
| 인천광역시교육청 | 274 | 147 | 129 | 550 |
| 충청북도교육청 | 268 | 131 | 83 | 482 |
| 대구광역시교육청 | 233 | 126 | 96 | 455 |
| 대전광역시교육청 | 155 | 90 | 62 | 307 |
| 울산광역시교육청 | 124 | 64 | 57 | 245 |
| 제주특별자치도교육청 | 119 | 47 | 34 | 200 |
| 세종특별자치시교육청 | 55 | 28 | 22 | 105 |
| **Total** | 6286 | 3316 | 2402 | 12004 |

| Level | National (국립) | Public (공립) | Private (사립) | Branch campuses (분교) |
|---|---|---|---|---|
| Elementary | 17 | 6195 | 74 | 95 |
| Middle | 9 | 2671 | 636 | 13 |
| High | 19 | 1433 | 950 | 2 |

## 1. Counts by level
Retrieved: 2026-11-11

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| Schools by level | 20,374: kindergartens 8,141 (−153); elementary 6,192; middle 3,292; high 2,387; other (special schools, 고등공민·고등기술·각종학교, broadcast schools) 362 | 2025-04-01 | Schools (incl. new and closed-for-now schools; excl. branch campuses and closed schools) | MOE / KEDI (2025 교육기본통계, 별첨 주요 내용 표 1) | https://www.korea.kr/common/download.do?fileId=198230613&tblKey=GMN | official (attached hwpx); this count differs from §0 (data.go.kr list, 2026-09) by date and definition |
| Kindergartens, elementary, middle and high schools | 20,480 (−125 from 20,605) | 2024-04-01 | Schools | MOE / KEDI (2024 교육기본통계) | https://eiec.kdi.re.kr/policy/materialView.do?num=256623 | official (excerpt) |
| Kindergartens, change | −147 | 2023→2024 | Schools | MOE / KEDI (2024 교육기본통계), via news | https://biz.newdaily.co.kr/site/data/html/2024/08/29/2024082900279.html | unverified (news) |
| Higher-education institutions | 422 (−2) | 2024-04-01 | Institutions (all types) | MOE / KEDI (2024 교육기본통계) | https://eiec.kdi.re.kr/policy/materialView.do?num=256623 | official (excerpt) |
| Kindergartens, elementary, middle and high schools | about 20,374 | 2025-04-01 | Schools | MOE / KEDI (2025 교육기본통계), via news | https://www.hangyo.com/mobile/article.html?no=105223 | calc: 20,480 (2024) − 106 (reported 2025 decline); confirmed by the official row above |
| Kindergartens, elementary, middle and high schools | 20,233 (−140) | 2026-04-01 | Schools | MOE / KEDI (2026 교육기본통계) | https://eiec.kdi.re.kr/policy/materialView.do?num=285801 | official (excerpt) |
| Students, kindergarten to high school | 5,362,281 (−189,007, −3.4%) | 2026-04-01 | Students | MOE / KEDI (2026 교육기본통계) | https://eiec.kdi.re.kr/policy/materialView.do?num=285801 | official (excerpt) |
| Schools by level, 2026 | 20,233: kindergartens 7,973 (−167); elementary 6,191 (−1); middle 3,301 (+9); high 2,398 (+11); other (special schools, 고등공민·고등기술·각종학교, broadcast schools) 370 (+8) | 2026-04-01 | Schools (incl. new and closed-for-now schools; excl. branch campuses and closed schools) | MOE / KEDI, 2026년 교육기본통계 (별첨 주요 내용, 표 1) | https://www.moe.go.kr/boardCnts/fileDown.do?m=020402&s=moe&fileSeq=aa48e83de6c2fd96bb7c3519dcdc3a55 | official (attached hwpx); makes the 2026 excerpt row above complete; release page https://www.moe.go.kr/boardCnts/viewRenew.do?boardID=294&boardSeq=107034&lev=0&m=020402&opType=N; kindergartens were 8,930 in 2015 |
| Higher-education institutions, 2026 | 416 (−5): four-year universities 188, universities of education 10, junior colleges 126, other 47 (industrial, broadcast, cyber, technical, 각종학교, 전공대학, in-company and polytechnic colleges), graduate-only 45; plus 1,263 graduate schools attached to universities | 2026-04-01 | Institutions | same (표 14, 15) | same | official (attached hwpx); closures are mergers: 강릉원주대 into 강원대; 거창·남해 도립대 into 국립창원대; 전남도립대 into 국립목포대; 원광보건대 into 원광대 |
| Class size | kindergarten 15.6; elementary 18.6; middle 24.5; high 23.1 | 2026-04-01 | Students per class | MOE / KEDI, 2026년 교육기본통계 (별첨 주요 내용, 표 12) | https://www.moe.go.kr/boardCnts/fileDown.do?m=020402&s=moe&fileSeq=aa48e83de6c2fd96bb7c3519dcdc3a55 | official (attached hwpx); replaces the unverified news row (hangyo.com, same figures) |
| 4-year universities and universities of education in the disclosure analysis | 193 | 2025-04 disclosure | Institutions (excl. cyber, polytechnic, graduate-only) | 한국대학교육협의회 (KCUE) / 대학알리미 analysis, via news | https://www.hangyo.com/news/article.html?no=104290 | unverified (news) |
| Junior colleges in the disclosure analysis | 129 | 2025-04 disclosure | Institutions | KCUE / 대학알리미 analysis, via news | https://www.hangyo.com/news/article.html?no=104290 | unverified (news) |
| 4-year universities and universities of education; junior colleges | 192; 125 (317 in all) | 2026-08 disclosure | Institutions in the analysis | KCUE | https://www.kcue.or.kr/_upload/news/2026/08/27/application_0638689fbb6c4a66776835c71c28b547.pdf | official (excerpt) |

Counts by level and by province (elementary, middle, high) are now in section 0, from the national list. Kindergartens in total: 7,973 (2026-04-01) and 8,141 (2025), above. Still not found: kindergartens by province (in the 교육기본통계 tables on kess.kedi.re.kr).

## 2. High schools by type (counts)
Retrieved: 2026-11-11

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| High schools by type (official) | 2,387: 일반고 1,609; 특성화고 484 (vocational 458, alternative 26); 특목고 162 (과학고 20, 영재학교 8, 예술고 25, 외국어고 28, 체육고 17, 국제고 8, 산업수요맞춤형고 = 마이스터고 56); 자율고 132 (자율형 공립고 99, 자율형 사립고 33) | 2025-04-01 | Schools (gifted schools counted as 특목고; 공군항공과학고 excluded) | MOE / KEDI (2025 교육기본통계, 별첨 주요 내용 표 1 notes) | https://www.korea.kr/common/download.do?fileId=198230613&tblKey=GMN | official (attached hwpx); confirms the news counts below for 2025 (자사고 33 in 2025 vs 32 reported for 2026) |
| High school students by type | 일반고 981,354; 특성화고 168,465; 특목고 60,701; 자율고 88,946 (1,299,466 in all) | 2025-04-01 | Students | same (표 2) | same | official |
| High schools by type, 2026 (official) | 2,398: 일반고 1,594; 특성화고 485 (vocational 458, alternative 27); 특목고 163 (과학고 20, 영재학교 8, 예술고 25, 외국어고 28, 체육고 17, 국제고 8, 산업수요맞춤형고 = 마이스터고 57); 자율고 156 (자율형 공립고 124, 자율형 사립고 = 자사고 32) | 2026-04-01 | Schools (공군항공과학고 excluded for security) | MOE / KEDI, 2026년 교육기본통계 (별첨 주요 내용, 표 1 and note 3) | https://www.moe.go.kr/boardCnts/fileDown.do?m=020402&s=moe&fileSeq=aa48e83de6c2fd96bb7c3519dcdc3a55 | official (attached hwpx); newer-year row; 일반고 −15 and 자율형 공립고 +25 in a year |
| High school students by type, 2026 | 일반고 951,695; 특성화고 165,606; 특목고 61,066; 자율고 101,025 (1,279,392 in all) | 2026-04-01 | Students | same (표 2) | same | official (attached hwpx) |
| Share of high schools by type | ~70% general (일반고), ~20% vocational (특성화고), ~10% autonomous and special-purpose | 2011–2021 | Share of schools | KEDI (월간 교육정책포럼) | http://edpolicy.kedi.re.kr/edpolicy/webzine/42/832 | official (also in korea-stats.md §5) |
| Gifted schools (영재학교) | 8 | 2021 entry onward | Schools | Education news | https://www.localnaeil.com/News/View/642605 | unverified (news) |
| Gifted schools, in-quota places | 789 | 2021 entry | Places | Education news | https://www.localnaeil.com/News/View/642605 | unverified (news) |
| Science high schools (과학고) | 20 | 2016–2026 entries | Schools | Education news | https://www.ajunews.com/view/20150727092807703 | unverified (news) for the run of years; 20 is official on 2025-04-01 and 2026-04-01 (rows above) |
| Science high schools | 22 (부천고 and 분당중앙고 added as 경기형 과학고) | 2027 entry | Schools | Education news | https://www.localnaeil.com/News/View/654855 | unverified (news) |
| Foreign language high schools (외고) | 28 | 2026-04-01 | Schools | MOE / KEDI, 2026년 교육기본통계 (별첨 표 1 note 3) | https://www.moe.go.kr/boardCnts/fileDown.do?m=020402&s=moe&fileSeq=aa48e83de6c2fd96bb7c3519dcdc3a55 | official (attached hwpx); replaces the news row (MOE designation list via edujb.com/news/articleView.html?idxno=8139, 2026-03-01, also 28) |
| International high schools (국제고) | 8 | 2026-04-01 | Schools | MOE / KEDI, 2026년 교육기본통계 (별첨 표 1 note 3) | https://www.moe.go.kr/boardCnts/fileDown.do?m=020402&s=moe&fileSeq=aa48e83de6c2fd96bb7c3519dcdc3a55 | official (attached hwpx); replaces the news row (edujb.com, 2026-03-01, also 8) |
| Autonomous private high schools (자사고) | 32 (15 in Seoul) | 2026-04-01 (Seoul split 2026-03-01) | Schools | MOE / KEDI, 2026년 교육기본통계 (별첨 표 1 note 3); Seoul split: MOE designation list via news | https://www.moe.go.kr/boardCnts/fileDown.do?m=020402&s=moe&fileSeq=aa48e83de6c2fd96bb7c3519dcdc3a55 | official (attached hwpx) for 32; the Seoul split (15) is still unverified (edujb.com/news/articleView.html?idxno=8139) |
| Nationwide-admission 자사고 (전국단위) | 10 | 2023 | Schools | Education news (종로학원 analysis) | https://dhnews.co.kr/news/view/179520660371195 | unverified (news) |
| Meister high schools (마이스터고) operating | 54, in 15 provinces | 2023–2026 | Schools | Education news | https://www.metroseoul.co.kr/article/20230704500290 | unverified (news) |
| Meister high schools after the 2026 designations | 65 (6 new in June 2026, 3 of them conditional) | 2026-06 | Schools designated | MOE announcement, via news | https://www.hangyo.com/news/article.html?no=101428 | unverified (news) |
| International middle schools (국제중) | 5 historically | 2018–2020 | Schools | Education news | https://www.hankyung.com/amp/2020060985421 | unverified (news); current status of 대원·영훈 unclear, see §4 |

Counts of 일반고, 특성화고, 자율형 공립고, 예술고 and 체육고 are now in the official row at the top. Not found: any count by province.

## 3. Named lists
Retrieved: 2026-11-11 (3.5, 3.7 and 3.9 updated with the 2026 교육기본통계 counts; the lists themselves are from 2026-11-04). Each list says how complete it is. The Korean names are as NEIS gives them (고등학교 shortened to 고); no English names are given now, to avoid unchecked translations.

Source for every list in 3.1–3.5 and 3.7 (unless noted): each high school in `data/schools/korea-schools-2026-09.csv` was looked up by exact name (and office of education) in the NEIS school-information API (`https://open.neis.go.kr/hub/schoolInfo`, no key; fields `HS_SC_NM` school type and `SPCLY_PURPS_HS_ORD_NM` special-purpose track; NEIS load date 2026-04-23) on 2026-11-04. official (calc: classified and counted by us). All 2,402 schools were looked up; 2,396 matched (the 6 unmatched are four Jeju international schools, a farm-campus annex and a broadcast high school). NEIS types: 일반고 1,637; 특성화고 487; 특목고 159; 자율고 113 (public 74, private 39). Place is the first two parts of the road address.

### 3.1 Gifted schools (영재학교): 8 of 8

The official list of the eight, as MOE/KEDI name them in the 2025 교육기본통계 notes (counted there as 특목고): 서울과학고, 한국과학영재학교, 대구과학고, 인천과학예술영재학교, 경기과학고, 광주과학고, 대전과학고, 세종과학예술영재학교 (https://www.korea.kr/common/download.do?fileId=198230613&tblKey=GMN; official, attached hwpx). NEIS lists all eight as 특목고.

| School | Place | Founding | NEIS track (계열) |
|---|---|---|---|
| 경기과학고 | 경기도 수원시 | 공립 | 과학계열 |
| 대구과학고 | 대구광역시 수성구 | 공립 | — |
| 대전과학고 | 대전광역시 유성구 | 공립 | 과학계열 |
| 한국과학영재학교 | 부산광역시 부산진구 | 국립 | — |
| 서울과학고 | 서울특별시 종로구 | 공립 | 과학계열 |
| 세종과학예술영재학교 | 세종특별자치시 달빛1로 | 공립 | 과학계열 |
| 인천과학예술영재학교 | 인천광역시 연수구 | 공립 | 과학계열 |
| 광주과학고 | 전남광주통합특별시 북구 | 공립 | — |

### 3.2 Science high schools (과학고): 20 of 20

Matches the official count of 20 (2025-04-01). The two not confirmed last time are 전북과학고 (Iksan) and 경산과학고 (Gyeongsan). From the 2027 entry, 부천고 and 분당중앙고 in Gyeonggi also admit as science high schools (https://www.localnaeil.com/News/View/654855, unverified); NEIS still lists them as general schools. Not included: 울산스포츠과학고 (a sports school) and 전남생명과학고 (an industry-demand school).

| School | Place | Founding | NEIS track (계열) |
|---|---|---|---|
| 강원과학고 | 강원특별자치도 원주시 | 공립 | 과학계열 |
| 경기북과학고 | 경기도 의정부시 | 공립 | 과학계열 |
| 경남과학고 | 경상남도 진주시 | 공립 | 과학계열 |
| 창원과학고 | 경상남도 창원시 | 공립 | 과학계열 |
| 경산과학고 | 경상북도 경산시 | 공립 | 과학계열 |
| 경북과학고 | 경상북도 포항시 | 공립 | 과학계열 |
| 대구일과학고 | 대구광역시 동구 | 공립 | 과학계열 |
| 대전동신과학고 | 대전광역시 동구 | 공립 | — |
| 부산과학고 | 부산광역시 금정구 | 공립 | 과학계열 |
| 부산일과학고 | 부산광역시 사하구 | 공립 | 과학계열 |
| 세종과학고 | 서울특별시 구로구 | 공립 | 과학계열 |
| 한성과학고 | 서울특별시 서대문구 | 공립 | 과학계열 |
| 울산과학고 | 울산광역시 울주군 | 공립 | 과학계열 |
| 인천진산과학고 | 인천광역시 부평구 | 공립 | 과학계열 |
| 인천과학고 | 인천광역시 중구 | 공립 | 과학계열 |
| 전남과학고 | 전남광주통합특별시 나주시 | 공립 | 과학계열 |
| 전북과학고 | 전북특별자치도 익산시 | 공립 | 과학계열 |
| 제주과학고 | 제주특별자치도 제주시 | 공립 | 과학계열 |
| 충남과학고 | 충청남도 공주시 | 공립 | — |
| 충북과학고 | 충청북도 청주시 | 공립 | 과학계열 |

### 3.3 Foreign language high schools (외고): 28 of 28

Matches the official count of 28.

| School | Place | Founding | NEIS track (계열) |
|---|---|---|---|
| 고양외국어고 | 경기도 고양시 | 사립 | 외국어계열 |
| 과천외국어고 | 경기도 과천시 | 사립 | 외국어계열 |
| 김포외국어고 | 경기도 김포시 | 사립 | 외국어계열 |
| 동두천외국어고 | 경기도 동두천시 | 공립 | — |
| 성남외국어고 | 경기도 성남시 | 공립 | 외국어계열 |
| 수원외국어고 | 경기도 수원시 | 공립 | 외국어계열 |
| 안양외국어고 | 경기도 안양시 | 사립 | 외국어계열 |
| 경기외국어고 | 경기도 의왕시 | 사립 | — |
| 김해외국어고 | 경상남도 김해시 | 공립 | 외국어계열 |
| 경남외국어고 | 경상남도 양산시 | 사립 | 외국어계열 |
| 경북외국어고 | 경상북도 구미시 | 공립 | 외국어계열 |
| 대구외국어고 | 대구광역시 달서구 | 공립 | 외국어계열 |
| 대전외국어고 | 대전광역시 서구 | 공립 | — |
| 부산외국어고 | 부산광역시 연제구 | 사립 | 외국어계열 |
| 한영외국어고 | 서울특별시 강동구 | 사립 | 외국어계열 |
| 명덕외국어고 | 서울특별시 강서구 | 사립 | 외국어계열 |
| 대원외국어고 | 서울특별시 광진구 | 사립 | 외국어계열 |
| 서울외국어고 | 서울특별시 도봉구 | 사립 | 외국어계열 |
| 대일외국어고 | 서울특별시 성북구 | 사립 | 외국어계열 |
| 이화여자외국어고 | 서울특별시 중구 | 사립 | 외국어계열 |
| 울산외국어고 | 울산광역시 북구 | 공립 | 외국어계열 |
| 미추홀외국어고 | 인천광역시 남동구 | 공립 | — |
| 인천외국어고 | 인천광역시 부평구 | 사립 | — |
| 전남외국어고 | 전남광주통합특별시 나주시 | 공립 | 외국어계열 |
| 전북외국어고 | 전북특별자치도 군산시 | 공립 | 외국어계열 |
| 제주외국어고 | 제주특별자치도 제주시 | 공립 | 외국어계열 |
| 충남외국어고 | 충청남도 아산시 | 공립 | — |
| 충북외국어고 | 충청북도 청주시 | 공립 | 외국어계열 |

### 3.4 International high schools (국제고): 8 of 8

Matches the official count of 8.

| School | Place | Founding | NEIS track (계열) |
|---|---|---|---|
| 청심국제고 | 경기도 가평군 | 사립 | 국제계열 |
| 고양국제고 | 경기도 고양시 | 공립 | 국제계열 |
| 동탄국제고 | 경기도 화성시 | 공립 | 국제계열 |
| 대구국제고 | 대구광역시 북구 | 공립 | 국제계열 |
| 부산국제고 | 부산광역시 부산진구 | 공립 | 국제계열 |
| 서울국제고 | 서울특별시 종로구 | 공립 | 국제계열 |
| 세종국제고 | 세종특별자치시 달빛1로 | 공립 | 국제계열 |
| 인천국제고 | 인천광역시 중구 | 공립 | — |

### 3.5 Autonomous private high schools (자사고): 39 private 자율고 in NEIS

NEIS has one type, 자율고, for both 자율형 사립고 and 자율형 공립고; the 39 below are the private ones. The official count of 자율형 사립고 was 33 on 2025-04-01 (32 on 2026-04-01, official: 2026 교육기본통계), so about six of these are private schools in another autonomous scheme or not yet updated in NEIS; which ones was not checked. Nationwide-admission (전국단위) marks are from news (https://dhnews.co.kr/news/view/179520660371195, unverified); the 7 of them outside the capital region filled 21.7% of 1,816 places with local students (2023, 종로학원 analysis). Seoul has 20 private 자율고 in NEIS (15 자사고 reported for 2026).

| School | Place | Founding | NEIS track (계열) | Notes |
|---|---|---|---|---|
| 민족사관고 | 강원특별자치도 횡성군 | 사립 | — | nationwide admission (news) |
| 안산동산고 | 경기도 안산시 | 사립 | — |  |
| 용인한국외국어대학교부설고 | 경기도 용인시 | 사립 | — | nationwide admission (news) |
| 김천고 | 경상북도 김천시 | 사립 | — | nationwide admission (news) |
| 포항제철고 | 경상북도 포항시 | 사립 | — | nationwide admission (news) |
| 계성고 | 대구광역시 서구 | 사립 | — |  |
| 대전대신고 | 대전광역시 서구 | 사립 | — |  |
| 대전대성고 | 대전광역시 중구 | 사립 | — |  |
| 부일고 | 부산광역시 사하구 | 사립 | — |  |
| 해운대고 | 부산광역시 해운대구 | 사립 | — |  |
| 현대고 | 서울특별시 강남구 | 사립 | — |  |
| 휘문고 | 서울특별시 강남구 | 사립 | — |  |
| 중동고 | 서울특별시 강남구 | 사립 | — |  |
| 배재고 | 서울특별시 강동구 | 사립 | — |  |
| 신일고 | 서울특별시 강북구 | 사립 | — |  |
| 선덕고 | 서울특별시 도봉구 | 사립 | — |  |
| 경희고 | 서울특별시 동대문구 | 사립 | — |  |
| 대광고 | 서울특별시 동대문구 | 사립 | — |  |
| 숭문고 | 서울특별시 마포구 | 사립 | — |  |
| 세화고 | 서울특별시 서초구 | 사립 | — |  |
| 세화여자고 | 서울특별시 서초구 | 사립 | — |  |
| 한양대학교사범대학부속고 | 서울특별시 성동구 | 사립 | — |  |
| 보인고 | 서울특별시 송파구 | 사립 | — |  |
| 한가람고 | 서울특별시 양천구 | 사립 | — |  |
| 양정고 | 서울특별시 양천구 | 사립 | — |  |
| 장훈고 | 서울특별시 영등포구 | 사립 | — |  |
| 하나고 | 서울특별시 은평구 | 사립 | — | nationwide admission (news) |
| 동성고 | 서울특별시 종로구 | 사립 | — |  |
| 중앙고 | 서울특별시 종로구 | 사립 | — |  |
| 이화여자고 | 서울특별시 중구 | 사립 | — |  |
| 현대청운고 | 울산광역시 동구 | 사립 | — | nationwide admission (news) |
| 인천포스코고 | 인천광역시 연수구 | 사립 | — |  |
| 인천하늘고 | 인천광역시 중구 | 사립 | — | nationwide admission (news) |
| 광양제철고 | 전남광주통합특별시 광양시 | 사립 | — | nationwide admission (news) |
| 군산중앙고 | 전북특별자치도 군산시 | 사립 | — |  |
| 남성고 | 전북특별자치도 익산시 | 사립 | — |  |
| 상산고 | 전북특별자치도 전주시 | 사립 | — | nationwide admission (news) |
| 충남삼성고 | 충청남도 아산시 | 사립 | — |  |
| 북일고 | 충청남도 천안시 | 사립 | — | nationwide admission (news) |

The 74 public 자율고 (자율형 공립고) are not listed.

### 3.6 International middle schools (국제중): 5 historically

| School | City | Type | Opened | Notes |
|---|---|---|---|---|
| 부산국제중 | Busan | public | 1999 | unverified (news) |
| 청심국제중 | Gapyeong, Gyeonggi | private | 2005 | unverified (news) |
| 대원국제중 | Seoul | private | 2008 | unverified (news); 2020 re-designation dispute, current status unclear |
| 영훈국제중 | Seoul | private | 2008 | unverified (news); 2020 re-designation dispute, current status unclear |
| 선인국제중 | Jinju, Gyeongnam | private | 2018 | unverified (news) |

Source: https://www.hankyung.com/amp/2020060985421. A 2025 article reports record competition for 국제중 entry (https://www.etnews.com/20251107000132); applicant ratios are in `korea-stats.md` §5 (2026 entry: 대원 23.55 : 1, unverified). 국제중 are middle schools, which NEIS does not type, so this list was not re-checked.

### 3.7 Meister and industry-demand high schools (마이스터고 / 산업수요 맞춤형고): 53 in NEIS

The official count is 57 산업수요맞춤형고 on 2026-04-01 (56 in 2025; 2026 교육기본통계, see §2), and news reports 65 after the June 2026 designations (some open from 2027; https://www.hangyo.com/news/article.html?no=101428, unverified). NEIS gives the track 산업수요 맞춤형 for most; 군산기계공업고 and 합덕제철고 have no track in NEIS and are included by their known status. 대구전자공고, 예산전자공고 and 경북소프트웨어고 convert from 2027 (news) and are not yet in this list.

한국에너지마이스터고 (강원특별자치도 삼척시); 한국소방마이스터고 (강원특별자치도 영월군); 한국의료마이스터고 (강원특별자치도 원주시); 수원하이텍고 (경기도 수원시); 경기게임마이스터고 (경기도 안양시); 평택마이스터고 (경기도 평택시); 거제공업고 (경상남도 거제시); 한국나노마이스터고 (경상남도 밀양시); 삼천포공업고 (경상남도 사천시); 한국국제통상마이스터고 (경상북도 경주시); 한국반도체마이스터고 (경상북도 경주시); 금오공업고 (경상북도 구미시); 구미전자공업고 (경상북도 구미시); 경북바이오마이스터고 (경상북도 영천시); 한국원자력마이스터고 (경상북도 울진군); 포항제철공업고 (경상북도 포항시); 경북기계공업고 (대구광역시 달서구); 대구소프트웨어마이스터고 (대구광역시 달성군); 대구일마이스터고 (대구광역시 동구); 대구농업마이스터고 (대구광역시 수성구); 동아마이스터고 (대전광역시 동구); 대덕소프트웨어마이스터고 (대전광역시 유성구); 부산소프트웨어마이스터고 (부산광역시 강서구); 부산자동차마이스터고 (부산광역시 사하구); 부산해사고 (부산광역시 영도구); 부산기계공업고 (부산광역시 해운대구); 수도전기공업고 (서울특별시 강남구); 서울로봇고 (서울특별시 강남구); 미림마이스터고 (서울특별시 관악구); 서울도시과학기술고 (서울특별시 성북구); 현대공업고 (울산광역시 동구); 울산마이스터고 (울산광역시 북구); 울산에너지고 (울산광역시 북구); 인천전자마이스터고 (인천광역시 미추홀구); 인천해사고 (인천광역시 중구); 전남생명과학고 (전남광주통합특별시 강진군); 광주자동화설비마이스터고 (전남광주통합특별시 광산구); 광주소프트웨어마이스터고 (전남광주통합특별시 광산구); 한국항만물류고 (전남광주통합특별시 광양시); 여수석유화학고 (전남광주통합특별시 여수시); 완도수산고 (전남광주통합특별시 완도군); 군산기계공업고 (전북특별자치도 군산시); 김제농생명마이스터고 (전북특별자치도 김제시); 한국경마축산고 (전북특별자치도 남원시); 전북기계공업고 (전북특별자치도 익산시); 공주마이스터고 (충청남도 공주시); 연무마이스터고 (충청남도 논산시); 합덕제철고 (충청남도 당진시); 한국식품마이스터고 (충청남도 부여군); 아산스마트팩토리마이스터고 (충청남도 아산시); 충북반도체고 (충청북도 음성군); 한국바이오마이스터고 (충청북도 진천군); 충북에너지고 (충청북도 청주시).

### 3.7a Arts and sports high schools: 25 and 17

Both match the official 2025 counts. Arts (예술고): 강원예술고 (강원특별자치도 강릉시); 고양예술고 (경기도 고양시); 경기예술고 (경기도 부천시); 계원예술고 (경기도 성남시); 안양예술고 (경기도 안양시); 경남예술고 (경상남도 진주시); 경북예술고 (대구광역시 남구); 브니엘예술고 (부산광역시 금정구); 부산예술고 (부산광역시 금정구); 한국조형예술고 (부산광역시 남구); 국립국악고 (서울특별시 강남구); 덕원예술고 (서울특별시 강서구); 선화예술고 (서울특별시 광진구); 서울공연예술고 (서울특별시 구로구); 국립전통예술고 (서울특별시 금천구); 서울예술고 (서울특별시 종로구); 세종예술고 (세종특별자치시 중앙공원서로); 인천예술고 (인천광역시 남동구); 한국창의예술고 (전남광주통합특별시 광양시); 전남예술고 (전남광주통합특별시 무안군); 광주예술고 (전남광주통합특별시 북구); 진도국악고 (전남광주통합특별시 진도군); 충남디자인예술고 (충청남도 서천군); 충남예술고 (충청남도 천안시); 충북예술고 (충청북도 청주시). Sports (체육고): 강원체육고 (강원특별자치도 춘천시); 경기체육고 (경기도 수원시); 경남체육고 (경상남도 진주시); 경북체육고 (경상북도 경산시); 대구체육고 (대구광역시 북구); 대전체육고 (대전광역시 유성구); 부산체육고 (부산광역시 영도구); 서울체육고 (서울특별시 송파구); 울산스포츠과학고 (울산광역시 북구); 인천체육고 (인천광역시 서구); 전남체육고 (전남광주통합특별시 무안군); 광주체육고 (전남광주통합특별시 북구); 한국바둑고 (전남광주통합특별시 순천시); 함평골프고 (전남광주통합특별시 함평군); 전북체육고 (전북특별자치도 완주군); 충남체육고 (충청남도 논산시); 충북체육고 (충청북도 진천군).

### 3.8 Medical schools (의대): 40 of 40, with places
Retrieved: 2026-11-04. From MOE's 2027–2031 allocation (별첨1 「2027학년도~2031학년도 의과대학 학생정원 배정(안)」, notified 2026-03-13), read from the attached hwp itself: https://www.korea.kr/common/download.do?fileId=198386388&tblKey=GMN (release: https://www.korea.kr/briefing/pressReleaseView.do?newsId=156748818). official. The 2024 column is the pre-increase quota; MOE set 2026 entry back to that level (3,058), so it is also the 2026 figure. All added places are 지역의사 (regional-doctor) places; Seoul's eight schools get none. News reports MOE confirmed the allocation unchanged on 2026-04-28 (unverified).

| University | Region (as grouped by MOE) | 2024 = 2026 places | 2027 places | 2028–2031 places a year |
|---|---|---|---|---|
| 가톨릭관동대 | 강원 | 49 | 55 (+6) | 57 (+8) |
| 강원대 | 강원 | 49 | 88 (+39) | 98 (+49) |
| 연세대 미래캠퍼스 | 강원 | 93 | 104 (+11) | 107 (+14) |
| 한림대 | 강원 | 76 | 83 (+7) | 84 (+8) |
| 가천대 | 경기·인천 | 40 | 47 (+7) | 49 (+9) |
| 성균관대 | 경기·인천 | 40 | 43 (+3) | 44 (+4) |
| 아주대 | 경기·인천 | 40 | 46 (+6) | 47 (+7) |
| 인하대 | 경기·인천 | 49 | 55 (+6) | 56 (+7) |
| 차의과대 | 경기·인천 | 40 | 42 (+2) | 43 (+3) |
| 전남대 | 광주 | 125 | 156 (+31) | 163 (+38) |
| 조선대 | 광주 | 125 | 144 (+19) | 149 (+24) |
| 경북대 | 대구·경북 | 110 | 136 (+26) | 143 (+33) |
| 계명대 | 대구·경북 | 76 | 91 (+15) | 95 (+19) |
| 대구가톨릭대 | 대구·경북 | 40 | 53 (+13) | 56 (+16) |
| 동국대 WISE캠퍼스 | 대구·경북 | 49 | 54 (+5) | 55 (+6) |
| 영남대 | 대구·경북 | 76 | 89 (+13) | 92 (+16) |
| 건양대 | 대전·충남 | 49 | 55 (+6) | 57 (+8) |
| 단국대(천안) | 대전·충남 | 40 | 55 (+15) | 58 (+18) |
| 순천향대 | 대전·충남 | 93 | 111 (+18) | 116 (+23) |
| 을지대 | 대전·충남 | 40 | 46 (+6) | 48 (+8) |
| 충남대 | 대전·충남 | 110 | 137 (+27) | 143 (+33) |
| 경상국립대 | 부산·울산·경남 | 76 | 98 (+22) | 104 (+28) |
| 고신대 | 부산·울산·경남 | 76 | 83 (+7) | 85 (+9) |
| 동아대 | 부산·울산·경남 | 49 | 66 (+17) | 70 (+21) |
| 부산대 | 부산·울산·경남 | 125 | 156 (+31) | 163 (+38) |
| 울산대 | 부산·울산·경남 | 40 | 45 (+5) | 46 (+6) |
| 인제대 | 부산·울산·경남 | 93 | 108 (+15) | 112 (+19) |
| 원광대 | 전북 | 93 | 110 (+17) | 114 (+21) |
| 전북대 | 전북 | 142 | 163 (+21) | 169 (+27) |
| 제주대 | 제주 | 40 | 68 (+28) | 75 (+35) |
| 건국대 글로컬캠퍼스 | 충북 | 40 | 47 (+7) | 49 (+9) |
| 충북대 | 충북 | 49 | 88 (+39) | 98 (+49) |
| 가톨릭대 | 서울 | 93 | 93 | 93 |
| 경희대 | 서울 | 110 | 110 | 110 |
| 고려대 | 서울 | 106 | 106 | 106 |
| 서울대 | 서울 | 135 | 135 | 135 |
| 연세대 | 서울 | 110 | 110 | 110 |
| 이화여대 | 서울 | 76 | 76 | 76 |
| 중앙대 | 서울 | 86 | 86 | 86 |
| 한양대 | 서울 | 110 | 110 | 110 |
| **Total** | | 3,058 | 3,548 (+490) | 3,671 (+613) |

Checks (calc): the rows sum to the file's totals (3,058; +490; +613) and to its region subtotals (e.g. 부산·울산·경남 +97 / +121). Universities asked for 760 (2027) and 953 (2028–31) places.

| Statistic | Value | Year | Unit/definition | Source organization | URL | Notes |
|---|---|---|---|---|---|---|
| Medical schools | 40 | 2024–2027 | Universities with a medical school | MOE allocation table | https://www.korea.kr/common/download.do?fileId=198386388&tblKey=GMN | official (attached hwp); replaces the news count |
| Medical school places | 3,058 | 2026 entry | Total admissions (back to the 2024 level) | MOE | https://m.korea.kr/news/policyNewsView.do?newsId=148941980 | official (excerpt) |
| Medical school increase | +1,489 to +1,509 (total about 4,547–4,567) | 2025 entry | Places | MOE decision, via news | https://magazine.hankyung.com/business/article/202405022426b | unverified (news); `korea-stats.md` §8 has the official 4,610 |
| 정시 수능-track places at medical schools | 1,010 (from 1,492 in 2025); Seoul 384, Busan 78, Gangwon 77 | 2026 entry | Places | Admissions analysis, seen in search excerpts | https://riroschool.kr/kceenews/detail/213 or https://www.dhnews.co.kr/news/view/1065586981556064 | unverified (the excerpt didn't say which of these two pages it came from) |

Not found: each school's 2025 places (the +1,509 year) and the 수시/정시 split by school (대입정보포털 어디가, adiga.kr).

### 3.9 Universities

The full list is not here yet: 대학알리미 (academyinfo.go.kr) has the official list of about 190 four-year universities with founding type and region, but it reset connections again on 2026-11-11, and the KEDI university datasets on data.go.kr (15050052, 15050056) only link to kess.kedi.re.kr.

Official totals on 2026-04-01 (MOE / KEDI, 2026년 교육기본통계, 별첨 표 14–15, https://www.moe.go.kr/boardCnts/fileDown.do?m=020402&s=moe&fileSeq=aa48e83de6c2fd96bb7c3519dcdc3a55; official, attached hwpx): 188 four-year universities (182 under the Higher Education Act, plus 6 under their own laws), 2 industrial universities, 10 universities of education, 126 junior colleges, 41 graduate-only universities (+3 under their own laws), 18 cyber universities (+2 at junior-college level); the 126 junior colleges include 한국농수산대. The table names these groups in full:

- Universities of education (교육대학, 10): 공주교육대, 광주교육대, 대구교육대, 부산교육대, 서울교육대, 경인교육대, 전주교육대, 진주교육대, 청주교육대, 춘천교육대.
- Universities under their own laws (6): 한국과학기술원 (KAIST), 광주과학기술원, 대구경북과학기술원, 울산과학기술원, 한국전통문화대, 한국에너지공과대.
- Industrial universities (산업대학, 2): 청운대, 호원대. Broadcast university: 한국방송통신대.
- Mergers in the year to 2026-04-01: 국립강릉원주대 into 강원대 (four-year); 경남도립거창대 and 경남도립남해대 into 국립창원대, 전남도립대 into 국립목포대, 원광보건대 into 원광대 (junior colleges).

## 4. Notes and open questions

- 국제중: in 2020 Seoul moved to end 대원 and 영훈's designation; one later article says the two now run as specialized curricula under their original school names. Their current status needs a primary source.
- 자사고: a 2019–2021 policy planned to turn every 자사고 into a general school in 2025; the official 2026-04-01 count of 32 자율형 사립고 (2026 교육기본통계) suggests that was reversed, but the legal history was not checked.
- Counts in news articles depend on the date (designated vs operating, entry year vs school year). Each row gives the year the number describes.
