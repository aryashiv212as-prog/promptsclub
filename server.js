const express = require('express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const DB = require('./data/db');
DB.init();

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// Setup upload directory
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'upload-' + uniqueSuffix + ext);
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

// Template Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(session({
    secret: 'promptsclub-super-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year session cookie
        httpOnly: true,
        sameSite: 'lax'
    }
}));

// Permanent Auth Helpers (survives server sleep, reboots and redeploys)
function setAuthCookie(res, user) {
    if (!user || !user.id || !user.password_hash) return;
    const token = `${user.id}:${user.password_hash.slice(-12)}`;
    res.cookie('pc_auth', token, {
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 Year Persistent Login
        httpOnly: true,
        sameSite: 'lax'
    });
}

function clearAuthCookie(res) {
    res.clearCookie('pc_auth');
}

// User authentication context middleware with auto-restore
app.use((req, res, next) => {
    let user = null;
    if (req.session && req.session.userId) {
        user = DB.getUserById(req.session.userId);
    }

    // Auto-restore session from permanent auth cookie if memory was wiped by server restart/sleep!
    if (!user && req.cookies && req.cookies.pc_auth) {
        try {
            const parts = req.cookies.pc_auth.split(':');
            const uid = parseInt(parts[0], 10);
            const hashSnippet = parts[1];
            const candidate = DB.getUserById(uid);
            if (candidate && candidate.password_hash && candidate.password_hash.slice(-12) === hashSnippet) {
                user = candidate;
                if (req.session) {
                    req.session.userId = user.id; // Restore session in memory
                }
            }
        } catch (e) {
            // ignore invalid cookie format
        }
    }

    res.locals.currentUser = user;
    res.locals.currentPath = req.path;
    res.locals.totalPrompts = DB.getPrompts().length;
    next();
});

// Helper for category aggregation
function getCategoriesWithCounts(prompts) {
    const map = {};
    prompts.forEach(p => {
        const cat = p.category || 'General';
        map[cat] = (map[cat] || 0) + 1;
    });
    return Object.keys(map).sort().map(cat => ({
        name: cat,
        count: map[cat]
    }));
}

// ─────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────

// 1. Homepage — Direct Master Prompts
app.get(['/', '/index.php'], (req, res) => {
    const allPrompts = DB.getPrompts();
    const categories = getCategoriesWithCounts(allPrompts).slice(0, 10);
    const prompts = allPrompts.slice(0, 24);

    res.render('index', {
        pageTitle: 'PromptsClub — Master Prompts Library',
        prompts,
        categories,
        totalPrompts: allPrompts.length
    });
});

