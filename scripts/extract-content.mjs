// Turns the frozen WordPress pages in snapshot/ into data for the Astro site:
//   src/data/rooms.json      – the room ("portfolio") pages, in homepage order
//   src/assets/uploads/...   – every image the real pages use, capped at 2560px
//
// Run scripts/snapshot.mjs first, then: node scripts/extract-content.mjs
import * as cheerio from 'cheerio';
import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const MAX_EDGE = 2560;
const upload = (url) => url?.replace(/\?.*/, '').match(/\/wp-content\/uploads\/(.+)$/)?.[1];
const load = async (page) => cheerio.load(await readFile(join('snapshot', page, 'index.html'), 'utf8'));
const clean = (text) => text.replace(/\s+/g, ' ').trim();

const images = new Set();
const home = await load('/');

// Header logo, hero background, and every content image (data-guid holds the full-size file).
images.add(upload(home('img[src*="cropped-logo"]').attr('src')));
images.add(upload(home('[data-background-image]').first().attr('data-background-image')));
home('.post-content img[data-guid]').each((_, el) => images.add(upload(home(el).attr('data-guid'))));

const rooms = [];
home('.tmb .t-entry-title a').each((_, el) => {
	const slug = home(el).attr('href').match(/\/portfolio\/([^/]+)\//)[1];
	const cover = upload(home(el).closest('.tmb').find('img[data-guid]').attr('data-guid'));
	if (rooms.some((r) => r.slug === slug)) return;
	rooms.push({ slug, name: clean(home(el).text()), cover });
});

// Each room page is a stack of grey cards, full or half width. A card holds headings,
// paragraphs and images in order; images in a nested half-width row sit side by side.
const isHalf = (col) => /\bcol-lg-6\b/.test(col.attr('class') || '');
// Uncode shows some photos cropped (e.g. a landscape shot as a portrait tile). The <img>
// width/height give the shape shown; the data-guid file is the uncropped original.
const crops = [];
const image = ($el) => {
	const src = upload($el.attr('data-guid'));
	images.add(src);
	const img = { src };
	crops.push([img, Number($el.attr('width')) / Number($el.attr('height'))]);
	return img;
};
for (const room of rooms) {
	const $ = await load(`/portfolio/${room.slug}/`);
	room.title = clean($('title').text()).replace(/ – Fagriskogur$/, '');
	room.cards = [];
	$('.post-content .wpb_column')
		.filter((_, el) => !$(el).parents('.wpb_column, .owl-carousel, .uncode-custom-navigation').length)
		.each((_, col) => {
			const blocks = [];
			$(col).find('h1, h2, h3, p, img[data-guid]').each((_, el) => {
				const text = clean($(el).text());
				if (el.tagName !== 'img') {
					if (text) blocks.push({ [el.tagName === 'p' ? 'p' : 'h']: text });
					return;
				}
				const img = image($(el));
				const inner = $(el).closest('.wpb_column');
				const last = blocks.at(-1);
				if (inner[0] !== col && isHalf(inner)) {
					if (last?.row && last.row.length < 2) last.row.push(img);
					else blocks.push({ row: [img] });
				} else blocks.push({ img });
			});
			if (blocks.length) room.cards.push({ half: isHalf($(col)), blocks });
		});
	[room.prev, room.next] = $('.uncode-custom-navigation__item a').map((_, el) => $(el).attr('href').match(/\/portfolio\/([^/]+)\//)?.[1]).get();
	room.related = $('.owl-carousel .t-entry-title a').map((_, el) => $(el).attr('href').match(/\/portfolio\/([^/]+)\//)?.[1]).get();
	images.add(room.cover);
}

for (const [img, shown] of crops) {
	const { width, height } = await sharp(join('snapshot/wp-content/uploads', img.src)).metadata();
	if (Math.abs(shown / (width / height) - 1) > 0.02) img.aspect = Number(shown.toFixed(4));
}

await mkdir('src/data', { recursive: true });
await writeFile('src/data/rooms.json', JSON.stringify(rooms, null, '\t') + '\n');

images.delete(undefined);
let total = 0;
for (const path of [...images].sort()) {
	const out = join('src/assets/uploads', path);
	await mkdir(dirname(out), { recursive: true });
	const input = sharp(join('snapshot/wp-content/uploads', path));
	const { width, height, format } = await input.metadata();
	if (Math.max(width, height) > MAX_EDGE && format === 'jpeg') {
		await input.rotate().resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside' }).jpeg({ quality: 85, mozjpeg: true }).toFile(out);
	} else {
		await writeFile(out, await readFile(join('snapshot/wp-content/uploads', path)));
	}
	total += (await readFile(out)).length;
}
console.log(`${rooms.length} rooms, ${images.size} images, ${(total / 1e6).toFixed(1)} MB`);
