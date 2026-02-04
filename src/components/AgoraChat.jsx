// import { useRef, useState } from "react";
// import AgoraRTM from "agora-rtm-sdk";

// const APP_ID = "5a6591e3ec6b438f9095dfbf7add91ce";
// const TOKEN_API = "https://celebstalks.pythonanywhere.com/chat/";

// export default function AgoraChat() {
//   const [username, setUsername] = useState("");
//   const [peer, setPeer] = useState("");
//   const [text, setText] = useState("");
//   const [loggedIn, setLoggedIn] = useState(false);
//   const [messages, setMessages] = useState([]);
//   const [connectionStatus, setConnectionStatus] = useState("Disconnected");

//   const clientRef = useRef(null);

//   const addMessage = (msg) => {
//     setMessages((prev) => [...prev, msg]);
//   };

//   const login = async () => {
//     if (!username) {
//       alert("Enter username");
//       return;
//     }

//     try {
//       addMessage("🔄 Connecting to Agora RTM...");
//       setConnectionStatus("Connecting");

//       // 1️⃣ Get token
//       const res = await fetch(TOKEN_API, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ username })
//       });

//       if (!res.ok) {
//         throw new Error(`Token API failed: ${res.status}`);
//       }

//       const data = await res.json();
//       const token = data.chat_token;
//       console.log("Token received:", token ? "Yes" : "No");

//       // 2️⃣ Create RTM client WITH CLOUD PROXY
//       const client = AgoraRTM.createInstance(APP_ID, {
//         cloudProxy: true, // ✅ CRITICAL: Forces connection via port 443
//         enableLogUpload: true,
//         logFilter: AgoraRTM.LOG_FILTER_ERROR // Show only errors in console
//       });
//       clientRef.current = client;

//       // 3️⃣ Connection State Monitoring
//       client.on("ConnectionStateChanged", (newState, reason) => {
//         console.log("RTM State:", newState, "Reason:", reason);
//         setConnectionStatus(`${newState} (${reason})`);
        
//         if (newState === "CONNECTED") {
//           addMessage("✅ Connected to Agora RTM service");
//         } else if (newState === "DISCONNECTED") {
//           addMessage(`⚠️ Disconnected: ${reason}`);
//           if (reason === "LOGIN_TIMEOUT") {
//             addMessage("⏱️ Login timeout - network may be blocking RTM ports");
//           }
//         }
//       });

//       // 4️⃣ Listen for messages
//       client.on("MessageFromPeer", (message, peerId) => {
//         addMessage(`${peerId}: ${message.text}`);
//       });

//       // 5️⃣ Login with token
//       console.log("Attempting login with uid:", username);
//       await client.login({ 
//         uid: username, 
//         token: token // Use the actual token
//       });

//       addMessage(`✅ Logged in as ${username}`);
//       setLoggedIn(true);
//       setConnectionStatus("Connected");

//     } catch (err) {
//       console.error("Login error details:", err);
      
//       // Handle specific error codes
//       if (err.code === -10011) { // LOGIN_TIMEOUT
//         addMessage("❌ Login timeout - network/firewall issue");
//         alert("Login failed: Network timeout. Check firewall settings.");
//       } else if (err.code === -10005) { // INVALID_APP_ID
//         addMessage("❌ Invalid App ID");
//         alert("Check your APP_ID is correct and RTM is enabled in console");
//       } else {
//         addMessage(`❌ Login failed: ${err.message || "Unknown error"}`);
//         alert(`Login failed: ${err.message || "Unknown error"}`);
//       }
      
//       setConnectionStatus("Failed");
//     }
//   };

//   const sendMessage = async () => {
//     if (!peer || !text) {
//       alert("Peer & message required");
//       return;
//     }

//     try {
//       await clientRef.current.sendMessageToPeer({ text }, peer);
//       addMessage(`You → ${peer}: ${text}`);
//       setText("");
//     } catch (err) {
//       console.error("Send error:", err);
//       addMessage(`❌ Failed to send: ${err.message}`);
//     }
//   };

