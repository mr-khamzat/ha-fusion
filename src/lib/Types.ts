import type Konva from 'konva';
import type { ShapeConfig } from 'konva/lib/Shape';

// configuration.yaml

export interface Configuration {
	hassUrl?: string;
	locale?: string;
	custom_js?: boolean;
	motion?: boolean;
	addons?: Addons;
	token?: string;
}

export interface Addons {
	youtube?: boolean;
	maptiler?: {
		apikey: string;
	};
}

export interface ScreensaverConfig {
	idle_timeout?: number;
	show_seconds?: boolean;
	show_weather?: boolean;
	weather_entity?: string;
	temp_sensors?: string[];
	humidity_sensors?: string[];
	show_persons?: boolean;
	show_prayer?: boolean;
	camera_entity?: string;
}

export interface Dashboard {
	views: Views[];
	sidebar: SidebarItem[];
	theme?: string;
	hide_views?: boolean;
	hide_sidebar?: boolean;
	sidebarWidth?: number;
	quick_shade_entities?: string[];
	screensaver?: ScreensaverConfig;
}

export interface Views {
	id?: number;
	name?: string;
	icon?: string;
	sections?: Section[];
	isDndShadowItem?: boolean;
	background_url?: string;
	background_blur?: boolean;
	auto_switch?: Condition[];
}

export interface Section {
	id?: number;
	name?: string;
	items?: Item[];
	visibility?: {
		conditions?: Condition[];
	}[];

	// HorizontalStack
	type?: string;
	sections?: Section[];
}

export interface Condition {
	condition?: 'state' | 'numeric_state' | 'screen' | 'or' | 'and' | 'time';
	conditions?: Condition[];
	id?: number;
	entity?: string;
	state?: string;
	state_not?: string;
	media_query?: string;
	above?: number;
	below?: number;
	after?: string;
	before?: string;
	collapsed?: boolean;
}

export interface Translations {
	[key: string]: string;
}

// dashboard.yaml

export interface ViewItem {
	id?: number;
	name?: string;
	icon?: string;
	sections?: any[];
}

export interface EmptyItem {
	id?: number;
}

export interface ButtonItem {
	type: string;
	id: number;
	entity_id: string;
	name?: string;
	icon?: string;
	color?: string;
	size?: 'small' | 'medium' | 'large' | 'full';
	marquee?: boolean;
	more_info?: boolean;
	service?: string;
	state: any;
	template?: {
		[key: string]: {
			set_state?: string;
			state?: string;
			name?: string;
			icon?: string;
			color?: string;
			service?: string;
		};
	};
}

export interface Template {
	[id: number]: {
		[key: string]: {
			input: string | undefined;
			output: string | undefined;
			error: string | undefined;
			entity_id: string | undefined;
		};
	};
}

export interface PersistentNotification {
	created_at: string;
	message: string;
	notification_id: string;
	title: string;
	status: 'read' | 'unread';
}

export type SidebarItem = BarItem &
	CameraItem &
	DateItem &
	GraphItem &
	HistoryItem &
	IframeItem &
	ImageItem &
	NavigateItem &
	RadialItem &
	SensorItem &
	TemplateItem &
	TimeItem &
	WeatherItem &
	WeatherForecastItem &
	DividerItem &
	SunItem &
	TodoItem &
	MiniPlayerItem &
	PersonItem &
	MyDayItem &
	YandexWeatherItem;

export interface SunItem {
	type?: string;
	id?: number;
	hide_mobile?: boolean;
}

export interface TodoItem {
	type?: string;
	id?: number;
	entity_id?: string;
	name?: string;
	hide_mobile?: boolean;
}

export interface ClimateCardItem {
	type: string;
	id: number;
	entity_id: string;
	name?: string;
}

export interface LightCardItem {
	type: string;
	id: number;
	entity_id: string;
	name?: string;
}

export interface AreaCardItem {
	type: string;
	id: number;
	area_id?: string;
	name?: string;
	entity_ids?: string[];
	icon?: string;
}

export interface FanCardItem {
	type: string;
	id: number;
	entity_id: string;
	name?: string;
}

export interface PresenceCardItem {
	type: string;
	id: number;
	name?: string;
}

export interface SceneChipsItem {
	type: string;
	id: number;
	entity_ids?: string[];
	name?: string;
}

