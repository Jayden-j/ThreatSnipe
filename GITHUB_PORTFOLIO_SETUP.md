# GitHub Portfolio Setup — ThreatSnipe

Everything you need to do to get ThreatSnipe looking sharp on GitHub.

---

## Step 1 — Create the README on GitHub

1. Go to your repo: `github.com/Jayden-j/centry`
2. Click **Add file → Create new file**
3. Name it `README.md`
4. Paste the full README content from the chat
5. Scroll down → click **Commit new file**

---

## Step 2 — Take screenshots

Take 3 screenshots of the live app and save them exactly as named:

| File name | What to capture |
|-----------|----------------|
| `docs/screenshots/landing.png` | The full landing page hero section |
| `docs/screenshots/dashboard.png` | The dashboard — KPI cards + charts visible |
| `docs/screenshots/scan.png` | An IP scan result showing the abuse score card |

**How to upload them to GitHub:**
1. In your repo, click **Add file → Upload files**
2. Navigate into `docs/screenshots/` (create the folder by typing `docs/screenshots/` in the path field)
3. Drag and drop all 3 images
4. Commit

Once uploaded, the screenshot table in the README will automatically show them.

---

## Step 3 — Update the live demo link

In your `README.md`, find this line:

```
<a href="https://threatsnipe.vercel.app">
```

Replace `https://threatsnipe.vercel.app` with your actual Vercel URL. You can find it in your [Vercel dashboard](https://vercel.com/dashboard).

---

## Step 4 — Set repo description and website

1. Go to your repo on GitHub
2. Click the gear icon ⚙️ next to **About** (top right of the repo page)
3. Set **Description** to:
   ```
   Full-stack threat intelligence platform — IP reputation, domain scanning, DNSBL, port scanning & real-time alerts
   ```
4. Set **Website** to your Vercel URL
5. Click **Save changes**

---

## Step 5 — Add topics/tags

On the same **About** settings panel:

1. Click the gear ⚙️ next to **About**
2. Under **Topics**, add each of these one at a time:
   - `nextjs`
   - `cybersecurity`
   - `threat-intelligence`
   - `typescript`
   - `supabase`
   - `tailwindcss`
   - `security-tools`
   - `abuseipdb`
   - `virustotal`
   - `portfolio`
3. Click **Save changes**

Topics make your repo show up when recruiters or hiring managers search GitHub for cybersecurity or Next.js projects.

---

## Step 6 — Pin the repo on your GitHub profile

1. Go to your GitHub profile: `github.com/Jayden-j`
2. Click **Customize your pins**
3. Check `centry` (ThreatSnipe)
4. Click **Save pins**

This puts it front and center on your profile page.

---

## Step 7 — Update your GitHub profile bio (optional but worth it)

1. Click **Edit profile** on your profile page
2. Set **Bio** to something like:
   ```
   Building security tools | Next.js + TypeScript | Seeking cybersecurity internships
   ```

---

## Done ✓

Your repo should now have:
- [x] README with features, stack, architecture, and learning notes
- [x] `.env.example` already committed (done)
- [x] Screenshots rendering in the README table
- [x] Live demo badge linking to your deployment
- [x] Topics that make the repo discoverable
- [x] Repo pinned on your profile
