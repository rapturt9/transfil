import React, { Component, useMemo, useCallback } from "react";
import secrets from "./secrets.js";
import { AWSIoTProvider } from "@aws-amplify/pubsub/lib/Providers";
import Landing from "./Landing.js";
import Impact from './Impact.js';
import Security from './Security.js';
import PropTypes from "prop-types";
import { BrowserRouter, Route, withRouter, Link } from "react-router-dom";
import {
  Form,
  Button,
  Message,
  Segment,
  Divider,
  Progress,
  Header,
  Icon,
  Reveal,
  Input,
  Grid,
  Image,
  Dimmer,
  Loader,
  Transition,
  Checkbox
} from "semantic-ui-react";
import { useDropzone } from "react-dropzone";
import axios from 'axios';
import "./App.css";
import SetPassword from './SetPassword.js';
import Amplify, { API, Auth,PubSub } from "aws-amplify";
import Login from './Login.js';
import Signup from './Signup.js';
import awsconfig from './aws-exports';


Amplify.configure(awsconfig);

const apiName = awsconfig["aws_cloud_logic_custom"][0].name;
const apiS3 = awsconfig["aws_cloud_logic_custom"][1].name;

const path = "/items";
const s3path="/items/object"

Amplify.addPluggable(
  new AWSIoTProvider({
    aws_pubsub_region: secrets.region,
    aws_pubsub_endpoint: secrets.aws_pubsub_endpoint,
  })
);

class App extends Component {

  render() {
    return (
      <BrowserRouter>
        <Route exact path="/">
        
          <Landing />
        </Route>
        <Route exact path="/login">
          <Login />
        </Route>
        <Route exact path="/signup">
          <Signup />
        </Route>
        <Route exact path="/impact">
          <Impact />
        </Route>
        <Route exact path="/security">
          <Security />
        </Route>
        <Route path="/room/:id">
          <Transfered />
        </Route>
      </BrowserRouter>
    );
  }
}

function download(url, filename) {
  fetch(url).then(function(t) {
      return t.blob().then((b)=>{
          var a = document.createElement("a");
          a.href = URL.createObjectURL(b);
          a.setAttribute("download", filename);
          a.click();
      }
      );
  });
}

var subscription;

class Transfer extends Component {
  state = {
    access: null,
    uploads: [],
    uploading: [],
    rerender: 0,
    progress: {},
    error: false,
    password: "",
    jiggle:0,
    auth:false,
    send: false,
    filesToSend:[],
    to:"",
    warning: false
  };

  static propTypes = {
    location: PropTypes.object.isRequired,
  };



  componentDidMount = async () => {
    Auth.currentAuthenticatedUser().then(res=>{
      console.log(res.attributes);
      this.setState({auth: res.attributes.email_verified});
    });
    subscription = PubSub.subscribe("uploads/" + this.props.match.params.id).subscribe({
      next: (data) => {
        if (data.value.finish) {
          let arr = this.state.uploading;
          let index = arr.indexOf(data.value.name);
          if (index !== false) {
            arr.splice(index, 1);
          }
          this.setState({ uploading: arr });
          API.get(
            apiS3,
            s3path + "/" + this.props.match.params.id,
            {
              queryStringParameters: {
                // OPTIONAL
                password: this.state.password,
                type:"list"
              },
            }
          ).then(response=>{
            if(response.password === false){
              this.setState({jiggle:this.state.jiggle+1});
            } else {
              this.setState({uploads:response.Contents});
            }
          })
        }
        if (!data.value.finish) {
          if (data.value.name === false) {
            this.setState({ uploads: [] });
          } else {
            let arr = this.state.uploading;
            if (!arr.includes(data.value.name)) {
              arr.push(data.value.name);
            }
            this.setState({ uploading: arr });
          }
        }
      },
      error: (error) => console.error(error),
      close: () => console.log("Done"),
    });
    const response = await API.get(
      apiS3,
      s3path +"/"+ this.props.match.params.id,
      {
        queryStringParameters: {
          // OPTIONAL
          password: "",
          type:"list"
        },
      }
    );
      console.log(response);
    let access = !(response.password === false);
    this.setState({ access: access });
    if (access) {

        this.setState({ uploads: response.Contents });
    }
  };

