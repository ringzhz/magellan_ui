import React from 'react';

export class VisionMast extends React.Component {

    constructor() {
        super(arguments);

        this.state = {
            distance: 0,
            lightLevel: 0,
            coneX: null,
            angle: 0
        };
    }

    render() {
        return (
            <div>
                <h7>Distance: </h7>
                <span>{this.state.distance}</span>
                <br />
                <h7>Light Level: </h7>
                <span>{this.state.lightLevel}</span>
                <br />
                <h7>Cone X: </h7>
                <span>{this.state.coneX}</span>
                <br />
                <h7>Angle: </h7>
                <span>{this.state.angle}</span>
                <br />
            </div>
        );
    }

    setState(state) {
        super.setState({
            lightLevel: (state.lightLevel || 0).toFixed(2),
            distance: (state.distance || 0).toFixed(2)
        });
    }
}


