// Frozen copy of the real (non-demo) pages of the live WordPress site.
// Saves each page's HTML untouched plus every same-origin asset it references
// (CSS, JS, fonts, images, and the full-size original of each image) under snapshot/.
//
//   node scripts/snapshot.mjs
import * as cheerio from 'cheerio';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const ORIGIN = 'https://fagriskogur.is';
// 1984's temporary hostname for the same site; some CSS still points at it.
const ALIASES = ['https://fagriskogur-is.freddie.shared.1984.is', 'http://fagriskogur-is.freddie.shared.1984.is', 'http://fagriskogur.is'];
const OUT = 'snapshot';
const UA = 'Mozilla/5.0 (fagriskogur snapshot)';

const PAGES = [
	'/',
	'/thorvardur/',
	...['staff-building', 'hot-tubs', 'patio', 'hottubs', 'mancave', 'northern-bathroom', 'eastern-bedroom',
		'northern-bedroom', 'western-bedroom', 'southern-bedroom', 'master'].map((s) => `/portfolio/${s}/`),
];

const assets = new Set();
const manifest = { fetched: new Date().toISOString(), pages: {}, missing: [] };

function normalize(raw, base) {
	if (!raw || raw.startsWith('data:') || raw.startsWith('#') || raw.startsWith('mailto:')) return null;
	// Lazy-load placeholders are bare base64 SVGs, not URLs.
	if (/^[A-Za-z0-9+/]{40,}={0,2}$/.test(raw.trim())) return null;
	let url;
	try {
		url = new URL(raw.trim(), base);
	} catch {
		return null;
	}
	for (const alias of ALIASES) if (url.href.startsWith(alias)) url = new URL(url.href.slice(alias.length), ORIGIN);
	if (url.origin !== ORIGIN) return null;
	return ORIGIN + url.pathname;
}

// WordPress/Uncode resized copies: name-300x200.jpg, name-uai-357x357.jpg, name-scaled.jpg
function originalOf(url) {
	return url.replace(/-uai-\d+x\d+(?=\.\w+$)/, '').replace(/-\d+x\d+(?=\.\w+$)/, '');
}

function localPath(url) {
	const path = new URL(url).pathname;
	return join(OUT, decodeURIComponent(path.endsWith('/') ? path + 'index.html' : path));
}

async function get(url) {
	const res = await fetch(url, { headers: { 'user-agent': UA } });
	if (!res.ok) throw new Error(`${res.status} ${url}`);
	return res;
}

async function save(url, body) {
	const file = localPath(url);
	await mkdir(dirname(file), { recursive: true });
	await writeFile(file, body);
}

function cssUrls(css, base) {
	const found = [];
	for (const m of css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) found.push(normalize(m[1], base));
	for (const m of css.matchAll(/@import\s+['"]([^'"]+)['"]/g)) found.push(normalize(m[1], base));
	return found.filter(Boolean);
}

for (const page of PAGES) {
	const url = ORIGIN + page;
	const html = await (await get(url)).text();
	await save(url, html);
	const $ = cheerio.load(html);
	const images = new Set();

	const add = (raw, isImage = false) => {
		const u = normalize(raw, url);
		if (!u) return;
		assets.add(u);
		if (isImage && /\/wp-content\/uploads\//.test(u)) {
			images.add(originalOf(u));
			assets.add(originalOf(u));
		}
	};
	const addSrcset = (value) => value?.split(',').forEach((part) => add(part.trim().split(/\s+/)[0], true));

	$('link[href]').each((_, el) => {
		const rel = ($(el).attr('rel') || '').toLowerCase();
		if (/stylesheet|icon|preload/.test(rel)) add($(el).attr('href'), rel.includes('icon'));
	});
	$('script[src]').each((_, el) => add($(el).attr('src')));
	$('img, source').each((_, el) => {
		for (const attr of ['src', 'data-src', 'data-guid']) add($(el).attr(attr), true);
		addSrcset($(el).attr('srcset'));
		addSrcset($(el).attr('data-srcset'));
	});
	$('[data-background-image], [data-mobile-background-image]').each((_, el) => {
		add($(el).attr('data-background-image'), true);
		add($(el).attr('data-mobile-background-image'), true);
	});
	$('meta[property="og:image"]').each((_, el) => add($(el).attr('content'), true));
	$('style').each((_, el) => cssUrls($(el).html() || '', url).forEach((u) => assets.add(u)));
	$('[style]').each((_, el) => cssUrls($(el).attr('style') || '', url).forEach((u) => add(u, true)));

	manifest.pages[page] = { title: $('title').text(), images: [...images].map((u) => u.slice(ORIGIN.length)) };
	console.log(`page ${page}: ${images.size} images`);
}

// Fetch assets; stylesheets can pull in more (fonts, icons, images).
const done = new Set();
const queue = [...assets];
async function worker() {
	while (queue.length) {
		const url = queue.shift();
		if (done.has(url)) continue;
		done.add(url);
		try {
			const res = await get(url);
			const body = Buffer.from(await res.arrayBuffer());
			await save(url, body);
			if (url.endsWith('.css')) for (const u of cssUrls(body.toString('utf8'), url)) if (!done.has(u)) queue.push(u);
		} catch (err) {
			manifest.missing.push(url.slice(ORIGIN.length));
			console.warn(`skip ${err.message}`);
		}
	}
}
await Promise.all(Array.from({ length: 4 }, worker));

manifest.missing.sort();
await writeFile(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, '\t') + '\n');
console.log(`saved ${done.size - manifest.missing.length} assets, ${manifest.missing.length} missing`);
