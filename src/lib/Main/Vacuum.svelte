<script lang="ts">
	import { states, connection, editMode, motion, ripple } from '$lib/Stores';
	import { callService } from 'home-assistant-js-websocket';
	import { openModal } from 'svelte-modals';
	import { getName } from '$lib/Utils';
	import Icon from '@iconify/svelte';
	import Ripple from 'svelte-ripple';

	export let sel: any;

	$: entity_id = sel?.entity_id;
	$: entity = $states?.[entity_id];
	$: state = entity?.state || 'unknown';
	$: attrs = entity?.attributes || {};
	$: name = sel?.name || getName(undefined, entity) || entity_id || 'Vacuum';
	$: battery = attrs.battery_level as number | undefined;
	$: fanSpeed = (attrs.fan_speed as string) || '';
	$: fanSpeeds = (attrs.fan_speed_list as string[]) || [];
	$: errorMsg = attrs.error as string | undefined;

	// supported_features bitmask
	$: sf = (attrs.supported_features as number) || 0;
	$: supportsFanSpeed = (sf & 32) > 0;
	$: supportsLocate = (sf & 512) > 0;
	$: supportsCleanSpot = (sf & 1024) > 0;
	$: supportsStop = (sf & 8) > 0;
	$: supportsPause = (sf & 4) > 0;
	$: supportsReturn = (sf & 16) > 0;

	$: isCleaning = state === 'cleaning';
	$: isDocked = state === 'docked';
	$: isPaused = state === 'paused';
	$: isReturning = state === 'returning';
	$: isError = state === 'error';
	$: isIdle = state === 'idle';

	$: stateColor = isCleaning
		? '#34d399'
		: isDocked
			? '#93c5fd'
			: isPaused
				? '#fbbf24'
				: isReturning
					? '#a78bfa'
					: isError
						? '#f87171'
						: 'rgba(255,255,255,0.35)';

	$: stateIcon = isCleaning
		? 'mdi:robot-vacuum'
		: isDocked
			? 'mdi:robot-vacuum'
			: isPaused
				? 'mdi:robot-vacuum'
				: isError
					? 'mdi:robot-vacuum-alert'
					: 'mdi:robot-vacuum';

	$: batteryIcon =
		battery == null
			? 'mdi:battery-unknown'
			: battery < 10
				? 'mdi:battery-outline'
				: battery < 25
					? 'mdi:battery-low'
					: battery < 50
						? 'mdi:battery-30'
						: battery < 75
							? 'mdi:battery-60'
							: battery < 90
								? 'mdi:battery-80'
								: 'mdi:battery';

	function svc(service: string, data: Record<string, any> = {}) {
		if ($editMode) return;
		callService($connection, 'vacuum', service, { entity_id, ...data });
	}

	// Chinese (Roborock/Xiaomi) and English → Russian fan speed names
	const FAN_SPEED_RU: Record<string, string> = {
		// Chinese
		'安静': 'Тихий', '静音': 'Тихий',
		'标准': 'Стандарт', '标准清扫': 'Стандарт',
		'强力': 'Мощный', '强劲': 'Мощный', '加强': 'Мощный',
		'MAX': 'Макс', '最强': 'Макс', '最大力': 'Макс',
		'自动': 'Авто',
		// English
		'Gentle': 'Тихий', 'Silent': 'Тихий', 'Quiet': 'Тихий', 'Whisper': 'Тихий',
		'Eco': 'Эко', 'Auto': 'Авто',
		'Balanced': 'Баланс', 'Standard': 'Стандарт', 'Medium': 'Средний',
		'Strong': 'Мощный', 'Performance': 'Мощный',
		'Turbo': 'Турбо', 'Boost': 'Ускорение',
		'Max': 'Макс', 'Maximum': 'Макс',
		'off': 'Выкл', 'low': 'Слабый', 'medium_low': 'Ниже среднего',
		'high': 'Мощный', 'max': 'Макс'
	};

	function translateSpeed(s: string): string {
		return FAN_SPEED_RU[s] ?? s;
	}

	function setFanSpeed(speed: string) {
		if ($editMode) return;
		callService($connection, 'vacuum', 'set_fan_speed', { entity_id, fan_speed: speed });
	}

	function handleEdit() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/EntityCardConfig.svelte'), {
				sel,
				domain: 'vacuum',
				title: 'Vacuum'
			});
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="vacuum-card"
	on:click={handleEdit}
	style:transition="opacity {$motion}ms ease"
	style:cursor={$editMode ? 'pointer' : 'default'}
