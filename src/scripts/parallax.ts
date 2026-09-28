// Scroll parallax for elements with data-parallax="<speed>", matching how the old Uncode
// theme ran Rellax (data-rellax-percentage="0.5"). An element sits at its normal place when
// centred in the viewport and drifts 50px per unit of speed either side of it, rising a little
// faster than the page. Desktop only, like the original.
const items = [...document.querySelectorAll<HTMLElement>('[data-parallax]')].map((el) => ({
	el,
	speed: Number(el.dataset.parallax),
	shift: 0,
}));
const enabled = matchMedia('(min-width: 960px) and (prefers-reduced-motion: no-preference)');
let queued = false;

function update() {
	queued = false;
	const viewport = innerHeight;
	// Measure everything before moving anything.
	const shifts = items.map(({ el, speed, shift }) => {
		if (!enabled.matches) return 0;
		const box = el.getBoundingClientRect();
		// 0 as the element's top edge enters at the bottom, 1 as its bottom edge leaves at the top.
		const progress = (viewport - (box.top - shift)) / (viewport + box.height);
		const next = speed * (50 - 100 * Math.min(1, Math.max(0, progress)));
		return Math.round(next * 10) / 10;
	});
	items.forEach((item, i) => {
		item.shift = shifts[i];
		item.el.style.translate = shifts[i] ? `0 ${shifts[i]}px` : '';
	});
}

function queue() {
	if (queued) return;
	queued = true;
	requestAnimationFrame(update);
}

if (items.length) {
	addEventListener('scroll', queue, { passive: true });
	addEventListener('resize', queue);
	addEventListener('load', queue);
	enabled.addEventListener('change', queue);
	update();
}
