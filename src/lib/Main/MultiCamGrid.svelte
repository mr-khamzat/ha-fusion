<script lang="ts">
	import { editMode, motion, ripple } from '$lib/Stores';
	import { openModal } from 'svelte-modals';
	import Camera from '$lib/Main/Camera.svelte';
	import Ripple from 'svelte-ripple';
	import Icon from '@iconify/svelte';

	export let sel: any;

	$: cameras = (sel?.cameras as string[]) || [];
	$: layout = sel?.layout || '2x2';

	$: gridCols = layout === '1+3' ? '1fr 1fr' : layout === '2x1' ? '1fr 1fr' : '1fr 1fr';
	$: gridRows = layout === '2x1' ? '1fr' : '1fr 1fr';

	function handleEdit() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/MultiCamGridConfig.svelte'), { sel });
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="cam-grid-card"
	on:click={handleEdit}
	style:transition="opacity {$motion}ms ease"
>
	{#if cameras.length === 0}
		<div class="empty-state">
			<Icon icon="mdi:camera-off-outline" height="28" width="28" style="opacity:0.3" />
			<span>Configure Cameras</span>
		</div>
	{:else}
		<div
			class="cam-grid"
			style:grid-template-columns={gridCols}
			style:grid-template-rows={gridRows}
		>
			{#each cameras.slice(0, layout === '2x1' ? 2 : 4) as entity_id, i}
				<div class="cam-cell" class:large={layout === '1+3' && i === 0}>
					<Camera sel={{ entity_id }} responsive={true} muted={true} controls={false} />
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.cam-grid-card {
		height: 100%;
		width: 100%;
		min-height: 8rem;
		position: relative;
		overflow: hidden;
		border-radius: 0.65rem;
		cursor: v-bind("$editMode ? 'pointer' : 'default'");
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		height: 100%;
		color: rgba(255, 255, 255, 0.3);
		font-size: 0.8rem;
	}

	.cam-grid {
		display: grid;
		gap: 2px;
		height: 100%;
		width: 100%;
	}

	.cam-cell {
		overflow: hidden;
		border-radius: 0.4rem;
		min-height: 4rem;
	}

	.cam-cell.large {
		grid-row: 1 / 3;
	}
</style>
