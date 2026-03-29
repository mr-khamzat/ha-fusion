<script lang="ts">
	import { dashboard, lang, record, ripple, entityList } from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import Select from '$lib/Components/Select.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import { updateObj } from '$lib/Utils';
	import Ripple from 'svelte-ripple';

	export let isOpen: boolean;
	export let sel: any;

	let cameras: string[] = sel?.cameras ? [...sel.cameras] : [];
	let layout: string = sel?.layout || '2x2';

	function set(key: string, event?: any) {
		sel = updateObj(sel, key, event);
		$dashboard = $dashboard;
	}

	function saveCameras() {
		sel.cameras = cameras.filter(Boolean);
		$dashboard = $dashboard;
	}

	function addCamera() {
		cameras = [...cameras, ''];
		saveCameras();
	}

	function removeCamera(i: number) {
		cameras = cameras.filter((_, idx) => idx !== i);
		saveCameras();
	}

	$: options = $entityList('camera');

	const layouts = ['2x2', '2x1', '1+3'];

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">Multi-Cam Grid</h1>

		<h2>Layout</h2>
		<div class="button-container">
			{#each layouts as l}
				<button
					class:selected={layout === l}
					on:click={() => { layout = l; sel.layout = l; $dashboard = $dashboard; }}
					use:Ripple={$ripple}
				>
					{l}
				</button>
			{/each}
		</div>

		<h2>Cameras</h2>
		<div class="cameras-list">
			{#each cameras as cam, i}
				<div class="cam-row">
					<div class="cam-select">
						<Select
							computeIcons={true}
							{options}
							placeholder="camera.*"
							value={cam}
							on:change={(event) => {
								cameras[i] = event.detail;
								saveCameras();
							}}
						/>
					</div>
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<button class="remove-btn" on:click={() => removeCamera(i)}>×</button>
				</div>
			{/each}

			{#if cameras.length < (layout === '2x1' ? 2 : 4)}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<button class="add-btn" on:click={addCamera} use:Ripple={$ripple}>+ Add camera</button>
			{/if}
		</div>

		<ConfigButtons {sel} />
	</Modal>
{/if}

<style>
	.cameras-list {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.cam-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.cam-select {
		flex: 1;
	}

	.remove-btn {
		background: rgba(255, 255, 255, 0.08);
		border: none;
		border-radius: 50%;
		width: 22px;
		height: 22px;
		flex-shrink: 0;
		cursor: pointer;
		color: rgba(255, 255, 255, 0.5);
		font-size: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		font-family: inherit;
		line-height: 1;
	}

	.remove-btn:hover {
		background: rgba(239, 68, 68, 0.25);
		color: #ef4444;
	}

	.add-btn {
		background: rgba(255, 255, 255, 0.08);
		border: 1px dashed rgba(255, 255, 255, 0.2);
		border-radius: 0.5rem;
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.82rem;
		padding: 0.4rem 0.8rem;
		cursor: pointer;
		font-family: inherit;
		transition: background 0.15s;
	}

	.add-btn:hover {
		background: rgba(255, 255, 255, 0.14);
		color: white;
	}
</style>
