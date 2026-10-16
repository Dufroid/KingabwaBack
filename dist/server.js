"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const db_js_1 = require("./config/db.js");
const swagger_js_1 = require("./config/swagger.js");
const errorHandler_js_1 = require("./middlewares/errorHandler.js");
// Route Imports
const auth_routes_js_1 = __importDefault(require("./routes/auth.routes.js"));
const category_routes_js_1 = __importDefault(require("./routes/category.routes.js"));
const nominee_routes_js_1 = __importDefault(require("./routes/nominee.routes.js"));
const vote_routes_js_1 = __importDefault(require("./routes/vote.routes.js"));
const blog_routes_js_1 = __importDefault(require("./routes/blog.routes.js"));
const partner_routes_js_1 = __importDefault(require("./routes/partner.routes.js"));
const proposal_routes_js_1 = __importDefault(require("./routes/proposal.routes.js"));
const winner_routes_js_1 = __importDefault(require("./routes/winner.routes.js"));
const gallery_routes_js_1 = __importDefault(require("./routes/gallery.routes.js"));
const admin_routes_js_1 = __importDefault(require("./routes/admin.routes.js"));
const payment_routes_js_1 = __importDefault(require("./routes/payment.routes.js"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Security & Parsing Middlewares
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
app.use((0, helmet_1.default)({ crossOriginResourcePolicy: false }));
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
const uploadsBasePath = path_1.default.join(process.cwd(), 'uploads');
app.use('/uploads', express_1.default.static(uploadsBasePath));
// Swagger API Documentation JSON Route
app.get('/api-docs', (req, res) => {
    res.json(swagger_js_1.swaggerSpec);
});
// Base Health Check Route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Kingabwa Awards REST API is running smoothly',
        timestamp: new Date().toISOString(),
    });
});
// API Routes Register
app.use('/api/auth', auth_routes_js_1.default);
app.use('/api/categories', category_routes_js_1.default);
app.use('/api/nominees', nominee_routes_js_1.default);
app.use('/api/votes', vote_routes_js_1.default);
app.use('/api/blog', blog_routes_js_1.default);
app.use('/api/partners', partner_routes_js_1.default);
app.use('/api/proposals', proposal_routes_js_1.default);
app.use('/api/hall-of-fame', winner_routes_js_1.default);
app.use('/api/gallery', gallery_routes_js_1.default);
app.use('/api/payments', payment_routes_js_1.default);
app.use('/api/admin', admin_routes_js_1.default);
// Global Error Handler
app.use(errorHandler_js_1.errorHandler);
// Start Database & Server
const startServer = async () => {
    await (0, db_js_1.connectDB)();
    app.listen(PORT, () => {
        console.log(`==================================================`);
        console.log(`🚀 KINGABWA AWARDS SERVER RUNNING ON PORT: ${PORT}`);
        console.log(`📖 API Documentation available at: http://localhost:${PORT}/api-docs`);
        console.log(`==================================================`);
    });
};
startServer();
