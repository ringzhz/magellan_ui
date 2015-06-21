import React from 'react/addons';
import {GoogleMaps, Marker} from 'react-google-maps';

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
        window.wtf = this;
        window.React = React;
        return (
            <Marker className={this.className}
                    position={this.state.position}
                    draggable={this.draggable}
                    onDragEnd={this.onDragend.bind(this)}
                    icon={this.icon} />
        );
    }

    onDragend(event) {
        console.log(event);
    }

    static fromLocationHistory(locationHistory) {
        let locationMarkers =  (locationHistory || []).map((location) => {
            return (
                <Marker position={location.position}
                           icon={MapMarker.VISITED_ICON} />
            );
        });
        if(locationMarkers.length === 0) {
            locationMarkers = null;
        }
        return locationMarkers;
    }

    // constants here to EOF. ->
    static get ORIGIN_ICON() {
        return {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: 'blue',
            fillOpacity: .4,
            scale: 4.5,
            strokeColor: 'white',
            strokeWeight: 1
        };
    }

    static get VISITED_ICON() {
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