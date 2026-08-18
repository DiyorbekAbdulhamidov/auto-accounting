# StartupBase / President Tech Awards — English application copy

Application #1648 · deadline 20.08.2026 23:59
Paste each block into the matching field. Everything below is factual —
no number here is invented; sources are in `HANDOFF.md` and
`MAHSULOT-QARORLARI.md`.

---

## 0. FIRST DECIDE: project name

The application is registered as **"Auto-Accounting"**, but the product
has been named **Moslik** (moslik.uz) since 2026-08-16 — the name is in
the code, the website, the 4-language SEO layer and the logo.

This edit round is the cheapest moment to align them. Two options:

- **A (recommended)** — rename the application to `Moslik` and add one
  line in the description: *"Formerly submitted as Auto-Accounting."*
- **B** — keep `Auto-Accounting` and accept that the public product and
  the official record carry different names.

⚠️ Note: a *third* name exists — the Tashabbus application ID-000951 is
filed under **"Buxgaltersiz"**. Three names for one project is the real
problem here, not which one wins.

---

## 1. Tagline (one line)

```
Moslik — automated reconciliation and audit system for accountants.
```

Alternative, more concrete:

```
Upload a bank statement and an e-invoice list. Moslik matches every
counterparty and shows exactly where the money and the paperwork
disagree.
```

---

## 2. Short description (~50 words)

```
Moslik automatically reconciles a company's bank statement against its
e-invoice records, counterparty by counterparty, and reports every
mismatch with its amount. Work that takes an accountant several days
per client per month is completed in seconds. Built and tested on real
Uzbek bank export formats.
```

---

## 3. Problem

```
Every month, an accountant in Uzbekistan must reconcile two independent
records for each client: money that actually moved through the bank
account, and invoices issued or received through the state e-invoice
system (e-Faktura, mandatory since 2020 and extended to self-employed
individuals in 2026).

Today this is done by hand — two Excel files opened side by side and
compared visually. Three things make it slow and unreliable:

1. One counterparty appears under several different names across banks,
   so rows must be merged manually.
2. Utility, budget and bank-commission payments flood the table and hide
   the real trading partners.
3. Every Uzbek bank exports a different file layout, so no fixed
   procedure works twice.

The cost of an error is not cosmetic. A mismatch between bank data and
e-invoice data flows straight into the VAT return.
```

---

## 4. Solution

```
Moslik reads the bank statement and the invoice register as they are —
no reformatting, no template, no manual mapping — and produces a
counterparty-level comparison: money paid versus invoices received,
money received versus invoices issued, and the difference for each.

Three things make it an audit tool rather than a viewer:

BALANCE EQUATION. Opening balance + credit − debit must equal the
closing balance. If a bank export has debit and credit columns swapped,
the file's own "Total" row still adds up correctly and reveals nothing;
the balance equation fails immediately. This is verified to the tiyin
on 5 of the 6 reference files, and a synthetic corrupted file is part
of the automated test suite specifically to prove the "Total" row
cannot catch it.

CATEGORY PROTECTION. Utility, treasury and bank-fee counterparties are
categorised out of the main view but never deleted — the grand total
always stays complete. The system never auto-classifies a counterparty
as "utility" on its own, because that error would make money silently
disappear from the table. It warns instead: an invoice issued to a
treasury account, an unusually large "utility" share, or an unclosed
difference above 25%.

FORMAT MEMORY. An unfamiliar bank layout is learned once and recognised
afterwards. The memory is shared, so each new user strengthens the
system for everyone.

The system never adjusts a number to make a total balance. It reports
what the files say; the correction is the accountant's decision.
```

---

## 5. Validation / traction

Honest wording — the product has real technical validation but **no
public users yet**. Do not claim users.

