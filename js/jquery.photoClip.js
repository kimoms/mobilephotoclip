/**
 * 依赖插件
 * - iscroll-zoom.js
 * - mobileBUGFix.mini.js
 * @brief	支持手势的裁图插件
 *			在移动设备上双指捏合为缩放
 *			在PC设备上鼠标滚轮为缩放
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
 * //@option_param {string} outputType 指定输出图片的类型，可选 "jpg" 和 "png" 两种种类型，默认为 "jpg"
 * @option_param {boolean} strictSize 是否严格按照截取区域宽高裁剪。默认为false，表示截取区域宽高仅用于约束宽高比例。如果设置为true，则表示截取出的图像宽高严格按照截取区域宽高输出
 * @option_param {function} loadStart 开始加载的回调函数。this指向 fileReader 对象，并将正在加载的 file 对象作为参数传入
 * @option_param {function} loadComplete 加载完成的回调函数。this指向图片对象，并将图片地址作为参数传入
 * @option_param {function} loadError 加载失败的回调函数。this指向 fileReader 对象，并将错误事件的 event 对象作为参数传入
 * @option_param {function} clipFinish 裁剪完成的回调函数。
 * @option_param {function} clipOk 确认裁剪并上传的回调函数。会将裁剪出的图像数据DataURL作为参数传入
 */

