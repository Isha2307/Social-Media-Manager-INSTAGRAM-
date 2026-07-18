"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitException = void 0;
const common_1 = require("@nestjs/common");
class RateLimitException extends common_1.HttpException {
    constructor(usagePercentage) {
        super({
            statusCode: common_1.HttpStatus.TOO_MANY_REQUESTS,
            message: `Instagram API rate limit nearly exceeded. Current usage: ${usagePercentage}%`,
            error: 'Too Many Requests',
        }, common_1.HttpStatus.TOO_MANY_REQUESTS);
    }
}
exports.RateLimitException = RateLimitException;
//# sourceMappingURL=rate-limit.exception.js.map