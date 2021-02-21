import React from 'react'
import { Button, Form, Grid, Header, Image, Message, Segment } from 'semantic-ui-react'
import Amplify, { PubSub, API, Auth } from "aws-amplify";
import { Link,useHistory} from "react-router-dom";

const Login = () => {
    let history = useHistory();
  return (<Grid textAlign='center' style={{ height: '100vh' }} verticalAlign='middle'>
    <Grid.Column style={{ maxWidth: 450 }}>
      <Header as='h2' color='teal' textAlign='center'>
        <Image src='/logo.png' /> Log-in to your account
      </Header>
      <Form size='large' onSubmit={e=>{
          console.log(e.target[0].value);
          console.log(e.target[1].value);
                Auth.signIn({
                    username:e.target[0].value,
                    password:e.target[1].value,
                }).then(user=>{
                    console.log(user);
                    history.goBack();
                }
                ).catch(err=>{
                    console.log(err);
                });
            
        
      }
      }>
        <Segment stacked>
          <Form.Input fluid icon='user' iconPosition='left' placeholder='Username' />
          <Form.Input
            fluid
            icon='lock'
            iconPosition='left'
            placeholder='Password'
            type='password'
          />

          <Button color='teal' fluid size='large'>
            Login
          </Button>
        </Segment>
      </Form>
      <Message>
        New to us? <Link to='signup'>Sign Up</Link>
      </Message>
    </Grid.Column>
  </Grid>);
}

export default Login