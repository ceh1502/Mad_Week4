import React from 'react';
import FloatingHearts2 from '../components/FloatingHearts2';
import '../styles/Signin.css';
import GlassPanel from '../components/GlassPanel';
import logo from '../assets/logo.png';

const Signin = () => {
    return (
        <div className="initPageWrapper">
            <FloatingHearts2 />
            <div className="backgroundBlur" />
            <GlassPanel width="480px">
                <img src={logo} alt="logo" className="logo" />
                <form className="SigninformGrid">
                    <label className="Inputlabel" htmlFor="userId">ID</label>
                    <input
                    id="userId"
                    name="userId"
                    type="text"
                    className="inputField"
                    />
                    <label className="Inputlabel" htmlFor="password">PW</label>
                    <input
                    id="password"
                    name="password"
                    type="password"
                    className="inputField"
                    />
                    </form>
                <button className="CommonBtn"> Sign in </button>
            </GlassPanel>
        </div>
    );
}
export default Signin;