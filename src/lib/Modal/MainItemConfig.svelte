<script lang="ts">
	// eventually merge with SidebarItemConfig.svelte...

	import { dashboard, record, lang, motion, ripple, states, demo } from '$lib/Stores';
	import { openModal, closeModal } from 'svelte-modals';
	import { onMount } from 'svelte';
	import { flip } from 'svelte/animate';
	import InputClear from '$lib/Components/InputClear.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import {
		getCameraEntity,
		getSensorEntity,
		getMediaPlayerEntity,
		getClimateEntity,
		getLightEntity,
		getFanEntity,
		getPersonEntity
	} from '$lib/Modal/getRandomEntity';

	import Button from '$lib/Main/Button.svelte';
	import Camera from '$lib/Main/Camera.svelte';
	import ConditionalMedia from '$lib/Main/ConditionalMedia.svelte';
	import Empty from '$lib/Main/Empty.svelte';
	import Climate from '$lib/Main/Climate.svelte';
	import Light from '$lib/Main/Light.svelte';
	import MediaPlayer from '$lib/Main/MediaPlayer.svelte';
	import AreaOverview from '$lib/Main/AreaOverview.svelte';
	import Fan from '$lib/Main/Fan.svelte';
	import Presence from '$lib/Main/Presence.svelte';
	import SceneChips from '$lib/Main/SceneChips.svelte';
	import EnergyCard from '$lib/Main/EnergyCard.svelte';
	import QuickActions from '$lib/Main/QuickActions.svelte';
	import AlarmCard from '$lib/Main/AlarmCard.svelte';
	import MultiCamGrid from '$lib/Main/MultiCamGrid.svelte';
	import DeviceTracker from '$lib/Main/DeviceTracker.svelte';
	import Cover from '$lib/Main/Cover.svelte';
	import LockCard from '$lib/Main/LockCard.svelte';
	import Vacuum from '$lib/Main/Vacuum.svelte';
	import InputNumber from '$lib/Main/InputNumber.svelte';
	import ButtonGroup from '$lib/Main/ButtonGroup.svelte';
	import SensorGrid from '$lib/Main/SensorGrid.svelte';
	import ScriptRunner from '$lib/Main/ScriptRunner.svelte';
	import BinarySensor from '$lib/Main/BinarySensor.svelte';
	import PrayerTimes from '$lib/Main/PrayerTimes.svelte';
	import WeatherCard from '$lib/Main/WeatherCard.svelte';
	import SensorGraph from '$lib/Main/SensorGraph.svelte';
	import TimerCard from '$lib/Main/TimerCard.svelte';
	import TodoCard from '$lib/Main/TodoCard.svelte';
	import RGBLightCard from '$lib/Main/RGBLightCard.svelte';
	import IrrigationCard from '$lib/Main/IrrigationCard.svelte';
	import ResourceMeter from '$lib/Main/ResourceMeter.svelte';
	import FloorPlanCard from '$lib/Main/FloorPlanCard.svelte';
	import AIAssistant from '$lib/Main/AIAssistant.svelte';
	import HabitsTracker from '$lib/Main/HabitsTracker.svelte';
	import RoomView from '$lib/Main/RoomView.svelte';
	import EventTimeline from '$lib/Main/EventTimeline.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Ripple from 'svelte-ripple';
	import PictureElements from '$lib/Main/PictureElements.svelte';

	export let isOpen: boolean;
	export let sel: any;

	let searchString = '';
	let searchElement: HTMLInputElement;

	// get random preview entities
	if (!$demo.camera) $demo.camera = getCameraEntity($states);
	if (!$demo.sensor) $demo.sensor = getSensorEntity($states);
	if (!$demo.media_player) $demo.media_player = getMediaPlayerEntity($states);
	if (!$demo.climate) $demo.climate = getClimateEntity($states);
	if (!$demo.light) $demo.light = getLightEntity($states);
	if (!$demo.fan) $demo.fan = getFanEntity($states);
	if (!$demo.person) $demo.person = getPersonEntity($states);

	let loadIcons: (typeof import('@iconify/svelte'))['loadIcons'];
	let icons: Record<string, string>;

	onMount(async () => {
		if (searchElement) {
			searchElement.focus();
		}

		// if changing type reset object
		if (sel) {
			Object.keys(sel).forEach((key) => {
				if (key !== 'id') {
					delete (sel as any)[key];
				}
			});
			sel.type = 'configure';
			$dashboard = $dashboard;
		}

		// picture elements config, need to be loaded before click but can be deferred to onmount
		const [iconifyModule, iconsModule] = await Promise.all([
			import('@iconify/svelte'),
			import('$lib/Modal/PictureElements/icons')
		]);

		loadIcons = iconifyModule.loadIcons;
		icons = iconsModule.icons;
	});

	$: filter = itemTypes
		.filter(
			({ id, type }) =>
				id.toLowerCase().includes(searchString.toLowerCase()) ||
				type.toLowerCase().includes(searchString.toLowerCase())
		)
		.sort((a, b) => a.type.localeCompare(b.type));

	let itemTypes: {
		id: string;
		type: string;
		component?: any;
		props?: any;
		style?: any;
	}[];

	$: itemTypes = [
		{
			id: 'button',
			type: $lang('button'),
			component: Button,
			props: {
				demo: $demo.sensor,
				sel
			}
		},
		{
			id: 'camera',
			type: $lang('camera'),
			component: Camera,
			props: {
				demo: $demo.camera,
				sel,
				responsive: true,
				controls: false,
				muted: true
			}
		},
		{
			id: 'picture_elements',
			type: $lang('picture_elements'),
			component: PictureElements,
			props: {
				sel
			}
		},
		{
			id: 'empty',
			type: $lang('empty'),
			component: Empty,
			props: {
				sel
			}
		},
		{
			id: 'conditional_media',
			type: `${$lang('conditional')} ${$lang('media')?.toLocaleLowerCase()}`,
			component: ConditionalMedia,
			props: {
				demo: $demo.media_player,
				sel
			}
		},
		{
			id: 'media_player',
			type: $lang('media_player') || 'Media Player',
			component: MediaPlayer,
			props: {
				sel: { entity_id: $demo.media_player }
			}
		},
		{
			id: 'climate',
			type: $lang('climate') || 'Climate',
			component: Climate,
			props: {
				sel: { entity_id: $demo.climate }
			}
		},
		{
			id: 'light',
			type: $lang('light') || 'Light',
			component: Light,
			props: {
				sel: { entity_id: $demo.light }
			}
		},
		{
			id: 'area_overview',
			type: $lang('area_overview') || 'Area Overview',
			component: AreaOverview,
			props: {
				sel: { entity_ids: [] }
			}
		},
		{
			id: 'fan',
			type: $lang('fan') || 'Fan',
			component: Fan,
			props: {
				sel: { entity_id: $demo.fan }
			}
		},
		{
			id: 'presence',
			type: $lang('presence') || 'Presence',
			component: Presence,
			props: { sel: {} }
		},
		{
			id: 'scene_chips',
			type: $lang('scenes') || 'Scene Chips',
			component: SceneChips,
			props: { sel: { entity_ids: [] } }
		},
		{
			id: 'energy_card',
			type: 'Energy Card',
			component: EnergyCard,
			props: { sel: {} }
		},
		{
			id: 'quick_actions',
			type: 'Quick Actions',
			component: QuickActions,
			props: { sel: { actions: [] } }
		},
		{
			id: 'alarm_card',
			type: 'Alarm Card',
			component: AlarmCard,
			props: { sel: {} }
		},
		{
			id: 'multi_cam_grid',
			type: 'Multi-Cam Grid',
			component: MultiCamGrid,
			props: { sel: { cameras: [] } }
		},
		{
			id: 'device_tracker',
			type: 'Device Tracker',
			component: DeviceTracker,
			props: { sel: {} }
		},
		{
			id: 'cover',
			type: 'Cover / Shutter',
			component: Cover,
			props: { sel: {} }
		},
		{
			id: 'lock_card',
			type: 'Lock',
			component: LockCard,
			props: { sel: {} }
		},
		{
			id: 'vacuum',
			type: 'Vacuum',
			component: Vacuum,
			props: { sel: {} }
		},
		{
			id: 'input_number',
			type: 'Number / Slider',
			component: InputNumber,
			props: { sel: {} }
		},
		{
			id: 'button_group',
			type: 'Button Group',
			component: ButtonGroup,
			props: { sel: { entity_ids: [] } }
		},
		{
			id: 'sensor_grid',
			type: 'Sensor Grid',
			component: SensorGrid,
			props: { sel: { entity_ids: [] } }
		},
		{
			id: 'script_runner',
			type: 'Script Runner',
			component: ScriptRunner,
			props: { sel: { entity_ids: [] } }
		},
		{
			id: 'binary_sensor_card',
			type: 'Binary Sensor',
			component: BinarySensor,
			props: { sel: {} }
		},
		{
			id: 'prayer_times',
			type: 'Намаз / Prayer Times',
			component: PrayerTimes,
			props: { sel: {} }
		},
		{
			id: 'weather_card',
			type: 'Погода (карточка)',
			component: WeatherCard,
			props: { sel: { entity_id: $demo.sensor } }
		},
		{
			id: 'sensor_graph',
			type: 'График датчика',
			component: SensorGraph,
			props: { sel: { entity_id: $demo.sensor } }
		},
		{
			id: 'timer_card',
			type: 'Таймер',
			component: TimerCard,
			props: { sel: { entity_id: $demo.sensor } }
		},
		{
			id: 'todo_card',
			type: 'Список дел',
			component: TodoCard,
			props: { sel: { entity_id: $demo.sensor } }
		},
		{
			id: 'rgb_light_card',
			type: 'RGB подсветка',
			component: RGBLightCard,
			props: { sel: { entity_id: $demo.light } }
		},
		{
			id: 'irrigation_card',
			type: 'Полив (зоны)',
			component: IrrigationCard,
			props: { sel: { entity_ids: [] } }
		},
		{
			id: 'resource_meter',
			type: 'Счётчик ресурса',
			component: ResourceMeter,
			props: { sel: { resource_type: 'water' } }
		},
		{
			id: 'floor_plan_card',
			type: 'План квартиры',
			component: FloorPlanCard,
			props: { sel: { overlays: [] } }
		},
		{
			id: 'ai_assistant',
			type: 'AI Ассистент',
			component: AIAssistant,
			props: { sel: {} }
		},
		{
			id: 'habits_tracker',
			type: 'Трекер привычек',
			component: HabitsTracker,
			props: { sel: { habits: [] } }
		},
		{
			id: 'room_view',
			type: 'Вид комнаты',
			component: RoomView,
			props: { sel: {} }
		},
		{
			id: 'event_timeline',
			type: 'Лента событий',
			component: EventTimeline,
			props: { sel: {} }
		}
	];

	async function handleClick(id: string) {
		closeModal();

		// set sidebar item type
		if (sel) {
			sel.type = id;
			$dashboard = $dashboard;
		}
		$record();

		switch (id) {
			case 'button':
				openModal(() => import('$lib/Modal/ButtonConfig.svelte'), {
					demo: $demo.sensor,
					sel
				});
				break;
			case 'camera':
				openModal(() => import('$lib/Modal/CameraConfig.svelte'), {
					demo: $demo.camera,
					sel
				});
				break;
			case 'conditional_media':
				openModal(() => import('$lib/Modal/ConditionalMediaConfig.svelte'), {
					demo: $demo.media_player,
					sel
				});
				break;
			case 'picture_elements': {
				loadIcons(Object.values(icons));

				openModal(() => import('$lib/Modal/PictureElements/PictureElementsConfig.svelte'), {
					sel
				});

				break;
			}

			case 'empty':
				openModal(() => import('$lib/Modal/EmptyConfig.svelte'), { sel });
				break;
			case 'climate':
				openModal(() => import('$lib/Modal/EntityCardConfig.svelte'), {
					sel,
					domain: 'climate',
					title: $lang('climate') || 'Climate'
				});
				break;
			case 'light':
				openModal(() => import('$lib/Modal/LightConfig.svelte'), { sel });
				break;
			case 'media_player':
				openModal(() => import('$lib/Modal/EntityCardConfig.svelte'), {
					sel,
					domain: 'media_player',
					title: $lang('media_player') || 'Media Player'
				});
				break;
			case 'area_overview':
				openModal(() => import('$lib/Modal/AreaCardConfig.svelte'), { sel });
				break;
			case 'fan':
				openModal(() => import('$lib/Modal/EntityCardConfig.svelte'), {
					sel,
					domain: 'fan',
					title: $lang('fan') || 'Fan'
				});
				break;
			case 'presence':
				// presence shows all persons automatically — no entity config needed
				break;
			case 'scene_chips':
				openModal(() => import('$lib/Modal/SceneChipsConfig.svelte'), { sel });
				break;
			case 'energy_card':
				openModal(() => import('$lib/Modal/EnergyCardConfig.svelte'), { sel });
				break;
			case 'quick_actions':
				openModal(() => import('$lib/Modal/QuickActionsConfig.svelte'), { sel });
				break;
			case 'alarm_card':
				openModal(() => import('$lib/Modal/EntityCardConfig.svelte'), {
					sel,
					domain: 'alarm_control_panel',
					title: 'Alarm'
				});
				break;
			case 'multi_cam_grid':
				openModal(() => import('$lib/Modal/MultiCamGridConfig.svelte'), { sel });
				break;
			case 'device_tracker':
				openModal(() => import('$lib/Modal/DeviceTrackerConfig.svelte'), { sel });
				break;
			case 'cover':
				openModal(() => import('$lib/Modal/CoverConfig.svelte'), { sel });
				break;
			case 'lock_card':
				openModal(() => import('$lib/Modal/EntityCardConfig.svelte'), { sel, domain: 'lock', title: 'Lock' });
				break;
			case 'vacuum':
				openModal(() => import('$lib/Modal/EntityCardConfig.svelte'), { sel, domain: 'vacuum', title: 'Vacuum' });
				break;
			case 'input_number':
				openModal(() => import('$lib/Modal/EntityCardConfig.svelte'), { sel, domain: 'input_number', title: 'Number' });
				break;
			case 'button_group':
				openModal(() => import('$lib/Modal/ButtonGroupConfig.svelte'), { sel });
				break;
			case 'sensor_grid':
				openModal(() => import('$lib/Modal/SensorGridConfig.svelte'), { sel });
				break;
			case 'script_runner':
				openModal(() => import('$lib/Modal/ScriptRunnerConfig.svelte'), { sel });
				break;
			case 'binary_sensor_card':
				openModal(() => import('$lib/Modal/EntityCardConfig.svelte'), { sel, domain: 'binary_sensor', title: 'Binary Sensor' });
				break;
			case 'prayer_times':
				openModal(() => import('$lib/Modal/PrayerTimesConfig.svelte'), { sel });
				break;
			case 'weather_card':
				openModal(() => import('$lib/Modal/EntityCardConfig.svelte'), { sel, domain: 'weather', title: 'Weather Card' });
				break;
			case 'sensor_graph':
				openModal(() => import('$lib/Modal/EntityCardConfig.svelte'), { sel, domain: 'sensor', title: 'Sensor Graph' });
				break;
			case 'timer_card':
				openModal(() => import('$lib/Modal/EntityCardConfig.svelte'), { sel, domain: 'timer', title: 'Timer Card' });
				break;
			case 'todo_card':
				openModal(() => import('$lib/Modal/EntityCardConfig.svelte'), { sel, domain: 'todo', title: 'Todo Card' });
				break;
			case 'rgb_light_card':
				openModal(() => import('$lib/Modal/EntityCardConfig.svelte'), { sel, domain: 'light', title: 'RGB Light Card' });
				break;
			case 'irrigation_card':
				openModal(() => import('$lib/Modal/IrrigationConfig.svelte'), { sel });
				break;
			case 'resource_meter':
				openModal(() => import('$lib/Modal/ResourceMeterConfig.svelte'), { sel });
				break;
			case 'floor_plan_card':
				openModal(() => import('$lib/Modal/FloorPlanConfig.svelte'), { sel });
				break;
			case 'ai_assistant':
				openModal(() => import('$lib/Modal/AIAssistantConfig.svelte'), { sel });
				break;
			case 'habits_tracker':
				openModal(() => import('$lib/Modal/HabitsConfig.svelte'), { sel });
				break;
			case 'room_view':
				openModal(() => import('$lib/Modal/RoomViewConfig.svelte'), { sel });
				break;
			case 'event_timeline':
				openModal(() => import('$lib/Modal/EventTimelineConfig.svelte'), { sel });
				break;
			default:
				break;
		}
	}

	/**
	 * Handle keydown when pressing Esc key. Clear
	 * `searchElement` if focused else close modal
	 */
	function handleKeydown(event: KeyboardEvent) {
		if (event.key !== 'Escape') return;
		event.stopPropagation();

		if (searchElement === document.activeElement && searchString) {
			searchElement.blur();
			searchString = '';
		} else {
			closeModal();
		}
	}