  componentWillUnmount() {
    subscription.unsubscribe();
  }

  sendFiles = type => {
    console.log(type);
    console.log(this.state.filesToSend);
    console.log(this.state.to);
    API.get(apiS3,"/send/" + this.props.match.params.id,{
      queryStringParameters: {
        // OPTIONAL
        to:this.state.to,
        password: this.state.password,
        type:type, 
        files:this.state.filesToSend.join(","),
        link:window.location.href
      },
    }).then(res=>{
      console.log(res);
    });
  }

  onChange = (files) => {
    this.setState({ rerender: this.state.rerender + 1 });
    for (let i = 0; i < files.length; i++) {
      let file = files[i];
      API.get(
        apiS3,
        s3path + "/" + this.props.match.params.id,
        {
          queryStringParameters: {
            // OPTIONAL
            password: this.state.password,
            type:"putObject", 
            item:file.name,
            content: file.type
          },
        }
      ).then(res=>{
        if(res.password === false){
          this.setState({jiggle:this.state.jiggle+1});
          return;
        } 
        console.log(res);
        const config = {
          headers: {
            "Content-Type": file.type,
          },
          onUploadProgress: (progressEvent)=> {
            var percentCompleted = (progressEvent.loaded / progressEvent.total)
            let obj = this.state.progress;
            obj[file.name] = percentCompleted;
            console.log(obj);
            this.setState({ progress: obj });
          }
        }
      
        axios.put(res, file, config)
          .then(() => console.log(PubSub.publish("uploads/" + this.props.match.params.id, {
            finish: true,
            name: file.name,
          })))
          .catch(err => console.log(err))
      });
    }
  };

  downloadAll = () => {
    this.state.uploads.forEach((file) => {
      API.get(
        apiS3,
        s3path+"/"+this.props.match.params.id,
        {
          queryStringParameters: {
            // OPTIONAL
            password: this.state.password,
            type:"getObject",
            item:file.Key.substring(
              this.props.match.params.id.length + 1
            ),
          },
        }
      ).then(res=>{
        if(res.password === false){
          this.setState({jiggle:this.state.jiggle+1});
          return;
        } 
        console.log(res);
        download(res,file.Key.substring(
          this.props.match.params.id.length + 1
        ));
      });
    });
  };

  deleteAll = () => {
    this.state.uploads.forEach((file) => {
      API.get(
        apiS3,
        s3path + "/" + this.props.match.params.id,
        {
          queryStringParameters: {
            // OPTIONAL
            password: this.state.password,
            type:"delete",
            item:file.Key.substring(
              this.props.match.params.id.length + 1
            )
          },
        }
      ).then((result) => {
        if(result.password === false){
          this.setState({jiggle:this.state.jiggle+1});
          return;
        } 
        })
        .catch((err) => console.log(err));
    });
    console.log(PubSub.publish("uploads/" + this.props.match.params.id, {
      finish: false,
      name: false,
    }));
    this.setState({ uploads: [] });
  };

