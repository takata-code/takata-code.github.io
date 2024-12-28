//===============
// DialogSystem
//===============

export default class DS {
  constructor() {
    const dialog = document.createElement('dialog')
    dialog.className = 'dialog'
    
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
  
  static alert(text, title) {
    const ds = new DS()
    
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
  
  static prompt(title, detail) {
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
    ds.content.appendChild(input)
    
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
}
