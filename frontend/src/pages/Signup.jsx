import React from 'react';
import FloatingHearts2 from '../components/FloatingHearts2';
import '../styles/Signup.css';
import GlassPanel from '../components/GlassPanel';
import logo from '../assets/logo.png';

const Signup = () => {
  return (
    <div className="initPageWrapper">
      <FloatingHearts2 />
      <div className="backgroundBlur" />
      <GlassPanel width="480px">
        <img src={logo} alt="logo" className="logo" />
        <div className="SignupContent">
        <div className="photoUpload">
          <div className="photoCircle" />
          <button className="uploadBtn">사진 업로드</button>
        </div>

        <div className="SignupformGrid">
          <div className="SignupformRow">
            <label htmlFor="name">Name</label>
            <input type="text" id="name" />
          </div>
          <div className="SignupformRow">
            <label htmlFor="id">ID</label>
            <input type="text" id="id" />
          </div>
          <div className="SignupformRow">
            <label htmlFor="pw">PW</label>
            <input type="password" id="pw" />
          </div>
        </div>
        </div>
        <div className="btnRow">
          <button className="CommonBtn">Sign Up</button>
        </div>
      </GlassPanel>
    </div>
  );
};

export default Signup;
