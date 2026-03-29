<script lang="ts">
	import { states, connection, lang, motion } from '$lib/Stores';
	import { callService } from 'home-assistant-js-websocket';
	import Icon from '@iconify/svelte';

	export let sel: any;

	$: entity_id = sel?.entity_id;
	$: entity = $states?.[entity_id];
	$: attributes = entity?.attributes;
	$: items = (attributes?.items ?? []) as Array<{ uid: string; summary: string; status: string }>;
	$: pending = items.filter((i) => i.status !== 'completed');
	$: name = sel?.name || entity?.attributes?.friendly_name || entity_id;

	function toggle(item: { uid: string; summary: string; status: string }) {
		const newStatus = item.status === 'completed' ? 'needs_action' : 'completed';
		callService($connection, 'todo', 'update_item', {
			entity_id,
			item: item.summary,
			status: newStatus
		});
	}
</script>

<div class="todo-widget" style:transition="opacity {$motion}ms ease">
	<div class="todo-header">
		<Icon icon="mdi:format-list-checks" width="14" height="14" />
		<span class="todo-name">{name}</span>
		{#if pending.length > 0}
			<span class="badge">{pending.length}</span>
		{/if}
	</div>

	{#if items.length === 0}
		<div class="empty">{$lang('no_items') || 'No items'}</div>
	{:else}
		<ul class="todo-list">
			{#each items.slice(0, 5) as item (item.uid)}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
				<li
					class="todo-item"
					class:done={item.status === 'completed'}
					on:click={() => toggle(item)}
				>
					<span class="checkbox">
						{#if item.status === 'completed'}
							<Icon icon="mdi:checkbox-marked-circle" width="14" height="14" />
						{:else}
							<Icon icon="mdi:checkbox-blank-circle-outline" width="14" height="14" />
						{/if}
					</span>
					<span class="summary">{item.summary}</span>
				</li>
			{/each}
			{#if items.length > 5}
				<li class="more">+{items.length - 5} {$lang('more') || 'more'}</li>
			{/if}
		</ul>
	{/if}
</div>

<style>
	.todo-widget {
		width: 100%;
		padding: 0.4rem 0.25rem;
	}

	.todo-header {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin-bottom: 0.4rem;
		color: var(--theme-sensor-name-color, rgba(255, 255, 255, 0.7));
	}

	.todo-name {
		font-size: 0.82rem;
		font-weight: 500;
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.badge {
		background: rgba(239, 68, 68, 0.8);
		color: white;
		border-radius: 999px;
		font-size: 0.65rem;
		font-weight: 700;
		padding: 0.1rem 0.4rem;
		min-width: 1.2rem;
		text-align: center;
	}

	.todo-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.todo-item {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		cursor: pointer;
		padding: 0.2rem 0.1rem;
		border-radius: 0.3rem;
		transition: background 0.15s;
	}

	.todo-item:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.checkbox {
		flex-shrink: 0;
		color: var(--theme-sensor-name-color, rgba(255, 255, 255, 0.5));
	}

	.summary {
		font-size: 0.8rem;
		color: var(--theme-sensor-name-color, rgba(255, 255, 255, 0.85));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.done .summary {
		text-decoration: line-through;
		opacity: 0.5;
	}

	.done .checkbox {
		color: #10b981;
	}

	.more {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.4);
		padding: 0.1rem 0.5rem;
	}

	.empty {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.35);
		padding: 0.2rem 0;
	}
</style>
