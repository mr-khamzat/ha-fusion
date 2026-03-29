<script lang="ts">
	import { states, dashboard, lang, record, ripple, entityList } from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import Select from '$lib/Components/Select.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import Ripple from 'svelte-ripple';
	import { updateObj } from '$lib/Utils';
	import type { MyDayItem } from '$lib/Types';

	export let isOpen: boolean;
	export let sel: MyDayItem;

	$: weatherOptions = $entityList('weather');

	function set(key: string, event?: any) {
		sel = updateObj(sel, key, event);
		$dashboard = $dashboard;
	}

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">Мой день</h1>

		<h2>Погода (entity)</h2>

		{#if weatherOptions}
			<Select
				computeIcons={true}
				options={weatherOptions}
				placeholder="Авто-определение"
				value={sel?.weather_entity}
				defaultIcon="mdi:weather-cloudy"
				on:change={(event) => set('weather_entity', event)}
				clearable={true}
			/>
		{/if}

		<h2>Намаз</h2>

		<div class="button-container">
			<button
				class:selected={!sel?.hide_prayer}
				on:click={() => set('hide_prayer', false)}
				use:Ripple={$ripple}
			>
				{$lang('visible')}
			</button>

			<button
				class:selected={sel?.hide_prayer === true}
				on:click={() => set('hide_prayer', true)}
				use:Ripple={$ripple}
			>
				{$lang('hidden')}
			</button>
		</div>

		<h2>Кто дома</h2>

		<div class="button-container">
			<button
				class:selected={!sel?.hide_persons}
				on:click={() => set('hide_persons', false)}
				use:Ripple={$ripple}
			>
				{$lang('visible')}
			</button>

			<button
				class:selected={sel?.hide_persons === true}
				on:click={() => set('hide_persons', true)}
				use:Ripple={$ripple}
			>
				{$lang('hidden')}
			</button>
		</div>

		<h2>Календарь</h2>

		<div class="button-container">
			<button
				class:selected={!sel?.hide_calendar}
				on:click={() => set('hide_calendar', false)}
				use:Ripple={$ripple}
			>
				{$lang('visible')}
			</button>

			<button
				class:selected={sel?.hide_calendar === true}
				on:click={() => set('hide_calendar', true)}
				use:Ripple={$ripple}
			>
				{$lang('hidden')}
			</button>
		</div>

		<h2>{$lang('mobile')}</h2>

		<div class="button-container">
			<button
				class:selected={sel?.hide_mobile !== true}
				on:click={() => set('hide_mobile')}
				use:Ripple={$ripple}
			>
				{$lang('visible')}
			</button>

			<button
				class:selected={sel?.hide_mobile === true}
				on:click={() => set('hide_mobile', true)}
				use:Ripple={$ripple}
			>
				{$lang('hidden')}
			</button>
		</div>

		<ConfigButtons {sel} />
	</Modal>
{/if}
