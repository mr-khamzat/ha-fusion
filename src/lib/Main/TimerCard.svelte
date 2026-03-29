<script lang="ts">
	import { onDestroy } from 'svelte';
	import { states, connection, editMode, motion, ripple } from '$lib/Stores';
	import { callService } from 'home-assistant-js-websocket';
	import { openModal } from 'svelte-modals';
	import { getName } from '$lib/Utils';
	import Icon from '@iconify/svelte';
	import Ripple from 'svelte-ripple';

	export let sel: any;

	$: entity_id = sel?.entity_id;
	$: entity = $states?.[entity_id];
	$: state = entity?.state || 'idle';
	$: attrs = (entity?.attributes || {}) as Record<string, any>;
	$: name = sel?.name || getName(undefined, entity) || entity_id || 'Timer';

	// State styling
	const stateConfig: Record<string, { color: string; bg: string; label: string }> = {
		idle: { color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.04)', label: 'Ожидание' },
		active: { color: 'rgba(52,211,153,0.9)', bg: 'rgba(16,185,129,0.1)', label: 'Активен' },
		paused: { color: 'rgba(251,191,36,0.9)', bg: 'rgba(245,158,11,0.1)', label: 'Пауза' }
	};

	$: cfg = stateConfig[state] || stateConfig.idle;
	$: isActive = state === 'active';
	$: isPaused = state === 'paused';
	$: isIdle = state === 'idle';

	// Parse HH:MM:SS string to total seconds
	function parseDuration(s: string | undefined): number {
		if (!s) return 0;
		const parts = s.split(':').map(Number);
		if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
		if (parts.length === 2) return parts[0] * 60 + parts[1];
		return parseInt(s) || 0;
	}

	// Format seconds to HH:MM:SS
	function formatSeconds(secs: number): string {
		const s = Math.max(0, Math.floor(secs));
		const h = Math.floor(s / 3600);
		const m = Math.floor((s % 3600) / 60);
		const sec = s % 60;
		if (h > 0) {
			return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
		}
		return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
	}

	$: totalSeconds = parseDuration(attrs.duration as string);

	// Real-time countdown
	let remainingSeconds = 0;
	let tickInterval: ReturnType<typeof setInterval> | null = null;

	function startTick() {
		stopTick();
		tickInterval = setInterval(() => {
			if (!isActive || !attrs.finishes_at) {
				stopTick();
				return;
			}
			const finishTime = new Date(attrs.finishes_at as string).getTime();
			const now = Date.now();
			remainingSeconds = Math.max(0, (finishTime - now) / 1000);
		}, 1000);
	}

	function stopTick() {
		if (tickInterval !== null) {
			clearInterval(tickInterval);
			tickInterval = null;
		}
	}

	$: {
		if (isActive && attrs.finishes_at) {
			const finishTime = new Date(attrs.finishes_at as string).getTime();
			remainingSeconds = Math.max(0, (finishTime - Date.now()) / 1000);
			startTick();
		} else if (isPaused) {
			stopTick();
			remainingSeconds = parseDuration(attrs.remaining as string);
		} else {
			stopTick();
			remainingSeconds = totalSeconds;
		}
	}

	$: elapsed = totalSeconds - remainingSeconds;
	$: progress = totalSeconds > 0 ? Math.min(100, Math.max(0, (elapsed / totalSeconds) * 100)) : 0;
	$: displayTime = formatSeconds(remainingSeconds);

	function timerStart() {
		if ($editMode) return;
		callService($connection, 'timer', 'start', { entity_id });
	}

	function timerPause() {
		if ($editMode) return;
		callService($connection, 'timer', 'pause', { entity_id });
	}

	function timerCancel() {
		if ($editMode) return;
		callService($connection, 'timer', 'cancel', { entity_id });
	}

	function handleClick() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/EntityCardConfig.svelte'), {
				sel,
				domain: 'timer',
				title: 'Timer'
			});
		}
	}

	onDestroy(stopTick);
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="timer-card"
	on:click={handleClick}
	use:Ripple={{ ...$ripple, color: 'rgba(255,255,255,0.03)' }}
	style:transition="opacity {$motion}ms ease"
	style:cursor={$editMode ? 'pointer' : 'default'}
	style:--timer-color={cfg.color}
	style:--timer-bg={cfg.bg}
