import React from 'react';
import { Editor, EditorState, RichUtils, Entity, AtomicBlockUtils, convertToRaw, convertFromRaw, CompositeDecorator, Modifier, getDefaultKeyBinding, genKey, ContentBlock } from 'draft-js';
import redraft from 'redraft';
import {stateToHTML} from 'draft-js-export-html';
import showdown from 'showdown';

// components
import QiniuUploadImage from '@components/qiniu-upload-image';

// styles
import 'draft-js/dist/Draft.css';
import './RichEditor.css';

function getBlockStyle(block) {
  switch (block.getType()) {
    case 'blockquote': return 'RichEditor-blockquote';
    default: return null;
  }
}

function findLinkEntities(contentBlock, callback, contentState) {
  contentBlock.findEntityRanges(
    (character) => {
      const entityKey = character.getEntity();
      return (
        entityKey !== null &&
        contentState.getEntity(entityKey).getType() === 'LINK'
      );
    },
    callback
  );
}

const Link = (props) => {
  const { url } = props.contentState.getEntity(props.entityKey).getData();
  return <a href={url}>{props.children}</a>;
};

class StyleButton extends React.Component {

  constructor() {
    super();
    this.onToggle = (e) => {
      e.preventDefault();
      this.props.onToggle(this.props.style);
    };
  }

  render() {
    let className = 'RichEditor-styleButton';
    if (this.props.active) {
      className += ' RichEditor-activeButton';
    }

    return (
      <span className={className + ' ' + this.props.className} onMouseDown={this.onToggle}></span>
    )
  }

}

const BLOCK_TYPES = [
  // { className: 'title', label: 'H1', style: 'header-one'},
  { className: 'title', label: 'H2', style: 'header-two'},
  // { className: 'title', label: 'H3', style: 'header-three'},
  // { className: 'title', label: 'H4', style: 'header-four'},
  // { className: 'title', label: 'H5', style: 'header-five'},
  // { className: 'title', label: 'H6', style: 'header-six'},
  // { className: 'title', label: 'Title', style: 'header-five'},
  // { className: 'blockquote', label: 'Blockquote', style: 'blockquote'},
  { className: 'ul', label: 'ul', style: 'unordered-list-item'},
  // { className: 'ol', label: 'ol', style: 'ordered-list-item'},
  { className: 'code-block', label: 'code', style: 'code-block'}
]


var INLINE_STYLES = [
  { className:"bold", label: 'bold', style: 'BOLD'},
  { className:"italic", label: 'italic', style: 'ITALIC'},
  { className:"underline", label: 'underline', style: 'UNDERLINE'}
]

const BLOCK_TYPES_1 = [
  { className: 'code-block', label: 'code', style: 'code-block'}
]

// 编辑器控制器
const Controls = (props) => {

  const { editorState } = props;
  const selection = editorState.getSelection();
  const blockType = editorState
    .getCurrentContent()
    .getBlockForKey(selection.getStartKey())
    .getType();

  var currentStyle = props.editorState.getCurrentInlineStyle();

  return (
      <div className="RichEditor-controls">

        {props.expandControl && BLOCK_TYPES.map((type) =>
          <StyleButton
            key={type.label}
            active={type.style === blockType}
            label={type.label}
            onToggle={props.toggleBlockType}
            className={type.className}
            style={type.style}
          />
        )}

        {props.expandControl && INLINE_STYLES.map(type =>
          <StyleButton
            key={type.label}
            active={currentStyle.has(type.style)}
            label={type.label}
            onToggle={props.toggleInlineStyle}
            className={type.className}
            style={type.style}
          />
        )}

        <QiniuUploadImage
            beforeUpload={(files)=>{
              let s: any = [];
              files.map(item=>{ s.push({ name: item.name, src: '' }) });
              props.addImage(s);
            }}
            upload={(url, file)=>{
              props.updateImage(url, file);
            }}
            text={<span className="RichEditor-styleButton image"></span>}
            />
        
        {/*!props.expandControl && BLOCK_TYPES_1.map((type) =>
          <StyleButton
            key={type.label}
            active={type.style === blockType}
            label={type.label}
            onToggle={props.toggleBlockType}
            className={type.className}
            style={type.style}
          />
        )*/}

        {/*!props.expandControl ? <span onClick={props.handleExpandControl} className="RichEditor-styleButton more"></span> : null*/}
        
        {/* 
        <span className="RichEditor-styleButton link" onClick={props.addLink}></span>
          
        <span
          className="RichEditor-styleButton link-image"
          onClick={()=>{
            let url = prompt("请输入图片地址","");
            if (url) {
              props.addImage([{ name: url, src: url }]);
            }
          }}
          >
        </span>
        */}

      </div>
  );
};