export interface EventTimelineItem {
	type: string;
	id: number;
	entity_ids?: string[];
	name?: string;
	max_events?: number;
	period?: string;
}

export interface BarItem {
	type?: string;
	id?: number;
	entity_id?: string;
	name?: string;
	math?: string;
	hide_mobile?: boolean;
}

export interface CameraItem {
	type?: string;
	id?: number;
	entity_id?: string;
	stream?: boolean;
	size?: string;
	hide_mobile?: boolean;
}

export interface DateItem {
	type?: string;
	id?: number;
	short_day?: boolean;
	short_month?: boolean;
	hide?: string;
	layout?: string;
	hide_mobile?: boolean;
}

export interface GraphItem {
	name?: string;
	type?: string;
	id?: number;
	entity_id?: string;
	period?: string;
	stroke?: number;
	hide_mobile?: boolean;
}

export interface HistoryItem {
	type?: string;
	id?: number;
	entity_id?: string;
	period?: string;
	hide_mobile?: boolean;
}

export interface IframeItem {
	type?: string;
	id?: number;
	url?: string;
	size?: string;
	hide_mobile?: boolean;
}

export interface ImageItem {
	type?: string;
	id?: number;
	entity_id?: string;
	url?: string;
	hide_mobile?: boolean;
}

export interface DividerItem {
	type?: string;
	id?: number;
	mode?: string;
	size?: number;
	hide_mobile?: boolean;
}

export interface NavigateItem {
	type?: string;
	id?: number;
	hide_mobile?: boolean;
}

export interface RadialItem {
	type?: string;
	id?: number;
	entity_id?: string;
	name?: string;
	stroke?: number;
	hide_mobile?: boolean;
	thresholds?: { value: number; color: string }[];
}

export interface MiniPlayerItem {
	type?: string;
	id?: number;
	entity_id?: string;
	name?: string;
	hide_mobile?: boolean;
}

export interface PersonItem {
	type?: string;
	id?: number;
	entity_id?: string;
	name?: string;
	hide_mobile?: boolean;
}

export interface SensorItem {
	type?: string;
	id?: number;
	entity_id?: string;
	prefix?: string;
	suffix?: string;
	date?: boolean;
	hide_mobile?: boolean;
}

export interface TemplateItem {
	type?: string;
	id?: number;
	template?: string;
	hide_mobile?: boolean;
}

export interface TimeItem {
	type?: string;
	id?: number;
	hour12?: boolean;
	seconds?: boolean;
	hide_mobile?: boolean;
}

export interface TimerItem {
	type?: string;
	id?: number;
	entity_id?: string;
	hide_mobile?: boolean;
}

export interface WeatherItem {
	type?: string;
	id?: number;
	entity_id?: string;
	state?: string;
	icon_pack?: string;
	sensor?: string;
	icon?: string;
	show_apparent?: boolean;
	hide_mobile?: boolean;
}

export interface WeatherForecastItem {
	type?: string;
	id?: number;
	entity_id?: string;
	state?: string;
	icon_pack?: string;
	days_to_show?: number;
	hide_mobile?: boolean;
}

export interface MyDayItem {
	type?: string;
	id?: number;
	weather_entity?: string;
	hide_prayer?: boolean;
	hide_persons?: boolean;
	hide_calendar?: boolean;
	hide_mobile?: boolean;
}

export interface YandexWeatherItem {
	type?: string;
	id?: number;
	entity_id?: string;
	show_apparent?: boolean;
	show_pressure?: boolean;
	hide_mobile?: boolean;
}

export interface YouTubeEvent {
	message: 'auth-pending' | 'auth' | 'update-credentials' | 'auth-error' | 'error';
	verification_url?: string;
	user_code?: string;
	timestamp?: number;
	error?: any;
}

export type KonvaMode = 'default' | 'pan' | 'zoom';

export interface KonvaImageCache {
	[selId: string]: {
		[id: string]: HTMLImageElement;
	};
}

export interface KonvaHistory {
	elements: Konva.Node[];
	selectedShapes: string[];
}

export interface KonvaStore {
	children: Konva.Node[];
	selectedShapes: ShapeConfig[];
	mode: KonvaMode;
	undoStack: KonvaHistory[];
	redoStack: KonvaHistory[];
}
