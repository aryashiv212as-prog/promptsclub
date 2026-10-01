const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const PROMPTS_FILE = path.join(DATA_DIR, 'prompts.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

function readJSON(file, defaultVal) {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify(defaultVal, null, 2), 'utf-8');
        return defaultVal;
    }
    try {
        const raw = fs.readFileSync(file, 'utf-8');
        return JSON.parse(raw);
    } catch (e) {
        console.error('Error reading JSON:', file, e);
        return defaultVal;
    }
}

function writeJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

// Master prompt template generator for realistic AI video engines
function generateRealisticMasterPrompt(title, category) {
    return {
        master_prompt: `[STYLE & ENGINE INSTRUCTION: Master Video Generation Engine v1.0 - Seedance / Kling AI / Luma / Runway Gen-3]
Cinematic high-octane 4K video sequence, photorealistic rendering, hyper-detailed textures, volumetric atmospheric lighting, professional motion blur, 24fps film aesthetic, shot on Arri Alexa LF 35mm lens, f/1.8 bokeh, color graded in DaVinci Resolve.

[SCENE BREAKDOWN - 30 SECONDS TOTAL]
■ Scene 1 (00:00 - 00:05) — THE HOOK:
Ultra-fast dynamic zoom-in. Intense establishing shot centered on ${title}. Dramatic lighting casts moody rim light across the main subject. Ambient environmental dust particles glowing in sunbeams.

■ Scene 2 (00:05 - 00:15) — THE ACTION / TRANSFORMATION:
Smooth tracking dolly shot following the primary movement with fluid physics and natural momentum. Intricate micro-details visible in high definition. Dynamic slow-motion shutter burst at the key visual turning point.

■ Scene 3 (00:15 - 00:25) — THE CLIMAX / EMOTION:
Low-angle heroic camera pan with sweeping cinematic arc. Emotionally resonant lighting shift, golden hour rim reflections, high contrast and depth of field separating the subject from the dramatic background.

■ Scene 4 (00:25 - 00:30) — THE RESOLUTION / CALL TO ACTION:
Subtle slow push-in, lingering impactful final frame designed for seamless loop playback on Facebook Reels, YouTube Shorts, and TikTok.

[CAMERA & TECHNICAL SPECS]
• Camera Movement: Continuous smooth gimbal tracking + Dutch angle dynamic tilt
• Lighting: 3-point cinematic studio lighting with neon rim highlights & soft atmospheric haze
• Aspect Ratio: 9:16 (Vertical Reel/Shorts/TikTok) or 16:9 (Cinematic)
• Negative Prompt: low quality, blurry, distorted anatomy, jitter, frame stutter, watermark, oversaturated artifacts, bad physics
• Best Video Engines: Kling 1.5, Runway Gen-3 Alpha, Hailuo / Minimax, Luma Dream Machine, Seedance AI`,
        tags: [category, "AI Video", "Viral Reel", "TikTok", "Kling AI", "Runway Gen-3", "4K Ultra-HD", "Master Prompt"],
        compatible_tools: ["Kling AI 1.5", "Runway Gen-3", "Seedance", "Luma Dream Machine", "Hailuo / Minimax", "Midjourney v6.1"]
    };
}

