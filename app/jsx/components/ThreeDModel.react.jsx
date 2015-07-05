import React from 'react';
import {THREE} from 'three';
import {Scene,PerspectiveCamera,Object3D,Mesh,Line} from 'react-three';
var assetpath = function (filename) {
    return '/vendor/' + filename;
};

// thx Izzimach.
// stolen largely from https://github.com/Izzimach/react-three/blob/master/examples/cupcake/cupcake.js
let boxgeometry = new THREE.BoxGeometry(400, 250, 100);
let cylindergeometry = new THREE.CylinderGeometry(100, 100, 100, 50, 50, false);
let MeshFactory = React.createFactory(Mesh);
class ThreeDBot extends React.Component {
    constructor() {
        super(arguments);
    }

    render() {
        return (
            <Object3D quaternion={this.props.quaternion} position={this.props.position || new THREE.Vector3(0, 0, 0)}>
                {MeshFactory({position: new THREE.Vector3(-100, -200, 0), geometry: cylindergeometry, material: new THREE.MeshNormalMaterial()})}
                {MeshFactory({position: new THREE.Vector3(100, -200, 0), geometry: cylindergeometry, material: new THREE.MeshNormalMaterial()})}
                {MeshFactory({position: new THREE.Vector3(0, 0, 0), geometry: boxgeometry, material: new THREE.MeshNormalMaterial()})}
                {MeshFactory({position: new THREE.Vector3(100, 200, 0), geometry: cylindergeometry, material: new THREE.MeshNormalMaterial()})}
                {MeshFactory({position: new THREE.Vector3(-100, 200, 0), geometry: cylindergeometry, material: new THREE.MeshNormalMaterial()})}
            </Object3D>
        );
    }
}

class Grid extends React.Component {

    render() {
        var size = 100000, step = 100;
        var geometry = new THREE.Geometry();
        var material = new THREE.LineBasicMaterial({color: 'green'});
        for ( var i = - size; i <= size; i += step){
            geometry.vertices.push(new THREE.Vector3( -size, -100, i ));
            geometry.vertices.push(new THREE.Vector3( size, -100, i ));

            geometry.vertices.push(new THREE.Vector3( i, -100, -size ));
            geometry.vertices.push(new THREE.Vector3( i, -100, size ));
        }
        var line = new THREE.Line( geometry, material, THREE.LinePieces);
        return (
            <Line geometry={line.geometry} material={material} mode={THREE.LinePieces} />
        );
    }
}
;

const PI = 3.14;
export class ThreeDModel extends React.Component {
    constructor() {
        super(arguments);
        this.state = {};//TODO
        this.state.botProps = {
            position: new THREE.Vector3(0, 0, 0),
            quaternion: new THREE.Quaternion(),
            expanded: false
        };
    }
    componentDidMount() {
        let rotationangle = 0;

        let botProps = this.state.botProps;

        function demo(t) {
            rotationangle = t * 0.001;
            botProps.quaternion.setFromEuler(new THREE.Euler(PI/2,0,rotationangle));
            botProps.position.x = 300 * Math.sin(rotationangle);
            botProps.position.z = 300 * Math.cos(rotationangle);

            this.setState({botProps})

            requestAnimationFrame(demo.bind(this));
        }

        demo.bind(this)();

        let wrapperWidth = this.refs.wrapper.getDOMNode().offsetWidth;
        this.setState({
            canvasWidth: wrapperWidth - 20
        })
    }

    render() {
        let buttonLabel = this.state.expanded ? '-' : '+';
        let w = this.state.canvasWidth || 100, h = 500;
        let aspectratio = w / h;

        let cameraLocation = {
            x: 700,
            y: 800,
            z: 200
        }

        let toggleContents = this.state.expanded ? (
            <Scene className="three-d-scene" width={w} height={h} camera="maincamera">
                <PerspectiveCamera name="maincamera"
                                   fov={75}
                                   aspect={aspectratio}
                                   near={1}
                                   far={5000}
                                   position={new THREE.Vector3(cameraLocation.x,cameraLocation.z,cameraLocation.y)}
                                   lookat={new THREE.Vector3(0,0,0)}
                    />
                <ThreeDBot ref="bot" quaternion={this.state.botProps.quaternion}
                         position={this.state.botProps.position}/>
                <Grid />
            </Scene>
        ) : null;

        return (
            <div ref="wrapper" className="expandable">
                <h3>3D View</h3>
                <button className="expando-button" onClick={this.expando.bind(this)}>{buttonLabel}</button>
                {toggleContents}
            </div>
        );
    }

    expando() {
        this.setState({
            expanded: !this.state.expanded
        });
    }
}
