<script lang="ts">
	import { states, connection, lang, motion, editMode, ripple } from '$lib/Stores';
	import { callService } from 'home-assistant-js-websocket';
	import { openModal } from 'svelte-modals';
	import { getName } from '$lib/Utils';
	import Icon from '@iconify/svelte';
	import Ripple from 'svelte-ripple';

	export let sel: any;

	$: entity_id = sel?.entity_id;
	$: entity = $states?.[entity_id];
	$: attributes = entity?.attributes;
	$: currentTemp = attributes?.current_temperature;
	$: targetTemp = attributes?.temperature;
	$: hvacMode = entity?.state;
	$: unit = attributes?.temperature_unit || '°C';
	$: humidity = attributes?.current_humidity;
	$: hvacModes = (attributes?.hvac_modes as string[]) ?? [];
	$: name = sel?.name || getName(undefined, entity) || entity_id || 'Climate';
	$: isOff = !hvacMode || hvacMode === 'off' || hvacMode === 'unavailable';
	$: isActive = !isOff;

	// First non-off mode to restore to when toggling on
	$: onMode = hvacModes.find((m) => m !== 'off') || 'heat';

	const hvacIcons: Record<string, string> = {
		cool: 'mdi:snowflake',
		dry: 'mdi:water-percent',
		fan_only: 'mdi:fan',
		auto: 'mdi:thermostat-auto',
		heat: 'mdi:fire',
		off: 'mdi:power',
		heat_cool: 'mdi:sun-snowflake-variant'
	};

	const hvacGradients: Record<string, string> = {
		heat: 'linear-gradient(135deg, rgba(249,115,22,0.22) 0%, rgba(251,191,36,0.12) 100%)',
		cool: 'linear-gradient(135deg, rgba(56,189,248,0.22) 0%, rgba(99,102,241,0.12) 100%)',
		dry: 'linear-gradient(135deg, rgba(167,139,250,0.2) 0%, rgba(99,102,241,0.1) 100%)',
		fan_only: 'linear-gradient(135deg, rgba(110,231,183,0.2) 0%, rgba(16,185,129,0.1) 100%)',
		auto: 'linear-gradient(135deg, rgba(251,191,36,0.18) 0%, rgba(245,158,11,0.08) 100%)',
		heat_cool: 'linear-gradient(135deg, rgba(249,115,22,0.18) 0%, rgba(56,189,248,0.18) 100%)',
		off: 'none'
	};

	const hvacColors: Record<string, string> = {
		heat: '#f97316',
		cool: '#38bdf8',
		dry: '#a78bfa',
		fan_only: '#6ee7b7',
		auto: '#fbbf24',
		heat_cool: '#fb923c',
		off: 'rgba(255,255,255,0.25)'
	};

	const hvacGlow: Record<string, string> = {
		heat: '0 0 28px rgba(249,115,22,0.2)',
		cool: '0 0 28px rgba(56,189,248,0.2)',
		dry: '0 0 28px rgba(167,139,250,0.15)',
		fan_only: '0 0 28px rgba(110,231,183,0.15)',
		auto: '0 0 28px rgba(251,191,36,0.15)',
		heat_cool: '0 0 28px rgba(249,115,22,0.15)',
		off: 'none'
	};

	$: modeIcon = hvacIcons[hvacMode] || 'mdi:thermostat';
	$: modeColor = hvacColors[hvacMode] || 'rgba(255,255,255,0.5)';
	$: modeGradient = hvacGradients[hvacMode] || 'none';
	$: modeGlow = hvacGlow[hvacMode] || 'none';

	function setTemp(delta: number, e: MouseEvent) {
		e.stopPropagation();
		if (targetTemp == null || isOff) return;
		callService($connection, 'climate', 'set_temperature', {
			entity_id,
			temperature: Math.round((targetTemp + delta) * 2) / 2
		});
	}

	function togglePower(e: MouseEvent) {
		e.stopPropagation();
		if (isOff) {
			callService($connection, 'climate', 'set_hvac_mode', {
				entity_id,
				hvac_mode: onMode
			});
		} else {
			callService($connection, 'climate', 'turn_off', { entity_id });
		}
		if ('vibrate' in navigator) navigator.vibrate(30);
	}

	function setMode(mode: string, e: MouseEvent) {
		e.stopPropagation();
		callService($connection, 'climate', 'set_hvac_mode', { entity_id, hvac_mode: mode });
	}

	function handleClick() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/EntityCardConfig.svelte'), {
				sel,
				domain: 'climate',
				title: 'Climate'
			});
		} else {
			openModal(() => import('$lib/Modal/ClimateModal.svelte'), { sel });
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="climate-card"
	class:active={isActive}
	on:click={handleClick}
	use:Ripple={{ ...$ripple, color: 'rgba(0,0,0,0.12)' }}
	style:transition="all {$motion}ms ease"
	style:background={modeGradient}
	style:box-shadow={modeGlow}
>
	<!-- Top: mode badge + humidity + power toggle -->
	<div class="top-row">
		<div class="mode-badge" style:background="{modeColor}22" style:color={modeColor}>
			<Icon icon={modeIcon} height="13" width="13" />
			<span>{$lang(hvacMode) || hvacMode || 'off'}</span>
		</div>

		<div class="top-right">
			{#if humidity != null}
				<div class="humidity">
					<Icon icon="mdi:water-percent" height="11" width="11" />
					{humidity}%
				</div>
			{/if}
			<!-- Power toggle -->
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<button
				class="power-btn"
				class:on={isActive}
				on:click={togglePower}
				style:color={isActive ? modeColor : 'rgba(255,255,255,0.3)'}
				title={isOff ? 'Turn on' : 'Turn off'}
			>
				<Icon icon="mdi:power" height="16" width="16" />
			</button>
		</div>
	</div>

	<!-- Middle: current temp (big) + target with ± buttons -->
	<div class="temps-row">
		<div class="current-block">
			<span class="current-val">{currentTemp != null ? currentTemp : '--'}</span>
			<span class="temp-unit">{unit}</span>
		</div>

		{#if targetTemp != null && !isOff}
			<div class="target-block">
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<button class="temp-btn" on:click={(e) => setTemp(-0.5, e)}>−</button>
				<div class="target-inner">
					<span class="target-label">Target</span>
					<span class="target-val" style:color={modeColor}>{targetTemp}{unit}</span>
				</div>
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<button class="temp-btn" on:click={(e) => setTemp(0.5, e)}>+</button>
			</div>
		{/if}
	</div>

	<!-- Bottom: entity name + quick mode switch -->
	<div class="bottom-row">
		<span class="entity-name">{name}</span>

		{#if !$editMode && hvacModes.length > 1}
			<div class="mode-pills" on:click|stopPropagation>
				{#each hvacModes.filter((m) => m !== hvacMode).slice(0, 3) as mode}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<button
						class="mode-pill"
						on:click={(e) => setMode(mode, e)}
						style:color={hvacColors[mode] || 'rgba(255,255,255,0.4)'}
						title={mode}
					>
						<Icon icon={hvacIcons[mode] || 'mdi:thermostat'} height="13" width="13" />
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.climate-card {
		background: var(--theme-button-background-color-off, rgba(0, 0, 0, 0.2));
		border-radius: 0.65rem;
		padding: 0.85rem 1rem 0.8rem;
		cursor: pointer;
		height: 100%;
		min-height: 5.5rem;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 0.3rem;
		position: relative;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.06);
		box-sizing: border-box;
	}

	.top-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.mode-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.18rem 0.5rem 0.18rem 0.35rem;
		border-radius: 999px;
		font-size: 0.68rem;
		font-weight: 600;
		text-transform: capitalize;
		letter-spacing: 0.02em;
		flex-shrink: 0;
	}

	.top-right {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.humidity {
		display: flex;
		align-items: center;
		gap: 0.15rem;
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.4);
	}

	.power-btn {
		background: rgba(255, 255, 255, 0.08);
		border: none;
		border-radius: 50%;
		width: 26px;
		height: 26px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.15s, color 0.15s;
		flex-shrink: 0;
	}

	.power-btn.on {
		background: rgba(255, 255, 255, 0.12);
	}

	.power-btn:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.temps-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.current-block {
		display: flex;
		align-items: baseline;
		gap: 0.1rem;
	}

	.current-val {
		font-size: 2rem;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.95);
		line-height: 1;
		letter-spacing: -0.02em;
	}

	.temp-unit {
		font-size: 0.78rem;
		color: rgba(255, 255, 255, 0.4);
		margin-left: 0.1rem;
	}

	.target-block {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		background: rgba(255, 255, 255, 0.06);
		border-radius: 0.5rem;
		padding: 0.22rem 0.35rem;
	}

	.target-inner {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 2.6rem;
	}

	.target-label {
		font-size: 0.58rem;
		color: rgba(255, 255, 255, 0.35);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		line-height: 1;
	}

	.target-val {
		font-size: 0.9rem;
		font-weight: 700;
		line-height: 1.3;
	}

	.temp-btn {
		background: rgba(255, 255, 255, 0.1);
		border: none;
		border-radius: 50%;
		width: 22px;
		height: 22px;
		cursor: pointer;
		color: rgba(255, 255, 255, 0.8);
		font-size: 1.1rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
		padding: 0;
		transition: background 0.15s;
		font-family: inherit;
	}

	.temp-btn:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.bottom-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.entity-name {
		font-size: 0.76rem;
		color: rgba(255, 255, 255, 0.45);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		flex: 1;
		min-width: 0;
	}

	.mode-pills {
		display: flex;
		gap: 0.2rem;
	}

	.mode-pill {
		background: rgba(255, 255, 255, 0.07);
		border: none;
		border-radius: 50%;
		width: 22px;
		height: 22px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.15s;
	}

	.mode-pill:hover {
		background: rgba(255, 255, 255, 0.15);
	}
</style>
