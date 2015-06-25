import React from 'react';

import {MainSection} from './components/MainSection.react.jsx';

//TODO: Something about this
var PI_ADDR_WIN = 'http://192.168.0.126:3000';
var PI_ADDR_UBUNTU = 'http://192.168.42.1:3000';

var PI_ADDR = PI_ADDR_UBUNTU;


const render = () => React.render(
    <MainSection />,
    document.getElementById('content')
);

const POLLING_RATE = 1; //requests/second
const DUMMY_BOT = false;

window.mainSection = render();

// Returns a random number between min (inclusive) and max (exclusive)
function getRandomArbitrary(min, max) {
    return +(Math.random() * (max - min) + min).toFixed(2);
}

// TODO: Datapoller Class
window.dataPollInterval = window.setInterval(function () {
    if(DUMMY_BOT) {
        window.mainSection.refs.compass.setAngle(getRandomArbitrary(-180,180));
        window.mainSection.refs.courseMap.setCoords({
            x: getRandomArbitrary(-40,40),
            y: getRandomArbitrary(-40,40)
        });
    } else {
        $.ajax({
            url: PI_ADDR + '/api/robots/cylon_magellan/devices/pilot',
            success: (data) => {
                if (!data || !data.device) {
                    //TODO: show this
                    console.log('no data from bot.');
                    return;
                }
                var pose = data.device.details.pose;
                window.mainSection.refs.compass.setAngle(pose.h);
                window.mainSection.refs.courseMap.addLatestCoord(pose);
            },
            error: (jqXHR, textStatus, errorThrown) => {
                console.log('no data from bot api');
            }
        });
    }

    $.getJSON(PI_ADDR + '/api/robots/cylon_magellan/devices/pilot', (data) => {
        if(!data || !data.device) {
            //TODO: show this
            console.log('no data from bot.');
            window.mainSection.refs.s3Status.setS3Status('Disconnected');
            return;
        }
        var pose = data.device.details.pose;
        window.mainSection.refs.compass.setAngle(pose.h);
        window.mainSection.refs.courseMap.addLatestCoord(pose);

        var s3Status = data.device.details.status;
        window.mainSection.refs.s3Status.setS3Status(s3Status);
        //TODO: hehe. stop that
        window.mainSection.refs.motorTuner.setMotorTuningEnabled(s3Status === 'Board Ready. Driver awaiting commands.');
    });
}, 1000 / POLLING_RATE);