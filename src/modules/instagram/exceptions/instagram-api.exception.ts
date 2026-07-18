import { HttpException, HttpStatus } from '@nestjs/common';

export class InstagramApiException extends HttpException {
  constructor(rawMetaError: any) {
    const errorMsg = rawMetaError?.error?.error_user_msg || 
                     rawMetaError?.error?.message || 
                     'An unknown error occurred while communicating with Instagram';
                     
    const subcode = rawMetaError?.error?.error_subcode || 'UNKNOWN';

    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: errorMsg,
        metaErrorSubcode: subcode,
        metaTraceId: rawMetaError?.error?.fbtrace_id,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
