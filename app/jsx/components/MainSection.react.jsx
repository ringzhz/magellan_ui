
import React from 'react';
import {Body} from './Body.react.jsx';
import {Compass} from './Compass.react.jsx';
import {CourseMap} from './CourseMap.react.jsx';
import {MotorTuner} from './MotorTuner.react.jsx';
import {S3Status} from './S3Status.react.jsx';


export class MainSection extends React.Component {
    render() {
        return (
            <div>
                <Body />
                <S3Status ref="s3Status" />
                <Compass ref="compass" />
                <CourseMap ref="courseMap" />
                <MotorTuner ref="motorTuner" />
            </div>
        );
    }
}
