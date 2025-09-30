// hooks/useMicTest.ts
import { useCallback, useEffect, useRef, useState } from "react";

type UseMicTestOptions = {
  getWsUrl: () => Promise<string>; // Devuelve URL firmada de Deepgram
  onFinal?: (text: string) => void; // Texto final transcrito
};

export function useMicTest({ getWsUrl, onFinal }: UseMicTestOptions) {
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState("");
  const [micLevel, setMicLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const cleanup = () => {
    wsRef.current?.close(1000);
    mediaStreamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close();

    cancelAnimationFrame(rafRef.current!);

    mediaStreamRef.current = null;
    audioCtxRef.current = null;
    analyserRef.current = null;
    rafRef.current = null;

    setListening(false);
    setPartial("");
  };

  const updateMicLevel = () => {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteTimeDomainData(data);
    const rms = Math.sqrt(data.reduce((sum, val) => {
      const norm = val / 128 - 1;
      return sum + norm * norm;
    }, 0) / data.length);

    setMicLevel(rms);
    rafRef.current = requestAnimationFrame(updateMicLevel);
  };

  const start = useCallback(async () => {
    try {
      cleanup();
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      // Nivel de micrófono
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyserRef.current = analyser;
      source.connect(analyser);

      updateMicLevel();

      // WebSocket Deepgram
      const url = await getWsUrl();
      const ws = new WebSocket(url);
      wsRef.current = ws;

      const mimeType = "audio/webm;codecs=opus";
      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(e.data);
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type !== "Results") return;

          const alt = msg.channel?.alternatives?.[0];
          const transcript = alt?.transcript ?? "";

          if (msg.is_final === false) {
            setPartial(transcript);
          } else {
            setPartial("");
            if (transcript) onFinal?.(transcript);
          }
        } catch {}
      };

      ws.onerror = () => setError("Error de conexión STT");
      ws.onclose = (ev) => {
        if (ev.code !== 1000) setError(`WebSocket cerrado: ${ev.code}`);
      };

      ws.onopen = () => {
        recorder.start(250);
        setListening(true);
      };
    } catch (err) {
      setError("No se pudo acceder al micrófono");
    }
  }, [getWsUrl, onFinal]);

  const stop = useCallback(() => {
    cleanup();
  }, []);

  useEffect(() => {
    return () => stop(); // limpieza al desmontar
  }, [stop]);

  return {
    listening,
    partial,
    micLevel,
    error,
    start,
    stop,
  };
}
