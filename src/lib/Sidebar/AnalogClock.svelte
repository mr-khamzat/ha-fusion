<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	export let sel: any;

	let now = new Date();
	let timer: ReturnType<typeof setInterval>;

	onMount(() => {
		timer = setInterval(() => { now = new Date(); }, 1000);
	});

	onDestroy(() => clearInterval(timer));

	$: h = now.getHours() % 12;
	$: m = now.getMinutes();
	$: s = now.getSeconds();

	// Angles in degrees
	$: hourAngle = (h / 12) * 360 + (m / 60) * 30;
	$: minuteAngle = (m / 60) * 360 + (s / 60) * 6;
	$: secondAngle = (s / 60) * 360;

	$: showSeconds = sel?.show_seconds !== false;

	function handEnd(angle: number, length: number) {
		const rad = ((angle - 90) * Math.PI) / 180;
		return { x: 50 + length * Math.cos(rad), y: 50 + length * Math.sin(rad) };
	}

	$: hourEnd = handEnd(hourAngle, 22);
	$: minEnd = handEnd(minuteAngle, 30);
	$: secEnd = handEnd(secondAngle, 32);
</script>

<div class="clock-widget">
	<svg viewBox="0 0 100 100" class="clock-svg">
		<!-- Face -->
		<circle cx="50" cy="50" r="46" fill="rgba(0,0,0,0.2)" stroke="rgba(255,255,255,0.1)" stroke-width="1" />

		<!-- Hour ticks -->
		{#each Array(12) as _, i}
			{@const a = ((i / 12) * 360 - 90) * (Math.PI / 180)}
			<line
				x1={50 + 38 * Math.cos(a)}
				y1={50 + 38 * Math.sin(a)}
				x2={50 + 44 * Math.cos(a)}
				y2={50 + 44 * Math.sin(a)}
				stroke="rgba(255,255,255,0.35)"
				stroke-width="1.5"
				stroke-linecap="round"
			/>
		{/each}

		<!-- Hour hand -->
		<line
			x1="50" y1="50"
			x2={hourEnd.x} y2={hourEnd.y}
			stroke="rgba(255,255,255,0.9)"
			stroke-width="3.5"
			stroke-linecap="round"
			style="transition: all 0.5s ease"
		/>

		<!-- Minute hand -->
		<line
			x1="50" y1="50"
			x2={minEnd.x} y2={minEnd.y}
			stroke="rgba(255,255,255,0.7)"
			stroke-width="2.5"
			stroke-linecap="round"
			style="transition: all 0.5s ease"
		/>

		<!-- Second hand -->
		{#if showSeconds}
			<line
				x1="50" y1="50"
				x2={secEnd.x} y2={secEnd.y}
				stroke="rgba(248,113,113,0.9)"
				stroke-width="1.2"
				stroke-linecap="round"
			/>
		{/if}

		<!-- Center dot -->
		<circle cx="50" cy="50" r="2.5" fill="rgba(255,255,255,0.9)" />
	</svg>
</div>

<style>
	.clock-widget {
		padding: var(--theme-sidebar-item-padding);
		display: flex;
		justify-content: center;
		pointer-events: none;
	}

	.clock-svg {
		width: 5.5rem;
		height: 5.5rem;
	}
</style>
