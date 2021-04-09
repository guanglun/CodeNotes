# CodeNotes   

* 安装包：npm i
* 打包：vsce package
* 发布：vsce publish
* 由于sqlite3库导致的兼容性问题，目前没有太好的解决办法。只能每次npm i 库之后将package/sqlite3目录下的3个文件夹手动放入node_modules/sqlite3/lib/binding中