import React from 'react';

export class S3Status extends React.Component {
    constructor() {
        super(arguments);
        this.state = {
            s3Status: 'Disconnected' //TODO: Enumify
        };
    }

    render() {
        return (
            <div className="s3-status">
                <h2>S3 Pilot Board Status</h2>
                <code>{this.state.s3Status}</code>
            </div>
        );
    }

    setS3Status(s3Status) {
        this.setState({
            s3Status: s3Status
        });
    }
}
