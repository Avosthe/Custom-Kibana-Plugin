import React, { Component } from 'react'

export class Alerts extends Component {

    constructor(props) {
        super(props);
        this.httpClient = this.props.httpClient;
        this.status = this.props.status;
        this.state = {
            msalerts: [],
            currentAlert: null
        };

        this.getMsAlerts();
    }

    componentWillReceiveProps(props){
        this.status = props.status;
        this.getMsAlerts();
    }

    getMsAlerts = () => {
        this.httpClient.get(`../api/absythe/getMsAlerts?status=${this.status}`).then((resp) => {
            let data = resp.data;
            if (Array.isArray(data)) {
                this.setState({ msalerts: data });
                console.log(this.state.msalerts);
            }
        });
    }

    render() {
        return (
            <div>
                {this.status}
            </div>
        )
    }
}

export default Alerts
