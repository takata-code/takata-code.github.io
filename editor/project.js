//==========
// Project
//==========

const module = {}

module.Directory = class {
  constructor(path) {
    this.path = path
    this.children = []
  }
  
  get name() {
    const matches = this.path.match(/[^\/]+\/$/)
    if (matches.length != 0) {
      return matches[0].replace('/', '')
    }
  }
}

module.File = class {
  static get_mime_type(extension) {
    switch (extension) {
      case 'html': return 'text/html'
      case 'css': return 'text/css'
      case 'js': return 'text/javascript'
      case 'json': return 'application/json'
      case 'txt': return 'txt'
      default: return ''
    }
  }
  
  static get_is_document(extension) {
    switch (extension) {
      case 'html':
      case 'css':
      case 'js':
      case 'json':
      case 'txt':
      case 'csv':
        return true
    }
    return false
  }
  
  constructor(path, blob) {
    this.path = path
    this.blob = blob
    this.type = module.File.get_mime_type(this.extension)
    this.is_document = module.File.get_is_document(this.extension)
  }
  
  async load() {
    this.text = await this.blob.text()
  }
  
  get name() {
    const matches = this.path.match(/[^\/]+$/)
    
    if (matches.length != 0) {
      return matches[0]
    }
  }
  
  get extension() {
    const matches = this.path.match(/[^\.]+$/)
    return matches[0]
  }
  
  get_icon() {
    switch (this.extension) {
      case 'html':
        return { char: 'code', color: '#66fa75' }
      case 'css':
        return { char: 'brush', color: '#ed9b53' }
      case 'js':
        return { char: 'data_object', color: '#edc953' }
      case 'csv':
        return { char: 'table', color: '#e0e0e0' }
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
      case 'svg':
      case 'bmp':
      case 'apng':
        return { char: 'image', color: '#e0e0e0' }
      case 'txt':
        return { char: 'description', color: '#e0e0e0' }
      case 'wav':
      case 'mp3':
        return { char: 'music_note', color: '#e0e0e0' }
      case 'tproject':
        return { char: 'manufacturing', color: '#9c6dd6' }
      default:
        return { char: 'unknown_document', color: '#e0e0e0' }
    }
  }
}

