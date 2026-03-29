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

	let entityIds: string[] = sel?.entity_ids ? [...sel.entity_ids] : [];
	let maxItems: number = sel?.max_items ?? 6;

	function set(key: string, event?: any) { sel = updateObj(sel, key, event); $dashboard = $dashboard; }
	function saveIds() { sel.entity_ids = entityIds.filter(Boolean); $dashboard = $dashboard; }
	function add() { entityIds = [...entityIds, '']; saveIds(); }
	function remove(i: number) { entityIds = entityIds.filter((_,idx)=>idx!==i); saveIds(); }

	$: options = $entityList('automation');
	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">Automation Toggles</h1>

		<h2>Show</h2>
		<div class="button-container">
			<button class:selected={!entityIds.length} on:click={()=>{entityIds=[];saveIds();}} use:Ripple={$ripple}>All automations</button>
			<button class:selected={entityIds.length > 0} on:click={()=>{if(!entityIds.length)add();}} use:Ripple={$ripple}>Selected only</button>
		</div>

		{#if entityIds.length > 0}
			<h2>Automations</h2>
			<div class="list">
				{#each entityIds as eid, i}
					<div class="row">
						<div class="sel"><Select computeIcons={true} {options} placeholder="automation.*" value={eid} on:change={(e)=>{entityIds[i]=e.detail;saveIds();}} /></div>
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<!-- svelte-ignore a11y-no-static-element-interactions -->
						<button class="rm" on:click={()=>remove(i)}>×</button>
					</div>
				{/each}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<button class="add" on:click={add} use:Ripple={$ripple}>+ Add</button>
			</div>
		{:else}
			<h2>Max items</h2>
			<input type="number" class="input" min="1" max="20" bind:value={maxItems} on:change={()=>{sel.max_items=maxItems;$dashboard=$dashboard;}} autocomplete="off" />
		{/if}

		<h2>{$lang('mobile')}</h2>
		<div class="button-container">
			<button class:selected={sel?.hide_mobile !== true} on:click={() => set('hide_mobile')} use:Ripple={$ripple}>{$lang('visible')}</button>
			<button class:selected={sel?.hide_mobile === true} on:click={() => set('hide_mobile', true)} use:Ripple={$ripple}>{$lang('hidden')}</button>
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
