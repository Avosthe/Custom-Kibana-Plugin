import React, { Component, Fragment } from 'react'
import {
    EuiSpacer,
    EuiTabbedContent
} from "@elastic/eui";
import { Alerts } from "./Alerts";

export class AlertPanel extends Component {

    constructor(props) {
        super(props);
        this.httpClient = this.props.httpClient;

        this.tabs = [
            {
                id: 'msalerts_pending',
                name: 'Pending Alerts',
                content: (
                    <Fragment>
                        <EuiSpacer />
                        <Alerts httpClient={this.httpClient} status="pending" />
                    </Fragment>
                ),
            },
            {
                id: 'msalerts_addressed',
                name: 'Addressed Alerts',
                content: (
                    <Fragment>
                        <EuiSpacer />
                        <Alerts httpClient={this.httpClient} status="addressed" />
                    </Fragment>
                ),
            },
            {
                id: 'msalerts_ignored',
                name: 'Ignored Alerts',
                content: (
                    <Fragment>
                        <EuiSpacer />
                        <Alerts httpClient={this.httpClient} status="ignored" />
                    </Fragment>
                ),
            }
        ];
        setInterval(this.refreshNotifications, 20000);
        this.refreshNotifications();
    }

    refreshNotifications = async () => {
        this.httpClient.get("../api/absythe/getNotifiableAlerts").then(resp => {
            let data = resp.data;
            if(data !== undefined){
                if(data.length > 0){
                    this.httpClient.post("../api/absythe/sendNotifications", data).then(resp => {
                        console.log(resp.data);
                    });
                }
            }
        });
    }
        render() {
            return (
                <Fragment>
                    <EuiSpacer />
                    <EuiTabbedContent
                        tabs={this.tabs}
                        initialSelectedTab={this.tabs[0]}
                        expand={false}
                        className="customNavigation"
                    />
                </Fragment>
            )
        }
    }

    export default AlertPanel
