# Topic backlog

Eight content areas, ~365 videos in total (roughly one a day for a year).
Ideas below are **not** scripts or claims — every fact still needs a source when the script is written.
Before adding an idea, search this file for duplicates. When a video starts, write its folder id
in the last column.

| Area | Label | Target | What goes here |
|---|---|---:|---|
| Basics | `area:basics` | 55 | First concepts for people who've never heard of Grin |
| How it works | `area:how-it-works` | 70 | Mimblewimble and Grin mechanics, one mechanism per video |
| How-to | `area:how-to` | 60 | Practical: wallets, nodes, sending, receiving, backups |
| Myths | `area:myths` | 35 | Common misconceptions, corrected with sources — in both directions (too much hype *and* too much doubt) |
| History | `area:history` | 30 | How Mimblewimble and Grin came to be |
| Ecosystem | `area:ecosystem` | 40 | Wallets, tools, community projects — described neutrally, no promotion |
| Weekly stats | `area:weekly-stats` | 52 | One per week: network numbers only (blocks, transactions, hashrate). **Never price.** |
| Q&A | `area:qa` | 23 | Answers to real viewer questions |
| **Total** | | **365** | |

Template keys: `explainer` (built), `myth-fact`, `step-by-step`, `comparison`, `stat-card`,
`timeline` (planned). Until a template is built, use `explainer`.

## First ideas

### Basics
| # | Topic | Template | Angle | Video |
|---|---|---|---|---|
| B1 | What is Grin, in 60 seconds | explainer | A privacy-focused, community-run implementation of Mimblewimble | |
| B2 | What is Mimblewimble? | explainer | The core idea, without maths | |
| B3 | Why there are no addresses on the Grin blockchain | explainer | What is recorded instead | |
| B4 | What "confidential amounts" means | explainer | Amounts hidden, yet the chain can still check that nothing was created from nothing | |
| B5 | Why sending Grin takes two people | explainer | Interactive transactions, at a high level | |
| B6 | "One grin per second, forever" — what the emission means | explainer | Supply mechanics only; no price or value talk | |
| B7 | Who runs Grin? | explainer | No company, no premine, no founders' reward; open-source contributors | |

### How it works
| # | Topic | Template | Angle | Video |
|---|---|---|---|---|
| H1 | How a Grin transaction works | explainer | Sender → receiver → network, step by step | `0001_how-a-grin-transaction-works` |
| H2 | Pedersen commitments | explainer | Hiding an amount you can still add up | |
| H3 | Range proofs (Bulletproofs) | explainer | Proving an amount isn't negative without showing it | |
| H4 | The transaction kernel | explainer | The part that stays on chain forever, and why | |
| H5 | Cut-through | explainer | Why spent outputs can be removed from history | |
| H6 | Transaction aggregation in a block | explainer | Many transactions merged into one — and what that does and doesn't hide | |
| H7 | Kernel offsets | explainer | The trick that stops a block being split back into its transactions | |
| H8 | Dandelion++ | explainer | How transactions spread; what it hides, what it can't | |
| H9 | Cuckatoo32 proof of work | explainer | Graph-based mining puzzle, at a high level | |
| H10 | Syncing a node without the whole history | explainer | Pruning and the horizon | |

### How-to
| # | Topic | Template | Angle | Video |
|---|---|---|---|---|
| T1 | Send Grin with a slatepack | step-by-step | The three messages, in order | |
| T2 | Receive Grin with a slatepack address | step-by-step | What the address is (and isn't stored on chain) | |
| T3 | Back up your wallet: the recovery phrase | step-by-step | Write it down, store it offline, never share it | |
| T4 | Payment proofs | step-by-step | Proving you paid someone | |
| T5 | Run a Grin node at home | step-by-step | What you need, how long sync takes | |
| T6 | Read a block explorer | explainer | What a Mimblewimble explorer can and can't show you | |
| T7 | Receive over Tor with grin-wallet | step-by-step | What Tor adds; what it doesn't | |

### Myths
| # | Topic | Template | Angle | Video |
|---|---|---|---|---|
| M1 | "Grin is completely anonymous" | myth-fact | What leaks: transaction graph before aggregation, IPs, off-chain metadata | |
| M2 | "Mimblewimble is just a joke name" | myth-fact | Harry Potter name, serious cryptography | |
| M3 | "Both people must be online at the same moment" | myth-fact | Slatepacks can be exchanged asynchronously | |
| M4 | "No supply cap means inflation stays high" | myth-fact | Constant emission → inflation *rate* falls over time; mechanics only | |
| M5 | "You need a big server to run a node" | myth-fact | Pruned chain size, modest hardware | |

### History
| # | Topic | Template | Angle | Video |
|---|---|---|---|---|
| Y1 | 2016: a paper signed "Tom Elvis Jedusor" | timeline | The anonymous Mimblewimble paper | |
| Y2 | Andrew Poelstra's Mimblewimble paper | timeline | Turning the idea into a full design | |
| Y3 | Grin mainnet launch, January 2019 | timeline | Fair launch: no premine, no ICO | |
| Y4 | The scheduled hard forks | timeline | Why Grin planned forks every six months for its first two years | |
| Y5 | Where the name "Grin" and the Harry Potter references come from | explainer | Ignotus Peverell, Jedusor, Mimblewimble | |

### Ecosystem
| # | Topic | Template | Angle | Video |
|---|---|---|---|---|
| E1 | Grin wallets compared | comparison | grin-wallet (CLI), Grin++, Grim — features only, no recommendation | |
| E2 | How Grin development is funded | explainer | Donations and community funding, no company | |
| E3 | Other Mimblewimble projects | comparison | Grin, Beam, Litecoin's MWEB — design differences only | |
| E4 | Community tools: explorers, node toolkits, mining pools | explainer | What exists and what each does | |

### Weekly stats
| # | Topic | Template | Angle | Video |
|---|---|---|---|---|
| W1 | How to read the weekly stats | explainer | Blocks, transactions, difficulty, hashrate — what each means | |
| W2 | Weekly network stats (recurring) | stat-card | Same layout every week; numbers from our own node, never price | |

### Q&A
| # | Topic | Template | Angle | Video |
|---|---|---|---|---|
| Q1 | Can I see my balance on an explorer? | explainer | No — and why that's by design | |
| Q2 | Can a Grin transaction be reversed? | explainer | Finality and confirmations | |
| Q3 | Why is there a block every ~60 seconds? | explainer | Target block time and difficulty adjustment | |
