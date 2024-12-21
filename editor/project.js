//==========
// Project
//==========

const module = {}

module.Directory = class {
  constructor(name) {
    this.name = name
    this.children = []
  }
}

module.File = class {
  static get_mime_type(extension) {
    switch (extension) {
      case 'html': return 'text/html'
      case 'css': return 'text/css'
      case 'js': return 'text/javascript'
      case 'json': return 'application/json'
      default: return ''
    }
  }
  
  static get_is_document(extension) {
    switch (extension) {
      case 'html':
      case 'css':
      case 'js':
      case 'js':
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
}

module.Project = class {
  constructor(project_name) {
    this._name = project_name
    this.root = null
    this.version = null
    this._files = []
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
  
  delete_file(file_path) {
    let file_to_delete = this._files.find(file => file.path == file_path)
    
    if (!file_to_delete) {
      return false
    }
    
    this._files.splice(this._files.indexOf(file_to_delete), 1)
    this._make_directories()
    
    return true
  }
  
  get_file(path) {
    let file = this._files.find(f => f.path == file_path)
    return file
  }
  
  // ディレクトリの再構築を行い整合性を保つ
  _make_directories() {
    this.root = new module.Directory(this.name)
    
    for (const file of this._files) {
      const path_list  = file.path.split('/')
      const directory_names = path_list.slice(0, path_list.length - 1)
      const file_name = path_list[path_list.length - 1]
      
      let directory = this.root
      
      for (const directory_name of directory_names) {
        let child_directory = directory.children.find(c => c.name == directory_name)
        
        if (!child_directory) {
          child_directory = new module.Directory(directory_name) 
          directory.children.push(child_directory)
          
        }
        directory = child_directory
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
            continue// elem.code = is_debug ? 'onerror = (event, source, lineno, colno, error) => { let line = lineno - 1 == 0 ? \'行番号不明\' : lineno - 1 + \'行目\'; alert(`${line}: エラー\\n${error}`) }\n' + elem.code: elem.code
          }
          
          const debug_code = `
addEventListener('error', (event, source, lineno, colno, error) => {
  alert(\`同期エラー:\\n\${ source }\`);
  return true;
});

addEventListener('unhandledrejection', (event) => {
  alert('非同期エラー:\\nevent.reason');
  return true;
});
          `
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