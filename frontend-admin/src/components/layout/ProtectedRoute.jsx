// src/components/ProtectedRoute.jsx
import "react";
import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";

function ProtectedRoute({ children }) {
    const isAuthenticated = localStorage.getItem("isAuthenticated");

    // If user is NOT authenticated, redirect to /login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Otherwise, render the protected component (AdminDashboard)
    return children;
}

ProtectedRoute.propTypes = {
    children: PropTypes.node.isRequired,
};
export default ProtectedRoute;
