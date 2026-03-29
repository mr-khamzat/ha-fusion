<script lang="ts">
	import { connection, states } from '$lib/Stores';
	import { callService } from 'home-assistant-js-websocket';
	import { writable } from 'svelte/store';
	import { fade, scale } from 'svelte/transition';
	import { onDestroy } from 'svelte';

	/** Prop to control visibility from parent */
	export let active = false;

	/** Store that other components can import and set to true */
	export const voiceActive = writable(false);

	/** Exported function that other components can call */
	export function activate() {
		active = true;
	}

	// Keep active and voiceActive in sync
	$: if ($voiceActive && !active) active = true;
	$: voiceActive.set(active);

	let transcript = '';
	let interimTranscript = '';
	let resultMessage = '';
	let listening = false;

	type SpeechRecognitionInstance = {
		continuous: boolean;
		lang: string;
		interimResults: boolean;
		start: () => void;
		stop: () => void;
		abort: () => void;
		onresult: ((event: any) => void) | null;
		onerror: ((event: any) => void) | null;
		onend: (() => void) | null;
	};

	let recognition: SpeechRecognitionInstance | null = null;

	function buildRecognition(): SpeechRecognitionInstance | null {
		if (typeof window === 'undefined') return null;
		const SR =
			(window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
		if (!SR) return null;
		const r = new SR() as SpeechRecognitionInstance;
		r.continuous = false;
		r.lang = 'ru-RU';
		r.interimResults = true;
		return r;
	}

	function startListening() {
		transcript = '';
		interimTranscript = '';
		resultMessage = '';

		recognition = buildRecognition();
		if (!recognition) {
			resultMessage = '\u0420\u0435\u0447\u044C \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u0432 \u044D\u0442\u043E\u043C \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0435';
			return;
		}

		recognition.onresult = (event: any) => {
			let final = '';
			let interim = '';
			for (let i = event.resultIndex; i < event.results.length; i++) {
				const text: string = event.results[i][0].transcript;
				if (event.results[i].isFinal) {
					final += text;
				} else {
					interim += text;
				}
			}
			if (final) {
				transcript = final.trim();
				processCommand(transcript);
			}
			interimTranscript = interim;
		};

		recognition.onerror = (event: any) => {
			if (event.error !== 'no-speech') {
				resultMessage = '\u041E\u0448\u0438\u0431\u043A\u0430: ' + event.error;
			}
			listening = false;
		};

		recognition.onend = () => {
			listening = false;
		};

		recognition.start();
		listening = true;
	}

	function stopListening() {
		recognition?.stop();
		listening = false;
	}

	function close() {
		stopListening();
		active = false;
		transcript = '';
		interimTranscript = '';
		resultMessage = '';
	}

	function processCommand(cmd: string) {
		if (!$connection || !$states) {
			resultMessage = '\u041D\u0435\u0442 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F \u043A Home Assistant';
			scheduleClose();
			return;
		}

		const lower = cmd.toLowerCase();

		// "включи ..." → turn_on
		const turnOnMatch = lower.match(/^(?:\u0432\u043A\u043B\u044E\u0447\u0438|\u0432\u043A\u043B\u044E\u0447\u0438\u0442\u044C)\s+(.+)/);
		// "выключи ..." → turn_off
		const turnOffMatch = lower.match(/^(?:\u0432\u044B\u043A\u043B\u044E\u0447\u0438|\u0432\u044B\u043A\u043B\u044E\u0447\u0438\u0442\u044C)\s+(.+)/);
		// "свет включи / свет выключи"
		const lightOnMatch = lower.match(/\u0441\u0432\u0435\u0442\s+(?:\u0432\u043A\u043B\u044E\u0447\u0438|on)/);
		const lightOffMatch = lower.match(/\u0441\u0432\u0435\u0442\s+(?:\u0432\u044B\u043A\u043B\u044E\u0447\u0438|off)/);

		if (lightOnMatch) {
			callService($connection, 'light', 'turn_on', {});
			resultMessage = '\u0421\u0432\u0435\u0442 \u0432\u043A\u043B\u044E\u0447\u0451\u043D';
			scheduleClose();
			return;
		}

		if (lightOffMatch) {
			callService($connection, 'light', 'turn_off', {});
			resultMessage = '\u0421\u0432\u0435\u0442 \u0432\u044B\u043A\u043B\u044E\u0447\u0451\u043D';
			scheduleClose();
			return;
		}

		if (turnOnMatch || turnOffMatch) {
			const targetName = (turnOnMatch?.[1] || turnOffMatch?.[1] || '').trim();
			const service = turnOnMatch ? 'turn_on' : 'turn_off';
			const entity = findEntityByName(targetName);

			if (entity) {
				const domain = entity.entity_id.split('.')[0];
				callService($connection, domain, service, { entity_id: entity.entity_id });
				resultMessage = `${service === 'turn_on' ? '\u0412\u043A\u043B\u044E\u0447\u0435\u043D\u043E' : '\u0412\u044B\u043A\u043B\u044E\u0447\u0435\u043D\u043E'}: ${
					entity.attributes?.friendly_name || entity.entity_id
				}`;
			} else {
				resultMessage = `\u0423\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u043E \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E: \u00AB${targetName}\u00BB`;
			}
			scheduleClose();
			return;
		}

		resultMessage = '\u041A\u043E\u043C\u0430\u043D\u0434\u0430 \u043D\u0435 \u0440\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u043D\u0430';
		scheduleClose();
	}

	function findEntityByName(name: string) {
		if (!$states) return null;
		const lower = name.toLowerCase();
		return (
			Object.values($states).find((e) => {
				const friendly = (e.attributes?.friendly_name as string | undefined)?.toLowerCase() || '';
				return friendly.includes(lower) || e.entity_id.toLowerCase().includes(lower);
			}) || null
		);
	}

	let closeTimer: ReturnType<typeof setTimeout>;
	function scheduleClose() {
		clearTimeout(closeTimer);
		closeTimer = setTimeout(() => {
			close();
		}, 2200);
	}

	$: if (active) {
		startListening();
	}

	onDestroy(() => {
		clearTimeout(closeTimer);
		recognition?.abort();
	});
</script>

{#if active}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="overlay" transition:fade={{ duration: 200 }} on:click={close}>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="panel" transition:scale={{ duration: 220, start: 0.9 }} on:click|stopPropagation>
			<!-- close button -->
			<button class="close-btn" on:click={close} aria-label="Close voice control">&#x2715;</button>

			<!-- mic icon -->
			<div class="mic-wrap" class:pulsing={listening}>
				<svg
					viewBox="0 0 24 24"
					class="mic-icon"
					xmlns="http://www.w3.org/2000/svg"
					aria-hidden="true"
				>
					<path
						d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
						fill="currentColor"
					/>
					<path
						d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z"
						fill="currentColor"
					/>
				</svg>
			</div>

			<!-- prompt -->
			<p class="prompt">
				{#if resultMessage}
					{resultMessage}
				{:else if listening}
					\u0413\u043E\u0432\u043E\u0440\u0438\u0442\u0435&hellip;
				{:else}
					\u0418\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044F&hellip;
				{/if}
			</p>

			<!-- transcript display -->
			{#if transcript || interimTranscript}
				<div class="transcript">
					{#if transcript}
						<span class="final">{transcript}</span>
					{/if}
					{#if interimTranscript}
						<span class="interim">{interimTranscript}</span>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 9000;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.panel {
		position: relative;
		background: rgba(18, 18, 24, 0.95);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1.5rem;
		padding: 2.5rem 2rem 2rem;
		width: min(22rem, 90vw);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.close-btn {
		position: absolute;
		top: 0.75rem;
		right: 0.85rem;
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.45);
		font-size: 1rem;
		cursor: pointer;
		line-height: 1;
		padding: 0.2rem 0.4rem;
	}

	.close-btn:hover {
		color: rgba(255, 255, 255, 0.8);
	}

	.mic-wrap {
		width: 5rem;
		height: 5rem;
		border-radius: 50%;
		background: rgba(96, 165, 250, 0.12);
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2px solid rgba(96, 165, 250, 0.35);
		transition: box-shadow 0.3s ease;
	}

	.mic-wrap.pulsing {
		animation: mic-pulse 1.2s ease-in-out infinite;
	}

	@keyframes mic-pulse {
		0%,
		100% {
			box-shadow: 0 0 0 0 rgba(96, 165, 250, 0.35);
		}
		50% {
			box-shadow: 0 0 0 12px rgba(96, 165, 250, 0);
		}
	}

	.mic-icon {
		width: 2.2rem;
		height: 2.2rem;
		color: rgba(96, 165, 250, 0.9);
	}

	.prompt {
		margin: 0;
		font-size: 1rem;
		color: rgba(255, 255, 255, 0.75);
		text-align: center;
		min-height: 1.4em;
	}

	.transcript {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 0.6rem;
		padding: 0.5rem 0.75rem;
		font-size: 0.85rem;
		text-align: center;
		width: 100%;
		box-sizing: border-box;
		min-height: 2.2rem;
		line-height: 1.4;
	}

	.final {
		color: rgba(255, 255, 255, 0.9);
	}

	.interim {
		color: rgba(255, 255, 255, 0.45);
		font-style: italic;
	}
</style>
