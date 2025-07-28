import React from 'react';
import FloatingHearts from '../components/FloatingHearts';
import '../styles/InitPage.css';
import GlassPanel from '../components/GlassPanel';
import logo from '../assets/logo.png';

const InitPage=({onSigninClick,onSignupClick})=>{
    return(
        <div className="initPageWrapper">
            <FloatingHearts />
            <div className="backgroundBlur"/>
            <GlassPanel width="480px">
                <img src={logo}alt="logo" className="logo" />
                <button onClick={onSigninClick}className="CommonBtn"> Sign in </button>
                <button onClick={onSignupClick}className="CommonBtn"> Sign up</button>
            </GlassPanel>
        </div>
    );
};
export default InitPage;