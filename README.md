# PromptsClub 🚀 (promptsclub.com)

A complete, production-ready viral AI video prompts library and community platform.

Built with **Node.js, Express, EJS, and Vanilla CSS** with PayPal integration, Admin CMS, and instant member unlocking.

---

## 🌟 Features Included

### 1. Browse All Prompts (`/browse.php`)
- **364 Real Prompts Catalog** with original high-resolution thumbnail images downloaded from `soniprompts.com`.
- **Live Search**: Instant keyword search matching titles, categories, and tags.
- **Sort Options**:
  - Newest First
  - Oldest First
  - Name A–Z
  - Name Z–A
- **Filter Pills**:
  - All Prompts
  - 🎁 Free Prompts
  - ⭐ Premium Prompts
- **Category Filter Pills** with real counts:
  - Animal & Pets (48)
  - Fantasy & Sci-Fi (27)
  - Sports & Action (25)
  - ASMR & Satisfying (24)
  - Comedy & Entertainment (24)
  - Art & Animation (23)
  - Nature & Wildlife (19)
  - Kids & Family (16)
  - DIY & Crafts (15)
  - Historical & Nostalgia (13)
  - Emotional & Inspirational (13)
  - Food & Cooking (7)
  - General (100+)
- **Pagination**: Fully responsive page navigation.
- **Membership Status Banner**: Dynamic banner showing upgrade call-to-action for guests and `⭐ PRO UNLOCKED` for subscribers.

### 2. Prompt Detail Page (`/prompt.php?id=...`)
- **Locked State** (for non-pro or guests on premium prompts): Teaser description, locked padlock panel, upgrade to Pro button ($5/mo), and login links.
- **Unlocked State** (for Pro users or free prompts):
  - **Full Master Prompt System**: Comprehensive scene breakdown (Hook, Action/Transformation, Climax, Resolution), camera angles, daVinci grading instructions, negative prompts.
  - **One-Click Copy Button**: Copies full prompt to clipboard with smooth toast notification.
  - **Bookmark / Save Button**: Save favorite prompts to your user dashboard.
  - **Recommended AI Tools**: Kling AI 1.5, Runway Gen-3, Seedance, Luma Dream Machine, Hailuo / Minimax.
  - **Image Lightbox**: Click storyboard preview images to inspect full size.

### 3. Homepage (`/`)
- **Hero Banner Slider**: 6 rotating cover slides with smooth transitions.
- **Creator Profile Strip**: Profile avatar, blue verified badge, author title and byline.
- **Free Prompts List**: Quick access rows with file badges.
- **Premium Prompts List**: Featured premium rows with "Join to unlock" buttons.
- **Load More Prompts**: AJAX dynamic loading.

### 4. Social Corner / Community (`/community.php`)
- **Feed**: Creator announcements (with `Creator ✔` badge), member discussions, prompt tips.
- **Post Composer**: Pro members and admins can publish posts with media/storyboard attachments.
- **Likes System**: Interactive like button with counter.
- **Comments**: Toggle comments, write replies to any post.
- **Share Link**: One-click URL copying with toast popup.

### 5. Pricing & Membership (`/pricing.php`)
- **$5/month or ₹499/month** membership card.
- Checklist of benefits and features.
- Trust badges (Secure payments, Instant access, Cancel anytime).
- WhatsApp support link (`+91 91314 21048`).
- Instant 1-click Pro subscription activation (with Razorpay ready endpoints).

### 6. User Authentication & Dashboard
- **Login (`/login.php`)** & **Register (`/register.php`)**: Secure bcrypt password hashing.
- **Quick 1-Click Demo Login Buttons** on login page for effortless pair programming.
- **My Account (`/account.php`)**: View plan status, renewal date, saved bookmarked prompts, and a 1-click test toggle between Free and Pro.

### 7. Admin Dashboard (`/admin`)
- Accessible only to administrators (`admin@soniprompts.com`).
- View real-time platform statistics (Total prompts, Premium count, Free count, Total users).
- **Payment & PayPal Configuration**: Directly enter your PayPal Client ID, select Sandbox or Live mode, set pricing ($5 or ₹499), and WhatsApp contact info right in the dashboard.
- **User Management & Manual Access**: View all registered users, grant or revoke Pro membership with 1 click (`Grant Pro` / `Revoke Pro`).
- **Prompts Management**: Real-time keyword filter search across all prompts, with 1-click Delete buttons.
- **Add New Prompt (`/admin/new-prompt`)**: Create and publish new prompts with title, category, type (free/premium), image file upload or URL, teaser, master prompt script, tools, and keywords.

### 8. PayPal Payment Gateway Integration
- **Official PayPal Smart Payment Buttons**: Supports PayPal wallet and Credit/Debit cards worldwide.
- **Direct to your Account**: Money goes straight to your PayPal balance.
- **Instant Automatic Unlock**: Once payment is approved, the user's account is automatically upgraded to `⭐ PRO` and redirects them to the unlocked prompts library!

---

## 🚀 How to Run Locally

1. Open PowerShell or terminal in the project directory:
   ```bash
   cd "C:\Users\SHIVAM KUMAR\Desktop\kjhgfd"
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Open your browser:
   - **Homepage**: [http://localhost:3000/](http://localhost:3000/)
   - **Browse All Prompts**: [http://localhost:3000/browse.php](http://localhost:3000/browse.php)
   - **Social Corner**: [http://localhost:3000/community.php](http://localhost:3000/community.php)
   - **Pricing**: [http://localhost:3000/pricing.php](http://localhost:3000/pricing.php)
   - **Admin Panel**: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 🔑 Pre-Configured Accounts

| Role | Email | Password | Access |
|---|---|---|---|
| **Admin / Creator** | `admin@promptsclub.com` *(or `admin@soniprompts.com`)* | `admin123` | Full Admin + Pro Access |
| **Pro Member** | `pro@example.com` | `user123` | Unlocked Master Prompts + Community Posting |
| **Free User** | `free@example.com` | `user123` | Free Prompts + Community Liking |

*(Or register any new account on `/register.php`!)*

---

## 📥 Importing Real Master Prompts Using Your Pro Account

Since you already have a Pro plan on `soniprompts.com`, you can extract 100% of the real master prompts and scene breakdowns:

### Method 1: Using Session Cookie (Recommended & Fastest)
1. Log into your account on [soniprompts.com](https://soniprompts.com).
2. Open Chrome DevTools (`F12`) -> Go to **Application** -> **Cookies** -> `https://soniprompts.com`.
3. Copy the value of the cookie named `PHPSESSID`.
4. In terminal run:
   ```bash
   python scrape_pro_prompts.py cookie YOUR_PHPSESSID_VALUE
   ```

### Method 2: Using Login Email & Password
In terminal run:
```bash
python scrape_pro_prompts.py login your_email@example.com your_password
```

This will automatically loop through all 364 prompts and update `data/prompts.json` with the exact unlocked master prompts!
