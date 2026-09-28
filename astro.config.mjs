// @ts-check
import { defineConfig } from 'astro/config';

// Until the DNS for fagriskogur.is points at GitHub Pages, the site is served from
// https://giantmushy.github.io/Fagriskogur/. At cutover: set `site` to
// 'https://fagriskogur.is', set BASE to '', and add public/CNAME containing fagriskogur.is.
const BASE = '/Fagriskogur';

// The old WordPress room addresses (/portfolio/<old>/) forward to the new ones, so saved links
// keep working. Astro doesn't add the base path to redirect targets, so it's added here.
const oldRoomSlugs = {
	master: 'thingvellir-suite',
	'southern-bedroom': 'gullfoss-bedroom',
	'western-bedroom': 'geysir-bedroom',
	'eastern-bedroom': 'kerid-bedroom',
	'northern-bedroom': 'faxi-bedroom',
	'northern-bathroom': 'guest-bathrooms',
	'hot-tubs': 'hot-tubs',
	hottubs: 'sauna-gym',
	mancave: 'game-room',
	patio: 'patio',
	'staff-building': 'staff-building',
};

export default defineConfig({
	site: 'https://giantmushy.github.io',
	base: BASE || '/',
	// URLs end in a slash, as they did on WordPress.
	trailingSlash: 'always',
	redirects: Object.fromEntries(
		Object.entries(oldRoomSlugs).map(([from, to]) => [`/portfolio/${from}/`, `${BASE}/rooms/${to}/`]),
	),
	image: {
		responsiveStyles: true,
	},
});