// 2. Browse Prompts
app.get(['/browse.php', '/browse'], (req, res) => {
    let prompts = DB.getPrompts();
    const allCategories = getCategoriesWithCounts(prompts);

    const q = (req.query.q || '').trim().toLowerCase();
    const type = (req.query.type || '').trim().toLowerCase();
    const cat = (req.query.cat || '').trim();
    const sort = (req.query.sort || 'new').trim().toLowerCase();
    const page = Math.max(1, parseInt(req.query.pg || '1', 10));
    const pageSize = 15;

    // Filters
    if (q) {
        prompts = prompts.filter(p => 
            p.title.toLowerCase().includes(q) || 
            (p.category && p.category.toLowerCase().includes(q)) ||
            (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
        );
    }

    if (type === 'free') {
        prompts = prompts.filter(p => p.type === 'free');
    } else if (type === 'premium') {
        prompts = prompts.filter(p => p.type === 'premium');
    }

    if (cat) {
        prompts = prompts.filter(p => p.category && p.category.toLowerCase() === cat.toLowerCase());
    }

    // Sorting
    if (sort === 'old') {
        prompts.sort((a, b) => a.id - b.id);
    } else if (sort === 'az') {
        prompts.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'za') {
        prompts.sort((a, b) => b.title.localeCompare(a.title));
    } else {
        // newest first (highest id)
        prompts.sort((a, b) => b.id - a.id);
    }

    const totalCount = prompts.length;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const paginatedPrompts = prompts.slice((page - 1) * pageSize, page * pageSize);

    // Helper for pagination link URL building
    const getPageUrl = (pgNum) => {
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (type) params.set('type', type);
        if (cat) params.set('cat', cat);
        if (sort && sort !== 'new') params.set('sort', sort);
        params.set('pg', pgNum);
        return '/browse.php?' + params.toString();
    };

    res.render('browse', {
        pageTitle: 'Browse Prompts',
        prompts: paginatedPrompts,
        totalPrompts: totalCount,
        categories: allCategories,
        currentQuery: q,
        currentType: type,
        currentCat: cat,
        currentSort: sort,
        currentPage: page,
        totalPages: totalPages,
        getPageUrl
    });
});

// 3. Prompt Detail Page
app.get(['/prompt.php', '/prompt/:id'], (req, res) => {
    const id = req.query.id || req.params.id;
    if (!id) return res.redirect('/browse.php');

    const prompt = DB.getPromptById(id);
    if (!prompt) return res.status(404).send('Prompt not found');

    res.render('prompt', {
        pageTitle: prompt.title,
        prompt: prompt
    });
});

// 4. Community / Social Corner
app.get(['/community.php', '/community'], (req, res) => {
    const posts = DB.getPosts();
    res.render('community', {
        pageTitle: 'Community & Social Corner',
        posts: posts
    });
});

app.post('/community.php/create', upload.single('attachment'), (req, res) => {
    if (!req.session.userId) return res.redirect('/login.php?next=/community.php');
    const user = DB.getUserById(req.session.userId);
    if (!user || (!user.is_pro && user.role !== 'admin')) {
        return res.redirect('/pricing.php');
    }

    const text = (req.body.text || '').trim();
    if (!text) return res.redirect('/community.php');

    let imageUrl = null;
    if (req.file) {
        imageUrl = '/uploads/' + req.file.filename;
    }

    DB.addPost({
        user_id: user.id,
        author_name: user.name,
        author_avatar: user.name.charAt(0).toUpperCase(),
        is_creator: user.role === 'admin',
        created_at: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        text: text,
        image_url: imageUrl
    });

    res.redirect('/community.php');
});

app.post('/community.php/like', (req, res) => {
    if (!req.session.userId) return res.redirect('/login.php?next=/community.php');
    const postId = req.body.post_id;
    if (postId) {
        DB.toggleLikePost(postId, req.session.userId);
    }
    res.redirect('/community.php#post-' + postId);
});

app.post('/community.php/comment', (req, res) => {
    if (!req.session.userId) return res.redirect('/login.php?next=/community.php');
    const user = DB.getUserById(req.session.userId);
    const postId = req.body.post_id;
    const text = (req.body.comment_text || '').trim();

    if (postId && text && user) {
        DB.addComment(postId, {
            author: user.name,
            text: text,
            created_at: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        });
    }
    res.redirect('/community.php#post-' + postId);
});

// 5. Pricing / Join Community
app.get(['/pricing.php', '/pricing'], (req, res) => {
    const settings = DB.getSettings();
    res.render('pricing', {
        pageTitle: 'Join Community — Premium Access',
        settings: settings
    });
});

// 6. Auth - Login
app.get(['/login.php', '/login'], (req, res) => {
    if (res.locals.currentUser) {
        return res.redirect(req.query.next || '/browse.php');
    }
    res.render('login', {
        pageTitle: 'Login',
        error: null,
        email: '',
        nextUrl: req.query.next || '/browse.php'
    });
});

app.post(['/login.php', '/login'], (req, res) => {
    const { email, password, next } = req.body;
    const user = DB.getUserByEmail(email);

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return res.render('login', {
            pageTitle: 'Login',
            error: 'Invalid email or password.',
            email: email,
            nextUrl: next || '/browse.php'
        });
    }

    req.session.userId = user.id;
    setAuthCookie(res, user);
    res.redirect(next || '/browse.php');
});

