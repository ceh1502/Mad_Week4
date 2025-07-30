import React, { useState } from "react";
import "../styles/Settings.css";
import logo from '../assets/logo.png';
import {useFlirto} from '../context/FlirtoContext';

const Settings = () => {
  const { isFlirtoOn, setIsFlirtoOn } = useFlirto();

  const handleToggle = () => {
    setIsFlirtoOn((prev) => !prev);
  };

  return (
    <div className="settingsWrapper">
      <div className="settingsGlass">
        <img src={logo} alt="Flirto Logo" className="settingsLogo" />
        <div className="toggleRow">
          <span className="toggleLabel">Flirto</span>
          <label className="switch">
            <input type="checkbox" checked={isFlirtoOn} onChange={handleToggle} />
            <span className="slider round"></span>
          </label>
        </div>
        <p className="statusText">
          {isFlirtoOn ? "Flirto is ON" : "Flirto is OFF"}
        </p>
      </div>
    </div>
  );
};

export default Settings;
