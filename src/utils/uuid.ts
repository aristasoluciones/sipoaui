export function generateUUID(): string {
    // RFC4122 version 4 compliant UUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export function extractErrorsFromResponse(errorResponse:any) {

    let allErrorMessages:any = [];
    const errors = errorResponse.errors ?? errorResponse?.error?.errors;

    if (typeof errors === 'object') {

        for (const fieldName in errors) {
            if (errors.hasOwnProperty(fieldName)) {
                const fieldErrors = errors[fieldName];

                if (Array.isArray(fieldErrors)) {
                    allErrorMessages = allErrorMessages.concat(fieldErrors);
                }
            }
        }
    }

    return allErrorMessages;

}