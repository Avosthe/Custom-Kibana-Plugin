import React, { Component, Fragment } from 'react'
import {
    EuiTabbedContent,
    EuiTitle,
    EuiText,
    EuiSpacer,
    EuiIcon
  } from '@elastic/eui';
import FirewallConfiguration from "./FirewallConfiguration";
import NotificationSetup from "./NotificationSetup";
import AlertPanel from "./AlertPanel";


export class CustomNavigation extends Component {

    constructor(props){
        super(props);

        this.tabs = [
            {
              id: 'firewall_configuration',
              name: 'Firewall Configuration',
              content: (
                <Fragment>
                  <EuiSpacer />
                  <FirewallConfiguration httpClient={this.props.httpClient} />
                </Fragment>
              ),
            },
            {
              id: 'alerts',
              name: 'Alerts Panel',
              content: (
                <Fragment>
                  <EuiSpacer />
                  <AlertPanel httpClient={this.props.httpClient} />
                </Fragment>
              ),
            },
            {
              id: 'notification',
              name: 'Notification Setup',
              content: (
                <Fragment>
                  <EuiSpacer />
                  <NotificationSetup httpClient={this.props.httpClient} />
                </Fragment>
              ),
            },
            {
              id: 'firewall_control',
              name: 'Firewall Control',
              content: (
                <Fragment>
                  <EuiSpacer />
                  <EuiTitle>
                    <h3>Firewall Control</h3>
                  </EuiTitle>
                  <EuiSpacer />
                  <EuiText>
                    This tab allows network administrators to possess control over some core features of their Firewall.
                  </EuiText>
                </Fragment>
              ),
            },
            {
                id: 'logs',
                name: 'Action Logs',
                content: (
                  <Fragment>
                    <EuiSpacer />
                    <EuiTitle>
                      <h3>Action Logs</h3>
                    </EuiTitle>
                    <EuiSpacer />
                    <EuiText>
                      This tab contains logs of every action that is performed on the custom Kibana plugin.
                    </EuiText>
                  </Fragment>
                ),
              }
          ];
        }

    render() {
        return (
            <EuiTabbedContent
              tabs={this.tabs}
              initialSelectedTab={this.tabs[0]}
              expand={true}
              className="customNavigation"
            />
          );
    }
}

export default CustomNavigation
