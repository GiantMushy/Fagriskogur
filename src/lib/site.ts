import type { ImageMetadata } from 'astro';
import roomsData from '../data/rooms.json';

export type Photo = { src: string; caption?: string };
export type Section = { heading?: string; text: string[]; photos: Photo[] };
export type Room = {
	slug: string;
	name: string;
	/** Bedrooms and lodge spaces are listed on the homepage. The staff building is linked from the Service section. */
	group: 'bedrooms' | 'lodge' | 'service';
	cover: string;
	/** [label, value] pairs shown under the introduction, e.g. ["Bed", "King"]. */
	facts?: [string, string][];
	sections: Section[];
};

export const rooms = roomsData as Room[];
export const roomUrl = (room: Room) => href(`/rooms/${room.slug}/`);
export const GROUP_LABELS = { bedrooms: 'Bedrooms', lodge: 'The Lodge', service: 'Service' } as const;

/** Internal link that respects Astro's `base` setting (the site is at the domain root today). */
export function href(path: string) {
	return import.meta.env.BASE_URL.replace(/\/$/, '') + path;
}

const files = import.meta.glob<{ default: ImageMetadata }>('/src/assets/uploads/**/*.{jpg,jpeg,png,webp,avif}', {
	eager: true,
});

/** An image copied from WordPress, by its path under wp-content/uploads/ (e.g. "2024/12/aurora.jpg"). */
export function upload(path: string): ImageMetadata {
	const file = files[`/src/assets/uploads/${path}`];
	if (!file) throw new Error(`Missing image: src/assets/uploads/${path}`);
	return file.default;
}

export const CONTACT_EMAIL = 'bjarnith@live.com';

// Left empty on purpose: the live site's Facebook icon points at the theme vendor's group.
export const FACEBOOK_URL = '';
