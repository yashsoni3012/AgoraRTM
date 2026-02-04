import Chat from "./Chat";
import AudioVideo from "./AudioVideo"; 
import { BrowserRouter as Router,Routes,Route,Link } from "react-router-dom";

function App() {
 return (
   <Router>
    <Link to="/">Chat</Link> ||  
    <Link to="/call">Call</Link>
    <Routes>
      <Route path="/" element={<Chat />} />
      <Route path="/call" element={<AudioVideo />} />
    </Routes>
  </Router>
 )
}
export default App;