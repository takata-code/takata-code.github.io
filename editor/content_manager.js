//=================
// ContentManager
//=================

import P from './project.js'
import Colors from './colors.js'

// 単独の Ace Editor で複数タブを操作する
let ace_editor
let ace_div

function initialize_ace_editor() {
  ace_div = document.createElement('div')
  
  ace_div.style.width = '100%'
  ace_div.style.height = '100%'
  
  ace_editor = ace.edit(ace_div, {
    fontFamily: 'var(--code-font)',
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
  constructor(target, option = {}) {
    this.target = target
    this.content = null
    this.header = null
    this.is_active = false
    
    // 変更が加えられたとき発火
    this.onchanged = () => {}
    
    this.on_annotations_changed = annotations => {}
   }
  
  static make_content_manager(target = {}, option = {}) {
    if (target instanceof P.Project) {
      return new ProjectInfoContentManager(target)
    }
    
    if (option.type == 'colorpalette') {
      return new ColorpaletteContentManager(target)
    }
    
    if (target.is_document) {
      return new DocumentContentManager(target)
    }
    
    switch (target.extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
      case 'svg':
      case 'bmp':
      case 'apng':
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
      self.onchanged()
    }
    
    // 構文解析のモード変更時
    this.on_ace_editor_change_mode = (e, session) => {
      const ace_mode = self.get_ace_editor_mode(self.target.type)
        
      if (ace_mode == 'javascript') {
        if (session.$worker) {
          session.$worker.send("setOptions", [{
            asi: true,
            esversion: 15,
            maxerr: 10000
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
    ace_editor.getSession().removeListener('change', this.on_ace_editor_changed)
    ace_editor.getSession().removeListener('changeMode', this.on_ace_editor_change_mode)
    ace_editor.getSession().removeListener('changeAnnotation', this.on_ace_editor_change_annotations)
    this.ace_cursor = ace_editor.getCursorPosition()
    this.ace_scroll_top = ace_editor.getSession().getScrollTop()
  }
  
  save() {
    if (this.is_active) {
      this.text = ace_editor.getValue()
    }
    
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
    menu_project_info.innerText = 'このファイル(TPROJECTファイル)は、プロジェクト情報を保存しており、エディタによって自動編集されます。\nこれらの値を変更するには、「プロジェクト」メニューを開いてください。'
    content.appendChild(menu_project_info)
    
    const menu_project_update_info = document.createElement('div')
    menu_project_update_info.className = 'message-info'
    menu_project_update_info.innerText = 'プロジェクト情報の変更を反映するには、このタブを開き直してください。'
    content.appendChild(menu_project_update_info)
    
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

class ColorpaletteContentManager extends ContentManager {
  constructor() {
    super()
    this.content = this.create_content()
    this.header = 'カラーパレット'
  }
  
  create_content(file) {
    const content = document.createElement('div')
    content.className = 'tab-content'
    content.style.margin = '20px'
    
    const size = 300
    
    const palette = document.createElement('div')
    palette.style.width = size + 'px'
    palette.style.height = size + 'px'
    palette.style.position = 'relative'
    content.appendChild(palette)
    
    const circle = document.createElement('div')
    circle.style.borderRadius = size / 2 + 'px'
    circle.style.width = size + 'px'
    circle.style.height = size + 'px'
    circle.style.position = 'absolute'
    let conic = 'conic-gradient(from 0.25turn,'
    for (let h = 255; h >= 0; h--) {
      conic += Colors.get_hsv(h, 255, 255) + (h == 0 ? '' : ',')
    }
    conic += ')'
    circle.style.background = conic
    circle.style.border = '1px solid gray'
    palette.appendChild(circle)
    
    const circle_point = document.createElement('div')
    circle_point.style.borderRadius = size * 0.05 / 2 + 'px'
    circle_point.style.width = size * 0.05 + 'px'
    circle_point.style.height = size * 0.05 + 'px'
    circle_point.style.background = 'white'
    circle_point.style.border = '2px solid black'
    circle_point.style.position = 'absolute'
    circle_point.style.transform = 'translate(-50%, -50%)'
    palette.appendChild(circle_point)
    
    const circle_inside = document.createElement('div')
    circle_inside.style.borderRadius = size * 0.8 / 2 + 'px'
    circle_inside.style.width = size * 0.8 + 'px'
    circle_inside.style.height = size * 0.8 + 'px'
    circle_inside.style.background = 'var(--base-color)'
    circle_inside.style.position = 'absolute'
    circle_inside.style.left = '50%'
    circle_inside.style.top = '50%'
    circle_inside.style.transform = 'translate(-50%, -50%)'
    circle_inside.style.border = '1px solid gray'
    palette.appendChild(circle_inside)
    
    const sv_box = document.createElement('div')
    sv_box.style.width = size * 0.525 + 'px'
    sv_box.style.height = size * 0.525 + 'px'
    sv_box.style.position = 'absolute'
    sv_box.style.left = '50%'
    sv_box.style.top = '50%'
    sv_box.style.transform = 'translate(-50%, -50%)'
    palette.appendChild(sv_box)
    
    const sv = document.createElement('canvas')
    sv.width = 256
    sv.height = 256
    sv.style.background = 'linear-gradient(to bottom,#00000000, #000000ff),linear-gradient(to right, #ffffff, #ff0000)'
    sv.style.width = '100%'
    sv.style.height = '100%'
    sv.style.border = '1px solid gray'
    sv_box.appendChild(sv)
    const sv_ctx = sv.getContext('2d')
    
    const sv_point = document.createElement('div')
    sv_point.style.borderRadius = size * 0.05 / 2 + 'px'
    sv_point.style.width = size * 0.05 + 'px'
    sv_point.style.height = size * 0.05 + 'px'
    sv_point.style.background = 'white'
    sv_point.style.border = '2px solid black'
    sv_point.style.position = 'absolute'
    sv_point.style.transform = 'translate(-50%, -50%)'
    sv_box.appendChild(sv_point)
    
    const colorcode_box = document.createElement('div')
    colorcode_box.style.display = 'flex'
    colorcode_box.style.width = 'fit-content'
    colorcode_box.style.margin = '10px 0'
    colorcode_box.style.padding = '10px'
    colorcode_box.style.borderRadius = '10px'
    colorcode_box.style.alignItems = 'center'
    
    const colorcode = document.createElement('span')
    colorcode.style.font = '30px var(--code-font)'
    colorcode_box.appendChild(colorcode)
    
    const colorcode_copy = document.createElement('span')
    colorcode_copy.style.font = '25px var(--icon-font)'
    colorcode_copy.innerText = 'content_copy'
    colorcode_copy.style.marginLeft = '20px'
    colorcode_box.appendChild(colorcode_copy)
    colorcode_copy.addEventListener('click', () => {
      navigator.clipboard.writeText(colorcode.innerText)
      colorcode_copy.innerText = 'check'
    })
    
    content.appendChild(colorcode_box)
    
    //プログラム部
    let h = 0
    let s = 0
    let v = 0
    
    function update_color() {
      const hex = Colors.get_hsv(h, s, v)
      colorcode.innerText = hex
      colorcode_box.style.background = hex
      colorcode_box.style.color = v > 128 ? 'black' : 'white'
      colorcode_copy.innerText = 'content_copy'
    }
    
    function set_circle(x, y) {
      const angle = Math.atan2(y, x)
      
      circle_point.style.left = (0.5 + Math.cos(angle) * 0.45) * 100 + '%'
      circle_point.style.top = (0.5 + Math.sin(angle) * 0.45) * 100 + '%'
      
      const h = Math.floor((2 * Math.PI - angle) * 255 / (Math.PI * 2))
      set_h(h)
      
      update_color()
    }
    
    function set_h(new_h) {
      h = new_h
      paint_sv()
    }
    
    function paint_sv() {
      sv.style.background = `linear-gradient(to bottom,#00000000,#000000ff),linear-gradient(to right, #ffffff, ${Colors.get_hsv(h,255,255)})`
      return
      for (let x = 0; x < 256; x++) {
        for (let y = 0; y < 256; y++) {
          const color = Colors.get_hsv(h, x, 255 - y)
          sv_ctx.fillStyle = color
          sv_ctx.fillRect(x, y, 1, 1)
        }
      }
    }
    
    function set_sv(x, y) {
      x = Math.floor(Math.min(Math.max(x, 0), 255))
      y = Math.floor(Math.min(Math.max(y, 0), 255))
      
      s = x
      v = 255 - y
      
      sv_point.style.left = x / 256 * 100 + '%'
      sv_point.style.top = y / 256 * 100 + '%'
      
      update_color()
    }
    
    circle_inside.addEventListener('click', e => {
      e.stopPropagation()
    })
    
    function initialize_circle() {
      let is_mouse_down = false
      
      circle.addEventListener('mousedown', e => {
        is_mouse_down = true
        
        if (!is_mouse_down) {
          return
        }
        
        const rect = palette.getBoundingClientRect()
        set_circle(e.clientX - rect.left - size / 2, e.clientY - rect.top - size / 2)
      })
      
      circle.addEventListener('touchstart', e => {
        is_mouse_down = true
        
        if (!is_mouse_down) {
          return
        }
        
        const rect = palette.getBoundingClientRect()
        set_circle(e.touches[0].clientX - rect.left - size / 2, e.touches[0].clientY - rect.top - size / 2)
      })
      
      window.addEventListener('mouseup', () => {
        is_mouse_down = false
      })
      
      window.addEventListener('touchend', () => {
        is_mouse_down = false
      })
      
      window.addEventListener('mousemove', e => {
        if (!is_mouse_down) {
          return
        }
        
        const rect = palette.getBoundingClientRect()
        set_circle(e.clientX - rect.left - size / 2, e.clientY - rect.top - size / 2)
      })
      
      window.addEventListener('touchmove', e => {
        if (!is_mouse_down) {
          return
        }
        
        const rect = palette.getBoundingClientRect()
        set_circle(e.touches[0].clientX - rect.left - size / 2, e.touches[0].clientY - rect.top - size / 2)
      })
    }
    initialize_circle()
    
    function initialize_sv() {
      let is_mouse_down = false
      
      function on_mouse_change(x, y) {
        if (!is_mouse_down) {
          return
        }
        
        const rect = sv.getBoundingClientRect()
        set_sv((x - rect.left) / rect.width * 256, (y - rect.top) / rect.height * 256)
      }
      
      sv.addEventListener('mousedown', e => {
        is_mouse_down = true
        on_mouse_change(e.clientX, e.clientY)
      })
      
      sv.addEventListener('touchstart', () => {
        is_mouse_down = true
      })
      
      window.addEventListener('mouseup', () => {
        is_mouse_down = false
      })
      
      window.addEventListener('touchend', () => {
        is_mouse_down = false
      })
      
      window.addEventListener('mousemove', e => {
        on_mouse_change(e.clientX, e.clientY)
      })
      
      window.addEventListener('touchmove', e => {
        on_mouse_change(e.touches[0].clientX, e.touches[0].clientY)
      })
    }
    initialize_sv()
    
    set_circle(1000, 0)
    paint_sv()
    
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
