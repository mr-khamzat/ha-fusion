<script lang="ts">
	import { connection, states, selectedLanguage, motion, editMode } from '$lib/Stores';
	import { fade } from 'svelte/transition';
	import { onDestroy } from 'svelte';

	const ALERT_DEVICE_CLASSES = ['smoke', 'motion', 'door', 'window', 'moisture'];

	let now = new Date();
	let timeStr = '';
	let dateStr = '';

	function formatTime(d: Date): string {
		return new Intl.DateTimeFormat($selectedLanguage || 'en', {
			hour: '2-digit',
			minute: '2-digit'
		}).format(d);
	}

	function formatDate(d: Date): string {
		return new Intl.DateTimeFormat($selectedLanguage || 'en', {
			weekday: 'short',
			day: 'numeric',
			month: 'short'
		}).format(d);
	}

	function tick() {
		now = new Date();
		timeStr = formatTime(now);
		dateStr = formatDate(now);
	}

	tick();

	// Update every minute, aligned to the next minute boundary
	let timer: ReturnType<typeof setTimeout>;

	function scheduleNext() {
		const ms = 60_000 - (Date.now() % 60_000);
		timer = setTimeout(() => {
			tick();
			// Switch to setInterval after first alignment
			clearTimeout(timer);
			timer = setInterval(tick, 60_000) as unknown as ReturnType<typeof setTimeout>;
		}, ms);
	}

	scheduleNext();

	onDestroy(() => clearTimeout(timer));

	// Re-format whenever language changes
	$: if ($selectedLanguage) tick();

	$: isConnected = !!$connection;

	$: alertCount = $states
		? Object.values($states).filter((entity) => {
				if (!entity.entity_id.startsWith('binary_sensor.')) return false;
				if (entity.state !== 'on') return false;
				const dc = entity.attributes?.device_class as string | undefined;
				return dc ? ALERT_DEVICE_CLASSES.includes(dc) : false;
			}).length
		: 0;
</script>

{#if !$editMode}
	<div
		class="status-bar"
		style:transition="opacity {$motion}ms ease"
		transition:fade={{ duration: $motion }}
	>
		<!-- clock -->
		<span class="time">{timeStr}</span>

		<span class="divider">|</span>

		<!-- date -->
		<span class="date">{dateStr}</span>

		<span class="divider">|</span>

		<!-- connection status -->
		<span class="conn-wrap" title={isConnected ? 'Connected' : 'Disconnected'}>
			<span class="conn-dot" class:connected={isConnected} class:disconnected={!isConnected}
			></span>
		</span>

		{#if alertCount > 0}
			<span class="divider">|</span>
			<!-- alert badge -->
			<span class="alert-badge" title="{alertCount} active alert{alertCount !== 1 ? 's' : ''}">
				{alertCount}
			</span>
		{/if}
	</div>
{/if}

<style>
	.status-bar {
		position: fixed;
		top: 1rem;
		right: 1.5rem;
		z-index: 10;
		display: flex;
		align-items: center;
		gap: 0.6rem;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		border-radius: 999px;
		padding: 0.4rem 0.9rem;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.9);
		pointer-events: none;
		user-select: none;
		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	.time {
		font-weight: 600;
		letter-spacing: 0.03em;
		white-space: nowrap;
	}

	.date {
		white-space: nowrap;
		color: rgba(255, 255, 255, 0.7);
	}

	.divider {
		color: rgba(255, 255, 255, 0.2);
		font-size: 0.7rem;
	}

	.conn-wrap {
		display: flex;
		align-items: center;
	}

	.conn-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.conn-dot.connected {
		background: #4ade80;
		box-shadow: 0 0 4px rgba(74, 222, 128, 0.7);
	}

	.conn-dot.disconnected {
		background: #ef4444;
		box-shadow: 0 0 4px rgba(239, 68, 68, 0.7);
		animation: blink 1.4s ease-in-out infinite;
	}

	@keyframes blink {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.3;
		}
	}

	.alert-badge {
		background: rgba(239, 68, 68, 0.85);
		color: white;
		font-size: 0.68rem;
		font-weight: 700;
		line-height: 1;
		min-width: 1.1rem;
		height: 1.1rem;
		border-radius: 999px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 0.3rem;
		pointer-events: auto;
	}
</style>
