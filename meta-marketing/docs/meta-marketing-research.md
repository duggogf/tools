# Marketing Rogue's Odyssey on Meta Platforms (Instagram and Facebook)

Research report, 10 October 2026.

**How this was produced.** Web search ran across roughly thirty queries in three rounds: the game itself, Meta ads for Steam games, Instagram organic growth, creative best practice, Steam attribution, Steam Next Fest timing, creator partnerships, and the skills the work needs. Direct page fetches are blocked in this cloud environment (the Steam page, the itch.io page and roguesodyssey.com could not be opened), so every claim rests on search-engine summaries of the linked pages rather than full-text reads. Most sources are marketing vendor blogs and developer postmortems, not Meta or Valve documentation. Numbers are directional. Where sources disagree, the disagreement is shown.

**Scope.** Only Instagram and Facebook, as asked. TikTok, YouTube, Reddit and Discord are mentioned only where they change how the Meta work should be done.

---

## Short answer

Rogue's Odyssey is a PC game sold on Steam, so the Meta goal is **Steam wishlists and demo downloads**, not app installs. That rules out most of the mobile-game playbook that dominates "Meta ads for games" articles. What applies instead:

1. **Organic Reels are the main free lever, but Reels is the weakest short-form platform for games.** Treat Instagram as the mirror of a TikTok and Shorts pipeline: same vertical clips, posted natively, 3 to 5 Reels a week. The ranking signals that matter are watch time, sends per reach and likes per reach. Clips that get *sent to a friend* travel furthest, and for a co-op roguelike that means chaos, fails, and "look at this build" moments.
2. **Facebook ads can buy wishlists at roughly $1 to $3 each when the creative and page are good.** Developer case studies cluster there. The cost rises fast when the Steam page converts poorly, so fix the page before paying for traffic. Interest targeting for PC gamers is weak; go broad, let the creative do the targeting, and use mobile placements even though the game is PC-only.
3. **Attribution is the hard part.** The Meta Pixel cannot run on Steam, and Steam's own UTM tracking only counts conversions from logged-in users within 72 hours. Use Steam UTM links on every ad, route some traffic through a landing page you control, and judge campaigns by wishlist velocity against spend rather than by reported conversions.
4. **Creative wins or loses in the first second.** Open on recognisable gameplay, never a logo. Show the genre in 3 seconds, the hook (cross-class skill builds, brutal bosses, the Cat) in 10, and keep text and logo in the safe zone. Plan on 8 to 15 live variants and refresh them every one to two weeks.
5. **Time the push to the February 2027 Steam Next Fest.** It runs 22 February to 1 March 2027 and registration closes 10 January 2027. The game already has a demo and a store page, which are the two eligibility requirements. Build the Meta audience for three months before it, spend during it, retarget after it.
6. **The skills to build, in priority order:** short-form video editing from gameplay capture, hook writing, Ads Manager operation (campaign structure, learning phase, budget pacing), Steam UTM and landing-page analytics, and creator seeding through Partnership Ads.

---

## 1. The game, and what that means for the channel mix

Public descriptions of Rogue's Odyssey, from the Steam page, Steam community posts and itch.io devlogs:

