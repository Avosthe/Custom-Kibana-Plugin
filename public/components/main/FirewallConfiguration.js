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
    EuiFieldPassword,
    EuiLoadingSpinner   } 
from "@elastic/eui";

// Firewall Configuration
// Contains 4 inputs namely, Firewall Type, IP Address, Username + Password
// Contains a button to submit the details
// Contains a circle icon (red/green) that indicates if an active, authenticated connection to the firewall can be established

export class FirewallConfiguration extends Component {

    constructor(props) {
        super(props);

        const { httpClient } = this.props;
        this.httpClient = httpClient;
        this.formButton = <EuiButton type="submit" onClick={this.onClick} fill={true}>Save</EuiButton>;
        this.loadingSpinner = <EuiLoadingSpinner size={"xl"} />;

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
                firewallPassword: "",
                firewallApiKey: ""
            },
            connected: false,
            formButton: this.formButton
        }

        this.httpClient.get('../api/absythe/initialFirewallQuery').then( (resp) => {
            this.setState( {firewall: resp.data} );
            if (this.state.firewall.firewallApiKey === "") {
                if (this.state.firewall.firewallIpAddress != "" && this.state.firewall.firewallUsername != "" &&  this.state.firewall.firewallPassword != "") {
                    this.getFirewallApiKey();
                }
            } else {
                this.httpClient.get(`../api/absythe/testFirewallApiKey?firewallIpAddress=${this.state.firewall.firewallIpAddress}&firewallApiKey=${this.state.firewall.firewallApiKey}`).then( (resp) => {
                    if (resp.data.success === 1){
                        this.setState( {connected: true} );
                    }
                    else {
                        this.getFirewallApiKey();
                    }
                })
            }
        });
    }

    getFirewallApiKey = async () => {
        const { firewallUsername, firewallPassword, firewallIpAddress } = this.state.firewall;
        let resp = await this.httpClient.get(`../api/absythe/getFirewallApiKey?firewallUsername=${firewallUsername}&firewallPassword=${firewallPassword}&firewallIpAddress=${firewallIpAddress}`);
        resp = resp.data;
        if (!Object.keys(resp).includes("error")) {
            let newFirewall = Object.assign({}, this.state.firewall);
            newFirewall["firewallApiKey"] = resp.firewallApiKey;
            this.setState( {firewall: newFirewall, connected: true} )
            this.httpClient.post('../api/absythe/setFirewallConfiguration', this.state.firewall);
        } else {
            this.setState( {connected: false} );
        }
    }

    onInputChange = (e) => {
        var property = e.target.name;
        let newFirewall = Object.assign({}, this.state.firewall);
        newFirewall[property] = e.target.value;
        this.setState({firewall: newFirewall});
    }

    onClick = () => {
        this.setState({formButton: this.loadingSpinner});
        this.getFirewallApiKey();
        this.httpClient.post('../api/absythe/setFirewallConfiguration', this.state.firewall).then((resp) => {
            this.setState({formButton: this.formButton});
        });
    }

    render() {
        const { firewallType, firewallIpAddress, firewallUsername, firewallPassword } = this.state.firewall;
        return (
            <Fragment>
                <EuiHealth color={ this.state.connected ? "success" : "danger" }></EuiHealth>
                <h3 style={{display: "inline-block"}}>{this.state.connected ? "Connected" : "Disconnected"}</h3>
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
                    <EuiFlexGroup justifyContent={"center"} alignItems={"center"}>
                        <EuiFlexItem grow={null}>
                            {this.state.formButton}
                        </EuiFlexItem>
                    </EuiFlexGroup>
                </EuiForm>
            </Fragment>
        )
    }
}

export default FirewallConfiguration