// Initialize database
function initDatabase() {
    // 1. Settings
    const defaultSettings = {
        site_name: "PromptsClub",
        domain: "promptsclub.com",
        author_name: "PromptsClub",
        tagline: "Viral AI video prompts library — promptsclub.com",
        price_monthly: 10,
        price_currency: "$",
        paypal_currency: "USD",
        paypal_client_id: "BAActOc_BqVIzW1R-ONYs4X0ck3sDIIvnWzPPgCOYBWUyGn-25JLDg-W_DhEFSE7HuCYClxtzC4lqdaIxk",
        paypal_mode: "live",
        price_inr: 899,
        whatsapp_number: "919341266089",
        whatsapp_display: "+91 9341266089"
    };
    readJSON(SETTINGS_FILE, defaultSettings);

    // 2. Users
    let users = readJSON(USERS_FILE, []);
    if (users.length === 0) {
        const adminHash = bcrypt.hashSync("shivam77830", 10);
        const proHash = bcrypt.hashSync("user123", 10);
        users = [
            {
                id: 1,
                name: "Shivam Arya",
                email: "shivamarya7783@gmail.com",
                password_hash: adminHash,
                role: "admin",
                is_pro: true,
                plan_expires: "2099-12-31",
                bookmarks: [371, 370],
                avatar: "/assets/img/avatar.png",
                created_at: "2026-08-01"
            },
            {
                id: 2,
                name: "Demo Pro Member",
                email: "pro@example.com",
                password_hash: proHash,
                role: "user",
                is_pro: true,
                plan_expires: "2027-12-31",
                bookmarks: [371, 287],
                avatar: "",
                created_at: "2026-09-01"
            },
            {
                id: 3,
                name: "Free Member",
                email: "free@example.com",
                password_hash: proHash,
                role: "user",
                is_pro: false,
                plan_expires: null,
                bookmarks: [],
                avatar: "",
                created_at: "2026-09-15"
            }
        ];
        writeJSON(USERS_FILE, users);
    }

    // 3. Prompts
    let prompts = readJSON(PROMPTS_FILE, []);
    if (prompts.length === 0) {
        // Check if scraped_prompts.json exists
        const scrapedFile = path.join(__dirname, '..', 'scraped_prompts.json');
        if (fs.existsSync(scrapedFile)) {
            try {
                const scraped = JSON.parse(fs.readFileSync(scrapedFile, 'utf-8'));
                prompts = scraped.map(p => {
                    const extra = generateRealisticMasterPrompt(p.title, p.category);
                    return {
                        ...p,
                        teaser: "This premium prompt includes the complete master prompt system — full scene structure, camera angles, timing breakdown, captions, viral hooks and reference storyboard images. Everything is ready to copy and paste into your AI video tool. Members get instant access to this and every other prompt in the library, plus all new weekly drops.",
                        master_prompt: extra.master_prompt,
                        tags: extra.tags,
                        compatible_tools: extra.compatible_tools,
                        views: Math.floor(Math.random() * 800) + 120,
                        likes: Math.floor(Math.random() * 85) + 12
                    };
                });
            } catch (err) {
                console.error("Failed to load scraped prompts:", err);
            }
        }

        // If still empty, supply rich starter prompts
        if (prompts.length === 0) {
            const seedList = [
                {
                    id: 371,
                    title: "WILD RESCUE ENGINE — MASTER PROMPT v1.0",
                    category: "Animal & Pets",
                    type: "premium",
                    image: "/uploads/4944aebe0bee97583e49efb0.png",
                    created_at: "2026-09-30"
                },
                {
                    id: 370,
                    title: "SECRET GRANDMA ENGINE — MASTER PROMPT v1.0",
                    category: "Fantasy & Sci-Fi",
                    type: "premium",
                    image: "/uploads/5752848d42f22dad03ee4a86.png",
                    created_at: "2026-09-29"
                },
                {
                    id: 369,
                    title: "30s FIRST MOMENTS ENGINE — MASTER PROMPT v1.0",
                    category: "Kids & Family",
                    type: "premium",
                    image: "/uploads/52e2f0e9aa18eb8884c9c516.png",
                    created_at: "2026-09-28"
                },
                {
                    id: 368,
                    title: "30 sec PAWS OF HONOR ENGINE — MASTER PROMPT v1.0",
                    category: "Animal & Pets",
                    type: "premium",
                    image: "/uploads/98a0a1551072fa18cd8602b1.png",
                    created_at: "2026-09-27"
                },
                {
                    id: 367,
                    title: "CLOWN MAGIC ENGINE — MASTER PROMPT v1.0",
                    category: "Comedy & Entertainment",
                    type: "premium",
                    image: "/uploads/5daf2c9c443d3dc64c79c8a7.png",
                    created_at: "2026-09-26"
                },
                {
                    id: 366,
                    title: "GRAND ILLUSION ENGINE — MASTER PROMPT v1.0",
                    category: "Comedy & Entertainment",
                    type: "premium",
                    image: "/uploads/a137b9611a5127ee9a0d5fc2.png",
                    created_at: "2026-09-25"
                },
                {
                    id: 365,
                    title: "30SEC American Farmland Firefight",
                    category: "General",
                    type: "premium",
                    image: "/uploads/72ac8c5228d00b5f3d1030f6.png",
                    created_at: "2026-09-24"
                },
                {
                    id: 364,
                    title: "30 sec BOSS PET ENGINE — MASTER PROMPT v1.0",
                    category: "Animal & Pets",
                    type: "premium",
                    image: "/uploads/e83e811e4dc772e07ee79adc.png",
                    created_at: "2026-09-23"
                },
                {
                    id: 315,
                    title: "Anti-Detect Studio FREE Download | Facebook & TikTok Content Monetization Setup Guide",
                    category: "General",
                    type: "free",
                    image: "/uploads/53f2294d026acb26aee730e5.png",
                    created_at: "2026-09-10"
                },
                {
                    id: 287,
                    title: "30SEC USA TOP VIRAL 3DCARTOON Cosmic Clucks v1",
                    category: "Art & Animation",
                    type: "free",
                    image: "/uploads/eadfccbed4b6ab210ff06c51.png",
                    created_at: "2026-09-06"
                },
                {
                    id: 270,
                    title: "30-SECOND GIANT BEEHIVE",
                    category: "Nature & Wildlife",
                    type: "free",
                    image: "/uploads/c7c5ce2f29fdf9f62e2a2545.png",
                    created_at: "2026-09-01"
                },
                {
                    id: 264,
                    title: "Unlimited Nano Banana Bulk Image Generation Tool | Free Download + No Watermark",
                    category: "General",
                    type: "free",
                    image: "/uploads/dbe9af5b03ccb2169b2cea73.png",
                    created_at: "2026-08-28"
                }
            ];

            prompts = seedList.map(p => {
                const extra = generateRealisticMasterPrompt(p.title, p.category);
                return {
                    ...p,
                    teaser: "This premium prompt includes the complete master prompt system — full scene structure, camera angles, timing breakdown, captions, viral hooks and reference storyboard images. Everything is ready to copy and paste into your AI video tool. Members get instant access to this and every other prompt in the library, plus all new weekly drops.",
                    master_prompt: extra.master_prompt,
                    tags: extra.tags,
                    compatible_tools: extra.compatible_tools,
                    views: 450,
                    likes: 38
                };
            });
        }
        writeJSON(PROMPTS_FILE, prompts);
    }

    // 4. Community Posts
    let posts = readJSON(POSTS_FILE, []);
    if (posts.length === 0) {
        posts = [
            {
                id: 8,
                user_id: 1,
                author_name: "shlendrasoni",
                author_avatar: "S",
                is_creator: true,
                created_at: "30 Aug 2026 · 07:01",
                text: `## MASTER PROMPT USE GUIDE\n\nA Master Prompt is not a normal one-time prompt. It is a complete reusable AI system where the character, camera style, story DNA, duration, audio, continuity, negative rules, and output format are already defined.\n\n**Simple workflow:**\n\n1. Open a new ChatGPT or Claude chat and paste the complete Master Prompt.\n2. Type: **“Give me 10 topics.”**\n3. Select your favorite idea: **“Topic 4.”**\n4. Then type: **“Make full prompt.”**\n5. For changes, do not paste the full Master Prompt again. Simply say: **“Keep everything the same, change the location,” “make the hook stronger,” “make it 15 seconds,” “make the ending funnier,” or “keep the same character.”**\n6. For more ideas, type: **“Give me 10 more topics”** or **“Next video.”**\n\nThink of the Master Prompt as your permanent **Creative Director + Script Writer + Camera Director + Prompt Engineer.**\n\n**The Master Prompt defines HOW to create.\nYour next command defines WHAT to create.**\n\nFor a new chat, paste the Master Prompt again for the safest workflow.`,
                image_url: null,
                likes: 19,
                liked_by: [],
                comments: [
                    {
                        id: 1,
                        author: "John",
                        text: "Hello bhai iske jaise promte bna do aur page name Look in History",
                        created_at: "30 Aug 2026"
                    }
                ]
            },
            {
                id: 5,
                user_id: 4,
                author_name: "Arman",
                author_avatar: "A",
                is_creator: false,
                created_at: "22 Aug 2026 · 07:52",
                text: "post viral nahi ho raha keya karu bhai?",
                image_url: null,
                likes: 7,
                liked_by: [],
                comments: [
                    {
                        id: 2,
                        author: "Shailendra Soni",
                        text: "Bhai hook pe focus karo! 0-3 second ka visual zoom and audio hook use karo jo Master Prompt mein diya hai.",
                        created_at: "22 Aug 2026"
                    }
                ]
            },
            {
                id: 4,
                user_id: 5,
                author_name: "Gobango",
                author_avatar: "G",
                is_creator: false,
                created_at: "22 Aug 2026 · 05:30",
                text: "story board ko kaisay use krein kisi bhi prompt say video generation ky liye",
                image_url: null,
                likes: 4,
                liked_by: [],
                comments: []
            }
        ];
        writeJSON(POSTS_FILE, posts);
    }
}