>
	{#if !entity_id}
		<div class="empty-state">
			<Icon icon="mdi:robot-vacuum" height="30" width="30" style="opacity:0.3" />
			<span>Настроить пылесос</span>
		</div>
	{:else}
		<!-- Top row: icon + info + battery -->
		<div class="vac-top">
			<div class="vac-icon" class:spin={isCleaning} style:color={stateColor}>
				<Icon icon={stateIcon} height="32" width="32" />
			</div>
			<div class="vac-info">
				<span class="vac-name">{name}</span>
				<span class="vac-state" style:color={stateColor}>
					{#if isCleaning}Уборка…
					{:else if isDocked}На базе
					{:else if isPaused}Пауза
					{:else if isReturning}Возврат…
					{:else if isError}Ошибка
					{:else if isIdle}Ожидание
					{:else}{state}
					{/if}
				</span>
				{#if errorMsg}
					<span class="vac-error">{errorMsg}</span>
				{/if}
			</div>
			{#if battery != null}
				<div class="battery" class:low={battery < 20}>
					<Icon icon={batteryIcon} height="16" width="16" />
					<span>{battery}%</span>
				</div>
			{/if}
		</div>

		{#if !$editMode}
			<!-- Fan speed pills -->
			{#if supportsFanSpeed && fanSpeeds.length > 0}
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div class="fan-row" on:click|stopPropagation>
					<Icon icon="mdi:fan" height="12" width="12" style="color:rgba(255,255,255,0.35);flex-shrink:0" />
					{#each fanSpeeds as speed}
						<button
							class="fan-pill"
							class:active={fanSpeed === speed}
							on:click={() => setFanSpeed(speed)}
							use:Ripple={$ripple}
						>
							{translateSpeed(speed)}
						</button>
					{/each}
				</div>
			{/if}

			<!-- Action buttons -->
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div class="vac-actions" on:click|stopPropagation>
				<!-- Start / Resume -->
				{#if !isCleaning}
					<button class="vac-btn start" on:click={() => svc('start')} use:Ripple={$ripple}>
						<Icon icon="mdi:play" height="14" width="14" />
						{isPaused ? 'Продолжить' : 'Старт'}
					</button>
				{/if}

				<!-- Pause -->
				{#if isCleaning && supportsPause}
					<button class="vac-btn pause" on:click={() => svc('pause')} use:Ripple={$ripple}>
						<Icon icon="mdi:pause" height="14" width="14" />
						Пауза
					</button>
				{/if}

				<!-- Stop -->
				{#if (isCleaning || isPaused) && supportsStop}
					<button class="vac-btn stop" on:click={() => svc('stop')} use:Ripple={$ripple}>
						<Icon icon="mdi:stop" height="14" width="14" />
						Стоп
					</button>
				{/if}

				<!-- Return to base -->
				{#if !isDocked && supportsReturn}
					<button class="vac-btn dock" on:click={() => svc('return_to_base')} use:Ripple={$ripple}>
						<Icon icon="mdi:home-import-outline" height="14" width="14" />
						База
					</button>
				{/if}

				<!-- Clean spot -->
				{#if supportsCleanSpot}
					<button class="vac-btn spot" on:click={() => svc('clean_spot')} use:Ripple={$ripple}>
						<Icon icon="mdi:target" height="14" width="14" />
						Точка
					</button>
				{/if}

				<!-- Locate -->
				{#if supportsLocate}
					<button class="vac-btn locate" on:click={() => svc('locate')} use:Ripple={$ripple}>
						<Icon icon="mdi:map-marker" height="14" width="14" />
					</button>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<style>
	.vacuum-card {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
		padding: 0.85rem 1rem;
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

	.vac-top {
		display: flex;
		align-items: center;
		gap: 0.65rem;
	}

	.vac-icon {
		flex-shrink: 0;
		transition: color 0.3s;
	}

	.vac-icon.spin {
		animation: spin 4s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	.vac-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.05rem;
	}

	.vac-name {
		font-size: 0.9rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.vac-state {
		font-size: 0.75rem;
		font-weight: 500;
		transition: color 0.3s;
	}

	.vac-error {
		font-size: 0.68rem;
		color: rgba(248, 113, 113, 0.7);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.battery {
		display: flex;
		align-items: center;
		gap: 0.15rem;
		font-size: 0.72rem;
		color: rgba(255, 255, 255, 0.5);
		flex-shrink: 0;
	}

	.battery.low {
		color: rgba(248, 113, 113, 0.9);
	}

	/* Fan speed row */
	.fan-row {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		flex-wrap: wrap;
	}

	.fan-pill {
		font-family: inherit;
		font-size: 0.68rem;
		padding: 0.18rem 0.5rem;
		border-radius: 999px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(255, 255, 255, 0.05);
		color: rgba(255, 255, 255, 0.5);
		cursor: pointer;
		transition: background 0.15s, color 0.15s, border-color 0.15s;
		white-space: nowrap;
	}

	.fan-pill.active {
		background: rgba(96, 165, 250, 0.15);
		border-color: rgba(96, 165, 250, 0.4);
		color: rgba(147, 197, 253, 0.95);
	}

	.fan-pill:hover:not(.active) {
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.75);
	}

	/* Action buttons */
	.vac-actions {
		display: flex;
		gap: 0.35rem;
		flex-wrap: wrap;
	}

	.vac-btn {
		display: flex;
		align-items: center;
		gap: 0.28rem;
		padding: 0.32rem 0.65rem;
		border-radius: 999px;
		border: none;
		font-family: inherit;
		font-size: 0.73rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
	}

	.vac-btn.start {
		background: rgba(52, 211, 153, 0.15);
		color: rgba(52, 211, 153, 0.95);
	}
	.vac-btn.start:hover { background: rgba(52, 211, 153, 0.28); }

	.vac-btn.pause {
		background: rgba(251, 191, 36, 0.15);
		color: rgba(251, 191, 36, 0.95);
	}
	.vac-btn.pause:hover { background: rgba(251, 191, 36, 0.28); }

	.vac-btn.stop {
		background: rgba(248, 113, 113, 0.12);
		color: rgba(248, 113, 113, 0.85);
	}
	.vac-btn.stop:hover { background: rgba(248, 113, 113, 0.22); }

	.vac-btn.dock {
		background: rgba(147, 197, 253, 0.12);
		color: rgba(147, 197, 253, 0.85);
	}
	.vac-btn.dock:hover { background: rgba(147, 197, 253, 0.22); }

	.vac-btn.spot {
		background: rgba(167, 139, 250, 0.12);
		color: rgba(167, 139, 250, 0.85);
	}
	.vac-btn.spot:hover { background: rgba(167, 139, 250, 0.22); }

	.vac-btn.locate {
		background: rgba(255, 255, 255, 0.06);
		color: rgba(255, 255, 255, 0.5);
		padding: 0.32rem 0.55rem;
	}
	.vac-btn.locate:hover { background: rgba(255, 255, 255, 0.12); }
</style>
