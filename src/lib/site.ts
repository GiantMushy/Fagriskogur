import type { ImageMetadata } from 'astro';
import roomsData from '../data/rooms.json';

/** `aspect` (width / height) is set when WordPress showed the photo cropped to a different shape. */
export type Photo = { src: string; aspect?: number };
export type Block = { h: string } | { p: string } | { img: Photo } | { row: Photo[] };
export type Room = {
	slug: string;
	name: string;
	title: string;
	cover: string;
	cards: { half: boolean; blocks: Block[] }[];
	prev: string;
	next: string;
	related: string[];
};

export const rooms = roomsData as Room[];
export const roomBySlug = (slug: string) => rooms.find((r) => r.slug === slug)!;

/** Internal link that works both under /Fagriskogur/ (GitHub preview) and at the domain root. */
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

// Left empty on purpose: the live site's Facebook icon points at the theme vendor's group.
export const FACEBOOK_URL = '';
