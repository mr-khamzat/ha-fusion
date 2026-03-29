<script lang="ts">
	import { states, selectedLanguage } from '$lib/Stores';
	import { onMount } from 'svelte';
	import type { HassEntity } from 'home-assistant-js-websocket';
	import { getName } from '$lib/Utils';

	export let entity_id: string | undefined = undefined;
	export let name: string | undefined = undefined;
	export let min: number = 0;
	export let max: number = 100;
	export let unit: string | undefined = undefined;
	export let thresholds: { value: number; color: string }[] | undefined = undefined;

	let entity: HassEntity;
	$: if (entity_id) entity = $states?.[entity_id];

	let mounted = false;
	onMount(() => { mounted = true; });

	$: rawVal = parseFloat(entity?.state || '0');
	$: value = isNaN(rawVal) ? 0 : Math.min(Math.max(rawVal, min), max);
	$: pct = (value - min) / (max - min);

	// Gauge arc params: half-circle from 180° to 0°
	const cx = 50; const cy = 50; const r = 38;
	const startAngle = Math.PI; // left
	const endAngle = 0;         // right
	const totalAngle = Math.PI; // 180°

	// track arc
	const tx1 = cx + r * Math.cos(startAngle);
	const ty1 = cy + r * Math.sin(startAngle);
	const tx2 = cx + r * Math.cos(endAngle);
	const ty2 = cy + r * Math.sin(endAngle);
	const trackD = `M ${tx1} ${ty1} A ${r} ${r} 0 0 1 ${tx2} ${ty2}`;

	// progress arc
	$: progressAngle = startAngle + totalAngle * (mounted ? pct : 0);
	$: px2 = cx + r * Math.cos(progressAngle);
	$: py2 = cy + r * Math.sin(progressAngle);
	$: largeArc = pct > 0.5 ? 1 : 0;
	$: progressD = `M ${tx1} ${ty1} A ${r} ${r} 0 ${largeArc} 1 ${px2} ${py2}`;

	// needle
	$: needleAngle = startAngle + totalAngle * (mounted ? pct : 0);
	$: nx = cx + (r - 6) * Math.cos(needleAngle);
	$: ny = cy + (r - 6) * Math.sin(needleAngle);

	// color from thresholds
	$: gaugeColor = (() => {
		if (!thresholds || thresholds.length === 0) return 'rgba(147, 197, 253, 0.9)';
		const sorted = [...thresholds].sort((a, b) => a.value - b.value);
		let color = sorted[0]?.color || 'rgba(147,197,253,0.9)';
		for (const t of sorted) {
			if (value >= t.value) color = t.color;
		}
		return color;
	})();

	$: displayUnit = unit || entity?.attributes?.unit_of_measurement || '';
	$: displayName = name || getName(undefined, entity) || entity_id || '';
</script>

<div class="gauge-container">
	<div class="gauge-wrap">
		<svg viewBox="0 0 100 60" class="gauge-svg">
			<!-- Track -->
			<path d={trackD} fill="none" stroke="var(--theme-navigate-background-color)" stroke-width="8" stroke-linecap="round" />
			<!-- Progress -->
			<path
				d={progressD}
				fill="none"
				stroke={gaugeColor}
				stroke-width="8"
				stroke-linecap="round"
				style="transition: d {mounted ? 0.5 : 0}s ease, stroke 0.4s ease"
			/>
			<!-- Needle dot -->
			<circle cx={nx} cy={ny} r="3" fill={gaugeColor} style="transition: cx {mounted ? 0.5 : 0}s ease, cy {mounted ? 0.5 : 0}s ease, fill 0.4s ease" />
			<!-- Min / max labels -->
			<text x="11" y="56" font-size="7" fill="rgba(255,255,255,0.3)" text-anchor="middle">{min}</text>
			<text x="89" y="56" font-size="7" fill="rgba(255,255,255,0.3)" text-anchor="middle">{max}</text>
		</svg>
		<div class="gauge-value">
			<span class="val">{Intl.NumberFormat($selectedLanguage, { maximumFractionDigits: 1 }).format(value)}</span>
			{#if displayUnit}<span class="unit">{displayUnit}</span>{/if}
		</div>
	</div>
	{#if displayName}
		<div class="gauge-name">{displayName}</div>
	{/if}
</div>

<style>
	.gauge-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--theme-sidebar-item-padding);
		pointer-events: none;
		gap: 0.1rem;
	}

	.gauge-wrap {
		position: relative;
		width: 7rem;
	}

	.gauge-svg {
		width: 100%;
		height: auto;
		display: block;
	}

	.gauge-value {
		position: absolute;
		bottom: 0.35rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: baseline;
		gap: 0.2rem;
		white-space: nowrap;
	}

	.val {
		font-size: 1.1rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
	}

	.unit {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.45);
	}

	.gauge-name {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.45);
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 8rem;
	}
</style>
