import React from 'react';
import {
  EuiPage,
  EuiPageHeader,
  EuiTitle,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentHeader,
  EuiPageContentBody,
  EuiText,
  EuiSpacer
} from '@elastic/eui';
import { CustomNavigation } from "./customNavigation";

export class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    /*
       FOR EXAMPLE PURPOSES ONLY.  There are much better ways to
       manage state and update your UI than this.
    */
    const { httpClient } = this.props;
    httpClient.get('../api/absythe/example').then((resp) => {
      this.setState({ time: resp.data.time });
    });
  }
  render() {
    const { title } = this.props;
    return (
      <EuiPage>
        <EuiPageBody>
          <EuiPageHeader>
            <EuiTitle size="l">
              <h1>
                Capstone Micro-Service
              </h1>
            </EuiTitle>
          </EuiPageHeader>
          <EuiPageContent>
            <EuiPageContentHeader>
            </EuiPageContentHeader>
            <CustomNavigation httpClient={this.props.httpClient}/>
            <EuiSpacer/>
            <EuiSpacer/>
            <EuiPageContentBody>
              <EuiText>
                <h3>
                    You have successfully created your first Kibana Plugin!
                </h3>
                <p>
                    The server time (via API call) is {this.state.time || 'NO API CALL YET'}
                </p>
              </EuiText>
            </EuiPageContentBody>
          </EuiPageContent>
        </EuiPageBody>
      </EuiPage>
    );
  }
}
