/* @flow */

import React from 'react';
import { Editor } from '../../src';

function interceptKeyFn(event) {
  console.log(event)
  if (event.keyCode === 90 && event.metaKey) {
    event.preventDefault();
    event.stopPropagation();
    return true
  }
}

const Basic = () => (<div className="rdw-storybook-root">
  <Editor
    max={10}
    toolbarClassName="rdw-storybook-toolbar"
    wrapperClassName="rdw-storybook-wrapper"
    editorClassName="rdw-storybook-editor"
  />
</div>);

export default Basic;
