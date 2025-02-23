// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
    const isAuthenticated = localStorage.getItem("isAuthenticated");

    // If user is NOT authenticated, redirect to /login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Otherwise, render the protected component (AdminDashboard)
    return children;
}

export default ProtectedRoute;
