import type { TimerSound } from "../timer/types";

export const stopTimerSound = (
    alarmAudioRef: React.RefObject<HTMLAudioElement | null>,
    alarmContextRef: React.RefObject<AudioContext | null>,
    alarmTimerRef: React.RefObject<number | null>
) => {
    // 사용자 음원 중지
    if (alarmAudioRef.current) {
        alarmAudioRef.current.pause();
        alarmAudioRef.current.currentTime = 0;
        alarmAudioRef.current = null;
    }

    // 기본 알림음 중지
    if (alarmContextRef.current) {
        alarmContextRef.current.close();
        alarmContextRef.current = null;
    }

    // 반복 타이머 제거
    if (alarmTimerRef.current !== null) {
        window.clearTimeout(alarmTimerRef.current);
        alarmTimerRef.current = null;
    }
};

export const playTimerSound = (
    alarmVolume: number,
    alarmAudioRef: React.RefObject<HTMLAudioElement | null>,
    alarmContextRef: React.RefObject<AudioContext | null>,
    alarmTimerRef: React.RefObject<number | null>,
    sound: TimerSound,
    customSound?: string
) => {
    stopTimerSound(alarmAudioRef, alarmContextRef, alarmTimerRef);

    if (sound === "custom" && customSound) {
        const audio = new Audio(customSound);

        audio.volume = alarmVolume / 100;
        audio.loop = true;

        alarmAudioRef.current = audio;

        audio.play().catch((error) => {
            console.error(
                "사용자 알림음 재생 실패:",
                error
            );
        });

        alarmTimerRef.current = window.setTimeout(() => {
            stopTimerSound(alarmAudioRef, alarmContextRef, alarmTimerRef);
        }, 30_000);

        return;
    }

    // =========================
    // 기본 알림음
    // =========================
    const AudioContext =
        window.AudioContext ||
        (
            window as typeof window & {
                webkitAudioContext?: typeof window.AudioContext;
            }
        ).webkitAudioContext;

    if (!AudioContext) {
        return;
    }

    const context = new AudioContext();

    alarmContextRef.current = context;

    const playTone = (
        frequency: number,
        duration: number,
        startTime: number
    ) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();

        oscillator.frequency.value = frequency;
        oscillator.type = "sine";

        gain.gain.setValueAtTime(
            0,
            context.currentTime + startTime
        );

        gain.gain.linearRampToValueAtTime(
            0.25 * (alarmVolume / 100),
            context.currentTime +
                startTime +
                0.01
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            context.currentTime +
                startTime +
                duration
        );

        oscillator.connect(gain);
        gain.connect(context.destination);

        oscillator.start(
            context.currentTime + startTime
        );

        oscillator.stop(
            context.currentTime +
                startTime +
                duration
        );
    };

    const playPattern = () => {
        if (!alarmContextRef.current) {
            return;
        }

        if (sound === "bell") {
            playTone(880, 0.8, 0);
            playTone(1320, 0.8, 0.08);
            playTone(1760, 1.0, 0.16);
        }

        if (sound === "beep") {
            playTone(880, 0.25, 0);
            playTone(880, 0.25, 0.35);
            playTone(880, 0.25, 0.7);
        }

        if (sound === "digital") {
            playTone(1200, 0.12, 0);
            playTone(800, 0.12, 0.18);
            playTone(1200, 0.12, 0.36);
            playTone(800, 0.25, 0.54);
        }
    };

    playPattern();

    // 약 1.5초마다 알림음 반복
    const repeat = () => {
        if (!alarmContextRef.current) {
            return;
        }

        playPattern();

        alarmTimerRef.current = window.setTimeout(
            repeat,
            1500
        );
    };

    alarmTimerRef.current = window.setTimeout(
        repeat,
        1500
    );

    // 최대 30초 후 자동 종료
    window.setTimeout(() => {
            stopTimerSound(alarmAudioRef, alarmContextRef, alarmTimerRef);
    }, 30_000);
};