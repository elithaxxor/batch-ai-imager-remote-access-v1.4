"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// Root route
router.get('/', (req, res) => {
    res.json({
        message: 'WSB Trading API Server',
        version: '1.0.0',
        protocol: req.protocol,
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
            api: '/api',
            docs: '/api/docs',
            health: '/api/health'
        }
    });
});
// 404 handler
router.use((_req, res) => {
    res.status(404).json({
        error: 'Not Found',
        path: _req.path
    });
});
exports.default = router;
