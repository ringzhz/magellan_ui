import React from 'react/addons';
import {GoogleMaps, Marker} from 'react-google-maps';
import {MapMarker} from './MapMarker.react.jsx';
import {OriginMarker} from './OriginMarker.react.jsx';

const {update} = React.addons;

// Values From: http://www.csgnetwork.com/degreelenllavcalc.html
// @ 47.620487� Lat (Seattle)
// https://www.google.com/maps/@47.620467,-122.351169,19z
const M_PER_DEGREE_LAT = 111182.90059994154;
const M_PER_DEGREE_LNG = 75170.9948697914;

const MAX_LOCATION_MARKERS = 100;

export class CourseMap extends React.Component {
    constructor(args) {
        super(args);

        this.state = {
            origin: CourseMap.STARTING_COORDS,
            currentLocation: CourseMap.STARTING_COORDS,
            coords: {
                x: 0,
                y: 0
            },
            locationHistory: [{
                time: new Date(),
                position: CourseMap.STARTING_COORDS
            }],
            waypoints: []
        };
    }

    render() {
        let {state} = this;
        const googleMapsApi = "undefined" !== typeof google ? google.maps : null;

        let locationMarkers = MapMarker.fromLocationHistory(state.locationHistory);
        let waypointMarkers = MapMarker.fromWaypoints(state.waypoints);
        let formattedCoords = this.state.coords.x.toPrecision(2) + ',' + this.state.coords.y.toPrecision(2);


        // onClick={this.onClick.bind(this)}>
        // zoom={19}

        return (
            <div className="theMap">
                <h3>{formattedCoords}</h3>
                <GoogleMaps
                    id="theMap"
                    containerProps={{
                      style: {
                        width: "100%",
                        height: "500px"
                      }
                    }}
                    ref="map"
                    googleMapsApi={googleMapsApi}
                    tilt={0}
                    zoom={23}
                    mapTypeId={google.maps.MapTypeId.SATELLITE}
                    draggable={false}
                    panControl={false}
                    zoomControl={false}
                    scrollwheel={false}
                    navigationControl={false}
                    streetViewControl={false}
                    mapTypeControl={false}
                    disableDoubleClickZoom={true}
                    onClick={this.props.onClick}
                    center={state.origin}>
                    <OriginMarker position={state.origin} ref="originMarker" icon={MapMarker.ORIGIN_ICON}/>
                    {locationMarkers}
                    {waypointMarkers}
                </GoogleMaps>
            </div>
        );
    }

    getLatestCoord() {
        let locationHistory = this.state.locationHistory;
        if (!locationHistory) {
            return this.state.origin;
        }
        return locationHistory[locationHistory.length - 1].position;
    }

    addLatestCoord(coords) {
        let newLocation = this.metersFromOriginToLatLng(coords);
        if (newLocation.lat == this.state.currentLocation.lat && newLocation.lng == this.state.currentLocation.lng) {
            // didn't move.
            return;
        }
        let locationHistory = this.state.locationHistory;
        while (locationHistory.length > MAX_LOCATION_MARKERS) {
            locationHistory.shift();
        }
        locationHistory.push({
            position: newLocation,
            time: new Date()
        });
        //FIXME
        window.locationHistory = this.state.locationHistory;
        this.setState({
            coords: coords,
            currentLocation: newLocation,
            locationHistory: this.state.locationHistory //hmm
        });
    }

    metersFromOriginToLatLng(mFromOrigin) {
        return {
            lat: this.state.origin.lat + mFromOrigin.y / M_PER_DEGREE_LAT,
            lng: this.state.origin.lng + mFromOrigin.x / M_PER_DEGREE_LNG
        }
    }

    latLngToMetersFromOrigin(latLng) {
        //TODO: this shouldn't know about no stinking cones.
        return {
            x: (latLng.lng - this.state.origin.lng) * M_PER_DEGREE_LNG,
            y: (latLng.lat - this.state.origin.lat) * M_PER_DEGREE_LAT,
            isCone: !!latLng.isCone
        };
    }

    setWaypoints(waypoints) {
        this.setState({waypoints});
    }

    static get STARTING_COORDS() {
        return {
            lat: 47.620505,
            lng: -122.351178
        };
    }
}