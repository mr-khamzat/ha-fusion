<script lang="ts">
	import { states, connection, editMode, motion, ripple } from '$lib/Stores';
	import { callService } from 'home-assistant-js-websocket';
	import { openModal } from 'svelte-modals';
	import { getName } from '$lib/Utils';
	import Icon from '@iconify/svelte';
	import Ripple from 'svelte-ripple';

	export let sel: any;

	$: entityIds = (sel?.entity_ids as string[]) || [];
	$: title = sel?.title || '';
	$: cols = sel?.columns || 2;

	$: items = entityIds.map((id) => {
		const e = $states?.[id];
		const domain = id.split('.')[0];
		const isOn = e?.state === 'on' || e?.state === 'playing' || e?.state === 'heat' || e?.state === 'home';
		const attrs = e?.attributes || {};
		return {
			id,
			name: getName(undefined, e) || id.split('.')[1]?.replace(/_/g, ' ') || id,
			domain,
			isOn,
			icon: attrs.icon || domainIcon(domain, isOn)
		};
	});

	function domainIcon(domain: string, on: boolean): string {
		const map: Record<string, [string, string]> = {
			light: ['mdi:lightbulb', 'mdi:lightbulb-outline'],
			switch: ['mdi:toggle-switch', 'mdi:toggle-switch-off-outline'],
			input_boolean: ['mdi:checkbox-marked-circle', 'mdi:checkbox-blank-circle-outline'],
			fan: ['mdi:fan', 'mdi:fan-off'],
			cover: ['mdi:window-shutter-open', 'mdi:window-shutter']
		};
		return on ? (map[domain]?.[0] ?? 'mdi:power') : (map[domain]?.[1] ?? 'mdi:power-off');
	}

	function toggle(item: typeof items[0]) {
		if ($editMode) return;
		const service = item.isOn ? 'turn_off' : 'turn_on';
		callService($connection, item.domain, service, { entity_id: item.id });
		if ('vibrate' in navigator) navigator.vibrate(20);
	}

	function handleEdit() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/ButtonGroupConfig.svelte'), { sel });
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="group-card"
	on:click={handleEdit}
	style:transition="opacity {$motion}ms ease"
	style:cursor={$editMode ? 'pointer' : 'default'}
>
	{#if title}
		<div class="group-title">{title}</div>
	{/if}

	{#if entityIds.length === 0}
		<div class="empty-state">
			<Icon icon="mdi:toggle-switch-outline" height="22" width="22" style="opacity:0.3" />
			<span>Configure Group</span>
		</div>
	{:else}
		<div class="btn-grid" style:grid-template-columns="repeat({cols}, 1fr)">
			{#each items as item}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div
					class="toggle-btn"
					class:on={item.isOn}
					on:click|stopPropagation={() => toggle(item)}
					use:Ripple={$ripple}
				>
					<Icon icon={item.icon} height="18" width="18" />
					<span class="btn-label">{item.name}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.group-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem;
		height: 100%;
		min-height: 5rem;
		box-sizing: border-box;
		border-radius: 0.65rem;
		border: 1px solid rgba(255, 255, 255, 0.06);
		background: rgba(0, 0, 0, 0.2);
		overflow: hidden;
	}

	.group-title {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.4);
		font-weight: 500;
		padding: 0 0.15rem;
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

	.btn-grid {
		display: grid;
		gap: 0.4rem;
		flex: 1;
	}

	.toggle-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		padding: 0.5rem 0.25rem;
		border-radius: 0.5rem;
		cursor: pointer;
		background: rgba(255, 255, 255, 0.05);
		color: rgba(255, 255, 255, 0.35);
		transition: background 0.2s, color 0.2s;
		min-height: 3.5rem;
		position: relative;
		overflow: hidden;
	}

	.toggle-btn.on {
		background: rgba(253, 230, 138, 0.12);
		color: rgba(253, 230, 138, 0.9);
	}

	.btn-label {
		font-size: 0.62rem;
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
		line-height: 1.2;
	}
</style>
