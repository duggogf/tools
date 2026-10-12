# Setup Test Plan: three assets, find the converting setup

Written 12 October 2026. Companion to [`meta-marketing-research.md`](meta-marketing-research.md).

Constraint: the only materials are a 60-second trailer, a 20-second teaser and one cover image. No new footage. So the strategy is not to find the best creative but to find the best performing **setup** (destination, placement, audience, message, format, objective) that leads to wishlists and, at launch, sales. One variable per test, winner locked before the next.

## Materials to ad units

| Asset | Derived units | Used for |
|---|---|---|
| 60 s trailer | 16:9 original; 30 s cut in 9:16 (crop or blur via `../../video-editing/`); 15 s "best moment" cut in 9:16 | Feed and in-stream video; Reels and Stories; the hook test |
| 20 s teaser | 9:16 captioned version; 4:5 feed version | Reels, Stories, feed video |
| Cover image | 1:1 and 4:5 statics with one line of copy; landing-page hero; end card on every video | Static ads, retargeting, cheapest CPM control |

## Test schedule

| Phase | Dates | Variable tested | Cells | Held constant | Budget | Decide by |
|---|---|---|---|---|---|---|
| 0. Setup | 12 to 13 Oct | none | Accounts, Pixel and Conversions API, landing page with "Wishlist" and "Play demo" buttons, UTM scheme, Steamworks baseline | | $0 | 13 Oct |
| 1. Destination | 13 to 15 Oct | Where the click lands | A: Steam page direct. B: landing page, then Steam | Traffic objective, broad audience, all placements, 20 s teaser 9:16 + 30 s trailer cut | $10 to $15 per cell per day | 15 Oct |
| 2. Placement | 16 to 18 Oct | Where the ad shows | A: Reels and Stories only. B: Advantage+ placements (all) | Winning destination, same two videos | $10 to $15 per cell per day | 18 Oct |
| 3. Audience | 19 to 22 Oct (fest) | Who sees it | A: Broad. B: ARPG and roguelike interests (Diablo, Path of Exile, Hades, Risk of Rain). C: Retargeting of engagers and page visitors | Winning destination and placement, "free demo in Steam Next Fest" copy | $15 to $20 per cell per day | 22 Oct |
| 4. Message | 23 to 26 Oct (fest) | Headline and CTA | A: "Play the free demo". B: "Wishlist on Steam". C: hook headline describing the game, no name | Winning audience; keep retargeting running regardless | $15 to $20 per cell per day | 26 Oct |
| 5. Format | 27 Oct to 2 Nov | Video vs static | A: winning video. B: cover image static | Retargeting audience only, maintenance budget | $5 to $10 per cell per day | 2 Nov |
| 6. Objective | Launch minus 2 weeks | What Meta optimises for | A: Traffic (landing page views). B: Sales, optimising to the landing-page wishlist-click event | Only if the event fired 50+ times a week in tests 1 to 5; otherwise skip and keep Traffic | $15 per cell per day | Launch minus 1 week |
| 7. Launch | Launch week | Discount framing | A: "20% off launch week". B: "Out now" with price | Full winning setup, retargeting pool first, then broad | Peak budget, scaled 20% a day | End of launch week |
| 8. Taper | Launch plus 1 week | none | Keep only the ad with cost per sale below net price | | Down to $0 | |

## Fixed settings, never tested

| Setting | Value | Why |
|---|---|---|
| Campaign structure | One campaign, ad-set budgets (ABO), 2 to 3 ad sets live at a time | Small budgets need control, not CBO |
| Devices | Mobile included, never desktop-only | Mobile drove 96 percent of tracked wishlists in the one hard case study |
| Geography | US, UK, Canada, Australia, Germany | Tier-1 wishlists convert to full-price sales |
| Creative enhancements | Advantage+ creative off during tests | Keeps cells comparable |
| Tracking | Steam UTM on every link, `utm_campaign` named per test cell | Only way to read wishlists per cell |
| Frequency | Swap the 30 s cut for the 15 s cut when frequency passes about 3 | Reels placements fatigue fast |

## How a cell wins

| Metric | Role | Read it from |
|---|---|---|
| Wishlists per dollar | Primary. Target under $2, kill above $3 | Steamworks wishlist graph against daily spend, per UTM campaign |
| Steam UTM conversions | Floor, undercounts badly | Steamworks UTM Analytics, 4-day lag |
| Landing-page wishlist clicks | Secondary, drives retargeting and test 6 | Pixel custom event |
| Cost per outbound click, 3-second hold rate | Leading indicator only, decide on day 2 | Ads Manager |

## Caveats

- At $10 to $15 per cell, three days gives a directional read, not a statistically clean one. Treat any cell that is not at least 30 percent better as a tie and keep the simpler setup.
- Tests 1 and 2 overlap with pre-fest week. If setup slips past 13 October, drop test 2 and go into the fest with Advantage+ placements by default.
- Organic posting runs alongside all of this and is not part of the test matrix: post the teaser, the 15 s cut and the cover image as Reels and feed posts, and boost whichever organic post gets the most sends.
