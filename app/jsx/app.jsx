import React from 'react';

import {MainSection} from './components/MainSection.react.jsx';

const render = () => React.render(
    <MainSection />,
    document.getElementById('content')
);

const POLLING_RATE = 1; //requests/second

window.mainSection = render();

window.setInterval(function() {

    $.getJSON('http://192.168.0.126:3000/api/robots/cylon_magellan/devices/pilot', (data) => {
        //console.log(data);
        if(!data || !data.device) {
            //TODO: show this
            console.log('no data from bot.');
            return;
        }
        var pose = data.device.details.pose;
        window.mainSection.refs.compass.setAngle(pose.h);
        window.mainSection.refs.coordinates.setCoords(pose);
    });
}, 1000 / POLLING_RATE);