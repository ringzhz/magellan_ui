import React from 'react';

//function *fromTo (_from, to, steps) {
//    let i = _from;
//    let stepSize = (to - _from) / steps;
//    i+=stepSize; //webstorm no likey yield +=
//    yield i;
//}

//TODO: Something about this
var PI_ADDR_WIN = 'http://192.168.0.126:3000';
var PI_ADDR_UBUNTU = 'http://192.168.42.1:3000';

var PI_ADDR = PI_ADDR_UBUNTU;

export class MotorTuner extends React.Component {
    constructor() {
        super();
        this.state = {
            fromStall: '?',
            inMotion: '?',
            enabled: false
        };
    }
    render() {
        //TODO: Disable buttons unless Board is ready.
        return (
            <div>
                <h3>Motor Tuner</h3>
                <label htmlFor="fromStall">Find Min Power: </label>
                <button id="fromStall" onClick={this.fromStallClick.bind(this)} disabled={!this.state.enabled}>From Stall</button>
                <br />
                <label htmlFor="inMotion">Find Min Power: </label>
                <button id="inMotion" onClick={this.inMotionClick.bind(this)} disabled={!this.state.enabled}>In Motion</button>
                <table>
                    <tr>
                        <td>From Stall: </td>
                        <td>{this.state.fromStall}</td>
                    </tr>
                    <tr>
                        <td>In Motion: </td>
                        <td>{this.state.inMotion}</td>
                    </tr>
                </table>
            </div>
        );
    }

    setMotorTuningEnabled(flag) {
        this.setState({
            enabled: flag
        });
    }

    inMotionClick() {
        console.log("In Motion");
        //TODO Make a Robit Object
        $.ajax({
            url: PI_ADDR + '/api/robots/cylon_magellan/commands/findInMotionPowerMin',
            method: 'POST',
            dataType: 'json',
            success: function (data) {
                if(!data || !data.result) {
                    return;
                }
                this.setState({
                    inMotion: data.result.inMotion
                });
            }.bind(this)
        });
    }
    fromStallClick() {
        console.log("From Stall");
        $.ajax({
            url: PI_ADDR + '/api/robots/cylon_magellan/commands/findFromStallPowerMin',
            method: 'POST',
            dataType: 'json',
            success: function (data) {
                if(!data || !data.result) {
                    return;
                }
                this.setState({
                    fromStall: data.result.fromStall
                });
            }.bind(this)
        });
    }
}
