<script lang="ts">
	import { states, motion, connection } from '$lib/Stores';
	import { createEventDispatcher, onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { openModal } from 'svelte-modals';
	import { getDomain, getName } from '$lib/Utils';
	import Icon from '@iconify/svelte';

	const dispatch = createEventDispatcher();

	let query = '';
	let inputEl: HTMLInputElement;
	let selectedIndex = 0;

	const domainIcons: Record<string, string> = {
		light: 'mdi:lightbulb',
		switch: 'mdi:toggle-switch',
		climate: 'mdi:thermostat',
		sensor: 'mdi:chart-line',
		binary_sensor: 'mdi:checkbox-blank-circle-outline',
		cover: 'mdi:window-shutter',
		media_player: 'mdi:speaker',
		camera: 'mdi:cctv',
		lock: 'mdi:lock',
		alarm_control_panel: 'mdi:shield-home',
		automation: 'mdi:robot',
		script: 'mdi:script-text',
		scene: 'mdi:palette',
		fan: 'mdi:fan',
		vacuum: 'mdi:robot-vacuum',
		person: 'mdi:account',
		weather: 'mdi:weather-partly-cloudy',
		input_boolean: 'mdi:toggle-switch-outline',
		input_number: 'mdi:numeric',
		input_select: 'mdi:form-select',
		todo: 'mdi:format-list-checks'
	};

	$: allEntities = Object.entries($states || {}).map(([id, entity]) => ({
		id,
		name: getName(undefined, entity) || id,
		state: entity.state,
		domain: getDomain(id),
		icon: entity.attributes?.icon || domainIcons[getDomain(id)] || 'mdi:help-circle-outline'
	}));

	$: filtered = query.length < 1
		? allEntities.slice(0, 8)
		: allEntities
			.filter((e) => {
				const q = query.toLowerCase();
				return e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q);
			})
			.slice(0, 10);

	$: if (filtered) selectedIndex = 0;

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIndex = Math.min(selectedIndex + 1, filtered.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIndex = Math.max(selectedIndex - 1, 0);
		} else if (e.key === 'Enter') {
			if (filtered[selectedIndex]) selectEntity(filtered[selectedIndex]);
		} else if (e.key === 'Escape') {
			dispatch('close');
		}
	}

	function selectEntity(entity: typeof allEntities[0]) {
		dispatch('close');
		// open the entity modal — reuse Button domain logic via openModal
		const modalMap: Record<string, () => Promise<any>> = {
			light: () => import('$lib/Modal/LightModal.svelte'),
			climate: () => import('$lib/Modal/ClimateModal.svelte'),
			cover: () => import('$lib/Modal/CoverModal.svelte'),
			lock: () => import('$lib/Modal/LockModal.svelte'),
			media_player: () => import('$lib/Modal/MediaPlayer.svelte'),
			alarm_control_panel: () => import('$lib/Modal/AlarmControlPanelModal.svelte'),
			automation: () => import('$lib/Modal/AutomationModal.svelte'),
			script: () => import('$lib/Modal/ScriptModal.svelte'),
			todo: () => import('$lib/Modal/TodoModal.svelte'),
			vacuum: () => import('$lib/Modal/VacuumModal.svelte')
		};

		const loader = modalMap[entity.domain] || (() => import('$lib/Modal/SensorModal.svelte'));
		openModal(loader, { sel: { entity_id: entity.id } });
	}

	onMount(() => {
		inputEl?.focus();
	});
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="palette-backdrop"
	on:click|self={() => dispatch('close')}
	transition:fade={{ duration: $motion / 2 }}
>
	<div
		class="palette"
		transition:fly={{ y: -20, duration: $motion }}
		on:keydown={handleKeydown}
		role="dialog"
		aria-label="Command palette"
	>
		<div class="palette-search">
			<Icon icon="mdi:magnify" width="18" height="18" class="search-icon" />
			<input
				bind:this={inputEl}
				bind:value={query}
				placeholder="Search entities..."
				class="palette-input"
				autocomplete="off"
				spellcheck="false"
			/>
			{#if query}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<span class="clear-btn" on:click={() => (query = '')}>×</span>
			{/if}
		</div>

		<ul class="palette-results">
			{#each filtered as entity, i (entity.id)}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
				<li
					class="palette-item"
					class:selected={i === selectedIndex}
					on:click={() => selectEntity(entity)}
					on:mouseenter={() => (selectedIndex = i)}
				>
					<div class="entity-icon">
						<Icon icon={entity.icon} width="16" height="16" />
					</div>
					<div class="entity-info">
						<span class="entity-name">{entity.name}</span>
						<span class="entity-id">{entity.id}</span>
					</div>
					<span class="entity-state">{entity.state}</span>
				</li>
			{/each}

			{#if filtered.length === 0}
				<li class="no-results">No entities found</li>
			{/if}
		</ul>

		<div class="palette-footer">
			<span>↑↓ navigate</span>
			<span>↵ open</span>
			<span>esc close</span>
		</div>
	</div>
</div>

<style>
	.palette-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		z-index: 10000;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding-top: 10vh;
	}

	.palette {
		width: min(600px, 92vw);
		background: var(--theme-navigate-background-color, rgba(20, 20, 40, 0.98));
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 16px;
		overflow: hidden;
		box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
	}

	.palette-search {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.9rem 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.07);
	}

	:global(.search-icon) {
		color: rgba(255, 255, 255, 0.4);
		flex-shrink: 0;
	}

	.palette-input {
		flex: 1;
		background: transparent;
		border: none;
		outline: none;
		color: rgba(255, 255, 255, 0.9);
		font-size: 1rem;
		font-family: inherit;
		caret-color: rgba(255, 255, 255, 0.7);
	}

	.palette-input::placeholder {
		color: rgba(255, 255, 255, 0.3);
	}

	.clear-btn {
		color: rgba(255, 255, 255, 0.4);
		cursor: pointer;
		font-size: 1.2rem;
		line-height: 1;
		padding: 0 0.2rem;
	}

	.palette-results {
		list-style: none;
		padding: 0.4rem 0;
		margin: 0;
		max-height: 360px;
		overflow-y: auto;
	}

	.palette-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.55rem 1rem;
		cursor: pointer;
		transition: background 0.1s;
	}

	.palette-item.selected,
	.palette-item:hover {
		background: rgba(255, 255, 255, 0.07);
	}

	.entity-icon {
		width: 28px;
		height: 28px;
		background: rgba(255, 255, 255, 0.06);
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgba(255, 255, 255, 0.6);
		flex-shrink: 0;
	}

	.entity-info {
		flex: 1;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.entity-name {
		font-size: 0.88rem;
		color: rgba(255, 255, 255, 0.9);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.entity-id {
		font-size: 0.72rem;
		color: rgba(255, 255, 255, 0.35);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.entity-state {
		font-size: 0.78rem;
		color: rgba(255, 255, 255, 0.45);
		white-space: nowrap;
		flex-shrink: 0;
	}

	.no-results {
		padding: 1rem;
		text-align: center;
		color: rgba(255, 255, 255, 0.35);
		font-size: 0.9rem;
	}

	.palette-footer {
		display: flex;
		gap: 1rem;
		padding: 0.5rem 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.25);
	}
</style>
