import React, { Component, Fragment } from 'react'
import {
    EuiTabbedContent,
    EuiTitle,
    EuiText,
    EuiSpacer,
  } from '@elastic/eui';
import FirewallConfiguration from "./FirewallConfiguration";


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
                  <FirewallConfiguration />
                </Fragment>
              ),
            },
            {
              id: 'alerts',
              name: 'Alerts Panel',
              content: (
                <Fragment>
                  <EuiSpacer />
                  <EuiTitle>
                    <h3>Alerts Panel</h3>
                  </EuiTitle>
                  <EuiSpacer />
                  <EuiText>
                    This tab will display all the security alerts generated with our custom micro-service.
                  </EuiText>
                </Fragment>
              ),
            },
            {
              id: 'notification',
              name: 'Notification Setup',
              content: (
                <Fragment>
                  <EuiSpacer />
                  <EuiTitle>
                    <h3>Notification Setup</h3>
                  </EuiTitle>
                  <EuiSpacer />
                  <EuiText>
                    This tab allows network administrators to configure the communication vectors when a security alert is being generated.
                  </EuiText>
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
              onTabClick={tab => {
                console.log('clicked tab', tab);
              }}
              className="customNavigation"
            />
          );
    }
}

export default CustomNavigation
