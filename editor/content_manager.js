//=================
// ContentManager
//=================

// 単独の Ace Editor で複数タブを操作する
let ace_editor
let ace_div

function initialize_ace_editor() {
  ace_div = document.createElement('div')
  
  ace_div.style.width = '100%'
  ace_div.style.height = '100%'
  
  ace_editor = ace.edit(ace_div, {
    fontFamily: 'Fira Code',
    fontSize: '10.5pt',
    tabSize: 2,
    maxerr: 2048,
    customScrollbar: true,
    enableBasicAutocompletion: true,
    enableLiveAutocompletion : true,
    useSvgGutterIcons: true
  })
  ace_editor.setTheme('ace/theme/tomorrow_night')
}

initialize_ace_editor()

export default class ContentManager {
  constructor(file) {
    this.file = file
    this.content = null
    
    // 変更が加えられたとき発火
    this.onchanged = () => {}
  }
  
  static make_content_manager(file) {
    if (file.is_document) {
      return new DocumentContentManager(file)
    }
    
    return new UnknownContentManager(file)
  }
  
  undo() {}
  redo() {}
  
  activate() {}
  deactivate() {}
  
  save() {}
}

class DocumentContentManager extends ContentManager {
  constructor(file) {
    super(file)
    this.text = file.text
    this.content = this.create_content(file)
    
    const self = this
    this.on_ace_editor_changed = () => {
      self.text = ace_editor.getValue()
      self.file.text = self.text
      self.onchanged()
    }
    
    // Ace Editor にかかわる情報
    this.ace_cursor = { row: 0, column: 0 }
    this.ace_scroll_top = 0
    this.ace_undo_mgr = new ace.UndoManager()
  }
  
  create_content(file) {
    const content = document.createElement('div')
    content.className = 'tab-content'
    
    content.appendChild(ace_div)
    
    return content
  }
  
  undo() {
    ace_editor.getSession().getUndoManager().undo()
  }
  
  redo() {
    ace_editor.getSession().getUndoManager().redo()
  }
  
  activate() {
    ace_editor.getSession().setUndoManager(new ace.UndoManager())
    ace_editor.setValue(this.text)
    ace_editor.getSession().setMode(`ace/mode/${ this.get_ace_editor_mode(this.file.type) }`)
    this.content.appendChild(ace_div)
    
    ace_editor.getSession().on('change', this.on_ace_editor_changed)
    ace_editor.focus()
    ace_editor.gotoLine(this.ace_cursor.row, this.ace_cursor.column, true)
    ace_editor.renderer.scrollToRow(this.ace_cursor.row)
    ace_editor.getSession().setScrollTop(this.ace_scroll_top)
    ace_editor.getSession().setUndoManager(this.ace_undo_mgr)
  }
  
  get_ace_editor_mode(type) {
    switch (type) {
      case 'text/html': return 'html'
      case 'text/css': return 'css'
      case 'text/javascript': return 'javascript'
      default: return 'text'
    }
  }
  
  deactivate() {
    this.text = ace_editor.getValue()
    this.file.text = this.text
    ace_editor.getSession().removeListener('change', this.on_ace_editor_changed)
    this.ace_cursor = ace_editor.getCursorPosition()
    this.ace_scroll_top = ace_editor.getSession().getScrollTop()
  }
  
  save() {
    this.text = ace_editor.getValue()
    this.file.blob = new Blob([this.text])
    this.file.text = this.text
  }
}

class UnknownContentManager extends ContentManager {
  constructor(file) {
    super(file)
    this.content = this.create_content(file)
  }
  
  create_content(file) {
    const content = document.createElement('div')
    content.className = 'tab-content'
    content.style.margin = '20px'
    
    const label = document.createElement('label')
    label.innerText = `${ file.name } を開くことができません。\n不明な拡張子 (.${ file.extension }) です。`
    
    content.appendChild(label)
    
    return content
  }
}
