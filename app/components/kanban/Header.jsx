import React, { PropTypes, Component } from 'react';
import { Button, DropdownButton, ControlLabel, MenuItem, Nav, NavItem, ButtonGroup, OverlayTrigger, Popover, Grid, Row, Col } from 'react-bootstrap';
import _ from 'lodash';
 
const CreateIssueModal = require('../issue/CreateModal');
const CreateKanbanModal = require('./config/CreateModal');
const EditKanbanModal = require('./config/EditModal');

const $ = require('$');
const moment = require('moment');
const img = require('../../assets/images/loading.gif');

export default class Header extends Component {
  constructor(props) {
    super(props);
    this.state = { hideHeader: false, createIssueModalShow: false, createKanbanModalShow: false };
    this.getQuery = this.getQuery.bind(this);
    this.changeModel = this.changeModel.bind(this);
  }

  async componentWillReceiveProps(nextProps) {
    const { index, selectFilter, curKanban } = nextProps;
    if (this.props.curKanban.id != curKanban.id || !_.isEqual(this.props.curKanban.query, curKanban.query)) {
      await selectFilter('all');
      index(this.getQuery(curKanban.query || {}));
    }
  }

  static propTypes = {
    i18n: PropTypes.object.isRequired,
    changeModel: PropTypes.func.isRequired,
    model: PropTypes.string.isRequired,
    selectedFilter: PropTypes.string.isRequired,
    create: PropTypes.func.isRequired,
    createKanban: PropTypes.func.isRequired,
    createSprint: PropTypes.func.isRequired,
    project: PropTypes.object,
    curKanban: PropTypes.object,
    kanbans: PropTypes.array,
    sprints: PropTypes.array,
    loading: PropTypes.bool,
    goto: PropTypes.func,
    selectFilter: PropTypes.func,
    index: PropTypes.func,
    options: PropTypes.object
  }

  createIssueModalClose() {
    this.setState({ createIssueModalShow: false });
  }

  createKanbanModalClose() {
    this.setState({ createKanbanModalShow: false });
  }

  changeKanban(eventKey) {
    if (eventKey === 'create') {
      this.setState({ createKanbanModalShow: true });
    } else {
      const { goto } = this.props;
      goto(eventKey, 'issue');
    }
  }

  getQuery(globalQuery, filterQuery) {
    const gq = globalQuery || {};
    const fq = filterQuery || {};

    const multiValFields = [ 'type', 'priority', 'state', 'resolution', 'assignee', 'reporter', 'module' ];
    const newQuery = {};
    _.forEach(multiValFields, (val) => {
      if (fq[val] && fq[val].length > 0 && gq[val] && gq[val].length > 0) {
        newQuery[val] = _.intersection(fq[val], gq[val]);
        if (newQuery[val].length <= 0) {
          newQuery[val] = [ 'notexists' ];
        }
      } else {
        if (gq[val] && gq[val].length > 0) {
          newQuery[val] = gq[val];
        }
        if (fq[val] && fq[val].length > 0) {
          newQuery[val] = fq[val];
        }
      }
    });

    if (newQuery.type && _.head(newQuery.type) !== 'notexists' && gq.subtask) {
      const subtaskTypes = _.map(_.filter(this.props.options.types, { type: 'subtask' }), (v) => v.id);
      if (subtaskTypes.length > 0) {
        newQuery.type = _.union(newQuery.type, subtaskTypes); 
      }
    }

    if (gq.created_at && fq.created_at) {
      if (gq.created_at == '1w' || fq.created_at == '1w') {
        newQuery['created_at'] = '1w';
      } else if (gq.created_at == '2w' || fq.created_at == '2w') {
        newQuery['created_at'] = '2w';
      } else {
        newQuery['created_at'] = '1m';
      }
    } else {
      newQuery['created_at'] = gq.created_at || fq.created_at;
    }

    if (gq.updated_at && fq.updated_at) {
      if (gq.updated_at == '1w' || fq.updated_at == '1w') {
        newQuery['updated_at'] = '1w';
      } else if (gq.updated_at == '2w' || fq.updated_at == '2w') {
        newQuery['updated_at'] = '2w';
      } else {
        newQuery['updated_at'] = '1m';
      }
    } else {
      newQuery['updated_at'] = gq.updated_at || fq.updated_at;
    }

    return _.mapValues(newQuery, (v) => { if (_.isArray(v)) { return v.join(','); } else { return v; } });
  }

