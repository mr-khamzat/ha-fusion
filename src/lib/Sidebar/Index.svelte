<script lang="ts">
	// store
	import { dashboard, motion, showDrawer, editMode, record, dragging } from '$lib/Stores';
	import { onMount, tick } from 'svelte';
	import { flip } from 'svelte/animate';
	import { dndzone, SHADOW_ITEM_MARKER_PROPERTY_NAME, TRIGGERS } from 'svelte-dnd-action';
	import { openModal } from 'svelte-modals';
	import { generateId, getSelected } from '$lib/Utils';
	import type { SidebarItem } from '$lib/Types';
	import '$lib/Sidebar/Sidebar.css';
	import type { ComponentType } from 'svelte';

	export let altKeyPressed: boolean;

	let skipTransformElement = false;
	let importedComponents: (string | undefined)[] = [];
	let mountedComponents = false;

	let Bar: ComponentType;
	let Camera: ComponentType;
	let Configure: ComponentType;
	let Date: ComponentType;
	let Divider: ComponentType;
	let Graph: ComponentType;
	let History: ComponentType;
	let Iframe: ComponentType;
	let Image: ComponentType;
	let Navigate: ComponentType;
	let Notifications: ComponentType;
	let Radial: ComponentType;
	let Sensor: ComponentType;
	let Template: ComponentType;
	let Time: ComponentType;
	let Timer: ComponentType;
	let Weather: ComponentType;
	let WeatherForecast: ComponentType;
	let Person: ComponentType;
	let Sun: ComponentType;
	let Todo: ComponentType;
	let MiniPlayer: ComponentType;
	let Gauge: ComponentType;
	let CalendarWidget: ComponentType;
	let Thermostat: ComponentType;
	let SolarFlow: ComponentType;
	let AnalogClock: ComponentType;
	let Battery: ComponentType;
	let Markdown: ComponentType;
	let AlbumArt: ComponentType;
	let AutomationToggle: ComponentType;
	let HomeModeWidget: ComponentType;
	let NetworkMonitor: ComponentType;
	let MyDay: ComponentType;

	const imports = {
		bar: () => import('$lib/Sidebar/Bar.svelte').then((c) => (Bar = c.default)),
		camera: () => import('$lib/Sidebar/Camera.svelte').then((c) => (Camera = c.default)),
		configure: () => import('$lib/Sidebar/Configure.svelte').then((c) => (Configure = c.default)),
		date: () => import('$lib/Sidebar/Date.svelte').then((c) => (Date = c.default)),
		divider: () => import('$lib/Sidebar/Divider.svelte').then((c) => (Divider = c.default)),
		graph: () => import('$lib/Sidebar/Graph.svelte').then((c) => (Graph = c.default)),
		history: () => import('$lib/Sidebar/History.svelte').then((c) => (History = c.default)),
		iframe: () => import('$lib/Sidebar/Iframe.svelte').then((c) => (Iframe = c.default)),
		image: () => import('$lib/Sidebar/Image.svelte').then((c) => (Image = c.default)),
		navigate: () => import('$lib/Sidebar/Navigate.svelte').then((c) => (Navigate = c.default)),
		notifications: () =>
			import('$lib/Sidebar/Notifications.svelte').then((c) => (Notifications = c.default)),
		radial: () => import('$lib/Sidebar/Radial.svelte').then((c) => (Radial = c.default)),
		sensor: () => import('$lib/Sidebar/Sensor.svelte').then((c) => (Sensor = c.default)),
		template: () => import('$lib/Sidebar/Template.svelte').then((c) => (Template = c.default)),
		time: () => import('$lib/Sidebar/Time.svelte').then((c) => (Time = c.default)),
		timer: () => import('$lib/Sidebar/Timer.svelte').then((c) => (Timer = c.default)),
		weather: () => import('$lib/Sidebar/Weather.svelte').then((c) => (Weather = c.default)),
		weather_forecast: () =>
			import('$lib/Sidebar/WeatherForecast.svelte').then((c) => (WeatherForecast = c.default)),
		person: () => import('$lib/Sidebar/Person.svelte').then((c) => (Person = c.default)),
		sun: () => import('$lib/Sidebar/Sun.svelte').then((c) => (Sun = c.default)),
		todo: () => import('$lib/Sidebar/Todo.svelte').then((c) => (Todo = c.default)),
		mini_player: () =>
			import('$lib/Sidebar/MiniPlayer.svelte').then((c) => (MiniPlayer = c.default)),
		gauge: () => import('$lib/Sidebar/Gauge.svelte').then((c) => (Gauge = c.default)),
		calendar_widget: () =>
			import('$lib/Sidebar/CalendarWidget.svelte').then((c) => (CalendarWidget = c.default)),
		thermostat: () =>
			import('$lib/Sidebar/Thermostat.svelte').then((c) => (Thermostat = c.default)),
		solar_flow: () =>
			import('$lib/Sidebar/SolarFlow.svelte').then((c) => (SolarFlow = c.default)),
		analog_clock: () =>
			import('$lib/Sidebar/AnalogClock.svelte').then((c) => (AnalogClock = c.default)),
		battery: () => import('$lib/Sidebar/Battery.svelte').then((c) => (Battery = c.default)),
		markdown: () => import('$lib/Sidebar/Markdown.svelte').then((c) => (Markdown = c.default)),
		album_art: () => import('$lib/Sidebar/AlbumArt.svelte').then((c) => (AlbumArt = c.default)),
		automation_toggle: () =>
			import('$lib/Sidebar/AutomationToggle.svelte').then((c) => (AutomationToggle = c.default)),
		home_mode_widget: () =>
			import('$lib/Sidebar/HomeModeWidget.svelte').then((c) => (HomeModeWidget = c.default)),
		network_monitor: () =>
			import('$lib/Sidebar/NetworkMonitor.svelte').then((c) => (NetworkMonitor = c.default)),
		my_day: () => import('$lib/Sidebar/MyDay.svelte').then((c) => (MyDay = c.default))
	};

	$: if ($dashboard?.sidebar) importComponents();

	/**
	 * Dynamically imports sidebar components based on
	 * the types present in the `$dashboard.sidebar`.
	 */
	async function importComponents() {
		const types = [...new Set($dashboard.sidebar.map((item) => item.type))];
		const promises = [];

		// counter for supported and not yet imported imports
		let validImports = 0;

		for (let type of types) {
			const module = imports[type as keyof typeof imports];

			if (!importedComponents.includes(type) && module) {
				promises.push(module());
				importedComponents.push(type);
				validImports++;
			}
		}

		await Promise.all(promises);

		/**
		 * Wait for all imports to complete then set `loaded` flag
		 * to prevent flip animation before components has loaded.
		 */
		if (importedComponents.length >= validImports) {
			mountedComponents = true;
		}
	}

	/**
	 * Dynamically imports modals
	 */
	async function handleClick(selectedId: number | undefined) {
		const sel = getSelected(selectedId, $dashboard) as SidebarItem;

		if ($editMode && sel) {
			if (sel?.type === 'bar') {
				openModal(() => import('$lib/Modal/BarConfig.svelte'), { sel });
			} else if (sel?.type === 'camera') {
				openModal(() => import('$lib/Modal/CameraConfig.svelte'), { sel });
			} else if (sel?.type === 'date') {
				openModal(() => import('$lib/Modal/DateConfig.svelte'), { sel });
			} else if (sel?.type === 'divider') {
				openModal(() => import('$lib/Modal/DividerConfig.svelte'), { sel });
			} else if (sel?.type === 'graph') {
				openModal(() => import('$lib/Modal/GraphConfig.svelte'), { sel });
			} else if (sel?.type === 'history') {
				openModal(() => import('$lib/Modal/HistoryConfig.svelte'), { sel });
			} else if (sel?.type === 'iframe') {
				openModal(() => import('$lib/Modal/IframeConfig.svelte'), { sel });
			} else if (sel?.type === 'image') {
				openModal(() => import('$lib/Modal/ImageConfig.svelte'), { sel });
			} else if (sel?.type === 'navigate') {
				openModal(() => import('$lib/Modal/NavigateConfig.svelte'), { sel });
			} else if (sel?.type === 'notifications') {
				openModal(() => import('$lib/Modal/NotificationsConfig.svelte'), { sel });
			} else if (sel?.type === 'radial') {
				openModal(() => import('$lib/Modal/RadialConfig.svelte'), { sel });
			} else if (sel?.type === 'sensor') {
				openModal(() => import('$lib/Modal/SensorConfig.svelte'), { sel });
			} else if (sel?.type === 'template') {
				openModal(() => import('$lib/Modal/TemplateConfig.svelte'), { sel });
			} else if (sel?.type === 'time') {
				openModal(() => import('$lib/Modal/TimeConfig.svelte'), { sel });
			} else if (sel?.type === 'timer') {
				openModal(() => import('$lib/Modal/TimerConfig.svelte'), { sel });
			} else if (sel?.type === 'weather') {
				openModal(() => import('$lib/Modal/WeatherConfig.svelte'), { sel });
			} else if (sel?.type === 'weather_forecast') {
				openModal(() => import('$lib/Modal/WeatherForecastConfig.svelte'), { sel });
			} else if (sel?.type === 'todo') {
				openModal(() => import('$lib/Modal/EntityCardConfig.svelte'), {
					sel,
					domain: 'todo',
					title: 'Todo'
				});
			} else if (sel?.type === 'person') {
				openModal(() => import('$lib/Modal/EntityCardConfig.svelte'), {
					sel,
					domain: 'person',
					title: 'Person'
				});
			} else if (sel?.type === 'sun') {
				openModal(() => import('$lib/Modal/SunConfig.svelte'), { sel });
			} else if (sel?.type === 'mini_player') {
				openModal(() => import('$lib/Modal/EntityCardConfig.svelte'), {
					sel,
					domain: 'media_player',
					title: 'Mini Player'
				});
			} else if (sel?.type === 'gauge') {
				openModal(() => import('$lib/Modal/GaugeConfig.svelte'), { sel });
			} else if (sel?.type === 'calendar_widget') {
				openModal(() => import('$lib/Modal/CalendarWidgetConfig.svelte'), { sel });
			} else if (sel?.type === 'thermostat') {
				openModal(() => import('$lib/Modal/ThermostatConfig.svelte'), { sel });
			} else if (sel?.type === 'solar_flow') {
				openModal(() => import('$lib/Modal/SolarFlowConfig.svelte'), { sel });
			} else if (sel?.type === 'analog_clock') {
				openModal(() => import('$lib/Modal/AnalogClockConfig.svelte'), { sel });
			} else if (sel?.type === 'battery') {
				openModal(() => import('$lib/Modal/BatteryConfig.svelte'), { sel });
			} else if (sel?.type === 'markdown') {
				openModal(() => import('$lib/Modal/MarkdownConfig.svelte'), { sel });
			} else if (sel?.type === 'album_art') {
				openModal(() => import('$lib/Modal/AlbumArtConfig.svelte'), { sel });
			} else if (sel?.type === 'automation_toggle') {
				openModal(() => import('$lib/Modal/AutomationToggleConfig.svelte'), { sel });
			} else if (sel?.type === 'home_mode_widget') {
				openModal(() => import('$lib/Modal/HomeModeConfig.svelte'), { sel });
			} else if (sel?.type === 'network_monitor') {
				openModal(() => import('$lib/Modal/NetworkMonitorConfig.svelte'), { sel });
			} else if (sel?.type === 'my_day') {
				openModal(() => import('$lib/Modal/MyDayConfig.svelte'), { sel });
			} else {
				openModal(() => import('$lib/Modal/SidebarItemConfig.svelte'), { sel });

				// force $editMode when clicking SidebarItemConfig
				await tick();
				setTimeout(() => {
					$editMode = true;
					$showDrawer = true;
				}, $motion);
			}
		} else {
			// !$editMode modals
			if (sel?.type === 'camera') {
				openModal(() => import('$lib/Modal/CameraModal.svelte'), { sel });
			} else if (sel?.type === 'timer') {
				openModal(() => import('$lib/Modal/TimerModal.svelte'), { sel });
			}
		}
	}

	function handleSort(event: CustomEvent<DndEvent>) {
		$dragging = true;

		$dashboard.sidebar = handleCopyOnDrag($dashboard.sidebar, event);

		if (event?.type === 'finalize') {
			$record();
			$dragging = false;
			skipTransformElement = false;
		}
	}

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
	 * dnd transformDraggedElement
	 */
	function transformDraggedElement(element: HTMLElement | undefined) {
		if (element) {
			const container = element.firstElementChild as HTMLDivElement;

			if (!altKeyPressed) skipTransformElement = true;

			if (!skipTransformElement && container) {
				Object.assign(container.style, {
					outline: 'rgb(255, 192, 8) dashed 2px',
					outlineOffset: '-2px',
					borderRadius: '0.65rem'
				});
			}
		}
	}

	// media query js
	let matches = false;

	onMount(() => {
		const handleMediaQueryChange = (event: { matches: boolean }) => {
			matches = event.matches;
		};

		const mediaQuery = window.matchMedia('(max-width: 768px)');
		matches = mediaQuery.matches;

		mediaQuery.addEventListener('change', handleMediaQueryChange);
		// cleanup
		return () => {
			mediaQuery.removeEventListener('change', handleMediaQueryChange);
		};
	});
