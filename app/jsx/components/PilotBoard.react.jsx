import React from 'react';

import {Pose} from './Pose.react.jsx';

import gaussian from 'gaussian';

//TODO: Something about this
// For now: change value returned from PilotBoart.PI_ADDR
const PI_ADDR_WIN = 'http://192.168.0.126:3000';
const PI_ADDR_UBUNTU = 'http://192.168.42.1:3000';
const RAD_PER_DEG = Math.PI / 180;

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
        let beginButtonEnabled = /Waiting$/.test(this.state.s3Status);
        return (
            <div className="s3-status">
                <h2>S3 Pilot Board Status</h2>
                <code>{this.state.s3Status}</code>
                <br />
                <div>
                    <h7>Waypoints set: </h7>
                    <span>{this.state.waypoints}</span>
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

        let motorPIDData = [
            {
                "T": "Motors",
                "T1": 45.2,
                "V1": 0,
                "I1": 5.08,
                "D1": 1.6,
                "PW1": 7,
                "ts": 1443753903745
            },
            {
                "T": "Motors",
                "T1": 45.2,
                "V1": 0,
                "I1": 23.15,
                "D1": 0,
                "PW1": 23,
                "ts": 1443753903885
            },
            {
                "T": "Motors",
                "T1": 45.2,
                "V1": -5.92,
                "I1": 41.6,
                "D1": 0.74,
                "PW1": 38,
                "ts": 1443753904028
            },
            {
                "T": "Motors",
                "T1": 45.2,
                "V1": -5.92,
                "I1": 60.41,
                "D1": 0,
                "PW1": 57,
                "ts": 1443753904156
            },
            {
                "T": "Motors",
                "T1": 45.2,
                "V1": -37.33,
                "I1": 92.8,
                "D1": 0,
                "PW1": 88,
                "ts": 1443753904298
            },
            {
                "T": "Motors",
                "T1": 45.2,
                "V1": -194.12,
                "I1": 169.47,
                "D1": 0.05,
                "PW1": 99,
                "ts": 1443753904425
            },
            {
                "T": "Motors",
                "T1": 45.2,
                "V1": -384.83,
                "I1": 313.65,
                "D1": 0.16,
                "PW1": 99,
                "ts": 1443753904553
            },
            {
                "T": "Motors",
                "T1": 45.2,
                "V1": -437.05,
                "I1": 485.64,
                "D1": 0.11,
                "PW1": 99,
                "ts": 1443753904683
            },
            {
                "T": "Motors",
                "T1": 45.2,
                "V1": -445.83,
                "I1": 666.64,
                "D1": 0.05,
                "PW1": 99,
                "ts": 1443753904814
            },
            {
                "T": "Motors",
                "T1": 45.2,
                "V1": -441.29,
                "I1": 851.1,
                "D1": -0.06,
                "PW1": 99,
                "ts": 1443753904946
            },
            {
                "T": "Motors",
                "T1": 45.2,
                "V1": -445.57,
                "I1": 1030.96,
                "D1": 0.14,
                "PW1": 99,
                "ts": 1443753905077
            },
            {
                "T": "Motors",
                "T1": 45.2,
                "V1": -448.4,
                "I1": 1226.12,
                "D1": 0.19,
                "PW1": 99,
                "ts": 1443753905216
            },
            {
                "T": "Motors",
                "T1": 45.2,
                "V1": -446.97,
                "I1": 1409.38,
                "D1": -0.2,
                "PW1": 99,
                "ts": 1443753905343
            },
            {
                "T": "Motors",
                "T1": 45.2,
                "V1": -443.99,
                "I1": 1593.53,
                "D1": -0.68,
                "PW1": 99,
                "ts": 1443753905474
            },
            {
                "T": "Motors",
                "T1": 45.2,
                "V1": -443.99,
                "I1": 1775.25,
                "D1": 0,
                "PW1": 99,
                "ts": 1443753905605
            },
            {
                "T": "Motors",
                "T1": 45.2,
                "V1": -445.75,
                "I1": 1942.14,
                "D1": 0,
                "PW1": 99,
                "ts": 1443753905724
            },
            {
                "T": "Motors",
                "T1": 45.2,
                "V1": -442.25,
                "I1": 2112.26,
                "D1": 0,
                "PW1": 99,
                "ts": 1443753905846
            },
            {
                "T": "Motors",
                "T1": 45.2,
                "V1": -446.35,
                "I1": 2304.19,
                "D1": 0,
                "PW1": 99,
                "ts": 1443753905982
            },
            {
                "T": "Motors",
                "T1": 45.2,
                "V1": -449.33,
                "I1": 2488.84,
                "D1": 0.01,
                "PW1": 99,
                "ts": 1443753906113
            },
            {
                "T": "Motors",
                "T1": 45.2,
                "V1": -446.37,
                "I1": 2670.5,
                "D1": -0.02,
                "PW1": 99,
                "ts": 1443753906244
            },
            {
                "T": "Motors",
                "T1": 45.2,
                "V1": -446.76,
                "I1": 2853.15,
                "D1": 0.01,
                "PW1": 99,
                "ts": 1443753906375
            },
            {
                "T": "Motors",
                "T1": 45.2,
                "V1": -446.8,
                "I1": 3035.88,
                "D1": 0,
                "PW1": 99,
                "ts": 1443753906506
            },
            {
                "T": "Motors",
                "T1": 45.2,
                "V1": -445.95,
                "I1": 3231.2,
                "D1": -0.06,
                "PW1": 99,
                "ts": 1443753906646
            },
            {
                "T": "Motors",
                "T1": 45.2,
                "V1": -443.93,
                "I1": 3427.56,
                "D1": -0.31,
                "PW1": 99,
                "ts": 1443753906785
            },
            {
                "T": "Motors",
                "T1": 45.2,
                "V1": -446.39,
                "I1": 3621.87,
                "D1": 0.56,
                "PW1": 99,
                "ts": 1443753906924
            }
        ];

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
        }
        this.startDataPoller();
        if(PilotBoard.DUMMY_BOT) {
            this._beginFlag = true;
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
