import React, { PropTypes, Component } from 'react';
// import { Link } from 'react-router';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as TypeActions from 'redux/actions/TypeActions';

const Header = require('./Header');
const List = require('./List');

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(TypeActions, dispatch)
  };
}

@connect(({ i18n, type }) => ({ i18n, type }), mapDispatchToProps)
export default class Container extends Component {
  constructor(props) {
    super(props);
    this.pid = '';
  }

  static propTypes = {
    actions: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    i18n: PropTypes.object.isRequired,
    type: PropTypes.object.isRequired
  }

  async index() {
    await this.props.actions.index(this.pid);
    return this.props.type.ecode;
  }

  async create(values) {
    await this.props.actions.create(this.pid, values);
    return this.props.type.ecode;
  }

  async update(values) {
    await this.props.actions.update(this.pid, values);
    return this.props.type.ecode;
  }

  async del(id) {
    const { actions } = this.props;
    await actions.del(this.pid, id);
    return this.props.type.ecode;
  }

  async setSort(values) {
    await this.props.actions.setSort(this.pid, values);
    return this.props.type.ecode;
  }

  async setDefault(values) {
    await this.props.actions.setDefault(this.pid, values);
    return this.props.type.ecode;
  }

  componentWillMount() {
    const { location: { pathname='' } } = this.props;
    if (/^\/admin\/scheme/.test(pathname)) {
      this.pid = '$_sys_$';
    } else {
      const { params: { key } } = this.props;
      this.pid = key;
    }
  }

  render() {
    const { location: { pathname='' } } = this.props;
    const isSysConfig = /^\/admin\/scheme/.test(pathname);

    return (
      <div>
        <Header 
          isSysConfig={ isSysConfig }
          setSort={ this.setSort.bind(this) } 
          setDefault={ this.setDefault.bind(this) } 
          create={ this.create.bind(this) } 
          i18n={ this.props.i18n }
          { ...this.props.type }/>
        <List 
          isSysConfig={ isSysConfig }
          index={ this.index.bind(this) } 
          select={ this.props.actions.select } 
          update={ this.update.bind(this) } 
          del={ this.del.bind(this) } 
          delNotify={ this.props.actions.delNotify } 
          i18n={ this.props.i18n }
          { ...this.props.type }/>
      </div>
    );
  }
}
