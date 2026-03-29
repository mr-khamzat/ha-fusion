<script lang="ts">
	import { states, editMode, motion, ripple } from '$lib/Stores';
	import { openModal } from 'svelte-modals';
	import { getName } from '$lib/Utils';
	import Icon from '@iconify/svelte';
	import Ripple from 'svelte-ripple';

	export let sel: any;

	$: entity_id = sel?.entity_id;
	$: entity = $states?.[entity_id];
	$: state = entity?.state || 'off';
	$: attrs = entity?.attributes || {};
	$: name = sel?.name || getName(undefined, entity) || entity_id || 'Sensor';
	$: isOn = state === 'on';
	$: deviceClass = attrs.device_class || '';

	const classConfig: Record<string, { on: { icon: string; label: string; color: string }; off: { icon: string; label: string; color: string } }> = {
		motion: {
			on: { icon: 'mdi:motion-sensor', label: 'Detected', color: 'rgba(251,191,36,0.9)' },
			off: { icon: 'mdi:motion-sensor-off', label: 'Clear', color: 'rgba(255,255,255,0.3)' }
		},
		door: {
			on: { icon: 'mdi:door-open', label: 'Open', color: 'rgba(251,146,60,0.9)' },
			off: { icon: 'mdi:door-closed', label: 'Closed', color: 'rgba(52,211,153,0.9)' }
		},
		window: {
			on: { icon: 'mdi:window-open', label: 'Open', color: 'rgba(251,146,60,0.9)' },
			off: { icon: 'mdi:window-closed', label: 'Closed', color: 'rgba(52,211,153,0.9)' }
		},
		smoke: {
			on: { icon: 'mdi:smoke-detector-alert', label: 'Smoke!', color: 'rgba(248,113,113,1)' },
			off: { icon: 'mdi:smoke-detector', label: 'Clear', color: 'rgba(52,211,153,0.9)' }
		},
		moisture: {
			on: { icon: 'mdi:water-alert', label: 'Wet', color: 'rgba(96,165,250,0.9)' },
			off: { icon: 'mdi:water-off', label: 'Dry', color: 'rgba(255,255,255,0.3)' }
		},
		occupancy: {
			on: { icon: 'mdi:home-account', label: 'Occupied', color: 'rgba(52,211,153,0.9)' },
			off: { icon: 'mdi:home-outline', label: 'Empty', color: 'rgba(255,255,255,0.3)' }
		},
		vibration: {
			on: { icon: 'mdi:vibrate', label: 'Vibrating', color: 'rgba(251,191,36,0.9)' },
			off: { icon: 'mdi:vibrate-off', label: 'Clear', color: 'rgba(255,255,255,0.3)' }
		},
		plug: {
			on: { icon: 'mdi:power-plug', label: 'Plugged', color: 'rgba(52,211,153,0.9)' },
			off: { icon: 'mdi:power-plug-off', label: 'Unplugged', color: 'rgba(255,255,255,0.3)' }
		}
	};

	$: cfg = classConfig[deviceClass] || {
		on: { icon: 'mdi:check-circle', label: 'On', color: 'rgba(52,211,153,0.9)' },
		off: { icon: 'mdi:circle-outline', label: 'Off', color: 'rgba(255,255,255,0.3)' }
	};

	$: current = isOn ? cfg.on : cfg.off;
	$: isAlarm = isOn && ['smoke', 'gas', 'carbon_monoxide'].includes(deviceClass);

	function handleEdit() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/EntityCardConfig.svelte'), {
				sel,
				domain: 'binary_sensor',
				title: 'Binary Sensor'
			});
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="binary-card"
	class:alarm={isAlarm}
	on:click={handleEdit}
	use:Ripple={{ ...$ripple, color: 'rgba(255,255,255,0.04)' }}
	style:transition="opacity {$motion}ms ease, background 0.4s ease"
	style:cursor={$editMode ? 'pointer' : 'default'}
	style:--state-color={current.color}
>
	{#if !entity_id}
		<div class="empty-state">
			<Icon icon="mdi:checkbox-blank-circle-outline" height="28" width="28" style="opacity:0.3" />
			<span>Configure Sensor</span>
		</div>
	{:else}
		<div class="sensor-icon" style:filter="drop-shadow(0 0 8px {current.color})">
			<Icon icon={current.icon} height="32" width="32" style="color:{current.color}" />
		</div>
		<div class="sensor-label" style:color={current.color}>{current.label}</div>
		<div class="sensor-name">{name}</div>
	{/if}
</div>

<style>
	.binary-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.3rem;
		padding: 0.85rem 1rem;
		height: 100%;
		min-height: 5rem;
		box-sizing: border-box;
		border-radius: 0.65rem;
		border: 1px solid rgba(255, 255, 255, 0.06);
		background: rgba(0, 0, 0, 0.2);
		position: relative;
		overflow: hidden;
		cursor: pointer;
	}

	.binary-card.alarm {
		animation: alarm-flash 0.6s ease-in-out infinite alternate;
	}

	@keyframes alarm-flash {
		from { background: rgba(239, 68, 68, 0.12); }
		to { background: rgba(239, 68, 68, 0.28); }
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		color: rgba(255, 255, 255, 0.3);
		font-size: 0.8rem;
	}

	.sensor-icon {
		transition: filter 0.4s ease;
	}

	.sensor-label {
		font-size: 1rem;
		font-weight: 600;
		transition: color 0.3s;
	}

	.sensor-name {
		font-size: 0.72rem;
		color: rgba(255, 255, 255, 0.35);
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}
</style>
