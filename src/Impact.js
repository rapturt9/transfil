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
import './App.css';

class Impact extends Component {
    render() {
        return (
            <Container className="body" style={{ paddingTop: "2em" }}>
  <Segment placeholder>
    <Grid columns={2} stackable textAlign='center'>
      <Divider vertical>And</Divider>

      <Grid.Row verticalAlign='middle'>
        <Grid.Column>
          <Header icon>
            <Icon name='dollar sign' />
            0 dollars gained
          </Header>
        </Grid.Column>

        <Grid.Column>
          <Header icon>
            <Icon name='tree' />
            0 trees planted
          </Header>
        </Grid.Column>
      </Grid.Row>
    </Grid>
  </Segment>
  </Container>
    );
}
}

export default Impact;