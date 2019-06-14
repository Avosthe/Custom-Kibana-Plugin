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
    EuiTitle,
    EuiHealth   } 
from "@elastic/eui";

// Firewall Configuration
// Contains 4 inputs namely, Firewall Type, IP Address, Username + Password
// Also contains a button to submit the details
// Contains a circle icon (red/green) that indicates if an active, authenticated connection to the firewall can be established

export class FirewallConfiguration extends Component {

    constructor(props) {
        super(props);

        this.firewallOptions = [
            { value: "palo_alto", text: "Palo Alto Firewall" },
            { value: "cisco", text: "Cisco Firewall" },
            { value: "pfSense", text: "pfSense Firewall"}
        ]

        this.state = {
            firewallType: "palo_alto",
            firewallIpAddress: "",
            firewallUsername: "",
            firewallPassword: "",
            connected: false
        }
    }

    onInputChange = (e) => {
        var property = e.target.name;
        this.setState( { [property]: e.target.value} );
    }

    render() {
        const isConnected = this.state.connected;
        return (
            <Fragment>
                <EuiHealth color={ isConnected ? "success" : "danger" }></EuiHealth>
                <h3 style={{display: "inline-block"}}>{isConnected ? "Connected" : "Disconnected"}</h3>
                <EuiSpacer />
                <EuiForm>
                    <EuiFlexGroup style={{maxWidth: 600, flexWrap: "wrap", flexBasis: "initial"}}>
                    <EuiFlexItem style={{flexBasis: "initial"}}>
                    <EuiFormRow label="Firewall Type">
                        <EuiSelect
                            id={"firewallType"}
                            options={this.firewallOptions}
                            value={this.state.firewallType}
                            onChange={this.onInputChange}
                            name={"firewallType"}
                        />
                    </EuiFormRow>
                    </EuiFlexItem>
                    <EuiFlexItem style={{flexBasis: "initial"}}>
                    <EuiFormRow label="Firewall IP Address">
                        <EuiFieldText placeholder="eg. 192.168.1.1" value={this.state.firewallIpAddress} onChange={this.onInputChange} 
                        name="firewallIpAddress" />
                    </EuiFormRow>
                    </EuiFlexItem>
                    <EuiFlexItem style={{flexBasis: "initial"}}>
                        <EuiFormRow label="Firewall Username">
                            <EuiFieldText placeholder="eg. admin" value="" onChange={this.onInputChange} name="firewallUsername"/>
                        </EuiFormRow>
                    </EuiFlexItem>
                    <EuiFlexItem style={{flexBasis: "initial"}}>
                        <EuiFormRow label="Firewall Password">
                            <EuiFieldText placeholder="eg. password" value="" onChange={this.onInputChange} name="firewallPassword"/>
                        </EuiFormRow>
                    </EuiFlexItem>
                    </EuiFlexGroup>
                    <EuiSpacer />
                    <div style={{width: 600, textAlign: "center"}}>
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
