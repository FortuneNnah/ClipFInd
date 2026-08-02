import react from "react";
import logo from "./assets/logo.png"
import "./App.css";


const Header = () => {
    return (
        <div className="header-container">
            <div className="logo">
                <img src={logo} alt="ClipFind Logo"></img>
            </div>
            <div className="navlinks">
                <li className="link1"><a href="#home">Upload clip</a></li>
                <li className="link2"><a href="#history">History</a></li>
            </div>
        </div>
    )
}

export default Header;