```
Moslik has been developed and tested against real bank exports and
e-invoice registers from operating Uzbek companies:

· 6 reference bank statement files, covering 4 different export layouts
  (.xls BIFF, .xlsx, HTML-in-.xls, CSV in windows-1251 and UTF-8)
· 58 automated regression checks, run on every change, all passing
· One test client: 1.37 bn UZS turnover, 152 bank transfers,
  159 invoices, 35 counterparties, 7 months

On that real data the system found discrepancies the accountant had
missed, including a 50,278,000 UZS invoice with no matching payment,
and two further unmatched balances of 1,366,176 and 227,503 UZS.

The product is pre-launch: the software is functional and verified, and
the next milestone is a closed pilot with 10 practising accountants.
```

---

## 6. Market

```
E-invoicing is mandatory for all legal entities and individual
entrepreneurs in Uzbekistan since 2020, and was extended to
self-employed individuals in 2026 — which sharply increased the number
of people who must keep formal records.

The invoice side of this market is already digital and concentrated:
Didox.uz alone connects more than 250,000 companies, and Faktura.uz was
the first authorised e-document operator. The banking side is served by
Dibank, which links 25+ Uzbek banks to accounting software.

What does not exist is the layer between them: an independent tool that
takes both records and verifies that they agree. Moslik targets that
gap — not document exchange, but verification.

Primary customer: the accountant or accounting bureau serving multiple
client companies. Uzbek accounting outsourcing packages typically start
around 1,000,000 UZS per client per month, so the reconciliation hours
Moslik removes are billable hours today.
```

---

## 7. Business model

```
Subscription, priced per workspace rather than per reconciliation —
reconciliations are always unlimited, because an accountant repeats
them while correcting the source files.

· Free — 3 client companies, 1 user
· Accountant — 9,999 UZS / month, unlimited companies, 1 user
· Bureau — 39,999 UZS / month, unlimited companies, 5 users

Two months free on annual billing.

The price was not estimated: it was set after asking a practising
accountant. At this stage volume is worth more than revenue, because
every new user brings a new real bank format into the shared format
memory, which improves the product for all users.
```

---

## 8. Technology

```
Next.js 16 / TypeScript / Firebase. Parsing runs server-side on the
uploaded workbook; no third-party service sees the financial data.

Each accounting workspace is isolated: no user can see another user's
client companies or amounts. The shared component is the anonymised
bank-format memory only — no file names, no company names.

The interface is available in four languages at separate URLs:
Uzbek (Latin), Uzbek (Cyrillic), Russian and English.

Correctness is enforced by a regression harness of 58 checks run
against the real reference files on every change, including a
deliberately corrupted file that proves the balance-equation check
catches a debit/credit swap that totals cannot.
```

---

## 9. Roadmap / what is next

```
Near term
· Closed pilot with 10 practising accountants; success is measured by
  how many return for a second month, not by feature count.
· Direct integration with the e-invoice operator API (api.faktura.uz is
  public and documented), removing one of the two file uploads.

Later
· Direct bank connections instead of file upload (1C "Client-Bank",
  MT940, ISO 20022 camt.053).
· Receivables ageing and tax-risk signalling on top of reconciled data.
```

---

## 10. Team — I CANNOT FILL THIS

The moderator's requirement:

> a startup may participate only if a C-level representative (Founder,
> Co-Founder, CEO, Director, or another executive) attends the program.
> This representative must also be registered in the team.

Add the person yourself. It needs real personal data (name, role,
e-mail, likely phone) and it must be someone who will actually attend.
If that person is you, register yourself in the team with the role
**Founder** or **CEO** — being the account owner is usually not the
same as being listed as a team member.

Suggested English bio line, fill in the blanks:

```
[Full name] — Founder & CEO. Built the reconciliation engine and the
bank-format parsers. Responsible for product and engineering.
```

---

## 11. Video — the real bottleneck

The moderator requires the **video** in English too. Text can be pasted
in minutes; a video cannot. With 3 days left, the cheapest routes are,
in order:

1. Add English **subtitles** to the existing video (fastest, usually
   accepted — but confirm it counts as "in English").
2. Re-record narration in English over the same screen recording.
3. Record a new 2-minute screen capture in English: upload two files →
   result screen → one counterparty with a real difference.

If only one can be done properly, do the text first — it is what the
international reviewers read before they press play.
