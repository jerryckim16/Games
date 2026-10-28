# data/

Reference data for the games. `korea-stats.md` collects statistics about Korean life from government and other verifiable public sources, so that features and weights in the Suneung Simulator (and later Korea-based games) can be checked against reality.

## Format

- One `##` section per topic, each starting with `Retrieved: YYYY-MM-DD`.
- One table per section with these columns: `Statistic | Value | Year | Unit/definition | Source organization | URL | Notes`.
- Notes start with a status tag:
  - **official**: read on a government or public-agency page. Say "(excerpt)" if only part of the page was read, and name the attachment if the number came from one.
  - **unverified**: seen only in news or a secondary site citing an official release. Replace it with the primary figure when you find it.
  - **calc**: computed by us from official figures. Show the formula.
- The **Game mapping** table at the end lists the game's constants next to the closest real figure, with a verdict: matches / off by X / no data. Update it when a constant or a figure changes.
- **Gaps** lists what still needs a source.

## Adding data

1. Prefer primary sources: Statistics Korea / 국가데이터처 (kostat.go.kr, mods.go.kr, kosis.kr), Ministry of Education, KICE, KEDI, Ministry of Health and Welfare, Ministry of Gender Equality and Family, KDCA, MOLIT, KoROAD, National Cancer Center, the Bank of Korea, and OECD / UNESCO / World Bank for comparisons. Use news only to find the primary release, and mark it unverified if you can't reach the release.
2. Never estimate a number and present it as sourced. Write the year the number describes, not the year it was published, and keep the unit exact (per household or per student, annual or monthly).
3. Add the row to the right section, update the section's `Retrieved:` date, and update **Game mapping** if it bears on a game constant.
4. When you change a game weight because of a figure here, mention the row in the commit message.
