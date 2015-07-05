import React from 'react';

export class SliderTextInput extends React.Component {

    constructor() {
        super(arguments);

        this.state = {
            value: this.props.initialValue || 0
        }

        this._className = (this.props.className || '') + ' slider-text-input';
    }


    static get defaultProps() {
        return {
            name: 'sliderTextInput',
            label: 'Slider!',
            value: 0,
            onChange: null,
            min: 0,
            max: 100
        };
    }

    render() {
        return (
            <div className={this._className}>
                <label>{this.props.label}</label>
                <input ref='text'
                       type='text'
                       value={this.props.value}
                       onChange={this.onInputChanged.bind(this)}/>
                <input ref='slider'
                       type='range'
                       min={this.props.min}
                       max={this.props.max}
                       value={this.props.value}
                       onChange={this.onInputChanged.bind(this)}
                       step={1}/>
            </div>
        );
    }

    onInputChanged(event) {
        let val = event.target.value;
        if (this.props.max && (val > this.props.max)) {
            val = this.props.max;
        } else if (this.props.min && (val < this.props.min)) {
            val = this.props.min;
        }
        this.setState({
            value: val
        });
        // TODO I think there's a better way to do this.
        if(this.props.onChange) {
            this.props.onChange(event);
        }
    }
}

