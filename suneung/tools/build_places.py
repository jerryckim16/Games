"""Builds suneung/places.js: real geography and real schools for the Suneung Simulator.

Inputs (pass the paths; nothing is downloaded here):
  1. data/schools/korea-schools-*.csv: the national school list (data.go.kr, 한국교육시설안전원).
  2. skorea-provinces-2018-geo.json and skorea-municipalities-2018-geo.json from
     https://github.com/southkorea/southkorea-maps (kostat/2018/json): KOSTAT census boundaries,
     "free to share or remix".

Usage: python3 -I suneung/tools/build_places.py <schools.csv> <provinces.json> <municipalities.json> > suneung/places.js

What it writes:
  - geo: province outlines and every municipality's outline (시군구, 250), projected the way art.js
    draws the map (x = (lon - 124.4) * 100, y = (39 - lat) * 125) and simplified for a ~755-wide map.
  - areas: for each game place (engine.js REGIONS), the real municipalities it stands for as a home,
    and every operating school there: name, level, founding type, kind and position.
  - special: the special schools a player can apply to from anywhere (science and gifted schools,
    nationwide 자사고, foreign-language and international high schools, international middle schools,
    arts and sports high schools, vocational high schools), with positions.
The kinds come from the verified named lists in data/schools.md and, for arts and vocational
schools, from words in the school's name (a heuristic: see VOC_WORDS).
"""
import csv, json, math, sys

def proj(lon, lat):
    return ((lon - 124.4) * 100, (39.0 - lat) * 125)

# ---------- polygon simplification (Douglas-Peucker on projected points) ----------
def dp(pts, tol):
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        ax, ay = pts[a]; bx, by = pts[b]
        dx, dy = bx - ax, by - ay
        L = math.hypot(dx, dy) or 1e-9
        best, bi = 0, -1
        for i in range(a + 1, b):
            px, py = pts[i]
            d = abs(dy * (px - ax) - dx * (py - ay)) / L
            if d > best:
                best, bi = d, i
        if best > tol and bi > 0:
            keep[bi] = True
            stack += [(a, bi), (bi, b)]
    return [p for p, k in zip(pts, keep) if k]

