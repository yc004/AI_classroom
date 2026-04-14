import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import TextGenerator from "./pages/TextGenerator";
import ImageGenerator from "./pages/ImageGenerator";
import VideoGenerator from "./pages/VideoGenerator";
import Config from "./pages/Config";
import History from "./pages/History";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/text" element={<TextGenerator />} />
        <Route path="/image" element={<ImageGenerator />} />
        <Route path="/video" element={<VideoGenerator />} />
        <Route path="/config" element={<Config />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </Router>
  );
}
