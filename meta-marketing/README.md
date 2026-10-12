# meta-marketing

Research and working notes for marketing Rogue's Odyssey on Meta platforms (Instagram and Facebook).

Rogue's Odyssey is a 2.5D roguelike ARPG (co-op) for PC, sold on Steam, in the October 2026 Steam Next Fest (19 to 26 October) and releasing in November 2026. That makes the goal of Meta marketing **Steam wishlists and demo downloads before launch, then sales in launch week**, not app installs, and most of the generic "Meta ads for games" advice (which assumes a mobile game) does not apply. The research doc explains what does.

## Docs

- [`docs/setup-test-plan.md`](docs/setup-test-plan.md): the working plan. Three fixed assets (60 s trailer, 20 s teaser, cover image), one setup variable tested at a time from now through launch week, with budgets, dates and decision metrics.
- [`docs/meta-marketing-research.md`](docs/meta-marketing-research.md): full research report. Covers Instagram ranking signals and content pillars, paid Facebook/Instagram ads for a Steam game, creative rules for the first second, the Steam attribution problem and how to measure anyway, creator Partnership Ads, a timeline running from the October 2026 Next Fest into the November launch, and the skills to build.

## The plan in one screen

**Organic**

- 3 to 4 Reels a week, cross-posted from the same vertical clips used on TikTok and Shorts.
- Four pillars: gameplay moments (bosses, Death Knight hunts, co-op wipes), builds and loot (skill combinations, item drops, damage numbers, the Cat), process and craft, bugs and fails.
- Design for sends per reach. A clip wins when someone forwards it to a friend.
- Captions carry the search words ("roguelike ARPG", "co-op", "boss fight", "pixel art"); 3 to 5 hashtags only.
- Use Trial Reels to test hooks and the Edits app to read skip rate.
- Skip Facebook groups. Keep the Facebook Page because ads need one.

**Paid**

- Fix the Steam page first: visit-to-wishlist rate at or above about 8 percent before spending.
- Traffic objective, broad targeting, mobile placements included, Steam UTM link on every ad.
- Start now at $10 to $20 a day, one broad ad set, 6 to 8 ad variants, cut losers before 19 October so only winners run during the fest.
- Target cost per wishlist under $2, measured as wishlist velocity against spend. Stop and fix creative above $3.
- Spend in two windows: Next Fest week with a "free demo" message, and launch week with a 20 percent or deeper discount to re-notify wishlisters. Maintenance budget between them, taper within a week after launch.

**Creative**

- Frame one is gameplay. No logo, no title card, no fade in.
- Genre clear in 3 seconds, the twist in 10, end card with "Wishlist on Steam" inside the safe zone.
- 1080 x 1920, captions burned in above the bottom 350 px. Use `../video-editing/` to convert 16:9 captures.

**Measurement**

- Steam UTM Analytics for the floor, a landing page with Pixel and Conversions API for retargeting, wishlist velocity for the real answer.

## Setup checklist

Nothing below exists yet as far as public search can tell.

- [ ] Steam, itch.io and website copy updated to "2.5D roguelike ARPG" so ads and store page say the same thing
- [ ] Instagram account in Creator or Business mode, Facebook Page, both linked in Meta Business Suite
- [ ] Meta Pixel and Conversions API on roguesodyssey.com with a "Wishlist on Steam" button that fires a custom event
- [ ] UTM naming scheme (`utm_source=instagram|facebook`, `utm_medium=organic|paid`, `utm_campaign=<month>-<angle>`), tested in Steamworks under Marketing & Visibility, UTM Analytics
- [ ] Baseline numbers from Steamworks: wishlists, visits, visit-to-wishlist rate
- [ ] A clip library: 20 or more raw gameplay captures at 1080p60 covering each class, each boss, co-op, and at least five bugs, with 8 to 10 Reels pre-cut for fest week
- [ ] Steam broadcast slots set up for fest week, and the "Email Wishlisters" message drafted for 19 October
- [ ] 20 to 50 micro-creators messaged with the demo link before the fest

## Key dates

| When | What |
|---|---|
| 12 to 18 October 2026 | Accounts, Pixel, UTM scheme, page copy fixed, clips pre-cut, ads testing, creators messaged |
| 19 to 26 October 2026 | Steam Next Fest: daily Reels, peak ad spend on the demo, livestreams clipped |
| 27 October to 2 November | Fest results pulled, paid dropped to maintenance, release date posted |
| Launch minus 2 weeks | Full-game creator keys out, launch trailer cut |
| Launch minus 1 week | Scale ad back up, schedule launch posts, confirm discount |
| November 2026 | Launch week: retargeting push with the discount |
| Launch plus 1 week | Taper paid, report results |

## Conventions

This folder follows the repo conventions: reference material in `docs/`. There is no runnable code yet. If scripts are added later (for example a UTM link builder or a Reels export checker) they go in `scripts/`.
