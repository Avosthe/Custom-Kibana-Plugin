import React, { Component, Fragment } from 'react';
import 
{   EuiForm,
    EuiSelect, 
    EuiFormRow,
    EuiFieldText,
    EuiFlexGroup,
    EuiFlexItem,
    EuiButton,
    EuiSpacer,
    EuiHealth,
    EuiFieldPassword   } 
from "@elastic/eui";

// Firewall Configuration
// Contains 4 inputs namely, Firewall Type, IP Address, Username + Password
// Also contains a button to submit the details
// Contains a circle icon (red/green) that indicates if an active, authenticated connection to the firewall can be established

export class FirewallConfiguration extends Component {

    constructor(props) {
        super(props);

        const { httpClient } = this.props;

        this.firewallOptions = [
            { value: "palo_alto", text: "Palo Alto Firewall" },
            { value: "cisco", text: "Cisco Firewall" },
            { value: "pfSense", text: "pfSense Firewall"}
        ]
        
        this.state = {
            firewall: {
                firewallType: "palo_alto",
                firewallIpAddress: "",
                firewallUsername: "",
                firewallPassword: ""
            },
            connected: false
        }

        httpClient.get('../api/absythe/firewallConfiguration').then( (resp) => {
            this.setState( {firewall: resp.data} );
        });
    }

    onInputChange = (e) => {
        var property = e.target.name;
        let newFirewall = Object.assign({}, this.state.firewall);
        newFirewall[property] = e.target.value;
        this.setState({firewall: newFirewall});
    }

    render() {
        const isConnected = this.state.connected;
        const { firewallType, firewallIpAddress, firewallUsername, firewallPassword } = this.state.firewall;
        return (
            <Fragment>
                <EuiHealth color={ isConnected ? "success" : "danger" }></EuiHealth>
                <h3 style={{display: "inline-block"}}>{isConnected ? "Connected" : "Disconnected"}</h3>
                <EuiSpacer />
                <EuiForm style={{width: 600}}>
                    <EuiFlexGroup>
                    <EuiFlexItem>
                    <EuiFormRow label="Firewall Type">
                        <EuiSelect
                            id={"firewallType"}
                            options={this.firewallOptions}
                            value={firewallType}
                            onChange={this.onInputChange}
                            name={"firewallType"}
                        />
                    </EuiFormRow>
                    </EuiFlexItem>
                    <EuiFlexItem>
                    <EuiFormRow label="Firewall IP Address">
                        <EuiFieldText placeholder="eg. 192.168.1.1" value={firewallIpAddress} onChange={this.onInputChange} 
                        name="firewallIpAddress" />
                    </EuiFormRow>
                    </EuiFlexItem>
                    </EuiFlexGroup>
                    <EuiFlexGroup>
                    <EuiFlexItem>
                        <EuiFormRow label="Firewall Username">
                            <EuiFieldText placeholder="eg. admin" value={firewallUsername} onChange={this.onInputChange} name="firewallUsername"/>
                        </EuiFormRow>
                    </EuiFlexItem>
                    <EuiFlexItem>
                        <EuiFormRow label="Firewall Password">
                            <EuiFieldPassword placeholder="eg. password" value={firewallPassword} onChange={this.onInputChange} name="firewallPassword"/>
                        </EuiFormRow>
                    </EuiFlexItem>
                    </EuiFlexGroup>
                    <EuiSpacer />
                    <div style={{textAlign: "center"}}>
                        <EuiButton type="submit">
                            Save
                        </EuiButton>
                    </div>
                </EuiForm>
            </Fragment>
        )
    }
}

export default FirewallConfiguration
