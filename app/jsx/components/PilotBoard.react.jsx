import React from 'react';


//TODO: Something about this
// For now: change value returned from PilotBoart.PI_ADDR
const  PI_ADDR_WIN = 'http://192.168.0.126:3000';
const  PI_ADDR_UBUNTU = 'http://192.168.42.1:3000';
const RAD_PER_DEG = Math.PI / 180;

export class PilotBoard extends React.Component {
    constructor() {
        super(arguments);
        this.state = {
            s3Status: 'Disconnected' //TODO: Enumify
        };
    }

    render() {
        // this didn't work in the constructor. why not?
        if('function' !== typeof this.props.onApiData) {
            console.warn('PilotBoard: Nobody\'s listening to the pilot\'s data');
            console.log('Add a listener: <PilotBoard onApiData={someFunc}...');
        }
        return (
            <div className="s3-status">
                <h2>S3 Pilot Board Status</h2>
                <code>{this.state.s3Status}</code>
            </div>
        );
    }

    //TODO: I think it oughta take care of its own status.
    setStatus(s3Status) {
        this.setState({
            s3Status: s3Status
        });
    }

    isPosInRange(pos) {
        return  pos.x > -40 &&
                pos.x < 40 &&
                pos.y > -40 &&
                pos.y < 40;
    }

    getMockApiData() {
        if(!this._pos) {
            this._pos = {
                x: 0,
                y: 0,
                h: PilotBoard.getRandomInRange(-179, 179)
            };
        }

        let h = this._pos.h;
        if(!this.isPosInRange(this._pos)) {
            let x = this._pos.x;
            let y = this._pos.y;
            let theta = Math.atan(x / y);

            if (y > 0) {
                theta += Math.PI;
            }

            h = theta / RAD_PER_DEG;
        } else {
            h += PilotBoard.getRandomInRange(-5, 5);
        }
        this._pos.h = h;


        let distanceTraveled = PilotBoard.getRandomInRange(0.4, 2);
        let direction = this._pos.h * RAD_PER_DEG;

        this._pos.x += distanceTraveled * Math.sin(direction);
        this._pos.y += distanceTraveled * Math.cos(direction);

        return {
            device: {
                details: {
                    pose: this._pos,
                    status: 'Disconnected'
                }
            }
        }
    }

    getOnApiErrorHandler() {
        return this.props.onApiError || this.defaultOnApiError;
    }

    defaultOnApiError(jqXHR, textStatus, errorThrown) {
        console.log('error fetching bot status:\n\t'+textStatus);
        console.err(errorThrown);

        this.refs.s3Status.setS3Status('Disconnected');
        this.refs.motorTuner.setMotorTuningEnabled(false);
    }

    poll () {
        if(!this.props.onApiData) {
            return;
        }
        if(PilotBoard.DUMMY_BOT) {
            this.props.onApiData.call(this, this.getMockApiData());
        } else {
            $.ajax({
                'url': PI_ADDR + '/api/robots/cylon_magellan/devices/pilot',
                'success': this.props.onApiData.bind(this),
                'error': this.onApiError.bind(this)
            });
        }
    }

    startDataPoller() {
    // TODO: Datapoller Class?
        this._dataPollInterval = window.setInterval(this.poll.bind(this), 1000 / PilotBoard.POLLING_RATE);
    }

    stopDataPoller() {
        window.clearInterval(this._dataPollInterval);
    }


    // Returns a random number between min (inclusive) and max (exclusive)
    static getRandomInRange(min, max) {
        return +(Math.random() * (max - min) + min).toFixed(2);
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
        return 20;
    }
    static get PI_ADDR() {
        return PI_ADDR_WIN;
    }
    static get DUMMY_BOT() {
        return true;
    }
}
