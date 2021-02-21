import React, { Component } from 'react'
import { Form, Grid, Image, Transition, Input, Reveal, Button, Icon } from 'semantic-ui-react'

const transitions = [
  'shake',
  'pulse',
]

const options = transitions.map((name) => ({
  key: name,
  text: name,
  value: name,
}))

export default class SetPassword extends Component {
  state = { animation: transitions[1],duration: 500, visible: true,password:this.props.password, jiggle:this.props.jiggle}

  handleChange = (e, { name, value }) => this.setState({ [name]: value })
  toggleVisibility = () =>
    this.setState((prevState) => ({ animation:transitions[1],visible: !prevState.visible }))

  componentDidUpdate=(prevProps, prevState)=>{
    if(prevProps.disabled!==this.props.disabled){

      this.setState({});
    }
    if(prevProps.jiggle!==this.props.jiggle){
        this.setState({jiggle:this.props.jiggle });
    }
    if(prevState.jiggle!==this.state.jiggle){
        this.setState((prevState) => ({ animation:transitions[0],visible: !prevState.visible }));
    }
  }

  render() {
    const { animation, duration, visible } = this.state

    return (
        <Reveal disabled={this.props.disabled} animated="move" instant style={{position:"absolute"}}>
            <Reveal.Content visible>
            <Transition
            animation={animation}
            duration={duration}
            visible={visible}
          >
              <Button icon fluid type="tel" id="cc-number" autoComplete="off" disabled={this.props.disabled}>
                Set Password{"  "}
                <Icon name="key" />
              </Button>
              </Transition>
            </Reveal.Content>
            <Reveal.Content hidden>
              <Form
                onSubmit={() => {
                    this.props.onSubmit(this.state.password);
                    this.toggleVisibility();
                }}
              >
                <Form.Field>
                <Transition
            animation={animation}
            duration={duration}
            visible={visible}
          >
                  <Input
                    size="small"
                    onChange={(e) => {
                      this.setState({ password: e.target.value });
                    }}
                    value={this.state.password}
                    placeholder={this.props.disabled?"":"Enter to set"}
                    className="input"
                    style={{ width: "9.8em" }}
                  />
                  </Transition>
                </Form.Field>
              </Form>
            </Reveal.Content>
          </Reveal>

    );
  }
}