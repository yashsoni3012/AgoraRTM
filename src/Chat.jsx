import { useState, useRef } from "react";
import AgoraRTM from "agora-rtm-sdk";

const APP_ID = "5a6591e3ec6b438f9095dfbf7add91ce"; // SAME AS BACKEND
const TOKEN_API = "https://celebstalks.pythonanywhere.com/chat/"; // Django API

export default function App() {
  const clientRef = useRef(null);

  const [username, setUsername] = useState("");
  const [peer, setPeer] = useState("");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [loggedIn, setLoggedIn] = useState(false);

  const addMessage = (msg) => {
    setMessages((prev) => [...prev, msg]);
  };

  // 🔐 LOGIN
  const login = async () => {
    if (!username) {
      alert("Enter username");
      return;
    }

    try {
      // 1️⃣ Get RTM token from Django
      const res = await fetch(TOKEN_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();
      const token = data.chat_token;

      console.log("RTM TOKEN LENGTH:", token?.length);

      // 2️⃣ Create RTM client
      const client = AgoraRTM.createInstance(APP_ID);
      clientRef.current = client;

      // 3️⃣ Connection state
      client.on("ConnectionStateChanged", (state, reason) => {
        console.log("RTM STATE:", state, reason);

        if (state === "DISCONNECTED") {
          addMessage("⚠️ Disconnected from Agora");
        }

        if (state === "ABORTED") {
          addMessage("❌ Logged out (token expired or logged elsewhere)");
          setLoggedIn(false);
        }
      });

      // 4️⃣ Receive messages
      client.on("MessageFromPeer", (message, peerId) => {
        addMessage(`${peerId}: ${message.text}`);
      });

      // 5️⃣ Login
      await client.login({
        uid: username, // MUST match backend token UID
        token: token,
      });

      setLoggedIn(true);
      addMessage(`✅ Logged in as ${username}`);
    } catch (err) {
      console.error(err);
      alert("Login failed");
    }
  };

  // 📩 SEND MESSAGE
  const sendMessage = async () => {
    if (!peer || !text) {
      alert("Enter peer username and message");
      return;
    }

    try {
      await clientRef.current.sendMessageToPeer({ text }, peer);
      addMessage(`Me → ${peer}: ${text}`);
      setText("");
    } catch (err) {
      console.error(err);
      alert("Send failed");
    }
  };

  // 🚪 LOGOUT
  const logout = async () => {
    if (clientRef.current) {
      await clientRef.current.logout();
      clientRef.current = null;
    }
    setLoggedIn(false);
    setMessages([]);
  };

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", fontFamily: "Arial" }}>
      <h2>Agora RTM Chat</h2>

      {!loggedIn && (
        <>
          <input
            placeholder="Your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button onClick={login} style={{ marginLeft: 10 }}>
            Login
          </button>
        </>
      )}

      {loggedIn && (
        <>
          <p>
            Logged in as <b>{username}</b>
          </p>

          <input
            placeholder="Send to username"
            value={peer}
            onChange={(e) => setPeer(e.target.value)}
          />

          <input
            placeholder="Message"
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ marginLeft: 10 }}
          />

          <div style={{ marginTop: 10 }}>
            <button onClick={sendMessage}>Send</button>
            <button onClick={logout} style={{ marginLeft: 10 }}>
              Logout
            </button>
          </div>
        </>
      )}

      <div
        style={{
          marginTop: 15,
          border: "1px solid #ccc",
          padding: 10,
          height: 250,
          overflowY: "auto",
        }}
      >
        {messages.map((m, i) => (
          <div key={i}>{m}</div>
        ))}
      </div>
    </div>
  );
}