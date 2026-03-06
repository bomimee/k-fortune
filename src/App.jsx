import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import ReadingInput from './pages/ReadingInput';
import Checkout from './pages/Checkout';
import Result from './pages/Result';
import History from './pages/History';
import DailyFortune from './pages/DailyFortune';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="bg-brand-dark min-h-screen text-white font-sans selection:bg-brand-gold selection:text-brand-dark">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/reading/:type" element={<ReadingInput />} />
            <Route path="/daily-fortune" element={<DailyFortune />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/result" element={<Result />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
