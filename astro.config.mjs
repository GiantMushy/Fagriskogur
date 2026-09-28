// @ts-check
import { defineConfig } from 'astro/config';

// The old WordPress room addresses (/portfolio/<old>/) forward to the new ones, so saved links
// keep working.
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

// The custom domain is set in the repo's Settings → Pages. A public/CNAME file isn't needed:
// GitHub ignores it for sites deployed by an Actions workflow.
export default defineConfig({
	site: 'https://fagriskogur.is',
	// URLs end in a slash, as they did on WordPress.
	trailingSlash: 'always',
	redirects: Object.fromEntries(Object.entries(oldRoomSlugs).map(([from, to]) => [`/portfolio/${from}/`, `/rooms/${to}/`])),
	image: {
		responsiveStyles: true,
	},
});
