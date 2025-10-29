import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PrivateRoute from "./routes/PrivateRoutes";
import { ThemeProvider } from "./context/ThemeContext";


import Login from "./pages/login/login";


function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Páginas públicas */}
          {/* <Route path="/" element={<Home />} /> */}
          <Route path="/login" element={<Login />} />

          {/* Páginas privadas */}
          {/* <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          /> */}
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;