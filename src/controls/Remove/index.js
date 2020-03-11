import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { 
  EditorState,
  ContentState,
  ContentBlock,
  genKey, 
  Modifier 
} from 'draft-js';
import { getSelectionCustomInlineStyle } from 'draftjs-utils';

import { forEach } from '../../utils/common';
import LayoutComponent from './Component';

const REG_LINES = /[\t\r\n]/
const DELIMITER_LINE = '\n'

export default class Remove extends Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    editorState: PropTypes.object.isRequired,
    config: PropTypes.object,
    translations: PropTypes.object,
    modalHandler: PropTypes.object,
  };

  state = {
    expanded: false,
  };

  componentDidMount() {
    const { modalHandler } = this.props;
    modalHandler.registerCallBack(this.expandCollapse);
  }

  componentWillUnmount() {
    const { modalHandler } = this.props;
    modalHandler.deregisterCallBack(this.expandCollapse);
  }

  onExpandEvent = () => {
    this.signalExpanded = !this.state.expanded;
  };

  expandCollapse = () => {
    this.setState({
      expanded: this.signalExpanded,
    });
    this.signalExpanded = false;
  };

  removeStyles = () => {
    const { editorState, onChange } = this.props;
    let contentState = editorState.getCurrentContent();
    const selection = window.getSelection()
    if (!selection) return editorState
    let str = selection.toString().replace(REG_LINES, DELIMITER_LINE)
    let idx = str.indexOf(DELIMITER_LINE)
    let inlineStr = ''
    let blockStr = ''
    if (idx < 0) {
      inlineStr = str
    } else {
      inlineStr = str.substring(0, idx)
      blockStr = str.substring(idx)
    }
    let _line = Modifier.replaceText(contentState, editorState.getSelection(), inlineStr)
    let state = EditorState.push(editorState, _line, 'insert-characters')
    if (blockStr) {
      let _block = Modifier.replaceWithFragment( 
        state.getCurrentContent(),
        state.getSelection(),
        ContentState.createFromText(blockStr).blockMap
      );
      state = EditorState.push(state, _block, 'insert-fragment')
    }
    onChange(state)
  }

  removeInlineStyles = () => {
    const { editorState, onChange } = this.props;
    onChange(this.removeAllInlineStyles(editorState));
  };

  removeAllInlineStyles = editorState => {
    let contentState = editorState.getCurrentContent();
    [
      'BOLD',
      'ITALIC',
      'UNDERLINE',
      'STRIKETHROUGH',
      'MONOSPACE',
      'SUPERSCRIPT',
      'SUBSCRIPT',
    ].forEach(style => {
      contentState = Modifier.removeInlineStyle(
        contentState,
        editorState.getSelection(),
        style
      );
    });
    const customStyles = getSelectionCustomInlineStyle(editorState, [
      'FONTSIZE',
      'FONTFAMILY',
      'COLOR',
      'BGCOLOR',
    ]);
    forEach(customStyles, (key, value) => {
      if (value) {
        contentState = Modifier.removeInlineStyle(
          contentState,
          editorState.getSelection(),
          value
        );
      }
    });

    return EditorState.push(editorState, contentState, 'change-inline-style');
  };

  doExpand = () => {
    this.setState({
      expanded: true,
    });
  };

  doCollapse = () => {
    this.setState({
      expanded: false,
    });
  };

  render() {
    const { config, translations } = this.props;
    const { expanded } = this.state;
    const RemoveComponent = config.component || LayoutComponent;
    return (
      <RemoveComponent
        config={config}
        translations={translations}
        expanded={expanded}
        onExpandEvent={this.onExpandEvent}
        doExpand={this.doExpand}
        doCollapse={this.doCollapse}
        onChange={this.removeStyles}
      />
    );
  }
}

// todo: unit test coverage
