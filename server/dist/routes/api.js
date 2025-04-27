"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const os_1 = __importDefault(require("os"));
const router = (0, express_1.Router)();
// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        protocol: req.protocol,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});
// Diagnostic endpoint for debugging connection issues
router.get('/diagnostic', (req, res) => {
    const diagnostic = {
        server: {
            hostname: os_1.default.hostname(),
            platform: os_1.default.platform(),
            uptime: os_1.default.uptime(),
            memory: {
                total: os_1.default.totalmem(),
                free: os_1.default.freemem()
            },
            cpus: os_1.default.cpus().length,
            nodeVersion: process.version,
            env: process.env.NODE_ENV
        },
        request: {
            ip: req.ip,
            protocol: req.protocol,
            secure: req.secure,
            method: req.method,
            path: req.path,
            headers: req.headers,
            query: req.query
        },
        timestamp: new Date().toISOString()
    };
    res.json(diagnostic);
});
// Documentation endpoint
router.get('/docs', (_req, res) => {
    res.json({
        openapi: '3.0.0',
        info: {
            title: 'WSB Trading API',
            version: '1.0.0',
            description: 'Secure API for WSB Trading platform'
        },
        security: [
            { apiKey: [] }
        ],
        components: {
            securitySchemes: {
                apiKey: {
                    type: 'apiKey',
                    name: 'x-api-key',
                    in: 'header'
                }
            }
        }
    });
});
exports.default = router;
