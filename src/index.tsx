import React from "react";
import ReactDOM from 'react-dom';
import App from "./components/App";  // 修改为默认导入

ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById('root')
);