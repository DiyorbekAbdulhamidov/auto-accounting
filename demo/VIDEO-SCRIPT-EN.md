# Moslik — demo video script (English)

Target length **2:00** (limit is 3:00). Narration ≈ 250 words, read at a
normal pace. Every number below comes from the two demo files and was
verified against the real parser — nothing on screen will contradict
what you say.

---

## Before you press record

| | |
|---|---|
| **Open the app in English** | `https://test-project.webleaders.uz/en` — every label on screen must be English |
| **Screen size** | 1920×1080, browser zoom 100 %. Hide the bookmarks bar and any other tab |
| **Files** | `NAVBAHOR-SAVDO_bank-statement_07-2026.xlsx` and `NAVBAHOR-SAVDO_invoices_07-2026.xlsx` — put both on the Desktop so the file dialog is quick |
| **Theme** | Light mode reads better in a compressed video. Dark also works — pick one and stay on it |
| **Never on screen** | any real client's file, name or amount. The demo files are invented — that is exactly why they exist |

> ⚠️ **Do a silent dry run first.** The logged-in part of the app has
> never been exercised against the live database. Walk the whole path
> once — sign in, open a company, upload both files, see the result —
> before you record a single second. If something breaks there, use
> Plan B at the bottom of this file.

---

## The script

Time codes are cumulative. "Say" is what you read aloud (or put in
subtitles, word for word).

### 0:00 – 0:10 · Landing page, top

**Screen:** `/en` home page. Slow scroll from the headline to the
animated comparison on the right.

> **Say:** "This is Moslik. It answers one question for an accountant:
> does the money that moved through the bank match the invoices on paper?"

### 0:10 – 0:22 · Landing, "Two different days" section

**Screen:** scroll down to the two cards — *By hand* / *Moslik*.

> **Say:** "Every month, for every client company, that check is done by
> hand — two Excel files, side by side, hundreds of rows. It takes days."

### 0:22 – 0:36 · The two files in Excel

**Screen:** Excel. Show the bank statement — scroll the rows once, let
the viewer see it is an ordinary statement. Then switch to the invoice
register. **No zooming, no highlighting.**

> **Say:** "Here are the two files. A bank statement for July, and the
> register of invoices received in the same period. Nothing has been
> reformatted — this is how the bank exports them."

### 0:36 – 0:46 · Upload

**Screen:** in the app, open the client, drag both files into the upload
area at once.

> **Say:** "I upload both files together. There is no template to choose
> and no columns to map — the system recognises the layout on its own."

### 0:46 – 1:04 · The reading report

**Screen:** the report panel — account, period, and the balance check
row. Hold on it; do not scroll while you speak.

> **Say:** "First, it reports what it read — the account, the period, and
> a balance check: opening balance plus credit minus debit must equal the
> closing balance printed in the file. It does. The file confirms itself
> before anything is compared."

*(On screen the check reads 600 000 000 + 0 − 562 950 000 = 37 050 000.)*

### 1:04 – 1:29 · The result — the heart of the video

**Screen:** the counterparty table. Let it sit for a second, then hover
or click the **MEGA PLAST INDUSTRIYA** row so the difference is obvious.

> **Say:** "Now the result. Seven counterparties. Four match to the som.
> Three do not — and this is the number that matters: sixty-two million,
> three hundred fifty thousand som of invoices from Mega Plast, with no
> payment against them. Below it, two smaller gaps: one where we paid less
> than we were invoiced, and one where we paid without ever receiving an
> invoice."

**What must be visible on screen while you say this:**

| Counterparty | Paid | Invoiced | Difference |
|---|---:|---:|---:|
| MEGA PLAST INDUSTRIYA | 0 | 62 350 000 | **−62 350 000** |
| OQ ORZU LOGISTIKA | 39 600 000 | 47 100 000 | −7 500 000 |
| TOSHKENT ENERGO TAMINOT | 18 900 000 | 0 | +18 900 000 |

### 1:29 – 1:44 · Reconciliation act + export

**Screen:** open the reconciliation act for one counterparty, then show
the Excel export button. Two clicks, no narration gap.

> **Say:** "Each line opens into the official reconciliation act — the
> two-sided document an accountant actually sends to a counterparty. And
> everything on screen exports to Excel, five sheets."

### 1:44 – 2:00 · Close

**Screen:** back to the landing page footer, or a full-screen
`moslik-logo-for-dark-bg.png` on the dark background.

> **Say:** "That is the whole product. Work that takes days by hand,
> finished while you are still looking at the screen. Moslik — automated
> verification for accountants."

**Last frame, held 3 seconds:** logo + `moslik.uz`.

---

## The narration as one block

For recording in a single take, or for subtitles:

```
This is Moslik. It answers one question for an accountant: does the money
that moved through the bank match the invoices on paper?

Every month, for every client company, that check is done by hand — two
Excel files, side by side, hundreds of rows. It takes days.

Here are the two files. A bank statement for July, and the register of
invoices received in the same period. Nothing has been reformatted — this
is how the bank exports them.

I upload both files together. There is no template to choose and no
columns to map — the system recognises the layout on its own.

First, it reports what it read — the account, the period, and a balance
check: opening balance plus credit minus debit must equal the closing
balance printed in the file. It does. The file confirms itself before
anything is compared.

Now the result. Seven counterparties. Four match to the som. Three do not
— and this is the number that matters: sixty-two million, three hundred
fifty thousand som of invoices from Mega Plast, with no payment against
them. Below it, two smaller gaps: one where we paid less than we were
invoiced, and one where we paid without ever receiving an invoice.

Each line opens into the official reconciliation act — the two-sided
document an accountant actually sends to a counterparty. And everything
on screen exports to Excel, five sheets.

That is the whole product. Work that takes days by hand, finished while
you are still looking at the screen. Moslik — automated verification for
accountants.
```

---

## Plan B — if the logged-in part will not run in time

Record only what is certainly working, and say the same thing. The story
survives; only the proof is thinner.

1. **0:00–0:20** — landing page `/en`, top to the animated comparison
2. **0:20–0:45** — the two Excel files, as above
3. **0:45–1:10** — the landing page's own animation, which shows the
   comparison and the difference appearing. Narrate segments 0:36–1:04
   over it
4. **1:10–1:40** — `/en/features` and `/en/pricing`, scrolled slowly
5. **1:40–2:00** — close, unchanged

Do **not** fake a result screen. If a reviewer asks for a live demo
later and it does not match the video, that costs more than a plainer
video does now.

---

## Numbers you may be asked about

| | |
|---|---|
| Own company in the demo | OOO "NAVBAHOR SAVDO", TIN 305412876 — **invented** |
| Period | 01.07.2026 – 31.07.2026 |
| Payments out | 562 950 000 UZS, 9 transactions |
| Invoices received | 613 900 000 UZS, 7 invoices |
| Counterparties | 7, of which 3 differ |
| Balance check | 600 000 000 + 0 − 562 950 000 = 37 050 000 ✓ |

Everything in these two files is fictional — company names, tax IDs and
amounts alike. Say so if anyone asks; it is a demo dataset, not a client.