// 7. Auth - Register
app.get(['/register.php', '/register'], (req, res) => {
    if (res.locals.currentUser) {
        return res.redirect(req.query.next || '/browse.php');
    }
    res.render('register', {
        pageTitle: 'Create Account',
        error: null,
        name: '',
        email: '',
        nextUrl: req.query.next || '/browse.php'
    });
});

app.post(['/register.php', '/register'], (req, res) => {
    const { name, email, password, next } = req.body;
    if (!name || !email || !password || password.length < 6) {
        return res.render('register', {
            pageTitle: 'Create Account',
            error: 'Please fill in all fields (password minimum 6 characters).',
            name: name,
            email: email,
            nextUrl: next || '/browse.php'
        });
    }

    const existing = DB.getUserByEmail(email);
    if (existing) {
        return res.render('register', {
            pageTitle: 'Create Account',
            error: 'An account with this email already exists.',
            name: name,
            email: email,
            nextUrl: next || '/browse.php'
        });
    }

    const newUser = DB.saveUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password_hash: bcrypt.hashSync(password, 10),
        role: 'user',
        is_pro: false,
        plan_expires: null,
        bookmarks: [],
        avatar: '',
        created_at: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    });

    req.session.userId = newUser.id;
    setAuthCookie(res, newUser);
    res.redirect(next || '/browse.php');
});

// 8. Auth - Logout
app.get(['/logout.php', '/logout'], (req, res) => {
    clearAuthCookie(res);
    req.session.destroy(() => {
        res.redirect('/');
    });
});

// 9. Account Dashboard
app.get(['/account.php', '/account'], (req, res) => {
    if (!res.locals.currentUser) return res.redirect('/login.php?next=/account.php');
    const user = res.locals.currentUser;
    const allPrompts = DB.getPrompts();
    const bookmarkedPrompts = allPrompts.filter(p => user.bookmarks && user.bookmarks.includes(p.id));

    res.render('account', {
        pageTitle: 'My Account',
        bookmarkedPrompts: bookmarkedPrompts
    });
});

app.post('/account.php/toggle-pro', (req, res) => {
    if (!res.locals.currentUser) return res.redirect('/login.php');
    const user = res.locals.currentUser;
    user.is_pro = !user.is_pro;
    user.plan_expires = user.is_pro ? '2027-12-31' : null;
    DB.saveUser(user);
    res.redirect('/account.php');
});

// 10. Admin Routes
function requireAdmin(req, res, next) {
    if (!res.locals.currentUser) {
        return res.redirect('/login.php?next=' + encodeURIComponent(req.originalUrl || '/admin'));
    }
    if (res.locals.currentUser.role !== 'admin') {
        return res.status(403).send(`
            <!DOCTYPE html>
            <html>
            <head><title>Admin Access Required</title><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin:0;padding:20px;background:#f8fafc;font-family:system-ui, -apple-system, sans-serif;display:flex;align-items:center;justify-content:center;min-height:90vh;">
                <div style="max-width:480px;width:100%;background:#fff;padding:36px;border-radius:18px;box-shadow:0 12px 30px rgba(0,0,0,0.08);text-align:center;border:1.5px solid #e2e8f0;">
                    <div style="font-size:44px;margin-bottom:14px;">🔒</div>
                    <h2 style="margin:0 0 10px;color:#0f172a;font-size:22px;">Administrator Access Required</h2>
                    <p style="color:#64748b;font-size:14px;line-height:1.6;margin-bottom:24px;">
                        Aap abhi <b>${res.locals.currentUser.email}</b> (${res.locals.currentUser.role}) ke taur par logged in hain.<br>
                        Admin panel sirf <b>shivamarya7783@gmail.com</b> ke liye accessible hai.
                    </p>
                    <div style="display:flex;flex-direction:column;gap:10px;">
                        <a href="/login.php?next=/admin" style="background:#7C5CFF;color:#fff;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:700;font-size:14px;display:block;">
                            👑 Switch &amp; Login as Admin (shivamarya7783@gmail.com)
                        </a>
                        <a href="/browse.php" style="background:#f1f5f9;color:#334155;text-decoration:none;padding:11px 20px;border-radius:12px;font-weight:600;font-size:14px;display:block;">
                            ← Back to Prompts Library
                        </a>
                    </div>
                </div>
            </body>
            </html>
        `);
    }
    next();
}

