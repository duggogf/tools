# meta-marketing

Research and working notes for marketing Rogue's Odyssey on Meta platforms (Instagram and Facebook).

Rogue's Odyssey is a 2.5D class-based co-op roguelike RPG for PC, sold on Steam, with a public demo. That makes the goal of Meta marketing **Steam wishlists and demo downloads**, not app installs, and most of the generic "Meta ads for games" advice (which assumes a mobile game) does not apply. The research doc explains what does.

## Docs

- [`docs/meta-marketing-research.md`](docs/meta-marketing-research.md): full research report. Covers Instagram ranking signals and content pillars, paid Facebook/Instagram ads for a Steam game, creative rules for the first second, the Steam attribution problem and how to measure anyway, creator Partnership Ads, a timeline anchored on the February 2027 Steam Next Fest, and the skills to build.

## The plan in one screen

**Organic**

- 3 to 4 Reels a week, cross-posted from the same vertical clips used on TikTok and Shorts.
- Four pillars: gameplay moments (bosses, Death Knight hunts, co-op wipes), build showcases (cross-class skills, the Cat), process and craft, bugs and fails.
- Design for sends per reach. A clip wins when someone forwards it to a friend.
- Captions carry the search words ("co-op roguelike", "boss fight", "pixel art RPG"); 3 to 5 hashtags only.
- Use Trial Reels to test hooks and the Edits app to read skip rate.
- Skip Facebook groups. Keep the Facebook Page because ads need one.

**Paid**

- Fix the Steam page first: visit-to-wishlist rate at or above about 8 percent before spending.
- Traffic objective, broad targeting, mobile placements included, Steam UTM link on every ad.
- Start at $5 to $10 a day, one broad ad set, 8 to 15 ad variants, refresh every 1 to 2 weeks.
- Target cost per wishlist under $2, measured as wishlist velocity against spend. Stop and fix creative above $3.
- Spend in three windows only: pre-fest wishlist building, Next Fest week, launch week with a 20 percent or deeper discount.

**Creative**

- Frame one is gameplay. No logo, no title card, no fade in.
- Genre clear in 3 seconds, the twist in 10, end card with "Wishlist on Steam" inside the safe zone.
- 1080 x 1920, captions burned in above the bottom 350 px. Use `../video-editing/` to convert 16:9 captures.

**Measurement**

- Steam UTM Analytics for the floor, a landing page with Pixel and Conversions API for retargeting, wishlist velocity for the real answer.

## Setup checklist

Nothing below exists yet as far as public search can tell.

- [ ] Instagram account in Creator or Business mode, Facebook Page, both linked in Meta Business Suite
- [ ] Meta Pixel and Conversions API on roguesodyssey.com with a "Wishlist on Steam" button that fires a custom event
- [ ] UTM naming scheme (`utm_source=instagram|facebook`, `utm_medium=organic|paid`, `utm_campaign=<month>-<angle>`), tested in Steamworks under Marketing & Visibility, UTM Analytics
- [ ] Baseline numbers from Steamworks: wishlists, visits, visit-to-wishlist rate
- [ ] Register for Steam Next Fest February 2027 before 10 January 2027
- [ ] A clip library: 20 or more raw gameplay captures at 1080p60 covering each class, each boss, co-op, and at least five bugs

## Key dates

| Date | What |
|---|---|
| 10 January 2027 | Next Fest registration deadline |
| 8 February 2027 | All Next Fest items due |
| 11 February 2027 | Press preview begins |
| 22 February to 1 March 2027 | Steam Next Fest |

## Conventions

This folder follows the repo conventions: reference material in `docs/`. There is no runnable code yet. If scripts are added later (for example a UTM link builder or a Reels export checker) they go in `scripts/`.
