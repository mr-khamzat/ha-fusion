<script lang="ts">
	import { SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';
	import Button from '$lib/Main/Button.svelte';
	import ConditionalMedia from '$lib/Main/ConditionalMedia.svelte';
	import PictureElements from '$lib/Main/PictureElements.svelte';
	import Camera from '$lib/Main/Camera.svelte';
	import MediaPlayer from '$lib/Main/MediaPlayer.svelte';
	import Climate from '$lib/Main/Climate.svelte';
	import Light from '$lib/Main/Light.svelte';
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
	import Configure from '$lib/Main/Configure.svelte';
	import Empty from '$lib/Main/Empty.svelte';

	export let item: any;
	export let sectionName: string | undefined = undefined;

	const large = ['conditional_media', 'picture_elements', 'camera', 'media_player'];
</script>

{#if item?.[SHADOW_ITEM_MARKER_PROPERTY_NAME] && large.includes(item?.type)}
	<div class="shadow"></div>
{/if}

{#if item?.type === 'configure'}
	<Configure sel={item} />
{:else if item?.type === 'button'}
	<Button sel={item} {sectionName} />
{:else if item?.type === 'conditional_media'}
	<ConditionalMedia sel={item} />
{:else if item?.type === 'picture_elements'}
	<PictureElements sel={item} />
{:else if item?.type === 'camera'}
	<Camera sel={item} responsive={false} muted={true} controls={false} />
{:else if item?.type === 'media_player'}
	<MediaPlayer sel={item} />
{:else if item?.type === 'climate'}
	<Climate sel={item} />
{:else if item?.type === 'light'}
	<Light sel={item} />
{:else if item?.type === 'area_overview'}
	<AreaOverview sel={item} />
{:else if item?.type === 'fan'}
	<Fan sel={item} />
{:else if item?.type === 'presence'}
	<Presence sel={item} />
{:else if item?.type === 'scene_chips'}
	<SceneChips sel={item} />
{:else if item?.type === 'energy_card'}
	<EnergyCard sel={item} />
{:else if item?.type === 'quick_actions'}
	<QuickActions sel={item} />
{:else if item?.type === 'alarm_card'}
	<AlarmCard sel={item} />
{:else if item?.type === 'multi_cam_grid'}
	<MultiCamGrid sel={item} />
{:else if item?.type === 'device_tracker'}
	<DeviceTracker sel={item} />
{:else if item?.type === 'cover'}
	<Cover sel={item} />
{:else if item?.type === 'lock_card'}
	<LockCard sel={item} />
{:else if item?.type === 'vacuum'}
	<Vacuum sel={item} />
{:else if item?.type === 'input_number'}
	<InputNumber sel={item} />
{:else if item?.type === 'button_group'}
	<ButtonGroup sel={item} />
{:else if item?.type === 'sensor_grid'}
	<SensorGrid sel={item} />
{:else if item?.type === 'script_runner'}
	<ScriptRunner sel={item} />
{:else if item?.type === 'binary_sensor_card'}
	<BinarySensor sel={item} />
{:else if item?.type === 'prayer_times'}
	<PrayerTimes sel={item} />
{:else if item?.type === 'weather_card'}
	<WeatherCard sel={item} />
{:else if item?.type === 'sensor_graph'}
	<SensorGraph sel={item} />
{:else if item?.type === 'timer_card'}
	<TimerCard sel={item} />
{:else if item?.type === 'todo_card'}
	<TodoCard sel={item} />
{:else if item?.type === 'rgb_light_card'}
	<RGBLightCard sel={item} />
{:else if item?.type === 'irrigation_card'}
	<IrrigationCard sel={item} />
{:else if item?.type === 'resource_meter'}
	<ResourceMeter sel={item} />
{:else if item?.type === 'floor_plan_card'}
	<FloorPlanCard sel={item} />
{:else if item?.type === 'ai_assistant'}
	<AIAssistant sel={item} />
{:else if item?.type === 'habits_tracker'}
	<HabitsTracker sel={item} />
{:else if item?.type === 'room_view'}
	<RoomView sel={item} />
{:else if item?.type === 'event_timeline'}
	<EventTimeline sel={item} />
{:else if item?.type === 'empty'}
	<Empty sel={item} />
{:else}
	<!-- if types are changed internally, don't break ui -->
	<Configure sel={{ id: item?.id }} />
{/if}

<style>
	.shadow {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		visibility: visible;
		background: rgba(0, 0, 0, 0.125);
		margin: 0;
		border-radius: 0.65rem;
	}
</style>
