import React from "react/addons";
import {GoogleMaps, Marker} from "react-google-maps";

const {update} = React.addons;

export class Coordinates extends React.Component {

    constructor (args) {
        super(args);
        this.state = {
            markers: [],
            origin: {
                lat: 47.620505,
                lng: -122.351178
            },
            currentLocation: {
                lat: 47.620505,
                lng: -122.351178
            },
            coords: {
                x: 0,
                y: 0
            }
        };
    }

    /*
     * This is called when you click on the map.
     * Go and try click now.
     */
    _handle_map_click (event) {
        var {markers} = this.state;
        markers = update(markers, {
            $push: [
                {
                    position: event.latLng,
                    key: Date.now(),// Add a key property for: http://fb.me/react-warning-keys
                },
            ],
        });
        this.setState({ markers });
        this.setState({origin: event.latLng});
        this.refs.map.panTo(event.latLng);
    }

    _handle_marker_rightclick (index, event) {
        /*
         * All you modify is data, and the view is driven by data.
         * This is so called data-driven-development. (And yes, it's now in
         * web front end and even with google maps API.)
         */
        var {markers} = this.state;
        markers = update(markers, {
            $splice: [
                [index, 1]
            ],
        });
        this.setState({ markers });
    }
    setCoords(coords) {
        let newLocation = {
            lat: this.state.origin.lat + coords.y/1000,
            lng: this.state.origin.lng + coords.x/1000
        };
        if(newLocation.lat == this.state.currentLocation.lat && newLocation.lng == this.state.currentLocation.lng) {
            // didn't move.
            return;
        }
        this.state.markers.push({
            position: newLocation
        });
        this.setState({
            coords: coords,
            currentLocation: newLocation
        });
    }
    render () {
        const {props, state} = this,
            {googleMapsApi, otherProps} = props;
        const circle ={
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: 'red',
            fillOpacity: .4,
            scale: 4.5,
            strokeColor: 'white',
            strokeWeight: 1
        };

        return (
            <div>
                <h3 style={{width:'200px',textAlign:'center'}}>{this.state.coords.x},{this.state.coords.y}</h3>
                <GoogleMaps containerProps={{
                              otherProps,
                              style: {
                                width: "300px",
                                height: "500px"
                              }
                            }}
                            ref="map"
                            googleMapsApi={
                              "undefined" !== typeof google ? google.maps : null
                            }
                            zoom={19}
                            center={this.state.origin}
                            onClick={this._handle_map_click.bind(this)}>
                    {state.markers.map(toMarker, this)}
                </GoogleMaps>
            </div>
        );

        function toMarker (marker, index) {
            return (
                <Marker
                    position={marker.position}
                    key={marker.key}
                    onRightclick={this._handle_marker_rightclick.bind(this, index)}
                    icon={circle} />
            );
        }
    }
}