<script lang="ts">
	import { states, connection, lang, ripple, motion } from '$lib/Stores';
	import { callService } from 'home-assistant-js-websocket';
	import Toggle from '$lib/Components/Toggle.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import { getName, getSupport } from '$lib/Utils';
	import Ripple from 'svelte-ripple';
	import { onDestroy } from 'svelte';
	import StateLogic from '$lib/Components/StateLogic.svelte';

	export let isOpen: boolean;
	export let sel: any;

	let opening = false;
	let timeout: ReturnType<typeof setTimeout>;
	let pinCode = '';

	$: entity = $states[sel?.entity_id];
	$: entity_id = entity?.entity_id;
	$: state = entity?.state;
	$: toggle = entity?.state === 'unlocking' || entity?.state === 'unlocked';

	$: attributes = entity?.attributes;
	$: supported_features = attributes?.supported_features;
	$: supports = getSupport(supported_features, {
		OPEN: 1
	});

	function handleClick() {
		const service = state === 'locked' ? 'unlock' : 'lock';
		callService($connection, 'lock', service, { entity_id });
	}

	async function handleOpen() {
		clearTimeout(timeout);
		await callService($connection, 'lock', 'open', { entity_id });

		opening = true;
		timeout = setTimeout(() => {
			opening = false;
		}, 2000);
	}

	function handlePinUnlock() {
		if (!pinCode) return;
		callService($connection, 'lock', 'unlock', { entity_id, code: pinCode });
		pinCode = '';
	}

	onDestroy(() => {
		clearTimeout(timeout);
	});
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">{getName(sel, entity)}</h1>

		<h2>{$lang('state')}</h2>

		<div class="container">
			<StateLogic entity_id={sel?.entity_id} selected={sel} />

			<div class="toggle">
				<Toggle bind:checked={toggle} on:change={handleClick} />
			</div>
		</div>

		<!-- PIN code unlock -->
		{#if attributes?.code_format}
			<h2>PIN code</h2>
			<div class="pin-container">
				<input
					type="password"
					inputmode="numeric"
					pattern="[0-9]*"
					maxlength="8"
					bind:value={pinCode}
					placeholder="••••"
					class="pin-input"
				/>
				<button class="done action" use:Ripple={$ripple} on:click={handlePinUnlock}>
					{$lang('unlock')}
				</button>
			</div>
		{/if}

		<!-- buttons -->
		{#if supports?.OPEN}
			<div class="add-config-button">
				<button
					class="done action"
					class:opening
					style:transition="background-color {$motion}ms ease"
					use:Ripple={$ripple}
					on:click={handleOpen}
				>
					{$lang(opening ? 'open_door_success' : 'open_door')}
				</button>

				<ConfigButtons />
			</div>
		{:else}
			<ConfigButtons />
		{/if}
	</Modal>
{/if}

<style>
	.container {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.toggle {
		margin-left: auto;
		height: 25px;
	}

	.opening {
		background-color: #007000 !important;
	}

	.add-config-button {
		display: flex;
		justify-content: space-between;
		width: 100%;
	}

	.add-config-button > button {
		height: fit-content;
		align-self: end;
	}

	.pin-container {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		margin-bottom: 1rem;
	}

	.pin-input {
		background: rgba(0, 0, 0, 0.25);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 0.5rem;
		color: white;
		font-size: 1.1rem;
		letter-spacing: 0.2em;
		padding: 0.5rem 0.75rem;
		width: 7rem;
		outline: none;
		font-family: inherit;
	}

	.pin-input:focus {
		border-color: rgba(255, 255, 255, 0.4);
	}
</style>
