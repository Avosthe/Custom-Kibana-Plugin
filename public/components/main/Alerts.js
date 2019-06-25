import React, { Component } from 'react'
import {
    EuiHealth,
    EuiInMemoryTable
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

    componentWillReceiveProps(props){
        this.props = props;
        this.getMsAlerts();
    }

    getMsAlerts = () => {
        this.httpClient.get(`../api/absythe/getMsAlerts?status=${this.props.status}`).then((resp) => {
            let data = resp.data;
            if (Array.isArray(data)) {
                this.setState({ msalerts: data, loading: false, message: "" });
                console.log(this.state.msalerts);
            }
        });
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
                field: 'srcIp',
                name: 'Source IP',
                sortable: true
            },
            {
                field: 'destIp',
                name: 'Destination IP',
                sortable: true,
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
