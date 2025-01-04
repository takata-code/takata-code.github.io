//===============
// DialogSystem
//===============

export default class DS {
  constructor(option = {}) {
    const dialog = document.createElement('dialog')
    dialog.className = 'dialog'
    
    if (option.type == 'error') {
      dialog.style.borderColor = 'var(--error-color)'
    }
    
    const content = document.createElement('div')
    content.className = 'dialog-content'
    dialog.appendChild(content)
    
    const footer = document.createElement('div')
    footer.className = 'dialog-footer'
    dialog.appendChild(footer)
    
    this.dialog = dialog
    this.content = content
    this.footer = footer
    
    document.body.appendChild(dialog)
  }
  
  show_modal() {
    this.dialog.showModal()
  }
  
  close() {
    this.dialog.close()
    document.body.removeChild(this.dialog)
  }
  
  static alert(text, title, option) {
    const ds = new DS(option)
    
    if (title) {
      const p = document.createElement('p')
      p.innerText = title
      p.className = 'dialog-title'
      ds.content.appendChild(p)
    }
    
    const label = document.createElement('div')
    label.innerText = text
    ds.content.appendChild(label)
    
    const ok = document.createElement('button')
    ok.innerText = 'OK'
    ds.footer.appendChild(ok)
    
    ds.show_modal()
    
    return new Promise(resolve => {
      ok.addEventListener('click', () => {
        ds.close()
        resolve()
      })
    })
  }
  
  static confirm(title, detail, yes, no) {
    const ds = new DS()
    
    const p = document.createElement('p')
    p.innerText = title
    p.className = 'dialog-title'
    ds.content.appendChild(p)
    
    if (detail) {
      const label = document.createElement('div')
      label.innerText = detail
      ds.content.appendChild(label)
    }
    
    const ok = document.createElement('button')
    ok.innerText = yes || 'OK'
    ds.footer.appendChild(ok)
    
    const cancel = document.createElement('button')
    cancel.innerText = no || 'キャンセル'
    ds.footer.appendChild(cancel)
    
    ds.show_modal()
    
    return new Promise(resolve => {
      ok.addEventListener('click', () => {
        ds.close()
        resolve(true)
      })
      
      cancel.addEventListener('click', () => {
        ds.close()
        resolve(false)
      })
    })
  }
  
  static prompt(title, detail, option = {}) {
    const ds = new DS()
    
    const p = document.createElement('p')
    p.innerText = title
    p.className = 'dialog-title'
    ds.content.appendChild(p)
    
    if (detail) {
      const label = document.createElement('div')
      label.innerText = detail
      ds.content.appendChild(label)
    }
    
    const input = document.createElement('input')
    input.type = 'text'
    input.spellcheck = false
    ds.content.appendChild(input)
    
    if (option.value) {
      input.value = option.value
    }
    
      // パス文字列のため、\ / * ? " < > | を禁止
    function add_limit_for_path() {
      input.addEventListener('input', () => {
        input.value = input.value.replace(/[\\/:\*?"<>|]/, '')
      })
      
      input.addEventListener('paste', () => {
        input.value = input.value.replace(/[\\/:\*?"<>|]/, '')
      })
    }
    
    if (option.type == 'folder' || option.type == 'file') {
      add_limit_for_path()
    }
    
    const ok = document.createElement('button')
    ok.innerText = 'OK'
    ds.footer.appendChild(ok)
    
    ds.show_modal()
    
    return new Promise(resolve => {
      ok.addEventListener('click', () => {
        ds.close()
        resolve(input.value)
      })
    })
  }
  
  static dropdown(dom, messages) {
    const rect = dom.getBoundingClientRect()
    const left = rect.left
    const top = rect.bottom
    const margin = 30
    
    const dropdown = document.createElement('div')
    dropdown.className = 'dropdown'
    
    const back = document.createElement('div')
    back.className = 'dropdown-back'
    
    const onresize = () => {
      close()
    }
    
    document.body.appendChild(back)
    document.body.appendChild(dropdown)
    addEventListener('resize', onresize)
    
    
    function close() {
      document.body.removeChild(dropdown)
      document.body.removeChild(back)
      removeEventListener('resize', onresize)
    }
    
    return new Promise(resolve => {
      back.addEventListener('click', () => {
        close()
        resolve(-1)
      })
      
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i]
        
        const row = document.createElement('div')
        row.innerText = message
        
        dropdown.appendChild(row)
        
        row.addEventListener('click', e => {
          e.stopPropagation()
          close()
          resolve(i)
        })
      }
      
      const style = getComputedStyle(dropdown)
      const width = Number.parseInt(style.width)
      const height = Number.parseInt(style.height)
      
      dropdown.style.left = (left + width + margin > innerWidth ? innerWidth - width - margin : left) + 'px'
      dropdown.style.top = (top + height + margin > innerHeight ? innerHeight - height - margin : top) + 'px'
      
    })
  }
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
}