def dp_ring(ring, tol):
    # A closed ring starts and ends on the same point, which gives Douglas-Peucker a zero-length
    # baseline; split it at the point farthest from the start and simplify the two halves.
    pts = ring[:-1]
    if len(pts) < 4:
        return ring
    far = max(range(len(pts)), key=lambda i: (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2)
    a = dp(pts[:far + 1], tol); b = dp(pts[far:] + [pts[0]], tol)
    return a[:-1] + b

def area(pts):
    return abs(sum(pts[i][0] * pts[i - 1][1] - pts[i - 1][0] * pts[i][1] for i in range(len(pts)))) / 2

def path(geom, tol, min_area):
    polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
    out = []
    for poly in polys:
        ring = [proj(lon, lat) for lon, lat in poly[0]]
        if area(ring) < min_area:
            continue
        ring = dp_ring(ring, tol)
        if len(ring) < 4:
            continue
        out.append("M" + "L".join("%.1f %.1f" % p for p in ring[:-1]) + "Z")
    return "".join(out)

# ---------- the game's places as real homes ----------
SEOUL = "서울특별시"
GJ = "전남광주통합특별시"  # Gwangju and South Jeolla merged their education office in 2026
AREAS = {
    "gangnam": (SEOUL, ["서초구", "강남구", "송파구"]),
    "nowon": (SEOUL, ["노원구", "도봉구", "강북구", "성북구", "중랑구", "동대문구"]),
    "mokdong": (SEOUL, ["양천구", "강서구", "구로구"]),
    "mapo": (SEOUL, ["마포구", "서대문구", "은평구", "종로구", "중구", "용산구"]),
    "gwanak": (SEOUL, ["관악구", "동작구", "금천구", "영등포구"]),
    "gangdong": (SEOUL, ["강동구", "광진구", "성동구"]),
    "suwon": ("경기도", ["수원시"]),
    "busan": ("부산광역시", None),
    "daegu": ("대구광역시", None),
    "gwangju": (GJ, ["동구", "서구", "남구", "북구", "광산구"]),
    "daejeon": ("대전광역시", None),
    "pohang": ("경상북도", ["포항시"]),
    "jeonju": ("전북특별자치도", ["전주시"]),
    "cheongju": ("충청북도", ["청주시"]),
    "jeju": ("제주특별자치도", ["제주시"]),
    "pyeongchang": ("강원특별자치도", ["평창군"]),
    "haenam": (GJ, ["해남군"]),
}
# KOSTAT 2018 province codes and municipality names for the same homes.
GEO_PROV = {"서울특별시": "11", "부산광역시": "21", "대구광역시": "22", "광주": "24", "대전광역시": "25", "경기도": "31", "강원특별자치도": "32",
            "충청북도": "33", "전북특별자치도": "35", "전남": "36", "경상북도": "37", "제주특별자치도": "39"}
def geo_codes(rid, munis):
    prov, names = AREAS[rid]
    if rid == "gwangju":
        return [c for c, (n, p) in munis.items() if c.startswith("24")]
    if rid == "haenam":
        return [c for c, (n, p) in munis.items() if c.startswith("36") and n == "해남군"]
    pc = GEO_PROV[prov]
    return [c for c, (n, p) in munis.items() if c.startswith(pc) and (names is None or any(n.startswith(x) for x in names))]

# ---------- kinds of school ----------
GIFTED_SCI = ["서울과학고", "경기과학고", "한국과학영재학교", "대전과학고", "대구과학고", "광주과학고", "세종과학예술영재학교", "인천과학예술영재학교",
              "한성과학고", "세종과학고", "인천과학고", "인천진산과학고", "경기북과학고", "강원과학고", "충북과학고", "충남과학고", "대전동신과학고",
              "대구일과학고", "경북과학고", "부산과학고", "부산일과학고", "울산과학고", "경남과학고", "창원과학고", "전남과학고", "제주과학고"]
NATIONAL_AUTO = ["민족사관고", "상산고", "하나고", "현대청운고", "북일고", "김천고", "광양제철고", "포항제철고", "인천하늘고", "용인한국외국어대학교부설고"]
VOC_WORDS = ["공업", "상업", "정보", "마이스터", "기계", "전자", "디자인", "관광", "조리", "생명과학", "농업", "해양", "비즈니스", "경영", "미디어", "항공",
             "자동차", "반도체", "소프트웨어", "바이오", "산업", "기술", "테크", "농생명", "생활과학", "의료과학", "보건", "국방", "전산", "인터넷", "IT",
             "인공지능", "로봇", "게임", "영상", "애니메이션", "만화", "세무", "회계", "금융", "간호", "미용", "패션", "외식", "호텔", "물류", "건설", "디지털", "방송", "뷰티", "웹툰"]
def short(name):
    return name.replace("고등학교", "고").replace("중학교", "중").replace("초등학교", "초")
def kind(r):
    n, lv = r["학교명"], r["학교급구분"]
    s = short(n)
    if lv == "중학교":
        # Arts and sports middle schools screen by audition, so they never stand in for a lottery school.
        return "intl" if "국제중" in s else "artsMid" if ("예술중" in s or "체육중" in s) else "gen"
    if lv != "고등학교":
        return "gen"
    if s in GIFTED_SCI:
        return "sci"
    if any(s == a or s.startswith(a) for a in NATIONAL_AUTO):
        return "auto"
    if "외국어고" in s or "국제고" in s:
        return "lang"
    if ("예술고" in s or "체육고" in s) and "영재" not in s:
        return "arts"
    if any(w in s for w in VOC_WORDS):
        return "voc"
    return "gen"

LV = {"초등학교": "e", "중학교": "m", "고등학교": "h"}
FND = {"공립": "pub", "국립": "pub", "사립": "priv"}

def main(csv_path, prov_path, muni_path):
    rows = list(csv.DictReader(open(csv_path, encoding="utf-8-sig")))
    provs = json.load(open(prov_path))
    munis_geo = json.load(open(muni_path))
    munis = {f["properties"]["code"]: (f["properties"]["name"], f) for f in munis_geo["features"]}

    def addr(r):
        return (r["소재지도로명주소"] or r["소재지지번주소"]).split()
    def entry(r):
        return [r["학교명"], LV[r["학교급구분"]], FND.get(r["설립형태"], "pub"), kind(r), round(float(r["위도"]), 4), round(float(r["경도"]), 4)]

    areas = {}
    for rid, (prov, names) in AREAS.items():
        sch = []
        for r in rows:
            a = addr(r)
            if not a or a[0] != prov:
                continue
            if names is not None and (len(a) < 2 or a[1] not in names):
                continue
            if r["본교분교구분"] == "분교":
                continue  # branch campuses are tiny satellites of a main school
            sch.append(entry(r))
        sch.sort(key=lambda e: (e[1], e[0]))
        codes = geo_codes(rid, munis)
        lat = sum(e[4] for e in sch) / len(sch); lon = sum(e[5] for e in sch) / len(sch)
        areas[rid] = {"munis": codes, "center": [round(lat, 4), round(lon, 4)], "schools": sch}

    special = {}
    for r in rows:
        if r["본교분교구분"] == "분교":
            continue
        k = kind(r)
        if k in ("sci", "auto", "lang", "arts", "voc", "intl"):
            a = addr(r)
            special.setdefault(k, []).append([r["학교명"], FND.get(r["설립형태"], "pub"), round(float(r["위도"]), 4), round(float(r["경도"]), 4), a[0], a[1] if len(a) > 1 else ""])
    for k in special:
        special[k].sort()

    geo = {
        "provinces": [path(f["geometry"], 0.7, 3) for f in provs["features"]],
        "munis": {c: path(f["geometry"], 0.35, 0.4) for c, (n, f) in munis.items()},
    }
    data = {"source": {"schools": csv_path.split("/")[-1], "boundaries": "KOSTAT 2018 via github.com/southkorea/southkorea-maps"}, "geo": geo, "areas": areas, "special": special}
    js = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    sys.stdout.write("// Generated by suneung/tools/build_places.py from the national school list (data.go.kr) and KOSTAT\n"
                     "// boundaries. Don't edit by hand: rebuild it. See suneung/README.md (Real places and schools).\n"
                     "(function (root) {\n  \"use strict\";\n  const PLACES = " + js + ";\n"
                     "  if (typeof module !== \"undefined\" && module.exports) module.exports = PLACES;\n"
                     "  else root.SuneungPlaces = PLACES;\n})(typeof window !== \"undefined\" ? window : globalThis);\n")

if __name__ == "__main__":
    main(*sys.argv[1:4])
