# ⚓ Harbor Manga Extensions Live Health Report

*Generated on: **2026-09-06T16:21:42.687Z** across **70** sources.*

## 📊 Summary Breakdown

| Status | Count | Description |
| :--- | :--- | :--- |
| 🟢 **OPERATIONAL** | **18** (25.7%) | 100% functional out-of-the-box in Harbor. |
| 🔒 **CLOUDFLARE BLOCKED** | **19** (27.1%) | Protected by active Cloudflare Turnstile / Managed Challenge. |
| 🟡 **PARTIAL** | **9** (12.9%) | Browse/Search works; chapter/reader layout changed. |
| 🔴 **OFFLINE / BLOCKED** | **24** (34.3%) | Domain down, DNS changed, or blocked. |

---

## 🛡 Cloudflare Protection Insights

> **Does Harbor bypass Cloudflare?**
> - **Passive WAF / Rate Limiting (Green)**: **YES**. Harbor passes standard browser User-Agents and requests succeed.
> - **Active Turnstile / Managed Challenge (Yellow/Orange Lock)**: **NO**. Harbor's isolated Web Worker does not execute Cloudflare's interactive JavaScript or store clearance cookies.

## 📋 Detailed Results Table

| Source Name | ID | Health Status | Harbor Endpoints Passed | Cloudflare Protected | Total Latency | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AllManga** | `allmanga` | 🔒 CF Blocked | **5/7** | 🔒 Challenge | 2472ms | Requires interactive Cloudflare Turnstile clearance |
| **DragonTea** | `dragontea` | 🔒 CF Blocked | **1/7** | 🔒 Challenge | 5228ms | Requires interactive Cloudflare Turnstile clearance |
| **Atsumaru** | `atsumaru` | 🟢 Operational | **7/7** | 🛡️ Passive | 5248ms | Behind Cloudflare WAF, passes seamlessly |
| **HiveToons** | `hivetoons` | 🟢 Operational | **7/7** | 🛡️ Passive | 7299ms | Behind Cloudflare WAF, passes seamlessly |
| **FlameComics** | `flamecomics` | 🟢 Operational | **7/7** | 🛡️ Passive | 20971ms | Behind Cloudflare WAF, passes seamlessly |
| **Drake Scans** | `drakescans` | 🔴 Offline | **1/7** | 🛡️ Passive | 32601ms | Host unresponsive or changed domain |
| **Comix** | `comix` | 🔴 Offline | **0/7** | 🛡️ Passive | 2762ms | Host unresponsive or changed domain |
| **KunManga** | `kunmanga` | 🔴 Offline | **1/7** | 🛡️ Passive | 3592ms | Host unresponsive or changed domain |
| **WeebCentral** | `weebcentral` | 🟢 Operational | **7/7** | 🛡️ Passive | 4672ms | Behind Cloudflare WAF, passes seamlessly |
| **ToonGod** | `toongod` | 🔒 CF Blocked | **1/7** | 🔒 Challenge | 4775ms | Requires interactive Cloudflare Turnstile clearance |
| **MangaKakalot** | `mangakakalot` | 🔒 CF Blocked | **1/7** | 🔒 Challenge | 5630ms | Requires interactive Cloudflare Turnstile clearance |
| **MangaDex** | `mangadex` | 🟢 Operational | **7/7** | None | 6652ms | Direct connection |
| **Toonily** | `toonily` | 🔴 Offline | **1/7** | None | 134ms | fetch failed |
| **WebtoonXYZ** | `webtoonxyz` | 🔴 Offline | **1/7** | None | 94ms | fetch failed |
| **Webtoon** | `webtoon` | 🟢 Operational | **5/7** | None | 3321ms | Direct connection |
| **AniList** | `anilist` | 🔴 Offline | **1/7** | None | 33ms | Host unresponsive or changed domain |
| **AllPornComic** | `allporncomic` | 🔴 Offline | **1/7** | None | 112ms | fetch failed |
| **ArthurScan** | `arthurscan` | 🔒 CF Blocked | **1/7** | 🔒 Challenge | 12584ms | Requires interactive Cloudflare Turnstile clearance |
| **Example Manga Source** | `example-manga` | 🔴 Offline | **0/7** | None | 280ms | fetch failed |
| **CoffeeManga** | `coffeemanga` | 🔴 Offline | **1/7** | 🛡️ Passive | 3640ms | Host unresponsive or changed domain |
| **GourmetScans** | `gourmetscans` | 🔒 CF Blocked | **1/7** | 🔒 Challenge | 8998ms | Requires interactive Cloudflare Turnstile clearance |
| **Hentai20** | `hentai20` | 🔴 Offline | **1/7** | None | 126ms | fetch failed |
| **HiperDex** | `hiperdex` | 🔴 Offline | **1/7** | None | 107ms | fetch failed |
| **LekManga** | `lekmanga` | 🔒 CF Blocked | **1/7** | 🔒 Challenge | 3268ms | Requires interactive Cloudflare Turnstile clearance |
| **LilyManga** | `lilymanga` | 🔴 Offline | **0/7** | 🛡️ Passive | 12523ms | Host unresponsive or changed domain |
| **LelManga** | `lelmanga` | 🟢 Operational | **7/7** | 🛡️ Passive | 14805ms | Behind Cloudflare WAF, passes seamlessly |
| **LHTranslation** | `lhtranslation` | 🟡 Partial | **4/7** | 🛡️ Passive | 21446ms | Browse/Search operational; chapter/page parsing layout update needed |
| **MadaraDex** | `madaradex` | 🔴 Offline | **1/7** | None | 223ms | fetch failed |
| **LNori** | `lnori` | 🟡 Partial | **3/7** | 🛡️ Passive | 3092ms | Browse/Search operational; chapter/page parsing layout update needed |
| **Manga3asq** | `manga3asq` | 🟡 Partial | **4/7** | 🛡️ Passive | 23565ms | Browse/Search operational; chapter/page parsing layout update needed |
| **MangaBat** | `mangabat` | 🔒 CF Blocked | **5/7** | 🔒 Challenge | 4501ms | Requires interactive Cloudflare Turnstile clearance |
| **MangaDemon** | `mangademon` | 🟢 Operational | **7/7** | 🛡️ Passive | 13698ms | Behind Cloudflare WAF, passes seamlessly |
| **MangaDistrict** | `mangadistrict` | 🟢 Operational | **5/7** | 🛡️ Passive | 19154ms | Behind Cloudflare WAF, passes seamlessly |
| **MangaFire** | `mangafire` | 🔴 Offline | **0/7** | 🛡️ Passive | 1673ms | Host unresponsive or changed domain |
| **MangaDot** | `mangadot` | 🟢 Operational | **5/7** | 🛡️ Passive | 3345ms | Behind Cloudflare WAF, passes seamlessly |
| **MangaFox** | `mangafox` | 🟢 Operational | **6/7** | 🛡️ Passive | 13327ms | Behind Cloudflare WAF, passes seamlessly |
| **MangaKoma** | `mangakoma` | 🔴 Offline | **1/7** | 🛡️ Passive | 5213ms | Host unresponsive or changed domain |
| **Mangago** | `mangago` | 🟢 Operational | **5/7** | 🛡️ Passive | 7641ms | Behind Cloudflare WAF, passes seamlessly |
| **MangaKatana** | `mangakatana` | 🟢 Operational | **7/7** | None | 7703ms | Direct connection |
| **MangaNelo** | `manganelo` | 🔒 CF Blocked | **1/7** | 🔒 Challenge | 1382ms | Requires interactive Cloudflare Turnstile clearance |
| **MangaNato** | `manganato` | 🔒 CF Blocked | **5/7** | 🔒 Challenge | 6546ms | Requires interactive Cloudflare Turnstile clearance |
| **MangaOrigines** | `mangaorigines` | 🔒 CF Blocked | **1/7** | 🔒 Challenge | 6650ms | Requires interactive Cloudflare Turnstile clearance |
| **MangaPlus** | `mangaplus` | 🔴 Offline | **0/7** | None | 2804ms | Host unresponsive or changed domain |
| **Mangapill** | `mangapill` | 🟢 Operational | **6/7** | 🛡️ Passive | 4061ms | Behind Cloudflare WAF, passes seamlessly |
| **MangaReadOrg** | `mangareadorg` | 🟡 Partial | **4/7** | 🛡️ Passive | 9689ms | Browse/Search operational; chapter/page parsing layout update needed |
| **MangaUpdates** | `mangaupdates` | 🔴 Offline | **1/7** | None | 6ms | Host unresponsive or changed domain |
| **MangaTaro** | `mangataro` | 🟡 Partial | **4/7** | 🛡️ Passive | 1563ms | Browse/Search operational; chapter/page parsing layout update needed |
| **MangaScantrad** | `mangascantrad` | 🔒 CF Blocked | **1/7** | 🔒 Challenge | 6165ms | Requires interactive Cloudflare Turnstile clearance |
| **MangaWorldAdult** | `mangaworldadult` | 🔴 Offline | **0/7** | None | 283ms | fetch failed |
| **MangaWorld** | `mangaworld` | 🟡 Partial | **4/7** | 🛡️ Passive | 5440ms | Browse/Search operational; chapter/page parsing layout update needed |
| **MangaZin** | `mangazin` | 🟢 Operational | **5/7** | 🛡️ Passive | 11212ms | Behind Cloudflare WAF, passes seamlessly |
| **ManhwaClub** | `manhwaclub` | 🔴 Offline | **1/7** | None | 217ms | fetch failed |
| **Manhuaus** | `manhuaus` | 🔒 CF Blocked | **1/7** | 🔒 Challenge | 2819ms | Requires interactive Cloudflare Turnstile clearance |
| **ManhuaPlus** | `manhuaplus` | 🔴 Offline | **1/7** | 🛡️ Passive | 5290ms | Host unresponsive or changed domain |
| **ManhwaRaw** | `manhwaraw` | 🔴 Offline | **1/7** | None | 169ms | fetch failed |
| **ManhwaX** | `manhwax` | 🔴 Offline | **1/7** | None | 122ms | fetch failed |
| **ManhwaTop** | `manhwatop` | 🔒 CF Blocked | **1/7** | 🔒 Challenge | 1172ms | Requires interactive Cloudflare Turnstile clearance |
| **QiScans** | `qiscans` | 🔒 CF Blocked | **0/7** | 🔒 Challenge | 3669ms | Requires interactive Cloudflare Turnstile clearance |
| **Mgeko** | `mgeko` | 🟡 Partial | **4/7** | 🛡️ Passive | 15603ms | Browse/Search operational; chapter/page parsing layout update needed |
| **PunkRecords** | `punkrecords` | 🟢 Operational | **7/7** | 🛡️ Passive | 15914ms | Behind Cloudflare WAF, passes seamlessly |
| **Roliascan** | `roliascan` | 🟡 Partial | **4/7** | 🛡️ Passive | 2672ms | Browse/Search operational; chapter/page parsing layout update needed |
| **Rage Scans** | `ragescans` | 🔒 CF Blocked | **1/7** | 🔒 Challenge | 5103ms | Requires interactive Cloudflare Turnstile clearance |
| **Raw1001** | `raw1001` | 🔴 Offline | **1/7** | 🛡️ Passive | 6884ms | Host unresponsive or changed domain |
| **SetsuScans** | `setsuscans` | 🔒 CF Blocked | **1/7** | 🔒 Challenge | 4440ms | Requires interactive Cloudflare Turnstile clearance |
| **RoyalRoad** | `royalroad` | 🟢 Operational | **5/7** | 🛡️ Passive | 4765ms | Behind Cloudflare WAF, passes seamlessly |
| **SamuraiScan** | `samuraiscan` | 🟡 Partial | **4/7** | 🛡️ Passive | 17685ms | Browse/Search operational; chapter/page parsing layout update needed |
| **SushiScans** | `sushiscans` | 🔒 CF Blocked | **1/7** | 🔒 Challenge | 767ms | Requires interactive Cloudflare Turnstile clearance |
| **UToon** | `utoon` | 🔴 Offline | **1/7** | None | 3454ms | Host unresponsive or changed domain |
| **Thunderscans** | `thunderscans` | 🟢 Operational | **7/7** | 🛡️ Passive | 8716ms | Behind Cloudflare WAF, passes seamlessly |
| **YaoiScan** | `yaoiscan` | 🔒 CF Blocked | **1/7** | 🔒 Challenge | 3969ms | Requires interactive Cloudflare Turnstile clearance |
