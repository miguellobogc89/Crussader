type DeepgramClientOptions = {
  onFinalTranscript?: (text: string) => void;
};

export function createDeepgramClient(opts?: DeepgramClientOptions) {
  let socket: WebSocket | null = null;
  let mediaStream: MediaStream | null = null;
  let audioContext: AudioContext | null = null;
  let processor: ScriptProcessorNode | null = null;

  const start = async () => {
    try {
      console.log("[🎙️ Deepgram] Conectando al proxy...");

      // ✅ Conectamos al proxy en el backend
      const ws = new WebSocket("ws://127.0.0.1:8787");
      socket = ws;

      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      ws.onopen = () => {
        console.log("[✅ Deepgram] WebSocket (proxy) conectado");

        audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(mediaStream!);
        processor = audioContext.createScriptProcessor(4096, 1, 1);

        source.connect(processor);
        processor.connect(audioContext.destination);

        processor.onaudioprocess = (event) => {
          const input = event.inputBuffer.getChannelData(0);
          const buffer = new Int16Array(input.length);
          for (let i = 0; i < input.length; i++) {
            buffer[i] = Math.max(-1, Math.min(1, input[i])) * 0x7fff;
          }
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(buffer.buffer);
          }
        };
      };

      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          const transcript = data.channel?.alternatives?.[0]?.transcript || "";
          const isFinal = data.is_final;

          if (isFinal && transcript && opts?.onFinalTranscript) {
            console.log("[📥 Deepgram] Transcripción final:", transcript);
            opts.onFinalTranscript(transcript);
          }
        } catch (e) {
          console.error("[❌ Deepgram] Error procesando mensaje:", e);
        }
      };

      ws.onerror = (err) => {
        console.error("[❌ Deepgram] WebSocket error:", err);
      };
    } catch (err) {
      console.error("[❌ Deepgram] Error iniciando:", err);
    }
  };

  const stop = () => {
    try {
      console.log("[🛑 Deepgram] Cerrando conexión");
      socket?.close();
      mediaStream?.getTracks().forEach((t) => t.stop());
      processor?.disconnect();
      audioContext?.close();
    } catch (err) {
      console.error("[❌ Deepgram] Error al cerrar:", err);
    }
  };

  return { start, stop };
}
