# Ahmed Hassan — Tour Guide · Digital Business Card

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/YOUR_REPO)

> **Luxury, mobile-first digital business card** for an Egyptian tour guide — save contact, share instantly, scan QR, watch a showcase video, and install as a PWA. Zero build step. Vanilla HTML, CSS & JS.

---

## Live demo

Replace after deploy:

**https://your-project.vercel.app**

---

## Features

| Feature | Description |
|--------|-------------|
| **Save Contact** | One-tap `.vcf` download |
| **Share Card** | Native Web Share API + smart clipboard fallback |
| **QR Code** | Modal with download |
| **Showcase Video** | YouTube embed (lazy-loaded, iOS-safe) |
| **Contact actions** | Call, WhatsApp, email, website, copy fields |
| **PWA** | Offline cache, Add to Home Screen |
| **Mobile UX** | Safe areas, no sticky hover, modal scroll lock |
| **SEO / Social** | Open Graph, Twitter cards, canonical URL |

---

## Tech stack

- **HTML5** — semantic, accessible markup  
- **CSS** — modular design tokens, glass UI, Egyptian luxury palette  
- **JavaScript** — vanilla ES6+ modules (no framework)  
- **PWA** — Service Worker + Web App Manifest  
- **Deploy** — static hosting on [Vercel](https://vercel.com)

---

## Quick deploy (GitHub + Vercel)

### 1 · Push to GitHub

```bash
git init
git add .
git commit -m "feat: tour guide digital business card"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2 · Import on Vercel

1. [vercel.com/new](https://vercel.com/new) → **Import** your repository  
2. **Framework Preset:** `Other`  
3. **Build Command:** leave empty  
4. **Output Directory:** leave empty  
5. Click **Deploy**

### 3 · Set your live URL (required)

After the first deploy, edit `data/card.json`:

```json
"deployment": {
  "siteUrl": "https://your-project.vercel.app"
}
```

Update `sitemap.xml` with the same URL, then commit and push.  
Vercel redeploys automatically — share links and social previews will use the correct domain.

### 4 · Custom domain (optional)

Vercel → **Project → Settings → Domains** → add your domain → set `deployment.siteUrl` to match.

---

## Local development

A static server is required (`fetch`, service worker):

```bash
npx serve .
# open http://localhost:3000
```

Do not open `index.html` via `file://`.

---

## Project structure

```
├── index.html              # Main card
├── 404.html                # Branded 404
├── vercel.json             # Headers & caching
├── sw.js                   # Service worker
├── robots.txt
├── sitemap.xml
├── data/
│   └── card.json           # All content & config
├── styles/                 # CSS modules
├── scripts/                # JS modules
└── assets/                 # Images, icons, manifest
```

---

## Configuration

Edit **`data/card.json`** — no build step.

| Section | What to change |
|---------|----------------|
| `owner` | Name, title, profile photo |
| `contact` | Phone, email, website, WhatsApp |
| `social` | Social profile URLs |
| `showcaseVideo` | YouTube video ID / embed |
| `qr` | QR image & download name |
| `share` | Share title & message |
| `deployment` | Live site URL (after Vercel deploy) |
| `meta` | SEO title, description, OG image |
| `labels` | Button & UI copy |

### Cache busting

After CSS/JS changes, bump `CACHE_VERSION` in `sw.js` so returning visitors receive updates.

---

## Mobile QA checklist

Test on a real phone over **HTTPS**:

- [ ] Save Contact downloads `.vcf`
- [ ] Share Card opens native share sheet
- [ ] QR modal opens/closes without background scroll
- [ ] YouTube plays in video modal (iPhone Safari)
- [ ] Add to Home Screen works
- [ ] No horizontal overflow at 375px width

---

## Browser support

Chrome, Safari, Firefox, Edge (current versions).  
Web Share API requires HTTPS (provided by Vercel).

---

## License

Proprietary — developed for Ahmed Hassan tour guide services.

---

**Built by [EOPeak](https://github.com/YOUR_USERNAME)** · Eng. Eslam Osama Saad
