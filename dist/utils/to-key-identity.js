/** A collision-free text identity for a collection key, retaining its primitive type. */
export function toKeyIdentity(key) {
    return JSON.stringify([typeof key, String(key)]);
}
//# sourceMappingURL=to-key-identity.js.map