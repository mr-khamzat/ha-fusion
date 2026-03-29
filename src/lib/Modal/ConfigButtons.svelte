<script lang="ts">
	import { dashboard, record, lang, editMode, ripple, motion } from '$lib/Stores';
	import { tick } from 'svelte';
	import { closeModal, openModal } from 'svelte-modals';
	import Ripple from 'svelte-ripple';
	import { fade } from 'svelte/transition';

	let showMore = false;

	export let sel: any = undefined;
	export let disableChangeType: boolean | undefined = undefined;

	/**
	 * Checks if current id is in/from sidebar
	 */
	function sidebarItem() {
		return $dashboard.sidebar.some((item) => item?.id === sel?.id);
	}

	/**
	 * Removes a sidebarItem
	 */
	function removeSidebarItem() {
		$dashboard.sidebar = $dashboard.sidebar.filter((item) => item?.id !== sel?.id);
	}

	/**
	 * Get id from a mainItem
	 */
	function mainItem() {
		$dashboard.views = $dashboard.views.map((view) => ({
			...view,
			sections: view.sections?.map((section) => ({
				...section,
				sections:
					section.type === 'horizontal-stack' && section.sections
						? section.sections.map((nestedSection) => ({
								...nestedSection,
								items: nestedSection.items?.filter((item) => item.id !== sel.id)
							}))
						: section.sections,
				items:
					section.type !== 'horizontal-stack'
						? section.items?.filter((item) => item.id !== sel.id)
						: section.items
			}))
		}));
	}

	/**
	 * Removes a ViewItem
	 */
	async function removeViewItem() {
		const index = $dashboard.views.findIndex((view) => view.id === sel.id);
		$dashboard.views = [...$dashboard.views.slice(0, index), ...$dashboard.views.slice(index + 1)];
		// selects another view
		await tick();
		const adjust = Math.min(index, $dashboard.views.length - 1);
		const view = document
			.getElementById('navigation')
			?.querySelector<HTMLButtonElement>(`button:nth-of-type(${adjust + 1})`);
		view?.click();
	}

	/**
	 * Removes 'SidebarItem' | 'MainItem' | 'ViewItem' from `$dashboard`.
	 */
	async function removeObj() {
		if (!sel) return;
		closeModal();

		if (sidebarItem()) {
			removeSidebarItem();
		} else if (sel?.type) {
			mainItem();
		} else if (sel.sections) {
			await removeViewItem();
		}
		$record();
	}

	/**
	 * Set/clear a property on sel and trigger dashboard update
	 */
	function setProp(key: string, value: any) {
		if (!sel) return;
		if (value === undefined) {
			delete sel[key];
		} else {
			sel[key] = value;
		}
		$dashboard = $dashboard;
	}

	/**
	 * Handle object type change
	 */
	async function handleChangeType() {
		// closeModal() first, then wait for the close animation to fully complete
		// before opening the new modal. This is necessary because svelte-modals sets
		// exitBeforeEnter=true on introstart and never resets it while a modal is open.
		// Calling openModal() while exitBeforeEnter=true AND modals.length>0 sets
		// transitioning=true, which gives the new component isOpen=false — its intro
		// never fires, transitioning never resets, permanent deadlock (blank modal).
		// After closeModal() the stack empties: exitBeforeEnter&&modals.length = falsy,
		// so the next openModal() opens cleanly with isOpen=true.
		closeModal();
		await new Promise<void>((resolve) => setTimeout(resolve, $motion + 50));
		if (sidebarItem()) {
			openModal(() => import('$lib/Modal/SidebarItemConfig.svelte'), { sel });
		} else {
			openModal(() => import('$lib/Modal/MainItemConfig.svelte'), { sel });
		}
	}
</script>

{#if sel?.type && sel.type !== 'configure' && !sidebarItem()}
	<div class="appearance-block">
		<div class="appearance-row">
			<span class="appearance-label">Размер</span>
			<div class="pill-group">
				<button class:pill-active={!sel?.size} on:click={() => setProp('size', undefined)} use:Ripple={$ripple}>Авто</button>
				<button class:pill-active={sel?.size === 'small'} on:click={() => setProp('size', 'small')} use:Ripple={$ripple}>Мини</button>
				<button class:pill-active={sel?.size === 'large'} on:click={() => setProp('size', 'large')}>2×</button>
				<button class:pill-active={sel?.size === 'full'} on:click={() => setProp('size', 'full')} use:Ripple={$ripple}>Ряд</button>
			</div>
		</div>
		<div class="appearance-row">
			<span class="appearance-label">Анимация</span>
			<div class="pill-group">
				<button class:pill-active={!sel?.animation} on:click={() => setProp('animation', undefined)} use:Ripple={$ripple}>Нет</button>
				<button class:pill-active={sel?.animation === 'pulse'} on:click={() => setProp('animation', 'pulse')} use:Ripple={$ripple}>Пульс</button>
				<button class:pill-active={sel?.animation === 'glow'} on:click={() => setProp('animation', 'glow')} use:Ripple={$ripple}>Свечение</button>
				<button class:pill-active={sel?.animation === 'bounce'} on:click={() => setProp('animation', 'bounce')} use:Ripple={$ripple}>Отскок</button>
			</div>
		</div>
	</div>
{/if}

<div class="container">
	<div class="align-left">
		{#if $editMode && (sel?.type || sel?.sections)}
			<button
				transition:fade={{ duration: $motion }}
				class="remove action"
				on:click={removeObj}
				use:Ripple={{
					...$ripple,
					color: 'rgba(0, 0, 0, 0.35)'
				}}
			>
				{$lang('remove')}
			</button>

			<button
				transition:fade={{ duration: $motion }}
				class="more action"
				on:click={() => (showMore = !showMore)}
				use:Ripple={$ripple}
				title="Ещё"
			>
				···
			</button>

			{#if showMore && !disableChangeType === true && !sidebarItem()}
				<button
					transition:fade={{ duration: $motion }}
					class="options action"
					on:click={() => {
						handleChangeType();
					}}
					use:Ripple={$ripple}
				>
					{$lang('change_type')}
				</button>
			{/if}
		{/if}
	</div>

	<button class="done action" on:click={closeModal} use:Ripple={$ripple}>
		{$lang('done')}
	</button>
</div>

<style>
	.appearance-block {
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		margin-top: 1.5rem;
		padding-top: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
	}

	.appearance-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.appearance-label {
		font-size: 0.85rem;
		opacity: 0.65;
		white-space: nowrap;
	}

	.pill-group {
		display: flex;
		gap: 0.3rem;
	}

	.pill-group button {
		padding: 0.3rem 0.7rem;
		border-radius: 0.4rem;
		border: 1px solid rgba(255, 255, 255, 0.15);
		background: transparent;
		color: inherit;
		cursor: pointer;
		font-size: 0.82rem;
		font-family: inherit;
		position: relative;
		overflow: hidden;
	}

	.pill-group button.pill-active {
		background: rgba(255, 193, 7, 0.2);
		border-color: rgba(255, 193, 7, 0.5);
		color: #ffc107;
	}

	.container {
		display: flex;
		justify-content: space-between;
		margin-top: 1.2rem;
	}

	.align-left {
		display: flex;
		gap: 0.8rem;
	}
</style>
