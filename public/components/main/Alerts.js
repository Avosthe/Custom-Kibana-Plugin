import React, { Component } from 'react'
import {
    EuiHealth,
    EuiInMemoryTable,
    EuiButton,
    EuiToolTip
} from "@elastic/eui"

export class Alerts extends Component {

    constructor(props) {
        super(props);
        this.httpClient = this.props.httpClient;
        this.state = {
            msalerts: [],
            currentAlert: null,
            loading: true,
            message: "Loading Micro-Service Alerts..."
        };
        this.getMsAlerts();
        setInterval(this.getMsAlerts, 10000);
    }

    componentWillReceiveProps(props) {
        this.props = props;
        this.getMsAlerts();
    }

    getMsAlerts = () => {
        this.httpClient.get(`../api/absythe/getMsAlerts?status=${this.props.status}`).then((resp) => {
            let data = resp.data;
            if (Array.isArray(data)) {
                this.setState({ msalerts: data, loading: false, message: "" });
            }
        });
    }

    onThreatAddressClick = async (e) => {
        let resp = await this.httpClient.get(`../api/absythe/msalerts/respond?id=${e.target.id}&respType=address`);
        if(resp !== undefined){
            console.log(resp);
        } else {
            console.log("resp undefined");
        }
    }
    
    onThreatIgnoreClick = async (e) => {
        let resp = await this.httpClient.get(`../api/absythe/msalerts/respond?id=${e.target.id}&respType=ignore`);
        if(resp !== undefined){
            console.log(resp);
        } else {
            console.log("resp undefined");
        }
    }

    render() {
        const columns = [
            {
                field: 'datetime',
                name: 'Date Time',
                render: datetime => {
                    let addLeadingZero = (val) => {
                        return val < 10 ? "0" + val : val;
                    }
                    let date = new Date(datetime);
                    return (
                        <div>
                            <span>{`${addLeadingZero(date.getHours())}:${addLeadingZero(date.getMinutes())}:${addLeadingZero(date.getSeconds())}`}</span>
                            <br />
                            <span>{`${date.toDateString()}`}</span>
                        </div>
                    );
                }
            },
            {
                field: 'threatLevel',
                name: 'Threat Level',
                render: threatLevel => {
                    threatLevel = threatLevel.charAt(0).toUpperCase() + threatLevel.slice(1);
                    let color;
                    switch (threatLevel) {
                        case "Low":
                            color = "subdued";
                            break;
                        case "Medium":
                            color = "warning";
                            break;
                        case "High":
                            color = "danger";
                            break;
                    }
                    return <EuiHealth color={color}>{threatLevel}</EuiHealth>;
                },
                sortable: true,
            },
            {
                field: 'description',
                name: 'Description',
                truncateText: true,
            },
            {
                field: 'source',
                name: 'Source IP : Port',
                render: source => {
                    return <strong>{source.ip} : {source.port}</strong>;
                },
                sortable: true
            },
            {
                field: 'destination',
                name: 'Destination IP : Port',
                render: destination => {
                    return <strong>{destination.ip} : {destination.port}</strong>;
                },
                sortable: true
            },
            {
                field: 'id',
                name: 'Threat Response',
                render: id => {
                    let targetAlert = this.state.msalerts.find(alert => {
                        return alert.id === id;
                    });
                    if (targetAlert.status === "pending") {
                        return (
                            <div class="euiFlexGroup euiFlexGroup--directionRow">
                                <div style={{ flexDirection: "row" }} class="euiFlexItem euiFlexItem--flexGrowZero">
                                    <button id={id} onClick={this.onThreatAddressClick} class="euiButton euiButton--danger euiButton--small euiButton--fill" type="button">
                                        <span id={id} onClick={this.onThreatAddressClick} class="euiButton__text">Address</span>
                                    </button>
                                    <button id={id} onClick={this.onThreatIgnoreClick} class="euiButton euiButton--primary euiButton--small euiButton--fill" type="button">
                                        <span id={id} onClick={this.onThreatIgnoreClick} class="euiButton__text">Ignore</span>
                                    </button>
                                </div>
                            </div>
                        );
                    } else if (targetAlert.status === "addressed") {
                        let addLeadingZero = (val) => {
                            return val < 10 ? "0" + val : val;
                        }
                        let date = new Date(targetAlert.response.dateTime);
                        return (<EuiToolTip
                            position="top"
                            content={
                                <div>
                                <p>
                                    Responded at:
                                    <br/>
                                    <span>{`${addLeadingZero(date.getHours())}:${addLeadingZero(date.getMinutes())}:${addLeadingZero(date.getSeconds())} | ${date.toDateString()}`}</span>
                                </p>
                                <br/>
                                <p>
                                    Responded by: {targetAlert.response.user}
                                </p>
                                </div>
                            }>
                            <EuiButton size="s" color="secondary">
                                Reponse Info
                            </EuiButton>
                        </EuiToolTip>);
                    }
                }
            }
        ];

        const search = {
            box: {
                incremental: true,
            },
            filters: [
                {
                    type: 'field_value_selection',
                    field: 'description',
                    name: 'Description',
                    multiSelect: false,
                    options: this.state.msalerts.map(alert => ({
                        value: alert.description,
                        name: alert.id,
                        view: `${alert.description}`,
                    })),
                },
            ],
        };

        const pagination = {
            initialPageSize: 5,
            pageSizeOptions: [3, 5, 8],
        };

        return (
            <div>
                <EuiInMemoryTable
                    items={this.state.msalerts}
                    itemId="id"
                    // error={this.state.error}
                    loading={this.state.loading}
                    message={this.state.message}
                    columns={columns}
                    search={search}
                    pagination={pagination}
                    sorting={true}
                    // selection={selection}
                    isSelectable={true}
                />
            </div>
        );


    }
}

export default Alerts
