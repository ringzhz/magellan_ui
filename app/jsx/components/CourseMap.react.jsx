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

export class CourseMap extends React.Component {

    constructor (args) {
        super(args);

        this.state = {
            locationHistory: [],
            origin: CourseMap.STARTING_COORDS,
            currentLocation: CourseMap.STARTING_COORDS,
            coords: {
                x: 0,
                y: 0
            },
            locationHistory: [{
                time: new Date(),
                position: CourseMap.STARTING_COORDS
            }]
        };
    }
    addLatestCoord(coords) {
        let newLocation = {
            lat: this.state.origin.lat + coords.y/M_PER_DEGREE_LAT,
            lng: this.state.origin.lng + coords.x/M_PER_DEGREE_LNG
        };
        if(newLocation.lat == this.state.currentLocation.lat && newLocation.lng == this.state.currentLocation.lng) {
            // didn't move.
            return;
        }
        this.state.locationHistory.push({
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
    render () {
        const {state} = this;
        const googleMapsApi = "undefined" !== typeof google ? google.maps : null;

        let locationMarkers = MapMarker.fromLocationHistory(state.locationHistory);
        //FIXME
        window.locationMarkers = locationMarkers;
        return (
            <div className="theMap">
                <h3 style={{width:'200px',textAlign:'center'}}>{this.state.coords.x},{this.state.coords.y}</h3>
                <GoogleMaps
                    id="theMap"
                    containerProps={{
                      style: {
                        width: "300px",
                        height: "500px"
                      }
                    }}
                    ref="map"
                    googleMapsApi={googleMapsApi}
                    zoom={19}
                    center={state.origin}>
                    <OriginMarker position={state.origin} ref="originMarker" icon={MapMarker.ORIGIN_ICON}/>
                    {locationMarkers}
                </GoogleMaps>
            </div>
        );
    }

    static get STARTING_COORDS() {
        return {
            lat: 47.620505,
            lng: -122.351178
        };
    }
}