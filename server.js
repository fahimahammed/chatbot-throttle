import express from "express";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import { generateText } from 'ai';
import { createOpenAI } from "@ai-sdk/openai";
import fs from "fs";
import path from "path";
import { RATE_LIMITS, WINDOW_MS } from "./constants.js";
import config from "./config.js";

const app = express();
app.use(bodyParser.json());

const usageStore = new Map(); // { key: { count, windowStart } }

// load users data
const usersFile = path.resolve("./users.json");
const users = JSON.parse(fs.readFileSync(usersFile, "utf8"));

const openai = createOpenAI({
    apiKey: config.OPENAI_API_KEY
});

function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        req.user = { type: "guest" };
        return next();
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        req.user = decoded;
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: err?.message || "Invalid token.",
            error: err
        });
    }
    next();
}

// rate limiter
function rateLimiter(req, res, next) {
    const userType = req.user?.type || "guest";
    const key = req.user?.id || req.ip;

    const limit = RATE_LIMITS[userType];
    const currentTime = Date.now();

    let entry = usageStore.get(key);

    if (!usageStore.get(key)) {
        entry = { count: 1, windowStart: currentTime };
    } else {
        if (currentTime - entry.windowStart < WINDOW_MS) {
            entry.count += 1;
        } else {
            entry = { count: 1, windowStart: currentTime };
        }
    }

    if (entry.count > limit) {
        return res.status(429).json({
            success: false,
            error: `Too many requests. ${userType} users can make ${limit} requests per hour.`,
            remaining_requests: 0,
        });
    }

    usageStore.set(key, entry);

    req.rateInfo = {
        remaining: limit - entry.count,
        limit,
    };

    next();
}


// login
app.post("/api/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(401).json({
            success: false,
            message: "Username and Password are required!",
            error: "Invalid login request"
        })
    }

    const user = users.find((u) => u.username === username && u.password === password);

    if (!user) {
        return res.status(403).json({
            success: false,
            message: "Invalid username or password!",
            error: "Invalid login request"
        })
    }

    const token = jwt.sign(
        { id: user.id, type: user.type },
        config.JWT_SECRET,
        { expiresIn: config.JWT_EXPIRES_IN }
    );
    res.json({
        success: true,
        message: "User logged in successfully!",
        token
    });
});

// Chat 
app.post("/api/chat", authenticate, rateLimiter, async (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ success: false, error: "Message is required" });
    }

    try {
        const response = await generateText({
            model: openai("gpt-4o-mini"),
            prompt: message,
        });

        res.json({
            success: true,
            message: response.text,
            remaining_requests: req.rateInfo.remaining,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err?.message || "Request failed!",
            error: err
        });
    }
});

// Status
app.get("/api/status", authenticate, (req, res) => {
    const userType = req.user?.type || "guest";
    const key = req.user?.id || req.ip;
    const limit = RATE_LIMITS[userType];

    const entry = usageStore.get(key);
    const remaining = entry ? Math.max(limit - entry.count, 0) : limit;

    res.json({
        success: true,
        message: `You are requested as ${userType} user & your maximum request limit is ${limit} AI questions per hour.`,
        remaining_requests: remaining
    });
});


app.listen(config.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${config.PORT}`);
});
