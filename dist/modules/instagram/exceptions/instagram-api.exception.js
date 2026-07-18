"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstagramApiException = void 0;
const common_1 = require("@nestjs/common");
class InstagramApiException extends common_1.HttpException {
    constructor(rawMetaError) {
        const errorMsg = rawMetaError?.error?.error_user_msg ||
            rawMetaError?.error?.message ||
            'An unknown error occurred while communicating with Instagram';
        const subcode = rawMetaError?.error?.error_subcode || 'UNKNOWN';
        super({
            statusCode: common_1.HttpStatus.BAD_REQUEST,
            message: errorMsg,
            metaErrorSubcode: subcode,
            metaTraceId: rawMetaError?.error?.fbtrace_id,
        }, common_1.HttpStatus.BAD_REQUEST);
    }
}
exports.InstagramApiException = InstagramApiException;
//# sourceMappingURL=instagram-api.exception.js.map