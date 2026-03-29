<script lang="ts">
	import { states, connection, editMode, ripple } from '$lib/Stores';
	import { callService } from 'home-assistant-js-websocket';
	import { openModal } from 'svelte-modals';
	import Icon from '@iconify/svelte';
	import Ripple from 'svelte-ripple';

	export let sel: any;

	interface ModeItem {
		id: string;
		label: string;
		icon: string;
		color: string;
	}

	const DEFAULT_MODES: ModeItem[] = [
		{ id: 'home', label: 'Дома', icon: 'mdi:home', color: 'rgba(52,211,153,0.9)' },
		{ id: 'away', label: 'Ушёл', icon: 'mdi:walk', color: 'rgba(251,191,36,0.9)' },
		{ id: 'night', label: 'Ночь', icon: 'mdi:moon-waning-crescent', color: 'rgba(167,139,250,0.9)' },
		{ id: 'vacation', label: 'Отпуск', icon: 'mdi:airplane', color: 'rgba(147,197,253,0.9)' }
	];

	$: entity_id = sel?.entity_id;
	$: modes = (sel?.modes as ModeItem[] | undefined) || DEFAULT_MODES;
	$: entity = entity_id ? $states?.[entity_id] : undefined;
	$: entityState = entity?.state || '';

	$: activeMode = sel?.active_mode || entityState || '';

	function isActive(modeId: string): boolean {
		return activeMode === modeId;
	}

	function getActiveMode(): ModeItem | undefined {
		return modes.find((m) => isActive(m.id));
	}

	$: activeModeItem = getActiveMode();

	function selectMode(modeId: string) {
		if (!$connection || !entity_id) return;
		const domain = entity_id.split('.')[0];
		if (domain === 'input_select') {
			callService($connection, 'input_select', 'select_option', {
				entity_id,
				option: modeId
			});
		} else if (domain === 'scene') {
			callService($connection, 'scene', 'turn_on', { entity_id });
		}
	}

	function handleEdit() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/HomeModeConfig.svelte'), { sel });
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="homemode-widget"
	on:click={handleEdit}
	style:cursor={$editMode ? 'pointer' : 'default'}
>
	<div class="hm-header">
		<Icon icon="mdi:home-outline" height="13" width="13" style="opacity:0.5" />
		<span>Режим дома</span>
		{#if activeModeItem}
			<span class="active-label" style:color={activeModeItem.color}>{activeModeItem.label}</span>
		{/if}
	</div>

	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="mode-grid" on:click|stopPropagation>
		{#each modes as mode}
			<button
				class="mode-pill"
				class:mode-active={isActive(mode.id)}
				style:--mode-color={mode.color}
				on:click={() => selectMode(mode.id)}
				use:Ripple={$ripple}
				aria-label={mode.label}
				aria-pressed={isActive(mode.id)}
			>
				<Icon icon={mode.icon} height="14" width="14" />
				<span>{mode.label}</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.homemode-widget {
		padding: var(--theme-sidebar-item-padding);
	}

	.hm-header {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.65rem;
		color: rgba(255, 255, 255, 0.35);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-weight: 500;
		margin-bottom: 0.45rem;
	}

	.active-label {
		margin-left: auto;
		text-transform: none;
		letter-spacing: 0;
		font-size: 0.68rem;
		font-weight: 500;
	}

	.mode-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.3rem;
	}

	.mode-pill {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.3rem;
		padding: 0.38rem 0.5rem;
		border-radius: 0.45rem;
		border: 1px solid rgba(255, 255, 255, 0.07);
		background: rgba(255, 255, 255, 0.04);
		cursor: pointer;
		color: rgba(255, 255, 255, 0.45);
		font-size: 0.72rem;
		font-family: inherit;
		transition:
			background 0.15s,
			color 0.15s,
			border-color 0.15s;
		white-space: nowrap;
		overflow: hidden;
	}

	.mode-pill:hover {
		background: rgba(255, 255, 255, 0.08);
		color: rgba(255, 255, 255, 0.75);
		border-color: rgba(255, 255, 255, 0.12);
	}

	.mode-active {
		background: color-mix(in srgb, var(--mode-color) 15%, transparent);
		color: var(--mode-color);
		border-color: color-mix(in srgb, var(--mode-color) 40%, transparent);
	}

	.mode-active:hover {
		background: color-mix(in srgb, var(--mode-color) 22%, transparent);
	}
</style>