export default class MyEditor extends React.Component {

  static defaultProps = {
    displayControls: true,
    syncContent: null,
    content: '',
    getEditor: (editor)=>{},
    placeholder: '请输入正文',
  }

  constructor(props) {
    super(props)

    const { syncContent, content, placeholder, expandControl } = this.props;

    const decorator = new CompositeDecorator([
      {
        strategy: findLinkEntities,
        component: Link,
      },
    ]);

    this.state = {
      syncContent: syncContent, // 编辑器改变的时候，调给外部组件使用
      editorState: content
        ? EditorState.createWithContent(convertFromRaw(JSON.parse(content)), decorator)
        : EditorState.createEmpty(decorator),
      placeholder: placeholder,
      // 展开控制栏
      expandControl: expandControl || false
    }

    this.onChange = this._onChange.bind(this);
    this.toggleBlockType = (type) => this._toggleBlockType(type);
    this.toggleInlineStyle = (style) => this._toggleInlineStyle(style);
    this.addImage = this._addImage.bind(this);
    this.addLink = this._addLink.bind(this);
    this.updateImage = this._updateImage.bind(this);
    this.handleKeyCommand = this._handleKeyCommand.bind(this);
    this.mapKeyToEditorCommand = this._mapKeyToEditorCommand.bind(this);

    this.mediaBlockRenderer = this.mediaBlockRenderer.bind(this);
    this.media = this._media.bind(this);

    // this.checkUpload = this.checkUpload.bind(this);
  }

  componentDidMount() {
    this.onChange(this.state.editorState);
    this.props.getEditor(this.refs.editor);

    // this.props.getCheckUpload(this.checkUpload);
  }

  _onChange(editorState) {

    const that = this;

    this.setState({ editorState }, () => {});

    const { syncContent } = this.state;

    if (syncContent) {

      const content = editorState.getCurrentContent();

      let options = {
        blockRenderers: {
          'code-block': (block)=>{
            // let data = block.getData();
            // console.log(data);

            var blockKey = block.getKey(),
            contentState = editorState.getCurrentContent(),
            previousBlock = contentState.getBlockBefore(blockKey),
            nextBlock = contentState.getBlockAfter(blockKey),
            previousBlockType = previousBlock && previousBlock.getType(),
            nextBlockType = nextBlock && nextBlock.getType();

            // console.log(block.getText());

            let text = encodeContent(block.getText());

        
            // If the blocks on either side are code-block blocks, just return the text.
            // if(previousBlockType === 'code-block' && nextBlockType === 'code-block') {
            //   return text;
            // }
        
            if(previousBlockType !== 'code-block' && nextBlockType !== 'code-block') {
              return '<pre>' + text + '</pre>';
            }

            // If the previous block wasn't a code-block and the next block is, just
            // start the code-block block.
            if(previousBlockType !== 'code-block' && nextBlockType === 'code-block') {
              return '<pre>' + text;
            }
        
            // If the previous block was a code-block and the next block isn't,
            // complete the code-block block.
            if(previousBlockType === 'code-block' && nextBlockType !== 'code-block') {
              return text + '</pre>';
            }


            function encodeContent(text) {
              return text.split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('\xA0').join('&nbsp;').split('\n').join('<br>' + '\n');
            }

            function encodeAttr(text) {
              return text.split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;');
            }

            // return block.getText();
        
            // Otherwise, this is a one line code-block.
            return text;

          }
        }
      };


      let html = stateToHTML(content, options);

        let _html = html.replace(/<p>/gmi, '');
            _html = _html.replace(/<\/p>/gmi, '');

        if (!_html) {
          syncContent('', '')
          return
        }

        // html = html.replace(/\n/g, "<br />");
        // html = html.replace(/\r/g, "<br />");

        // html = html.replace(/\s/g,"&nbsp;");

        // html=html.replace(/\r\n/g,"<br>")  
        // html=html.replace(/\n/g, '<br />');  
          
        /*
        html = html.replace(/\<\/p\>\<p\>/g,'\n');
        html = html.replace(/\<\/p\>/g,'\n');
        html = html.replace(/<[^>]+>/g,"");


        html=html.replace(/\&lt\;/g, '<');  
        html=html.replace(/\&gt\;/g, '>');  

        var converter = new showdown.Converter();

        converter.setOption('tables', true);
        converter.setOption('simpleLineBreaks', true);

        html = converter.makeHtml(html);
        */

        // console.log(html);
        
        html = encodeURIComponent(html);

        syncContent(JSON.stringify(convertToRaw(content)), html);

    }

  }

