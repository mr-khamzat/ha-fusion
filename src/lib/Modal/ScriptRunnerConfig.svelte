<script lang="ts">
	import { dashboard, lang, record, ripple, entityList } from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import Select from '$lib/Components/Select.svelte';
	import InputClear from '$lib/Components/InputClear.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import { updateObj } from '$lib/Utils';
	import Ripple from 'svelte-ripple';

	export let isOpen: boolean;
	export let sel: any;

	let title: string = sel?.title || '';
	let entityIds: string[] = sel?.entity_ids ? [...sel.entity_ids] : [];

	function set(key: string, event?: any) {
		sel = updateObj(sel, key, event);
		$dashboard = $dashboard;
	}

	function saveIds() { sel.entity_ids = entityIds.filter(Boolean); $dashboard = $dashboard; }
	function add() { entityIds = [...entityIds, '']; saveIds(); }
	function remove(i: number) { entityIds = entityIds.filter((_,idx)=>idx!==i); saveIds(); }

	$: options = [...$entityList('script'), ...$entityList('automation'), ...$entityList('scene')].sort((a,b)=>a.label.localeCompare(b.label));
	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">Script Runner</h1>

		<h2>Title</h2>
		<InputClear condition={title} on:clear={() => { title=''; set('title'); }} let:padding>
			<input type="text" class="input" bind:value={title} placeholder="Scripts" on:change={(e)=>set('title',e)} autocomplete="off" spellcheck="false" style:padding />
		</InputClear>

		<h2>Scripts / Automations / Scenes</h2>
		<div class="list">
			{#each entityIds as eid, i}
				<div class="row">
					<div class="sel"><Select computeIcons={true} {options} placeholder="script.* / automation.* / scene.*" value={eid} on:change={(e)=>{entityIds[i]=e.detail;saveIds();}} /></div>
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<button class="rm" on:click={()=>remove(i)}>×</button>
				</div>
			{/each}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<button class="add" on:click={add} use:Ripple={$ripple}>+ Add</button>
		</div>

		<ConfigButtons {sel} />
	</Modal>
{/if}

<style>
	.list { display: flex; flex-direction: column; gap: 0.4rem; }
	.row { display: flex; align-items: center; gap: 0.4rem; }
	.sel { flex: 1; }
	.rm { background: rgba(255,255,255,0.08); border: none; border-radius: 50%; width: 22px; height: 22px; flex-shrink: 0; cursor: pointer; color: rgba(255,255,255,0.5); font-size: 1rem; display: flex; align-items: center; justify-content: center; padding: 0; font-family: inherit; line-height: 1; }
	.rm:hover { background: rgba(239,68,68,0.25); color: #ef4444; }
	.add { background: rgba(255,255,255,0.08); border: 1px dashed rgba(255,255,255,0.2); border-radius: 0.5rem; color: rgba(255,255,255,0.6); font-size: 0.82rem; padding: 0.4rem 0.8rem; cursor: pointer; font-family: inherit; transition: background 0.15s; }
	.add:hover { background: rgba(255,255,255,0.14); color: white; }
</style>
