import React from 'react';

import {Pose} from './Pose.react.jsx';

import gaussian from 'gaussian';

//TODO: Something about this
// For now: change value returned from PilotBoart.PI_ADDR
const PI_ADDR_WIN = 'http://192.168.0.126:3000';
const PI_ADDR_UBUNTU = 'http://192.168.42.1:3000';
const RAD_PER_DEG = Math.PI / 180;
const BEGIN_URL = 'http://192.168.0.126:3000/api/robots/cylon_magellan/commands/begin';

export class PilotBoard extends React.Component {
    constructor() {
        super(arguments);

        this.state = {
            s3Status: 'Disconnected', //TODO: Enumify
            waypoints: [],
            visited: [],
        };
    }

    render() {
        // this didn't work in the constructor. why not?
        if ('function' !== typeof this.props.onApiData) {
            console.warn('PilotBoard: Nobody\'s listening to the pilot\'s data');
            console.log('Add a listener: <PilotBoard onApiData={someFunc}...');
        }
        let beginButtonEnabled = /Waiting$/.test(this.state.s3Status) || /^Driver Online/.test(this.state.s3Status);
        return (
            <div className="s3-status">
                <h2>S3 Pilot Board Status</h2>
                <code>{this.state.s3Status}</code>
                <br />
                <div>
                    <h7>Waypoints set: </h7>
                    <span>{JSON.stringify(this.state.waypoints)}</span>
                </div>
                <button disabled={!beginButtonEnabled} onClick={this.startDriving.bind(this)}>Begin</button>
            </div>
        );
    }

    //TODO: I think this class oughta take care of its own status instead of whatever's calling this
    setStatus(s3Status) {
        this.setState({
            s3Status
        });
    }

    foundCurrentWaypoint() {
        this._visitedWaypoints.push(this._waypoints.shift());

    }

    isPosInRange(pos) {
        return pos.x > -40 &&
            pos.x < 40 &&
            pos.y > -40 &&
            pos.y < 40;
    }

    snap() {
        let h = this._distanceToCone;
        let angleToCone = this._pos.angleTo(this._nextWaypoint) - this._pos.h;
        let servoAngle = this._pos.servoPosition;

        console.log('-----');
        console.log('servoAngle: '+servoAngle);
        console.log('botAngle: '+this._pos.h);
        console.log('angleToCone from bot: '+angleToCone);
        console.log('h: '+h);
        if (h < 10 && Math.abs(servoAngle - angleToCone) < 12) {
            // we've seen the cone
            let x = h * Math.sin(Pose.degreesToRad(servoAngle+angleToCone));
            console.log('cone sighted: '+x);
            return {
                x
            }
        }
        return {};
    }
    getMockApiData() {
        if (!this._pos) {
            this._pos = new Pose({
                x: 0,
                y: 0,
                h: PilotBoard.getRandomInRange(0, 50),
                servoPosition: 0
            });
            this._servoDirection = 1;
        }

        let status = this.state.s3Status;
        let prefix = 'DUMMY_MODE: ';
        if (status.indexOf(prefix) == 0) {
            status = status.substr(prefix.length);
        }
        let distanceTraveled = 0;
        let distanceToCone;

        theMegaSwitch:
        switch (status) {
            case 'Disconnected':
                status = 'Waiting';
                this.stopDataPoller();
                break;
            case 'Waiting':
                if(this._beginFlag) {
                    status = 'picking next waypoint';
                } else {
                    return null;
                }
                break;
            case 'picking next waypoint':
                let waypoints = this.state.waypoints;
                this._nextWaypoint = waypoints.shift();
                console.log('next waypoint: '+this._nextWaypoint);
                this.setState({waypoints});
                if(!this._nextWaypoint) {
                    status = 'all done';
                } else {
                    status = 'turning to next waypoint';
                }
                break;
            case 'turning to next waypoint':
                this._pos.h = this._pos.angleTo(this._nextWaypoint);
                status = 'driving near waypoint';
                break;
            case 'driving near waypoint':
                if (!this.isPosInRange(this._pos)) {
                    status = 'out of bounds';
                }
                if(this._pos.distanceTo(this._nextWaypoint) < PilotBoard.PIXY_CAM_RANGE) {
                    status = 'searching for cone';
                    break;
                }
                this._pos.h += PilotBoard.getRandomInRange(0, 0.1);
                distanceTraveled = PilotBoard.getRandomInRange(0.7, 0.1);
                break;
            case 'searching for cone':
                if (!this.isPosInRange(this._pos)) {
                    status = 'out of bounds';
                }
                distanceToCone = this._distanceToCone = this._pos.distanceTo(this._nextWaypoint);
                distanceTraveled = distanceToCone * 0.2;
                let angleToSearch = (PilotBoard.PIXY_CAM_RANGE - distanceToCone) * 90;
                status = 'sweep';

                console.log('+++++++++++++++++++++++++++++++++++++++');
                console.log('distance: '+this._pos.distanceTo(this._nextWaypoint));
                console.log('angleToSearch: '+angleToSearch);
                this._angleToSearch = angleToSearch;

                break;
            case 'sweep':
                for(let offset = 0; offset < this._angleToSearch; offset += 10) {
                    this._pos.servoPosition = offset;
                    console.log('snap:' + offset);
                    let snap = this.snap();
                    if (snap && snap.x) {
                        console.log('found the cone at: '+snap.x);
                        status = 'turn to cone';
                        break theMegaSwitch;
                    }
                }
                for(let offset = -10; offset > -this._angleToSearch; offset -= 10) {
                    this._pos.servoPosition = offset;
                    console.log('snap:' + offset);
                    let snap = this.snap();
                    if (snap && snap.x) {
                        console.log('found the cone at: '+snap.x);
                        status = 'turn to cone';
                        break theMegaSwitch;
                    }
                }
                status = 'searching for cone';
                break;
            case 'turn to cone':
                let x = this.snap().x;

                if(!x && x!==0) {
                    status = 'sweep';
                    break;
                }

                let adjustment = x * 50;
                if(adjustment > 5) {
                    adjustment = 5;
                } else if (adjustment < 1 && adjustment >= 0) {
                    adjustment = 1;
                } else if (adjustment > -1 && adjustment < 0) {
                    adjustment = -1;
                } else if(adjustment < -5) {
                    adjustment = -5;
                }
                // I can't figure out to stop this from oscillating between 2 values every once and a while.
                // so have this! TODO: HAX
                adjustment += Math.random()/3;

                let requiredPrecision = this._distanceToCone / 10;
                if (requiredPrecision < 0.05) { // 5 cm will do
                    requiredPrecision = 0.05;
                }

                console.log('requiredPrecision: '+requiredPrecision);
                console.log('adjustment:'+adjustment);
                if(Math.abs(this._pos.servoPosition) < 5 && Math.abs(x) < requiredPrecision) {
                    status = 'touch';
                    console.log('approaching');
                } else {
                    console.log('centering');
                }

                this._pos.h = this._pos.h + adjustment;
                this._pos.servoPosition = this._pos.servoPosition - adjustment;

                break;
            case 'touch':
                if (!this.isPosInRange(this._pos)) {
                    status = 'out of bounds';
                }
                distanceToCone = this._distanceToCone = this._pos.distanceTo(this._nextWaypoint);
                if(distanceToCone < 0.05) {
                    status = 'backup';
                    console.log('TOUCH!');
                    break;
                }
                distanceTraveled = distanceToCone * 0.2;
                console.log('distance: '+this._pos.distanceTo(this._nextWaypoint));
                status = 'turn to cone';

                break;
            case 'backup':
                distanceTraveled = -1.0;
                status = 'picking next waypoint';
                break;
            case 'out of bounds':
                break;
            case 'all done':
                break;
            default:
                status = 'fake connected';
        }


        let direction = this._pos.h * RAD_PER_DEG;

        this._pos.x += distanceTraveled * Math.sin(direction);
        this._pos.y += distanceTraveled * Math.cos(direction);

        let lightLevel = PilotBoard.getRandomInRange(80, 40);
        let distance = PilotBoard.getRandomInRange(80, 40);

        let motorPIDData = [];

        return {
            device: {
                details: {
                    pose: this._pos,
                    status: 'DUMMY_MODE: ' + status,
                    distance,
                    lightLevel,
                    motorPIDData
                }
            }
        }
    }

