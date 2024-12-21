//=============
// Project IO
//=============

import P from './project.js'

const module = {}

function blob_to_base64(blob) {
  return new Promise(resolve => {
    const file_reader = new FileReader()
    
    file_reader.onloadend = () => {
      resolve(file_reader.result)
    }
    
    file_reader.readAsDataURL(blob)
  })
}

function base64_to_blob(base64) {
  let bin = atob(base64.split(',')[1])
  
  let buffer = new Uint8Array(bin.length)
  
  for (let i = 0; i < bin.length; i++) {
    buffer[i] = bin.charCodeAt(i)
  }
  
  let blob = new Blob([buffer.buffer], { type: 'application/zip' })
  return blob
}

module.Importer = class {
  static import_text(str) {
    // 名前部分抽出 (Name/vX.X.X)
    /*
    const header = str.match(/[^\{]+(?=\{)/)
    
    if (header.length == 0) {
    throw new Error()
    }
    
    let name, version
    
    if (header[0].includes('/')) {
    name = header.substr(0, header.indexOf('/'))
    version = header.substr(header.indexOf('/'), header.length)
    }
    */
    
    const json_match = str.match(/\{[^\{\}]*}/)
    if (json_match.length == 0) {
      throw new Error()
    }
    
    const json_str = json_match[0]
    let json
    
    try {
      json = JSON.parse(json_str)
    } catch {
      throw new Error()
    }
    
    const project = new module.Project(name)
    
    // project に File を追加する
    for (const path in json) {
      const file_json = json[path]
      const blob = base64_to_blob(file_json.blob)
      
      const file = module.File(path, blob)
      
      project.add_file(file)
    }
    
    // 設定ファイル
    let settings_file = project.get_file('project.json')
    let settings_json = blob_to_text(settings_file.blob)
    
    project.name = settings.project_name
    project.version = settings.version
    
    return project
  }
  
  static async import_zip(zip_file) {
    try {
      const data = zip_file.arrayBuffer()
      const jszip = new JSZip()
      await jszip.loadAsync(data)
      
      let project_name = jszip.files[Object.keys(jszip.files)[0]].name.match(/^[^\/]+/)[0]
      
      if (!project_name) {
        throw new Error('CANNOT_FIND_PROJECT_NAME')
      }
      
      const project = new P.Project(project_name)
      
      for (const path in jszip.files) {
        const jszip_file = jszip.files[path]
        
        if (!jszip_file.dir) {
          const blob = await jszip_file.async('blob')
          
          const path = jszip_file.name.replace(`${ project_name }/`, '')
          
          const file = new P.File(path, blob)
          await file.load()
          project.add_file(file)
        }
      }
      
      return project
    } catch(e) {
      throw e
    }
  }
}

module.Exporter = class {
  static async export_text(project) {
    let obj = { }
    
    for (const file of project.files) {
      obj[file.path] = await blob_to_base64(file.blob)
    }
    return project.name + JSON.stringify(obj)
  }
  
  static async export_zip(project){
    const jszip = new JSZip()
    
    for (const file of project.files) {
      jszip.file(file.path, file.blob)
    }
    
    let project_zip = await jszip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 } })
    return project_zip
  }
}

export default module