import React, {Component} from 'react'
import {
  Button,
  Divider,
  Grid,
  Header,
  Icon,
  Container,
  Segment,
} from 'semantic-ui-react'
import './App.css'

class Security extends Component {
    render() {
        return (
            <Segment className="body">
      <Header as='h2' style={{textAlign:"center"}}>Security</Header>
      <ul>
      <li>
        <a href="https://aws.amazon.com/s3/">AWS Simple Storage Service</a> is used to securely store the files with <a href="https://aws.amazon.com/cognito/">AWS Cognito</a> to provide authentication
      </li>
      <br/>
      <li>
        To further secure the regular rooms and especially password protected rooms, <a href="https://docs.aws.amazon.com/AmazonS3/latest/userguide/ShareObjectPreSignedURL.html">signed URLs</a> are used for every single file upload and download. That means for every action you make to our databases, your authorization to do that action is checked.
      </li>
      <br />
      <li>
          Passwords for users and rooms are stored in a separate secure database that even we can't access
      </li>
      </ul>
    </Segment>
    );
}
}

export default Security;