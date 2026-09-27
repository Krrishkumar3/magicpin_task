"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const routes_1 = require("./api/routes");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json({ limit: '10mb' })); // Allow up to 10mb for context pushes (limit is 500kb but we allow more)
app.use('/v1', routes_1.apiRouter);
// Catch malformed JSON centrally
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && 'body' in err) {
        return res.status(400).json({ accepted: false, reason: 'malformed_json' });
    }
    next();
});
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Vera Engine Server running on port ${PORT}`);
});
//# sourceMappingURL=server.js.map