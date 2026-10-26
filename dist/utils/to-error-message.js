/** An error's nonempty message, or the caller's fallback for other rejection values. */
export function toErrorMessage(error, fallback) {
    return error instanceof Error && error.message ? error.message : fallback;
}
//# sourceMappingURL=to-error-message.js.map