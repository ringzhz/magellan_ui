import React from 'react';
import {Body} from './Body.react.jsx';
import {Compass} from './Compass.react.jsx';
import {CourseMap} from './CourseMap.react.jsx';
import {MotorTuner} from './MotorTuner.react.jsx';
import {PilotBoard} from './PilotBoard.react.jsx';
import {TurnControls} from './TurnControls.react.jsx';
import {ThreeDModel} from './ThreeDModel.react.jsx';
import {Waypoints} from './Waypoints.react.jsx';


export class MainSection extends React.Component {

    constructor() {
        super(arguments);
        this.state = {
            targetAngle: TurnControls.getTargetAngle()
        };
    }

    componentDidMount() {
        this.refs.pilotBoard.startDataPoller();
        //FIXME
        this.refs.courseMap.setWaypoints([{
            lat: 47.6207,
            lng: -122.3511
        }, {
            lat: 47.6207,
            lng: -122.351
        }, {
            lat: 47.62017,
            lng: -122.3511
        }]);
    }

    render() {
        window.TC = TurnControls;
        return (
            <div className="main-section">
                <ThreeDModel ref="3dModel"/>
                <PilotBoard ref="pilotBoard" onApiData={this.onPilotBoardData.bind(this)}/>
                <Compass ref="compass" targetAngle={this.state.targetAngle}/>
                <TurnControls ref="turnControls" onAngleInputChanged={this.onTargetAngleChange.bind(this)}/>
                <CourseMap ref="courseMap"/>
                <MotorTuner ref="motorTuner"/>
                <Waypoints ref="waypoints" onWaypointsChange={this.waypointsDidChange.bind(this)}/>
            </div>
        );
    }

    waypointsDidChange(waypoints) {
        this.refs.courseMap.setWaypoints(waypoints);
    }


    onTargetAngleChange(event) {
        this.setState({
            targetAngle: event.target.value
        });
    }

    onPilotBoardData(data) {
        if (!data || !data.device) {
            //TODO: show this
            console.log('no data from bot.');
            return;
        }
        var pose = data.device.details.pose;
        var pilotBoardStatus = data.device.details.status;
        this.refs.compass.setAngle(pose.h);
        this.refs.courseMap.addLatestCoord(pose);
        this.refs.pilotBoard.setStatus(pilotBoardStatus);

        //TODO: hehe. stop that
        this.refs.motorTuner.setMotorTuningEnabled(pilotBoardStatus === 'Board Ready. Driver awaiting commands.');
    }

    defaultOnApiError(jqXHR, textStatus, errorThrown) {
        console.log('error fetching bot status:\n\t' + textStatus);
        console.err(errorThrown);

        this.refs.pilotBoard.setS3Status('Disconnected');
        this.refs.motorTuner.setMotorTuningEnabled(false);
    }
}
