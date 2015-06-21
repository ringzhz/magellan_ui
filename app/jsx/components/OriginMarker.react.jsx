import React from 'react/addons';
import {GoogleMaps, Marker} from 'react-google-maps';

import {CourseMap} from './CourseMap.react.jsx';

//TODO Tried to encapsulate instead of extending. That didn't work for some reason . . .
export class OriginMarker extends Marker {
    constructor(args) {
        super(args);
        args = args || {};
        this.state = {
            position: args.position || CourseMap.STARTING_COORDS
        };
        this.props = {
            icon: OriginMarker.ICON
        };
    }

    render() {
        return (
            <Marker className="originMarker"
                    position={this.state.position}
                    draggable={true}
                    onDragEnd={this.onDragend.bind(this)}
                    icon={OriginMarker.ICON} />
        );
    }

    onDragend(event) {
        console.log(event);
    }

    // constants here to EOF. ->
    static get ICON() {
        return {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: 'red',
            fillOpacity: .4,
            scale: 4.5,
            strokeColor: 'white',
            strokeWeight: 1
        };
    }
}