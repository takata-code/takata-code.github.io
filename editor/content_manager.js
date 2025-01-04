//=================
// ContentManager
//=================

import P from './project.js'

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
    customScrollbar: true,
    enableBasicAutocompletion: true,
    enableLiveAutocompletion : true,
    useSvgGutterIcons: true,
  })
  ace_editor.setTheme('ace/theme/tomorrow_night')
}

initialize_ace_editor()

export default class ContentManager {
  constructor(target = null) {
    this.target = target
    this.content = null
    this.header = null
    
    // 変更が加えられたとき発火
    this.onchanged = () => {}
    
    this.on_annotations_changed = annotations => {}
   }
  
  static make_content_manager(target) {
    if (target instanceof P.Project) {
      return new ProjectInfoContentManager(target)
    }
    
    if (target.is_document) {
      return new DocumentContentManager(target)
    }
    
    switch (target.extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'ico':
      case 'webp':
      case 'svg':
        return new ImageContentManager(target)
    }
    return new UnknownContentManager(target)
  }
  
  input(text) {}
  
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
      self.target.text = self.text
      self.onchanged()
    }
    
    this.on_ace_editor_change_mode = (e, session) => {
      const ace_mode = self.get_ace_editor_mode(self.target.type)
      
      if (ace_mode == 'javascript') {
        if (session.$worker) {
          session.$worker.send("setOptions", [{
            asi: true,
            esversion: 15,
            maxerr: 16384
          }])
        }
      }
    }
    
    this.on_ace_editor_change_annotations = () => {
      this.on_annotations_changed(ace_editor.getSession().getAnnotations())
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
  
  input(text) {
    ace_editor.getSession().insert(ace_editor.getCursorPosition(), text)
    ace_editor.focus()
  }
  
  undo() {
    ace_editor.getSession().getUndoManager().undo()
  }
  
  redo() {
    ace_editor.getSession().getUndoManager().redo()
  }
  
  activate() {
    const ace_mode = this.get_ace_editor_mode(this.target.type)
    ace_editor.getSession().setUndoManager(new ace.UndoManager())
    ace_editor.setValue(this.text)
    
    ace_editor.getSession().on('change', this.on_ace_editor_changed)
    ace_editor.session.on('changeMode', this.on_ace_editor_change_mode)
    ace_editor.session.on('changeAnnotation', this.on_ace_editor_change_annotations)
    
    ace_editor.getSession().setMode(`ace/mode/${ ace_mode }`)
    
    this.content.appendChild(ace_div)
    
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
      case 'application/json': return 'json'
      default: return 'text'
    }
  }
  
  deactivate() {
    this.text = ace_editor.getValue()
    this.target.text = this.text
    ace_editor.getSession().removeListener('change', this.on_ace_editor_changed)
    ace_editor.getSession().removeListener('changeMode', this.on_ace_editor_change_mode)
    ace_editor.getSession().removeListener('changeAnnotation', this.on_ace_editor_change_annotations)
    this.ace_cursor = ace_editor.getCursorPosition()
    this.ace_scroll_top = ace_editor.getSession().getScrollTop()
  }
  
  save() {
    this.text = ace_editor.getValue()
    this.target.blob = new Blob([this.text])
    this.target.text = this.text
  }
}

class ProjectInfoContentManager extends ContentManager {
  constructor(project) {
    super(project)
    this.content = this.create_content(project)
    this.header = 'プロジェクト情報'
  }
  
  create_content(project) {
    const content = document.createElement('div')
    content.className = 'tab-content'
    content.style.margin = '10px'
    content.style.position = 'relative'
    
    const title = document.createElement('h1')
    title.innerText = 'プロジェクト情報'
    content.appendChild(title)
    
    const menu_project_info = document.createElement('div')
    menu_project_info.className = 'message-info'
    menu_project_info.innerText = 'このファイル(TPROJECTファイル)は、プロジェクト情報を保存しており、エディタによって自動編集されます。\nこれらの値は読み取り専用です。変更するには、「プロジェクト」メニューを開いてください。'
    content.appendChild(menu_project_info)
    
    const table = document.createElement('table')
    table.className = 'project-info-content-manager-table'
    
    const name = document.createElement('tr')
    
    const name_key = document.createElement('th')
    name_key.innerText = 'プロジェクト名'
    name.appendChild(name_key)
    
    const name_val = document.createElement('td')
    name_val.innerText = project.name
    name.appendChild(name_val)
    
    table.appendChild(name)
    
    const version = document.createElement('tr')
    
    const version_key = document.createElement('th')
    version_key.innerText = 'バージョン'
    version.appendChild(version_key)
    
    const version_val = document.createElement('td')
    version_val.innerText = project.info.version
    version.appendChild(version_val)
    
    table.appendChild(version)
    
    const id = document.createElement('tr')
    
    const id_key = document.createElement('th')
    id_key.innerText = 'ID'
    id.appendChild(id_key)
    
    const id_val = document.createElement('td')
    id_val.innerText = project.info.id
    id.appendChild(id_val)
    
    table.appendChild(id)
    
    content.appendChild(table)
    
    return content
  }
}

class ImageContentManager extends ContentManager {
  constructor(file) {
    super(file)
    this.content = this.create_content(file)
  }
  
  create_content(file) {
    const content = document.createElement('div')
    content.className = 'tab-content'
    content.style.margin = '0'
    content.style.position = 'relative'
    
    const img = document.createElement('img')
    img.src = URL.createObjectURL(file.blob)
    img.style.objectFit = 'contain'
    img.style.width = '100%'
    img.style.height = '100%'
    content.appendChild(img)
    
    const info = document.createElement('div')
    info.style.padding = '10px'
    info.style.position = 'absolute'
    info.style.left = '10px'
    info.style.top = '10px'
    info.style.borderRadius = '5px'
    info.style.background = '#00000088'
    
    const anti_arias = document.createElement('div')
    anti_arias.style.padding = '10px'
    anti_arias.style.position = 'absolute'
    anti_arias.style.right = '10px'
    anti_arias.style.top = '10px'
    anti_arias.style.borderRadius = '5px'
    anti_arias.style.background = '#00000088'
    
    const anti_arias_text = document.createElement('span')
    anti_arias_text.style.color = 'white'
    anti_arias_text.innerText = 'アンチエイリアス'
    anti_arias.appendChild(anti_arias_text)
    content.appendChild(anti_arias)
    
    const anti_arias_check = document.createElement('input')
    anti_arias_check.type = 'checkbox'
    anti_arias_check.checked = true
    anti_arias_check.addEventListener('change', () => {
      img.style.imageRendering = anti_arias_check.checked ? 'auto' : 'pixelated'
    })
    anti_arias.appendChild(anti_arias_check)
    
    img.onload = () => {
      const size = document.createElement('span')
      size.style.color = 'white'
      size.innerText = img.naturalWidth + ' x ' + img.naturalHeight + '\n' + Math.round(this.target.blob.size / 1000) + ' キロバイト'
      info.appendChild(size)
    }
    content.appendChild(info)
    
    return content
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
