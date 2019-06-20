import React, { Component, Fragment } from 'react';
import {
    EuiForm,
    EuiSelect,
    EuiFormRow,
    EuiFieldText,
    EuiFlexGroup,
    EuiFlexItem,
    EuiButton,
    EuiSpacer,
    EuiHealth,
    EuiFieldPassword,
    EuiLoadingSpinner,
    EuiModal,
    EuiModalBody,
    EuiModalFooter,
    EuiModalHeader,
    EuiModalHeaderTitle,
    EuiOverlayMask,
    EuiDescriptionList
}
    from "@elastic/eui";
import { AST_ObjectGetter } from 'terser';

// Firewall Configuration
// Contains 4 inputs namely, Firewall Type, IP Address, Username + Password
// Contains a button to submit the details
// Contains a circle icon (red/green) that indicates if an active, authenticated connection to the firewall can be established

export class FirewallConfiguration extends Component {

    constructor(props) {
        super(props);

        const { httpClient } = this.props;
        this.httpClient = httpClient;
        this.formButton = <EuiButton type="submit" onClick={this.onSubmitButtonClick} fill={true}>Save</EuiButton>;
        this.loadingSpinner = <EuiLoadingSpinner size={"xl"} />;

        this.firewallOptions = [
            { value: "palo_alto", text: "Palo Alto Firewall" },
            { value: "cisco", text: "Cisco Firewall" },
            { value: "pfSense", text: "pfSense Firewall" }
        ]

        this.state = {
            firewall: {
                firewallType: "palo_alto",
                firewallIpAddress: "",
                firewallUsername: "",
                firewallPassword: ""
            },
            connected: false,
            formButton: this.formButton,
            isFirewallInfoModalVisible: false,
            firewallInfo: null,
        }

        this.httpClient.get('../api/absythe/isAuthenticated').then((resp) => {
            let data = resp.data;
            if(data.authenticated === 1) {
                this.setState( {connected: true} );
                this.sendFirewallCommand("showSysInfo").then((resp) => {
                    if(!Object.keys(resp).includes("error")){
                        this.setState( {firewallInfo: this.formatFirewallCommandResult("showSysInfo", resp)} );
                    }
            });
            }
            this.httpClient.get('../api/absythe/getFirewallConfiguration').then((resp) => {
                let data = resp.data;
                if(!Object.keys(data).includes("error")){
                    this.setState( {firewall: data} );
                }
            });
        });
    }

    sendFirewallCommand = async (firewallCommand) => {
        let resp = await this.httpClient.get(`../api/absythe/firewallCommand?firewallCommand=${firewallCommand}`);
        let data = resp.data;
        if(!Object.keys(data).includes("error")){
            return data;
        }
        return {error: data.error};
    }

    formatFirewallCommandResult = (command, input) => {
        switch(command){
            case "showSysInfo":
                let firewallInfo = input;             
                let firewallInfoArray = [];
                const keys = Object.keys(firewallInfo);
                for(const key of keys) {
                    firewallInfoArray.push({ title: key, description: firewallInfo[key][0]});
                }
                return firewallInfoArray;
            default:
                return {};
        }
    }

    onInputChange = (e) => {
        var property = e.target.name;
        let newFirewall = Object.assign({}, this.state.firewall);
        newFirewall[property] = e.target.value;
        this.setState({ firewall: newFirewall });
    }

    onSubmitButtonClick = async () => {
        this.setState({ formButton: this.loadingSpinner, firewallInfo: null, connected: false });
        this.httpClient.post('../api/absythe/authenticate', this.state.firewall).then((resp) => {
            let data = resp.data;
            if(!Object.keys(data).includes("error")){
                this.setState( {connected: true, firewall: data} );
                this.sendFirewallCommand("showSysInfo").then((resp) => {
                    if(!Object.keys(resp).includes("error")){
                        this.setState( {firewallInfo: this.formatFirewallCommandResult("showSysInfo", resp)} );
                    }
                });
            }
            else{
                this.setState( {connected: false} );
            }
            this.setState({ formButton: this.formButton });
        });
    }

    showFirewallInfoModal = () => {
        this.setState({ isFirewallInfoModalVisible: true });
    }

    closeFirewallInfoModal = () => {
        this.setState({ isFirewallInfoModalVisible: false });
    }

    generateFirewallInfo = () => {
        const { firewallInfo } = this.state;
        if(firewallInfo !== null){
            if(firewallInfo.length <= 1) {
                return (
                    <EuiFlexGroup>
                    <EuiFlexItem>
                        <EuiDescriptionList listItems={firewallInfo}>
                        </EuiDescriptionList>
                    </EuiFlexItem>
                    </EuiFlexGroup>
                );
            }
            let firewallInfoArray1 = firewallInfo.slice(0, (firewallInfo.length / 2) + 1);
            let firewallInfoArray2 = firewallInfo.slice((firewallInfo.length / 2) + 1);
            return (
                <EuiFlexGroup>
                <EuiFlexItem>
                    <EuiDescriptionList listItems={firewallInfoArray1}>
                    </EuiDescriptionList>
                </EuiFlexItem>
                <EuiFlexItem>
                    <EuiDescriptionList listItems={firewallInfoArray2}>
                    </EuiDescriptionList>
                </EuiFlexItem>
                </EuiFlexGroup>
            );
        }
    }

    render() {
        let firewallInfoModal;
        const { firewallType, firewallIpAddress, firewallUsername, firewallPassword } = this.state.firewall;

        if (this.state.isFirewallInfoModalVisible) {

            firewallInfoModal = (
                <EuiOverlayMask>
                    <EuiModal onClose={this.closeFirewallInfoModal} maxWidth={"900px"} style={{ width: "900px" }}>
                        <EuiModalHeader style={{ justifyContent: "center" }}>
                            <EuiModalHeaderTitle style={{ textDecoration: "underline" }}>Detailed Firewall Information</EuiModalHeaderTitle>
                        </EuiModalHeader>

                        <EuiModalBody>
                                {this.generateFirewallInfo()}
                        </EuiModalBody>
                        <EuiModalFooter>
                        </EuiModalFooter>
                    </EuiModal>
                </EuiOverlayMask>
            );
        }


        return (
            <Fragment>
                {firewallInfoModal}
                <div>
                    <EuiHealth color={this.state.connected ? "success" : "danger"}></EuiHealth>
                    <h3 style={{ display: "inline-block", marginRight: "15px", verticalAlign: "center" }}>{this.state.connected ? "Connected" : "Disconnected"}</h3>
                    <EuiButton isDisabled={this.state.connected ? false : true} fill color="danger" onClick={this.showFirewallInfoModal} size="s">Firewall Info</EuiButton>
                </div>
                <EuiSpacer />
                <EuiForm style={{ width: 600 }}>
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
                                <EuiFieldText placeholder="eg. admin" value={firewallUsername} onChange={this.onInputChange} name="firewallUsername" />
                            </EuiFormRow>
                        </EuiFlexItem>
                        <EuiFlexItem>
                            <EuiFormRow label="Firewall Password">
                                <EuiFieldPassword placeholder="eg. password" value={firewallPassword} onChange={this.onInputChange} name="firewallPassword" />
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