| Fact | Source |
|---|---|
| 2.5D class-based roguelike RPG "built around brutal boss fights and deep skills customization" | [Steam](https://store.steampowered.com/app/3792120/Rogues_Odyssey/), [IGDB](https://www.igdb.com/games/rogues-odyssey--1) |
| Developer's own comparison: "like Risk of Rain 2, but 2.5D pixel medieval fantasy, with full-fledged skill customization" | [Steam Community](https://steamcommunity.com/app/3792120) |
| Classes: Warrior, Merchant, Alchemist, Cat. Skills mix across classes (a Warrior who throws Alchemist potions) | [Steam Community](https://steamcommunity.com/app/3792120) |
| "On the Hunt": a Death Knight spawns and hunts the player after 10 minutes on one map | [Steam Community](https://steamcommunity.com/app/3792120) |
| itch.io lists it as a "2.5D Co-op Action Roguelike", demo about 938 MB, in development | [itch.io](https://duggoman.itch.io/rogues-odyssey), [demo devlog](https://duggoman.itch.io/rogues-odyssey-demo/devlog/1697289/rogues-odyssey-official-demo) |
| Planned release 2026, developer and publisher Duggoman, Windows | [Steam](https://store.steampowered.com/app/3792120/Rogues_Odyssey/) |
| Community lives on Discord; a website exists at roguesodyssey.com. No Instagram, Facebook or TikTok accounts surfaced in search | [itch.io devlogs](https://duggoman.itch.io/rogues-odyssey/devlog) |

Four consequences for Meta marketing:

- **The conversion happens off-platform, on Steam.** Every tactic has to be judged on wishlists, demo installs and, at launch, sales. Meta will never see those directly (section 5).
- **The genre is crowded but growing.** Alinea Analytics estimates roguelikes earned about $400M on Steam in 2025, up 80 percent, and were approaching $500M for 2026 by May ([Icon Era](https://icon-era.com/statistics/roguelike-sales), [rec0ded88](https://rec0ded88.com/statistics/roguelike-genre/)). Supply grows faster: Steam Page Analyzer counted 1,505 Action Roguelike releases in 2026 by late September, up 57 percent on 2025 ([Steam Page Analyzer](https://www.steampageanalyzer.com/niches/action-roguelike)). GameDiscoverCo's data shows the top of the market captures most of the money ([GameDiscoverCo](https://newsletter.gamediscover.co/p/right-subgenre-wrong-result-analyzing)). Translation: generic "roguelike" content drowns. The content has to be about what is specific to this game.
- **The distinctive hooks are visual and clip-friendly.** Cross-class builds (a potion-throwing Warrior), the Cat class, the Death Knight hunting you, and co-op chaos are all things a 10-second clip can show without explanation. Hades 2 and Slay the Spire 2 both got outsized reach from creators playing together and sharing runs ([Alinea on Slay the Spire 2](https://alineaanalytics.substack.com/p/slay-the-spire-2-one-of-the-best)); R.E.P.O. went viral on clips of co-op failures ([80.lv](https://80.lv/articles/this-indie-co-op-horror-goes-viral-seeing-over-230k-concurrent-players/), [Know Your Meme](https://amp.knowyourmeme.com/memes/subcultures/repo)).
- **No Meta presence exists yet.** The accounts, the Pixel, the landing page and the UTM scheme all have to be set up before any of the below works. See the README checklist.

---

## 2. Organic Instagram: what the algorithm rewards and what to post

### 2.1 Ranking signals

Adam Mosseri's January 2025 statement, repeated across every 2026 guide, names three signals, each measured per reach rather than as a raw total: **watch time, likes per reach, and sends per reach**. Sends matter more for reaching non-followers; likes matter more for reaching existing followers ([Kompozy](https://kompozy.io/news/instagram-mosseri-ranking-signals-guidance), [Highstyle](https://www.highstyle.ai/insights/instagram-reels-algorithm-2026), [Blckalpaca](https://blckalpaca.at/en/knowledge-base/social-media/social-media-algorithms-distribution/instagram-algorithm-2026)). Specific thresholds floating around (an 80 percent completion rate, a 3-second hook rule) come from individual creator blogs, not Meta ([Postey](https://postey.ai/blog/instagram-algorithm-2026)).

For a game account with few followers, sends per reach is the one to design for. A clip is sendable when it provokes "you have to see this": a ridiculous build, a boss doing something unfair, a co-op wipe, a bug that is funnier than it should be.

**Trial Reels** show a Reel to non-followers first, surface metrics after about 24 hours, and can auto-share to followers if the clip performs within 72 hours ([Leslie M Lyon](https://lesliemlyon.com/can-trial-reels-go-viral-algorithm/)). They are the right tool for testing hooks before spending on them.

### 2.2 Honest expectations for Reels

Game-marketing sources rate Instagram Reels **lowest of the three short-form platforms for gaming reach**, with discovery "heavily follower-dependent" compared with TikTok ([Gamosy](https://gamosy.com/blog/tiktok-game-marketing), [Indie-Games.eu](https://www.indie-games.eu/instagram-reels-tiktok-and-youtube-shorts-keep-conquering-game-marketing/)). The recommended model is **"paid organic"**: post clips organically on all three platforms, then put a small budget (around $100 to $200) behind the specific Reels that show natural traction ([Gamosy](https://gamosy.com/blog/tiktok-game-marketing)). Instagram is also still image-friendly: screenshots, concept art and carousels of art evolution perform in the feed, which TikTok cannot do ([GameDev.tv](https://gamedev.tv/articles/social-media-tips-for-game-developers), [Presskit.gg](https://presskit.gg/field-guides/social-media-branding-indie-game)).

### 2.3 Content pillars

Sources converge on four pillars for an indie game account ([GameDev.tv](https://gamedev.tv/articles/social-media-tips-for-game-developers), [Wayline](https://www.wayline.io/blog/ultimate-guide-devlogs-indie-games), [Script2Shorts](https://script2shorts.app/blog/game-devlog-content-strategy), [Presskit.gg TikTok guide](https://presskit.gg/field-guides/tiktok-indie-game-marketing)). Applied to Rogue's Odyssey:

| Pillar | What it looks like for this game | Why it works |
|---|---|---|
| **Gameplay moments** | A boss phase, a Death Knight hunt at the 10-minute mark, a Cat-class run, a co-op wipe | The only pillar that sells the game to strangers. Highest send potential. |
| **Build showcases** | "Warrior, but every skill is Alchemist" in 15 seconds; before/after of a skill tree | The game's stated USP. Roguelike audiences share builds compulsively. |
| **Process and craft** | Sprite timelapses, lighting before/after, new enemy animation, new map reveal | Builds the dev-as-person narrative; "solo indie" is ready-made scaffolding ([Phantom Cave](https://phantomcave.com/blog/market-indie-game-2026/)). |
| **Bugs and fails** | Physics gone wrong, an enemy stuck in a wall, the Cat doing something unintended | One devlog guide claims funny bugs get 3 to 10 times the engagement of a polished feature clip. Unverified, but the pattern repeats across sources. |

Recurring community events (Screenshot Saturday, Wishlist Wednesday) put posts in front of audiences that already exist ([GameDev.tv](https://gamedev.tv/articles/social-media-tips-for-game-developers)).

### 2.4 Cadence, captions, hashtags

- **Cadence.** Buffer's analysis of about 2 million posts puts 3 to 5 posts a week as the sweet spot for reach and growth; more helps with diminishing returns ([Buffer](https://buffer.com/resources/how-often-to-post-on-instagram/)). Game-specific guides push harder, 7 to 14 clips a week across TikTok, Shorts and Reels combined ([Gamosy](https://gamosy.com/blog/tiktok-game-marketing)). A realistic solo-dev plan is 3 to 4 Reels a week on Instagram, each cross-posted, plus one or two image posts.
- **Captions over hashtags.** Instagram now indexes caption text, alt text and the words spoken or shown in Reels. Use 3 to 5 precise hashtags and write captions with the words a player would search ("co-op roguelike", "boss fight", "pixel art RPG") ([Toptal](https://www.toptal.com/creator/post/instagram-seo), [Inflowave](https://inflowave.io/resources/best-instagram-hashtags), [DiveMedia](https://www.divemedia.com.au/marketing-tips-and-insights/social-seo-keywords-vs-hashtags)). One source recommends 8 to 15 hashtags, against the rest; stuffing hurts.
- **The Edits app.** Instagram's free editor adds per-Reel metrics the main app lacks (skip rate, like rate, save rate, and where views came from) and applies them to existing Reels ([NapoleonCat](https://napoleoncat.com/blog/instagram-edits/), [Lindsey Gamble](https://lindseygamble.com/blog/instagrams-edits-to-launch-shareable-insights-feature-for-creators)). Skip rate is the closest thing to a hook-rate diagnostic available for organic posts.
- **Threads and Broadcast Channels.** No source measured results for indie games. One 2026 piece argues Threads and Bluesky grow text communities but do not convert to wishlists for most genres ([The Nerdy Type](https://www.thenerdytype.com/post/the-state-of-indie-game-marketing-in-2026-according-to-an-indie-developer)). Cross-post to Threads for free; do not budget time for it.

### 2.5 Facebook organic

Facebook groups look weak in every developer account found. One test: a 56,000-member indie group gave a post 9 likes and 3 comments; a 30,000-member PC gamer group gave 1 or 2 likes per post. Many groups ban promotion outright ([itch.io thread](https://itch.io/t/1329203/marketing-on-facebook-2021), [itch.io thread](https://itch.io/t/4830442/any-platform-suggestion-to-promote-indie-game)). A Facebook Page is still needed because Meta ads require one, and Reels cross-post to it automatically from Instagram. Beyond that, spend organic effort on Reddit (r/roguelikes, r/indiegaming) rather than Facebook groups ([Chateau Reddit](https://chateaureddit.com/blog/reddit-marketing-for-indie-game-developers-complete-guide/)).

---

## 3. Paid Meta ads for a Steam game

### 3.1 Do they work at all?

The evidence splits by purpose.

- **Buying wishlists before launch: yes, at a price.** Solo developer Poking Water Games spent $4,365 across platforms for about 4,000 wishlists at an average of $1.10 each, enough to reach Steam's Popular Upcoming list for This Grand Life 2 ([Game World Observer](https://gameworldobserver.com/2024/05/31/paid-ads-steam-wishlists-this-grand-life-2-case-study)). Stray Fawn Studio targeted about $1 per wishlist on Facebook and sometimes got below it ([Codecks podcast](https://www.codecks.io/blog/2021/game-production-podcast-ep4-stray-fawn/)); they later spent roughly $16,000 to $20,000 on Facebook ads around The Wandering Village's Kickstarter and launch and reported more than doubling it ([GameDiscoverCo](https://newsletter.gamediscover.co/p/validate-hype-release-the-wandering)). Guides put paid-social wishlists at $1 to $5 each, with $1 to $2 "healthy" and $3 or more a signal to stop and fix creative or targeting ([Games.gg](https://games.gg/news/game-marketing-budget/), [Steam Page Analyzer](https://www.steampageanalyzer.com/blog/indie-game-marketing-metrics)).
- **Sustained spend as the growth engine: no.** GameDiscoverCo's view is that launch spend for visibility is reasonable but ongoing ad spend rarely drives virality; the hook and word of mouth do ([GameDiscoverCo](https://newsletter.gamediscover.co/p/can-paid-ads-for-pcconsole-games)). Chris Zukowski's long-standing position lists paid ads among the tactics that are not the main wishlist drivers, behind demos, festivals and email ([Zukowski slides](https://www.slideshare.net/slideshow/how-to-market-a-pc-game-chris-zukowski-how-to-market-a-game/251712038)). Demo-driven wishlists convert to sales better than ad-bought ones ([PlayRuo](https://playruo.com/blog/game-launch-marketing-strategy-complete-playbook)).
- **Retargeting warm visitors: the best-supported paid use.** People who already visited the Steam page or landing page convert far better, so retargeting them is the narrow case where paid ads clearly make sense ([Presskit.gg](https://presskit.gg/field-guides/how-to-build-steam-wishlist)).
- **Price matters.** GameDiscoverCo notes it is far easier to get positive ROI on a $40 game than a $15 one ([GameDiscoverCo](https://newsletter.gamediscover.co/p/can-paid-ads-for-pcconsole-games)). An indie roguelike will sit at the hard end of that, which is why ads should buy wishlists and demo installs before launch rather than sales after it.

Two steady wishlist benchmarks frame the goal: about 7,000 to 10,000 wishlists is the practical threshold for Steam's Popular Upcoming visibility, and on average about 8 percent of wishlists convert at launch ([Zukowski](https://www.slideshare.net/slideshow/how-to-market-a-pc-game-chris-zukowski-how-to-market-a-game/251712038), [PlayRuo](https://playruo.com/blog/game-launch-marketing-strategy-complete-playbook)).

### 3.2 Fix the Steam page first

Several guides make the same point: running Facebook ads before the Steam page converts is "pouring water into a leaky bucket" ([Steam Page Analyzer](https://www.steampageanalyzer.com/blog/indie-game-marketing-budget)). The median visit-to-wishlist rate for Coming Soon pages is quoted at 8 to 15 percent ([Steam Page Analyzer](https://www.steampageanalyzer.com/blog/indie-game-marketing-metrics)). Check that figure in Steamworks before the first dollar. Below 8 percent, work on the capsule, the first trailer and the first three screenshots.

### 3.3 Objective, targeting, structure

| Decision | Recommendation | Evidence |
|---|---|---|
| **Campaign objective** | Traffic (landing page views) to start; Sales only once a landing page fires a trackable event 50 or more times a week | Learning phase needs about 50 optimisation events per ad set per week ([LSEO](https://lseo.com/paid-media/paid-social-media-marketing/understanding-the-facebook-ads-learning-phase-a-full-guide/), [Lionelz](https://lionelz.com/en/blog/facebook-learning-phase-essentials/)). Guides warn Traffic buys cheap, low-intent clicks ([Stackmatix](https://www.stackmatix.com/blog/meta-ads-funnel-strategy)), but wishlists on Steam are invisible to Meta, so there is nothing else to optimise toward until a landing page exists (section 5). |
| **Targeting** | Broad, with "suggested" interests (Steam, roguelike, Risk of Rain, Hades, Dead Cells) rather than hard restrictions. Build a 1 percent Lookalike from Discord members or newsletter subscribers once there is a seed list | Facebook's game-interest data is thin and stale ([GameDiscoverCo](https://newsletter.gamediscover.co/p/can-paid-ads-for-pcconsole-games)). A 1 percent Lookalike from early adopters often beats interest stacks ([GameDev.net](https://www.gamedev.net/blogs/entry/2295896-launching-an-indie-game-in-2025-a-pragmatic-guide-to-facebook-ads-that-wont-drain-your-budget/)). Narrowing Advantage+ audiences hurts delivery ([Benly](https://benly.ai/learn/meta-ads/meta-ads-gaming-apps)). |
| **Placements and devices** | Include mobile. Do not restrict to desktop | In the This Grand Life 2 case, mobile was 90 percent of tracked visits and 96 percent of tracked wishlists for a PC-only game ([Game World Observer](https://gameworldobserver.com/2024/05/31/paid-ads-steam-wishlists-this-grand-life-2-case-study)). Steam's mobile site lets a logged-in user wishlist in two taps. |
| **Geography** | Tier-1 English markets plus Germany and the Nordics to start; add Brazil, Poland, Turkey later as cheap wishlist volume | Inference from CPM data: North America CPM about $16 versus a $4 global average ([FoxData citing Adjust](https://foxdata.com/en/blogs/2026-mobile-game-user-acquisition-cost-benchmarks-how-much-should-you-spend/)). Cheap wishlists in low-price regions convert to lower revenue. |
| **Structure** | One campaign, one or two broad ad sets, 8 to 15 ads inside; ad-set budgets (ABO) while testing, campaign budget (CBO, now "Advantage+ campaign budget") once a winner is clear | [AdManage](https://admanage.ai/blog/facebook-ad-creative-testing-framework), [Segwise](https://segwise.ai/blog/abo-cbo-meta-ads-budget-strategies). A separate testing campaign starves test ads of audience ([Affect Group](https://affectgroup.com/blog/how-to-test-creatives-in-meta-ads-in-2026-a-working-system-in-the-era-of-advantage-and-andromeda/)). |
| **Budget** | Start at 20 percent of the eventual daily target. Raise no more than about 20 percent a day. At $10 a day, run exactly one broad ad set | Tim Bender of Hooded Horse via [GameDiscoverCo](https://newsletter.gamediscover.co/p/can-paid-ads-for-pcconsole-games); [Scigrowth](https://scigrowth.com/blogs/strategy-growth-1/meta-ads-creative-testing-framework-dtc-2026); [Vaizle](https://insights.vaizle.com/facebook-ads-guide/how-to-do-facebook-ads-budget-optimization/). Rule-of-thumb daily budget per ad set is 2 to 5 times the target cost per result. |
| **Ad copy** | Headline describes the hook, not the game name. In-game screenshots and clips, not key art | [Game World Observer](https://gameworldobserver.com/2024/05/31/paid-ads-steam-wishlists-this-grand-life-2-case-study) |

### 3.4 Three paid phases

1. **Pre-fest wishlist building (now to February 2027).** Traffic objective, broad, mobile included, Steam UTM links. Goal: cost per wishlist under $2 as measured by wishlist velocity against spend. Budget small, $5 to $20 a day, mainly to learn which creative works ([GameDev.net](https://www.gamedev.net/blogs/entry/2295896-launching-an-indie-game-in-2025-a-pragmatic-guide-to-facebook-ads-that-wont-drain-your-budget/)).
2. **Next Fest week (22 February to 1 March 2027).** Push demo downloads. Retarget everyone who visited the landing page or engaged with the Instagram account in the previous 180 days. Boost the best organic Reels.
3. **Launch.** Retarget again with the launch discount. Steam re-notifies wishlisters at a 20 percent or deeper discount, and more than half of wishlist conversions happen during discount events ([Immutable](https://www.immutable.com/guides/steam-game-marketing), [Presskit.gg](https://presskit.gg/field-guides/how-to-build-steam-wishlist)). Keep spend to the launch window; sustained spend after launch is the case GameDiscoverCo says rarely pays.

---

## 4. Creative: what the clips and ads should look like

### 4.1 The opening second

Derek Lieu's rules for social cutdowns, from his blog ([First Shot](https://www.derek-lieu.com/blog/2022/8/1/the-first-shot-of-the-game-trailer), [Optimise for Social](https://www.derek-lieu.com/blog/2023/2/12/how-to-optimize-a-game-trailer-for-social-media), [Trailers for Creators](https://www.derek-lieu.com/blog/2023/2/4/how-to-make-game-trailers-for-influencers-and-content-creators)):

- Open on recognisable gameplay. No studio logo, no slow pan, no fade from black.
- Make the first frame obviously playable, not cinematic.
- A "oner", one long take showing a complete basic loop, is a strong opener and feels more honest than rapid cuts.
- Establish the genre in the first 3 to 5 seconds on social, faster on TikTok-style feeds.
- Keep text off the gameplay where possible. Creators who repurpose footage crop it out.
- Lead with the key visual. For Rogue's Odyssey that is probably the Cat, or a cross-class skill combination that looks wrong in a good way.

Meta's own hook guidance agrees on the first few seconds and suggests three hook types: a value promise, a statement of intent, and a question ([Social Media Today on Meta's blog](https://www.socialmediatoday.com/news/meta-shares-tips-on-reels-hooks-creative-diversification-in-ads-and-threa/808182/)). Gameplay shown in the first three seconds lifted view-through attribution 25 percent in one report, and gameplay demos out-click cinematic trailers ([Admapix](https://www.admapix.com/blog/ad-intelligence/mobile-game-ads-guide)).

### 4.2 Structure of a 15 to 30 second ad

The template that recurs across sources ([Vidscape](https://vidscape.ai/blog/mobile-game-ad-hooks), [Udonis](https://www.blog.udonis.co/mobile-marketing/mobile-games/mobile-game-ads), [Artstash](https://creative.artstash.io/performance-creative-for-games/)):

| Seconds | Content |
|---|---|
| 0 to 3 | Hook. Boss slam, build gone absurd, Death Knight appearing, co-op wipe |
| 3 to 15 | Core loop. Fight, pick up skill, see build change |
| 15 to 25 | Escalation. Bigger boss, bigger numbers, or the payoff of the hook |
| Last 3 to 5 | End card inside the safe zone: logo, "Wishlist on Steam", "Demo out now" |

Burned-in captions for sound-off viewing, placed above the bottom 350 px. Native game audio or music: Meta reports up to 13 percent more incremental conversions for Reels with music or voiceover ([Social Media Today](https://www.socialmediatoday.com/news/meta-shares-tips-on-reels-hooks-creative-diversification-in-ads-and-threa/808182/)).

### 4.3 Angles to test

From a games-specific angle list ([Admapix](https://www.admapix.com/blog/ad-intelligence/facebook-ads-for-games)) adapted to the game: challenge ("can you beat the Death Knight before minute 10?"), fail-and-fix (a wipe, then the build that solved it), progression (skill tree filling up), reward reveal (a rare item), creator reaction (a clipped streamer moment, with permission), and demo call-out ("free demo, 900 MB, play tonight"). Do not scale an angle until it proves click quality *and* wishlist velocity, not just cheap clicks.

### 4.4 Volume and fatigue

- Run 8 to 15 creatives at once, split into proven leaders, mid-tier, and 2 to 3 fresh tests; review every 7 to 14 days ([AdManage](https://admanage.ai/blog/facebook-ad-creative-testing-framework), [Extuitive](https://extuitive.com/articles/meta-ads-creative-testing-practices)). Meta's mobile-game guidance goes as high as 50 differentiated ads per campaign, which is unrealistic for a solo developer but shows the direction ([PPC Land](https://ppc.land/meta-unveils-q5-marketing-strategy-for-mobile-game-developers/)).
- Reels placements fatigue roughly 40 percent faster than Feed at the same frequency, per one article citing a Meta handbook; unverified ([AdLibrary](https://adlibrary.com/posts/meta-ad-creative-best-practices)). Creator-style clips fatigue in 7 to 10 days ([Vmobify](https://vmobify.com/blog/mobile-app-creative-strategy)). Plan a steady clip pipeline rather than one trailer.
- Test concepts with Advantage+ creative enhancements off, then turn them on for the winner ([AdLibrary](https://adlibrary.com/posts/meta-advantage-creative-guide)).

### 4.5 Specs and safe zones

Reels and Reels ads: 1080 x 1920, 9:16, H.264 MP4, AAC audio, 30 fps. Meta's ad safe zone keeps the top 14 percent, bottom 35 percent and 6 percent of each side clear; on 1080 x 1920 that is about 270 px top, 670 px bottom, 65 px each side ([Hopper HQ](https://www.hopperhq.com/blog/instagram-reel-size/), [TryMyPost](https://www.trymypost.com/blog/instagram-reels-ads-specs-and-best-practices-2026)). The repo's `video-editing/` tool and its research doc cover the conversion from 16:9 gameplay capture.

---

## 5. Measurement: the attribution problem and how to live with it

The constraint everyone hits: **no tracking code can run on a Steam page**, Valve strips referral data, and a wishlist often happens days after the click. Ad platforms therefore optimise toward what they can see, which is link clicks ([Trapplan](https://www.trapplan.com/en/blog/tracking-and-attribution-for-game-ads)).

What exists:

- **Steam UTM Analytics.** Tag every link with source, medium and campaign. Steamworks counts a wishlist, purchase or activation as a conversion if it happens within 72 hours of the tagged click *and the user is logged in to Steam in that browser*. Visits update hourly; conversions lag about four days. Test tags under Marketing & Visibility, UTM Analytics, Test a UTM Link ([Zukowski on Steam UTM](https://howtomarketagame.com/2021/04/14/how-to-use-steams-utm-feature-to-track-the-number-of-wishlists-and-sales-your-marketing-is-generating/), [GameDiscoverCo](https://newsletter.gamediscover.co/p/steam-adds-privacy-friendly-marketing), [Second Stage](https://secondstage.io/2026/05/steam-wishlist-strategy-how-to-build-track-and-convert-your-wishlist-audience)). One vendor estimates UTM captures only about 10 percent of ad-driven wishlists because mobile users are rarely logged in and cross-device journeys break it ([Immutable](https://www.immutable.com/guides/steam-marketing-attribution)); treat that figure as rough.
- **Landing page with Pixel and Conversions API.** A page on roguesodyssey.com with a "Wishlist on Steam" button lets the Pixel fire a custom event on the click, before the hand-off to Steam. Run Pixel and Conversions API together with a shared event ID to survive ad blockers without double counting ([Funnelfox](https://blog.funnelfox.com/meta-pixel-and-conversions-api/), [Tracklution](https://www.tracklution.com/learn/conversion-tracking/conversions-api-vs-meta-pixel/)). The event measures the click, not the wishlist, but it gives Meta something to optimise toward and builds a retargeting audience. The cost is one extra click in the funnel, so A/B test direct-to-Steam against landing-page routes.
- **Velocity correlation.** Compare the Steamworks wishlist graph against the days spend or posts went live. This is the method most practitioners actually rely on ([Second Stage](https://secondstage.io/2026/05/steam-wishlist-strategy-how-to-build-track-and-convert-your-wishlist-audience)).
- **Per-creator Steam keys.** Unique keys per creator give redemption timing as a second signal independent of UTM ([Presskit.gg](https://presskit.gg/field-guides/how-to-build-steam-wishlist)).

**Metrics that matter, in order:** wishlist velocity against spend (effective cost per wishlist), Steam visit-to-wishlist rate, demo installs, Reel sends per reach and skip rate, Steamworks UTM conversions as a floor. Not CTR or CPM on their own.

---

## 6. Creators and Partnership Ads

Creator coverage drives more wishlists than ads in most indie accounts, and most impressions for a small game come from creators working from the trailer, not from the developer's own posts ([Gamosy](https://gamosy.com/blog/steam-wishlist-strategy), [Presskit.gg TikTok guide](https://presskit.gg/field-guides/tiktok-indie-game-marketing)). On Meta specifically:

- **Seed micro-creators who already post gameplay Reels.** Platform fit beats follower count: choose creators whose audience buys on Steam ([iQfluence](https://iqfluence.io/public/blog/indie-game-influencer-marketing-strategies)). Micro-creators work better than large streamers for indie games ([Presskit.gg](https://presskit.gg/field-guides/how-to-build-steam-wishlist)). Avoid giveaway keys; they attract low-intent hunters.
- **Use Instagram Collab posts** so a creator's Reel appears on both accounts and the game account inherits the engagement.
- **Partnership Ads (creator whitelisting).** With the creator's permission via the Partnership Ads Hub, the developer can run a creator's Reel as an ad from the creator's handle, with the developer's budget and targeting. Vendor-cited Meta figures claim about 19 percent lower CPA and 13 percent higher CTR than standard ads, unverified ([Flighted](https://www.flighted.co/blog/how-to-use-partnership-ads-on-meta), [Leadsie](https://www.leadsie.com/blog/allowlist-whitelist-influencer-meta-ads)). Usage rights are a separate agreement from the post itself; a usage fee of 30 to 50 percent of the content fee is described as standard ([Flighted](https://www.flighted.co/blog/ugc-ads-for-meta)).

---

## 7. Timeline anchored on Steam Next Fest, February 2027

The game is eligible now: it has a public store page and a playable demo. The February 2027 fest runs **22 February to 1 March 2027**; registration closes **10 January 2027**; all items are due 8 February; press preview starts 11 February ([Steamworks](https://partner.steamgames.com/doc/marketing/upcoming_events/nextfest/feb_2027), [Steam Page Analyzer](https://www.steampageanalyzer.com/blog/steam-next-fest-february-2027)). A title gets one Next Fest, and experienced developers pick the last one before launch ([Presskit.gg](https://presskit.gg/field-guides/steam-next-fest-guide)). Games entering with under 1,000 wishlists rarely reach the top tiers; the median demo added 806 wishlists in February 2026 ([Ziva](https://ziva.sh/blogs/steam-next-fest-2026)).

| When | Meta work |
|---|---|
| **October 2026** | Create Instagram (Creator or Business) and Facebook Page, link them in Business Suite. Set up Pixel and Conversions API on roguesodyssey.com. Define a UTM scheme. Check Steam visit-to-wishlist rate. Start 3 to 4 Reels a week. |
| **November to December** | Trial Reels to find hooks. $5 to $10 a day Traffic ads with Steam UTM links, broad, mobile included. Build a Discord and newsletter seed list for a Lookalike. Register for Next Fest before 10 January. |
| **January 2027** | Shortlist 20 to 50 micro-creators who post gameplay Reels; send demo keys 3 to 4 weeks before the fest. Lock the demo build by 8 February. Cut the fest trailer with gameplay in frame one. |
| **22 February to 1 March** | Peak spend. Retarget landing-page visitors and Instagram engagers. Boost the best organic Reels. Daily Reels from the demo and from creator clips (with permission, as Collab or Partnership Ads). |
| **March onward** | Report fest results from Steamworks. Keep organic cadence. Pause paid until launch. At launch, retarget with a 20 percent or deeper discount for the launch window only. |

---

## 8. Skills to build, and tools

Job postings for game marketing roles in 2026 ask for paid social across networks, data-driven creative testing, creative production management, and increasingly generative-AI workflow skills ([Scopely posting](https://www.marketingmonk.so/jobboard/jobs/performance-marketing-manager-i-at-scopely-p7b8qp), [SciPlay posting](https://www.marketingmonk.so/jobboard/jobs/creative-strategist-at-sciplay-sombfn), [Meta posting](https://jobs.accel.com/companies/facebook-2-07d2eb1b-d3ad-4084-93df-74a124ac9233/jobs/82980997-creative-strategist-israel-gaming)). For one developer or a tiny team, in priority order:

1. **Short-form editing from gameplay capture.** Capture at 1080p60 or higher, cut to 9:16, caption, export to spec. Tools: the Edits app (free, Instagram-native, with skip-rate insights), CapCut, DaVinci Resolve. The repo's `video-editing/` tool handles the 16:9 to 9:16 conversion. Opus Clip is cited for auto-cutting long recordings into captioned shorts ([Segwise](https://segwise.ai/blog/best-ai-tools-for-marketers-2026)).
2. **Hook writing.** Writing the first three seconds and the caption so a stranger knows the genre and the twist. Practice with Trial Reels and read skip rate.
3. **Ads Manager operation.** Objectives, learning phase, ABO versus CBO, budget pacing, Advantage+ settings, Partnership Ads Hub. Meta Blueprint courses are free; no source rated the certification itself.
4. **Analytics.** Steamworks UTM and traffic reports, Pixel and Conversions API setup, a weekly spreadsheet of spend against wishlist velocity.
5. **Creator relations.** Finding gameplay micro-creators on Instagram, pitching, per-creator keys, Collab posts, usage rights.
6. **Scheduling and copy.** Meta Business Suite schedules Instagram and Facebook natively and is free. Later and Buffer add AI caption suggestions ([Segwise](https://segwise.ai/blog/best-ai-tools-for-marketers-2026)). Use an LLM for caption variants and ad copy drafts, never for the clips themselves: audiences punish footage that misrepresents the game ([Udonis](https://www.blog.udonis.co/mobile-marketing/mobile-games/mobile-game-ads)).

---

## 9. What not to do

- Do not run the mobile-game playbook. App-install objectives, Advantage+ app campaigns, playable ads and in-app-event optimisation all assume a store Meta can track. None applies to Steam.
- Do not restrict ads to desktop. The one hard data point says mobile drove 96 percent of tracked wishlists.
- Do not open any clip with a logo, title card or slow pan.
- Do not pay for traffic until the Steam page converts at or above about 8 percent of visits to wishlists.
- Do not spend organic time in Facebook groups.
- Do not judge ads by CTR or CPM. Judge them by wishlist velocity per dollar.
- Do not keep spending after launch week hoping for virality. The sources that measured it say the hook and word of mouth decide that.

---

## Source notes

Primary-ish sources (official or first-hand): [Steamworks Next Fest Feb 2027](https://partner.steamgames.com/doc/marketing/upcoming_events/nextfest/feb_2027), [Steam store page](https://store.steampowered.com/app/3792120/Rogues_Odyssey/), [Steam Community](https://steamcommunity.com/app/3792120), [itch.io](https://duggoman.itch.io/rogues-odyssey), [Derek Lieu's blog](https://www.derek-lieu.com/blog), [Game World Observer case study](https://gameworldobserver.com/2024/05/31/paid-ads-steam-wishlists-this-grand-life-2-case-study), [Codecks podcast with Stray Fawn](https://www.codecks.io/blog/2021/game-production-podcast-ep4-stray-fawn/), [GameDiscoverCo](https://newsletter.gamediscover.co/p/can-paid-ads-for-pcconsole-games), [Buffer posting-frequency study](https://buffer.com/resources/how-often-to-post-on-instagram/), [Meta Pixel conversion tracking docs](https://developers.facebook.com/documentation/meta-pixel/implementation/conversion-tracking).

Everything else is a secondary marketing blog. Figures from those sources (cost per wishlist ranges, Partnership Ads lift, fatigue rates, Reels versus TikTok reach) should be treated as hypotheses to test against this game's own Steamworks and Ads Manager data.