  async handleSelect(selectedKey) {
    const { index, curKanban, selectFilter } = this.props;
    await selectFilter(selectedKey);
    index(this.getQuery(curKanban.query || {}, selectedKey === 'all' ? {} : curKanban.filters[selectedKey].query || {}));
  }

  showHeader() {
    this.setState({ hideHeader: false });
    const winHeight = $(window).height();
    $('.board-container').css('height', winHeight - 120 - 50);
  }

  hideHeader() {
    this.setState({ hideHeader: true });
    const winHeight = $(window).height();
    $('.board-container').css('height', winHeight - 28 - 50);
  }

  async changeModel(model) {
    const { changeModel, selectFilter, index, curKanban } = this.props;
    changeModel(model);
    if (model !== 'config') {
      await selectFilter('all');
      index(this.getQuery(curKanban.query || {}, {}));
    }
  }

  render() {
    const { 
      i18n, 
      changeModel, 
      model, 
      selectedFilter,
      createKanban, 
      curKanban, 
      kanbans=[], 
      createSprint, 
      sprints=[],
      loading, 
      project, 
      create, 
      goto, 
      options } = this.props;

    let popoverSprint = '';
    let activeSprint = {};
    if (curKanban.type == 'scrum' && model == 'issue') {
      activeSprint = _.find(sprints || [], { status: 'active' });
      if (activeSprint) {
        popoverSprint = (
          <Popover id='popover-trigger-click'>
            <Grid>
              <Row>
                <Col sm={ 6 } componentClass={ ControlLabel }>名称</Col>
                <Col sm={ 6 }>Sprint { activeSprint.no || '' }</Col>
              </Row>
              <Row>
                <Col sm={ 6 } componentClass={ ControlLabel }>开始时间</Col>
                <Col sm={ 6 }>{ moment.unix(activeSprint.start_time).format('YYYY/MM/DD') }</Col>
              </Row>
              <Row>
                <Col sm={ 6 } componentClass={ ControlLabel }>结束时间</Col>
                <Col sm={ 6 }>{ moment.unix(activeSprint.complete_time).format('YYYY/MM/DD') }</Col>
              </Row>
            </Grid>
          </Popover>);
      }
    }

    return (
      <div style={ { margin: '18px 10px 10px 10px' } }>
        <div style={ { height: '0px', display: this.state.hideHeader ? 'block' : 'none', textAlign: 'center' } }>
          <span title='展示看板头'>
            <Button onClick={ this.showHeader.bind(this) } style={ { marginTop: '-37px' } }><i className='fa fa-angle-double-down' aria-hidden='true'></i></Button>
          </span>
        </div>
        <div id='main-header' style={ { height: '47px', display: this.state.hideHeader ? 'none': 'block' } }>
          <div style={ { display: 'inline-block', fontSize: '19px', marginTop: '5px' } }>
            { loading && <img src={ img } className='loading'/> } 
            { !loading && !_.isEmpty(curKanban) && curKanban.name || '' } 
            { !loading && _.isEmpty(curKanban) && kanbans.length > 0 && '该看板不存在。' } 
            { !loading && _.isEmpty(curKanban) && kanbans.length <= 0 && '该项目未定义看板。' } 
          </div>
          <div style={ { float: 'right', display: 'inline-block' } }>
            { options.permissions && options.permissions.indexOf('create_issue') !== -1 && !_.isEmpty(curKanban) && (model === 'issue' || model === 'backlog') &&
            <Button style={ { marginRight: '10px' } } bsStyle='primary' onClick={ () => { this.setState({ createIssueModalShow: true }); } }><i className='fa fa-plus'></i> 创建问题</Button> }
            { !_.isEmpty(curKanban) &&
            <ButtonGroup style={ { marginRight: '10px' } }>
              { curKanban.type == 'kanban' && <Button style={ { backgroundColor: model == 'issue' && '#eee' } } onClick={ () => { this.changeModel('issue') } }>看板</Button> }
              { curKanban.type == 'scrum' && <Button style={ { backgroundColor: model == 'history' && '#eee' } } onClick={ () => { this.changeModel('history') } }>历史</Button> }
              { curKanban.type == 'scrum' && <Button style={ { backgroundColor: model == 'backlog' && '#eee' } } onClick={ () => { this.changeModel('backlog') } }>Backlog</Button> }
              { curKanban.type == 'scrum' && <Button style={ { backgroundColor: model == 'issue' && '#eee' } } onClick={ () => { this.changeModel('issue') } }>活动Sprint</Button> }
              <Button style={ { backgroundColor: model == 'config' && '#eee' } } onClick={ () => { this.changeModel('config') } }>配置</Button>
            </ButtonGroup> }
            { (kanbans.length > 0 || (options.permissions && options.permissions.indexOf('manage_project') !== -1)) && 
            <DropdownButton pullRight title='列表' onSelect={ this.changeKanban.bind(this) }>
            { _.map(kanbans, (v, i) => ( <MenuItem key={ i } eventKey={ v.id }>{ v.name }</MenuItem> ) ) }
            { options.permissions && options.permissions.indexOf('manage_project') !== -1 && kanbans.length > 0 && <MenuItem divider/> }
            { options.permissions && options.permissions.indexOf('manage_project') !== -1 && <MenuItem eventKey='create'>创建看板</MenuItem> }
            </DropdownButton> } 
          </div>
        </div>

        { model === 'issue' && !loading && !_.isEmpty(curKanban) &&
        <div style={ { height: '45px', borderBottom: '2px solid #f5f5f5', display: this.state.hideHeader ? 'none': 'block' } }>
          { curKanban.type == 'scrum' && !_.isEmpty(activeSprint) &&
          <OverlayTrigger trigger='click' rootClose placement='bottom' overlay={ popoverSprint }>
            <div style={ { float: 'left', marginTop: '7px', marginRight: '20px', cursor: 'pointer' } }>
              Sprint { activeSprint.no || '' } <i className='fa fa-caret-down' aria-hidden='true'></i>
            </div> 
          </OverlayTrigger> }
          <span style={ { float: 'left', marginTop: '7px', marginRight: '10px' } }>
            过滤器：
          </span>
          <Nav bsStyle='pills' style={ { float: 'left', lineHeight: '1.0' } } activeKey={ selectedFilter } onSelect={ this.handleSelect.bind(this) }>
            <NavItem eventKey='all' href='#'>全部</NavItem>
            { _.map(curKanban.filters || [], (v, i) => (<NavItem key={ i } eventKey={ i } href='#'>{ v.name }</NavItem>) ) }
          </Nav>
          <span style={ { float: 'right' } } title='隐藏看板头'>
            <Button onClick={ this.hideHeader.bind(this) }><i className='fa fa-angle-double-up' aria-hidden='true'></i></Button>
          </span>
        </div> }
        { model === 'backlog' && !_.isEmpty(curKanban) &&
        <div style={ { height: '45px', borderBottom: '2px solid #f5f5f5', display: this.state.hideHeader ? 'none': 'block' } }>
          <Button bsStyle='primary' style={ { float: 'left', marginTop: '0px' } } onClick={ createSprint }>
            <i className='fa fa-plus' aria-hidden='true'></i> 创建Sprint
          </Button> 
        </div> }
        { this.state.createKanbanModalShow &&
          <CreateKanbanModal
            show
            close={ this.createKanbanModalClose.bind(this) }
            create={ createKanban }
            goto={ goto }
            kanbans={ kanbans }
            i18n={ i18n }/> }
        { this.state.createIssueModalShow &&
          <CreateIssueModal
            show
            close={ this.createIssueModalClose.bind(this) }
            options={ options }
            create={ create }
            loading={ loading }
            project={ project }
            i18n={ i18n }/> }
      </div>
    );
  }
}
