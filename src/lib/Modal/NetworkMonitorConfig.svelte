<script lang="ts">
	import { dashboard, record, entityList } from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import Select from '$lib/Components/Select.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Modal from '$lib/Modal/Index.svelte';

	export let isOpen: boolean;
	export let sel: any;

	let ping_entity_id: string = sel?.ping_entity_id || '';
	let speed_down_entity_id: string = sel?.speed_down_entity_id || '';
	let speed_up_entity_id: string = sel?.speed_up_entity_id || '';
	let devices_entity_id: string = sel?.devices_entity_id || '';
	let name: string = sel?.name || 'Сеть';

	$: options = $entityList('sensor').sort((a, b) => a.label.localeCompare(b.label));

	function save() {
		sel.ping_entity_id = ping_entity_id;
		sel.speed_down_entity_id = speed_down_entity_id;
		sel.speed_up_entity_id = speed_up_entity_id;
		sel.devices_entity_id = devices_entity_id;
		sel.name = name;
		$dashboard = $dashboard;
	}

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">Монитор сети</h1>

		<h2>Название</h2>
		<input class="input" type="text" bind:value={name} on:change={save} autocomplete="off" />

		<h2>Ping (задержка, ms)</h2>
		<Select {options} value={ping_entity_id} placeholder="sensor.ping" on:change={(e) => { ping_entity_id = e.detail; save(); }} />

		<h2>Скорость загрузки (Mbps)</h2>
		<Select {options} value={speed_down_entity_id} placeholder="sensor.download_speed" on:change={(e) => { speed_down_entity_id = e.detail; save(); }} />

		<h2>Скорость отдачи (Mbps)</h2>
		<Select {options} value={speed_up_entity_id} placeholder="sensor.upload_speed" on:change={(e) => { speed_up_entity_id = e.detail; save(); }} />

		<h2>Кол-во устройств</h2>
		<Select {options} value={devices_entity_id} placeholder="sensor.connected_devices" on:change={(e) => { devices_entity_id = e.detail; save(); }} />

		<ConfigButtons {sel} />
	</Modal>
{/if}
