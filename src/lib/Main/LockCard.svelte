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
	$: name = sel?.name || getName(undefined, entity) || entity_id || 'Lock';
	$: isLocked = state === 'locked';
	$: isLocking = state === 'locking';
	$: isUnlocking = state === 'unlocking';
	$: isJammed = state === 'jammed';

	$: statusColor = isLocked
		? 'rgba(52,211,153,0.9)'
		: isJammed
			? 'rgba(248,113,113,0.9)'
			: isLocking || isUnlocking
				? 'rgba(251,191,36,0.9)'
				: 'rgba(96,165,250,0.9)';

	$: statusIcon = isLocked ? 'mdi:lock' : isJammed ? 'mdi:lock-alert' : 'mdi:lock-open';
	$: statusLabel = isLocked ? 'Locked' : isJammed ? 'Jammed' : isLocking ? 'Locking…' : isUnlocking ? 'Unlocking…' : 'Unlocked';

	function lock() {
		if ($editMode) return;
		callService($connection, 'lock', 'lock', { entity_id });
		if ('vibrate' in navigator) navigator.vibrate(30);
	}

	function unlock() {
		if ($editMode) return;
		callService($connection, 'lock', 'unlock', { entity_id });
		if ('vibrate' in navigator) navigator.vibrate(30);
	}

	function handleEdit() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/EntityCardConfig.svelte'), {
				sel,
				domain: 'lock',
				title: 'Lock'
			});
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="lock-card"
	on:click={handleEdit}
	style:transition="opacity {$motion}ms ease"
	style:cursor={$editMode ? 'pointer' : 'default'}
	style:--status-color={statusColor}
>
	{#if !entity_id}
		<div class="empty-state">
			<Icon icon="mdi:lock-outline" height="28" width="28" style="opacity:0.3" />
			<span>Configure Lock</span>
		</div>
	{:else}
		<div class="lock-body">
			<div class="lock-icon" style:filter="drop-shadow(0 0 10px {statusColor})">
				<Icon icon={statusIcon} height="36" width="36" style="color:{statusColor}" />
			</div>
			<div class="lock-info">
				<span class="lock-name">{name}</span>
				<span class="lock-status" style:color={statusColor}>{statusLabel}</span>
			</div>
		</div>

		{#if !$editMode}
			<div class="lock-actions" on:click|stopPropagation>
				{#if isLocked}
					<button class="lock-btn unlock" on:click={unlock} use:Ripple={$ripple}>
						<Icon icon="mdi:lock-open-outline" height="14" width="14" />
						Unlock
					</button>
				{:else if !isLocking && !isUnlocking}
					<button class="lock-btn lock" on:click={lock} use:Ripple={$ripple}>
						<Icon icon="mdi:lock-outline" height="14" width="14" />
						Lock
					</button>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<style>
	.lock-card {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 0.6rem;
		padding: 0.9rem 1rem;
		height: 100%;
		min-height: 5rem;
		box-sizing: border-box;
		border-radius: 0.65rem;
		border: 1px solid rgba(255, 255, 255, 0.06);
		background: rgba(0, 0, 0, 0.2);
		position: relative;
		overflow: hidden;
		transition: background 0.4s ease;
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

	.lock-body {
		display: flex;
		align-items: center;
		gap: 0.8rem;
	}

	.lock-icon {
		flex-shrink: 0;
		transition: filter 0.4s ease;
	}

	.lock-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.lock-name {
		font-size: 0.82rem;
		color: rgba(255, 255, 255, 0.4);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.lock-status {
		font-size: 1.1rem;
		font-weight: 600;
		transition: color 0.3s;
	}

	.lock-actions {
		display: flex;
	}

	.lock-btn {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.35rem 0.9rem;
		border-radius: 999px;
		border: none;
		font-family: inherit;
		font-size: 0.78rem;
		cursor: pointer;
		transition: background 0.15s;
	}

	.lock-btn.unlock {
		background: rgba(96, 165, 250, 0.15);
		color: rgba(96, 165, 250, 0.9);
	}

	.lock-btn.unlock:hover { background: rgba(96, 165, 250, 0.25); }

	.lock-btn.lock {
		background: rgba(52, 211, 153, 0.15);
		color: rgba(52, 211, 153, 0.9);
	}

	.lock-btn.lock:hover { background: rgba(52, 211, 153, 0.25); }
</style>
