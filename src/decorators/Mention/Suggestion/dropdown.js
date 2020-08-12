import React from 'react'
import ReactDOM from 'react-dom'

function getWindowHeight() {
  return Math.max(
    document.documentElement.clientHeight, 
    window.innerHeight
  );
}


export default class Dropdown extends React.Component {

  rootRef = React.createRef()

  componentDidMount() {
    const { placement } = this.props
    const rect = this.rootRef.current.getBoundingClientRect()
    const { left, height, top, bottom } = rect
    this._popup = document.createElement('div')
    this._popup.className = 'tz-rdw-editor-mention-popup'
    this._popup.style.left = `${left}px`

    if (placement === 'bottom') {
      this._popup.style.top = `${top + height}px`
    } else {
      this._popup.style.bottom = `${getWindowHeight() - top}px`
    }
    document.body.appendChild(this._popup)
    this.renderPopup()
  }

  componentDidUpdate(pp) {
    if (pp.popup !== this.props.popup) {
      this.renderPopup()
    }
  }

  componentWillUnmount() {
    ReactDOM.unmountComponentAtNode(this._popup);
    this._popup.parentNode.removeChild(this._popup);
  }

  renderPopup() {
    const { popup } = this.props
    // ReactDOM.unmountComponentAtNode(this._popup);
    ReactDOM.render(popup, this._popup)
  }

  render () {
    const { children } = this.props
    return <span ref={this.rootRef}>{children}</span>
  }

}