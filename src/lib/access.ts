import { createHash } from 'node:crypto';

// The code visitors must enter before they see the site. This is a courtesy lock, not
// security: the page content still ships in the HTML, and this repo is public.
export const ACCESS_CODE = '456777';

// Only this hash reaches the browser, so the code isn't readable in the page source.
// A visitor's browser stores the hash once they enter the code, so changing the code
// asks everyone for the new one.
export const ACCESS_SALT = 'fagriskogur:';
export const ACCESS_HASH = createHash('sha256').update(ACCESS_SALT + ACCESS_CODE).digest('hex');
export const ACCESS_STORAGE_KEY = 'fagriskogur-access';
