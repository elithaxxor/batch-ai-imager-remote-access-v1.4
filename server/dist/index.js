"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const https_1 = __importDefault(require("https"));
const http_1 = __importDefault(require("http"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const winston_1 = __importDefault(require("winston"));
const websocket_1 = require("./websocket");
const security_1 = require("./middleware/security");
const api_1 = __importDefault(require("./routes/api"));
const root_1 = __importDefault(require("./routes/root"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
// Use port from environment variable or fallback to 8000
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000;
// Setup Winston logger
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.printf(({ timestamp, level, message }) => {
        return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })),
    transports: [
        new winston_1.default.transports.Console()
    ]
});
// Trust proxy - required for rate limiter behind reverse proxy
app.set('trust proxy', 1);
// Logging middleware using morgan, integrated with winston
app.use((0, morgan_1.default)('combined', {
    stream: {
        write: (message) => logger.info(message.trim())
    }
}));
// Compression middleware for static files and responses
app.use((0, compression_1.default)());
// Body parsing middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Apply security middleware
(0, security_1.configureSecurityMiddleware)(app);
// Apply request sanitization
app.use(security_1.sanitizeRequest);
// Memory usage monitoring
const checkMemoryUsage = () => {
    const used = process.memoryUsage();
    const memoryUsagePercent = (used.heapUsed / used.heapTotal) * 100;
    if (memoryUsagePercent > 85) {
        logger.warn(`⚠️ High memory usage: ${memoryUsagePercent.toFixed(2)}%`);
        // TODO: Add alerting mechanism if needed
    }
    return memoryUsagePercent;
};
// Monitor memory usage every 30 seconds
setInterval(checkMemoryUsage, 30000);
// Serve static files from server directory (for testing)
app.use(express_1.default.static(path_1.default.join(__dirname, '../'), {
    maxAge: '1h',
    fallthrough: true,
    redirect: false
}));
// Serve static files from React app's public directory
const clientPublicPath = path_1.default.join(__dirname, '../../client/public');
app.use(express_1.default.static(clientPublicPath, {
    maxAge: '1h',
    fallthrough: true,
    redirect: false
}));
// Mount API routes
app.use('/api', api_1.default);
// Mount root routes
app.use('/', root_1.default);
// Global error handler
app.use(security_1.errorHandler);
// Create and start server with proper error handling
const startServer = async () => {
    try {
        let server;
        if (process.env.NODE_ENV === 'production') {
            // In production, use real SSL certificates
            const privateKey = fs_1.default.readFileSync(path_1.default.join(__dirname, '../ssl/server.key'), 'utf8');
            const certificate = fs_1.default.readFileSync(path_1.default.join(__dirname, '../ssl/server.cert'), 'utf8');
            const credentials = { key: privateKey, cert: certificate };
            // Create HTTPS server
            server = https_1.default.createServer(credentials, app);
        }
        else {
            // In development, use HTTP
            server = http_1.default.createServer(app);
        }
        // Proper error handling for server
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                logger.error(`⛔️ Port ${PORT} is already in use`);
                process.exit(1);
            }
            else {
                logger.error(`Server error: ${error.message}`);
                process.exit(1);
            }
        });
        // Graceful shutdown handling
        const shutdown = () => {
            logger.info('🛑 Shutting down gracefully...');
            server.close(() => {
                logger.info('✅ Server closed');
                process.exit(0);
            });
            // Force shutdown after 10s if server hasn't closed
            setTimeout(() => {
                logger.error('⚠️ Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 10000);
        };
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
        // Start listening
        await new Promise((resolve, reject) => {
            server.listen(PORT, '0.0.0.0', () => {
                logger.info(`🚀 Server running on ${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://localhost:${PORT}`);
                resolve();
            });
            server.once('error', reject);
        });
        // Initial memory check
        const initialMemoryUsage = checkMemoryUsage();
        logger.info(`📊 Initial memory usage: ${initialMemoryUsage.toFixed(2)}%`);
        // Set up WebSocket server
        (0, websocket_1.setupWebSocketServer)(server);
        // Handle server errors
        server.on('error', (error) => {
            logger.error(`Server error: ${error.message}`);
            process.exit(1);
        });
    }
    catch (error) {
        logger.error(`Failed to start server: ${error.message}`);
        process.exit(1);
    }
};
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error(`Uncaught Exception: ${error.message}`);
    process.exit(1);
});
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
    process.exit(1);
});
// Start the server
startServer();
