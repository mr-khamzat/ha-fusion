<script lang="ts">
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';

	/** 1 = least sensitive (requires large motion), 10 = most sensitive */
	export let sensitivity: number = 5;
	/** Set to false to pause detection without destroying the component */
	export let active: boolean = true;

	const dispatch = createEventDispatcher<{ motion: { strength: number } }>();

	// Capture at low resolution for performance
	const W = 80;
	const H = 60;

	let stream: MediaStream | null = null;
	let video: HTMLVideoElement | null = null;
	let canvas: HTMLCanvasElement | null = null;
	let ctx: CanvasRenderingContext2D | null = null;
	let prevPixels: Uint8ClampedArray | null = null;
	let rafId: number | null = null;
	let tickTimer: ReturnType<typeof setTimeout> | null = null;
	let running = false;

	// sensitivity 1-10 → avgDiff threshold (higher sensitivity = lower threshold)
	$: threshold = 32 - (sensitivity - 1) * 2.8; // ~32 at sens=1, ~7 at sens=10

	export let permitted = false;
	export let cameraError = '';

	onMount(async () => {
		canvas = document.createElement('canvas');
		canvas.width = W;
		canvas.height = H;
		ctx = canvas.getContext('2d', { willReadFrequently: true });

		video = document.createElement('video');
		video.playsInline = true;
		video.muted = true;

		try {
			stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 240 } },
				audio: false
			});
			video.srcObject = stream;
			await video.play();
			permitted = true;
			running = true;
			scheduleTick();
		} catch {
			cameraError = 'Нет доступа к камере устройства';
		}
	});

	onDestroy(() => {
		running = false;
		if (tickTimer) clearTimeout(tickTimer);
		if (rafId) cancelAnimationFrame(rafId);
		stream?.getTracks().forEach((t) => t.stop());
	});

	function scheduleTick() {
		if (!running) return;
		// ~5 fps
		tickTimer = setTimeout(() => {
			rafId = requestAnimationFrame(tick);
		}, 200);
	}

	function tick() {
		if (!running || !active || !ctx || !video || !canvas) {
			scheduleTick();
			return;
		}

		try {
			ctx.drawImage(video, 0, 0, W, H);
			const frame = ctx.getImageData(0, 0, W, H).data;

			if (prevPixels) {
				let diff = 0;
				// Check every 4th pixel (R channel only) for speed
				for (let i = 0; i < frame.length; i += 16) {
					diff += Math.abs(frame[i] - prevPixels[i]);
				}
				const avgDiff = (diff / (frame.length / 16)) * 3; // approx scale

				if (avgDiff > threshold) {
					dispatch('motion', { strength: avgDiff });
				}
			}

			prevPixels = frame;
		} catch {
			// video not ready yet
		}

		scheduleTick();
	}
</script>
