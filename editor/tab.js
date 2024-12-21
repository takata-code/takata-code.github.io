//======
// Tab
//======

import CM from './content_manager.js'

const tabs = []
const tab_headers = document.getElementById('tab_headers')
const tab_content_container = document.getElementById('tab_content_container')

export default class Tab {
  static get_all_tabs() {
    return tabs
  }
  
  static get_active_tab() {
    return tabs.find(tab => tab.is_active)
  }
  
  static undo() {
    Tab.get_active_tab()?.cm.undo()
  }
  
  static redo() {
    Tab.get_active_tab()?.cm.redo()
  }
  
  constructor(file) {
    this.file = file
    this.tab_header = this.create_tab_header(file)
    this.cm = CM.make_content_manager(file)
    this.cm.onchanged = () => this.on_cm_changed()
    this.is_active = false
    this.unsaved = false
    
    tabs.push(this)
  }
  
  create_tab_header(file) {
    const tab_header = document.createElement('div')
    tab_header.className = 'tab-header'
    
    const name = document.createElement('span')
    name.className = 'tab-header-name'
    name.innerText = file.name
    tab_header.appendChild(name)
    
    const close = document.createElement('span')
    close.className = 'tab-header-close'
    close.innerText = 'close'
    close.addEventListener('click', e => {
      if (this.unsaved) {
        this.close()
        if (confirm('変更を保存しますか')) {
          this.save()
        }
      } else {
        this.close()
      }
      e.stopPropagation()
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
    
    if (!is_active) {
      return
    }
    
    if (tab_headers.children.length > 0) {
      let next_index = index - 1 >= 0 ? index - 1 : index
      tab_headers.children[next_index].tab.activate()
    }
  }
  
  activate() {
    const active_tab = tabs.find(tab => tab.is_active)
    if (active_tab) {
      active_tab.deactivate()
    }
    
    this.is_active = true
    
    this.select_tab_header()
    
    tab_content_container.innerHTML = ''
    if (this.cm.content) {
      tab_content_container.appendChild(this.cm.content)
    }
    this.cm.activate()
  }
  
  deactivate() {
    this.is_active = false
    
    this.cm.deactivate()
    
    if (tabs.some(tab => tab.is_active)) {
      return
    }
    
    tab_content_container.innerHTML = ''
  }
  
  save() {
    if (this.unsaved) {
      this.cm.save()
      this.tab_header.close.innerText = 'close'
      this.unsaved = false
    }
  }
  
  export_data() {
    
  }
  
  static get_tab(file) {
    const found = tabs.find(tab => tab.file == file)
    
    if (found) {
      return found
    }
    
    return new Tab(file)
  }
}