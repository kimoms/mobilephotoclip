/*上传图片*/
$('#add_pic').on('change', function(){

	if (!this.files.length) return;
	var files = this.files[0];
	if ( !/image\/\w+/.test(files.type) || !(/jpg/.test(files.type) || /jpeg/.test(files.type) || /gif/.test(files.type) || /png/.test(files.type)) ) {
		alert("图片格式不正确，请选择jpg/png/gif格式的图片文件！");
		return false;
	} else {
		var base64, Orientation;

		/*获取照片的扩展信息*/
		EXIF.getData(files, function() {
			EXIF.getAllTags(this);
			Orientation = EXIF.getTag(this, 'Orientation');
			//alert(Orientation);
		});

		var fileReader = new FileReader();
		fileReader.onprogress = function(e) {
			//console.log((e.loaded / e.total * 100).toFixed() + "%");/*四舍五入到指定小数位的数字*/
		};
		fileReader.onload = function(e) {
			
			var image = new Image();
			image.src = this.result;
			image.onload = function() {
				var size = Component.Tools.imgSizeChange(this.naturalWidth, this.naturalHeight);
				var expectWidth = size.width;
				var expectHeight = size.height;
				
				var canvas = document.createElement("canvas");
				var ctx = canvas.getContext("2d");
				canvas.width = expectWidth;
				canvas.height = expectHeight;

				switch(Orientation){
					case 6:
						//alert('需要顺时针（向右）90度旋转');
						Component.Tools.rotateIphoneImg(this,'left',canvas);
						break;
					case 8:
						//alert('需要逆时针（向左）90度旋转');
						Component.Tools.rotateIphoneImg(this,'turnover',canvas);
						break;
					case 3://需要180度旋转
						//alert('需要180度旋转');
						Component.Tools.rotateIphoneImg(this,'right',canvas);
						break;
					default:
						ctx.drawImage(this, 0, 0, expectWidth, expectHeight); 
				}
				base64 = canvas.toDataURL("image/jpeg", 90);
				$('#up_view img').attr('src', base64);
			}
					
				
			$('#up_view').show();
			$('.loading').hide();
		};
		fileReader.onerror = function(e) {
			alert("图片加载失败");
			loadError.call(this, e);
		};
		fileReader.readAsDataURL(files); // 读取文件内容

		$('.loading').show();
	}
});

/*图片上传窗口中的按钮*/
$('#up_view').delegate('button', 'click', function(event) {
	var button = $(this), dom_id = button.attr('id');
		dataURL = button.parent().parent().find('img').attr('src');
	switch(dom_id){
		case 'noupBtn':
			button.parent().parent().fadeOut();
			break;
		case 'noclipOkBtn':
			Component.Tools.upNoclipPic(dataURL);    
			break;
		case 'goclipBtn':
			Component.Tools.show_pic(dataURL);
			break;
	}
});


var Component = {};
Component.Tools = {
    img_count: 0,
    ajax_handler: function(url, data, callback){
        $.ajax({
            type: 'POST',
            url: url,
            data: data,
            dataType: 'json',
            success: function(res){
                callback(res);
            }
        });
    },
    upNoclipPic: function(dataURL){
        $('.loading').show();
        var url = 'image_upload_url',
            data = {data: dataURL};
        Component.Tools.ajax_handler(url, data, function(data){
            if(data.status == 1){
                Component.Tools.pic_addok(data.data);
                $('.loading').hide();
                $('#up_view').fadeOut();
            }
        }); 
    },
    photo_tool_init: function(dataURL){
        var that = this;
        $("#clipArea").photoClip({
            width: 240,
            height: 180,
            file: "#file",
            view: "#view",
            ok: "#clipBtn",
            hideBtn: "#hideBtn",
            rotateBtn: "#rotateBtn",
            toggleOBtn: "#toggleOBtn",
            reclipBtn: "#reclipBtn",
            clipOkBtn: "#clipOkBtn",
            noclipBtn: "#noclipBtn",
            initImgDataURL: dataURL,
            quality: 0.7,
            loadStart: function() {
                $('.loading').show();
            },
            loadComplete: function() {
                $('.loading').hide();
            },
            clipStart: function(){
                $('.loading').show();
            },
            loadError: function(){
                $('.loading').hide();
            },
            clipFinish: function() {
                $('.loading').hide();
            },
            clipOk: function(dataURL, over){
                $('.loading').show();
                var url = 'image_upload_url',
                    data = {data: dataURL};
                that.ajax_handler(url, data, function(data){
                    if(data.status == 1){
                        that.pic_addok(data.data);
                        if(over === 1){
                            $('.loading').hide();
                        }
                        $('#up_view').hide();
                    }
                });             
            }
        }).attr('data-init', 1);
    },
    imgSizeChange: function (width, height){
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
    },
    rotateIphoneImg: function (img, direction,canvas) {
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
        var size = this.imgSizeChange(width, height);
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
    },
    show_pic: function(dataURL){

        $('.loading').show();
        if(!$("#clipArea").attr('data-init')){
            Component.Tools.photo_tool_init(dataURL);
        }else{
            $('.photo-clip-rotateLayer img').attr("src", dataURL);
        }
        
        $('.photoClip').show();
        
        $('.loading').fadeOut(0, function(){});
    },
    pic_addok: function(url){
    	var imgItem = $("<div>").addClass('imgUpArea').attr('data-url', url);
		imgItem.append($('<span>')).append($('<img>').attr('src', url));
		$('#tpal').append(imgItem);
		$('.photoClip').hide();
		$('.loading').hide();
		imgCount++;

    	$('.loading').fadeOut();
    },

};