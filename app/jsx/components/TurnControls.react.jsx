import React from 'react';
import _ from 'lodash';

import {SliderTextInput} from './SliderTextInput.react.jsx';
const LOCAL_STORAGE_KEY = '_turnControlsState';
export class TurnControls extends React.Component {

    constructor() {
        super(arguments);

        this.state = {
            angle: 10,
            motorPower: 0,
            expanded: false
        };

        this.loadState();
    }

    setState(state) {
        super.setState(state);

        //only save once every 5 seconds
        if(this._statePersistingCallback) {
            window.clearTimeout(this._statePersistingCallback);
            this._statePersistingCallback = 0;
        }

        this._statePersistingCallback = window.setTimeout((() => {
            console.log('Saving Turn Control Settings');
            localStorage[LOCAL_STORAGE_KEY] = JSON.stringify(this.state);
        }).bind(this), 5000);
    }

    render() {
        let buttonLabel = this.state.expanded ? '-' : '+';

        let content = this.state.expanded && (
            <div>
                <SliderTextInput
                    ref='angleInput'
                    label='Angle: '
                    onChange={this.onAngleInputChanged.bind(this)}
                    value={this.state.angle}
                    min={-180}
                    max={180}/>
                <SliderTextInput
                    ref='powerInput'
                    label='Motor Power: '
                    value={this.state.motorPower}
                    onChange={this.onMotorInputChanged.bind(this)}
                    min={0}
                    max={100}/>
                <button onClick={null}>Turn To Angle</button>
            </div>
        );

        return (
            <div className='turn-controls'>
                <h3>Turn Controls</h3>
                <button className="expando-button" onClick={this.expando.bind(this)}>{buttonLabel}</button>
                {content}
            </div>
        );
    }
    expando() {
        this.setState({
            expanded: !this.state.expanded
        });
    }
    onAngleInputChanged(event) {
        let angle = event.target.value;
        this.setState({
            angle: angle
        });
        if (this.props.onAngleInputChanged) {
            this.props.onAngleInputChanged(event);
        }
    }

    onMotorInputChanged(event) {
        let motorPower = event.target.value;
        this.setState({
            motorPower: motorPower
        });
        if (this.props.onMotorInputChanged) {
            this.props.onMotorInputChanged(event);
        }
    }

    loadState() {
        _.forEach(TurnControls.getStoredState(), function (value, key) {
            this.state[key] = value;
        }.bind(this));
    }

    static getStoredState() {
        try {
            return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
        } catch (error) {
            console.log('Error Loading Stored Turn Controls');
            console.error(error);
        }
    };

    static getTargetAngle() {
        let state = TurnControls.getStoredState();
        return state && state.angle;
    };
}


