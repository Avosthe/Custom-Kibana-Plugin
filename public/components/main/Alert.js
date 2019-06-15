import React, { Component, Fragment} from 'react'
import {
    EuiSpacer,
    EuiText
} from "@elastic/eui";

export class Alert extends Component {
    render() {
        return (
            <Fragment>
                <EuiSpacer />
                <EuiText>
                    This tab will display all the security alerts generated with our custom micro-service.
                </EuiText>
            </Fragment>
        )
    }
}

export default Alert