  render() {
    if(this.state.access===null){
      return(
        <Segment style={{height:"90vh", marginTop:"5vh", marginLeft:"5vw",marginRight:"5vw"}}>
      <Dimmer active inverted>
        <Loader size='large'>Loading</Loader>
      </Dimmer>
    </Segment>
      )
    }
    if (!this.state.access) {
      return (
        <Grid
          textAlign="center"
          style={{ height: "100vh" }}
          verticalAlign="middle"
        >
          <Grid.Column style={{ maxWidth: 450 }}>
            <Header as="h2" color="teal" textAlign="center">
              <Image src="/logo.png" /> This room is protected.
            </Header>
            <Form
              size="large"
              onSubmit={() => {
                API.get(
                  apiS3,
                  s3path + "/" + this.props.match.params.id,
                  {
                    queryStringParameters: {
                      // OPTIONAL
                      password: this.state.password,
                      type:"list"
                    },
                  }
                )
                  .then((response) => {
                    let access =
                      !(response.password===false);

                      console.log(response);
                    if (access) {
                      this.setState({access: access, uploads: response.Contents});
                    } else {
                      this.setState({shake: true,access: access, password:""});
                      setTimeout(()=>{ this.setState({shake:false}); }, 820);
                    }
                  })
                  .catch((error) => {
                    console.log(error.response);
                  });
              }}
            >
              <Segment stacked>
                <Form.Input
                 type="tel" id="cc-number" autoComplete="off"
                 
                  className={this.state.shake?"apply-shake":""}
                  fluid
                  icon="lock"
                  iconPosition="left"
                  placeholder="Type the password to enter"
                  type="password"
                  onChange={(e) => this.setState({ password: e.target.value })}
                  value={this.state.password}
                />

                <Button color="teal" fluid size="large">
                  Enter
                </Button>
              </Segment>
            </Form>
          </Grid.Column>
        </Grid>
      );
    }
    return (
      <div style={{ padding: "2em" }}>
        <div id="fixeddiv2">
          {!this.state.auth?<Link to="/login"><Button positive content="Danger">Sign in</Button></Link>:this.state.uploads.length > 0 ?!this.state.send?<div><Link to="/"><Button negative onClick={()=>Auth.signOut()}>Log out</Button></Link><Button primary icon labelPosition='right' onClick={()=>{
            this.setState({send:true})
          }}>Send Files<Icon name='right arrow' /></Button></div>:<div><Link to="/"><Button negative onClick={()=>Auth.signOut()}>Log out</Button></Link><Button negative icon labelPosition='right' onClick={()=>{
            this.setState({send:false})
          }}>Cancel Send<Icon name='right arrow' /></Button></div>:<Link to="/"><Button negative onClick={()=>Auth.signOut()}>Log out</Button></Link>}
        </div>
        <div id="fixeddiv">
          <SetPassword disabled={!this.state.auth} jiggle={this.state.jiggle} password={this.state.password} onSubmit={password=>{
            this.setState({password:password});
            API
            .post(apiName, path, {
              body: {
                  room: this.props.match.params.id,
                  password: password,
                  ttl:Math.floor(Date.now() / 1000)+86400
              },
          })
            .catch(error => {
              console.log(error.response);
           });
          }}/>
                

        </div>

        <center>
          {this.state.uploads.length > 0 ? (
            <>
              <Header as="h3">Download files</Header>
              <Segment.Group>
                {this.state.uploads.map((file, i) => {
                  return (
                    <Segment
                      style={{ color: "#0645AD",width:"80%"}}
                      key={i}
                    >
                      {this.state.send?<Checkbox toggle checked={this.state.filesToSend.includes(file.Key)} style={{float:"left"}} onChange={()=>{
                        let arr = this.state.filesToSend;
                        console.log(arr);
                        if(arr.includes(file.Key)){
                          arr.splice(arr.indexOf(file.Key),1);
                        } else {
                          arr.push(file.Key);
                        }
                        this.setState({filesToSend:arr});
                      }} />:null}
                      <a onClick={() => {
                        API.get(
                          apiS3,
                          s3path+"/"+this.props.match.params.id,
                          {
                            queryStringParameters: {
                              // OPTIONAL
                              password: this.state.password,
                              type:"getObject",
                              item:file.Key.substring(
                                this.props.match.params.id.length + 1
                              ),
                            },
                          }
                        ).then(res=>{
                          if(res.password === false){
                            this.setState({jiggle:this.state.jiggle+1});
                            return;
                          } 
                          download(res.uploadURL,file.Key.substring(
                            this.props.match.params.id.length + 1
                          ));
                        });
                            }
                      }>
                      {file.Key.substring(
                        this.props.match.params.id.length + 1
                      )}
                      </a>
                    </Segment>
                  );
                })}
              </Segment.Group>
            </>
          ) : null}
          {this.state.uploading.length > 0 ? (
            <Segment.Group style={{ marginTop: "1em" }}>
              {this.state.uploading.map((file, i) => {
                return (
                  <Segment disabled key={i}>
                    {file}
                  </Segment>
                );
              })}
            </Segment.Group>
          ) : null}
          {this.state.uploads.length > 0 && this.state.send?(<><Button.Group fluid>
              <Button color='facebook' onClick={()=>this.sendFiles('sms')} onMouseEnter={()=>this.setState({warning:true})} onMouseLeave={()=>this.setState({warning:false})}>
      <Icon name='mobile alternate' /> SMS
    </Button>
    <Button.Or onMouseEnter={()=>this.setState({warning:true})} onMouseLeave={()=>this.setState({warning:false})}/>
    <Button color='grey' onMouseEnter={()=>this.setState({warning:true})} onMouseLeave={()=>this.setState({warning:false})} onClick={()=>this.sendFiles('whatsapp')}>
      <Icon name='whatsapp' /> Whatsapp (beta)
    </Button>
    <Button.Or />
    <Button color='google plus'  onClick={()=>this.sendFiles('email')}>
      <Icon name='mail' /> Email
    </Button>
            </Button.Group>
            <br/>
            {this.state.warning?<Message warning>
    <Message.Header>Sending the message over text will only send your current URL</Message.Header>
  </Message>:null}
            <br/>
              <Input fluid value={this.state.to} placeholder="Recipient (include country code)" onChange={e=>this.setState({to:e.target.value})} />
<br/><br/></>):null}
            {this.state.uploads.length > 0?(
            <Button.Group fluid>
              <Button positive onClick={this.downloadAll}>
                Download all files
              </Button>
              <Button.Or />
              <Button negative onClick={this.deleteAll}>
                Delete all files
              </Button>
            </Button.Group>
          ) : null}
          {this.state.uploads.length > 0 ? <Divider /> : null}
          <Header as="h3" style={{ marginBottom: ".5em" }}>
            Upload files
          </Header>
        </center>
        <StyledDropzone onChange={this.onChange} key={this.state.rerender} />
        {this.state.error ? (
          <Message
            onDismiss={() => {
              this.setState({ error: false });
            }}
            error
            header="There was some errors with your upload"
            list={[
              "Make sure the file is downloaded to your computer and not in iCloud drive",
              "Additionally, you need to stay on the page and your wifi should be stable",
              "Reload the page and try again",
            ]}
          />
        ) : null}
        {Object.keys(this.state.progress).map((key) => {
          return this.state.progress[key] === 1 ? (
            <ProgressBar name={key} key={key} />
          ) : (
            <Progress
              key={key}
              progress
              percent={Math.round(this.state.progress[key] * 1000) / 10}
            >
              {key}
            </Progress>
          );
        })}
      </div>
    );
  }
}

