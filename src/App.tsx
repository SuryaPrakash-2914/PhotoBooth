import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import PhotoType from './pages/PhotoType';
import Camera from './pages/Camera';
import Edit from './pages/Edit';
import Preview from './pages/Preview';
import Payment from './pages/Payment';
import Printing from './pages/Printing';
import Complete from './pages/Complete';
import Admin from './pages/Admin';

function App() {
  return (
    <BrowserRouter>
      <div className="kiosk-container bg-brand-dark text-white">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/photo-type" element={<PhotoType />} />
          <Route path="/camera" element={<Camera />} />
          <Route path="/edit" element={<Edit />} />
          <Route path="/preview" element={<Preview />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/printing" element={<Printing />} />
          <Route path="/complete" element={<Complete />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
