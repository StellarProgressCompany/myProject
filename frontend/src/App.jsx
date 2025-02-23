// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import BookingPage from "./pages/BookingPage";
import Layout from "./components/Layout";

function App() {
    return (
        <Router>
            <Layout>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/booking" element={<BookingPage />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                </Routes>
            </Layout>
        </Router>
    );
}

export default App;
