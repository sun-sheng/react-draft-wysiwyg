import {
  EditorState,
  Modifier,
} from 'draft-js';
import { getSelectedBlock } from 'draftjs-utils';

export default function addMention(
  editorState: EditorState,
  onChange: Function,
  separator: string,
  trigger: string,
  suggestion: Object,
): void {
  const { label } = suggestion;
  const entityKey = editorState
    .getCurrentContent()
    .createEntity('MENTION', 'IMMUTABLE', suggestion)
    .getLastCreatedEntityKey();
  const selectedBlock = getSelectedBlock(editorState);
  const selectedBlockText = selectedBlock.getText();
  let focusOffset = editorState.getSelection().focusOffset;
  const mentionIndex = (selectedBlockText.lastIndexOf(separator + trigger, focusOffset) || 0) + 1;
  let spaceAlreadyPresent = false;
  if (selectedBlockText.length === mentionIndex + 1) {
    focusOffset = selectedBlockText.length;
  }
  if (selectedBlockText[focusOffset] === ' ') {
    spaceAlreadyPresent = true;
  }
  let updatedSelection = editorState.getSelection().merge({
    anchorOffset: mentionIndex,
    focusOffset,
  });
  let newEditorState = EditorState.acceptSelection(editorState, updatedSelection);
  let contentState = Modifier.replaceText(
    newEditorState.getCurrentContent(),
    updatedSelection,
    `${trigger}${label}`,
    newEditorState.getCurrentInlineStyle(),
    entityKey,
  );
  newEditorState = EditorState.push(newEditorState, contentState, 'insert-characters');

  if (!spaceAlreadyPresent) {
    // insert a blank space after mention
    updatedSelection = newEditorState.getSelection().merge({
      anchorOffset: mentionIndex + label.length + trigger.length,
      focusOffset: mentionIndex + label.length + trigger.length,
    });
    newEditorState = EditorState.acceptSelection(newEditorState, updatedSelection);
    contentState = Modifier.insertText(
      newEditorState.getCurrentContent(),
      updatedSelection,
      ' ',
      newEditorState.getCurrentInlineStyle(),
      undefined,
    );
  }
  onChange(EditorState.push(newEditorState, contentState, 'insert-characters'));
}

export function insertMention(
  editorState: EditorState,
  suggestion: Object,
  separator: string,
  trigger: string,
): void {
  const { label } = suggestion;
  const entityKey = editorState
    .getCurrentContent()
    .createEntity('MENTION', 'IMMUTABLE', suggestion)
    .getLastCreatedEntityKey();

  let selection = editorState.getSelection();
  
  const text = `${trigger}${label}`
  let contentState = Modifier.insertText(
    editorState.getCurrentContent(),
    selection,
    text,
    undefined,
    entityKey
  );
  let newEditorState = EditorState.push(editorState, contentState, 'insert-characters')
  // add empty space
  selection = newEditorState.getSelection().merge({
    anchorOffset: selection.get('anchorOffset') + text.length,
    focusOffset: selection.get('anchorOffset') + text.length,
  });
  newEditorState = EditorState.acceptSelection(newEditorState, selection);
  contentState = Modifier.insertText(
    newEditorState.getCurrentContent(),
    selection,
    ' ',
    newEditorState.getCurrentInlineStyle(),
    undefined
  );
  
  return EditorState.push(newEditorState, contentState, 'insert-characters');

}