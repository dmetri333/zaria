/*
    Zaria - a simple web-based rich text editor
*/
var Zaria = (function(id, options) {
	var defaults = {
		layout: '<div class="zariaToolbar">[bold][italic][underline]</div>[edit-area]',
		buttons: [
			{name:'bold', label:'Bold', cmd:'bold', className:'bold'},
			{name:'italic', label:'Italic', cmd:'italic', className:'italic'},
			{name:'underline', label:'Underline', cmd:'underline', className:'underline'}
		]
	};

	function build() {
		if (document.designMode) {
			var textarea = getEl(this.id),
			width = textarea.style.width,
			height = textarea.style.height,
			content = textarea.value,
			className = textarea.className,
			toolbar, i, j, button, buttonClass,
			iframe, wrapperDiv, doc;
			
			this.mode = 'html';
			textarea.style.display = 'none';
			
			toolbar = this.options.layout;
			for (i in this.options.buttons) {
				button = '';
				buttonClass = this.options.buttons[i].className || '';
				if (this.options.buttons[i].menu) {
					button = '<select name="'+this.frameId+'" id="'+this.frameId+'-'+this.options.buttons[i].name+'" class="'+buttonClass+'" ><option>Select '+this.options.buttons[i].label+'</option>';
					for(j in this.options.buttons[i].menu) { button += '<option value="'+this.options.buttons[i].menu[j].value+'">'+this.options.buttons[i].menu[j].label+'</option>'; }
					button += '</select>';
				} else {
					button = '<a name="'+this.frameId+'" id="'+this.frameId+'-'+this.options.buttons[i].name+'" class="'+buttonClass+'" width="20" height="20" alt="'+this.options.buttons[i].label+'" title="'+this.options.buttons[i].label+'" href="javascript:void(0);" ></a>';
				}
				toolbar = toolbar.replace("["+this.options.buttons[i].name+"]", button);
			}
			iframe = '<iframe id="'+this.frameId+'" width="'+width+'" height="'+height+'" style="width:'+width+'; height:'+height+'; border-width: thin;" class="'+className+'" frameborder="1"></iframe>';
			toolbar = toolbar.replace("[edit-area]", iframe);
			
			wrapperDiv = document.createElement('div');
			wrapperDiv.innerHTML = toolbar;
			insertAfter(wrapperDiv, textarea);
			initButtons.call(this, this.frameId);
			
			var cssOverride = (this.options.cssOverride) ? '<link rel="stylesheet" type="text/css" href="'+this.options.cssOverride+'" />' : '';
			
			doc = getIFrameDocument(this.frameId);
			
			// Write the textarea's content into the iframe
			doc.open();
			doc.write('<html><head>'+cssOverride+'</head><body>'+content+'</body></html>');
			doc.close();
			
			// Make the iframe editable
			doc.body.contentEditable = true;
			doc.designMode = 'on';
			
			this.ea = window[this.frameId] || getEl(this.frameId).contentWindow;
		}
	}
	
	function getContents() {
		if (document.designMode) {
			// Explorer reformats HTML during document.write() removing quotes on element ID names
			// so we need to address Explorer elements as window[elementID]
			if (window[this.frameId]) {
				return window[this.frameId].document.body.innerHTML;
			}
			return getEl(this.frameId).contentWindow.document.body.innerHTML;
		} else {
			// return the value from the <textarea> if document.designMode does not exist
			return getEl(this.id).value;
		}
	}

	function syncContent() {
		var content = '';
		
		if (this.mode == 'text') {
			var iframe = getIFrameDocument(this.frameId);
			if (document.all) {
				var output = escape(iframe.body.innerText);
				output = output.replace("%3CP%3E%0D%0A%3CHR%3E", "%3CHR%3E");
				output = output.replace("%3CHR%3E%0D%0A%3C/P%3E", "%3CHR%3E");
				content = unescape(output);
			} else {
				var htmlSrc = iframe.body.ownerDocument.createRange();
				htmlSrc.selectNodeContents(iframe.body);
				content = htmlSrc.toString();
			}
		} else {
			content = getContents.call(this);
		}
		if (typeof(HTMLtoXML) != 'undefined') {
			content = HTMLtoXML(content);
		}
		getEl(this.id).value = content;
	}

	function initButtons(id) {
		var self = this, i, currentElement;
		for (i in this.options.buttons) {
			currentElement = getEl(id+'-'+this.options.buttons[i].name);
			if (currentElement && currentElement.name == id) {
				currentElement.onmouseup = 'return false;';
				if (this.options.buttons[i].menu) {
					currentElement.onchange = (function(element, buttonIndex) { return function() { selectOnChange.call(self, element, self.options.buttons[buttonIndex]); }; })(currentElement,i);
				} else if (this.options.buttons[i].prompt) {
					currentElement.onclick = (function(buttonIndex) { return function() { inputPrompt.call(self, self.options.buttons[buttonIndex]); }; })(i);
				} else if (this.options.buttons[i].toggleMode) {
					currentElement.onclick = (function(element) { return function() { toggleMode.call(self, element); }; })(currentElement);
				} else if (this.options.buttons[i].dialog) {
					currentElement.onclick = (function(element, buttonIndex) { return function() { openDialog.call(self, element, self.options.buttons[buttonIndex]); }; })(currentElement,i);
				} else if (this.options.buttons[i].custom) {
					currentElement.onclick = this.options.buttons[i].custom;
				} else {
					currentElement.onclick = (function(buttonIndex) { return function() { buttonOnClick.call(self, self.options.buttons[buttonIndex]); }; })(i);
				}
			}
		}
	}

	function execCommand(aCommandName, aShowDefaultUI, aValueArgument) {
		this.ea.focus();
		this.ea.document.execCommand(aCommandName, aShowDefaultUI, aValueArgument);
		this.ea.focus();
	}
	
	function buttonOnClick(button) {
		execCommand.call(this, button.cmd, false, null);
	}

	function selectOnChange(element, button) {
		var cursel = element.selectedIndex;
		if (cursel !== 0) execCommand.call(this, button.cmd, false, element.options[cursel].value);
	}

	function inputPrompt(button) {
		var value = prompt(button.prompt, "");
		if (value) execCommand.call(this, button.cmd, false, value);
	}

	function toggleMode(element) {
		var iframe = getIFrameDocument(this.frameId), i;
		if (this.mode == 'html') {
			for (i in this.options.buttons) { currentElement = getEl(this.frameId+'-'+this.options.buttons[i].name); if(currentElement != element) {currentElement.style.display = 'none';} }
			if (document.all) {
				iframe.body.innerText = iframe.body.innerHTML;
			} else {
				var htmlSrc = iframe.createTextNode(iframe.body.innerHTML);
				iframe.body.innerHTML = "";
				iframe.body.appendChild(htmlSrc);
			}
			this.mode = 'text';
		} else {
			for (i in this.options.buttons) { currentElement = getEl(this.frameId+'-'+this.options.buttons[i].name); if(currentElement != element) {currentElement.style.display = '';} }
			if (document.all) {
				var output = escape(iframe.body.innerText);
				output = output.replace("%3CP%3E%0D%0A%3CHR%3E", "%3CHR%3E");
				output = output.replace("%3CHR%3E%0D%0A%3C/P%3E", "%3CHR%3E");
				iframe.body.innerHTML = unescape(output);
			} else {
				var htmlSrc = iframe.body.ownerDocument.createRange();
				htmlSrc.selectNodeContents(iframe.body);
				iframe.body.innerHTML = htmlSrc.toString();
			}
			this.mode = 'html';
		}
	}

	function closeDialog() {
		var body = document.getElementsByTagName('body')[0];
		var dialog = getEl(this.dialogId);
		if (dialog) body.removeChild(dialog);
	}
	
	function openDialog(element, button) {
		var body = document.getElementsByTagName('body')[0];
		var dialog = getEl(this.dialogId);
		var currectClass = (dialog) ? dialog.className : '';
		var newClass = this.dialogId+'-'+button.name;
		
		if (dialog) body.removeChild(dialog);
		
		if (newClass != currectClass) {
			var frame = getEl(this.frameId), pos, left, top;
			if (button.dialog.position && button.dialog.position == 'button') {
				pos = findPos(element);
				left = pos[0];
				top = pos[1]+element.clientHeight;
			} else {
				pos = findPos(frame);
				left = (pos[0]+(frame.clientWidth/2))-(parseInt(button.dialog.width)/2);
				left = left < 0 ? pos[0] : left; 
				top = pos[1];	
			}
			
			var dialogFrame = document.createElement('iframe');
			dialogFrame.setAttribute('id', this.dialogId);
			dialogFrame.setAttribute('class', newClass);
			dialogFrame.setAttribute('width', button.dialog.width);
			dialogFrame.setAttribute('height', button.dialog.height);
			dialogFrame.setAttribute('frameborder', 0);
			dialogFrame.setAttribute('style', 'position: absolute; top: '+top+'px; left: '+left+'px; width:'+button.dialog.width+'; height:'+button.dialog.height+'; border: solid 1px #CCC;');
			dialogFrame.setAttribute('src', button.dialog.src);
			
			body.appendChild(dialogFrame);
			
			document.zariaDialog = this;
		}
	}
	
	function getIFrameDocument(id) {
		// if contentDocument exists, W3C compliant (Mozilla)
		if (getEl(id).contentDocument) {
			return getEl(id).contentDocument;
		} else { // IE
			return document.frames[id].document;
		}
	}

	function getEl(id) {
		return document.getElementById(id);
	}

	function insertAfter(newElement, targetElement) {
		var parent = targetElement.parentNode;
		if (parent.lastchild == targetElement) {
			parent.appendChild(newElement);
		} else {
			parent.insertBefore(newElement, targetElement.nextSibling);
		}
	}
	
	function findPos(element) {
		var curleft = curtop = 0;
		if (element.offsetParent) {
			do {
				curleft += element.offsetLeft;
				curtop += element.offsetTop;
			} while (element = element.offsetParent);
			return [curleft,curtop];
		}
	}
	
	return function(id, options) {
		this.id = id;
		this.prefix = 'zaria-';
		this.frameId = this.prefix + this.id;
		this.dialogId = this.prefix + 'dialog-' + this.id;
		this.options = options || defaults;
		this.ea = null;
		this.mode = null;
		this.syncContent = syncContent;
		this.closeDialog = closeDialog;
		this.execCommand = execCommand;
		build.call(this);
	};
	
})();