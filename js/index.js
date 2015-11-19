$(function() {
	var pe_wrapper = $('#pe_wrapper');
	var previewPic = $('#pe_previewPic');
	var canvas = $('#pe_canvas');
	
	var isFileSaverSupported = true;
	var isIOSChrome = false;
	var is_ie = false;
	var is_ios = false;
	var isTouch = false;
	var canvasW = 0;
	var canvasH = 0;
	var previewPicW = 0;
	var previewPicH = 0;
	
	var ctx = null;
	var img = null;
	var dir = 0;

	function onResize(evt) {
		canvasW = canvasH = Math.min(960, Math.min($(window).width(), $(window).height()-80));
		pe_wrapper.width(canvasW).height(canvasH)
		if (ctx) {
			ctx.setWidth(canvasW);
			ctx.setHeight(canvasH);
		}
		if (img) {
			previewPic.attr('width', '').attr('height', '');
			initImage()
			ctx.clear();
			drawCase()
		}
	}
	
	$(window).on('resize', function(evt) {
		onResize(evt)
	});
	
	function isCanvasSupported(){
		var elem = document.createElement('canvas');
		return !!(elem.getContext && elem.getContext('2d'));
	}
	
	function showNotSupport() {
		$('#canvasNotSupport').show();
		$('#btn_browseImgHolder, #btn_browse').hide();
		onResize();
		pe_wrapper.show();
	}
	
	function clearPreview() {
		previewPic.attr('src', '').attr('width', '').attr('height', '');
		ctx.clear();
		$('#btn_download, #help, #hkgcWhite').hide();
		img = null;
		dir = 0;
	}
	
	function previewImage() {
		$('#btn_browseImgHolder, #btn_browse').hide();
		pe_wrapper.addClass('picLoading');
		var oFReader = new FileReader();
		var fileSize = $k('btn_browse').files[0].size;
		oFReader.readAsDataURL($k('btn_browse').files[0]);
		clearPreview()
		
		oFReader.onload = function (oFREvent) {
			var filename = oFREvent.target.result.toLowerCase();
			if (filename.indexOf('image/')>0) {
				var image = new Image();
				image.onload = function() {
					EXIF.getData(this, function() {
							var ori = EXIF.getTag(this, "Orientation");
							switch(ori) {
								case 3:
									dir = 2;
									break;
								case 8:
									dir = -1;
									break;
								case 6:
								case 7:
									dir = 1;
									break;
							}
						initImage();
						pe_wrapper.removeClass('picLoading')
					});
				}
				image.src = oFREvent.target.result;
				previewPic.on('error', function() {
					$(this).off('error');
					imageLoadError()
				});
				
				previewPic.attr('src', oFREvent.target.result);
				
			} else {
				imageLoadError();
			}
		};
	}
	
	function imageLoadError() {
		$('#btn_browseImgHolder, #btn_browse').show();
		pe_wrapper.removeClass('picLoading');
	}
	
	function initImage() {
		var scale;
		previewPic.css({height:'auto',width:'auto'});
		if (is_ios && (dir==1 || dir == -1)) {
			previewPicH = previewPic.width();
			previewPicW = previewPic.height();
		} else {
			previewPicW = previewPic.width();
			previewPicH = previewPic.height();
		}
		scale = Math.max(canvasW/previewPicW, canvasH/previewPicH);
		
		previewPicW = Math.round(previewPicW*scale);
		previewPicH = Math.round(previewPicH*scale);
		previewPic.attr('width', previewPicW);
		previewPic.attr('height', previewPicH);

		drawCase();
		if (dir != 0) {
			doImageRotate();
		}
	}
	
	function drawCase() {
		$('.canvas-container').show();
		var imgY = (canvasH-previewPicH)/2;
		img = new fabric.Image($k('pe_previewPic'), {
			width:previewPicW,
			height:previewPicH,
			left:(canvasW-previewPicW)/2,
			top:imgY,
			selectable: true,
			hasControls: !isTouch,
			hasBorders: !isTouch,
			borderColor: 'red',
			cornerColor: 'green',
			cornerSize: 6,
			transparentCorners: false,
		});
		ctx.add(img);
		/*var hkgcWhite = new fabric.Image($k('hkgcWhite'), {
			width:canvasW,
			height:canvasH,
			left:0,
			top:0,
			selectable: false,
		});
		ctx.add(hkgcWhite);*/
		$('#btn_download, #help, #hkgcWhite').show();
		ctx.renderAll();
	}
	
	function deSelect(doRender) {
		ctx.deactivateAll()
		if (doRender) ctx.renderAll();
	}
	
	function doImageRotate() {
		deSelect(true);
		if (dir != 0) {
			var curAng = img.getAngle()+90*dir;
			img.setAngle(curAng); 
		} else {
			img.setAngle(0);
		}
		ctx.renderAll();
	}
	
	function genImage() {
		ctx.deactivateAll()
		ctx.renderAll();
		var newCanvas = document.createElement('canvas');
		var newW = 960
		newCanvas.width = newW;
		newCanvas.height = newW;
		var newCtx = newCanvas.getContext('2d');
		newCtx.rect(0,0,newW,newW);
		newCtx.fillStyle="black";
		newCtx.fill();
		newCtx.drawImage($k('pe_canvas'), 0, 0, newW, newW);
		newCtx.drawImage($k('hkgcWhite'), 0, 0, newW, newW);

		if (isFileSaverSupported && isIOSChrome) {
			newCanvas.toBlob(function(blob) {
			    saveAs(blob, "HKGingChow.png");
			});
		} else {
			var str = '<img src="'+newCanvas.toDataURL("image/png")+'" width="100%"><div style="text-align:center;margin-top:10px;color:#000">';
			if (isTouch) {
				str += 'Long press the image to save';
			} else {
				str += 'Right click to save';
			}
			str += '</div>';
			$('#form1').html(str)
		}
	}
	
	function init() {
		if (!isCanvasSupported()) {
			showNotSupport();
			return;
		}
		try {
			var ofr = new FileReader()
		} catch (error) {
			showNotSupport();
			return;
		}
		try {
			var blob = new Blob;
		} catch (e) {
			isFileSaverSupported = false;
		}
		var ua = navigator.userAgent
		if (ua.match(/iP(hone|od|ad)/i)) {
			is_ios = true;
		}
		if (ua.match(/FB/)) {
			$('#inApp').show();
		}
		if (ua.match(/Trident\/7\./)) {
			is_ie = true;
			$('#btn_browseImgHolder').hide()
			$('#btn_browse').css({opacity:1,width:'auto',height:'20px'}).addClass('absolute alignCenter valignCenter')
		}
		if(ua.match('crios')) {
			isIOSChrome = true;
		}
		if ('ontouchstart' in document.documentElement) {
			isTouch = true;
		}
		
		ctx = new fabric.Canvas('pe_canvas', {selection:false,allowTouchScrolling:false});
		onResize();
		pe_wrapper.show();
		$('.canvas-container').hide();
		$('#btn_browse').on('change', previewImage);
		$('#btn_download').on('click', genImage);
	}
	init()
});
function $k(mc) {
	return document.getElementById(mc);
}