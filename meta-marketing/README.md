# meta-marketing

Research and working notes for marketing Rogue's Odyssey on Meta platforms (Instagram and Facebook).

Rogue's Odyssey is a 2.5D roguelike ARPG (co-op) for PC, sold on Steam, with a public demo and a release set for November 2026. That makes the goal of Meta marketing **Steam wishlists and demo downloads before launch, then sales in launch week**, not app installs, and most of the generic "Meta ads for games" advice (which assumes a mobile game) does not apply. The research doc explains what does.

## Docs

- [`docs/meta-marketing-research.md`](docs/meta-marketing-research.md): full research report. Covers Instagram ranking signals and content pillars, paid Facebook/Instagram ads for a Steam game, creative rules for the first second, the Steam attribution problem and how to measure anyway, creator Partnership Ads, a timeline anchored on the November 2026 launch, and the skills to build.

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
- Start at $10 to $20 a day, one broad ad set, 6 to 8 ad variants, cut losers after 3 to 4 days. There is no time for a slow ramp.
- Target cost per wishlist under $2, measured as wishlist velocity against spend. Stop and fix creative above $3.
- Spend in two windows: the pre-launch wishlist sprint, and launch week with a 20 percent or deeper discount to re-notify wishlisters. Taper within a week after launch.

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
- [ ] A clip library: 20 or more raw gameplay captures at 1080p60 covering each class, each boss, co-op, and at least five bugs

## Key dates

| When | What |
|---|---|
| Week of 12 October 2026 | Accounts, Pixel, UTM scheme, page copy fixed, clip library captured |
| Launch minus 3 to 2 weeks | Creator keys out, launch trailer cut |
| Launch minus 1 week | Scale winning ad, schedule launch posts, confirm discount |
| November 2026 | Launch week: retargeting push with the discount |
| Launch plus 1 week | Taper paid, report results |

Steam Next Fest is not an option: the October 2026 fest closed registration on 31 August and the February 2027 fest is for unreleased games.

## Conventions

This folder follows the repo conventions: reference material in `docs/`. There is no runnable code yet. If scripts are added later (for example a UTM link builder or a Reels export checker) they go in `scripts/`.
