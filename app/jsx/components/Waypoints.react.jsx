import React from 'react/addons';
import {GoogleMaps, Marker} from 'react-google-maps';
import _ from 'lodash';

export class Waypoints extends React.Component {

    constructor(args) {
        super(args);
        this.state = {
            waypoints: [{
                lat: 47.6207,
                lng: -122.3511
            }, {
                lat: 47.6207,
                lng: -122.351
            }, {
                lat: 47.62017,
                lng: -122.3511
            }, {
                lat: 47.6205,
                lng: -122.3511
            }, {
                lat: 47.6205,
                lng: -122.35098
            }, {
                lat: 47.6203,
                lng: -122.35114
            }, {
                lat: 47.6204,
                lng: -122.35113
            }, {
                lat: 47.6206,
                lng: -122.3512
            }, {
                lat: 47.62024,
                lng: -122.351
            }],
            draggingId: null
        };
    }

    render() {
        let text = '';
        let id = 0;
        this.state.waypoints.forEach((waypoint) => {
            waypoint.id = id++;
            text += waypoint.lat + ', ' + waypoint.lng + '\n';
        });
        return (
            <div>
                <h3 style={{width:'200px',textAlign:'center'}}>waypoints</h3>
                <textarea
                    ref="textArea"
                    value={text}
                    onChange={this.textAreaDidChange.bind(this)}
                    rows="15"
                    cols="25" />
                <ol>
                    {_.map(this.state.waypoints, this.renderWaypoint.bind(this))}
                </ol>
            </div>
        );
    }

    //why doesn't that work?
    //setState(state) {
    //    super.setState(arguments);
    //
    //    if (('function' === typeof this.props.onWaypointsChange) && state.waypoints) {
    //        this.props.onWaypointsChange(state.waypoints);
    //    }
    //}

    textAreaDidChange(evt) {
        let txt = evt.target.value;
        let lines = txt.split('\n');
        let waypoints = _.chain(lines).map((line) => {
            let coords = line.split(',');
            if (coords && coords.length === 2) {
                try {
                    return {
                        lat: Number(coords[0]),
                        lng: Number(coords[1])
                    };
                } catch (error) {
                    console.log('Couldn\'t parse coordinate: ' + coords);
                    console.error(error);
                }
                return null;
            }
        }).filter((coord) => {
            return !!coord;
        }).value();
        this.setState({waypoints});
        if (('function' === typeof this.props.onWaypointsChange)) {
            this.props.onWaypointsChange(waypoints);
        }
    }

    renderWaypoint(waypoint) {
        let className = 'waypoint' + (this.state.draggingId === waypoint.id ? ' dragging' : '');

        return (
            <li
                className={className}
                item={waypoint}
                data={this.state.waypoints}
                data-id={waypoint.id}
                draggable={true}
                onDragEnd={this.dragEnd.bind(this)}
                onDragOver={this.dragOver.bind(this)}
                onDragStart={this.dragStart.bind(this)}
                >{waypoint.lat}&nbsp;{waypoint.lng}</li>
        );
    }

    getWaypoints() {
        return this.state.waypoints;
    }


    sort(items, draggingId) {
        this.state.draggingId = draggingId;
        this.setState({
            waypoints: items
        });
        if (('function' === typeof this.props.onWaypointsChange)) {
            this.props.onWaypointsChange(items);
        }
    }

    update(to, from) {
        if(to === from) {
            return;
        }

        console.log('to: '+to);
        console.log('from: '+from);
        var data = this.state.waypoints;
        data.splice(to, 0, data.splice(from, 1)[0]);
        this.sort(data, to);
    }
    move(over, append) {
        var to = +over.dataset.id;
        var from = this.state.draggingId;
        if (append) to++;
        if (from < to) to--;

        this.update(to, from);
    }



    dragStart(evt) {
        //didn't work when i used setState . . . why?
        this.state.draggingId = +evt.currentTarget.dataset.id;

        evt.dataTransfer.effectAllowed = 'move';
        try {
            evt.dataTransfer.setData('text/html', null);
        } catch (ex) {
            evt.dataTransfer.setData('text', '');
        }
    }

    dragOver(evt) {
        evt.preventDefault();
        var over = evt.currentTarget;
        if(+over.dataset.id === this.state.draggingId) {
            return;
        }
        var relX = evt.clientX - over.getBoundingClientRect().left;
        var relY = evt.clientY - over.getBoundingClientRect().top;
        var height = over.offsetHeight / 2;
        var placement = this.placement ? this.placement(relX, relY, over) : relY > (5 + height);
        this.move(over, placement);
    }

    dragEnd(evt) {
        this.setState({
            draggingId: null
        });

        this.sort(this.state.waypoints);
    }


}