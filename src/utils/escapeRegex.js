// Escapes regex metacharacters so a raw user-typed search string (phone
// search in the admin panel) can go straight into a Mongo $regex without
// an unbalanced "(" or similar throwing an unhandled 500 instead of a
// clean "no results".
export const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
