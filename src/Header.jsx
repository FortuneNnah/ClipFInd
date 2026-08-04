import React from "react";
import { NavLink } from "react-router-dom";
import logo from "./assets/logo.png";
import "./App.css";

const Header = () => {
    return (
        <div className="header-container">
            <div className="logo">
                <img src={logo} alt="ClipFind Logo"></img>
            </div>
            <div className="navlinks">
                <li className="link1"><NavLink to="/home">Upload clip</NavLink></li>
                <li className="link2"><NavLink to="/history">History</NavLink></li>
            </div>
        </div>
    );
};

export default Header;