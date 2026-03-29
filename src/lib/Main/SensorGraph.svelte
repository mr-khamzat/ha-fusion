<script lang="ts">
	import { onDestroy } from 'svelte';
	import { states, connection, editMode, motion, ripple } from '$lib/Stores';
	import { openModal } from 'svelte-modals';
	import { getName } from '$lib/Utils';
	import Icon from '@iconify/svelte';
	import Ripple from 'svelte-ripple';

	export let sel: any;

	$: entity_id = sel?.entity_id;
	$: entity = $states?.[entity_id];
	$: attrs = (entity?.attributes || {}) as Record<string, any>;
	$: name = sel?.name || getName(undefined, entity) || entity_id || 'Sensor';
	$: currentValue = entity?.state || '—';
	$: unit = attrs.unit_of_measurement || '';
	$: hours = (sel?.hours as number) || 12;
	$: showMinMax = sel?.show_min_max !== false;

	// History data
	let historyPoints: number[] = [];
	let unsubHistory: (() => void) | null = null;
	let historyFetchedFor: string | null = null;

	// SVG dimensions
	const SVG_W = 300;
	const SVG_H = 50;
	const PAD_X = 2;
	const PAD_Y = 3;

	$: minVal = historyPoints.length > 1 ? Math.min(...historyPoints) : 0;
	$: maxVal = historyPoints.length > 1 ? Math.max(...historyPoints) : 1;
	$: range = maxVal - minVal || 1;

	$: trend = (() => {
		if (historyPoints.length < 4) return 'flat';
		const half = Math.floor(historyPoints.length / 2);
		const firstHalf = historyPoints.slice(0, half);
		const secondHalf = historyPoints.slice(half);
		const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
		const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
		const delta = avgSecond - avgFirst;
		if (delta > range * 0.05) return 'up';
		if (delta < -range * 0.05) return 'down';
		return 'flat';
	})();

	$: lineColor =
		trend === 'up'
			? 'rgba(52,211,153,0.8)'
			: trend === 'down'
				? 'rgba(248,113,113,0.8)'
				: 'rgba(147,197,253,0.8)';

	$: fillColor =
		trend === 'up'
			? 'rgba(52,211,153,0.12)'
			: trend === 'down'
				? 'rgba(248,113,113,0.12)'
				: 'rgba(147,197,253,0.12)';

	$: gradientId = trend === 'up' ? 'grad-up' : trend === 'down' ? 'grad-down' : 'grad-flat';

	function toSvgCoords(points: number[]): string {
		if (points.length < 2) return '';
		const step = (SVG_W - PAD_X * 2) / (points.length - 1);
		return points
			.map((v, i) => {
				const x = PAD_X + i * step;
				const y = PAD_Y + (SVG_H - PAD_Y * 2) * (1 - (v - minVal) / range);
				return `${x.toFixed(1)},${y.toFixed(1)}`;
			})
			.join(' ');
	}

	function toFillPath(points: number[]): string {
		if (points.length < 2) return '';
		const step = (SVG_W - PAD_X * 2) / (points.length - 1);
		const coords = points.map((v, i) => {
			const x = PAD_X + i * step;
			const y = PAD_Y + (SVG_H - PAD_Y * 2) * (1 - (v - minVal) / range);
			return `${x.toFixed(1)},${y.toFixed(1)}`;
		});
		const first = coords[0];
		const last = coords[coords.length - 1];
		const bottom = SVG_H - PAD_Y;
		const [x0] = first.split(',');
		const [xN] = last.split(',');
		return `M ${x0},${bottom} L ${coords.join(' L ')} L ${xN},${bottom} Z`;
	}

	$: polylinePoints = toSvgCoords(historyPoints);
	$: fillPath = toFillPath(historyPoints);

	function fetchHistory(eid: string) {
		if (unsubHistory) {
			unsubHistory();
			unsubHistory = null;
		}
		if (!eid) return;
		historyFetchedFor = eid;

		const startTime = new Date(Date.now() - hours * 3600 * 1000).toISOString();
		const endTime = new Date().toISOString();

		unsubHistory = connection.subscribe((conn) => {
			if (!conn || historyFetchedFor !== eid) return;
			conn.sendMessagePromise({
				type: 'recorder/statistics_during_period',
				start_time: startTime,
				end_time: endTime,
				statistic_ids: [eid],
				period: 'hour'
			}).then((res: any) => {
				if (!res?.[eid] || !Array.isArray(res[eid])) return;
				const nums = res[eid]
					.map((item: any) => item.mean ?? item.state)
					.filter((v: any) => v != null && !isNaN(Number(v)))
					.map(Number);
				if (nums.length > 0) historyPoints = nums;
			}).catch(() => { /* history unavailable */ });
		});
	}

	$: if (entity_id) {
		fetchHistory(entity_id);
	}

	onDestroy(() => {
		if (unsubHistory) unsubHistory();
	});

	function handleClick() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/EntityCardConfig.svelte'), {
				sel,
				domain: 'sensor',
				title: 'Sensor Graph'
			});
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="sensor-graph-card"
	on:click={handleClick}
	use:Ripple={{ ...$ripple, color: 'rgba(255,255,255,0.03)' }}
	style:transition="opacity {$motion}ms ease"
	style:cursor={$editMode ? 'pointer' : 'default'}
