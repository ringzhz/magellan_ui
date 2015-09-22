import React from 'react/addons';
import {GoogleMaps, Marker} from 'react-google-maps';
import _ from 'lodash';

export class Waypoints extends React.Component {

    constructor (args) {
        super(args);
        this.state = {
            waypoints :[{
                lat: 47.6207,
                lng: -122.3511
            }, {
                lat: 47.6207,
                lng: -122.351
            }, {
                lat: 47.62017,
                lng: -122.3511
            }]
        };
    }
    render () {
        return (
            <div>
                <h3 style={{width:'200px',textAlign:'center'}}>waypoints</h3>
                <textarea ref="textArea" onChange={this.textAreaDidChange.bind(this)} />
                <ol>
                    {_.map(this.state.waypoints, this.renderWaypoint)}
                </ol>
            </div>
        );
    }

    textAreaDidChange(evt) {
        let txt = evt.target.value;
        let lines = txt.split('\n');
        let waypoints = _.chain(lines).map((line) => {
            let coords = line.split(',');
            if(coords && coords.length === 2) {
                try {
                    return {
                        lat: Number(coords[0]),
                        lng: Number(coords[1])
                    };
                } catch(error) {
                    console.log('Couldn\'t parse coordinate: '+coords);
                    console.error(error);
                }
                return null;
            }
        }).filter((coord) => {
            return !!coord;
        }).value();
        this.setState({waypoints});
        if('function' === typeof this.props.onWaypointsChange) {
            this.props.onWaypointsChange(waypoints);
        }
    }

    renderWaypoint(waypoint) {
        return (
            <li className="waypoint">{waypoint.lat}, {waypoint.lng}</li>
        );
    }

    getWaypoints() {
        return this.state.waypoints;
    }
}