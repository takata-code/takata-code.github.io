//=========
// Footer
//=========

export default class Footer {
  static set_unsaved(count) {
    const footer_indicator_unsaved_icon = document.getElementById('footer_indicator_unsaved_icon')
    const footer_indicator_unsaved_text = document.getElementById('footer_indicator_unsaved_text')
    
    if (count == 0) {
      footer_indicator_unsaved_icon.innerText = 'check_circle'
      footer_indicator_unsaved_icon.style.color = 'var(--ok-color)'
      footer_indicator_unsaved_text.innerText = 'すべて保存済み'
    } else {
      footer_indicator_unsaved_icon.innerText = 'circle'
      footer_indicator_unsaved_icon.style.color = 'var(--info-color)'
      footer_indicator_unsaved_text.innerText = count + '個のアイテムが未保存'
    }
  }
  
  static set_annotations(raw_annos) {
    const errors_icon = document.getElementById('footer_indicator_errors_icon')
    const warnings_icon = document.getElementById('footer_indicator_warnings_icon')
    const infos_icon = document.getElementById('footer_indicator_infos_icon')
    const footer_indicator_errors = document.getElementById('footer_indicator_errors_text')
    const footer_indicator_warnings = document.getElementById('footer_indicator_warnings_text')
    const footer_indicator_infos = document.getElementById('footer_indicator_infos_text')
    
    const footer_annotations = document.getElementById('footer_annotations')
    footer_annotations.innerHTML = ''
    
    const errors = []
    const warnings = []
    const infos = []
    
    for (const raw_anno of raw_annos) {
      switch (raw_anno.type) {
        case 'error':
          errors.push(raw_anno)
          break
        
        case 'warning':
          warnings.push(raw_anno)
          break
        
        case 'info':
          infos.push(raw_anno)
          break
      }
    }
    
    errors_icon.style.color = errors.length == 0 ? '' : 'var(--error-color)'
    warnings_icon.style.color = warnings.length == 0 ? '' : 'var(--warning-color)'
    infos_icon.style.color = infos.length == 0 ? '' : 'var(--info-color)'
    footer_indicator_errors.innerText = errors.length
    footer_indicator_warnings.innerText = warnings.length
    footer_indicator_infos.innerText = infos.length
    
    const annos = [].concat(errors, warnings, infos)
    
    for (const anno of annos) {
      const row = document.createElement('div')
      row.className = 'footer-annotations-row'
      
      const icon = document.createElement('span')
      icon.className = 'footer-annotations-icon'
      switch (anno.type) {
        case 'error':
          icon.innerText = 'cancel'
          icon.style.color = 'var(--error-color)'
          break
        
        case 'warning':
          icon.innerText = 'warning'
          icon.style.color = 'var(--warning-color)'
          break
        
        case 'info':
          icon.innerText = 'info'
          icon.style.color = 'var(--info-color)'
          break
      }
      
      row.appendChild(icon)
      
      const text = document.createElement('span')
      text.className = 'footer-annotations-text'
      text.innerText = `${ anno.row ? 'Line ' + anno.row + ': ' : '' } ${ anno.text }`
      row.appendChild(text)
      
      footer_annotations.appendChild(row)
    }
  }
}


Footer.set_unsaved(0)

