import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import addMention from '../addMention';
import KeyDownHandler from '../../../event-handler/keyDown';
import SuggestionHandler from '../../../event-handler/suggestions';
import Dropdown from './dropdown';
import './styles.css';

class Suggestion {
  constructor(config) {
    const {
      separator,
      trigger,
      getSuggestions,
      onChange,
      getEditorState,
      getWrapperRef,
      caseSensitive,
      dropdownClassName,
      optionClassName,
      modalHandler,
      remote,
      filterSuggestions,
      renderSuggestion,
      notFoundContent,
      dropdownStyle,
      renderDropdown,
      dropdownProps,
    } = config;
    this.config = {
      separator,
      trigger,
      getSuggestions,
      onChange,
      getEditorState,
      getWrapperRef,
      caseSensitive,
      dropdownClassName,
      optionClassName,
      modalHandler,
      remote,
      filterSuggestions,
      renderSuggestion,
      notFoundContent,
      dropdownStyle,
      renderDropdown,
      dropdownProps,
    };
  }

  findSuggestionEntities = (contentBlock, callback) => {
    if (this.config.getEditorState()) {
      const {
        separator,
        trigger,
        getSuggestions,
        filterSuggestions,
        getEditorState,
      } = this.config;
      const selection = getEditorState().getSelection();
      if (
        selection.get('anchorKey') === contentBlock.get('key') &&
        selection.get('anchorKey') === selection.get('focusKey')
      ) {
        let text = contentBlock.getText();
        text = text.substr(
          0,
          selection.get('focusOffset') === text.length - 1
            ? text.length
            : selection.get('focusOffset') + 1
        );
        let index = text.lastIndexOf(separator + trigger);
        let preText = separator + trigger;
        if ((index === undefined || index < 0) && text[0] === trigger) {
          index = 0;
          preText = trigger;
        }
        if (index >= 0) {
          callback(index === 0 ? 0 : index + 1, text.length);
        }
      }
    }
  };

  getSuggestionComponent = getSuggestionComponent.bind(this);

  getSuggestionDecorator = () => ({
    strategy: this.findSuggestionEntities,
    component: this.getSuggestionComponent(),
  });
}