app.get('/admin', requireAdmin, (req, res) => {
    const prompts = DB.getPrompts();
    const users = DB.getUsers();
    const settings = DB.getSettings();
    const stats = {
        total: prompts.length,
        premium: prompts.filter(p => p.type === 'premium').length,
        free: prompts.filter(p => p.type === 'free').length,
        users: users.length
    };

    res.render('admin', {
        pageTitle: 'Admin Dashboard',
        prompts: prompts,
        users: users,
        stats: stats,
        settings: settings,
        saved: req.query.saved || null
    });
});

app.post('/admin/settings', requireAdmin, (req, res) => {
    const { paypal_client_id, paypal_mode, paypal_currency, price_monthly, price_inr, whatsapp_number, whatsapp_display } = req.body;
    DB.updateSettings({
        paypal_client_id: (paypal_client_id || '').trim(),
        paypal_mode: paypal_mode === 'live' ? 'live' : 'sandbox',
        paypal_currency: (paypal_currency || 'USD').trim().toUpperCase(),
        price_monthly: parseFloat(price_monthly) || 5,
        price_inr: parseInt(price_inr, 10) || 499,
        whatsapp_number: (whatsapp_number || '').trim(),
        whatsapp_display: (whatsapp_display || '').trim()
    });
    res.redirect('/admin?saved=settings');
});

app.get('/admin/new-prompt', requireAdmin, (req, res) => {
    res.render('admin_new_prompt', {
        pageTitle: 'Add New Prompt'
    });
});

app.post('/admin/new-prompt', requireAdmin, upload.single('image_file'), (req, res) => {
    const { title, category, type, master_prompt } = req.body;
    
    let finalImage = '/assets/img/cover.jpg';
    if (req.file) {
        finalImage = '/uploads/' + req.file.filename;
    }

    DB.savePrompt({
        title: (title || 'New Master Prompt').trim(),
        category: category || 'General',
        type: type || 'premium',
        image: finalImage,
        created_at: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        teaser: "This premium prompt includes the complete master prompt system — full scene structure, camera angles, timing breakdown, captions, viral hooks and reference storyboard images. Everything is ready to copy and paste into your AI video tool.",
        master_prompt: master_prompt || '',
        compatible_tools: ["Kling AI 1.5", "Runway Gen-3", "Seedance", "Luma Dream Machine"],
        tags: [category || "General", "AI Video", "Viral Reel", "4K Ultra-HD", "Master Prompt"],
        views: 1,
        likes: 0
    });

    res.redirect('/admin');
});

app.get('/admin/edit-prompt/:id', requireAdmin, (req, res) => {
    const prompt = DB.getPromptById(req.params.id);
    if (!prompt) return res.redirect('/admin');
    res.render('admin_edit_prompt', {
        pageTitle: `Edit Prompt: ${prompt.title}`,
        prompt: prompt
    });
});

app.post('/admin/edit-prompt/:id', requireAdmin, upload.single('image_file'), (req, res) => {
    const prompt = DB.getPromptById(req.params.id);
    if (!prompt) return res.redirect('/admin');

    const { title, category, type, master_prompt } = req.body;

    if (req.file) {
        prompt.image = '/uploads/' + req.file.filename;
    }

    prompt.title = (title || prompt.title).trim();
    if (category) prompt.category = category;
    if (type) prompt.type = type;
    if (master_prompt !== undefined) prompt.master_prompt = master_prompt;

    DB.savePrompt(prompt);
    res.redirect('/admin?saved=prompt');
});

app.post('/admin/delete-prompt', requireAdmin, (req, res) => {
    const id = req.body.prompt_id;
    if (id) DB.deletePrompt(id);
    res.redirect('/admin');
});