module.Project = class {
  constructor(project_name) {
    this._name = project_name
    this.root = null
    this.version = null
    this._files = []
    this.directories = []
    this._make_directories()
  }
  
  get name() {
    return this._name
  }
  
  set name(v) {
    this._name = v
    this._make_directories()
  }
  
  get files() {
    return this._files
  }
  
  add_file(file) {
    this._files.push(file)
    this._make_directories()
  }
  
  change_file_name(old, name) {
    const file = this.files.find(f => f.path == old)
    
    if (!file) {
      return false
    }
    
    file.path = file.path.replace(/[^\/]+$/, name)
    
    this._make_directories()
    return true
  }
  
  delete_file(path) {
    const index = this.files.map(f => f.path).indexOf(path)
    
    if (index == -1) {
      return false
    }
    
    this.files.splice(index, 1)
    this._make_directories()
    
    return true
  }
  
  add_folder(path) {
    this.directories.push(path)
    this._make_directories()
  }
  
  change_folder_name(old, name) {
    const dir = this.directories.find(d => d == old)
    const path = old.replace(/[^\/]+\/$/, name + '/')
    
    if (!dir) {
      return false
    }
    
    this.directories[this.directories.indexOf(old)] = path
    
    for (const file of this.files) {
      if (file.path.startsWith(old)) {
        file.path = file.path.replace(old, path)
      }
    }
    
    this._make_directories()
    return true
  }
  
  delete_folder(path) {
    const index = this.directories.indexOf(path)
    
    if (index == -1) {
      alert('削除するフォルダのディレクトリインデックスを見つけられません')
      return false
    }
    
    const files = this.files.concat()
    
    for (const file of files) {
      if (file.path.startsWith(path)) {
        this.delete_file(file.path)
      }
    }
    
    const inner_directories = this.get_directory(path).children.filter(e => {
      return e instanceof module.Directory
    }).map(e => {
      return e.path
    })
    
    for (const directory of inner_directories) {
      this.delete_folder(directory)
    }
    
    this.directories.splice(index, 1)
    this._make_directories()
    
    return true
  }
  
  get_file(path) {
    let file = this._files.find(f => f.path == file_path)
    return file
  }
  
  get_directory(path) {
    const path_list  = path.split('/')
    const directory_names = path_list.slice(0, path_list.length - 1)
    
    let directory = this.root
    for (let  i = 0; i < directory_names.length; i++) {
      const directory_name = directory_names[i]
      let child_directory = directory.children.filter(c => c.name == directory_name)
      
      directory = child_directory[0]
    }
    return directory
  }
  
  // ディレクトリの再構築を行い整合性を保つ
  _make_directories() {
    this.root = new module.Directory(this.name + '/')
    
    for (const dir_path of this.directories) {
      const path_list  = dir_path.split('/')
      const directory_names = path_list.slice(0, path_list.length - 1)
      let directory = this.root
      
      for (let  i = 0; i < directory_names.length; i++) {
        const directory_path = directory_names.slice(0, i + 1).join('/') + '/'
        const directory_name = directory_names[i]
        
        let child_directory = directory.children.find(c => c.name == directory_name)
        
        if (!child_directory) {
          child_directory = new module.Directory(directory_path)
          
          directory.children.push(child_directory)
          
        }
        directory = child_directory
      }
    }
    
    for (const file of this._files) {
      const path_list  = file.path.split('/')
      const directory_names = path_list.slice(0, path_list.length - 1)
      const file_name = path_list[path_list.length - 1]
      
      let directory = this.root
      for (let  i = 0; i < directory_names.length; i++) {
        const directory_name = directory_names[i]
        let child_directory = directory.children.filter(c => c.name == directory_name)
        
        directory = child_directory[0]
      }
      
      directory.children.push(file)
    }
    
  }
  
  get_page_src(option) {
    // テキストにリンクが記述されていないファイルのフルパスと
    // blobに変換したオブジェクトURLのセット
    let links = []
    for (const file of this.files) {
      if (file.is_document) {
        file.code = file.text
        
        if (option.debug) {
          if (!(file.type == 'text/javascript')) {
            continue
          }
          
          const debug_code = `
import DS from 'https://takaon.net/editor/dialog_system${ '.' }js'
addEventListener('error', (event, source, lineno, colno, error) => {
  DS.alert(\`同期エラー:\\n\${ source }\`);
  return true;
});

addEventListener('unhandledrejection', (event) => {
  alert('非同期エラー:\\nevent.reason');
  return true;
});
          `//.replaceAll('\n', '')
          file.code = debug_code + file.code
        }
      }
    }
    
    // File.urls を取得
    for (const file of this.files) {
      
      file.urls = []
      if (file.is_document) {
        let maybeUrls = (file.code.match(/(?<=')[^'\n]+\.[^'\.\n]+(?=')/g) || []).concat(file.code.match(/(?<=")[^"\n]+\.[^"\.\n]+(?=")/g) || [])
        
        for (const url of maybeUrls) {
          if (url == '') {
            continue
          }
          
          let dirArray = file.path.split('/')
          let dir = 'https://www.google.com' + '/' + dirArray.join('/')
          let fullUrl
          try {
            fullUrl = new URL(url, dir).toString()
            fullUrl = fullUrl.replace('https://www.google.com/', '')
            fullUrl = fullUrl.replaceAll('%20', ' ')
          } catch(e) {
            alert('エラーが発生しました\n以降の動作が安定しない可能性があります')
          }
          // どこかのファイルを参照している？
          let link_file = this.files.find(f => f.path == fullUrl)
          if (link_file) {
            file.urls.push(fullUrl)
            file.code = file.code.replaceAll(url, fullUrl)
          }
        }
      }
    }
    
    let urlIncluded
    const loopLimit = 8
    let loop = 0
    
    do {
      loop++
      urlIncluded = false
      
      // どこにも参照していないファイルの
      // オブジェクトURLを生成する
      // (また、全ての置き換えが終わったかチェック)
      for (const file of this._files) {
        if (file.urls.length == 0) {
          const blob = file.is_document ? new Blob([file.code], { type: file.type }) : file.blob
          // XXX
          const url = URL.createObjectURL(blob).toString()
          
          links.push([file.path, url])
        } else {
          urlIncluded = true
        }
      }
      
      // linksを用いて置き換え
      for (const file of this._files) {
        let tempUrls = file.urls.concat()
        file.urls.forEach((url, i) => {
          links.forEach((link) => {
            if (link[0] == url) {
              tempUrls.splice(tempUrls.indexOf(url), 1)
            }
            file.code = file.code.replaceAll(link[0], link[1])
          })
        })
        file.urls = tempUrls
      }
    } while (urlIncluded && loop < loopLimit)
    
    const index_html_link = links.find(link => link[0] == 'index' + '.html')
    return index_html_link[1]
  }
}
export default module