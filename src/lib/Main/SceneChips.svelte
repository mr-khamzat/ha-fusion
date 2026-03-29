<script lang="ts">
	import { states, connection, editMode, motion, ripple, lang } from '$lib/Stores';
	import { callService } from 'home-assistant-js-websocket';
	import { openModal } from 'svelte-modals';
	import { getName } from '$lib/Utils';
	import Icon from '@iconify/svelte';
	import Ripple from 'svelte-ripple';
	import { onDestroy } from 'svelte';

	export let sel: any;

	$: entityIds = (sel?.entity_ids as string[]) || [];
	$: title = sel?.name || $lang('scenes') || 'Scenes';

	let activeId: string | null = null;
	let activeTimeout: ReturnType<typeof setTimeout>;

	function activate(entity_id: string, e: MouseEvent) {
		e.stopPropagation();
		if ($editMode) return;
		callService($connection, 'homeassistant', 'turn_on', { entity_id });
		if ('vibrate' in navigator) navigator.vibrate(20);

		// Brief visual feedback
		activeId = entity_id;
		clearTimeout(activeTimeout);
		activeTimeout = setTimeout(() => {
			activeId = null;
		}, 800);

		// Scene theme flash on the whole dashboard
		document.body.classList.remove('scene-flash');
		requestAnimationFrame(() => {
			document.body.classList.add('scene-flash');
			setTimeout(() => document.body.classList.remove('scene-flash'), 700);
		});
	}

	function handleClick() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/SceneChipsConfig.svelte'), { sel });
		}
	}

	function getChipColor(entity_id: string): string {
		const entity = $states?.[entity_id];
		// Try to get color from entity attributes
		const rgb = entity?.attributes?.rgb_color as [number, number, number] | undefined;
		if (rgb) return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
		const icon = entity?.attributes?.icon as string | undefined;
		// Default warm accent
		return 'rgba(251,191,36,0.8)';
	}

	onDestroy(() => clearTimeout(activeTimeout));
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="chips-card"
	style:transition="opacity {$motion}ms ease"
	on:click={handleClick}
>
	{#if title && entityIds.length > 0}
		<div class="chips-title">{title}</div>
	{/if}

	{#if entityIds.length > 0}
		<div class="chips-scroll">
			{#each entityIds as entity_id}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<button
					class="chip"
					class:active={activeId === entity_id}
					on:click={(e) => activate(entity_id, e)}
					use:Ripple={{ ...$ripple, color: 'rgba(255,255,255,0.15)' }}
					style:cursor={$editMode ? 'default' : 'pointer'}
				>
					<span
						class="chip-dot"
						style:background={activeId === entity_id ? getChipColor(entity_id) : 'rgba(255,255,255,0.2)'}
					></span>
					{getName({ name: undefined }, $states?.[entity_id]) || entity_id.split('.')[1]}
				</button>
			{/each}
		</div>
	{:else}
		<div class="empty-chips">
			<Icon icon="mdi:palette" height="20" width="20" style="opacity:0.3" />
			<span>Add scenes in edit mode</span>
		</div>
	{/if}
</div>

<style>
	.chips-card {
		background: var(--theme-button-background-color-off, rgba(0, 0, 0, 0.2));
		border-radius: 0.65rem;
		padding: 0.75rem 0.85rem;
		height: 100%;
		min-height: 3.5rem;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.4rem;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.06);
		box-sizing: border-box;
	}

	.chips-title {
		font-size: 0.72rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.4);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.chips-scroll {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		overflow: hidden;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 999px;
		padding: 0.3rem 0.7rem 0.3rem 0.45rem;
		font-size: 0.82rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.8);
		cursor: pointer;
		font-family: inherit;
		transition: background 0.15s, border-color 0.15s, color 0.15s;
		white-space: nowrap;
	}

	.chip:hover {
		background: rgba(255, 255, 255, 0.14);
		color: white;
	}

	.chip.active {
		background: rgba(251, 191, 36, 0.18);
		border-color: rgba(251, 191, 36, 0.35);
		color: #fbbf24;
	}

	.chip-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		flex-shrink: 0;
		transition: background 0.3s;
	}

	.empty-chips {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: rgba(255, 255, 255, 0.3);
		font-size: 0.78rem;
	}
</style>