>
	{#if !entity_id}
		<div class="empty-state">
			<Icon icon="mdi:chart-line" height="28" width="28" style="opacity:0.3" />
			<span>Настроить график датчика</span>
		</div>
	{:else}
		<!-- Header -->
		<div class="sg-header">
			<span class="sg-name">{name}</span>
			<span class="sg-value" style:color={lineColor}>
				{currentValue}{#if unit}<span class="sg-unit">&nbsp;{unit}</span>{/if}
			</span>
		</div>

		<!-- Chart -->
		<div class="chart-wrap">
			{#if historyPoints.length >= 2}
				{#if showMinMax}
					<div class="minmax-labels">
						<span class="label-max">{maxVal.toFixed(1)}</span>
						<span class="label-min">{minVal.toFixed(1)}</span>
					</div>
				{/if}
				<svg
					viewBox="0 0 {SVG_W} {SVG_H}"
					preserveAspectRatio="none"
					class="sparkline"
					aria-hidden="true"
				>
					<defs>
						<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stop-color={fillColor} stop-opacity="1" />
							<stop offset="100%" stop-color={fillColor} stop-opacity="0" />
						</linearGradient>
					</defs>
					<path d={fillPath} fill="url(#{gradientId})" stroke="none" />
					<polyline
						points={polylinePoints}
						fill="none"
						stroke={lineColor}
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			{:else}
				<div class="no-history">
					<Icon icon="mdi:chart-line-variant" height="20" width="20" style="opacity:0.25" />
				</div>
			{/if}
		</div>

		<!-- Footer label -->
		<div class="sg-footer">
			<Icon icon="mdi:clock-outline" height="11" width="11" style="opacity:0.35" />
			<span>последние {hours} ч</span>
		</div>
	{/if}
</div>

<style>
	.sensor-graph-card {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: 0.85rem 1rem 0.75rem;
		height: 100%;
		min-height: 5rem;
		box-sizing: border-box;
		border-radius: 0.65rem;
		border: 1px solid rgba(255, 255, 255, 0.06);
		background: rgba(0, 0, 0, 0.2);
		position: relative;
		overflow: hidden;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		flex: 1;
		color: rgba(255, 255, 255, 0.3);
		font-size: 0.8rem;
	}

	.sg-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.sg-name {
		font-size: 0.72rem;
		color: rgba(255, 255, 255, 0.4);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		flex: 1;
	}

	.sg-value {
		font-size: 1.25rem;
		font-weight: 700;
		line-height: 1;
		font-variant-numeric: tabular-nums;
		transition: color 0.3s;
		flex-shrink: 0;
	}

	.sg-unit {
		font-size: 0.72rem;
		font-weight: 400;
		opacity: 0.6;
	}

	.chart-wrap {
		display: flex;
		align-items: stretch;
		gap: 0.35rem;
		flex: 1;
		min-height: 40px;
	}

	.minmax-labels {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		font-size: 0.58rem;
		color: rgba(255, 255, 255, 0.3);
		font-variant-numeric: tabular-nums;
		flex-shrink: 0;
		padding: 1px 0;
	}

	.label-max {
		align-self: flex-start;
	}

	.label-min {
		align-self: flex-start;
	}

	.sparkline {
		flex: 1;
		display: block;
		height: 100%;
		width: 100%;
	}

	.no-history {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1;
	}

	.sg-footer {
		display: flex;
		align-items: center;
		gap: 0.2rem;
		font-size: 0.62rem;
		color: rgba(255, 255, 255, 0.25);
	}
</style>
