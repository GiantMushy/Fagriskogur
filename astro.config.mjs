// @ts-check
import { defineConfig } from 'astro/config';

// Until the DNS for fagriskogur.is points at GitHub Pages, the site is served from
// https://giantmushy.github.io/Fagriskogur/. At cutover: set `site` to
// 'https://fagriskogur.is', delete `base`, and add public/CNAME containing fagriskogur.is.
export default defineConfig({
	site: 'https://giantmushy.github.io',
	base: '/Fagriskogur',
	// WordPress URLs all end in a slash (/portfolio/patio/); keep them identical.
	trailingSlash: 'always',
	image: {
		responsiveStyles: true,
	},
});