    getOnApiErrorHandler() {
        return this.props.onApiError || this.defaultOnApiError;
    }

    defaultOnApiError(jqXHR, textStatus, err) {
        console.log('error fetching bot status:\n\t' + textStatus);
        console.error(err);

        //this.refs.motorTuner.setMotorTuningEnabled(false);
    }

    poll() {
        // TODO: Use this!
        // https://developer.mozilla.org/en-US/docs/Web/API/EventSource
        if (!this.props.onApiData) {
            return;
        }
        if (PilotBoard.DUMMY_BOT) {
            this.waypoints = [];
            this.props.onApiData.call(this, this.getMockApiData());
        } else {
            $.ajax({
                'url': PilotBoard.PI_ADDR + '/api/robots/cylon_magellan/devices/pilot',
                'success': this.props.onApiData.bind(this),
                'error': this.getOnApiErrorHandler().bind(this)
            });

        }
    }

    startDataPoller() {
        if(this._dataPollInterval) {
            return;
        }
        // TODO: Datapoller Class?
        this._dataPollInterval = window.setInterval(this.poll.bind(this), 1000 / PilotBoard.POLLING_RATE);
    }

    stopDataPoller() {
        window.clearInterval(this._dataPollInterval);
        this._dataPollInterval = null;
    }

    setWaypointsProvider(waypointsProvider) {
        this.waypointsProvider = waypointsProvider;
    }

    setCoordMapper(coordMapper) {
        this.coordMapper = coordMapper;
    }

    startDriving() {
        if(typeof this.waypointsProvider === "function" && typeof this.coordMapper === "function") {
            let coordMapper = this.coordMapper;
            let waypoints = this.waypointsProvider();
            waypoints = waypoints.map(coordMapper);
            this.setState({waypoints});


            this.startDataPoller();
            if(PilotBoard.DUMMY_BOT) {
                this._beginFlag = true;
            } else {
                $.ajax({
                    url: BEGIN_URL,
                    method: 'POST',
                    data: {
                        waypoints
                    }
                });
            }
        }
    }




    //TODO: put this somewhere
    // Returns a random number between min (inclusive) and max (exclusive)
    static getRandomInRange(mean, variance) {
        let distribution = gaussian(mean, variance);
        return distribution.ppf(Math.random());
    }

    // constants here to EOF ->
    static get STATUS() {
        //TODO: enum?
        return {
            CONNECTED: 0,
            DISCONNECTED: 1
        };
    }

    //requests/second
    static get POLLING_RATE() {
        return 2;
    }

    static get PI_ADDR() {
        return PI_ADDR_WIN;
    }

    static get DUMMY_BOT() {
        return false;
    }

    // in meters
    static get PIXY_CAM_RANGE() {
        return 10.0;
    }

}
