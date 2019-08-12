/* eslint-disable react/no-danger */
import React, { Component } from 'react';
import TimeAgo from 'timeago-react';
import onClickOutside from 'react-onclickoutside';
import { inject, observer } from 'mobx-react';
import classNames from 'classnames';
import { Badge, Button, Icon, Spin } from 'choerodon-ui';
import WSHandler from '../../tools/ws/WSHandler';

const PREFIX_CLS = 'c7n';
const prefixCls = `${PREFIX_CLS}-boot-header-inbox`;
const popoverPrefixCls = `${prefixCls}-popover`;
const siderPrefixCls = `${prefixCls}-sider`;

/* eslint-disable-next-line */
const reg = /\n|&nbsp;|&lt|&gt|<[^a\/][^>]*>|<\/[^a][^>]*>/g;
const iconMap = {
  msg: 'textsms',
  notice: 'volume_up',
};

@inject('HeaderStore', 'AppState')
@onClickOutside
@observer
class RenderPopoverContentClass extends Component {
  handleClickOutside = () => {
    this.props.handleVisibleChange(false);
  };

  render() {
    const { HeaderStore, inboxData, inboxLoading, renderMessages, handleVisibleChange, cleanAllMsg } = this.props;
    const { inboxVisible, getUnreadAll, announcementClosed } = HeaderStore;
    const siderClasses = classNames({
      [`${prefixCls}-sider`]: true,
      [`${prefixCls}-sider-visible`]: inboxVisible,
      [`${prefixCls}-sider-move-down`]: !announcementClosed,
    });
    return (
      <div className={siderClasses}>
        <div className={`${prefixCls}-sider-header-wrap ${!inboxData.length ? 'is-empty' : null}`} style={{ disable: 'flex', flexDirection: 'column' }}>
          <div className={`${prefixCls}-sider-header`}>
            <div className={`${prefixCls}-sider-header-title`}>
              <span className="msgTitle">消息通知</span>
              <Button
                funcType="flat"
                type="primary"
                icon="close"
                shape="circle"
                onClick={() => handleVisibleChange(!inboxVisible)}
              />
            </div>
            <div className={`${prefixCls}-sider-header-action`}>
              <span role="none" style={{ cursor: 'pointer' }} onClick={() => window.open('/#/notify/user-msg?type=site')}>
                查看所有消息
              </span>
              <span role="none" style={{ cursor: 'pointer' }} onClick={cleanAllMsg}>
                全部清除
              </span>
            </div>
          </div>
        </div>
        <div className={`${prefixCls}-sider-content`}>
          <Spin spinning={inboxLoading}>
            {renderMessages(getUnreadAll)}
          </Spin>
        </div>
      </div>
    );
  }
}

@inject('HeaderStore', 'AppState')
@observer
export default class Inbox extends Component {
  cleanMsg = (e, data) => {
    e.stopPropagation();
    const { AppState, HeaderStore } = this.props;
    HeaderStore.readMsg(AppState.userInfo.id, data);
  };

  cleanAllMsg = () => {
    const { AppState, HeaderStore } = this.props;
    HeaderStore.readMsg(AppState.userInfo.id);
    HeaderStore.setInboxVisible(false);
  };

  getUnreadMsg() {
    const { AppState, HeaderStore } = this.props;
    HeaderStore.axiosGetUserMsg(AppState.getUserId);
  }

  openSettings = () => {
    window.open('/#/iam/receive-setting?type=site');
  };

  handleButtonClick = () => {
    const { HeaderStore } = this.props;
    if (!HeaderStore.inboxLoaded) {
      HeaderStore.setInboxLoading(true);
      this.getUnreadMsg();
    }
    this.handleVisibleChange(!HeaderStore.inboxVisible);
  };

  handleMessage = () => {
    this.props.HeaderStore.setInboxLoaded(false);
  };

  handleMessageClick = (e) => {
    this.handleVisibleChange(false);
  };

  handleMessageTitleClick = (e, data) => {
    // set as read && go to message detail
    this.cleanMsg(e, data);
    window.open(`/#/notify/user-msg?type=site&msgId=${data.id}&msgType=${data.type}`);
  }

  handleVisibleChange = (visible) => {
    const { HeaderStore } = this.props;
    HeaderStore.setInboxVisible(visible);
  };

  renderMessages = (inboxData) => {
    const { AppState } = this.props;
    if (inboxData.length > 0) {
      return (
        <ul>
          {
            inboxData.map((data) => {
              const { title, content, id, sendByUser, type, sendTime } = data;
              let showPicUrl;
              if (content.indexOf('<img') !== -1) {
                showPicUrl = content.slice(content.indexOf('<img src="') + '<img src="'.length, content.indexOf('">', content.indexOf('<img src="')));
              }
              return (
                <li className={`${prefixCls}-sider-content-list`} key={data.id}>
                  <div className={`${prefixCls}-sider-content-list-title`}>
                    <span>
                      <Icon type={iconMap[data.type]} style={{ marginRight: 10 }} />
                      <a onClick={e => this.handleMessageTitleClick(e, data)}>{title}</a>
                    </span>
                    <Icon
                      type="close"
                      style={{ color: 'rgba(0, 0, 0, 0.54)', cursor: 'pointer' }}
                      onClick={e => this.cleanMsg(e, data)}
                    />
                  </div>
                  <div className={`${prefixCls}-sider-content-list-description`}>
                    <div style={{ maxHeight: 57, overflow: 'hidden' }}>
                      <p id={`li-${id}`} dangerouslySetInnerHTML={{ __html: `${content.replace(reg, '')}` }} />
                      {document.querySelector(`#li-${id}`) && document.querySelector(`#li-${id}`).offsetHeight > 63 ? (
                        <a href="#" target="_blank" rel="noreferrer noopener">
                          <span>了解更多</span>
                          <Icon type="open_in_new" />
                        </a>
                      ) : null}
                    </div>
                    {showPicUrl ? (
                      // eslint-disable-next-line jsx-a11y/alt-text
                      <img style={{ maxWidth: '100%', marginTop: 10 }} src={showPicUrl} />
                    ) : null}
                  </div>
                  <div className={`${prefixCls}-sider-content-list-time`}>
                    <TimeAgo
                      datetime={sendTime.slice(0, sendTime.length - 3)}
                      locale="zh_CN"
                    />
                  </div>
                </li>
              );
            })
          }
        </ul>
      );
    } else {
      return (
        <div className={`${prefixCls}-empty`}>
          暂时没有站内消息
        </div>
      );
    }
  }

  render() {
    const { AppState, HeaderStore } = this.props;
    const { inboxVisible, inboxLoaded, inboxData, inboxLoading } = HeaderStore;
    const popOverContent = { inboxData, inboxLoading };
    return (
      <React.Fragment>
        <WSHandler
          messageKey={`choerodon:msg:site-msg:${AppState.userInfo.id}`}
          onMessage={this.handleMessage}
        >
          {
            data => (
              <Badge onClick={this.handleButtonClick} className={`${prefixCls} ignore-react-onclickoutside`} count={data || 0}>
                <Button functype="flat" shape="circle">
                  <Icon type="notifications" />
                </Button>
              </Badge>
            )
          }
        </WSHandler>
        <RenderPopoverContentClass
          {...popOverContent}
          cleanAllMsg={this.cleanAllMsg}
          renderMessages={this.renderMessages}
          handleVisibleChange={this.handleVisibleChange}
        />
      </React.Fragment>
    );
  }
}
