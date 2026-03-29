<script lang="ts">
	import { states, connection } from '$lib/Stores';
	import { callService } from 'home-assistant-js-websocket';
	import Icon from '@iconify/svelte';

	export let sel: any;

	$: entityIds = (sel?.entity_ids as string[]) || [];
	$: showAll = !entityIds.length;

	$: automations = showAll
		? Object.values($states ?? {}).filter(e => e.entity_id.startsWith('automation.')).slice(0, sel?.max_items ?? 6)
		: entityIds.map(id => $states?.[id]).filter(Boolean);

	function toggle(entity_id: string, isOn: boolean) {
		callService($connection, 'automation', isOn ? 'turn_off' : 'turn_on', { entity_id });
	}
</script>

<div class="auto-widget">
	<div class="auto-header">
		<Icon icon="mdi:robot-outline" height="13" width="13" style="opacity:0.5" />
		<span>Automations</span>
	</div>

	{#if automations.length === 0}
		<div class="empty">
			<span>No automations</span>
		</div>
	{:else}
		<div class="auto-list">
			{#each automations as e}
				{@const isOn = e?.state === 'on'}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div class="auto-row">
					<span class="auto-name" class:off={!isOn}>
						{e?.attributes?.friendly_name || e?.entity_id?.split('.')[1]?.replace(/_/g, ' ')}
					</span>
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<button
						class="auto-toggle"
						class:on={isOn}
						on:click={() => toggle(e.entity_id, isOn)}
						aria-label={isOn ? 'Disable' : 'Enable'}
					>
						<div class="toggle-thumb"></div>
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.auto-widget {
		padding: var(--theme-sidebar-item-padding);
	}

	.auto-header {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.65rem;
		color: rgba(255, 255, 255, 0.35);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-weight: 500;
		margin-bottom: 0.4rem;
	}

	.empty {
		font-size: 0.72rem;
		color: rgba(255, 255, 255, 0.3);
	}

	.auto-list {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.auto-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.auto-name {
		flex: 1;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.75);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		transition: color 0.2s;
	}

	.auto-name.off {
		color: rgba(255, 255, 255, 0.3);
	}

	.auto-toggle {
		position: relative;
		width: 2rem;
		height: 1.1rem;
		border-radius: 999px;
		border: none;
		background: rgba(255, 255, 255, 0.15);
		cursor: pointer;
		padding: 0;
		flex-shrink: 0;
		transition: background 0.2s;
	}

	.auto-toggle.on {
		background: rgba(52, 211, 153, 0.7);
	}

	.toggle-thumb {
		position: absolute;
		top: 50%;
		left: 0.15rem;
		transform: translateY(-50%);
		width: 0.8rem;
		height: 0.8rem;
		border-radius: 50%;
		background: white;
		transition: left 0.2s;
	}

	.auto-toggle.on .toggle-thumb {
		left: calc(100% - 0.95rem);
	}
</style>
