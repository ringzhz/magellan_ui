import React from 'react/addons';
import {GoogleMaps, Marker} from 'react-google-maps';
import _ from 'lodash';

export class MapMarker extends React.Component {
    /* TODO: Use JSDoc
    args: {
        icon: 'one of MapMarker.ORIGIN_ICON or MapMarker.VISITED_ICON, or make your own!',
        position: {
            lat: 'lat',
            lng: 'lng'
        }
    }
    */
    //TODO: Can I have the constructor generate its own key?
    constructor(args) {
        super(args);
        args = args || {};
        this.icon = args.icon || MapMarker.VISITED_ICON;
        this.state = {
            position: args.position || CourseMap.STARTING_COORDS
        };
        this.className = args.className || "locationMarker";

        // only origin is draggable
        this.draggable = this.icon === MapMarker.ORIGIN_ICON;
        this.className = this.draggable ? "originMarker" : "locationMarker";

    }

    render() {
    }

    onDragend(event) {
        console.log(event);
    }

    static fromLocationHistory(locationHistory) {
        let i = 0;
        let len = locationHistory.length;
        //TODO: can you control z-index?
        let locationMarkers = (locationHistory || []).map((location) => {
            let icon = MapMarker.VISITED_ICON;
            let coeff = (++i*2/len)/2;
            let className = 'location-history-marker';
            if (coeff < 0.4) {
                coeff = 0.4;
            }
            if(i == len) {
                icon['strokeColor'] = 'white';
                icon['strokeWeight'] = 1;
                className = 'current-location-marker';
                icon['fillOpacity'] = 0.8;
            } else {
                icon['scale'] = 4.5 * coeff;
                icon['fillOpacity'] = 0.7 * coeff;
            }
            return (
                <Marker className={className}
                        position={location.position}
                        icon={icon} />
            );
        });
        if(locationMarkers.length === 0) {
            locationMarkers = null;
        }
        //FIXME
        window.locationMarkers = locationMarkers;
        return locationMarkers;
    }

    static fromWaypoints(waypoints) {
        return waypoints.map((waypoint) => {
            return (
                <Marker className="waypoint-marker"
                    position={waypoint}
                    icon={MapMarker.WAYPOINT_ICON} />
            );
        });
    }

    // constants here to EOF. ->
    static get ORIGIN_ICON() {
        return {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: 'blue',
            fillOpacity: .4,
            scale: 4.5,
            strokeColor: 'white',
            strokeWeight: 1,
            draggable: true
        };
    }
    static get WAYPOINT_ICON() {
        const VISITED_ICON = {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: 'orange',
            fillOpacity: .9,
            scale: 4.5,
            strokeColor: 'white',
            strokeWeight: 1
        };
        let icon = {};
        _.each(VISITED_ICON, (value, key) => {
            icon[key] = value;
        });
        return icon;
    }

    static get VISITED_ICON() {
        const VISITED_ICON = {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: 'red',
            fillOpacity: .4,
            scale: 4.5,
            strokeWeight: 0
        };
        let icon = {};
        _.each(VISITED_ICON, (value, key) => {
            icon[key] = value;
        });
        return icon;
    }
}