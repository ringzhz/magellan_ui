import React from 'react';
import _ from 'lodash';

import {SliderTextInput} from './SliderTextInput.react.jsx';

import {Chart} from 'react-google-charts';

const LOCAL_STORAGE_KEY = '_motorPidMonitorState';
const SET_POWER_URL = 'http://192.168.0.126:3000/api/robots/cylon_magellan/commands/setPower';
const GO_DISTANCE_URL = 'http://192.168.0.126:3000/api/robots/cylon_magellan/commands/goDistance';
const SET_PID_URL = 'http://192.168.0.126:3000/api/robots/cylon_magellan/commands/setMotorPid';

export class MotorPidMonitor extends React.Component {

    constructor() {
        super(arguments);

        this.state = {
            expanded: 1,
            readings: {},
            motorPower: 0,
            lastPowerCmd: 'none',
            kp: 0.005,
            ki: 0.000000010,
            kd: 0.000000010,
            ke: 0.010
        };
    }

    setState(state) {
        super.setState(state);

        if ('undefined' !== typeof state.motorPower && state.motorPower != this.state.motorPower) {
            $.ajax({
                url: SET_POWER_URL,
                method: 'POST',
                data: {
                    power: 0.00001 + Number(state.motorPower)
                }
            });
        }
        // auto power-off after 5 seconds
        if (this._powerOffCallback) {
            window.clearTimeout(this._powerOffCallback);
        }

        this._powerOffCallback = window.setTimeout((() => {
            if (this.state.motorPower) {
                this.setState({
                    motorPower: 0
                });
            }
        }).bind(this), 5000);
    }

    render() {
        let buttonLabel = this.state.expanded ? '-' : '+';


        let readings = this.state.readings;


        let chartData = _.map(readings, (reading, ts) => {
            return [
                new Date(+ts),
                +reading.T1,
                +reading.time,
                +reading.V1,
                +reading.E1,
                //+reading.E1prime,
                +reading.I1,
                +reading.D1,
                +reading.PW1
            ];
        });

        _.sortBy(chartData, (d) => {
            return d[0];
        });

        let minTs = 0;
        let maxTs = 1;

        if (chartData.length > 0) {
            minTs = chartData[0][0];
            maxTs = chartData[chartData.length - 1][0];
        }

        chartData.unshift(['time', 'T1', 'tickLength', 'V1', 'E1', 'I1',
            'D1',
            'PW1']);


        let options = {
            title: 'M1',
            hAxis: {title: 'time', minValue: minTs, maxValue: maxTs},
            vAxis: {title: 'v', minValue: -500, maxValue: 500},
            autoScale: false
        };


        let content = this.state.expanded && (
                <div>
                    <Chart chartType="LineChart"
                           data={chartData}
                           width={'100%'}
                           height={'600px'}
                           graph_id='linechart_graph'
                           options={options}
                        />
                    <label for="kp">kp: </label>
                    <input type="text" id="kp"  value={this.state.kp.toFixed(15)} onChange={this.setKp.bind(this)}/>
                    <label for="ki">ki: </label>
                    <input type="text" id="ki"  value={this.state.ki.toFixed(15)} onChange={this.setKi.bind(this)} />
                    <label for="kd">kd: </label>
                    <input type="text" id="kd"  value={this.state.kd.toFixed(15)} onChange={this.setKd.bind(this)} />
                    <label for="ke">ke: </label>
                    <input type="text" id="ke"  value={this.state.ke.toFixed(15)} onChange={this.setKe.bind(this)} />
                    <SliderTextInput
                        ref='powerInput'
                        label='Motor Power: '
                        value={this.state.motorPower}
                        onChange={this.onMotorInputChanged.bind(this)}
                        min={0}
                        step={5}
                        max={100}/>
                    <button onClick={this.goDistance.bind(this)}>Go 5 Meters!</button>
                </div>
            );

        return (
            <div className="motor-pid-monitor expandable">
                <h3>motor pids</h3>

                <button className="expando-button" onClick={this.expando.bind(this)}>{buttonLabel}</button>
                {content}
            </div>
        );
    }
    setKp(evt) {
        this.setState({
            kp: +evt.target.value
        });
        this.setMotorPid();
    }
    setKi(evt) {
        this.setState({
            ki: +evt.target.value
        });
        this.setMotorPid();
    }
    setKd(evt) {
        this.setState({
            kd: +evt.target.value
        });
        this.setMotorPid();
    }
    setKe(evt) {
        this.setState({
            ke: +evt.target.value
        });
        this.setMotorPid();
    }

    goDistance() {
        $.ajax({
            url: GO_DISTANCE_URL,
            method: 'POST'
        });
    }

    setMotorPid() {
        $.ajax({
            url: SET_PID_URL,
            method: 'POST',
            data: {
                kp: +this.state.kp,
                ki: +this.state.ki,
                kd: +this.state.kd,
                ke: +this.state.ke
            }
        });
    }

    setData(newData) {
        let readings = this.state.readings;
        _.each(newData, reading => {
            readings[reading.ts] = reading;
        });

        let readingsList = _.chain(readings).
            map(reading => {
                return reading.ts;
            }).
            sortBy().
            value();

        while(readingsList.length > 200) {
            let ts = readingsList.shift();
            delete readings[ts];
        }

        this.setState({readings});
    }

    expando() {
        this.setState({
            expanded: !this.state.expanded
        });
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
;
}


