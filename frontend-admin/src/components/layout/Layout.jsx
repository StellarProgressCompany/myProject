import "react";
import { Link } from "react-router-dom";

const Layout = ({ children }) => {
    return (
        <div>
            {/* Global Navigation Bar */}
            <nav className="bg-gray-800 p-4 text-white flex justify-between">
                <div>
                    <Link to="/" className="hover:text-gray-300 mr-4">
                        Home
                    </Link>
                    <Link to="/booking" className="hover:text-gray-300 mr-4">
                        Booking
                    </Link>
                </div>
                <div>
                    <Link to="/admin" className="hover:text-gray-300">
                        Admin
                    </Link>
                </div>
            </nav>
            {/* Page Content */}
            <main>{children}</main>
        </div>
    );
};

export default Layout;