</script>

<svelte:window on:keydown|capture={handleKeydown} />

{#if isOpen}
	<Modal size="large">
		<h1 slot="title">{$lang('options')}</h1>

		<div class="search">
			<InputClear
				condition={searchString}
				on:clear={() => {
					searchString = '';
				}}
				let:padding
			>
				<input
					name={$lang('search')}
					class="input"
					type="text"
					placeholder={$lang('search')}
					autocomplete="off"
					spellcheck="false"
					bind:this={searchElement}
					bind:value={searchString}
					style:padding
				/>
			</InputClear>
		</div>

		<div class="container">
			{#each filter as { id, type, component, props, style } (id)}
				<button
					on:click={() => handleClick(id)}
					animate:flip={{ duration: $motion }}
					style:text-align={style?.['text-align'] || 'start'}
					use:Ripple={$ripple}
				>
					<div class="header">
						{type}
					</div>

					<div class="preview" class:camera={id === 'camera'} class:button={id === 'button'}>
						<svelte:component this={component} {...props} />
					</div>
				</button>
			{/each}
		</div>

		<ConfigButtons {sel} disableChangeType={true} />
	</Modal>
{/if}

<style>
	.camera {
		padding: 1rem 1.2rem;
		height: inherit;
	}

	.button {
		display: flex;
		align-self: start;
		min-width: 14.5rem;
	}

	.container {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
		grid-gap: 1rem;
		overflow: auto;
		align-content: start;
	}

	button {
		display: grid;
		padding: 0;
		font-family: inherit;
		cursor: pointer;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.8em;
		background-color: rgba(0, 0, 0, 0.2);
		height: 10rem;
		outline-offset: -2px;
	}

	.header {
		background-color: rgba(0, 0, 0, 0.2);
		padding: 0.8em 1em 0.7em 1em;
		color: white;
		font-weight: 500;
		display: inline-flex;
		border-bottom: 1px solid rgba(255, 255, 255, 0.2);
		font-size: 1rem;
		height: min-content;
	}

	.preview {
		color: white;
		padding: 0 1.5rem;
		min-width: -webkit-fill-available;
	}

	.search {
		margin: 1rem 0;
	}
</style>