function getSuggestionComponent() {
  const { config } = this;
  return class SuggestionComponent extends Component {
    static propTypes = {
      children: PropTypes.array,
    };

    state = {
      style: { left: 0 },
      activeOption: -1,
      showSuggestions: true,
      suggestions: []
    };

    componentDidMount() {
      // const editorRect = config.getWrapperRef().getBoundingClientRect();
      // const suggestionRect = this.suggestion.getBoundingClientRect();
      // const dropdownRect = this.dropdown.getBoundingClientRect();
      // let left;
      // let right;
      // let bottom;
      // if (
      //   editorRect.width <
      //   suggestionRect.left - editorRect.left + dropdownRect.width
      // ) {
      //   right = 15;
      // } else {
      //   left = 15;
      // }
      // if (editorRect.bottom < dropdownRect.bottom) {
      //   bottom = 0;
      // }
      // this.setState({
      //   // eslint-disable-line react/no-did-mount-set-state
      //   style: { bottom },
      // });
      KeyDownHandler.registerCallBack(this.onEditorKeyDown);
      SuggestionHandler.open();
      config.modalHandler.setSuggestionCallback(this.closeSuggestionDropdown);
      this.filterSuggestions();
    }

    componentDidUpdate(props) {
      const { children } = this.props;
      if (children !== props.children) {
        this.filterSuggestions();
        this.setState({
          showSuggestions: true,
        });
      }
    }

    componentWillUnmount() {
      KeyDownHandler.deregisterCallBack(this.onEditorKeyDown);
      SuggestionHandler.close();
      config.modalHandler.removeSuggestionCallback();
    }

    onEditorKeyDown = event => {
      const { activeOption, suggestions } = this.state;
      const newState = {};
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (activeOption === suggestions.length - 1) {
          newState.activeOption = 0;
        } else {
          newState.activeOption = activeOption + 1;
        }
      } else if (event.key === 'ArrowUp') {
        if (activeOption <= 0) {
          newState.activeOption = suggestions.length - 1;
        } else {
          newState.activeOption = activeOption - 1;
        }
      } else if (event.key === 'Escape') {
        newState.showSuggestions = false;
        SuggestionHandler.close();
      } else if (event.key === 'Enter') {
        this.addMention();
      }
      this.setState(newState);
    };

    onOptionMouseEnter = event => {
      const index = event.target.getAttribute('data-index');
      this.setState({
        activeOption: index,
      });
    };

    onOptionMouseLeave = () => {
      this.setState({
        activeOption: -1,
      });
    };

    setSuggestionReference = ref => {
      this.suggestion = ref;
    };

    setDropdownReference = ref => {
      this.dropdown = ref;
    };

    closeSuggestionDropdown = () => {
      this.setState({
        showSuggestions: false,
      });
    };

    filteredSuggestions = [];

    filterSuggestions() {
      const mentionText = this.props.children[0].props.text.substr(1);
      config.filterSuggestions(mentionText).then(suggestions => {
        this.setState({ suggestions })
      })
    };

    addMention = (index) => {
      let { activeOption, suggestions } = this.state;
      if (index !== undefined) {
        activeOption = index
      }
      const editorState = config.getEditorState();
      const { onChange, separator, trigger } = config;
      const selectedMention = suggestions[activeOption];
      if (selectedMention) {
        addMention(editorState, onChange, separator, trigger, selectedMention);
      }
    };

    handleSuggestionClick = (event) => {
      const index = parseInt(event.currentTarget.getAttribute('data-index'))
      event.preventDefault();
      event.stopPropagation();
      this.addMention(index)
    }

    render() {
      const { children } = this.props;
      const { activeOption, showSuggestions, suggestions } = this.state;
      const { dropdownClassName, dropdownStyle, optionClassName, renderSuggestion, notFoundContent, renderDropdown, dropdownProps } = config;
      let content = notFoundContent
      if (suggestions.length) {
        content = suggestions.map((suggestion, index) => (
          <div
            key={suggestion.value}
            spellCheck={false}
            onMouseDown={this.handleSuggestionClick}
            data-index={index}
            onMouseEnter={this.onOptionMouseEnter}
            onMouseLeave={this.onOptionMouseLeave}
            className={classNames(
              'rdw-suggestion-option',
              optionClassName,
              { 'rdw-suggestion-option-active': index === activeOption }
            )}
          >
            {renderSuggestion(suggestion)}
          </div>
        ))
      }
      let _inner = <span>{children}</span>
      if (showSuggestions) {
        if (renderDropdown) {
          dropdownProps.children = <span>{children}</span>
          dropdownProps.overlay = (
            <div className="tz-editor-mention-dropdown">
              {content}
            </div>
          )
          dropdownProps.visible = true
          _inner = renderDropdown(dropdownProps)  
        } else {
          const _dp = { 
            children, 
            popup: (
              <div
                key="dropdown-popup"
                className={classNames(
                  'rdw-suggestion-dropdown',
                  dropdownClassName
                )}
                style={dropdownStyle}
              >
                {content}
              </div>
            )
          }
          _inner = <Dropdown {..._dp}/>
          // _inner = [
          //   <span key="dropdown-child">{children}</span>,
          //   <span
          //     key="dropdown-popup"
          //     className={classNames(
          //       'rdw-suggestion-dropdown',
          //       dropdownClassName
          //     )}
          //     contentEditable="false"
          //     suppressContentEditableWarning
          //     style={dropdownStyle}
          //     ref={this.setDropdownReference}
          //   >
          //     {content}
          //   </span>  
          // ]
        }    
      }
      
      return (
        <span
          className="rdw-suggestion-wrapper"
          ref={this.setSuggestionReference}
          onClick={config.modalHandler.onSuggestionClick}
          aria-haspopup="true"
          aria-label="rdw-suggestion-popup"
        >
          {_inner}
        </span>
      );
    }


  };
}

export default Suggestion;
