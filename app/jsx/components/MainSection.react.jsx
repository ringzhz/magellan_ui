
import React from 'react';
import {Body} from './Body.react.jsx';
import {Compass} from './Compass.react.jsx';
import {Coordinates} from './Coordinates.react.jsx';


export class MainSection extends React.Component {
    render() {
        return (
            <div>
                <Body />
                <Compass ref="compass" />
                <Coordinates ref="coordinates" />
            </div>
        );
    }
}
