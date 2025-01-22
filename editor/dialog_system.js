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
    
    if (option.type == 'warning') {
      dialog.style.borderColor = 'var(--warning-color)'
    }
    
    if (option.type == 'info') {
      dialog.style.borderColor = 'var(--info-color)'
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
  
  static version(title, old_version = '0.0.0') {
    const ds = new DS()
    
    const p = document.createElement('p')
    p.innerText = title
    p.className = 'dialog-title'
    ds.content.appendChild(p)
    
    const old_version_label = document.createElement('span')
    old_version_label.innerText = '現在のバージョン: '
    ds.content.appendChild(old_version_label)
    
    const old_version_value = document.createElement('code')
    old_version_value.innerText = 'v' + old_version
    ds.content.appendChild(old_version_value)
    
    const version = document.createElement('div')
    version.className = 'version-selector'
    ds.content.appendChild(version)
    
    function add_version_element_normalizer(element) {
      element.addEventListener('blur', () => {
        let value = element.value
        
        if (!value.match(/^[0-9]+$/)) {
          value = value.replace(/[^0-9]/g, '')
          
          if (value.length == 0) {
            value = '0'
          }
        }
        
        element.value = value
      })
    }
    
    const version_v = document.createElement('span')
    version_v.innerText = 'v'
    version.appendChild(version_v)
    
    const version_major = document.createElement('input')
    version_major.type = 'text'
    add_version_element_normalizer(version_major)
    version_major.value = old_version.split('.')[0]
    version.appendChild(version_major)
    
    const version_p1 = document.createElement('span')
    version_p1.innerText = '.'
    version.appendChild(version_p1)
    
    const version_minor = document.createElement('input')
    version_minor.type = 'text'
    add_version_element_normalizer(version_minor)
    version_minor.value = old_version.split('.')[1]
    version.appendChild(version_minor)
    
    const version_p2 = document.createElement('span')
    version_p2.innerText = '.'
    version.appendChild(version_p2)
    
    const version_patch = document.createElement('input')
    version_patch.type = 'text'
    add_version_element_normalizer(version_patch)
    version_patch.value = old_version.split('.')[2]
    version.appendChild(version_patch)
    
    const ok = document.createElement('button')
    ok.innerText = 'OK'
    ds.footer.appendChild(ok)
    
    const cancel = document.createElement('button')
    cancel.innerText = 'キャンセル'
    ds.footer.appendChild(cancel)
    
    ds.show_modal()
    
    return new Promise(resolve => {
      ok.addEventListener('click', () => {
        ds.close()
        resolve(`${ version_major.value }.${ version_minor.value }.${ version_patch.value }`)
      })
      
      cancel.addEventListener('click', () => {
        ds.close()
        resolve(null)
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
    
    let input
    
    if (option.type == 'bigtext') {
      input = document.createElement('textarea')
      input.wrap = 'soft'
      input.spellcheck = false
      input.placeholder = 'ここに直接入力'
    } else {
      input = document.createElement('input')
      input.type = 'text'
      input.spellcheck = false
    }
    
    // 貼り付けボタンの追加
    if (option.type == 'bigtext') {
      const paste = document.createElement('button')
      paste.style.display = 'flex'
      paste.style.alignItems = 'center'
      paste.innerHTML = '<span style="font: var(--icon-font-size) var(--icon-font)">content_paste_go</span>クリップボードから貼り付け'
      paste.addEventListener('click', async () => {
        input.value = await navigator.clipboard.readText()
      })
      ds.content.appendChild(paste)
    }
    
    ds.content.appendChild(input)
    
    const ok = document.createElement('button')
    ok.innerText = 'OK'
    ds.footer.appendChild(ok)
    
    const cancel = document.createElement('button')
    cancel.innerText = 'キャンセル'
    ds.footer.appendChild(cancel)
    
    // パス文字列のため、\ / * ? " < > | を禁止
    function add_limit_for_path() {
      input.addEventListener('input', update_state)
      input.addEventListener('paste', update_state)
    }
    
    function update_state() {
      input.value = input.value.replace(/[\\/:\*?"<>|]/, '')
        
      ok.hidden = input.value.length == 0
    }
    
    input.value = option.value || ''
    
    if (option.type == 'folder' || option.type == 'file') {
      add_limit_for_path()
      
      update_state()
    }
    
    ds.show_modal()
    
    return new Promise(resolve => {
      ok.addEventListener('click', () => {
        ds.close()
        resolve(input.value)
      })
      
      cancel.addEventListener('click', () => {
        ds.close()
        resolve(null)
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