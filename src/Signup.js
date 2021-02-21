import React, {useState} from 'react'
import { Button, Form, Grid, Header, Image, Message, Segment } from 'semantic-ui-react'
import Amplify, { PubSub, API, Auth } from "aws-amplify";
import { Link,useHistory} from "react-router-dom";

function Signup  ()  {
    let history = useHistory();
    const [signed, setSigned] = useState(false);
    if(signed){
        return (
            <Grid textAlign='center' style={{ height: '100vh' }} verticalAlign='middle'>
              <Grid.Column style={{ maxWidth: 450 }}>
                <Header as='h2' color='teal' textAlign='center'>
                  <Image src='/logo.png' /> Sign up
                </Header>
                <Form size='large' onSubmit={e=>{
                    Auth.confirmSignUp(e.target[0].value, e.target[1].value).then(user=>{
                        console.log(user);
                    }
                    ).catch(err=>{
                        console.log(err);
                    });
                    console.log(e.target[0].value);
                    console.log(e.target[1].value);
                    history.push("/");
                }
                }>
                  <Segment stacked>
                    <Form.Input fluid icon='user' iconPosition='left' placeholder='Username' />
                    <Form.Input fluid icon='check' iconPosition='left' placeholder='Verification Code' />
          
                    <Button color='teal' fluid size='large'>
                      Send
                    </Button>
                  </Segment>
                </Form>
              </Grid.Column>
            </Grid>
        );
    }
    return (
  <Grid textAlign='center' style={{ height: '100vh' }} verticalAlign='middle'>
    <Grid.Column style={{ maxWidth: 450 }}>
      <Header as='h2' color='teal' textAlign='center'>
        <Image src='/logo.png' /> Sign up
      </Header>
      <Form size='large' onSubmit={e=>{
        console.log(e.target[0].value);
        console.log(e.target[1].value);
              Auth.signUp({
                  username:e.target[0].value,
                  password:e.target[2].value,
                  attributes: {
                      email: e.target[1].value
                  }
              }).then(user=>{
                  console.log(user);
              }
              ).catch(err=>{
                  console.log(err);
              });
          
            
        
      }
      }>
        <Segment stacked>
          <Form.Input fluid icon='user' iconPosition='left' placeholder='Username' />
          <Form.Input fluid icon='mail' iconPosition='left' placeholder='Email address' />
          <Form.Input
            fluid
            icon='lock'
            iconPosition='left'
            placeholder='Password'
            type='password'
          />

          <Button color='teal' fluid size='large'>
            Sign up
          </Button>
        </Segment>
      </Form>
      <Message>
        Got verification code? <a onClick={
            ()=>{
                setSigned(true);
            }
        }>Click Here</a>
      </Message>
    </Grid.Column>
  </Grid>
    );
    }

export default Signup