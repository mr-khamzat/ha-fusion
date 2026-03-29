<script lang="ts">
	import { editMode, sortMode, motion, record, dragging, itemHeight, states, dashboard, currentViewId, timer } from '$lib/Stores';
	import { onMount, tick } from 'svelte';
	import { flip } from 'svelte/animate';
	import { dndzone, TRIGGERS, SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';
	import Content from '$lib/Main/Content.svelte';
	import SectionHeader from '$lib/Main/SectionHeader.svelte';
	import HorizontalStackHeader from '$lib/Main/HorizontalStackHeader.svelte';
	import Scenes from '$lib/Main/Scenes.svelte';
	import { handleVisibility, mediaQueries } from '$lib/Conditional';
	import { generateId } from '$lib/Utils';
	import { openModal } from 'svelte-modals';

	// ── Long press quick actions ─────────────────────────────────────────────
	let longPressTimer: ReturnType<typeof setTimeout> | null = null;
	let longPressItem: any = null;

	function openCardConfig(item: any) {
		const type = item?.type;
		if (!type || type === 'configure') {
			openModal(() => import('$lib/Modal/MainItemConfig.svelte'), { sel: item });
		} else if (type === 'button') {
			openModal(() => import('$lib/Modal/ButtonConfig.svelte'), { sel: item });
		} else if (type === 'light') {
			openModal(() => import('$lib/Modal/LightConfig.svelte'), { sel: item });
		} else if (type === 'climate') {
			openModal(() => import('$lib/Modal/EntityCardConfig.svelte'), { sel: item, domain: 'climate', title: 'Климат' });
		} else if (type === 'media_player') {
			openModal(() => import('$lib/Modal/EntityCardConfig.svelte'), { sel: item, domain: 'media_player', title: 'Медиаплеер' });
		} else if (type === 'camera') {
			openModal(() => import('$lib/Modal/CameraConfig.svelte'), { sel: item });
		} else if (type === 'area_overview') {
			openModal(() => import('$lib/Modal/AreaCardConfig.svelte'), { sel: item });
		} else if (type === 'fan') {
			openModal(() => import('$lib/Modal/EntityCardConfig.svelte'), { sel: item, domain: 'fan', title: 'Вентилятор' });
		} else if (type === 'presence') {
			openModal(() => import('$lib/Modal/EntityCardConfig.svelte'), { sel: item, domain: 'person', title: 'Присутствие' });
		} else if (type === 'scene_chips') {
			openModal(() => import('$lib/Modal/SceneChipsConfig.svelte'), { sel: item });
		} else if (type === 'energy_card') {
			openModal(() => import('$lib/Modal/EnergyCardConfig.svelte'), { sel: item });
		} else if (type === 'quick_actions') {
			openModal(() => import('$lib/Modal/QuickActionsConfig.svelte'), { sel: item });
		} else if (type === 'multi_cam_grid') {
			openModal(() => import('$lib/Modal/MultiCamGridConfig.svelte'), { sel: item });
		} else if (type === 'device_tracker') {
			openModal(() => import('$lib/Modal/DeviceTrackerConfig.svelte'), { sel: item });
		} else if (type === 'cover') {
			openModal(() => import('$lib/Modal/CoverConfig.svelte'), { sel: item });
		} else if (type === 'lock_card') {
			openModal(() => import('$lib/Modal/EntityCardConfig.svelte'), { sel: item, domain: 'lock', title: 'Замок' });
		} else if (type === 'vacuum') {
			openModal(() => import('$lib/Modal/EntityCardConfig.svelte'), { sel: item, domain: 'vacuum', title: 'Пылесос' });
		} else if (type === 'button_group') {
			openModal(() => import('$lib/Modal/ButtonGroupConfig.svelte'), { sel: item });
		} else if (type === 'sensor_grid') {
			openModal(() => import('$lib/Modal/SensorGridConfig.svelte'), { sel: item });
		} else if (type === 'script_runner') {
			openModal(() => import('$lib/Modal/ScriptRunnerConfig.svelte'), { sel: item });
		} else if (type === 'prayer_times') {
			openModal(() => import('$lib/Modal/PrayerTimesConfig.svelte'), { sel: item });
		} else if (type === 'resource_meter') {
			openModal(() => import('$lib/Modal/ResourceMeterConfig.svelte'), { sel: item });
		} else if (type === 'floor_plan_card') {
			openModal(() => import('$lib/Modal/FloorPlanConfig.svelte'), { sel: item });
		} else if (type === 'conditional_media') {
			openModal(() => import('$lib/Modal/ConditionalMediaConfig.svelte'), { sel: item });
		} else if (type === 'picture_elements') {
			openModal(() => import('$lib/Modal/PictureElements/PictureElementsConfig.svelte'), { sel: item });
		} else if (type === 'alarm_card') {
			openModal(() => import('$lib/Modal/EntityCardConfig.svelte'), { sel: item, domain: 'alarm_control_panel', title: 'Охрана' });
		} else if (type === 'irrigation_card') {
			openModal(() => import('$lib/Modal/IrrigationConfig.svelte'), { sel: item });
		} else {
			openModal(() => import('$lib/Modal/EntityCardConfig.svelte'), { sel: item });
		}
	}

	function startLongPress(item: any) {
		if ($editMode) return;
		longPressItem = item;
		longPressTimer = setTimeout(() => {
			longPressTimer = null;
			if (longPressItem && !$editMode) {
				openCardConfig(longPressItem);
			}
		}, 500);
	}

	function cancelLongPress() {
		if (longPressTimer) {
			clearTimeout(longPressTimer);
			longPressTimer = null;
		}
		longPressItem = null;
	}

	export let view: any;
	export let altKeyPressed: boolean;

	let currentDraggedElement: HTMLElement | undefined;
	let dragEnteredAnother = false;

	let isDraggingHorizontalStack = false;
	let isDraggingScenes = false;
	let skipTransformElement = false;

	const stackHeight = $itemHeight * 1.65;

	let mounted = false;
	onMount(() => (mounted = true));

	$: dndOptions = {
		flipDurationMs: $motion,
		dragDisabled: !$editMode && !$sortMode,
		dropTargetStyle: {},
		zoneTabIndex: -1
	};

	/**
	 * Drag and drop common code.
	 *
	 * Set `$dragging` to prevent exiting edit mode while mutations happen,
	 * then on 'finalize' snapshot current dashboard to history.
	 */
	async function handleDrag(event: CustomEvent<DndEvent>, callback: () => void) {
		$dragging = true;

		// increase body height to prevent scroll position from jumping...
		document.body.style.height = `${parseFloat(getComputedStyle(document.body).height) + 1}px`;

		// // disable consider min-height
		// (event.target as HTMLDivElement).style.minHeight = `${$itemHeight}px`;

		// handle dnd type
		callback();

		// set cross type flag
		if (!dragEnteredAnother && event?.detail?.info?.trigger === 'dragEnteredAnother') {
			dragEnteredAnother = true;
		}

		if (event.type === 'finalize') {
			$record();

			// reset variables
			$dragging = false;
			dragEnteredAnother = false;
			currentDraggedElement = undefined;
			skipTransformElement = false;

			// reset body height
			await tick();
			document.body.style.height = 'auto';
		}
	}

	/**
	 * Duplicates dragged item when Alt key is pressed during drag start
	 */
	function handleCopyOnDrag(items: any[], event: CustomEvent<DndEvent>) {
		const { trigger, id: itemId } = event.detail.info;

		if (trigger === TRIGGERS.DRAG_STARTED && altKeyPressed) {
			const idx = items.findIndex((item) => item.id === itemId);
			const newId = generateId($dashboard);

			event.detail.items = event.detail.items.filter(
				(item) => !item[SHADOW_ITEM_MARKER_PROPERTY_NAME]
			);
			event.detail.items.splice(idx, 0, { ...items[idx], id: newId });
		}

		return event.detail.items;
	}

	/**
	 * Handles the reordering of sections within a view when they are dragged
	 *
	 * Also checks if currently dragged section is a horizontal stack,
	 * and sets dnd type to prevent recursively stacking stacks.
	 */
	function dragSection(event: CustomEvent<DndEvent>) {
		const matchedSection = event.detail.items.find((section) =>
			[event?.detail?.info?.id, 'id:dnd-shadow-placeholder-0000'].includes(section.id)
		);

		isDraggingHorizontalStack = matchedSection?.type === 'horizontal-stack';
		isDraggingScenes = matchedSection?.type === 'scenes';

		if (event.type === 'finalize') {
			isDraggingScenes = false;
			isDraggingHorizontalStack = false;
		}

		handleDrag(event, () => {
			if (view) view.sections = event.detail.items;
		});
	}

	/**
	 * Handles the reordering of items within a section when they are dragged
	 */
	function dragItem(id: number, event: CustomEvent<DndEvent>) {
		handleDrag(event, () => {
			const section = view?.sections.find((sec: { id: number }) => sec.id === id);

			if (section) {
				section.items = handleCopyOnDrag(section.items, event);
				view.sections = [...view.sections];
			}
		});
	}

	/**
	 * Handles the reordering of sections within a horizontal stack when they are dragged
	 */
	function dragSection__stack(id: number, event: CustomEvent<DndEvent>) {
		handleDrag(event, () => {
			const stack = view?.sections.find(
				(section: { id: number; type: string }) =>
					section.id === id && section.type === 'horizontal-stack'
			);

			if (stack) {
				stack.sections = event.detail.items as any;
				view.sections = [...view.sections];
			}
		});
	}

	/**
	 * Handles the reordering of items within a horizontal stack when they are dragged
	 */
	function dragItem__stack(id: number, event: CustomEvent<DndEvent>) {
		handleDrag(event, () => {
			const section = view?.sections
				.find((section: { sections: { id: number }[] }) =>
					section.sections?.some((sub: { id: number }) => sub.id === id)
				)
				?.sections.find((sub: { id: number }) => sub.id === id);

			if (section) {
				section.items = handleCopyOnDrag(section.items, event);
				view.sections = [...view.sections];
			}
		});
	}

	/**
	 * The styles a constructed in a function to not have to repeat them inline.
	 *
	 * This is because of 'horizontal-stack'; it's not possible to make code
	 * recursive or use reusable components without breaking flip-animations.
	 */

	function sectionStyles(sectionType: string, editMode: boolean, motion: number, empty: boolean) {
		return `
			min-height: ${sectionType === 'scenes' ? '4.8rem' : `${$itemHeight}px`};
			background-color: ${empty ? 'rgba(255, 190, 10, 0.25)' : sectionType === 'scenes' ? 'rgba(0, 0, 0, 0.125)' : 'transparent'};
			outline: ${empty ? '2px dashed #ffc107' : 'none'};
			transition: ${
				editMode ? `background-color ${motion / 2}ms ease, min-height ${motion}ms ease` : 'none'
			};
    `;
	}

	function itemStyles(type: string, size?: string) {
		const large = ['conditional_media', 'picture_elements', 'camera', 'media_player'];
		const colSpan =
			size === 'large'
				? 'span 2'
				: size === 'full'
					? '1 / -1'
					: large.includes(type)
						? 'span 2'
						: 'span 1';
		const rowSpan = large.includes(type) && !size ? 'span 4' : 'span 1';
		const minHeight = size === 'small' ? '50px' : '';
		return `
			grid-column: ${colSpan};
			grid-row: ${rowSpan};
			display: ${type ? '' : 'none'};
			${minHeight ? `min-height: ${minHeight};` : ''}
    `;
	}

	// swipe between views on mobile
	let touchStartX = 0;
	let touchStartY = 0;

	function handleTouchStart(e: TouchEvent) {
		touchStartX = e.touches[0].clientX;
		touchStartY = e.touches[0].clientY;
	}

	function handleTouchEnd(e: TouchEvent) {
		const dx = e.changedTouches[0].clientX - touchStartX;
		const dy = e.changedTouches[0].clientY - touchStartY;
		if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;

		const views = $dashboard?.views || [];
		const currentIndex = views.findIndex((v: any) => v.id === $currentViewId);

		if (dx < 0 && currentIndex < views.length - 1) {
			$currentViewId = views[currentIndex + 1].id;
		} else if (dx > 0 && currentIndex > 0) {
			$currentViewId = views[currentIndex - 1].id;
		}
	}

	/**
	 * dnd transformDraggedElement
	 */
	function transformDraggedElement(element: HTMLElement | undefined) {
		if (element) transformElement(element);
	}

	/**
	 * Helper function to transform the dragged element
	 */
	function transformElement(element: HTMLElement) {
		const container = element.firstElementChild as HTMLElement;
		if (!container) return;

		const pictureElement = container?.firstElementChild?.className === 'konvajs-content';

		if (!altKeyPressed) skipTransformElement = true;

		// alt-duplicate add yellow outline
		if (!skipTransformElement) {
			Object.assign(container.style, {
				outline: '2px dashed rgb(255, 192, 8)',
				outlineOffset: '-2px',
				borderRadius: '0.65rem'
			});

			// if picture element set z-index on konva
			// container to be able to see the outline...
			if (pictureElement) {
				const konva = container.firstElementChild as HTMLElement;
				if (konva) konva.style.zIndex = '-1';
			}
		}
	}

	/**
	 * Transforms the dragged element for scene
	 * items and triggers acrossTypeTransform
	 */
	function transformScenesElement(element: HTMLElement | undefined) {
		if (!element) return;
		transformElement(element);

		// scene transformation
		if (!currentDraggedElement) currentDraggedElement = element;

		Object.assign(element.style, {
			overflow: 'hidden',
			borderRadius: '0.65rem',
			border: 'none'
		});
	}

	$: if (dragEnteredAnother && currentDraggedElement) {
		acrossTypeTransform(currentDraggedElement);
	}

	function acrossTypeTransform(currentDraggedElement: HTMLElement) {
		currentDraggedElement.innerHTML = '';
		const div = document.createElement('div');

		Object.assign(div.style, {
			outline: 'rgb(255, 192, 8) dashed 2px',
			outlineOffset: '-2px',
			backgroundColor: 'rgba(255, 190, 10, 0.25)',
			width: 'inherit',
			height: 'inherit',
			'border-radius': 'inherit'
		});

		currentDraggedElement.appendChild(div);
	}

	/**
	 * If $editMode is true, return the original view sections
	 * Otherwise filter the sections based on current states and conditions.
	 *
	 * This statement reactively updates when any of the following change:
	 * $editMode, mounted, $mediaQueries, view?.sections, $states, $timer (minute)
	 */
	$: _minute = Math.floor($timer.getTime() / 60000);
	$: viewSections = $editMode
		? view?.sections
		: _minute !== undefined &&
			typeof mounted === 'boolean' &&
			typeof $mediaQueries === 'object' &&
			handleVisibility($editMode, view?.sections, $states);

	// Adaptive ambient background: derive a subtle color from first 'on' light in view
	$: ambientColor = (() => {
		if (view?.background_url) return null; // don't override explicit background
		const allItems = view?.sections?.flatMap((s: any) =>
			s.type === 'horizontal-stack' ? s.sections?.flatMap((ss: any) => ss.items || []) : s.items || []
		) || [];
		const firstLight = allItems.find(
			(item: any) => item?.entity_id && $states?.[item.entity_id]?.state === 'on' &&
				$states?.[item.entity_id]?.attributes?.hs_color
		);
		if (!firstLight) return null;
		const hs = $states?.[firstLight.entity_id]?.attributes?.hs_color;
		return hs ? `hsla(${hs[0]}, ${Math.min(hs[1], 60)}%, 8%, 0.6)` : null;
	})();
</script>

<main
	style:transition="opacity {$motion}ms ease, outline-color {$motion}ms ease, background {1000}ms ease"
	style:opacity={$editMode && view?.sections.length === 0 ? '0' : '1'}
	style:background-image={view?.background_url ? `url('${view.background_url}')` : ''}
	style:background-size={view?.background_url ? 'cover' : ''}
	style:background-position={view?.background_url ? 'center' : ''}
	style:background-color={ambientColor || ''}
	class:bg-blur={view?.background_blur}
	use:dndzone={{ ...dndOptions, type: 'section', items: view.sections }}
	on:consider={dragSection}
	on:finalize={dragSection}
	on:touchstart={handleTouchStart}
	on:touchend={handleTouchEnd}
>
	{#if $sortMode && !$editMode}
		<div class="sort-banner">
			<span>Режим сортировки — перетащите карточки для перестановки</span>
			<button on:click={() => ($sortMode = false)}>✕</button>
		</div>
	{/if}

	{#each viewSections as section (`${section?.id}${section?.[SHADOW_ITEM_MARKER_PROPERTY_NAME] ? '_' + section?.[SHADOW_ITEM_MARKER_PROPERTY_NAME] : ''}`)}
		<section
			id={String(section?.id)}
			data-is-dnd-shadow-item-hint={section?.[SHADOW_ITEM_MARKER_PROPERTY_NAME]}
			animate:flip={{ duration: $motion }}
		>
			<!-- horizontal stack -->
			{#if section?.type === 'horizontal-stack'}
				<HorizontalStackHeader {view} {section} />

				<div
					class="horizontal-stack"
					style:min-height="{stackHeight}px"
					style:outline="2px dashed {$editMode ? '#ffc008' : 'transparent'}"
					style:transition="min-height {$motion}ms ease, outline {$motion / 2}ms ease"
					data-is-dnd-shadow-item-hint={section?.[SHADOW_ITEM_MARKER_PROPERTY_NAME]}
					use:dndzone={{
						...dndOptions,
						type: isDraggingHorizontalStack ? 'stack' : isDraggingScenes ? 'scenes' : 'section',
						items: section.sections
					}}
					on:consider={(event) => dragSection__stack(section.id, event)}
					on:finalize={(event) => dragSection__stack(section.id, event)}
				>
					{#each section?.sections as stackSection (`${stackSection?.id}${stackSection?.[SHADOW_ITEM_MARKER_PROPERTY_NAME] ? '_' + stackSection?.[SHADOW_ITEM_MARKER_PROPERTY_NAME] : ''}`)}
						{@const empty = $editMode && !stackSection?.items?.length}
						<section
							id={String(stackSection.id)}
							data-is-dnd-shadow-item-hint={stackSection?.[SHADOW_ITEM_MARKER_PROPERTY_NAME]}
							animate:flip={{ duration: $motion }}
							style:overflow="hidden"
						>
							<SectionHeader {view} section={stackSection} />
							<div
								class="items"
								data-is-dnd-shadow-item-hint={stackSection?.[SHADOW_ITEM_MARKER_PROPERTY_NAME]}
								style={sectionStyles(section?.type, $editMode, $motion, empty)}
								use:dndzone={{
									...dndOptions,
									type: 'item',
									items: stackSection.items,
									transformDraggedElement
								}}
								on:consider={(event) => dragItem__stack(stackSection.id, event)}
								on:finalize={(event) => dragItem__stack(stackSection.id, event)}
							>
								<!-- item -->
								{#each stackSection?.items as item (item.id)}
									<div
										id={item?.id}
										data-is-dnd-shadow-item-hint={item?.[SHADOW_ITEM_MARKER_PROPERTY_NAME]}
										class="item"
										class:anim-pulse={item?.animation === 'pulse'}
										class:anim-glow={item?.animation === 'glow'}
										class:anim-bounce={item?.animation === 'bounce'}
										animate:flip={{ duration: $motion }}
										tabindex="-1"
										style={itemStyles(item?.type, item?.size)}
										on:pointerdown={() => startLongPress(item)}
										on:pointerup={cancelLongPress}
										on:pointerleave={cancelLongPress}
										on:pointermove={cancelLongPress}
									>
										<Content {item} sectionName={stackSection?.name} />
									</div>
								{/each}
							</div>
						</section>
					{/each}
				</div>

				<!-- scenes -->
			{:else if section?.type === 'scenes'}
				{@const empty = $editMode && !section?.items?.length}
				<SectionHeader {view} {section} />
				<div
					class="scenes"
					style={sectionStyles(section?.type, $editMode, $motion, empty)}
					data-is-dnd-shadow-item-hint={section?.[SHADOW_ITEM_MARKER_PROPERTY_NAME]}
					use:dndzone={{
						...dndOptions,
						type: 'item',
						items: section.items,
						transformDraggedElement: transformScenesElement
					}}
					on:consider={(event) => dragItem(section.id, event)}
					on:finalize={(event) => dragItem(section.id, event)}
				>
					{#each section?.items as item, index (item.id)}
						<div
							id={item?.id}
							data-is-dnd-shadow-item-hint={item?.[SHADOW_ITEM_MARKER_PROPERTY_NAME]}
							animate:flip={{ duration: $motion }}
							tabindex="-1"
							class:divider={index !== section?.items?.length - 1}
						>
							<Scenes sel={item} />
						</div>
					{/each}
				</div>

				<!-- normal -->
			{:else}
				{@const empty = $editMode && !section?.items?.length}

				<SectionHeader {view} {section} />

				<div
					class="items"
					data-is-dnd-shadow-item-hint={section?.[SHADOW_ITEM_MARKER_PROPERTY_NAME]}
					style={sectionStyles(section?.type, $editMode, $motion, empty)}
					use:dndzone={{
						...dndOptions,
						type: 'item',
						items: section.items,
						transformDraggedElement
					}}
					on:consider={(event) => dragItem(section.id, event)}
					on:finalize={(event) => dragItem(section.id, event)}
				>
					{#each section?.items as item (item.id)}
						<div
							id={item?.id}
							data-is-dnd-shadow-item-hint={item?.[SHADOW_ITEM_MARKER_PROPERTY_NAME]}
							class="item"
							animate:flip={{ duration: $motion }}
							tabindex="-1"
							style={itemStyles(item?.type, item?.size)}
							on:pointerdown={() => startLongPress(item)}
							on:pointerup={cancelLongPress}
							on:pointerleave={cancelLongPress}
							on:pointermove={cancelLongPress}
						>
							<Content {item} sectionName={section?.name} />
						</div>
					{/each}
				</div>
			{/if}
		</section>
	{/each}
</main>

<style>
	main {
		grid-area: main;
		padding: 0 2rem 2rem;
		display: grid;
		gap: 1.5rem;
		outline: transparent;
		align-content: start;
	}

	.sort-banner {
		grid-column: 1 / -1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: rgba(255, 193, 7, 0.12);
		border: 1px solid rgba(255, 193, 7, 0.3);
		border-radius: 0.5rem;
		padding: 0.4rem 0.8rem;
		font-size: 0.82rem;
		color: #ffc107;
		gap: 0.5rem;
	}

	.sort-banner button {
		background: transparent;
		border: none;
		color: rgba(255, 193, 7, 0.7);
		cursor: pointer;
		font-size: 0.9rem;
		padding: 0.1rem 0.3rem;
		flex-shrink: 0;
	}

	section {
		display: grid;
		align-content: start;
	}

	.horizontal-stack {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: 1fr;
		gap: 2rem;
		border-radius: 0.65rem;
		outline-offset: 3px;
	}

	.items {
		border-radius: 0.6rem;
		outline-offset: -2px;
		display: grid;
		grid-template-columns: repeat(auto-fill, 14.5rem);
		grid-auto-rows: min-content;
		gap: 0.4rem;
		border-radius: 0.6rem;
		height: 100%;
	}

	.item {
		position: relative;
		border-radius: 0.65rem;
	}

	.item.anim-pulse {
		animation: card-pulse 2.5s ease-in-out infinite;
	}

	.item.anim-glow {
		animation: card-glow 2s ease-in-out infinite;
	}

	.item.anim-bounce {
		animation: card-bounce 1.8s ease-in-out infinite;
	}

	@keyframes card-pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.6; }
	}

	@keyframes card-glow {
		0%, 100% { box-shadow: 0 0 0px rgba(255, 193, 7, 0); }
		50% { box-shadow: 0 0 14px rgba(255, 193, 7, 0.45); }
	}

	@keyframes card-bounce {
		0%, 100% { transform: translateY(0); }
		40% { transform: translateY(-4px); }
		60% { transform: translateY(-2px); }
	}

	main.bg-blur {
		backdrop-filter: blur(12px);
	}

	main.bg-blur::before {
		content: '';
		position: absolute;
		inset: 0;
		background: inherit;
		filter: blur(12px);
		z-index: -1;
	}

	/* Phone and Tablet (portrait) */
	@media all and (max-width: 768px) {
		main {
			padding: 0 1.25rem 1.25rem 1.25rem;
		}

		.horizontal-stack {
			grid-auto-flow: row;
			gap: 1.5rem;
		}

		.items {
			display: flex;
			flex-wrap: wrap;
		}
	}

	.scenes {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
		border-radius: 0.65rem;
		overflow: hidden;
		min-height: 5rem;
	}

	.scenes > .divider {
		border-right: 1px solid transparent;
	}
</style>
