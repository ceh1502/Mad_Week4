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
            <GlassPanel width="800px" height="400px">
                <img src={logo}alt="logo" className="logo" />
                <button onClick={onSigninClick}className="InitCommonBtn"> Sign in </button>
                <button onClick={onSignupClick}className="InitCommonBtn"> Sign up</button>
            </GlassPanel>
        </div>
    );
};
export default InitPage;