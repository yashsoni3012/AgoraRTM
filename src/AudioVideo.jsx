


import { useEffect, useRef, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";

const APP_ID = "aacc38a143f04f4a95f3182c502ce32f";
const TOKEN_API = "https://celebstalks.pythonanywhere.com/abcd/";

export default function RtcCall() {
  const clientRef = useRef(null);
  const localVideoRef = useRef(null);
  const localTracksRef = useRef([]);

  const [senderId, setSenderId] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [callType, setCallType] = useState("video");

  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    clientRef.current = AgoraRTC.createClient({
      mode: "rtc",
      codec: "vp8",
    });

    const client = clientRef.current;

    client.on("user-published", async (user, mediaType) => {
      await client.subscribe(user, mediaType);

      if (mediaType === "video") {
        let remotePlayer = document.getElementById(`remote-${user.uid}`);
        if (!remotePlayer) {
          remotePlayer = document.createElement("div");
          remotePlayer.id = `remote-${user.uid}`;
          remotePlayer.style.width = "300px";
          remotePlayer.style.height = "200px";
          remotePlayer.style.background = "#000";
          remotePlayer.style.marginTop = "10px";
          document.getElementById("remote-container").append(remotePlayer);
        }
        user.videoTrack.play(remotePlayer);
      }

      if (mediaType === "audio") {
        user.audioTrack.play();
      }
    });

    client.on("user-unpublished", (user) => {
      document.getElementById(`remote-${user.uid}`)?.remove();
    });

    client.on("user-left", (user) => {
      document.getElementById(`remote-${user.uid}`)?.remove();
    });

    return () => {
      leaveCall();
    };
  }, []);

  const joinCall = async () => {
    if (!senderId || !receiverId) {
      alert("Sender ID and Receiver ID required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(TOKEN_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: Number(senderId),
          receiver_id: Number(receiverId),
          call_type: callType,
        }),
      });

      const data = await res.json();
      console.log("TOKEN DATA:", data);
      const { channel, token, id } = data;

      const client = clientRef.current;

      await client.join(APP_ID, channel, token, Number(id));

      if (callType === "video") {
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        const videoTrack = await AgoraRTC.createCameraVideoTrack();
        localTracksRef.current = [audioTrack, videoTrack];
        videoTrack.play(localVideoRef.current);
        await client.publish(localTracksRef.current);
      } else {
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        localTracksRef.current = [audioTrack];
        await client.publish(audioTrack);
      }

      setJoined(true);
    } catch (err) {
      console.error("Join failed", err);
      alert("Failed to join call");
    }
    setLoading(false);
  };

  const leaveCall = async () => {
    const client = clientRef.current;
    if (!client) return;

    for (const track of localTracksRef.current) {
      track.stop();
      track.close();
    }

    localTracksRef.current = [];

    await client.leave();
    setJoined(false);

    document.getElementById("remote-container").innerHTML = "";
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Agora RTC Call</h2>

      {!joined && (
        <>
          <div style={{ marginBottom: 10 }}>
            <input
              type="number"
              placeholder="Sender ID (INT)"
              value={senderId}
              onChange={(e) => setSenderId(e.target.value)}
              style={{ marginRight: 10 }}
            />

            <input
              type="number"
              placeholder="Receiver ID (INT)"
              value={receiverId}
              onChange={(e) => setReceiverId(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <select
              value={callType}
              onChange={(e) => setCallType(e.target.value)}
            >
              <option value="video">Video Call</option>
              <option value="audio">Audio Call</option>
            </select>

            <button
              onClick={joinCall}
              disabled={loading}
              style={{ marginLeft: 10 }}
            >
              {loading ? "Joining..." : "Start Call"}
            </button>
          </div>
        </>
      )}

      {joined && (
        <button onClick={leaveCall} style={{ marginBottom: 10 }}>
          End Call
        </button>
      )}

      {callType === "video" && (
        <div
          ref={localVideoRef}
          style={{
            width: 300,
            height: 200,
            background: "#000",
            marginTop: 10,
          }}
        />
      )}

      <div id="remote-container" />
    </div>
  );
}
