<script lang="ts">
	import { states, connection, editMode, motion, ripple } from '$lib/Stores';
	import { callService } from 'home-assistant-js-websocket';
	import { openModal } from 'svelte-modals';
	import { getName } from '$lib/Utils';
	import Icon from '@iconify/svelte';
	import Ripple from 'svelte-ripple';

	export let sel: any;

	$: entityIds = (sel?.entity_ids as string[]) || [];
	$: title = sel?.title || 'Scripts';

	$: items = entityIds.map((id) => {
		const e = $states?.[id];
		const domain = id.split('.')[0];
		return {
			id,
			name: getName(undefined, e) || id.split('.')[1]?.replace(/_/g, ' ') || id,
			domain,
			isRunning: e?.state === 'on',
			icon: domain === 'automation' ? 'mdi:robot' : domain === 'scene' ? 'mdi:palette' : 'mdi:script-text-play'
		};
	});

	let runningIds = new Set<string>();

	async function run(item: typeof items[0]) {
		if ($editMode || runningIds.has(item.id)) return;
		runningIds.add(item.id);
		runningIds = new Set(runningIds);

		if (item.domain === 'script') {
			await callService($connection, 'script', 'turn_on', { entity_id: item.id });
		} else if (item.domain === 'automation') {
			await callService($connection, 'automation', 'trigger', { entity_id: item.id });
		} else if (item.domain === 'scene') {
			await callService($connection, 'scene', 'turn_on', { entity_id: item.id });
		}

		setTimeout(() => {
			runningIds.delete(item.id);
			runningIds = new Set(runningIds);
		}, 1500);

		if ('vibrate' in navigator) navigator.vibrate(30);
	}

	function handleEdit() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/ScriptRunnerConfig.svelte'), { sel });
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="script-card"
	on:click={handleEdit}
	style:transition="opacity {$motion}ms ease"
	style:cursor={$editMode ? 'pointer' : 'default'}
>
	<div class="card-header">
		<Icon icon="mdi:script-text-play-outline" height="14" width="14" style="opacity:0.5" />
		<span class="card-title">{title}</span>
	</div>

	{#if entityIds.length === 0}
		<div class="empty-state">
			<Icon icon="mdi:script-outline" height="22" width="22" style="opacity:0.3" />
			<span>Configure Scripts</span>
		</div>
	{:else}
		<div class="script-list">
			{#each items as item}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div
					class="script-row"
					class:running={runningIds.has(item.id)}
					on:click|stopPropagation={() => run(item)}
					use:Ripple={$ripple}
				>
					<Icon icon={runningIds.has(item.id) ? 'mdi:loading' : item.icon} height="15" width="15"
						style="color:{runningIds.has(item.id) ? 'rgba(52,211,153,0.9)' : 'rgba(255,255,255,0.45)'}; flex-shrink:0; {runningIds.has(item.id) ? 'animation:spin 1s linear infinite' : ''}" />
					<span class="script-name">{item.name}</span>
					{#if !$editMode}
						<Icon icon="mdi:play-circle-outline" height="14" width="14" style="opacity:0.3;flex-shrink:0" />
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.script-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.85rem 1rem;
		height: 100%;
		min-height: 5rem;
		box-sizing: border-box;
		border-radius: 0.65rem;
		border: 1px solid rgba(255, 255, 255, 0.06);
		background: rgba(0, 0, 0, 0.2);
		overflow: hidden;
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.72rem;
		color: rgba(255, 255, 255, 0.4);
		font-weight: 500;
	}

	.card-title {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
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

	.script-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
	}

	.script-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.35rem 0.5rem;
		border-radius: 0.4rem;
		cursor: pointer;
		transition: background 0.15s;
		font-size: 0.82rem;
		color: rgba(255, 255, 255, 0.75);
	}

	.script-row:hover {
		background: rgba(255, 255, 255, 0.06);
	}

	.script-row.running {
		background: rgba(52, 211, 153, 0.08);
	}

	.script-name {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>