(function(root, factory) {
	"use strict";

	if (typeof define === "function" && define.amd) {
		define(["jquery", "iscroll-zoom", "exif"], factory);
	} else if (typeof exports === "object") {
		module.exports = factory(require("jquery"), require("iscroll-zoom"), require("exif"));
	} else {
		factory(root.jQuery, root.IScroll, root.EXIF);
	}

}(this, function($, IScroll, EXIF) {
	"use strict";

	$.fn.photoClip = function(option) {
		if (!window.FileReader) {
			alert("您的浏览器不支持 HTML5 的 FileReader API， 因此无法初始化图片裁剪插件，请更换最新的浏览器！");
			return;
		}

		var defaultOption = {
			width: 200,
			height: 200,
			file: "",
			view: "",
			ok: "",
			hideBtn: "",
			rotateBtn: "",
			toggleOBtn: "",
			reclipBtn: "",
			clipOkBtn: "",
			noclipBtn: "",
			initImgDataURL: "",
			quality: 0.8,
			//outputType: "jpg",
			strictSize: false,
			loadStart: function() {},
			loadComplete: function() {},
			loadError: function() {},
			clipStart: function(){},
			clipFinish: function() {}
		}
		$.extend(defaultOption, option);

		this.each(function() {
			photoClip(this, defaultOption);
		});

		return this;
	}

	function photoClip(container, option) {
		var clipWidth = option.width,
			clipHeight = option.height,
			file = option.file,
			view = option.view,
			ok = option.ok,
			hideBtn = option.hideBtn,
			rotateBtn = option.rotateBtn,
			toggleOBtn = option.toggleOBtn,
			reclipBtn = option.reclipBtn,
			clipOkBtn = option.clipOkBtn,
			noclipBtn = option.noclipBtn,
			initImgDataURL = option.initImgDataURL,
			quality = option.quality,
			//outputType = option.outputType || "image/jpeg",
			outputType = "image/jpeg",
			strictSize = option.strictSize,
			loadStart = option.loadStart,
			loadComplete = option.loadComplete,
			loadError = option.loadError,
			clipStart = option.clipStart,
			clipFinish = option.clipFinish,
			clipOk = option.clipOk;

		/*if (outputType === "jpg") {
			outputType = "image/jpeg";
		} else if (outputType === "png") {
			outputType = "image/png";
		}*/

		var $file = $(file);
		if (!$file.length) return;

		var $img,
			imgWidth, imgHeight, //图片当前的宽高
			imgLoaded; //图片是否已经加载完成

		$file.attr("accept", "image/*");
		$file.change(function() {
			if (!this.files.length) return;
			var files = this.files[0];
			
			if ( !/image\/\w+/.test(files.type) || !(/jpg/.test(files.type) || /jpeg/.test(files.type) || /gif/.test(files.type) || /png/.test(files.type)) ) {
				alert("图片格式不正确，请选择jpg/png/gif格式的图片文件！");
				loadError.call(this);
				return false;
			} else {
				var base64, Orientation;

				/*获取照片的扩展信息*/
				EXIF.getData(files, function() {
					EXIF.getAllTags(this);
				    Orientation = EXIF.getTag(this, 'Orientation');
				    // alert(Orientation);
				});

				var fileReader = new FileReader();
				fileReader.onprogress = function(e) {
					//console.log((e.loaded / e.total * 100).toFixed() + "%");/*四舍五入到指定小数位的数字*/
				};
				fileReader.onload = function(e) {
					
					//修复ios
					if (navigator.userAgent.match(/iphone/i)) {
						
						if(Orientation > 1){
							var image = new Image();
							image.src = this.result;
							image.onload = function() {
								var size = imgSizeChange(this.naturalWidth, this.naturalHeight);
								var expectWidth = size.width;
								var expectHeight = size.height;
								
								var canvas = document.createElement("canvas");
								var ctx = canvas.getContext("2d");
								canvas.width = expectWidth;
								canvas.height = expectHeight;

								//alert('旋转处理');
								switch(Orientation){
								 	case 6:
								 		//alert('需要顺时针（向右）90度旋转');
								 		rotateIphoneImg(this,'left',canvas);
								 		break;
								 	case 8:
								 		//alert('需要逆时针（向左）90度旋转');
								 		rotateIphoneImg(this,'turnover',canvas);
								 		break;
								 	case 3://需要180度旋转
								 		//alert('需要180度旋转');
										rotateIphoneImg(this,'right',canvas);
										break;
								}
								base64 = canvas.toDataURL("image/jpeg", 90);
								createImg(base64);
							}							
						}else{
							createImg(this.result);
						}
					}else{
						createImg(this.result);
					}
					
					
					//createImg(this.result);
				};
				fileReader.onerror = function(e) {
					alert("图片加载失败");
					loadError.call(this, e);
				};
				fileReader.readAsDataURL(files); // 读取文件内容

				loadStart.call(fileReader, files);
			}
		});

		$file.click(function() {
			this.value = "";
		});



		var $container, // 容器，包含裁剪视图层和遮罩层
			$clipView, // 裁剪视图层，包含移动层
			$moveLayer, // 移动层，包含旋转层
			$rotateLayer, // 旋转层
			$view, // 最终截图后呈现的视图容器
			canvas, // 图片裁剪用到的画布
			myScroll, // 图片的scroll对象，包含图片的位置与缩放信息
			containerWidth,
			containerHeight,
			$mask,
			$mask_left,
			$mask_right,
			$mask_top,
			$mask_bottom,
			$clip_area,

			curImgWidth, // 移动层的当前宽度
			curImgHeight,// 移动层的当前高度;
			atClip = !1; 

		init();
		initScroll();
		initEvent();
		initClip();

		var $ok = $(ok);
		if ($ok.length) {
			$ok.click(function() {
				clipImg(1);
			});
		}

		var $win = $(window);
		resize();
		$win.resize(resize);

		if(initImgDataURL){
			createImg(initImgDataURL);
		}
		var atRotation, // 是否正在旋转中
			curX, // 旋转层的当前X坐标
			curY, // 旋转层的当前Y坐标
			curAngle; // 旋转层的当前角度

		function imgLoad() {
			var $toggleOBtn = $(toggleOBtn);
			if(this.naturalWidth < this.naturalHeight && !$toggleOBtn.hasClass('clip-tall')){
				$toggleOBtn.click();
			}else if(this.naturalWidth > this.naturalHeight && $toggleOBtn.hasClass('clip-tall')){
				$toggleOBtn.click();
			}
			imgLoaded = true;

			$rotateLayer.append(this);

			hideAction.call(this, $img, function() {
				curImgWidth = imgWidth = this.naturalWidth;
				curImgHeight = imgHeight = this.naturalHeight;
			});

			hideAction($moveLayer, function() {
				resetScroll();
			});


			loadComplete.call(this, this.src);
		}

		function initScroll() {
			var options = {
				zoom: true,
				scrollX: true,
				scrollY: true,
				freeScroll: true,
				mouseWheel: true,
				wheelAction: "zoom"
			}
			myScroll = new IScroll($clipView[0], options);
		}
		function resetScroll() {
			curX = 0;
			curY = 0;
			curAngle = 0;

			$rotateLayer.css({
				"width": imgWidth,
				"height": imgHeight
			});
			setTransform($rotateLayer, curX, curY, curAngle);
			calculateScale(imgWidth, imgHeight);
			myScroll.zoom(myScroll.options.zoomStart);
			refreshScroll(imgWidth, imgHeight);

			var posX = (clipWidth - imgWidth * myScroll.options.zoomStart) * .5,
				posX = posX>0?0:posX,
				posY = (clipHeight - imgHeight * myScroll.options.zoomStart) * .5,
				posY = posY>0?0:posY;
			myScroll.scrollTo(posX, posY);
		}
		function refreshScroll(width, height) {
			$moveLayer.css({
				"width": width,
				"height": height
			});
			// 在移动设备上，尤其是Android设备，当为一个元素重置了宽高时
			// 该元素的offsetWidth/offsetHeight、clientWidth/clientHeight等属性并不会立即更新，导致相关的js程序出现错误
			// iscroll 在刷新方法中正是使用了 offsetWidth/offsetHeight 来获取scroller元素($moveLayer)的宽高
			// 因此需要手动将元素重新添加进文档，迫使浏览器强制更新元素的宽高
			$clipView.append($moveLayer);
			myScroll.refresh();
		}

		function initEvent() {
			var is_mobile = !!navigator.userAgent.match(/mobile/i),
				$hideBtn = $(hideBtn),
				$rotateBtn = $(rotateBtn),
				$toggleOBtn = $(toggleOBtn),
				$reclipBtn = $(reclipBtn),
				$clipOkBtn = $(clipOkBtn),
				$noclipBtn = $(noclipBtn);
			
			$moveLayer.on("dblclick", function(e) {
				rotateCW();
			});
			if($hideBtn.length){
				$hideBtn.on('click', function(){
					$rotateLayer.find("img").attr("src", "");
					$container.parent().hide();
				});
			}
			if($rotateBtn.length){
				$rotateBtn.on("click", function(e){
					if(!imgLoaded || !$rotateLayer.find("img").attr("src")){
						alert("亲，你还没有选择图片!");
						return;
					}
					rotateCW();
				});
			}
			if($toggleOBtn.length){
				$toggleOBtn.on("click", function(e){
					if (atRotation || atClip) return;
					$(this).toggleClass('clip-tall');
					var temp = clipWidth;
					clipWidth = clipHeight;
					clipHeight = temp;
					curImgWidth = curImgWidth || imgWidth;
					curImgHeight = curImgHeight || imgHeight;
					init();
					calculateScale(curImgWidth, curImgHeight);
					if (myScroll.scale < myScroll.options.zoomMin) {
						myScroll.zoom(myScroll.options.zoomMin);
					}

					refreshScroll(curImgWidth, curImgHeight);
				})
			}
			if($reclipBtn){
				$reclipBtn.on("click", function(){
					$view.hide();
				})
			}
			if($clipOkBtn){
				$clipOkBtn.on("click", function(){
					clipOk($view.find('img').attr("src"));
					$view.hide();
					$container.parent().hide();
				})
				
			}
			if($noclipBtn){
				$noclipBtn.on("click", function(){
					if (!imgLoaded || !$rotateLayer.find("img").attr("src")) {
						alert("亲，你还没有选择图片!");
						return;
					}
					$('.loading').show();
					setTimeout(function(){clipImg();}, 30);
				});
			}
		}
		function rotateCW() {
			rotateBy(90);
		}

		function rotateBy(angle) {/*达到这样的效果：不论是从多少度转到多少度，看起来都像是相对裁切窗口的中心点在旋转。*/
			if (atRotation) return;
			atRotation = true;

			var loacl;
			
			loacl = loaclToLoacl($moveLayer, $clipView, clipWidth * .5, clipHeight * .5);/*变换后，裁切窗口的中心点相对旋转层左上角点的视觉距离*/

			/*
			把旋转层用当前参考点旋转回0度后的左上角点称作旋转层的‘零位’。
			参考点实际上是相对零位的偏移量，上一步得到的还不是参考点。

			每次转动后，图层都有可能有位移（手动或者自动调整），导致裁切区域中心点对应到图片上的点的位置有变化（旋转层的零位也相应会变化），这个点就是图层下一次旋转的参考点。所以每次旋转前都要重新计算参考点的坐标。
			重新计算参考点的同时也就重新找出了旋转层零位的位置，这个位置就是后面计算offsetX、parentOffsetX的基础。
			*/
			var origin = calculateOrigin(curAngle, loacl), 
				originX = origin.x,
				originY = origin.y,

				/*旋转层以当前零位为参考点旋转到新角度后的位置，与以当前计算的参考点为参考点旋转到新角度后的位置，两者的左上角偏移量*/
				offsetX = 0, offsetY = 0,
				/*
				新角度下的旋转层左上角点与当前角度下的旋转层左上角点之间的偏移量
				*/
				parentOffsetX = 0, parentOffsetY = 0,

				newAngle = curAngle + angle;

			if (newAngle == 90 || newAngle == -270)
			{
				offsetX = originX + originY;
				offsetY = originY - originX;

				if (newAngle > curAngle) {
					parentOffsetX = imgHeight - originX - originY;
					parentOffsetY = originX - originY;
				} else if (newAngle < curAngle) {
					parentOffsetX = (imgHeight - originY) - (imgWidth - originX);
					parentOffsetY = originX + originY - imgHeight;
				}

				curImgWidth = imgHeight;
				curImgHeight = imgWidth;
			}
			else if (newAngle == 180 || newAngle == -180)
			{
				offsetX = originX * 2;
				offsetY = originY * 2;

				if (newAngle > curAngle) {
					parentOffsetX = (imgWidth - originX) - (imgHeight - originY);
					parentOffsetY = imgHeight - (originX + originY);
				} else if (newAngle < curAngle) {
					parentOffsetX = imgWidth - (originX + originY);
					parentOffsetY = (imgHeight - originY) - (imgWidth - originX);
				}

				curImgWidth = imgWidth;
				curImgHeight = imgHeight;
			}
			else if (newAngle == 270 || newAngle == -90)
			{
				offsetX = originX - originY;
				offsetY = originX + originY;

				if (newAngle > curAngle) {
					parentOffsetX = originX + originY - imgWidth;
					parentOffsetY = (imgWidth - originX) - (imgHeight - originY);
				} else if (newAngle < curAngle) {
					parentOffsetX = originY - originX;
					parentOffsetY = imgWidth - originX - originY;
				}

				curImgWidth = imgHeight;
				curImgHeight = imgWidth;
			}
			else if (newAngle == 0 || newAngle == 360 || newAngle == -360)
			{
				offsetX = 0;
				offsetY = 0;

				if (newAngle > curAngle) {
					parentOffsetX = originX - originY;
					parentOffsetY = originX + originY - imgWidth;
				} else if (newAngle < curAngle) {
					parentOffsetX = originX + originY - imgHeight;
					parentOffsetY = originY - originX;
				}

				curImgWidth = imgWidth;
				curImgHeight = imgHeight;
			}

			/*
			这里就是在计算以新的参考点把旋转层旋转到当前角度时，为了不让图片看起来没动，需要给旋转层加上的translate数值。
			 上一次旋转结束后，旋转层的translate值的效果是把旋转层移动到了新角度中左上角点与上一个角度中左上角点重合的位置，之所以最终旋转层会出现在是动画结束时的位置，是由于另外加上了移动层的滚动。把参考点从零位改成裁切中心点后，再旋转到当前角度，使用原有的旋转层translate数值并不能把移动层移动到与上一次动画结束时相同的位置，所以需要对translate值做修改*/
			if (curAngle == 0) {
				curX = 0;
				curY = 0;
			} else if (curAngle == 90 || curAngle == -270) {
				curX -= originX + originY;
				curY -= originY - originX;
			} else if (curAngle == 180 || curAngle == -180) {
				curX -= originX * 2;
				curY -= originY * 2;
			} else if (curAngle == 270 || curAngle == -90) {
				curX -= originX - originY;
				curY -= originX + originY;
			}

			curX = curX.toFixed(2) - 0;
			curY = curY.toFixed(2) - 0;

			/*下面两行只是为了控制旋转动画播放速度，其实可以不要*/
			
			setTransform($rotateLayer, curX, curY, curAngle, originX, originY);/*以新的参考点重新设置当前状态*/
			setTransition($rotateLayer, curX, curY, newAngle, 400, function() {/*动画过度到新的状态。当前状态到新的状态之间只有角度变化*/
				atRotation = false;
				curAngle = newAngle % 360;
				/*
					动画播放完之后，要把旋转图层的参考点设置回零位。
					重设参考点的同时要对旋转图层做两件事：
					1.旋转到同样的角度，并移动到与动画结束时相同的位置（改变旋转层的translate值）
					2.由于IScroll插件的原因，只有把新角度下的旋转层的左上角移动到与前一个角度时旋转层左上角重合的位置，移动图层的可视区域才能保持与裁切区域一致。这样就可能不会与动画结束时的位置重合，所以需要多一步处理，用插件的scroll方法把旋转图层在父窗口中滚动到动画结束时的位置（改变移动层的translate值）。
				*/
				curX += offsetX + parentOffsetX;
				curY += offsetY + parentOffsetY;
				curX = curX.toFixed(2) - 0;
				curY = curY.toFixed(2) - 0;
				/*
				以旋转层零位为参考点，从0度开始转到新的角度，并把新角度的旋转层左上角移动到上一个角度时旋转层左上角的位置
				*/
				setTransform($rotateLayer, curX, curY, curAngle);
				
				/*让旋转层在移动层内滚动，滚动到动画结束时的位置，以得到旋转层看上去没有移动只有旋转的效果*/
				myScroll.scrollTo(
					myScroll.x - parentOffsetX * myScroll.scale,
					myScroll.y - parentOffsetY * myScroll.scale
				);
				calculateScale(curImgWidth, curImgHeight);
				if (myScroll.scale < myScroll.options.zoomMin) {
					myScroll.zoom(myScroll.options.zoomMin);
				}

				refreshScroll(curImgWidth, curImgHeight);
			});
		}

		function initClip() {
			canvas = document.createElement("canvas");
			canvas.width = clipWidth;
			canvas.height = clipHeight;
		}
		function clipImg(isShowView) {
			if(atClip) return;
			if (!imgLoaded || !$rotateLayer.find("img").attr("src")) {
				alert("亲，你还没有选择图片!");
				return;
			}
			atClip = !0;
			clipStart();
			var local = loaclToLoacl($moveLayer, $clipView);
			var scale = myScroll.scale;
			var ctx = canvas.getContext("2d");
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.save();
			/*两种方式裁剪出来的内容一样，但压缩画布的方式得到的裁剪图片尺寸都是固定的为裁切区域的尺寸，而另一种方式得到的裁剪图片尺寸就是原图中裁剪区域的原始尺寸*/
			if (strictSize) {
				/*压缩画布的方式*/
				ctx.scale(scale, scale);
			} else {
				/*改变画布宽高的方式*/
				canvas.width = clipWidth / scale;
				canvas.height = clipHeight / scale;
			}
			/*canvas中的2D变换操作方式与css3中完全不一样，比如：
			canvas的默认坐标原点是画布左上角点，而css3中则是图层的中心点，这个会影响到旋转和缩放；
			canvas中translate改变坐标原点是相对上一步的原点位置而言的，css3中所有变换的数值都是绝对值（当然如果加了动画时间控制，表面上看起来也像是相对的）
			*/
			ctx.translate(curX - local.x / scale, curY - local.y / scale);/*坐标原点变换*/
			ctx.rotate(curAngle * Math.PI / 180);

			ctx.drawImage($img[0], 0, 0);
			ctx.restore();
			
			var dataURL;
			if( navigator.userAgent.match(/iphone/i) ) {
				dataURL = canvas.toDataURL(outputType, quality );
			}else{// 修复android 
				var encoder = new JPEGEncoder();
				dataURL = encoder.encode(ctx.getImageData(0,0,canvas.width,canvas.height), quality * 100 );
			}  
			
			if(isShowView === 1){
				$view.find('img').attr('src', dataURL);
				$view.show();
				clipFinish();
			}else{
				clipOk(dataURL, 1);
			}
			
			
			atClip = !1;
		}


		function resize() {
			hideAction($container, function() {
				containerWidth = $container[0].offsetWidth;
				containerHeight = $container[0].offsetHeight;
			});
		}
		function loaclToLoacl($layerOne, $layerTwo, x, y) { // 计算$layerTwo上的x、y坐标在$layerOne上的坐标
			x = x || 0;
			y = y || 0;
			var layerOneOffset, layerTwoOffset;
			/*这个方法实际上没作用*/
			hideAction($layerOne, function() {
				layerOneOffset = $layerOne.offset();
			});
			hideAction($layerTwo, function() {
				layerTwoOffset = $layerTwo.offset();
			});
			return {
				x: layerTwoOffset.left - layerOneOffset.left + x,
				y: layerTwoOffset.top - layerOneOffset.top + y
			};
		}
		function globalToLoacl($layer, x, y) { // 计算相对于窗口的x、y坐标在$layer上的坐标
			x = x || 0;
			y = y || 0;
			var layerOffset;
			hideAction($layer, function() {
				layerOffset = $layer.offset();
			});
			return {
				x: x + $win.scrollLeft() - layerOffset.left,
				y: y + $win.scrollTop() - layerOffset.top
			};
		}
		function hideAction(jq, func) {
			var $hide = $();
			$.each(jq, function(i, n){
				var $n = $(n);
				if (!$n.is(":hidden")) return true;

				var $hidden = $n.parents().andSelf().filter(":hidden");/*在祖先中找出所有是隐藏状态的*/
				var $none;
				for (var i = 0; i < $hidden.length; i++) {
					if (!$n.is(":hidden")) break;/*如果祖先的隐藏状态并没有继承到自身，就不用处理了*/
					$none = $hidden.eq(i);
					if ($none.css("display") == "none") $hide = $hide.add($none.show());
				}
			});
			if (typeof(func) == "function") func.call(this);
			$hide.hide();
			
			//if (typeof(func) == "function") func.call(this);
		}
		function calculateOrigin(curAngle, point) {
			var scale = myScroll.scale;
			var origin = {};
			if (curAngle == 0) {
				origin.x = point.x / scale;
				origin.y = point.y / scale;
			} else if (curAngle == 90 || curAngle == -270) {
				origin.x = point.y / scale;
				origin.y = imgHeight - point.x / scale;
			} else if (curAngle == 180 || curAngle == -180) {
				origin.x = imgWidth - point.x / scale;
				origin.y = imgHeight - point.y / scale;
			} else if (curAngle == 270 || curAngle == -90) {
				origin.x = imgWidth - point.y / scale;
				origin.y = point.x / scale;
			}
			return origin;
		}
		function getScale(w1, h1, w2, h2) {/*取出最小的比例差*/
			var sx = w1 / w2;
			var sy = h1 / h2;
			return sx > sy ? sx : sy;
		}
		/*
			图片尺寸>移动窗口>剪切窗口: 最大放大到原图尺寸，一开始会缩小到有一条边的尺寸与移动窗口一样
			移动窗口>图片尺寸>剪切窗口: 最大放大到原图尺寸，一开始就是原图尺寸
			移动窗口>剪切窗口>图片尺寸：一开始就是放大的，并且不能缩放
		*/
		function calculateScale(width, height) {
			myScroll.options.zoomMin = getScale(clipWidth, clipHeight, width, height);/*剪切窗口与原图的最小比例差*/
			myScroll.options.zoomMax = Math.max(1, myScroll.options.zoomMin);
			//myScroll.options.zoomStart = Math.min(myScroll.options.zoomMax, getScale(containerWidth, containerHeight, width, height));/*移动窗口与原图的最小比例差*/
			myScroll.options.zoomStart = myScroll.options.zoomMin;
		}

		function createImg(src) {
			if ($img &&　$img.length) {
				// 删除旧的图片以释放内存，防止IOS设备的webview崩溃
				$img.remove();
				delete $img[0];
			}
			$img = $("<img>").css({
				"user-select": "none",
				"pointer-events": "none"
			});
			$img.load(imgLoad);
			$img.attr("src", src); // 设置图片base64值
		}

		function setTransform($obj, x, y, angle, originX, originY) {
			originX = originX || 0;
			originY = originY || 0;
			var style = {};
			style[prefix + "transform"] = "translateZ(0) translate(" + x + "px," + y + "px) rotate(" + angle + "deg)";
			style[prefix + "transform-origin"] = originX + "px " + originY + "px";
			$obj.css(style);
		}
		function setTransition($obj, x, y, angle, dur, fn) {
			// 这里需要先读取之前设置好的transform样式，强制浏览器将该样式值渲染到元素
			// 否则浏览器可能出于性能考虑，将暂缓样式渲染，等到之后所有样式设置完成后再统一渲染
			// 这样就会导致之前设置的位移也被应用到动画中
			$obj.css(prefix + "transform");
			$obj.css(prefix + "transition", prefix + "transform " + dur + "ms");
			$obj.one(transitionEnd, function() {
				$obj.css(prefix + "transition", "");
				fn.call(this);
			});
			$obj.css(prefix + "transform", "translateZ(0) translate(" + x + "px," + y + "px) rotate(" + angle + "deg)");
		}

		/*专用于解决iphone拍照时的图片旋转问题*/
		function rotateIphoneImg(img, direction,canvas) {
	        if (img == null)return;  
	        
	        var height = img.height;  
	        var width = img.width; 
	        var step; 
			if(direction == 'right'){
				step = 2;
			}else if(direction == 'left'){
				step = 1;
			}else{
				step = 3;
			}
	        //旋转角度以弧度值为参数  
	        var degree = step * 90 * Math.PI / 180;  
	        var ctx = canvas.getContext('2d');
			var size = imgSizeChange(width, height);
			width = size.width;
			height = size.height;
	        switch (step) {  
	            case 0:  
	                canvas.width = width;  
	                canvas.height = height;  
	                ctx.drawImage(img, 0, 0, width, height);  
	                break;  
	            case 1:  
	                canvas.width = height;  
	                canvas.height = width;
	                //ctx.scale(scale);
					ctx.rotate(degree);  
					ctx.drawImage(img, 0, -height, width, height);
	                //ctx.drawImage(img, 0, -height);  
	                break;  
	            case 2:  
	                canvas.width = width;  
	                canvas.height = height;  
	                ctx.rotate(degree);  
	                ctx.drawImage(img, -width, -height, width, height);  
	                break;  
	            case 3:  
	                canvas.width = height;  
	                canvas.height = width;  
	                ctx.rotate(degree);  
	                ctx.drawImage(img, -width, 0, width, height);  
	                break;  
	        }  
	    }
	    /*用于解决iphone的画布尺寸太大不会渲染的问题*/
	    function imgSizeChange(width, height){
			var expectWidth = width;
			var expectHeight = height;

			if (width > height && width > 800) {
				expectWidth = 800;
				expectHeight = expectWidth * height / width;
			} else if (height > width && height > 1200) {
				expectHeight = 1200;
				expectWidth = expectHeight * width / height;
			}
			return {
				width: expectWidth,
				height: expectHeight
			}
		}

		function init() {
			if($container){/*切换裁切窗口宽高时用到*/
				
				$clipView.css({
					"width": clipWidth,
					"height": clipHeight,
					"margin-left": -clipWidth/2,
					"margin-top": -clipHeight/2
				});

				$mask_left.css({
					"height": clipHeight,
					"margin-right": clipWidth/2,
					"margin-top": -clipHeight/2,
					"margin-bottom": -clipHeight/2
				});
				$mask_right.css({
					"margin-left": clipWidth/2,
					"margin-top": -clipHeight/2,
					"margin-bottom": -clipHeight/2
				});
				$mask_top.css({
					"margin-bottom": clipHeight/2,
				});
				$mask_bottom.css({
					"margin-top": clipHeight/2
				});
				// 截取区域
				$clip_area.css({
					"width": clipWidth,
					"height": clipHeight,
					"margin-left": -clipWidth/2 - 1,
					"margin-top": -clipHeight/2 - 1
				});
				return;
			}
			// 初始化容器
			$container = $(container).css({
				"user-select": "none",
				"overflow": "hidden"
			});
			if ($container.css("position") == "static") $container.css("position", "relative");

			// 创建裁剪视图层
			$clipView = $("<div class='photo-clip-view'>").css({
				"position": "absolute",
				"left": "50%",
				"top": "50%",
				"width": clipWidth,
				"height": clipHeight,
				"margin-left": -clipWidth/2,
				"margin-top": -clipHeight/2
			}).appendTo($container);

			// $img = $("<img>").css({
			// 	"user-select": "none",
			// 	"pointer-events": "none"
			// }).attr("src", initImgDataURL);

			$moveLayer = $("<div class='photo-clip-moveLayer'>").appendTo($clipView);

			$rotateLayer = $("<div class='photo-clip-rotateLayer'>").appendTo($moveLayer).append($img);

			// 创建遮罩
			var $mask = $("<div class='photo-clip-mask'>").css({
				"position": "absolute",
				"left": 0,
				"top": 0,
				"width": "100%",
				"height": "100%",
				"pointer-events": "none"
			}).appendTo($container);
			$mask_left = $("<div class='photo-clip-mask-left'>").css({
				"position": "absolute",
				"left": 0,
				"right": "50%",
				"top": "50%",
				"bottom": "50%",
				"width": "auto",
				"height": clipHeight,
				"margin-right": clipWidth/2,
				"margin-top": -clipHeight/2,
				"margin-bottom": -clipHeight/2,
				"background-color": "rgba(0,0,0,.5)"
			}).appendTo($mask);
			$mask_right = $("<div class='photo-clip-mask-right'>").css({
				"position": "absolute",
				"left": "50%",
				"right": 0,
				"top": "50%",
				"bottom": "50%",
				"margin-left": clipWidth/2,
				"margin-top": -clipHeight/2,
				"margin-bottom": -clipHeight/2,
				"background-color": "rgba(0,0,0,.5)"
			}).appendTo($mask);
			$mask_top = $("<div class='photo-clip-mask-top'>").css({
				"position": "absolute",
				"left": 0,
				"right": 0,
				"top": 0,
				"bottom": "50%",
				"margin-bottom": clipHeight/2,
				"background-color": "rgba(0,0,0,.5)"
			}).appendTo($mask);
			$mask_bottom = $("<div class='photo-clip-mask-bottom'>").css({
				"position": "absolute",
				"left": 0,
				"right": 0,
				"top": "50%",
				"bottom": 0,
				"margin-top": clipHeight/2,
				"background-color": "rgba(0,0,0,.5)"
			}).appendTo($mask);
			// 创建截取区域
			$clip_area = $("<div class='photo-clip-area'>").css({
				"border": "1px dashed #ddd",
				"position": "absolute",
				"left": "50%",
				"top": "50%",
				"width": clipWidth,
				"height": clipHeight,
				"margin-left": -clipWidth/2 - 1,
				"margin-top": -clipHeight/2 - 1
			}).appendTo($mask);

			// 初始化视图容器
			$view = $(view);
			if ($view.length) {
				$view.css({
					"background-color": "#666",
					"background-repeat": "no-repeat",
					"background-position": "center",
					"background-size": "contain"
				});
			}
		}
	}

	var prefix = '',
		transitionEnd;

	(function() {

		var eventPrefix,
			vendors = { Webkit: 'webkit', Moz: '', O: 'o' },
	    	testEl = document.documentElement,
	    	normalizeEvent = function(name) { return eventPrefix ? eventPrefix + name : name.toLowerCase() };

		for (var i in vendors) {
			if (testEl.style[i + 'TransitionProperty'] !== undefined) {
				prefix = '-' + i.toLowerCase() + '-';
				eventPrefix = vendors[i];
				break;
			}
		}

		transitionEnd = normalizeEvent('TransitionEnd');

	})();

	return $;
}));
