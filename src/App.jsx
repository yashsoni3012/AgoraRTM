import Chat from "./Chat";
import VideoCall from "./Video"; 
import AudioCall from "./Audio";
import { BrowserRouter as Router,Routes,Route,Link } from "react-router-dom";

function App() {
 return (
   <Router>
    <Link to="/">Chat</Link> ||  
    <Link to="/videocall">Call</Link> ||
    || <Link to="/audiocall">Audio Call</Link>
    <Routes>
      <Route path="/" element={<Chat />} />
      <Route path="/videocall" element={<VideoCall />} />
      <Route path="/audiocall" element={<AudioCall />} />
    </Routes>
  </Router>
 )
}
export default App;