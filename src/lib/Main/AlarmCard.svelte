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
	$: state = entity?.state || 'unavailable';
	$: name = getName(sel, entity) || entity_id || 'Alarm';

	const stateConfig: Record<string, { label: string; icon: string; color: string; bg: string }> = {
		disarmed: {
			label: 'Disarmed',
			icon: 'mdi:shield-off-outline',
			color: 'rgba(52, 211, 153, 0.9)',
			bg: 'rgba(16, 185, 129, 0.1)'
		},
		armed_home: {
			label: 'Armed Home',
			icon: 'mdi:shield-home-outline',
			color: 'rgba(147, 197, 253, 0.9)',
			bg: 'rgba(59, 130, 246, 0.12)'
		},
		armed_away: {
			label: 'Armed Away',
			icon: 'mdi:shield-lock-outline',
			color: 'rgba(251, 146, 60, 0.9)',
			bg: 'rgba(249, 115, 22, 0.12)'
		},
		armed_night: {
			label: 'Armed Night',
			icon: 'mdi:shield-moon-outline',
			color: 'rgba(167, 139, 250, 0.9)',
			bg: 'rgba(139, 92, 246, 0.12)'
		},
		armed_vacation: {
			label: 'Armed Vacation',
			icon: 'mdi:shield-airplane-outline',
			color: 'rgba(251, 191, 36, 0.9)',
			bg: 'rgba(245, 158, 11, 0.12)'
		},
		triggered: {
			label: 'TRIGGERED',
			icon: 'mdi:alarm-light',
			color: 'rgba(248, 113, 113, 1)',
			bg: 'rgba(239, 68, 68, 0.2)'
		},
		pending: {
			label: 'Pending...',
			icon: 'mdi:shield-half-full',
			color: 'rgba(251, 191, 36, 0.9)',
			bg: 'rgba(245, 158, 11, 0.12)'
		},
		arming: {
			label: 'Arming...',
			icon: 'mdi:shield-sync-outline',
			color: 'rgba(251, 191, 36, 0.9)',
			bg: 'rgba(245, 158, 11, 0.12)'
		}
	};

	$: cfg = stateConfig[state] || {
		label: state,
		icon: 'mdi:shield-outline',
		color: 'rgba(255,255,255,0.4)',
		bg: 'rgba(255,255,255,0.05)'
	};

	$: isTriggered = state === 'triggered';
	$: isDisarmed = state === 'disarmed';

	function arm(mode: string) {
		if ($editMode) return;
		callService($connection, 'alarm_control_panel', `alarm_arm_${mode}`, { entity_id });
		if ('vibrate' in navigator) navigator.vibrate(30);
	}

	function disarm() {
		if ($editMode) return;
		// open modal for code entry if needed
		openModal(() => import('$lib/Modal/AlarmControlPanelModal.svelte'), { sel });
	}

	function handleEdit() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/EntityCardConfig.svelte'), {
				sel,
				domain: 'alarm_control_panel',
				title: 'Alarm'
			});
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="alarm-card"
	class:triggered={isTriggered}
	on:click={handleEdit}
	style:--state-color={cfg.color}
	style:--state-bg={cfg.bg}
	style:transition="opacity {$motion}ms ease"
>
	{#if !entity_id}
		<div class="empty-state">
			<Icon icon="mdi:shield-outline" height="28" width="28" style="opacity:0.3" />
			<span>Configure Alarm</span>
		</div>
	{:else}
		<!-- Status area -->
		<div class="status-area">
			<div class="status-icon-wrap">
				<Icon icon={cfg.icon} height="32" width="32" />
			</div>
			<div class="status-info">
				<div class="entity-name">{name}</div>
				<div class="state-label">{cfg.label}</div>
			</div>
		</div>

		<!-- Action buttons -->
		{#if !$editMode}
			<div class="actions">
				{#if !isDisarmed}
					<button class="action-pill disarm" on:click|stopPropagation={disarm} use:Ripple={$ripple}>
						<Icon icon="mdi:shield-off-outline" height="14" width="14" />
						Disarm
					</button>
				{:else}
					<button
						class="action-pill arm-home"
						on:click|stopPropagation={() => arm('home')}
						use:Ripple={$ripple}
					>
						<Icon icon="mdi:shield-home-outline" height="14" width="14" />
						Home
					</button>
					<button
						class="action-pill arm-away"
						on:click|stopPropagation={() => arm('away')}
						use:Ripple={$ripple}
					>
						<Icon icon="mdi:shield-lock-outline" height="14" width="14" />
						Away
					</button>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<style>
	.alarm-card {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 0.6rem;
		padding: 0.9rem 1rem;
		height: 100%;
		min-height: 5rem;
		box-sizing: border-box;
		background: var(--state-bg);
		border-radius: 0.65rem;
		border: 1px solid rgba(255, 255, 255, 0.06);
		transition: background 0.4s ease;
		position: relative;
		overflow: hidden;
	}

	.triggered {
		animation: alarm-pulse 0.8s ease-in-out infinite alternate;
	}

	@keyframes alarm-pulse {
		from { background: rgba(239, 68, 68, 0.15); }
		to { background: rgba(239, 68, 68, 0.3); }
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

	.status-area {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.status-icon-wrap {
		color: var(--state-color);
		flex-shrink: 0;
		display: flex;
		filter: drop-shadow(0 0 8px var(--state-color));
	}

	.status-info {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
	}

	.entity-name {
		font-size: 0.78rem;
		color: rgba(255, 255, 255, 0.4);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.state-label {
		font-size: 1rem;
		font-weight: 600;
		color: var(--state-color);
	}

	.actions {
		display: flex;
		gap: 0.5rem;
	}

	.action-pill {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.35rem 0.75rem;
		border-radius: 999px;
		border: none;
		font-family: inherit;
		font-size: 0.78rem;
		cursor: pointer;
		transition: background 0.15s;
	}

	.action-pill.disarm {
		background: rgba(52, 211, 153, 0.15);
		color: rgba(52, 211, 153, 0.9);
	}

	.action-pill.disarm:hover {
		background: rgba(52, 211, 153, 0.25);
	}

	.action-pill.arm-home {
		background: rgba(147, 197, 253, 0.15);
		color: rgba(147, 197, 253, 0.9);
	}

	.action-pill.arm-home:hover {
		background: rgba(147, 197, 253, 0.25);
	}

	.action-pill.arm-away {
		background: rgba(251, 146, 60, 0.15);
		color: rgba(251, 146, 60, 0.9);
	}

	.action-pill.arm-away:hover {
		background: rgba(251, 146, 60, 0.25);
	}
</style>