  _toggleBlockType(blockType) {
    this.onChange(
      RichUtils.toggleBlockType(
        this.state.editorState,
        blockType
      )
    )
  }

  _toggleInlineStyle(inlineStyle) {
    this.onChange(
      RichUtils.toggleInlineStyle(
        this.state.editorState,
        inlineStyle
      )
    )
  }

  _addLink(e) {

    const { editorState } = this.state;
    const selection = editorState.getSelection();
    if (!selection.isCollapsed()) {
      let url = prompt("请输入url地址以http://或https://开头","");

      if (!url) return

      const contentState = editorState.getCurrentContent();
      const contentStateWithEntity = contentState.createEntity(
        'LINK',
        'MUTABLE',
        { url: url }
      );
      const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
      const newEditorState = EditorState.set(editorState, { currentContent: contentStateWithEntity });

      this.onChange(RichUtils.toggleLink(
        newEditorState,
        newEditorState.getSelection(),
        entityKey
      ));

    } else {
      alert('请先选取需要添加链接的文字内容')
    }

  }

  _addImage(data) {
    this._promptForMedia('image', data);
  }

  _updateImage(url, file) {

    const self = this;
    const { editorState } = self.state;
    const contentState = editorState.getCurrentContent();

    contentState.blockMap.map(item=>{
      item.findEntityRanges(i=>{

        let key = i.getEntity();

        if (key) {

          let type = contentState.getEntity(key).getType();
          if (type == 'image') {
            let data = contentState.getEntity(key).getData();
            if (data.name == file.name) {
              data.src = url;
              contentState.replaceEntityData(key, data);
            }
          }

        }

      });
    });

    this.onChange(
      RichUtils.toggleInlineStyle(
        this.state.editorState,
        null
      )
    );

    // self.refs.editor.blur();
    // self.refs.editor.focus();
  }

  // 检查是否有未上传的文件
  /*
  checkUpload() {

    const self = this;
    const { editorState } = self.state;
    const contentState = editorState.getCurrentContent();

    let allUploaded = true;

    contentState.blockMap.map(item=>{
      item.findEntityRanges(i=>{

        let key = i.getEntity();

        if (key) {

          let type = contentState.getEntity(key).getType();

          if (type == 'image') {

            let data = contentState.getEntity(key).getData();
            if (data.name && !data.src) {
              allUploaded = false;
            }

          }

        }

      });
    });

    return allUploaded
  }
  */

