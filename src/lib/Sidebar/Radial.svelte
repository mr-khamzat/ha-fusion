<script lang="ts">
	import { states, selectedLanguage, motion } from '$lib/Stores';
	import { onMount } from 'svelte';
	import type { HassEntity } from 'home-assistant-js-websocket';
	import { getName } from '$lib/Utils';

	export let entity_id: string | undefined = undefined;
	export let name: string | undefined = undefined;
	export let strokeWidth: number = 9;
	export let thresholds: { value: number; color: string }[] | undefined = undefined;

	let entity: HassEntity;
	$: if (entity_id) entity = $states?.[entity_id];

	let width = 0;
	let mounted = false;

	onMount(() => {
		setTimeout(() => {
			mounted = true;
		}, $motion);
	});

	$: state = Math.min(Math.max(Number(entity?.state || 0), 0), 100);
	$: stroke = strokeWidth === null || !strokeWidth ? 9 : strokeWidth;

	// Compute color from thresholds or default
	$: strokeColor = (() => {
		if (!thresholds || thresholds.length === 0) return 'rgba(255, 255, 255, 0.9)';
		// Sort thresholds ascending and pick the last one the value exceeds
		const sorted = [...thresholds].sort((a, b) => a.value - b.value);
		let color = sorted[0]?.color || 'rgba(255,255,255,0.9)';
		for (const t of sorted) {
			if (state >= t.value) color = t.color;
		}
		return color;
	})();

	$: attributes = {
		cx: width / 2,
		cy: width / 2,
		r: (width - stroke) / 2,
		fill: 'none',
		'stroke-width': stroke,
		'vector-effect': 'non-scaling-stroke'
	};
	$: circumference = 2 * Math.PI * attributes.r;
</script>

<div class="container">
	<div class="bar" bind:clientWidth={width}>
		<svg width="100%" viewBox="0 0 {width} {width}">
			{#if width}
				<!-- Background track -->
				<circle stroke="var(--theme-navigate-background-color)" {...attributes} />

				<!-- Progress arc -->
				<circle
					class="progress"
					{...attributes}
					stroke={strokeColor}
					stroke-dasharray={circumference}
					style:--dashoffset={circumference * (1 - state / 100)}
					style:transition="stroke-dashoffset {mounted ? $motion : 0}ms ease, stroke 0.4s ease"
				/>
			{/if}
		</svg>
	</div>

	<div class="overflow">
		{getName({ name }, entity)}

		<br />
		{Intl.NumberFormat($selectedLanguage, {
			style: 'percent',
			minimumFractionDigits: 0,
			maximumFractionDigits: 1
		}).format(state / 100)}
	</div>
</div>

<style>
	.container {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 1rem;
		padding: var(--theme-sidebar-item-padding);
		overflow: hidden;
		pointer-events: none;
		text-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);
	}

	.bar {
		width: 2.5rem;
		height: 2.5rem;
		margin-top: 0.1rem;
		transform: rotate(-90deg);
	}

	.progress {
		stroke-dashoffset: var(--dashoffset);
	}

	.overflow {
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
	}
</style>
