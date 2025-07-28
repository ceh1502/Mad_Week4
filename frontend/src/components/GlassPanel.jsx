import React from 'react';
import '../styles/GlassPanel.css';

const GlassPanel=({children,width='300px',height='auto'})=>{
    return(
        <div
            className="glass-panel"
            style={{width,height}}
            >
                {children}
            </div>
    );
};
export default GlassPanel;