// Data Access API
const DB = {
    init: initDatabase,

    getPrompts: () => readJSON(PROMPTS_FILE, []),
    setPrompts: (prompts) => writeJSON(PROMPTS_FILE, prompts),

    getPromptById: (id) => {
        const prompts = readJSON(PROMPTS_FILE, []);
        return prompts.find(p => p.id === parseInt(id));
    },

    savePrompt: (prompt) => {
        const prompts = readJSON(PROMPTS_FILE, []);
        const idx = prompts.findIndex(p => p.id === prompt.id);
        if (idx >= 0) {
            prompts[idx] = { ...prompts[idx], ...prompt };
        } else {
            prompt.id = prompts.length ? Math.max(...prompts.map(p => p.id)) + 1 : 1;
            prompts.unshift(prompt);
        }
        writeJSON(PROMPTS_FILE, prompts);
        return prompt;
    },

    deletePrompt: (id) => {
        let prompts = readJSON(PROMPTS_FILE, []);
        prompts = prompts.filter(p => p.id !== parseInt(id));
        writeJSON(PROMPTS_FILE, prompts);
    },

    getUsers: () => readJSON(USERS_FILE, []),
    getUserById: (id) => {
        const users = readJSON(USERS_FILE, []);
        return users.find(u => u.id === parseInt(id));
    },
    getUserByEmail: (email) => {
        const users = readJSON(USERS_FILE, []);
        const clean = (email || '').toLowerCase().trim();
        return users.find(u => (u.email || '').toLowerCase().trim() === clean);
    },
    saveUser: (user) => {
        const users = readJSON(USERS_FILE, []);
        const idx = users.findIndex(u => u.id === user.id);
        if (idx >= 0) {
            users[idx] = { ...users[idx], ...user };
        } else {
            user.id = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
            users.push(user);
        }
        writeJSON(USERS_FILE, users);
        return user;
    },

    getPosts: () => readJSON(POSTS_FILE, []),
    addPost: (post) => {
        const posts = readJSON(POSTS_FILE, []);
        post.id = posts.length ? Math.max(...posts.map(p => p.id)) + 1 : 1;
        post.likes = 0;
        post.liked_by = [];
        post.comments = [];
        posts.unshift(post);
        writeJSON(POSTS_FILE, posts);
        return post;
    },
    toggleLikePost: (postId, userId) => {
        const posts = readJSON(POSTS_FILE, []);
        const post = posts.find(p => p.id === parseInt(postId));
        if (!post) return null;
        if (!post.liked_by) post.liked_by = [];
        const uIdx = post.liked_by.indexOf(userId);
        if (uIdx >= 0) {
            post.liked_by.splice(uIdx, 1);
            post.likes = Math.max(0, post.likes - 1);
        } else {
            post.liked_by.push(userId);
            post.likes = (post.likes || 0) + 1;
        }
        writeJSON(POSTS_FILE, posts);
        return post;
    },
    addComment: (postId, comment) => {
        const posts = readJSON(POSTS_FILE, []);
        const post = posts.find(p => p.id === parseInt(postId));
        if (!post) return null;
        if (!post.comments) post.comments = [];
        comment.id = post.comments.length ? Math.max(...post.comments.map(c => c.id)) + 1 : 1;
        post.comments.push(comment);
        writeJSON(POSTS_FILE, posts);
        return post;
    },

    getSettings: () => readJSON(SETTINGS_FILE, {}),
    updateSettings: (newSettings) => {
        const curr = readJSON(SETTINGS_FILE, {});
        const updated = { ...curr, ...newSettings };
        writeJSON(SETTINGS_FILE, updated);
        return updated;
    }
};

module.exports = DB;
