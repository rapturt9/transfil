import React, { useState, useEffect} from "react";
import { Link,useHistory} from "react-router-dom";
import {  Auth } from "aws-amplify";
import {
  Container,
  Form,
  Input,
  Header,
  Image,
  Segment,
  Button,
  Message,
} from "semantic-ui-react";
import "./App.css";

function Landing() {
  let history = useHistory();


  const [value, setValue] = useState("");
  const [auth, setAuth] = useState("");
  useEffect(() => {
    Auth.currentAuthenticatedUser().then(res=>{
      console.log(res);
      console.log(res.attributes.email_verified);
      setAuth(res.attributes.email_verified);
    });
  }, []);

  const [message, setMessage] = useState(0);

  const onChange = (event) => {
    setValue(event.target.value);
  };
  return (
    <Container style={{ paddingTop: "2em" }}>
      {!auth?<Link to="/login"><Button fluid positive content="Danger">Sign in</Button></Link>:<Button fluid negative onClick={()=>{
          Auth.signOut();
          window.location.reload();
        }}>Log out</Button>}
      <center style={{marginTop:"1em"}}>
        <Segment placeholder>
          <Header as="h2">
            <Image circular src="./logo.png" onMouseEnter={() => setMessage(5)}/>
            <Header.Content>
              Transfer your files{" "}
              <i className="hover" onMouseEnter={() => setMessage(1)}>
                fast
              </i>
              ,{" "}
              <i className="hover" onMouseEnter={() => setMessage(2)}>
                securely
              </i>
              ,{" "}
                <i className="hover" onMouseEnter={() => setMessage(3)}>
                  for free
                </i>
              
                , and{" "}
                <i className="hover" onMouseEnter={() => setMessage(4)}>
                  for a cause
                </i>
              <Header.Subheader>
                Choose the same room for all the devices to get started!
              </Header.Subheader>
            </Header.Content>
          </Header>
          <br />
          <Form
            onSubmit={() => {
              history.push("room/" + value);
            }}
          >
            <Form.Field inline>
              <Header>Choose Room</Header>
              <Input value={value} onChange={onChange} />
            </Form.Field>
          </Form>
        </Segment>
        {message !== 0 ? (
          <>
          <Message positive>
            {message === 1 ? (
              <Message.Header>
                Up to 10 times faster downloading and uploading speed than
                google drive
              </Message.Header>
            ) : message === 2 ? (
              <Message.Header>
                <a target="_blank" href="/security">Secure databases</a> hosted on Amazon Web Services, files
                automatically deleted after 1 day, and ability to choose a
                password 
                </Message.Header>
            ) : message === 3 ? (
              <Message.Header>
                No need to log in or pay any money, though logging in will allow you to set passwords
              </Message.Header>
            ) : message === 4 ? (
              <Message.Header>
                For every 5 dollars this website makes, we will <a target="_blank" href="/impact">plant a tree</a>
              </Message.Header>
            ) : message === 5 ? (
              <Message.Header>
                Our goal is to simplify the file transfering process.
              </Message.Header>
            ):null}
          </Message>
          {message === 2? (
            <Message positive>
              <Message.Header>Additionally, if you pay a one time fee of 5 dollars, you can send the files using messages, whatsapp, or gmail
</Message.Header>
            </Message>
          ):null}
          </>
        ) : null}
      </center>
    </Container>
  );
}
export default Landing;
