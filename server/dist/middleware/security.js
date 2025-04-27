"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.sanitizeRequest = exports.apiKeyAuth = exports.configureSecurityMiddleware = void 0;
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const hpp_1 = __importDefault(require("hpp"));
/**
 * Configure security middleware for Express application
 */
const configureSecurityMiddleware = (app) => {
    // Basic security headers with Helmet, but allow inline scripts for development
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:"],
                connectSrc: ["'self'", "ws:", "wss:"],
                fontSrc: ["'self'"]
            }
        }
    }));
    // Set permissive CORS policy for development
    app.use((0, cors_1.default)({
        origin: '*', // Allow all origins for testing
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
        credentials: true,
        maxAge: 86400 // 24 hours
    }));
    // Rate limiting configuration
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per windowMs
        message: { error: 'Too many requests, please try again later' },
        standardHeaders: true,
        legacyHeaders: false
    });
    // Apply rate limiting to API routes
    app.use('/api', limiter);
    // Prevent HTTP Parameter Pollution
    app.use((0, hpp_1.default)());
    // Force HTTPS in production
    app.use((req, res, next) => {
        if (process.env.NODE_ENV === 'production' && !req.secure) {
            return res.redirect('https://' + req.headers.host + req.url);
        }
        next();
    });
    // Add security headers
    app.use((req, res, next) => {
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Feature-Policy', "camera 'none'; microphone 'none'");
        next();
    });
    // Prevent clickjacking
    app.use((req, res, next) => {
        res.setHeader('X-Frame-Options', 'DENY');
        next();
    });
};
exports.configureSecurityMiddleware = configureSecurityMiddleware;
/**
 * Middleware to verify API keys
 */
const apiKeyAuth = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.API_KEY) {
        return res.status(401).json({
            error: 'Unauthorized: Invalid API key'
        });
    }
    next();
};
exports.apiKeyAuth = apiKeyAuth;
/**
 * Middleware to sanitize request data
 */
const sanitizeRequest = (req, res, next) => {
    // Remove any potential XSS content from request body
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = req.body[key]
                    .replace(/[<>]/g, '') // Remove < and >
                    .replace(/javascript:/gi, '') // Remove javascript: protocol
                    .trim();
            }
        });
    }
    next();
};
exports.sanitizeRequest = sanitizeRequest;
/**
 * Error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'Internal Server Error'
            : err.message
    });
};
exports.errorHandler = errorHandler;
