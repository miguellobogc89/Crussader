
import { useEffect, useRef } from "react";

type RealtimeOpts = {
  onFinalTranscript?: (text: string) => void;
};

export function useDeepgramRealtime(opts?: RealtimeOpts) {
  const socketRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const socket = new WebSocket("wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=16000");
      socketRef.current = socket;

      socket.onopen = () => {
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);

        source.connect(processor);
        processor.connect(audioContext.destination);

        processor.onaudioprocess = (event) => {
          const inputData = event.inputBuffer.getChannelData(0);
          const int16Data = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            int16Data[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7fff;
          }
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(int16Data.buffer);
          }
        };

        socket.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            const transcript = data.channel?.alternatives?.[0]?.transcript || "";
            const isFinal = data.is_final;
            if (isFinal && transcript && opts?.onFinalTranscript) {
              opts.onFinalTranscript(transcript);
            }
          } catch {}
        };
      };

      socket.onerror = (err) => {
        console.error("Deepgram WebSocket error:", err);
      };
    } catch (err) {
      console.error("Deepgram start error:", err);
    }
  };

  const stop = () => {
    try {
      socketRef.current?.close();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    } catch (err) {
      console.error("Deepgram stop error:", err);
    }
  };

  useEffect(() => {
    return () => stop();
  }, []);

  return { start, stop };
}
