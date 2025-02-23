// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages
import HomePage from "./pages/HomePage";
import BookingPage from "./pages/BookingPage";
import AdminDashboard from "./pages/AdminDashboard";
import LoginPage from "./pages/LoginPage";

// Components
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
    return (
        <Router>
            {/* Layout includes your nav bar, etc. */}
            <Layout>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/booking" element={<BookingPage />} />

                    {/* Public Login Route */}
                    <Route path="/login" element={<LoginPage />} />

                    {/* Protected Admin Dashboard */}
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </Layout>
        </Router>
    );
}

export default App;
