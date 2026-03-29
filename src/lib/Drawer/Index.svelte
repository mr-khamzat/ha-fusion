<script lang="ts">
	import { editMode, sortMode, history, historyIndex, motion, dashboard } from '$lib/Stores';
	import Icon from '@iconify/svelte';
	import Ripple from 'svelte-ripple';
	import { ripple } from '$lib/Stores';
	import Separator from '$lib/Drawer/Separator.svelte';
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import '$lib/Drawer/Drawer.css';
	import type { Configuration, Dashboard, Translations, ViewItem } from '$lib/Types';
	import { loadIcons } from '@iconify/svelte';

	export let data: {
		configuration: Configuration;
		dashboard: Dashboard;
		theme: any;
		translations: Translations;
	};
	export let view: ViewItem | undefined;
	export let toggleDrawer: () => void;

	/** Only display SayButton in Chrome */
	// let chrome: boolean;
	onMount(() => {
		// chrome = navigator?.userAgent?.indexOf('Chrome') > -1;

		// preload drawer $editMode icons
		loadIcons([
			'gridicons:add-outline',
			'material-symbols:invert-colors-rounded',
			'ion:arrow-undo-sharp',
			'ion:arrow-redo-sharp',
			'ic:round-save',
			'solar:sidebar-minimalistic-bold-duotone',
			'solar:file-bold-duotone',
			'gg:row-first',
			'solar:posts-carousel-horizontal-bold-duotone',
			'fluent:tab-add-24-filled'
		]);
	});

	/**
	 * Determines whether the dashboard data has been modified,
	 * property is passed to both `EditModeButton` and `SaveButton`
	 */
	$: modified = $history?.[$historyIndex] !== $history?.[0];
</script>

<header id="drawer" transition:slide|global={{ duration: $motion }}>
	<div class:grid={!$editMode} class:grid-editmode={$editMode}>
		<div class="edit">
			{#await import('$lib/Drawer/EditModeButton.svelte') then EditModeButton}
				<svelte:component this={EditModeButton.default} {modified} {toggleDrawer} />
			{/await}
		</div>

		{#if $editMode}
			<div class="add">
				{#await import('$lib/Drawer/AddDropdown.svelte') then AddDropdown}
					<svelte:component this={AddDropdown.default} {view} />
				{/await}
			</div>

			<div class="appearance">
				{#await import('$lib/Drawer/AppearanceButton.svelte') then AppearanceButton}
					<svelte:component this={AppearanceButton.default} />
				{/await}
			</div>

			<div class="history">
				{#await import('$lib/Drawer/HistoryButtons.svelte') then HistoryButtons}
					<svelte:component this={HistoryButtons.default} />
				{/await}
			</div>

			<div class="save push">
				{#await import('$lib/Drawer/SaveButton.svelte') then SaveButton}
					<svelte:component this={SaveButton.default} {modified} />
				{/await}
			</div>
		{:else}
			<div class="code">
				{#await import('$lib/Drawer/CodeButton.svelte') then CodeButton}
					<svelte:component this={CodeButton.default} />
				{/await}
			</div>

			<div class="sort">
				<button
					class="sort-btn"
					class:sort-active={$sortMode}
					use:Ripple={$ripple}
					title="Режим сортировки"
					on:click={() => ($sortMode = !$sortMode)}
				>
					<Icon icon="mdi:sort" height="1.3rem" />
				</button>
			</div>

			<Separator />

			<div class="search">
				{#await import('$lib/Drawer/SearchInput.svelte') then SearchInput}
					<svelte:component this={SearchInput.default} />
				{/await}
			</div>

			<div class="settings push">
				{#await import('$lib/Drawer/SettingsButton.svelte') then SettingsButton}
					<svelte:component this={SettingsButton.default} {data} />
				{/await}
			</div>

			<!-- {#if chrome}
				{#await import('$lib/Drawer/SayButton.svelte') then SayButton}
					<svelte:component this={SayButton.default} />
				{/await}
			{/if} -->
		{/if}
	</div>
</header>

<style>
	#drawer {
		height: 4.75rem;
		width: 100vw;
		padding: 1rem 2rem;
		background-color: var(--theme-colors-sidebar-background);
		border-bottom: var(--theme-colors-sidebar-border);
	}

	.edit {
		grid-area: edit;
	}

	.add {
		grid-area: add;
	}

	.appearance {
		grid-area: appearance;
	}

	.history {
		grid-area: history;
		justify-self: end;
	}

	.save {
		grid-area: save;
	}

	.code {
		grid-area: code;
	}

	.sort {
		grid-area: sort;
	}

	.sort-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: 1px solid rgba(255,255,255,0.12);
		border-radius: 0.4rem;
		color: inherit;
		cursor: pointer;
		padding: 0.3rem 0.5rem;
		opacity: 0.65;
		position: relative;
		overflow: hidden;
		transition: opacity 0.15s, background 0.15s;
	}

	.sort-btn.sort-active {
		background: rgba(255, 193, 7, 0.2);
		border-color: rgba(255, 193, 7, 0.5);
		color: #ffc107;
		opacity: 1;
	}

	.search {
		grid-area: search;
		display: grid;
		max-width: 20rem;
	}

	.settings {
		grid-area: settings;
	}

	.push {
		justify-self: end;
		margin-right: 3.7rem;
	}

	.grid {
		display: grid;
		gap: 0.5rem;
		grid-template-areas: 'edit code sort div search settings';
		grid-template-columns: auto auto auto auto 1fr auto;
		width: 100%;
	}

	.grid-editmode {
		display: grid;
		gap: 0.5rem;
		grid-template-areas: 'edit add appearance . history save';
		grid-template-columns: auto auto auto 1fr auto auto;
		width: 100%;
	}

	/* Phone and Tablet (portrait) */
	@media all and (max-width: 768px) {
		#drawer {
			padding: 1rem 1.25rem;
			height: 8rem;
			flex-wrap: wrap;
		}

		.grid {
			grid-template-columns: auto auto auto 1fr 1fr;
			grid-template-areas:
				'edit code sort . settings'
				'search search search search search';
		}

		.grid-editmode {
			grid-template-columns: auto auto 1fr auto;
			grid-template-areas:
				'edit add  appearance .'
				'history history history save';
		}

		.save {
			margin-right: 0;
		}
	}
</style>