//   const logout = async () => {
//     if (clientRef.current) {
//       try {
//         await clientRef.current.logout();
//         addMessage("✅ Logged out");
//       } catch (err) {
//         console.error("Logout error:", err);
//       }
//       clientRef.current = null;
//     }
//     setLoggedIn(false);
//     setMessages([]);
//     setConnectionStatus("Disconnected");
//   };

//   const cleanUsername = (name) => {
//     return name.replace(/[^a-zA-Z0-9_@.-]/g, "");
//   };

//   return (
//     <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
//       <h2>Agora RTM Chat</h2>
      
//       <div style={{ marginBottom: 10, fontSize: "0.9em", color: "#666" }}>
//         Status: <strong>{connectionStatus}</strong>
//       </div>

//       {!loggedIn ? (
//         <>
//           <div style={{ marginBottom: 10 }}>
//             <input
//               placeholder="Your username (letters, numbers, _ @ . -)"
//               value={username}
//               onChange={(e) => setUsername(cleanUsername(e.target.value))}
//               style={{ padding: "8px", marginRight: "10px", width: "200px" }}
//             />
//             <button 
//               onClick={login}
//               style={{ 
//                 padding: "8px 16px",
//                 backgroundColor: "#007bff",
//                 color: "white",
//                 border: "none",
//                 borderRadius: "4px",
//                 cursor: "pointer"
//               }}
//             >
//               Login
//             </button>
//           </div>
          
//           <div style={{ fontSize: "0.8em", color: "#888", marginTop: "10px" }}>
//             <strong>Note:</strong> If login fails, your network may be blocking RTM ports.
//           </div>
//         </>
//       ) : (
//         <>
//           <div style={{ marginBottom: 20 }}>
//             <p>
//               Logged in as: <strong>{username}</strong> 
//               <button 
//                 onClick={logout}
//                 style={{ 
//                   marginLeft: "15px",
//                   padding: "5px 10px",
//                   backgroundColor: "#dc3545",
//                   color: "white",
//                   border: "none",
//                   borderRadius: "3px",
//                   cursor: "pointer"
//                 }}
//               >
//                 Logout
//               </button>
//             </p>
//           </div>

//           <hr style={{ margin: "20px 0" }} />

//           <div style={{ marginBottom: 15 }}>
//             <input
//               placeholder="Send to username"
//               value={peer}
//               onChange={(e) => setPeer(e.target.value)}
//               style={{ padding: "8px", marginRight: "10px", width: "200px" }}
//             />
//             <input
//               placeholder="Message"
//               value={text}
//               onChange={(e) => setText(e.target.value)}
//               onKeyPress={(e) => e.key === "Enter" && sendMessage()}
//               style={{ padding: "8px", marginRight: "10px", width: "250px" }}
//             />
//             <button 
//               onClick={sendMessage}
//               style={{ 
//                 padding: "8px 16px",
//                 backgroundColor: "#28a745",
//                 color: "white",
//                 border: "none",
//                 borderRadius: "4px",
//                 cursor: "pointer"
//               }}
//             >
//               Send
//             </button>
//           </div>

//           <div style={{
//             marginTop: 20,
//             border: "1px solid #ddd",
//             borderRadius: "4px",
//             padding: "15px",
//             height: "300px",
//             overflowY: "auto",
//             backgroundColor: "#f9f9f9"
//           }}>
//             {messages.length === 0 ? (
//               <div style={{ color: "#999", textAlign: "center", marginTop: "100px" }}>
//                 No messages yet. Start a conversation!
//               </div>
//             ) : (
//               messages.map((m, i) => (
//                 <div 
//                   key={i} 
//                   style={{ 
//                     marginBottom: "8px",
//                     padding: "5px 10px",
//                     backgroundColor: m.includes("→") ? "#e7f3ff" : "#f0f0f0",
//                     borderRadius: "4px"
//                   }}
//                 >
//                   {m}
//                 </div>
//               ))
//             )}
//           </div>
//         </>
//       )}
//     </div>
//   );
// }