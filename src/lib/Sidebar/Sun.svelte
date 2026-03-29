<script lang="ts">
	import { states, motion } from '$lib/Stores';

	$: sun = $states?.['sun.sun'];
	$: attributes = sun?.attributes;
	$: elevation = attributes?.elevation ?? 0;
	$: rising = attributes?.rising ?? false;
	$: nextRising = attributes?.next_rising ? new Date(attributes.next_rising) : null;
	$: nextSetting = attributes?.next_setting ? new Date(attributes.next_setting) : null;

	// Normalize elevation (-90..90) to position (0..1) on semicircle arc
	$: t = (elevation + 90) / 180;

	// SVG semicircle: center (50,70), radius 38
	// Arc goes from left (12,70) through top (50,32) to right (88,70)
	$: sunX = 50 + 38 * Math.cos(Math.PI - t * Math.PI);
	$: sunY = 70 - 38 * Math.sin(t * Math.PI);

	$: isDay = elevation > 0;
	$: sunColor = isDay ? '#fbbf24' : '#6b7280';

	function formatTime(date: Date | null): string {
		if (!date) return '--:--';
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}
</script>

<div class="sun-widget" style:transition="opacity {$motion}ms ease">
	<svg viewBox="0 0 100 80" class="arc-svg" aria-label="Sun position">
		<!-- horizon line -->
		<line x1="8" y1="70" x2="92" y2="70" stroke="rgba(255,255,255,0.15)" stroke-width="1" />

		<!-- arc path -->
		<path
			d="M 12 70 A 38 38 0 0 1 88 70"
			fill="none"
			stroke="rgba(255,255,255,0.12)"
			stroke-width="2"
			stroke-dasharray="4 3"
		/>

		<!-- sun glow -->
		{#if isDay}
			<circle cx={sunX} cy={sunY} r="8" fill="rgba(251,191,36,0.15)" />
		{/if}

		<!-- sun dot -->
		<circle
			cx={sunX}
			cy={sunY}
			r={isDay ? 5 : 4}
			fill={sunColor}
			stroke={isDay ? 'rgba(251,191,36,0.5)' : 'rgba(107,114,128,0.3)'}
			stroke-width="1.5"
		/>

		<!-- elevation label -->
		<text x="50" y="58" text-anchor="middle" font-size="7" fill="rgba(255,255,255,0.5)">
			{elevation.toFixed(1)}°
		</text>
	</svg>

	<div class="sun-times">
		<div class="sun-time">
			<span class="sun-icon rise">↑</span>
			<span class="time">{formatTime(nextRising)}</span>
		</div>
		<div class="sun-time">
			<span class="sun-icon set">↓</span>
			<span class="time">{formatTime(nextSetting)}</span>
		</div>
	</div>
</div>

<style>
	.sun-widget {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
		padding: 0.25rem 0;
	}

	.arc-svg {
		width: 100%;
		max-width: 140px;
		height: auto;
	}

	.sun-times {
		display: flex;
		justify-content: space-between;
		width: 100%;
		padding: 0 0.5rem;
		margin-top: -0.25rem;
	}

	.sun-time {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.sun-icon {
		font-size: 0.75rem;
		font-weight: 700;
	}

	.sun-icon.rise {
		color: #fbbf24;
	}

	.sun-icon.set {
		color: #f97316;
	}

	.time {
		font-size: 0.78rem;
		color: var(--theme-sensor-name-color, rgba(255, 255, 255, 0.7));
	}
</style>
