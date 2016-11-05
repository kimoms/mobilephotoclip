依赖插件
jquery.min.js
iscroll-zoom.js
mobileBUGFix.mini.js
exif.js

在移动设备上双指捏合为缩放
在PC设备上鼠标滚轮为缩放
解决在iphone上照片横拍和竖拍方向自动条整的问题
解决在iphone上画布尺寸太大不会渲染的问题
裁剪效果android和iphone上完全一致
提供按固定尺寸裁剪和按比例裁剪两种模式

支持的参数
 * @option_param {number} width 截取区域的宽度
 * @option_param {number} height 截取区域的高度
 * @option_param {string} file 上传图片的<input type="file">控件的选择器或者DOM对象
 * @option_param {string} view 显示截取后图像的容器的选择器或者DOM对象
 * @option_param {string} ok 确认截图按钮的选择器或者DOM对象
 * @option_param {string} hideBtn 不做任何处理隐藏藏界面按钮的选择器或者DOM对象
 * @option_param {string} rotateBtn 旋转按钮的选择器或者DOM对象
 * @option_param {string} toggleOBtn 切换裁切区域宽高的按钮的选择器或者DOM对象
 * @option_param {string} reclipBtn 裁切预览界面重新裁切按钮的选择器或者DOM对象
 * @option_param {string} clipOkBtn 裁切预览界面确认裁切按钮的选择器或者DOM对象 
 * @option_param {string} noclipBtn 不裁剪直接上传按钮的选择器或者DOM对象
 * @option_param {string} initImgDataURL 初始图片dataURL
 * @option_param {string} quality 图片压缩比例，默认值0.8
 * @option_param {boolean} strictSize 是否严格按照截取区域宽高裁剪。默认为false，表示截取区域宽高仅用于约束宽高比例。如果设置为true，则表示截取出的图像宽高严格按照截取区域宽高输出
 * @option_param {function} loadStart 开始加载的回调函数。this指向 fileReader 对象，并将正在加载的 file 对象作为参数传入
 * @option_param {function} loadComplete 加载完成的回调函数。this指向图片对象，并将图片地址作为参数传入
 * @option_param {function} loadError 加载失败的回调函数。this指向 fileReader 对象，并将错误事件的 event 对象作为参数传入
 * @option_param {function} clipFinish 裁剪完成的回调函数。
 * @option_param {function} clipOk 确认裁剪并上传的回调函数。会将裁剪出的图像数据DataURL作为参数传入
