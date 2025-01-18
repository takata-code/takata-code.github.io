//======
// Tab
//======

import CM from './content_manager.js'
import DS from './dialog_system.js'
import Footer from './footer.js'
import P from './project.js'

let tabs = []
const tab_headers = document.getElementById('tab_headers')
const tab_content_container = document.getElementById('tab_content_container')

export default class Tab {
  static clear() {
    tabs = []
    tab_headers.innerHTML = ''
    tab_content_container.innerHTML = ''
  }
  
  static get_all_tabs() {
    return tabs
  }
  
  static get_active_tab() {
    return tabs.find(tab => tab.is_active)
  }
  
  static update() {
    for (const tab of tabs) {
      const old_header = tab.tab_header
      const new_header = tab.create_tab_header(tab.target, tab.is_active)
      
      tab_headers.replaceChild(new_header, old_header)
      tab.tab_header = new_header
    }
  }
  
  static input(text) {
    const tab = Tab.get_active_tab()
    
    if (tab) {
      tab.cm.input(text)
    }
  }
  
  static undo() {
    Tab.get_active_tab()?.cm.undo()
  }
  
  static redo() {
    Tab.get_active_tab()?.cm.redo()
  }
  
  constructor(file, option = {}) {
    this.target = file
    this.cm = CM.make_content_manager(file, option)
    this.cm.onchanged = () => this.on_cm_changed()
    this.cm.on_annotations_changed = a => this.on_cm_annotations_changed(a)
    this.tab_header = this.create_tab_header(file, option)
    this.is_active = false
    this.unsaved = false
    
    tabs.push(this)
  }
  
  create_tab_header(file, option) {
    const tab_header = document.createElement('div')
    tab_header.className = 'tab-header' + (this.is_active ? ' tab-header-selected' : '')
    
    const icon = document.createElement('span')
    icon.className = 'tab-header-icon'
    icon.innerText = file instanceof P.File ? file.get_icon().char : ''
    icon.style.color = file instanceof P.File ? file.get_icon().color : ''
    tab_header.appendChild(icon)
    
    const name = document.createElement('span')
    name.className = 'tab-header-name'
    name.innerText = this.cm.header || file.name
    tab_header.appendChild(name)
    
    const close = document.createElement('span')
    close.className = 'tab-header-close'
    close.innerText = this.unsaved ? 'fiber_manual_record' : 'close'
    close.addEventListener('click', e => {
      e.stopPropagation()
      
      if (this.unsaved) {
        DS.confirm(this.target.name + 'に加えた変更を保存しますか?', '保存していない内容は消えてしまいます。', '保存', '保存しない').then(result => {
          if (result) {
            this.save()
          }
          this.close()
        })
      } else {
        this.close()
      }
    })
    tab_header.appendChild(close)
    
    tab_header.tab = this
    tab_header.close = close
    
    tab_header.addEventListener('click', () => {
      this.activate()
    })
    
    return tab_header
  }
  
  on_cm_changed() {
    this.tab_header.close.innerText = 'fiber_manual_record'
    this.unsaved = true
    Footer.set_unsaved(Tab.get_all_tabs().filter(t => t.unsaved).length)
  }
  
  on_cm_annotations_changed(annotations) {
    Footer.set_annotations(annotations)
  }
  
  open() {
    // すでにタブが開かれている?
    let tab_already_opened = false
    for (const header of tab_headers.children) {
      if (header.tab == this) {
        tab_already_opened = true
        break
      }
    }
    
    if (!tab_already_opened) {
      tab_headers.appendChild(this.tab_header)
    }
    
    this.activate()
  }
  
  select_tab_header() {
    for (const header of tab_headers.children) {
      header.className = 'tab-header'
    }
    
    this.tab_header.className = 'tab-header tab-header-selected'
  }
  
  close() {
    const is_active = this.is_active
    
    this.deactivate()
    
    tabs.splice(tabs.indexOf(this), 1)
    
    let index = Array.from(tab_headers.children).indexOf(this.tab_header)
    tab_headers.removeChild(this.tab_header)
    
    // 元からアクティブでなかったならば、何もしない
    if (!is_active) {
      return
    }
    
    // 次の Tab を決定する
    if (tab_headers.children.length > 0) {
      let next_index = index - 1 >= 0 ? index - 1 : index
      tab_headers.children[next_index].tab.activate()
    }
    
    // ここでこの Tab は GC の餌食
  }
  
  activate() {
    const active_tab = tabs.find(tab => tab.is_active)
    if (active_tab) {
      active_tab.deactivate()
    }
    
    this.is_active = true
    this.cm.is_active = true
    
    this.select_tab_header()
    
    tab_content_container.innerHTML = ''
    if (this.cm.content) {
      tab_content_container.appendChild(this.cm.content)
    }
    this.cm.activate()
  }
  
  deactivate() {
    if (!this.is_active) {
      return
    }
    
    this.is_active = false
    this.cm.is_active = false
    
    this.cm.deactivate()
    
    if (tabs.some(tab => tab.is_active)) {
      return
    }
    
    tab_content_container.innerHTML = ''
    Footer.set_annotations([])
  }
  
  save() {
    if (this.unsaved) {
      this.cm.save()
      this.tab_header.close.innerText = 'close'
      this.unsaved = false
    }
    
    Footer.set_unsaved(Tab.get_all_tabs().filter(t => t.unsaved).length)
  }
  
  export_data() {
    
  }
  
  static get_tab(file, option = {}) {
    const found = tabs.find(tab => tab.target == file)
    
    if (found) {
      return found
    }
    
    return new Tab(file, option)
  }
}