class ProgressBar extends Component {
  state = { visible: true };

  componentDidMount = () => {
    setTimeout(() => {
      this.setState({ visible: false });
    }, 2000);
  };

  render() {
    if (this.state.visible) {
      return (
        <Progress progress percent={100} success>
          {this.props.name}
        </Progress>
      );
    }

    return <></>;
  }
}

const baseStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "20px",
  borderWidth: 2,
  borderRadius: 2,
  borderColor: "#eeeeee",
  borderStyle: "dashed",
  backgroundColor: "#fafafa",
  color: "#bdbdbd",
  outline: "none",
  transition: "border .24s ease-in-out",
};

const activeStyle = {
  borderColor: "#2196f3",
};

const acceptStyle = {
  borderColor: "#00e676",
};

const rejectStyle = {
  borderColor: "#ff1744",
};

function StyledDropzone(props) {
  const onDrop = useCallback(acceptedFiles => {
    props.onChange(acceptedFiles);
  }, [])
  
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({onDrop});

  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isDragActive ? activeStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {}),
    }),
    [isDragActive, isDragReject, isDragAccept]
  );

  return (
    <div className="container">
      <div {...getRootProps({ style })}>
        <input
          {...getInputProps()}
          onChange={(e) => props.onChange(e.target.files)}
        />
        <p>Drag 'n' drop some files here, or click to select files</p>
      </div>
      <br />
    </div>
  );
}

const Transfered = withRouter(Transfer);

export default App;