</script>

<aside
	style:padding={$dashboard.hide_sidebar || $dashboard.sidebar.length === 0
		? '0px'
		: 'var(--theme-sidebar-padding)'}
	style:transition="padding {$motion}ms ease"
>
	{#if $editMode}
		{#await import('$lib/Components/ResizeHandle.svelte') then ResizeHandle}
			<svelte:component this={ResizeHandle.default} />
		{/await}
	{/if}

	{#if !$dashboard?.hide_sidebar}
		<section
			use:dndzone={{
				type: 'sidebar',
				items: $dashboard?.sidebar,
				flipDurationMs: $motion,
				dragDisabled: !$editMode,
				dropTargetStyle: {},
				zoneTabIndex: -1,
				morphDisabled: true,
				transformDraggedElement
			}}
			on:consider={handleSort}
			on:finalize={handleSort}
		>
			{#each $dashboard.sidebar as item (item.id)}
				{@const hide_mobile = matches && item?.hide_mobile && !$editMode}

				<div
					id={String(item.id)}
					animate:flip={{ duration: mountedComponents ? $motion : 0 }}
					class="sidebar_edit_mode"
					style:display={item?.type === 'divider' ||
					item?.type === 'date' ||
					item?.type === 'camera' ||
					item?.type === 'time' ||
					item?.type === 'notifications' ||
					item?.type === 'configure'
						? 'flex'
						: 'initial'}
				>
					<!-- BAR -->
					{#if Bar && item?.type === 'bar' && !hide_mobile}
						<button on:click={() => handleClick(item?.id)}>
							<svelte:component
								this={Bar}
								entity_id={item?.entity_id}
								name={item?.name}
								math={item?.math}
								id={item?.id}
							/>
						</button>

						<!-- CAMERA -->
					{:else if Camera && item?.type === 'camera' && !hide_mobile}
						<button on:click={() => handleClick(item?.id)}>
							<svelte:component this={Camera} sel={item} />
						</button>

						<!-- CONFIGURE -->
					{:else if Configure && item?.type === 'configure'}
						<div on:click={() => handleClick(item?.id)} on:keydown role="button" tabindex="0">
							<svelte:component this={Configure} sel={item} />
						</div>

						<!-- DATE -->
					{:else if Date && item?.type === 'date' && !hide_mobile}
						<button on:click={() => handleClick(item?.id)}>
							<svelte:component
								this={Date}
								short_day={item?.short_day}
								short_month={item?.short_month}
								hide={item?.hide}
								layout={item?.layout}
							/>
						</button>

						<!-- DIVIDER -->
					{:else if Divider && item?.type === 'divider' && !hide_mobile}
						<button on:click={() => handleClick(item?.id)} aria-label={item?.type} tabindex="-1">
							<svelte:component this={Divider} mode={item?.mode} size={item?.size} />
						</button>

						<!-- GRAPH -->
					{:else if Graph && item?.type === 'graph' && !hide_mobile}
						<button on:click={() => handleClick(item?.id)}>
							<svelte:component
								this={Graph}
								entity_id={item?.entity_id}
								name={item?.name}
								period={item?.period}
								stroke={item?.stroke}
							/>
						</button>

						<!-- HISTORY -->
					{:else if History && item?.type === 'history' && !hide_mobile}
						<button on:click={() => handleClick(item?.id)}>
							<svelte:component
								this={History}
								entity_id={item?.entity_id || ''}
								period={item?.period}
							/>
						</button>

						<!-- IFRAME -->
					{:else if Iframe && item?.type === 'iframe' && !hide_mobile}
						<button on:click={() => handleClick(item?.id)}>
							<svelte:component this={Iframe} url={item?.url} size={item?.size} />
						</button>

						<!-- NOTIFICATIONS -->
					{:else if Notifications && item?.type === 'notifications' && !hide_mobile}
						<button on:click={() => handleClick(item?.id)}>
							<svelte:component this={Notifications} sel={item} />
						</button>

						<!-- IMAGE -->
					{:else if Image && item?.type === 'image' && !hide_mobile}
						<button on:click={() => handleClick(item?.id)}>
							<svelte:component this={Image} entity_id={item?.entity_id} url={item?.url} />
						</button>

						<!-- NAVIGATE -->
					{:else if Navigate && item?.type === 'navigate' && !hide_mobile}
						{#key $editMode}
							<div
								on:click|preventDefault={() => {
									if ($editMode) handleClick(item?.id);
								}}
								on:keydown
								role="button"
								tabindex="0"
							>
								<svelte:component this={Navigate} />
							</div>
						{/key}

						<!-- RADIAL -->
					{:else if Radial && item?.type === 'radial' && !hide_mobile}
						<div on:click={() => handleClick(item?.id)} on:keydown role="button" tabindex="0">
							<svelte:component
								this={Radial}
								entity_id={item?.entity_id}
								name={item?.name}
								strokeWidth={item?.stroke}
								thresholds={item?.thresholds}
							/>
						</div>

						<!-- SENSOR -->
					{:else if Sensor && item?.type === 'sensor' && !hide_mobile}
						<div on:click={() => handleClick(item?.id)} on:keydown role="button" tabindex="0">
							<svelte:component
								this={Sensor}
								entity_id={item?.entity_id}
								prefix={item?.prefix}
								suffix={item?.suffix}
								date={item?.date || false}
							/>
						</div>

						<!-- TEMPLATE -->
					{:else if Template && item?.type === 'template' && !hide_mobile}
						<button on:click={() => handleClick(item?.id)}>
							<svelte:component this={Template} sel={item} />
						</button>

						<!-- TIME -->
					{:else if Time && item?.type === 'time' && !hide_mobile}
						<button on:click={() => handleClick(item?.id)}>
							<svelte:component
								this={Time}
								seconds={item?.seconds}
								hour12={item?.hour12 || false}
							/>
						</button>

						<!-- TIMER -->
					{:else if Timer && item?.type === 'timer' && !hide_mobile}
						<button on:click={() => handleClick(item?.id)}>
							<svelte:component this={Timer} sel={item} />
						</button>

						<!-- WEATHER -->
					{:else if Weather && item?.type === 'weather' && !hide_mobile}
						<button on:click={() => handleClick(item?.id)}>
							<svelte:component this={Weather} sel={item} />
						</button>

						<!-- WEATHER FORECAST -->
					{:else if WeatherForecast && item?.type === 'weather_forecast' && !hide_mobile}
						<button on:click={() => handleClick(item?.id)}>
							<svelte:component this={WeatherForecast} sel={item} />
						</button>

						<!-- PERSON -->
					{:else if Person && item?.type === 'person' && !hide_mobile}
						<button on:click={() => handleClick(item?.id)}>
							<svelte:component this={Person} sel={item} />
						</button>

						<!-- SUN -->
					{:else if Sun && item?.type === 'sun' && !hide_mobile}
						<button on:click={() => handleClick(item?.id)}>
							<svelte:component this={Sun} sel={item} />
						</button>

						<!-- TODO -->
					{:else if Todo && item?.type === 'todo' && !hide_mobile}
						<button on:click={() => handleClick(item?.id)}>
							<svelte:component this={Todo} sel={item} />
						</button>

						<!-- MINI PLAYER -->
					{:else if MiniPlayer && item?.type === 'mini_player' && !hide_mobile}
						<button on:click={() => handleClick(item?.id)}>
							<svelte:component this={MiniPlayer} sel={item} />
						</button>

						<!-- GAUGE -->
					{:else if Gauge && item?.type === 'gauge' && !hide_mobile}
						<div on:click={() => handleClick(item?.id)} on:keydown role="button" tabindex="0">
							<svelte:component
								this={Gauge}
								entity_id={item?.entity_id}
								name={item?.name}
								min={item?.min}
								max={item?.max}
								unit={item?.unit}
								thresholds={item?.thresholds}
							/>
						</div>

						<!-- CALENDAR WIDGET -->
					{:else if CalendarWidget && item?.type === 'calendar_widget' && !hide_mobile}
						<div on:click={() => handleClick(item?.id)} on:keydown role="button" tabindex="0">
							<svelte:component this={CalendarWidget} sel={item} />
						</div>

						<!-- THERMOSTAT -->
					{:else if Thermostat && item?.type === 'thermostat' && !hide_mobile}
						<div on:click={() => handleClick(item?.id)} on:keydown role="button" tabindex="0">
							<svelte:component this={Thermostat} sel={item} />
						</div>

						<!-- SOLAR FLOW -->
					{:else if SolarFlow && item?.type === 'solar_flow' && !hide_mobile}
						<div on:click={() => handleClick(item?.id)} on:keydown role="button" tabindex="0">
							<svelte:component this={SolarFlow} sel={item} />
						</div>

						<!-- ANALOG CLOCK -->
					{:else if AnalogClock && item?.type === 'analog_clock' && !hide_mobile}
						<button on:click={() => handleClick(item?.id)}>
							<svelte:component this={AnalogClock} sel={item} />
						</button>

						<!-- BATTERY MONITOR -->
					{:else if Battery && item?.type === 'battery' && !hide_mobile}
						<div on:click={() => handleClick(item?.id)} on:keydown role="button" tabindex="0">
							<svelte:component this={Battery} sel={item} />
						</div>

						<!-- MARKDOWN -->
					{:else if Markdown && item?.type === 'markdown' && !hide_mobile}
						<div on:click={() => handleClick(item?.id)} on:keydown role="button" tabindex="0">
							<svelte:component this={Markdown} sel={item} />
						</div>

						<!-- ALBUM ART -->
					{:else if AlbumArt && item?.type === 'album_art' && !hide_mobile}
						<div on:click={() => handleClick(item?.id)} on:keydown role="button" tabindex="0">
							<svelte:component this={AlbumArt} sel={item} />
						</div>

						<!-- AUTOMATION TOGGLE -->
					{:else if AutomationToggle && item?.type === 'automation_toggle' && !hide_mobile}
						<div on:click={() => handleClick(item?.id)} on:keydown role="button" tabindex="0">
							<svelte:component this={AutomationToggle} sel={item} />
						</div>

						<!-- HOME MODE WIDGET -->
					{:else if HomeModeWidget && item?.type === 'home_mode_widget' && !hide_mobile}
						<div on:click={() => handleClick(item?.id)} on:keydown role="button" tabindex="0">
							<svelte:component this={HomeModeWidget} sel={item} />
						</div>

						<!-- MY DAY -->
					{:else if MyDay && item?.type === 'my_day' && !hide_mobile}
						<div on:click={() => handleClick(item?.id)} on:keydown role="button" tabindex="0">
							<svelte:component this={MyDay} sel={item} />
						</div>

						<!-- NETWORK MONITOR -->
					{:else if NetworkMonitor && item?.type === 'network_monitor' && !hide_mobile}
						<div on:click={() => handleClick(item?.id)} on:keydown role="button" tabindex="0">
							<svelte:component this={NetworkMonitor} sel={item} />
						</div>
					{/if}
				</div>
			{/each}
		</section>

		{#await import('$lib/Sidebar/Toast.svelte') then Toast}
			<svelte:component this={Toast.default} />
		{/await}
	{/if}
</aside>

<style>
	aside {
		position: relative;
		grid-area: aside;
		padding: var(--theme-sidebar-padding);
		padding-bottom: 1.4rem !important;
		background-color: var(--theme-colors-sidebar-background);
		border-right: var(--theme-colors-sidebar-border);
	}

	div {
		width: 100%;
	}

	button {
		background: inherit;
		border: inherit;
		color: inherit;
		font-family: inherit;
		padding: inherit;
		text-align: inherit;
		cursor: inherit;
		font-size: inherit;
		width: 100%;
	}

	section {
		margin-top: 1rem;
		height: calc(100% - 1rem);
		font-size: var(--theme-sidebar-font-size);
		display: flex;
		flex-direction: column;
	}

	.sidebar_edit_mode {
		transition: height 200ms ease;
		display: flex;
	}
</style>
