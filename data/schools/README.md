# The national school list

`korea-schools-2026-09.csv` is every operating elementary, middle and high school in Korea: 12,004 schools (6,286 elementary, 3,316 middle, 2,402 high) with ID, name, level, founding date, national/public/private, main or branch campus, addresses, office of education, latitude and longitude.

- **Source:** 한국교육시설안전원 (Korea Educational Facilities Safety Agency), "한국교육시설안전원_초중등학교위치_20260920", on the public data portal: https://www.data.go.kr/data/15159184/fileData.do
- **Data date:** 2026-09-20 (registered 2026-09-20, revised 2026-10-01). Downloaded 2026-10-29.
- **License:** 이용허락범위 제한 없음 (no usage restrictions), free.
- **Updates:** twice a year; the next release is due 2027-03-31. Replace the file and update the counts in `../schools.md` when it comes out.
- **Format:** UTF-8 with BOM, comma-separated, the provider's own Korean column names, unchanged.
- **Not in this file:** kindergartens, special schools (특수학교), alternative schools, and high-school type (일반고, 특목고, 특성화고, 자율고). NEIS (open.neis.go.kr, `schoolInfo` → `HS_SC_NM`) has the high-school type, but without an API key it returns only 5 rows per query; with a free NEIS key the whole high-school list can be classified.
