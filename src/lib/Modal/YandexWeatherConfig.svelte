<script lang="ts">
	import { states, dashboard, lang, record, ripple, entityList } from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import YandexWeather from '$lib/Sidebar/YandexWeather.svelte';
	import Select from '$lib/Components/Select.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import Ripple from 'svelte-ripple';
	import { updateObj } from '$lib/Utils';
	import type { YandexWeatherItem } from '$lib/Types';

	export let isOpen: boolean;
	export let sel: YandexWeatherItem;

	$: entity = sel?.entity_id ? ($states?.[sel?.entity_id] as any) : undefined;
	$: attributes = entity?.attributes;

	$: options = $entityList('weather');

	function set(key: string, event?: any) {
		sel = updateObj(sel, key, event);
		$dashboard = $dashboard;
	}

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">Яндекс Погода</h1>

		<h2>{$lang('preview')}</h2>

		<div class="preview">
			<YandexWeather {sel} />
		</div>

		<h2>{$lang('entity')}</h2>

		{#if options}
			<Select
				computeIcons={true}
				{options}
				placeholder={$lang('entity')}
				value={sel?.entity_id}
				defaultIcon="mdi:weather-cloudy"
				on:change={(event) => set('entity_id', event)}
			/>
		{/if}

		{#if attributes?.apparent_temperature !== undefined}
			<h2>{$lang('apparent_temperature') || 'Ощущается как'}</h2>

			<div class="button-container">
				<button
					class:selected={!sel?.show_apparent}
					on:click={() => set('show_apparent', false)}
					use:Ripple={$ripple}
				>
					{$lang('no')}
				</button>

				<button
					class:selected={sel?.show_apparent}
					on:click={() => set('show_apparent', true)}
					use:Ripple={$ripple}
				>
					{$lang('yes')}
				</button>
			</div>
		{/if}

		<h2>Давление</h2>

		<div class="button-container">
			<button
				class:selected={!sel?.show_pressure}
				on:click={() => set('show_pressure', false)}
				use:Ripple={$ripple}
			>
				{$lang('no')}
			</button>

			<button
				class:selected={sel?.show_pressure}
				on:click={() => set('show_pressure', true)}
				use:Ripple={$ripple}
			>
				{$lang('yes')}
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

<style>
	.preview {
		background-color: rgba(0, 0, 0, 0.15);
		border-radius: 0.5rem;
		color: white;
	}
</style>
