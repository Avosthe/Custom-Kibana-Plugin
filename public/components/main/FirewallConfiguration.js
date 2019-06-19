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
    EuiDescriptionList,
    EuiDescriptionListTitle,
    EuiDescriptionListDescription,
}
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
                firewallPassword: "",
                firewallApiKey: ""
            },
            connected: false,
            formButton: this.formButton,
            isFirewallInfoModalVisible: false,
            firewallInfo: null
        }

        this.httpClient.get('../api/absythe/initialFirewallQuery').then((resp) => {
            this.setState({ firewall: resp.data });
            if (this.state.firewall.firewallApiKey === "") {
                if (this.state.firewall.firewallIpAddress != "" && this.state.firewall.firewallUsername != "" && this.state.firewall.firewallPassword != "") {
                    this.getFirewallApiKey();
                }
            } else {
                this.getFirewallInfo().then((resp) => {
                    if (resp === 1) {
                        this.setState({ connected: true });
                    }
                    else {
                        this.getFirewallApiKey();
                    }
                });
            }
        });
    }

    getFirewallInfo = async () => {
        let resp = await this.httpClient.get(`../api/absythe/firewallCommand?firewallIpAddress=${this.state.firewall.firewallIpAddress}&firewallApiKey=${this.state.firewall.firewallApiKey}&firewallCommand=showSysInfo`);
        if (!Object.keys(resp).includes("error")) {
            let firewallInfo = resp.data.response.result[0].system[0];
            let firewallInfoArray = [];
            const keys = Object.keys(firewallInfo);
            for(const key of keys) {
                firewallInfoArray.push({ title: key, description: firewallInfo[key][0]});
            }
            this.setState( {firewallInfo: firewallInfoArray} );
            return 1;
        }
        return 0;
    }

    getFirewallApiKey = async () => {
        const { firewallUsername, firewallPassword, firewallIpAddress } = this.state.firewall;
        let resp = await this.httpClient.get(`../api/absythe/getFirewallApiKey?firewallUsername=${firewallUsername}&firewallPassword=${firewallPassword}&firewallIpAddress=${firewallIpAddress}`);
        resp = resp.data;
        if (!Object.keys(resp).includes("error")) {
            let newFirewall = Object.assign({}, this.state.firewall);
            newFirewall["firewallApiKey"] = resp.firewallApiKey;
            this.setState({ firewall: newFirewall, connected: true })
            this.httpClient.post('../api/absythe/setFirewallConfiguration', this.state.firewall);
        } else {
            this.setState({ connected: false });
        }
    }

    onInputChange = (e) => {
        var property = e.target.name;
        let newFirewall = Object.assign({}, this.state.firewall);
        newFirewall[property] = e.target.value;
        this.setState({ firewall: newFirewall });
    }

    onSubmitButtonClick = () => {
        this.setState({ formButton: this.loadingSpinner });
        this.getFirewallApiKey();
        if (this.state.connected === true) {
            this.getFirewallInfo();
        }
        this.httpClient.post('../api/absythe/setFirewallConfiguration', this.state.firewall).then((resp) => {
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
