import { useEffect, useRef, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";

const APP_ID = "aacc38a143f04f4a95f3182c502ce32f";
const TOKEN_API = "https://celebstalks.pythonanywhere.com/abcd/";

export default function AudioCall() {
  const clientRef = useRef(null);
  const localAudioRef = useRef(null);

  const [senderId, setSenderId] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    clientRef.current = client;

    // 🔊 REMOTE USER AUDIO
    client.on("user-published", async (user, mediaType) => {
      await client.subscribe(user, mediaType);

      if (mediaType === "audio") {
        user.audioTrack.play(); // 🔥 no DOM needed
      }
    });

    client.on("user-left", (user) => {
      console.log("User left:", user.uid);
    });

    return () => leaveCall();
  }, []);

  const joinCall = async () => {
    if (!senderId || !receiverId) {
      alert("Sender and Receiver ID required");
      return;
    }

    try {
      const res = await fetch(TOKEN_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: Number(senderId),
          receiver_id: Number(receiverId),
          call_type: "audio",
        }),
      });

      const data = await res.json();
      const { channel, token, id } = data;

      const client = clientRef.current;

      await client.join(
        APP_ID,
        channel,
        token,
        Number(id) // MUST match backend UID
      );

      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      localAudioRef.current = audioTrack;

      await client.publish(audioTrack);
      setJoined(true);
    } catch (err) {
      console.error("Audio join failed", err);
      alert("Failed to join audio call");
    }
  };

  const leaveCall = async () => {
    if (localAudioRef.current) {
      localAudioRef.current.stop();
      localAudioRef.current.close();
      localAudioRef.current = null;
    }

    if (clientRef.current) {
      await clientRef.current.leave();
    }

    setJoined(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h3>Agora Audio Call</h3>

      {!joined && (
        <>
          <input
            type="number"
            placeholder="Your ID"
            value={senderId}
            onChange={(e) => setSenderId(e.target.value)}
          />

          <input
            type="number"
            placeholder="Receiver ID"
            value={receiverId}
            onChange={(e) => setReceiverId(e.target.value)}
            style={{ marginLeft: 10 }}
          />

          <button onClick={joinCall} style={{ marginLeft: 10 }}>
            Start Audio Call
          </button>
        </>
      )}

      {joined && <button onClick={leaveCall}>End Call</button>}
    </div>
  );
}
