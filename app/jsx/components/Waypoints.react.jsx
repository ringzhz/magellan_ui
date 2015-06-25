import React from "react/addons";
import {GoogleMaps, Marker} from "react-google-maps";

const LOCATION_HISTORY_MAX_LENGTH = 100;

export class Coordinates extends React.Component {

    constructor (args) {
        super(args);
        this.state = {
            markers: [],
            origin: SEATTLE_CENTER_FIELD_COORDS,
            currentLocation: SEATTLE_CENTER_FIELD_COORDS,
            coords: {
                x: 0,
                y: 0
            },
            waypoints :[ SEATTLE_CENTER_FIELD_COORDS ]
        };
    }
    setCoords(coords) {
        let newLocation = {
            lat: this.state.origin.lat + coords.y/M_PER_DEGREE.lat,
            lng: this.state.origin.lng + coords.x/M_PER_DEGREE.lng
        };
        if(newLocation.lat == this.state.currentLocation.lat && newLocation.lng == this.state.currentLocation.lng) {
            // didn't move.
            return;
        }
        this.state.markers.unshift({
            position: newLocation
        });
        this.setState({
            coords: coords,
            currentLocation: newLocation
        });
    }
    render () {
        const {state} = this;
        let width = getComputedStyle(document.body).width;
        return (
            <div>
                <h3 style={{width:'200px',textAlign:'center'}}>{this.state.coords.x},{this.state.coords.y}</h3>
                <GoogleMaps containerProps={{
                              style: {
                                width: width,
                                height: '500px'
                              }
                            }}
                            ref='map'
                            googleMapsApi={ window.google && google.maps || null}
                            zoom={19}
                            center={this.state.origin}>
                    {state.markers.map(getMarkerMapperWithIcon(Coordinates.LOCATION_MARKER))}

                    {state.waypoints.map(getMarkerMapperWithIcon(Coordinates.WAYPOINT_MARKER))}
                </GoogleMaps>
            </div>
        );

        function getMarkerMapperWithIcon(icon)
        {
            return (marker, index) => {
                icon.fillOpacity = 1/(index+1);
                return (
                    <Marker
                        position={marker.position}
                        key={marker.key}
                        icon={icon}/>
                );
            }
        }
    }

    static get LOCATION_MARKER () {
        return {
            path: window.google ? google.maps.SymbolPath.CIRCLE : null,
            fillColor: 'red',
            scale: 2.5,
            fillOpacity: 1,
            strokeColor: 'white',
            strokeWeight: 1
        };
    }

    static get WAYPOINT_MARKER () {
        return {
            path: window.google ? google.maps.SymbolPath.CIRCLE : null,
            fillColor: 'orange',
            scale: 4.5,
            fillOpacity: 1,
            strokeColor: 'white',
            strokeWeight: 1
        };
    }
}