app.post('/admin/toggle-user-pro', requireAdmin, (req, res) => {
    const userId = req.body.user_id;
    const user = DB.getUserById(userId);
    if (user) {
        user.is_pro = !user.is_pro;
        user.plan_expires = user.is_pro ? '2027-12-31' : null;
        DB.saveUser(user);
    }
    res.redirect('/admin');
});

// 11. API Endpoints
app.post('/api/bookmark.php', (req, res) => {
    if (!res.locals.currentUser) return res.status(401).json({ error: 'Unauthorized' });
    const user = res.locals.currentUser;
    const pid = parseInt(req.body.id, 10);
    if (!user.bookmarks) user.bookmarks = [];

    const idx = user.bookmarks.indexOf(pid);
    let saved = false;
    if (idx >= 0) {
        user.bookmarks.splice(idx, 1);
        saved = false;
    } else {
        user.bookmarks.push(pid);
        saved = true;
    }
    DB.saveUser(user);
    res.json({ success: true, saved: saved, count: user.bookmarks.length });
});

app.post('/api/subscribe', (req, res) => {
    if (!res.locals.currentUser) return res.status(401).json({ error: 'Please login first' });
    const user = res.locals.currentUser;
    user.is_pro = true;
    user.plan_expires = '2027-12-31';
    DB.saveUser(user);
    res.json({ success: true, message: 'Membership active!' });
});

app.post('/api/paypal/capture-order', (req, res) => {
    if (!res.locals.currentUser) return res.status(401).json({ error: 'Please login first' });
    const user = res.locals.currentUser;
    const { orderID, payerID } = req.body;

    user.is_pro = true;
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    user.plan_expires = expiry.toISOString().split('T')[0];

    if (!user.payments) user.payments = [];
    user.payments.push({
        method: 'paypal',
        order_id: orderID || ('PAYPAL-' + Date.now()),
        payer_id: payerID || '',
        date: new Date().toISOString(),
        amount: DB.getSettings().price_monthly || 5,
        currency: DB.getSettings().paypal_currency || 'USD'
    });

    DB.saveUser(user);
    res.json({ success: true, message: 'PayPal payment verified! Pro subscription activated.' });
});

app.get('/api/load_more.php', (req, res) => {
    const type = req.query.type || 'premium';
    const offset = parseInt(req.query.offset || '0', 10);
    const limit = 6;

    const all = DB.getPrompts().filter(p => p.type === type);
    const slice = all.slice(offset, offset + limit);

    let html = '';
    slice.forEach(p => {
        html += `
        <a class="prow" href="/prompt.php?id=${p.id}">
            <div class="prow-thumb">
                <img src="${p.image}" alt="" loading="lazy" width="660" height="371" onerror="this.src='/assets/img/cover.jpg'">
                <span class="prow-file-badge">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </span>
            </div>
            <div class="prow-body">
                <h3>${p.title}</h3>
                <span class="prow-cat">🗂 ${p.category}</span>
                <span class="prow-price ${p.type === 'free' ? 'is-free' : ''}">${p.type === 'free' ? 'Free' : 'Premium'}</span>
                <span class="prow-btn ${p.type === 'free' ? 'prow-btn-free' : ''}">${p.type === 'free' ? 'Get access' : 'Join to unlock'}</span>
            </div>
        </a>`;
    });

    res.json({
        html: html,
        count: slice.length,
        has_more: offset + limit < all.length
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 PromptsClub (promptsclub.com) running on port ${PORT}`);
    console.log(`👉 Local URL: http://localhost:${PORT}`);
    console.log(`👉 Browse URL: http://localhost:${PORT}/browse.php`);
    console.log(`👉 Community: http://localhost:${PORT}/community.php`);
    console.log(`👉 Pricing: http://localhost:${PORT}/pricing.php`);
    console.log(`👉 Admin Dashboard: http://localhost:${PORT}/admin`);
    console.log(`👑 Admin Credentials: shivamarya7783@gmail.com / shivam77830`);
    console.log(`====================================================`);
});
