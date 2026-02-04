import { useEffect, useRef, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";

const APP_ID = "aacc38a143f04f4a95f3182c502ce32f";
const TOKEN_API = "https://celebstalks.pythonanywhere.com/chat/";

export default function RtcCall() {
  const clientRef = useRef(null);
  const localVideoRef = useRef(null);
  const localTracksRef = useRef({ audio: null, video: null });

  const [senderId, setSenderId] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [callType, setCallType] = useState("video");
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    clientRef.current = client;

    // 🔴 REMOTE USER PUBLISHED
    client.on("user-published", async (user, mediaType) => {
      await client.subscribe(user, mediaType);

      if (mediaType === "video") {
        const remoteContainer = document.createElement("div");
        remoteContainer.id = `remote-${user.uid}`;
        remoteContainer.style.width = "300px";
        remoteContainer.style.height = "200px";
        remoteContainer.style.background = "#000";
        remoteContainer.style.marginTop = "10px";

        document
          .getElementById("remote-container")
          .appendChild(remoteContainer);

        user.videoTrack.play(remoteContainer);
      }

      if (mediaType === "audio") {
        user.audioTrack.play();
      }
    });

    // 🔴 REMOTE USER LEFT
    client.on("user-left", (user) => {
      document.getElementById(`remote-${user.uid}`)?.remove();
    });

    return () => leaveCall();
  }, []);

  const joinCall = async () => {
    if (!senderId || !receiverId) return alert("IDs required");

    const res = await fetch(TOKEN_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender_id: Number(senderId),
        receiver_id: Number(receiverId),
        call_type: callType,
      }),
    });

    const { channel, token, id } = await res.json();

    const client = clientRef.current;
    await client.join(APP_ID, channel, token, Number(id));

    // 🟢 LOCAL TRACKS
    const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    localTracksRef.current.audio = audioTrack;

    if (callType === "video") {
      const videoTrack = await AgoraRTC.createCameraVideoTrack();
      localTracksRef.current.video = videoTrack;

      videoTrack.play(localVideoRef.current);
      await client.publish([audioTrack, videoTrack]);
    } else {
      await client.publish(audioTrack);
    }

    setJoined(true);
  };

  const leaveCall = async () => {
    const client = clientRef.current;
    if (!client) return;

    Object.values(localTracksRef.current).forEach((track) => {
      if (track) {
        track.stop();
        track.close();
      }
    });

    await client.leave();
    localTracksRef.current = { audio: null, video: null };
    setJoined(false);

    document.getElementById("remote-container").innerHTML = "";
  };

  return (
    <div style={{ padding: 20 }}>
      <h3>Agora RTC Video Call</h3>

      {!joined && (
        <>
          <input
            placeholder="Sender ID"
            value={senderId}
            onChange={(e) => setSenderId(e.target.value)}
          />
          <input
            placeholder="Receiver ID"
            value={receiverId}
            onChange={(e) => setReceiverId(e.target.value)}
            style={{ marginLeft: 10 }}
          />
          <button onClick={joinCall} style={{ marginLeft: 10 }}>
            Start Call
          </button>
        </>
      )}

      {joined && <button onClick={leaveCall}>End Call</button>}

      {/* 🟢 LOCAL VIDEO */}
      <div
        ref={localVideoRef}
        id="local-player"
        style={{
          width: 300,
          height: 200,
          background: "#000",
          marginTop: 10,
        }}
      />

      {/* 🔵 REMOTE VIDEO */}
      <div id="remote-container" />
    </div>
  );
}
