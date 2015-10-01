import React from 'react';
import {Body} from './Body.react.jsx';
import {Compass} from './Compass.react.jsx';
import {CourseMap} from './CourseMap.react.jsx';
import {MotorTuner} from './MotorTuner.react.jsx';
import {PilotBoard} from './PilotBoard.react.jsx';
import {TurnControls} from './TurnControls.react.jsx';
import {ThreeDModel} from './ThreeDModel.react.jsx';
import {Waypoints} from './Waypoints.react.jsx';
import {VisionMast} from './VisionMast.react.jsx';


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
        this.refs.courseMap.setWaypoints(this.refs.waypoints.getWaypoints());
        let waypointsProvider = this.refs.waypoints.getWaypoints.bind(this.refs.waypoints);
        this.refs.pilotBoard.setWaypointsProvider(waypointsProvider);
        let coordMapper = this.refs.courseMap.latLngToMetersFromOrigin.bind(this.refs.courseMap);
        this.refs.pilotBoard.setCoordMapper(coordMapper);
    }

    render() {
        window.TC = TurnControls;
        let waypointsProvider;
        return (
            <div className="main-section">
                <VisionMast ref="visionMast" />
                <ThreeDModel ref="3dModel"/>
                <PilotBoard ref="pilotBoard" onApiData={this.onPilotBoardData.bind(this)} waypointsProvider={waypointsProvider}/>
                <CourseMap ref="courseMap"/>
                <Compass ref="compass" targetAngle={this.state.targetAngle}/>
                <TurnControls ref="turnControls" onAngleInputChanged={this.onTargetAngleChange.bind(this)}/>
                <MotorTuner ref="motorTuner"/>
                <Waypoints ref="waypoints" onWaypointsChange={this.waypointsDidChange.bind(this)}/>
            </div>
        );
    }

    waypointsDidChange(waypoints) {
        this.refs.courseMap.setWaypoints(waypoints);
        //this.refs.pilotBoard.setWaypoints(waypoints);
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
        let pose = data.device.details.pose;
        let pilotBoardStatus = data.device.details.status;
        let visionMast  = {
            distance: data.device.details.distance,
            lightLevel: data.device.details.lightLevel,
            servoAngle: data.device.details.servoAngle,
            coneX: data.device.details.coneX
        };
        this.refs.compass.setAngle(pose.h);
        this.refs.courseMap.addLatestCoord(pose);
        this.refs.pilotBoard.setStatus(pilotBoardStatus);
        this.refs.visionMast.setState(visionMast);

        //TODO: hehe. stop that
        this.refs.motorTuner.setMotorTuningEnabled(pilotBoardStatus === 'Board Ready. Driver awaiting commands.');
    }

    defaultOnApiError(jqXHR, textStatus, err) {
        console.log('error fetching bot status:\n\t' + textStatus);
        console.error(err);

        this.refs.pilotBoard.setS3Status('Disconnected');
        this.refs.motorTuner.setMotorTuningEnabled(false);
    }
}
