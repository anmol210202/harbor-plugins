# ⚓ Harbor Manga Extensions Live Health Report

*Generated on: **2026-09-06T12:13:43.183Z** across **15** sources.*

## 📊 Summary Breakdown

| Status | Count | Description |
| :--- | :--- | :--- |
| 🟢 **OPERATIONAL** | **6** (40.0%) | 100% functional out-of-the-box in Harbor. |
| 🔒 **CLOUDFLARE BLOCKED** | **4** (26.7%) | Protected by active Cloudflare Turnstile / Managed Challenge. |
| 🟡 **PARTIAL** | **0** (0.0%) | Browse/Search works; chapter/reader layout changed. |
| 🔴 **OFFLINE / BLOCKED** | **5** (33.3%) | Domain down, DNS changed, or blocked. |

---

## 🛡 Cloudflare Protection Insights

> **Does Harbor bypass Cloudflare?**
> - **Passive WAF / Rate Limiting (Green)**: **YES**. Harbor passes standard browser User-Agents and requests succeed.
> - **Active Turnstile / Managed Challenge (Yellow/Orange Lock)**: **NO**. Harbor's isolated Web Worker does not execute Cloudflare's interactive JavaScript or store clearance cookies.

## 📋 Detailed Results Table

| Source Name | ID | Health Status | Harbor Endpoints Passed | Cloudflare Protected | Total Latency | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AllManga** | `allmanga` | 🔒 CF Blocked | **5/7** | 🔒 Challenge | 2257ms | Requires interactive Cloudflare Turnstile clearance |
| **DragonTea** | `dragontea` | 🔒 CF Blocked | **1/7** | 🔒 Challenge | 2304ms | Requires interactive Cloudflare Turnstile clearance |
| **Atsumaru** | `atsumaru` | 🟢 Operational | **7/7** | 🛡️ Passive | 6050ms | Behind Cloudflare WAF, passes seamlessly |
| **HiveToons** | `hivetoons` | 🟢 Operational | **7/7** | 🛡️ Passive | 5750ms | Behind Cloudflare WAF, passes seamlessly |
| **Drake Scans** | `drakescans` | 🔴 Offline | **1/7** | 🛡️ Passive | 6469ms | Host unresponsive or changed domain |
| **FlameComics** | `flamecomics` | 🟢 Operational | **7/7** | 🛡️ Passive | 9811ms | Behind Cloudflare WAF, passes seamlessly |
| **Comix** | `comix` | 🔴 Offline | **0/7** | 🛡️ Passive | 2357ms | Host unresponsive or changed domain |
| **WeebCentral** | `weebcentral` | 🟢 Operational | **7/7** | 🛡️ Passive | 2922ms | Behind Cloudflare WAF, passes seamlessly |
| **KunManga** | `kunmanga` | 🔴 Offline | **1/7** | 🛡️ Passive | 5329ms | Host unresponsive or changed domain |
| **MangaKakalot** | `mangakakalot` | 🔒 CF Blocked | **1/7** | 🔒 Challenge | 3496ms | Requires interactive Cloudflare Turnstile clearance |
| **ToonGod** | `toongod` | 🔒 CF Blocked | **1/7** | 🔒 Challenge | 5624ms | Requires interactive Cloudflare Turnstile clearance |
| **MangaDex** | `mangadex` | 🟢 Operational | **7/7** | None | 6109ms | Direct connection |
| **Toonily** | `toonily` | 🔴 Offline | **1/7** | None | 213ms | fetch failed |
| **WebtoonXYZ** | `webtoonxyz` | 🔴 Offline | **1/7** | None | 166ms | fetch failed |
| **Webtoon** | `webtoon` | 🟢 Operational | **5/7** | None | 3314ms | Direct connection |
