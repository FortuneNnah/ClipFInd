import react from "react";
import "./App.css";


const Header = () => {
    return (
        <div className="header-container">
            <div className="logo">
                <h1>
                    <span className="clip">Clip</span>
                    <span className="find">Find</span>
                </h1>
            </div>
            <div className="navlinks">
                <li className="link1"><a href="#home">Upload clip</a></li>
                <li className="link2"><a href="#history">History</a></li>
            </div>
        </div>
    )
}

export default Header;