>
	{#if !entity_id}
		<div class="empty-state">
			<Icon icon="mdi:timer-outline" height="28" width="28" style="opacity:0.3" />
			<span>Настроить таймер</span>
		</div>
	{:else}
		<!-- Header -->
		<div class="timer-header">
			<div class="timer-icon">
				<Icon
					icon={isActive ? 'mdi:timer' : isPaused ? 'mdi:timer-pause' : 'mdi:timer-outline'}
					height="16"
					width="16"
					style="color:{cfg.color}"
				/>
			</div>
			<span class="timer-name">{name}</span>
			<span class="timer-state-label" style:color={cfg.color}>{cfg.label}</span>
		</div>

		<!-- Countdown display -->
		<div class="countdown" style:color={cfg.color}>
			{displayTime}
		</div>

		<!-- Progress bar -->
		<div class="progress-track">
			<div
				class="progress-fill"
				style:width="{progress}%"
				style:background={cfg.color}
			></div>
		</div>

		<!-- Duration label -->
		{#if totalSeconds > 0}
			<div class="duration-label">
				{formatSeconds(totalSeconds)} всего
			</div>
		{/if}

		<!-- Buttons -->
		{#if !$editMode}
			<div class="timer-actions">
				{#if isIdle || isPaused}
					<button class="action-btn start" on:click|stopPropagation={timerStart} use:Ripple={$ripple}>
						<Icon icon="mdi:play" height="14" width="14" />
						{isPaused ? 'Продолжить' : 'Старт'}
					</button>
				{/if}
				{#if isActive}
					<button class="action-btn pause" on:click|stopPropagation={timerPause} use:Ripple={$ripple}>
						<Icon icon="mdi:pause" height="14" width="14" />
						Пауза
					</button>
				{/if}
				{#if !isIdle}
					<button class="action-btn cancel" on:click|stopPropagation={timerCancel} use:Ripple={$ripple}>
						<Icon icon="mdi:stop" height="14" width="14" />
						Отмена
					</button>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<style>
	.timer-card {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		padding: 0.9rem 1rem;
		height: 100%;
		min-height: 5rem;
		box-sizing: border-box;
		border-radius: 0.65rem;
		border: 1px solid rgba(255, 255, 255, 0.06);
		background: var(--timer-bg);
		transition: background 0.4s ease;
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

	.timer-header {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.timer-icon {
		display: flex;
		flex-shrink: 0;
	}

	.timer-name {
		flex: 1;
		font-size: 0.72rem;
		color: rgba(255, 255, 255, 0.4);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.timer-state-label {
		font-size: 0.68rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		flex-shrink: 0;
		transition: color 0.3s;
	}

	.countdown {
		font-size: 2rem;
		font-weight: 700;
		line-height: 1;
		font-variant-numeric: tabular-nums;
		transition: color 0.3s ease;
		letter-spacing: 0.02em;
	}

	.progress-track {
		height: 3px;
		background: rgba(255, 255, 255, 0.07);
		border-radius: 2px;
	}

	.progress-fill {
		height: 100%;
		border-radius: 2px;
		transition: width 0.9s linear, background 0.3s ease;
	}

	.duration-label {
		font-size: 0.65rem;
		color: rgba(255, 255, 255, 0.25);
	}

	.timer-actions {
		display: flex;
		gap: 0.4rem;
		margin-top: 0.15rem;
	}

	.action-btn {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.3rem 0.65rem;
		border-radius: 999px;
		border: none;
		font-family: inherit;
		font-size: 0.75rem;
		cursor: pointer;
		transition: background 0.15s;
	}

	.action-btn.start {
		background: rgba(52, 211, 153, 0.15);
		color: rgba(52, 211, 153, 0.9);
	}

	.action-btn.start:hover {
		background: rgba(52, 211, 153, 0.25);
	}

	.action-btn.pause {
		background: rgba(251, 191, 36, 0.15);
		color: rgba(251, 191, 36, 0.9);
	}

	.action-btn.pause:hover {
		background: rgba(251, 191, 36, 0.25);
	}

	.action-btn.cancel {
		background: rgba(248, 113, 113, 0.12);
		color: rgba(248, 113, 113, 0.8);
	}

	.action-btn.cancel:hover {
		background: rgba(248, 113, 113, 0.22);
	}
</style>
