import * as React from 'react';
import EditorViewState from '../schema/EditorViewState';
import { Editor, EditorOptions, EditorPlugin, UndoService } from 'roosterjs-editor-core';
import {
    ClipBoardData,
    ContentEdit,
    HyperLink,
    PasteManager,
    DefaultShortcut,
} from 'roosterjs-editor-plugins';
import { convertInlineCss } from 'roosterjs-editor-dom';
import { DefaultFormat } from 'roosterjs-editor-types';

export interface ReactEditorProps {
    viewState: EditorViewState,
    className?: string,
    plugins?: EditorPlugin[],
    updateViewState?: (viewState: EditorViewState, content: string, isInitializing: boolean) => void;
    undo?: UndoService;
    pasteHandler?: (clipboardData: ClipBoardData) => void;
    isRtl?: boolean;
    hyperlinkToolTipCallback?: (href: string) => string;
    defaultFormat?: DefaultFormat;
    onBlur?: (ev: React.FocusEvent<HTMLDivElement>) => void;
}

export default class ReactEditor extends React.Component<ReactEditorProps, {}> {
    private contentDiv: HTMLDivElement;
    private editor: Editor;
    private updateViewStateWhenUnmount: boolean;

    render() {
        let { className, isRtl } = this.props;
        return <div
            dir={isRtl ? 'rtl' : 'ltr'}
            className={className}
            onBlur={this.onBlur}
            ref={this.onContentDivRef}></div>;
    }

    componentDidMount() {
        this.editor = new Editor(this.contentDiv, this.getEditorOptions());
        this.updateViewStateWhenUnmount = true;
        this.updateContentToViewState(true /*isInitializing*/);
    }

    componentWillUnmount() {
        if (this.updateViewStateWhenUnmount) {
            this.updateContentToViewState();
            this.updateViewStateWhenUnmount = false;
        }
        this.editor.dispose();
        this.editor = null;
    }

    updateContentToViewState(isInitializing?: boolean) {
        if (this.editor) {
            let updateViewState = this.props.updateViewState || this.updateViewState;
            updateViewState(this.props.viewState, this.editor.getContent(), isInitializing);
        }
    }

    setUpdateViewStateWhenUnmount(updateViewStateWhenUnmount: boolean) {
        this.updateViewStateWhenUnmount = updateViewStateWhenUnmount;
    }

    private getEditorOptions(): EditorOptions {
        let { pasteHandler, plugins, viewState, undo, hyperlinkToolTipCallback, defaultFormat } = this.props;
        let allPlugins: EditorPlugin[] = [
            new ContentEdit(),
            new HyperLink(hyperlinkToolTipCallback),
            new PasteManager(pasteHandler),
            new DefaultShortcut(),
        ];

        if (plugins) {
            allPlugins = allPlugins.concat(plugins);
        }

        let initialContent = convertInlineCss(viewState.content);
        let options: EditorOptions = {
            plugins: allPlugins,
            defaultFormat: defaultFormat,
            undo: undo,
            initialContent: initialContent,
        };

        return options;
    }

    private updateViewState(viewState: EditorViewState, content: string, isInitializing: boolean) {
        if (viewState.content != content) {
            viewState.content = content;
            if (!isInitializing) {
                viewState.isDirty = true;
            }
        }
    }

    private onBlur = (ev: React.FocusEvent<HTMLDivElement>) => {
        this.updateContentToViewState();
        if (this.props.onBlur) {
            this.props.onBlur(ev);
        }
    }
    
    private onContentDivRef = (ref: HTMLDivElement) => {
        this.contentDiv = ref;
    }
}
