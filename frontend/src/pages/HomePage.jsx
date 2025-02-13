import React from "react";
import { Link } from "react-router-dom";

const HomePage = () => {
    return (
        <div className="font-sans text-gray-800">
            {/* Hero Section */}
            <header
                className="relative h-[400px] bg-cover bg-center flex flex-col items-center justify-center text-white"
                style={{ backgroundImage: "url('https://via.placeholder.com/1200x400')" }}
            >
                <div className="absolute inset-0 bg-black bg-opacity-50"></div>
                <div className="z-10 text-center px-4">
                    <h1 className="text-4xl font-bold mb-4">
                        Welcome to Stellar Progress Company
                    </h1>
                    <p className="text-xl mb-8">
                        The easiest way to manage reservations and online bookings for your restaurant.
                    </p>
                    <Link
                        to="/booking"
                        className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded inline-block"
                    >
                        Book a Table
                    </Link>
                </div>
            </header>

            {/* Features Section */}
            <section className="py-8 bg-gray-100">
                <div className="max-w-7xl mx-auto px-4">
                    <h2 className="text-2xl font-bold mb-4 text-center">Features</h2>
                    <div className="flex flex-wrap -mx-4">
                        <div className="w-full md:w-1/3 px-4 mb-8">
                            <div className="bg-white rounded shadow p-6">
                                <h3 className="font-semibold mb-2">Feature One</h3>
                                <p className="text-gray-700">
                                    Quickly see available slots and secure a table in seconds.
                                </p>
                            </div>
                        </div>
                        <div className="w-full md:w-1/3 px-4 mb-8">
                            <div className="bg-white rounded shadow p-6">
                                <h3 className="font-semibold mb-2">Feature Two</h3>
                                <p className="text-gray-700">
                                    Seamless integration with your existing website—add a booking widget, and you’re good to go!
                                </p>
                            </div>
                        </div>
                        <div className="w-full md:w-1/3 px-4 mb-8">
                            <div className="bg-white rounded shadow p-6">
                                <h3 className="font-semibold mb-2">Feature Three</h3>
                                <p className="text-gray-700">
                                    Access advanced analytics to understand peak hours, optimize seating, and increase your revenue.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call-To-Action Section */}
            <section className="py-12 bg-gradient-to-r from-orange-400 to-pink-500 text-white text-center">
                <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
                <p className="text-lg mb-8">
                    Join dozens of restaurants that rely on Stellar Progress for an unforgettable experience.
                </p>
                <Link
                    to="/booking"
                    className="bg-white text-orange-600 hover:text-orange-700 px-6 py-3 rounded font-semibold"
                >
                    Reserve a Table Now
                </Link>
            </section>
        </div>
    );
};

export default HomePage;
