import React from 'react';

export class Compass extends React.Component {
    constructor(props) {
        super(props);
        this.defaultProps = {
            initialHeading: 0
        }
        this.state = {
            initialHeading: 0,
            angle: 0
        };
    }
    //Compass Look
    //<polygon transform={"rotate("+this.state.angle+" 100 100)"}
    //         points="100,10 90,100 110,100" style={{fill:'orange',stroke:'black',strokeWidth:1}} />
    //<polygon transform={"rotate("+this.state.angle+" 100 100)"}
    //         points="100,190 90,100 110,100" style={{fill:'none',stroke:'black',strokeWidth:0.5}} />
    render() {
        return (
            <div className="compass">
                <h3 style={{width:'200px',textAlign:'center'}}>{this.state.angle}&#xb0;</h3>
                <svg height="200" width="200">
                    <circle cx="100" cy="100" r="95" stroke="black" strokeWidth="3" fill="none" />
                    <polygon transform={"rotate("+this.state.angle+" 100 100)"}
                             points="100,10 85,30 95,30 95,100 105,100 105,30 115,30" style={{fill:'red',stroke:'black',strokeWidth:'1'}} />
                </svg>
                <br />
                <label htmlFor="InitialHeading">Initial Heading: </label>
                <input type="text" name="initialHeading" ref="initHeadingInput" onKeyUp={this.handleKeyUp.bind(this)}/>
            </div>
        );
    }
    setAngle(angle) {
        var realAngle = (+this.state.initialHeading + angle) % 360.0;
        this.setState({
            angle: realAngle
        });
    }
    setInitialHeading(initialHeading) {
        this.setState({
            initialHeading: initialHeading,
            angle: initialHeading
        });
    }
    handleKeyUp(evt) {
        if(!evt || !evt.target || !evt.target.value) {
            return;
        }
        var initialHeading = evt.target.value;
        this.setInitialHeading(initialHeading);
    }
}