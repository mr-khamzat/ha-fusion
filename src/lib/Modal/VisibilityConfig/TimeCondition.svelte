<script lang="ts">
	import type { Condition } from '$lib/Types';

	export let item: Condition;
	export let items: Condition[];

	let after = item?.after || '';
	let before = item?.before || '';

	function handleChange() {
		items = items.map((condition: Condition) =>
			condition.id === item.id
				? { ...condition, after: after || undefined, before: before || undefined }
				: condition
		);
	}
</script>

<div class="time-row">
	<label>
		<span>С</span>
		<input
			data-modal
			type="time"
			bind:value={after}
			on:change={handleChange}
		/>
	</label>
	<label>
		<span>По</span>
		<input
			data-modal
			type="time"
			bind:value={before}
			on:change={handleChange}
		/>
	</label>
</div>

<style>
	.time-row {
		display: flex;
		gap: 1rem;
	}

	label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	span {
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.5);
	}

	input[type='time'] {
		color-scheme: dark;
		background: rgba(255, 255, 255, 0.07);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 0.5rem;
		padding: 0.4rem 0.6rem;
		color: rgba(255, 255, 255, 0.85);
		font-size: 0.9rem;
	}
</style>
