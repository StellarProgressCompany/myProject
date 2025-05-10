// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginPage() {
    const navigate = useNavigate();

    // Form state
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    function handleSubmit(e) {
        e.preventDefault();

        // Hard-coded credentials
        if (username === "admin" && password === "1234") {
            localStorage.setItem("isAuthenticated", "true");
            navigate("/admin");
        } else {
            setError("Invalid credentials. Try admin / 1234.");
        }
    }

    return (
        <div className="flex min-h-screen">
            {/* Left side background image: hidden on small screens */}
            <div
                className="hidden md:block w-1/2 bg-cover bg-center"
                style={{
                    backgroundImage:
                        'url("https://images.unsplash.com/photo-1484242857719-4b9144542727?auto=format&fit=crop&w=1280&q=80")',
                }}
            ></div>

            {/* Right side login form */}
            <div className="w-full md:w-1/2 p-8 flex flex-col justify-center bg-white">
                <h2 className="text-3xl font-bold mb-6 text-center">Welcome back!</h2>

                {/* Error message */}
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* USERNAME FIELD */}
                    <div>
                        <label className="block mb-1 font-medium text-gray-700">
                            Username
                        </label>
                        <input
                            type="text"
                            placeholder="admin"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                        />
                    </div>

                    {/* PASSWORD FIELD */}
                    <div>
                        <label className="block mb-1 font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            type="password"
                            placeholder="1234"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                        />
                    </div>

                    {/* 'Keep me logged in' */}
                    <div className="flex items-center justify-between mt-2">
                        <label className="flex items-center space-x-2">
                            <input type="checkbox" className="form-checkbox" />
                            <span className="text-sm text-gray-600">Keep me logged in</span>
                        </label>
                    </div>

                    {/* SUBMIT */}
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
                    >
                        Login
                    </button>
                </form>

                <p className="text-center mt-4">
                    Don&apos;t have an account?{" "}
                    <a href="#" className="text-blue-600 font-semibold">
                        Register
                    </a>
                </p>
            </div>
        </div>
    );
}

export default LoginPage;
