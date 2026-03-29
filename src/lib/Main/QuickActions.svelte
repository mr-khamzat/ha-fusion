<script lang="ts">
	import { states, connection, editMode, motion, ripple } from '$lib/Stores';
	import { callService } from 'home-assistant-js-websocket';
	import { openModal } from 'svelte-modals';
	import Icon from '@iconify/svelte';
	import Ripple from 'svelte-ripple';

	export let sel: any;

	interface Action {
		id: string;
		label: string;
		icon: string;
		domain: string;
		service: string;
		entity_id?: string;
	}

	$: actions = (sel?.actions as Action[]) || [];

	let activatingId: string | null = null;

	async function trigger(action: Action) {
		if ($editMode || activatingId) return;
		activatingId = action.id;
		try {
			await callService($connection, action.domain, action.service, {
				entity_id: action.entity_id
			});
			if ('vibrate' in navigator) navigator.vibrate(20);
		} catch (e) {
			console.error(e);
		}
		setTimeout(() => {
			activatingId = null;
		}, 600);
	}

	function handleEdit() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/QuickActionsConfig.svelte'), { sel });
		}
	}

	function isOn(action: Action): boolean {
		if (!action.entity_id) return false;
		const entity = $states?.[action.entity_id];
		return entity?.state === 'on' || entity?.state === 'playing' || entity?.state === 'home';
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="qa-card"
	on:click={handleEdit}
	style:transition="opacity {$motion}ms ease"
>
	{#if sel?.name}
		<div class="qa-header">{sel.name}</div>
	{/if}

	{#if actions.length === 0}
		<div class="empty-state">
			<Icon icon="mdi:lightning-bolt-outline" height="22" width="22" style="opacity:0.3" />
			<span>Configure Quick Actions</span>
		</div>
	{:else}
		<div class="actions-grid">
			{#each actions as action (action.id)}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div
					class="action-btn"
					class:on={isOn(action)}
					class:activating={activatingId === action.id}
					on:click|stopPropagation={() => trigger(action)}
					use:Ripple={$ripple}
					title={action.label}
				>
					<Icon icon={action.icon || 'mdi:flash'} height="20" width="20" />
					<span class="action-label">{action.label}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.qa-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.8rem;
		height: 100%;
		min-height: 4rem;
		box-sizing: border-box;
		cursor: v-bind("$editMode ? 'pointer' : 'default'");
	}

	.qa-header {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.4);
		font-weight: 500;
		margin-bottom: 0.1rem;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		flex: 1;
		color: rgba(255, 255, 255, 0.3);
		font-size: 0.78rem;
	}

	.actions-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: flex-start;
	}

	.action-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3rem;
		background: rgba(255, 255, 255, 0.07);
		border-radius: 0.65rem;
		padding: 0.7rem 0.8rem 0.5rem;
		cursor: pointer;
		color: rgba(255, 255, 255, 0.45);
		min-width: 4rem;
		transition: background 0.15s, color 0.15s, transform 0.1s;
		user-select: none;
		position: relative;
		overflow: hidden;
	}

	.action-btn.on {
		background: rgba(99, 102, 241, 0.2);
		color: rgba(165, 180, 252, 0.9);
	}

	.action-btn.activating {
		transform: scale(0.95);
		background: rgba(99, 102, 241, 0.35);
	}

	.action-btn:hover {
		background: rgba(255, 255, 255, 0.12);
		color: rgba(255, 255, 255, 0.9);
	}

	.action-label {
		font-size: 0.68rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 4.5rem;
		text-align: center;
	}
</style>