  _promptForMedia(type, data) {

    const { editorState } = this.state;
    let oldEditorState = editorState;

    let entityKey = null;

    data.map(item=>{

      const contentState = oldEditorState.getCurrentContent();

      const contentStateWithEntity = contentState.createEntity(
        'image',
        'IMMUTABLE',
        item
      );

      entityKey = contentStateWithEntity.getLastCreatedEntityKey();
      
      let newEditorState = AtomicBlockUtils.insertAtomicBlock(
        oldEditorState,
        entityKey,
        ' '
      );

      oldEditorState = newEditorState;
    });

    this.onChange(oldEditorState);
  }

  _handleKeyCommand(command) {
    const {editorState} = this.state;
    const that = this
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      this.onChange(newState);
      return true;
    }
    return false;
  }

  _mapKeyToEditorCommand(e) {
    switch (e.keyCode) {
      case 9: // TAB
        const newEditorState = RichUtils.onTab(
          e,
          this.state.editorState,
          4, /* maxDepth */
        );
        if (newEditorState !== this.state.editorState) {
          this.onChange(newEditorState);
        }
        return;
    }
    return getDefaultKeyBinding(e);
  }

  _media (props) {

    const { editorState } = this.state;
    const contentState = editorState.getCurrentContent();

    const entity = contentState.getEntity(props.block.getEntityAt(0));

    const { src } = entity.getData();
    const type = entity.getType();

    let media;

    if (type === 'link') {
      media = <a href={src} target="_blank" rel="nofollow">{src}</a>;
    } else if (type === 'image') {
      media = <img src={src} />;
    } else if (type === 'youtube') {
      let url = 'https://www.youtube.com/embed/' + src;
      media = <iframe src={url}></iframe>
    } else if (type === 'youku') {
      let url = 'https://player.youku.com/embed/' + src;
      media = <iframe src={url}></iframe>;
    } else if (type === 'qq') {
      let url = "https://v.qq.com/iframe/player.html?vid="+src+"&tiny=0&auto=0";
      media = <iframe src={url} width="auto" height="auto"></iframe>;
    } else if (type === '163-music-song') {
      let url = "//music.163.com/outchain/player?type=2&id="+src+"&auto=1&height=66";
      media = <iframe src={url} width="auto" height="86"></iframe>;
    } else if (type === '163-music-playlist') {
      let url = "//music.163.com/outchain/player?type=0&id="+src+"&auto=1&height=430";
      media = <iframe src={url} width="auto" height="450"></iframe>;
    }

    return media;
  }

  // 拦截渲染
  mediaBlockRenderer(block) {
    switch (block.getType()) {
      case 'atomic':
        return {
          component: this.media,
          editable: false,
          props: {
            foo: 'bar'
          }
        }
    }
  }
  
  render() {
    const { editorState, placeholder, expandControl } = this.state
    const { displayControls } = this.props;

    return(<div className="RichEditor-editor">

            {displayControls ?
              <div className="d-flex justify-content-between border-bottom">
              <Controls
                editorState={editorState}
                toggleBlockType={this.toggleBlockType}
                toggleInlineStyle={this.toggleInlineStyle}
                addImage={this.addImage}
                addLink={this.addLink}
                updateImage={this.updateImage}
                expandControl={expandControl}
                handleExpandControl={()=>{
                  this.setState({
                    expandControl: this.state.expandControl ? false : true
                  });
                }}
              />

              {/* <div><input type="checkbox" /> 富文本 / MarkDown</div> */}
              </div>
              : null}

            <Editor
              blockRendererFn={this.mediaBlockRenderer}
              editorState={editorState}
              blockStyleFn={getBlockStyle}
              onChange={this.onChange}
              handleKeyCommand={this.handleKeyCommand}
              keyBindingFn={this.mapKeyToEditorCommand}
              placeholder={placeholder}
              ref="editor"
              // 清除复制文本样式
              stripPastedStyles={true}
              spellCheck={true}
            />

          </div>)
  }
}