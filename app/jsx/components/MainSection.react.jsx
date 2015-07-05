import React from 'react';
import {Body} from './Body.react.jsx';
import {Compass} from './Compass.react.jsx';
import {CourseMap} from './CourseMap.react.jsx';
import {MotorTuner} from './MotorTuner.react.jsx';
import {S3Status} from './S3Status.react.jsx';
import {TurnControls} from './TurnControls.react.jsx';
import {ThreeDModel} from './ThreeDModel.react.jsx';


//TODO: Something about this
const PI_ADDR_WIN = 'http://192.168.0.126:3000';
const PI_ADDR_UBUNTU = 'http://192.168.42.1:3000';

const PI_ADDR = PI_ADDR_WIN;

const POLLING_RATE = 10; //requests/second
const DUMMY_BOT = true;
export class MainSection extends React.Component {

    constructor() {
        super(arguments);
        this._dataPollInterval = 0;
        this.state = {
            targetAngle: TurnControls.getTargetAngle()
        };

    }

    render() {
        window.TC = TurnControls;
        return (
            <div className="main-section">
                <ThreeDModel ref="3dModel"/>
                <S3Status ref="s3Status"/>
                <Compass ref="compass" targetAngle={this.state.targetAngle} />
                <TurnControls ref="turnControls" onAngleInputChanged={this.onTargetAngleChange.bind(this)} />
                <CourseMap ref="courseMap"/>
                <MotorTuner ref="motorTuner"/>
            </div>
        );
    }

    onTargetAngleChange(event) {
        this.setState({
            targetAngle: event.target.value
        });
    }

// Returns a random number between min (inclusive) and max (exclusive)
    getRandomInRange(min, max) {
        return +(Math.random() * (max - min) + min).toFixed(2);
    }

    onApiData(data) {
        if (!data || !data.device) {
            //TODO: show this
            console.log('no data from bot.');
            return;
        }
        var pose = data.device.details.pose;
        var s3Status = data.device.details.status;
        this.refs.compass.setAngle(pose.h);
        this.refs.courseMap.addLatestCoord(pose);
        this.refs.s3Status.setS3Status(s3Status);

        //TODO: hehe. stop that
        this.refs.motorTuner.setMotorTuningEnabled(s3Status === 'Board Ready. Driver awaiting commands.');
    }

    onApiError(jqXHR, textStatus, errorThrown) {
        console.log('no data from bot api');

        this.refs.s3Status.setS3Status('Disconnected');
        this.refs.motorTuner.setMotorTuningEnabled(false);
    }

    startDataPoller() {

// TODO: Datapoller Class
        this._dataPollInterval = window.setInterval(function () {
            if (DUMMY_BOT) {
                this.refs.compass.setAngle(this.getRandomInRange(-180, 180));

                let cM = this.refs.courseMap;
                let latestCoords = cM.latLngToMetersFromOrigin(cM.getLatestCoord());

                let x = latestCoords.x + this.getRandomInRange(-1, 1.0);
                let y = latestCoords.y + this.getRandomInRange(-1, 1.0);
                if(x > 40) {
                    x = 40;
                }
                if(x < -40) {
                    x = -40;
                }
                if(y > 40) {
                    y = 40;
                }
                if(y < -40) {
                    y = -40;
                }

                this.refs.courseMap.addLatestCoord({
                    x,
                    y
                });
            } else {
                $.ajax({
                    'url': PI_ADDR + '/api/robots/cylon_magellan/devices/pilot',
                    'success': this.onApiData.bind(this),
                    'error': this.onApiError.bind(this)
                });
            }
        }.bind(this), 1000 / POLLING_RATE);
    }

    stopDataPoller() {
        window.clearInterval(this._dataPollInterval);
    }
}
